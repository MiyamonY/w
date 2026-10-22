import { DeckPlayingEvent } from "../../helper/deck-playing-event";

const elapsed = document.querySelector<HTMLTimeElement>("#elapsed-time");

const pad = (n: number) => String(n).padStart(2, "0");

const format = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const seconds = totalSeconds % 60;
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
};

if (elapsed) {
  let accumulatedMs = 0;
  let startedAt: number | null = null;
  let timer: ReturnType<typeof setInterval> | undefined;

  const update = () => {
    const runningMs = startedAt === null ? 0 : Date.now() - startedAt;
    const totalSeconds = Math.floor((accumulatedMs + runningMs) / 1000);
    elapsed.textContent = format(totalSeconds);
    elapsed.dateTime = `PT${totalSeconds}S`;
  };

  document.addEventListener(DeckPlayingEvent, (e) => {
    const playing = (e as CustomEvent<boolean>).detail;
    if (playing && startedAt === null) {
      startedAt = Date.now();
      timer = setInterval(update, 1000);
    } else if (!playing && startedAt !== null) {
      accumulatedMs += Date.now() - startedAt;
      startedAt = null;
      clearInterval(timer);
    }
    update();
  });
}
