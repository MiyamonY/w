import { playOne } from "../../helper/audio-player.client";

document.addEventListener("click", (e) => {
  const button = e.target instanceof Element ? e.target.closest<HTMLElement>(".speak") : null;
  const src = button?.dataset.audio;
  if (src) playOne(src);
});
