import htmx from "htmx.org";
import {
  currentPlaybackRate,
  playOne,
  setPlaybackRate,
  stopAudio,
} from "../../helper/audio-player.client";
import { formatPlaybackRate, parsePlaybackRate } from "../../helper/playback-rate";
import {
  buildSequence,
  PlayOrderStorageKey,
  loadProgress,
  storeProgress,
} from "../../helper/card-progress.client";
import { type AudioMode, AudioModeStorageKey, parseAudioMode } from "../../helper/audio-mode";
import { parsePlayOrder } from "../../helper/play-order";
import {
  closeVideoPip,
  isVideoPipOpen,
  openVideoPip,
  type VideoPipControls,
  videoPipSupported,
} from "../../helper/video-pip.client";
import { clamp, range, shuffle } from "remeda";

type Dir = "prev" | "next";

const closest = (target: EventTarget | null, selector: string) =>
  target && "closest" in target ? (target as Element).closest<HTMLElement>(selector) : null;

const deckElement = document.getElementById("deck");
const card = () => deckElement?.querySelector<HTMLElement>("#card") ?? null;
const visibleFace = () => {
  const c = card();
  const face = c?.classList.contains("flipped") ? "back" : "front";
  return c?.querySelector<HTMLElement>(`[data-face="${face}"]`) ?? null;
};
const wordAudio = (c: HTMLElement) => (c.dataset.audio ? [c.dataset.audio] : []);
const exampleAudios = (c: HTMLElement) =>
  [...c.querySelectorAll<HTMLElement>(".example[data-audio]")].flatMap(
    (el) => el.dataset.audio ?? [],
  );

const frontAudios = (c: HTMLElement, mode: AudioMode) =>
  mode === "word" ? wordAudio(c) : [...wordAudio(c), ...exampleAudios(c)];

const flip = (force?: boolean) => {
  card()?.classList.toggle("flipped", force);
};

type Filter = "all" | "favorites";
const toFilter = (value: string | undefined): Filter =>
  value === "favorites" ? "favorites" : "all";
const currentFilter = (c: HTMLElement) => toFilter(c.dataset.filter);

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

type DocumentPictureInPicture = {
  window: Window | null;
  requestWindow: (options?: { width?: number; height?: number }) => Promise<Window>;
};

const PipWidth = 420;
const PipHeight = 540;

const copyStyles = (target: Document) => {
  for (const sheet of document.styleSheets) {
    try {
      const style = target.createElement("style");
      style.textContent = [...sheet.cssRules].map((rule) => rule.cssText).join("\n");
      target.head.append(style);
    } catch {
      if (!sheet.href) continue;
      const link = target.createElement("link");
      link.rel = "stylesheet";
      link.href = sheet.href;
      target.head.append(link);
    }
  }
};

const openDocumentPip = async (
  pip: DocumentPictureInPicture,
  deck: HTMLElement,
  onKeydown: (e: KeyboardEvent) => void,
) => {
  const pipWindow = await pip.requestWindow({ width: PipWidth, height: PipHeight });
  const pipDocument = pipWindow.document;
  copyStyles(pipDocument);
  pipDocument.body.className = `${document.body.className} px-3`;
  const placeholder = document.createElement("p");
  placeholder.className = "my-6 text-center text-sm text-neutral-500";
  placeholder.textContent = "小窓で表示しています";
  deck.before(placeholder);
  pipDocument.body.append(deck);
  pipDocument.addEventListener("keydown", onKeydown);
  // 元の document の外では、speak-button.client.ts の委譲も htmx の hx-post も動かないので、ここで扱う
  pipDocument.addEventListener("click", (e) => {
    const src = closest(e.target, ".speak")?.dataset.audio;
    if (src) playOne(src);
    const poster = closest(e.target, "[hx-post]");
    const url = poster?.getAttribute("hx-post");
    if (poster && url) htmx.ajax("post", url, { target: poster, swap: "outerHTML" });
  });
  pipWindow.addEventListener("pagehide", () => placeholder.replaceWith(deck));
};

