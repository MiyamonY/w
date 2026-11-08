import { parsePlaybackRate, PlaybackRateStorageKey } from "./playback-rate";

let rate = parsePlaybackRate(localStorage.getItem(PlaybackRateStorageKey));

const applyRate = (audio: HTMLAudioElement) => {
  audio.defaultPlaybackRate = rate;
  audio.playbackRate = rate;
};

// 先読みしていない音声を鳴らすプレーヤー
const fallback = new Audio();
applyRate(fallback);

// 先読みした音声（元の URL → 読み込み済みのプレーヤー）。src を切り替えると端末によっては
// 読み込みと再生の準備で間が空くので、カードの音声ごとにプレーヤーを用意しておく
const preloaded = new Map<string, HTMLAudioElement>();

let current = fallback;
let finish: (() => void) | null = null;

export const setPlaybackRate = (value: number) => {
  rate = value;
  for (const audio of [fallback, ...preloaded.values()]) applyRate(audio);
  localStorage.setItem(PlaybackRateStorageKey, String(rate));
};

export const currentPlaybackRate = () => rate;

// srcs を先に読み込み、srcs に無いものは捨てる
export const preloadAudio = (srcs: string[]) => {
  for (const [src, audio] of preloaded) {
    if (srcs.includes(src)) continue;
    preloaded.delete(src);
    if (audio === current) continue;
    audio.removeAttribute("src");
    audio.load();
  }
  for (const src of srcs) {
    if (preloaded.has(src)) continue;
    const audio = new Audio();
    audio.preload = "auto";
    applyRate(audio);
    audio.src = src;
    preloaded.set(src, audio);
  }
};

export const playOne = (src: string): Promise<void> => {
  current.pause();
  finish?.();
  const audio = preloaded.get(src) ?? fallback;
  current = audio;
  return new Promise((resolve) => {
    const done = () => {
      if (finish !== done) return;
      finish = null;
      audio.removeEventListener("ended", done);
      audio.removeEventListener("error", done);
      resolve();
    };
    finish = done;
    audio.addEventListener("ended", done);
    audio.addEventListener("error", done);
    if (audio === fallback) audio.src = src;
    else audio.currentTime = 0;
    audio.play().catch(done);
  });
};

export const stopAudio = () => {
  current.pause();
  finish?.();
};
