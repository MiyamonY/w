import { parsePlaybackRate, PlaybackRateStorageKey } from "./playback-rate";

let rate = parsePlaybackRate(localStorage.getItem(PlaybackRateStorageKey));

const applyRate = (audio: HTMLAudioElement) => {
  audio.defaultPlaybackRate = rate;
  audio.playbackRate = rate;
};

// 先読みしていない音声を鳴らすプレーヤー
const fallback = new Audio();
applyRate(fallback);

// Bluetooth のイヤホンは出力の流れを作るたびに遅延の分（機種によっては 2 秒ほど）溜めてから鳴らすので、<audio> ごとに出力すると
// 単語と例文の間がその分空く。先読みした音声は 1 本の AudioContext に通し、出力の流れを使い回す。
// 完全な無音だとブラウザが出力を止めるので、聞こえない大きさ（-80dB）の一定の値も流しておく
const KeepAliveLevel = 0.0001;
let output: AudioContext | null = null;
let keepOn = false;

const outputContext = () => {
  if (!output) {
    output = new AudioContext();
    const source = new ConstantSourceNode(output, { offset: KeepAliveLevel });
    source.connect(output.destination);
    source.start();
  }
  return output;
};

const resumeOutput = () => void outputContext().resume();

// 先読みした音声（元の URL → 読み込み済みのプレーヤーと、AudioContext への入口）
type Preloaded = { audio: HTMLAudioElement; node: MediaElementAudioSourceNode };
const preloaded = new Map<string, Preloaded>();

let current = fallback;
let finish: (() => void) | null = null;

export const setPlaybackRate = (value: number) => {
  rate = value;
  applyRate(fallback);
  for (const { audio } of preloaded.values()) applyRate(audio);
  localStorage.setItem(PlaybackRateStorageKey, String(rate));
};

export const currentPlaybackRate = () => rate;

// srcs を先に読み込み、srcs に無いものは捨てる
export const preloadAudio = (srcs: string[]) => {
  for (const [src, { audio, node }] of preloaded) {
    if (srcs.includes(src) || audio === current) continue;
    preloaded.delete(src);
    node.disconnect();
    audio.removeAttribute("src");
    audio.load();
  }
  for (const src of srcs) {
    if (preloaded.has(src)) continue;
    const audio = new Audio();
    audio.preload = "auto";
    applyRate(audio);
    audio.src = src;
    const context = outputContext();
    const node = context.createMediaElementSource(audio);
    node.connect(context.destination);
    preloaded.set(src, { audio, node });
  }
};

// 出力を続けるかどうか。自動再生の間は続け、止めたら休ませる
export const keepAudioOutput = (on: boolean) => {
  keepOn = on;
  if (on) resumeOutput();
  else void output?.suspend();
};

export const playOne = (src: string): Promise<void> => {
  current.pause();
  finish?.();
  const entry = preloaded.get(src);
  const audio = entry?.audio ?? fallback;
  current = audio;
  // AudioContext に通した音声は、AudioContext が止まっていると聞こえない
  if (entry) resumeOutput();
  return new Promise((resolve) => {
    const done = () => {
      if (finish !== done) return;
      finish = null;
      audio.removeEventListener("ended", done);
      audio.removeEventListener("error", done);
      if (entry && !keepOn) void output?.suspend();
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
