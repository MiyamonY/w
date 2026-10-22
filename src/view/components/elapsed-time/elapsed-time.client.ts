const elapsed = document.querySelector<HTMLTimeElement>("#elapsed-time");

const pad = (n: number) => String(n).padStart(2, "0");

const format = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const seconds = totalSeconds % 60;
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
};

if (elapsed) {
  const startedAt = Date.now();
  const update = () => {
    const totalSeconds = Math.floor((Date.now() - startedAt) / 1000);
    elapsed.textContent = format(totalSeconds);
    elapsed.dateTime = `PT${totalSeconds}S`;
  };
  setInterval(update, 1000);
}
