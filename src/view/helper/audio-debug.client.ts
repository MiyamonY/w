// 音声の再生の流れを画面に出す調査用の表示。最初から表示し、/?audio-debug=0 で消して /?audio-debug=1 で戻す
// （PWA は URL のクエリを引き継がないので、消したかどうかは localStorage に残す）

const StorageKey = "audioDebug";
const MaxLines = 14;
const Events = [
  "loadstart",
  "loadedmetadata",
  "canplay",
  "canplaythrough",
  "waiting",
  "stalled",
  "playing",
  "ended",
  "error",
];

const flag = new URLSearchParams(location.search).get("audio-debug");
if (flag === "0") localStorage.setItem(StorageKey, "0");
if (flag === "1") localStorage.removeItem(StorageKey);
const enabled = localStorage.getItem(StorageKey) !== "0";

const lines: string[] = [];
let panel: HTMLElement | null = null;

const show = () => {
  if (!panel) {
    panel = document.createElement("pre");
    panel.style.cssText =
      "position:fixed;top:0;left:0;right:0;z-index:9999;margin:0;padding:4px;font:10px/1.3 monospace;background:rgba(0,0,0,.75);color:#0f0;pointer-events:none;white-space:pre-wrap";
    document.body.append(panel);
  }
  panel.textContent = lines.join("\n");
};

const name = (audio: HTMLAudioElement) =>
  decodeURIComponent(audio.src.split("/").pop() ?? "").slice(0, 22) || "(空)";

export const traceNote = (text: string) => {
  if (!enabled) return;
  lines.push(`${Math.round(performance.now()) % 100000} ${text}`);
  lines.splice(0, Math.max(lines.length - MaxLines, 0));
  show();
};

export const traceAudio = (audio: HTMLAudioElement) => {
  if (!enabled) return;
  for (const event of Events) {
    audio.addEventListener(event, () => {
      const extra =
        event === "ended"
          ? ` dur=${Math.round(audio.duration * 1000)}`
          : event === "playing"
            ? ` ready=${audio.readyState}`
            : "";
      traceNote(`${name(audio)} ${event}${extra}`);
    });
  }
};

export const tracePlay = (audio: HTMLAudioElement) =>
  traceNote(`${name(audio)} play() ready=${audio.readyState}`);
