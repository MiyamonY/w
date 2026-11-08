import { traceAudio, traceNote, tracePlay } from "./audio-debug.client";
import { parsePlaybackRate, PlaybackRateStorageKey } from "./playback-rate";

let rate = parsePlaybackRate(localStorage.getItem(PlaybackRateStorageKey));

const applyRate = (audio: HTMLAudioElement) => {
  audio.defaultPlaybackRate = rate;
  audio.playbackRate = rate;
};

// 先読みしていない音声を鳴らすプレーヤー
const fallback = new Audio();
applyRate(fallback);
traceAudio(fallback);

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
    traceAudio(audio);
    audio.src = src;
    preloaded.set(src, audio);
  }
};

// Bluetooth のイヤホンは出力が途切れると接続を休ませ、次の音声の前につなぎ直しで 1〜2 秒待たせる。
// 再生中はほぼ無音（-80dB）の出力を流し続け、単語と例文の間でつなぎ直しが起きないようにする
const KeepAliveLevel = 0.0001;
let keepAlive: AudioContext | null = null;

export const keepAudioOutput = (on: boolean) => {
  if (!on) {
    void keepAlive?.suspend();
    return;
  }
  if (!keepAlive) {
    keepAlive = new AudioContext();
    // 完全な無音だとブラウザが出力を止めるので、聞こえない大きさの一定の値を流す
    const source = new ConstantSourceNode(keepAlive, { offset: KeepAliveLevel });
    source.connect(keepAlive.destination);
    source.start();
  }
  void keepAlive.resume().then(() => {
    const latency = Math.round((keepAlive?.outputLatency ?? 0) * 1000);
    traceNote(`keepAlive ${keepAlive?.state} out=${latency}ms`);
  });
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
    tracePlay(audio);
    audio.play().catch((error) => {
      traceNote(`play() 失敗 ${error}`);
      done();
    });
  });
};

export const stopAudio = () => {
  current.pause();
  finish?.();
};
