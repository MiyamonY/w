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

const go = (dir: Dir) => {
  card()?.querySelector<HTMLElement>(`[data-nav="${dir}"]`)?.click();
};

const setupDeck = (deck: HTMLElement) => {
  const frontMs = Number(deck.dataset.frontMs);
  const backMs = Number(deck.dataset.backMs);
  const toggleBtn = document.getElementById("toggle-play");
  const autoAudio = document.getElementById("auto-audio") as HTMLInputElement | null;
  let playing = false;
  let gen = 0;

  const autoAudioOn = () => autoAudio?.checked ?? false;

  const rateInput = document.getElementById("playback-rate") as HTMLInputElement | null;
  const rateValue = document.getElementById("playback-rate-value");
  const showRate = (rate: number) => {
    if (rateValue) rateValue.textContent = `${formatPlaybackRate(rate)}x`;
  };
  if (rateInput) {
    rateInput.value = formatPlaybackRate(currentPlaybackRate());
    showRate(currentPlaybackRate());
    rateInput.addEventListener("input", () => {
      const rate = parsePlaybackRate(rateInput.value);
      setPlaybackRate(rate);
      showRate(rate);
    });
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
      await Promise.all([sleep(frontMs), withAudio && playQueue(wordAudio(c), my)]);
      if (my !== gen) return;
      flip(true);
    }
    await Promise.all([sleep(backMs), withAudio && playQueue(exampleAudios(c), my)]);
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
    playQueue(c.classList.contains("flipped") ? exampleAudios(c) : wordAudio(c), gen);
  };

  const toggleFlip = () => {
    flip();
    if (playing) run();
    else playCurrentFace();
  };

  toggleBtn?.addEventListener("click", () => setPlaying(!playing));

  document.body.addEventListener("htmx:beforeRequest", (e) => {
    const dir = (e as CustomEvent<{ elt: HTMLElement }>).detail.elt.dataset.nav;
    if (dir) deck.dataset.dir = dir;
  });

  document.body.addEventListener("htmx:afterSettle", () => {
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
