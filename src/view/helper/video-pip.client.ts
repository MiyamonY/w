import { toSvg } from "html-to-image";

export type VideoPipControls = {
  play: () => void;
  pause: () => void;
  prev: () => void;
  next: () => void;
};

type Options = {
  root: HTMLElement;
  capture: () => HTMLElement | null;
  controls: VideoPipControls;
};

const PixelRatio = 2;
const SettleMs = 450;

export const videoPipSupported = () =>
  document.pictureInPictureEnabled && "captureStream" in HTMLCanvasElement.prototype;

export const isVideoPipOpen = () => document.pictureInPictureElement !== null;

export const closeVideoPip = () => document.exitPictureInPicture();

// html-to-image の toCanvas は読み込み後に requestAnimationFrame を待つため、アプリが裏に回ると終わらない。
// SVG までを html-to-image に任せ、画像の読み込みは requestAnimationFrame を使わずに行う
const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", reject);
    image.src = src;
  });

// root 内の変化が落ち着くたびに capture() の要素を画像にして canvas に描き、その映像を動画の小窓に出す
export const openVideoPip = async (options: Options) => {
  const { root, capture, controls } = options;
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) return;
  let track: CanvasCaptureMediaStreamTrack | null = null;

  const render = async () => {
    const element = capture();
    if (!element) return;
    const width = element.offsetWidth * PixelRatio;
    const height = element.offsetHeight * PixelRatio;
    const svg = await toSvg(element, {
      skipFonts: true,
      backgroundColor: "#ffffff",
      style: { position: "static", transform: "none", rotate: "none", translate: "none" },
    });
    const image = await loadImage(svg);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);
    track?.requestFrame();
  };

  await render();
  const stream = canvas.captureStream(0);
  track = stream.getVideoTracks()[0] as CanvasCaptureMediaStreamTrack;
  track.requestFrame();

  let timer: ReturnType<typeof setTimeout> | undefined;
  const observer = new MutationObserver(() => {
    clearTimeout(timer);
    timer = setTimeout(render, SettleMs);
  });

  const actions: [MediaSessionAction, () => void][] = [
    ["play", controls.play],
    ["pause", controls.pause],
    ["previoustrack", controls.prev],
    ["nexttrack", controls.next],
  ];

  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.srcObject = stream;

  const cleanup = () => {
    observer.disconnect();
    clearTimeout(timer);
    for (const [action] of actions) navigator.mediaSession?.setActionHandler(action, null);
    track?.stop();
    video.srcObject = null;
  };

  try {
    await video.play();
    await video.requestPictureInPicture();
  } catch {
    cleanup();
    return;
  }
  observer.observe(root, { subtree: true, childList: true, attributes: true });
  for (const [action, handler] of actions)
    navigator.mediaSession?.setActionHandler(action, handler);
  video.addEventListener("leavepictureinpicture", cleanup, { once: true });
};
