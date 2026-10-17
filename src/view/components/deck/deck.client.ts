import htmx from "htmx.org";
import {
  currentPlaybackRate,
  playOne,
  setPlaybackRate,
  stopAudio,
} from "../../helper/audio-player.client";
import { formatPlaybackRate, parsePlaybackRate } from "../../helper/playback-rate";
import {
  type PlayOrder,
  PlayOrderLabels,
  PlayOrders,
  parsePlayOrder,
} from "../../helper/play-order";
import { clamp, range, reverse, shuffle } from "remeda";
import { z } from "zod/mini";

type Dir = "prev" | "next";

const closest = (target: EventTarget | null, selector: string) =>
  target instanceof Element ? target.closest<HTMLElement>(selector) : null;

const card = () => document.getElementById("card");
const wordAudio = (c: HTMLElement) => (c.dataset.audio ? [c.dataset.audio] : []);
const exampleAudios = (c: HTMLElement) =>
  [...c.querySelectorAll<HTMLElement>(".example[data-audio]")].flatMap(
    (el) => el.dataset.audio ?? [],
  );

const flip = (force?: boolean) => {
  card()?.classList.toggle("flipped", force);
};

const currentFilter = (c: HTMLElement) =>
  c.dataset.urlTemplate?.includes("only=favorites") ? "favorites" : "all";