// パソコンの Chrome / Edge はカードの要素ごと小窓に移し、それ以外（Android など）はカードを画像にした動画を小窓に出す
const setupPictureInPicture = (
  deck: HTMLElement,
  onKeydown: (e: KeyboardEvent) => void,
  controls: VideoPipControls,
) => {
  const pip = (window as Window & { documentPictureInPicture?: DocumentPictureInPicture })
    .documentPictureInPicture;
  const button = document.getElementById("toggle-pip");
  if (!button || (!pip && !videoPipSupported())) return;
  button.hidden = false;
  button.addEventListener("click", () => {
    if (pip) {
      if (pip.window) pip.window.close();
      else openDocumentPip(pip, deck, onKeydown);
    } else if (isVideoPipOpen()) closeVideoPip();
    else openVideoPip({ root: deck, capture: visibleFace, controls });
  });
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const setupDeck = (deck: HTMLElement) => {
  const groupId = deck.dataset.groupId ?? "";
  const wordIds: number[] = JSON.parse(deck.dataset.wordIds ?? "[]");
  const cardUrl = (filter: Filter, index: number) => {
    const params = new URLSearchParams({ index: String(index), total: String(wordIds.length) });
    if (filter === "favorites") params.set("only", "favorites");
    return `/groups/${groupId}/cards/${wordIds[index]}?${params}`;
  };
  const frontMs = Number(deck.dataset.frontMs);
  const backMs = Number(deck.dataset.backMs);
  const toggleBtn = document.getElementById("toggle-play");
  const autoAudio = document.getElementById("auto-audio") as HTMLInputElement | null;
  let playing = false;
  let gen = 0;

  const autoAudioOn = () => autoAudio?.checked ?? false;

  let order = parsePlayOrder(localStorage.getItem(PlayOrderStorageKey));
  const audioMode = parseAudioMode(localStorage.getItem(AudioModeStorageKey));
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
      await hold(frontAudios(c, audioMode), frontMs);
      if (my !== gen) return;
      flip(true);
    }
    await hold([], backMs);
    if (my !== gen) return;
    advance();
  };

  const setPlaying = (value: boolean) => {
    playing = value;
    if (toggleBtn) {
      toggleBtn.textContent = playing ? "⏸" : "▶";
      toggleBtn.ariaLabel = playing ? "一時停止" : "再生";
    }
    keepScreenOn(playing);
    if ("mediaSession" in navigator) {
      navigator.mediaSession.playbackState = playing ? "playing" : "paused";
    }
    if (playing) run();
    else stop();
  };

  const playCurrentFace = () => {
    stop();
    const c = card();
    if (!c || !autoAudioOn() || c.classList.contains("flipped")) return;
    playQueue(frontAudios(c, audioMode), gen);
  };

  const toggleFlip = () => {
    flip();
    if (playing) run();
    else playCurrentFace();
  };

  toggleBtn?.addEventListener("click", () => setPlaying(!playing));

  const saveProgress = () => {
    const c = card();
    if (c) storeProgress(groupId, currentFilter(c), { order, step, sequence });
  };

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") keepScreenOn(playing);
  });

  const initial = card();
  if (initial) {
    const saved = loadProgress(groupId, currentFilter(initial), Number(initial.dataset.total));
    if (saved && saved.sequence[saved.step] === Number(initial.dataset.index)) {
      ({ order, step, sequence } = saved);
    }
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
    const c = card();
    if (!c) return;
    deck.dataset.dir = dir;
    htmx.ajax("get", cardUrl(currentFilter(c), index), {
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

  deck.addEventListener("htmx:afterSettle", (e) => {
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

  const onKeydown = (e: KeyboardEvent) => {
    if (closest(e.target, "input, select, textarea")) return;
    if (closest(e.target, "button, a") && (e.key === " " || e.key === "Enter")) return;
    if (e.key === "ArrowRight") go("next");
    else if (e.key === "ArrowLeft") go("prev");
    else if (e.key === " ") {
      e.preventDefault();
      setPlaying(!playing);
    } else if (e.key === "Enter") toggleFlip();
  };
  document.addEventListener("keydown", onKeydown);

  setupPictureInPicture(deck, onKeydown, {
    play: () => setPlaying(true),
    pause: () => setPlaying(false),
    prev: () => go("prev"),
    next: () => go("next"),
  });
};

if (deckElement) setupDeck(deckElement);
