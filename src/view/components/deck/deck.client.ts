import htmx from "htmx.org";
import {
  currentPlaybackRate,
  playOne,
  setPlaybackRate,
  stopAudio,
} from "../../helper/audio-player.client";
import { formatPlaybackRate, parsePlaybackRate } from "../../helper/playback-rate";

type Dir = "prev" | "next";

const closest = (target: EventTarget | null, selector: string) =>
  target instanceof Element ? target.closest<HTMLElement>(selector) : null;

const card = () => document.getElementById("card");
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
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
    if (!c.classList.contains("flipped")) {
      await Promise.all([sleep(frontMs), withAudio && playQueue(frontAudios(c), my)]);
      if (my !== gen) return;
      flip(true);
    }
    await Promise.all([sleep(backMs), withAudio && playQueue(backAudios(c), my)]);
    if (my !== gen) return;
    go("next");
  };

  const setPlaying = (value: boolean) => {
    playing = value;
    if (toggleBtn) toggleBtn.textContent = playing ? "⏸ 一時停止" : "▶ 再生";
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
    if (c) sessionStorage.setItem(progressKey(currentFilter(c)), c.dataset.index ?? "0");
  };
  const savedIndex = (filter: string, total: number) => {
    const index = Number(sessionStorage.getItem(progressKey(filter)));
    return Number.isInteger(index) && index > 0 && index < total ? index : null;
  };

  const dialog = document.getElementById("start-dialog") as HTMLDialogElement | null;
  if (dialog) {
    const rows = [...dialog.querySelectorAll<HTMLElement>("section[data-filter]")];
    let canResume = false;
    for (const row of rows) {
      const total = Number(row.dataset.total);
      const index = savedIndex(row.dataset.filter ?? "all", total);
      const resume = row.querySelector<HTMLButtonElement>('[data-start="resume"]');
      if (index === null || !resume) continue;
      resume.hidden = false;
      resume.dataset.index = String(index);
      resume.textContent = `続きから（${index + 1} / ${total}）`;
      canResume = true;
    }
    if (rows.length > 1 || canResume) dialog.showModal();

    dialog.addEventListener("click", (e) => {
      const button = closest(e.target, "[data-start]");
      const row = closest(e.target, "section[data-filter]");
      if (!button || !row?.dataset.urlTemplate) return;
      dialog.close();
      const index = button.dataset.start === "resume" ? Number(button.dataset.index) : 0;
      const c = card();
      if (c && currentFilter(c) === row.dataset.filter && Number(c.dataset.index) === index) {
        setPlaying(true);
        return;
      }
      playing = true;
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
    const position = String(Number(c.dataset.index) + 1);
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
    const index = Number(c.dataset.index);
    const total = Number(c.dataset.total);
    loadCard(dir === "next" ? (index + 1) % total : (index - 1 + total) % total, dir);
  };

  for (const button of document.querySelectorAll<HTMLElement>("[data-nav-button]")) {
    button.addEventListener("click", () =>
      go(button.dataset.navButton === "prev" ? "prev" : "next"),
    );
  }

  const jumpTo = (position: number) => {
    const c = card();
    if (!c || !Number.isFinite(position)) return syncPosition();
    const current = Number(c.dataset.index);
    const index = Math.min(Math.max(Math.round(position), 1), Number(c.dataset.total)) - 1;
    if (index === current) return syncPosition();
    loadCard(index, index > current ? "next" : "prev");
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

  document.body.addEventListener("htmx:afterSettle", (e) => {
    if (e.target !== deck) return;
    syncPosition();
    saveProgress();
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