let wakeLock: WakeLockSentinel | null = null;
const keepScreenOn = async (on: boolean) => {
  if (!on) {
    await wakeLock?.release();
    wakeLock = null;
    return;
  }
  if (wakeLock || !("wakeLock" in navigator) || document.visibilityState !== "visible") return;
  wakeLock = await navigator.wakeLock.request("screen").catch(() => null);
  wakeLock?.addEventListener("release", () => {
    wakeLock = null;
  });
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const PlayOrderStorageKey = "playDirection";

const preloaded: HTMLAudioElement[] = [];
const preloadAudio = (src: string) => {
  if (preloaded.some((audio) => audio.src.endsWith(src))) return;
  const audio = new Audio();
  audio.preload = "auto";
  audio.src = src;
  preloaded.push(audio);
  if (preloaded.length > 8) preloaded.shift();
};

const preloadCard = async (url: string) => {
  const res = await fetch(url).catch(() => null);
  if (!res?.ok) return;
  const doc = new DOMParser().parseFromString(await res.text(), "text/html");
  for (const el of doc.querySelectorAll<HTMLElement>("#card[data-audio], .example[data-audio]")) {
    if (el.dataset.audio) preloadAudio(el.dataset.audio);
  }
  for (const img of doc.querySelectorAll("img[src]")) {
    new Image().src = img.getAttribute("src") ?? "";
  }
};

const buildSequence = (order: PlayOrder, total: number) =>
  order === "reverse"
    ? reverse(range(0, total))
    : order === "random"
      ? shuffle(range(0, total))
      : range(0, total);

const ProgressSchema = z.object({
  order: z.enum(PlayOrders),
  step: z.int().check(z.positive()),
  sequence: z.array(z.int().check(z.nonnegative())),
});
type Progress = z.infer<typeof ProgressSchema>;

const parseProgress = (value: string | null, total: number): Progress | null => {
  try {
    const result = ProgressSchema.safeParse(JSON.parse(value ?? ""));
    if (!result.success) return null;
    const { step, sequence } = result.data;
    return step < total && sequence.length === total && sequence.every((i) => i < total)
      ? result.data
      : null;
  } catch {
    return null;
  }
};

const setupDeck = (deck: HTMLElement) => {
  const frontMs = Number(deck.dataset.frontMs);
  const backMs = Number(deck.dataset.backMs);
  const examplesOnFront = deck.dataset.examplesOnFront === "true";
  const frontAudios = (c: HTMLElement) =>
    examplesOnFront ? [...wordAudio(c), ...exampleAudios(c)] : wordAudio(c);
  const backAudios = (c: HTMLElement) => (examplesOnFront ? [] : exampleAudios(c));
  const toggleBtn = document.getElementById("toggle-play");
  const autoAudio = document.getElementById("auto-audio") as HTMLInputElement | null;
  let playing = false;
  let gen = 0;

  const autoAudioOn = () => autoAudio?.checked ?? false;

  let order = parsePlayOrder(localStorage.getItem(PlayOrderStorageKey));
  let sequence: number[] = [];
  let step = 0;

  const alignSequence = (c: HTMLElement) => {
    const total = Number(c.dataset.total);
    const index = Number(c.dataset.index);
    if (sequence.length !== total) {
      sequence = buildSequence(order, total);
      if (order === "random") sequence = [index, ...sequence.filter((i) => i !== index)];
    }
    if (sequence[step] !== index) step = Math.max(sequence.indexOf(index), 0);
  };

  const rateSelect = document.getElementById("playback-rate") as HTMLSelectElement | null;
  if (rateSelect) {
    rateSelect.value = formatPlaybackRate(currentPlaybackRate());
    rateSelect.addEventListener("change", () =>
      setPlaybackRate(parsePlaybackRate(rateSelect.value)),
    );
  }

  const playQueue = async (srcs: string[], my: number) => {
    for (const src of srcs) {
      if (my !== gen) return;
      await playOne(src);
    }
  };

  const stop = () => {
    gen++;
    stopAudio();
  };

  const run = async () => {
    stop();
    const my = gen;
    const c = card();
    if (!playing || !c) return;
    const withAudio = autoAudioOn();
    const hold = async (srcs: string[], minMs: number) => {
      const started = performance.now();
      if (withAudio) await playQueue(srcs, my);
      if (my !== gen) return;
      const rest = minMs - (performance.now() - started);
      if (rest > 0) await wait(rest);
    };
    if (!c.classList.contains("flipped")) {
      await hold(frontAudios(c), frontMs);
      if (my !== gen) return;
      flip(true);
    }
    await hold(backAudios(c), backMs);
    if (my !== gen) return;
    advance();
  };

  const setPlaying = (value: boolean) => {
    playing = value;
    if (toggleBtn) toggleBtn.textContent = playing ? "⏸ 一時停止" : "▶ 再生";
    keepScreenOn(playing);
    if (playing) run();
    else stop();
  };

  const playCurrentFace = () => {
    stop();
    const c = card();
    if (!c || !autoAudioOn()) return;
    playQueue(c.classList.contains("flipped") ? backAudios(c) : frontAudios(c), gen);
  };

  const toggleFlip = () => {
    flip();
    if (playing) run();
    else playCurrentFace();
  };

  toggleBtn?.addEventListener("click", () => setPlaying(!playing));

  const progressKey = (filter: string) => `card-progress:${deck.dataset.groupId}:${filter}`;
  const saveProgress = () => {
    const c = card();
    if (!c) return;
    const progress: Progress = { order, step, sequence };
    localStorage.setItem(progressKey(currentFilter(c)), JSON.stringify(progress));
  };
  const savedProgress = (filter: string, total: number) =>
    parseProgress(localStorage.getItem(progressKey(filter)), total);

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") keepScreenOn(playing);
  });

  const dialog = document.getElementById("start-dialog") as HTMLDialogElement | null;
  if (dialog) {
    const rows = [...dialog.querySelectorAll<HTMLElement>("section[data-filter]")];
    for (const row of rows) {
      const total = Number(row.dataset.total);
      const progress = savedProgress(row.dataset.filter ?? "all", total);
      const resume = row.querySelector<HTMLButtonElement>('[data-start="resume"]');
      if (!progress || !resume) continue;
      resume.hidden = false;
      resume.textContent = `続きから（${PlayOrderLabels[progress.order]} ${progress.step + 1} / ${total}）`;
    }
    const orderInput = dialog.querySelector<HTMLInputElement>(
      `input[name="play-order"][value="${order}"]`,
    );
    if (orderInput) orderInput.checked = true;
    dialog.showModal();

    dialog.addEventListener("click", (e) => {
      const button = closest(e.target, "[data-start]");
      const row = closest(e.target, "section[data-filter]");
      if (!button || !row?.dataset.urlTemplate) return;
      dialog.close();
      const total = Number(row.dataset.total);
      const progress =
        button.dataset.start === "resume"
          ? savedProgress(row.dataset.filter ?? "all", total)
          : null;
      if (progress) {
        ({ order, step, sequence } = progress);
      } else {
        order = parsePlayOrder(
          dialog.querySelector<HTMLInputElement>('input[name="play-order"]:checked')?.value,
        );
        sequence = buildSequence(order, total);
        step = 0;
      }
      localStorage.setItem(PlayOrderStorageKey, order);
      const index = sequence[step] ?? 0;
      const c = card();
      if (c && currentFilter(c) === row.dataset.filter && Number(c.dataset.index) === index) {
        syncPosition();
        saveProgress();
        setPlaying(true);
        return;
      }
      playing = true;
      keepScreenOn(true);
      if (toggleBtn) toggleBtn.textContent = "⏸ 一時停止";
      htmx.ajax("get", row.dataset.urlTemplate.replace("{index}", String(index)), {
        target: deck,
        swap: "innerHTML",
      });
    });
  }

  const positionRange = document.getElementById("card-position") as HTMLInputElement | null;
  const positionInput = document.getElementById("card-position-input") as HTMLInputElement | null;
  const positionTotal = document.getElementById("card-position-total");
  let draggingRange = false;

  const syncPosition = () => {
    const c = card();
    if (!c) return;
    alignSequence(c);
    const position = String(step + 1);
    const total = String(c.dataset.total);
    if (positionRange) {
      positionRange.max = total;
      if (!draggingRange) positionRange.value = position;
    }
    if (positionInput) {
      positionInput.max = total;
      if (document.activeElement !== positionInput) positionInput.value = position;
    }
    if (positionTotal) positionTotal.textContent = `/ ${total}`;
  };

  const loadCard = (index: number, dir: Dir) => {
    const template = card()?.dataset.urlTemplate;
    if (!template) return;
    deck.dataset.dir = dir;
    htmx.ajax("get", template.replace("{index}", String(index)), {
      target: deck,
      swap: "innerHTML swap:250ms",
    });
  };

  const go = (dir: Dir) => {
    const c = card();
    if (!c) return;
    alignSequence(c);
    const total = sequence.length;
    if (dir === "next" && step === total - 1 && order === "random") {
      const last = sequence[step];
      sequence = shuffle(range(0, total));
      if (total > 1 && sequence[0] === last) sequence.push(sequence.shift() ?? 0);
      step = 0;
    } else {
      step = dir === "next" ? (step + 1) % total : (step - 1 + total) % total;
    }
    loadCard(sequence[step] ?? 0, dir);
  };

  const advance = () => go("next");

  const preloadNext = () => {
    const template = card()?.dataset.urlTemplate;
    if (!template || sequence.length < 2 || step === sequence.length - 1) return;
    preloadCard(template.replace("{index}", String(sequence[step + 1])));
  };

  for (const button of document.querySelectorAll<HTMLElement>("[data-nav-button]")) {
    button.addEventListener("click", () =>
      go(button.dataset.navButton === "prev" ? "prev" : "next"),
    );
  }

  const jumpTo = (position: number) => {
    const c = card();
    if (!c || !Number.isFinite(position)) return syncPosition();
    alignSequence(c);
    const target = clamp(Math.round(position), { min: 1, max: sequence.length }) - 1;
    if (target === step) return syncPosition();
    const dir = target > step ? "next" : "prev";
    step = target;
    loadCard(sequence[step] ?? 0, dir);
  };

  positionRange?.addEventListener("input", () => {
    draggingRange = true;
    if (positionInput) positionInput.value = positionRange.value;
  });
  positionRange?.addEventListener("change", () => {
    draggingRange = false;
    jumpTo(Number(positionRange.value));
  });
  positionInput?.addEventListener("change", () => {
    positionInput.blur();
    jumpTo(Number(positionInput.value));
  });
  syncPosition();
  preloadNext();

  document.body.addEventListener("htmx:afterSettle", (e) => {
    if (e.target !== deck) return;
    syncPosition();
    saveProgress();
    preloadNext();
    if (playing) run();
    else playCurrentFace();
  });

  let startX: number | null = null;
  deck.addEventListener("pointerdown", (e) => {
    if (closest(e.target, "button, a")) return;
    startX = e.clientX;
  });
  deck.addEventListener("pointerup", (e) => {
    if (startX === null) return;
    const dx = e.clientX - startX;
    startX = null;
    if (Math.abs(dx) > 50) go(dx < 0 ? "next" : "prev");
    else if (Math.abs(dx) < 10) toggleFlip();
  });

  document.addEventListener("keydown", (e) => {
    if (dialog?.open) return;
    if (closest(e.target, "input, select, textarea")) return;
    if (closest(e.target, "button, a") && (e.key === " " || e.key === "Enter")) return;
    if (e.key === "ArrowRight") go("next");
    else if (e.key === "ArrowLeft") go("prev");
    else if (e.key === " ") {
      e.preventDefault();
      setPlaying(!playing);
    } else if (e.key === "Enter") toggleFlip();
  });
};

const deck = document.getElementById("deck");
if (deck) setupDeck(deck);
