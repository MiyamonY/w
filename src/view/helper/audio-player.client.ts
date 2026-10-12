const player = new Audio();
let finish: (() => void) | null = null;

export const playOne = (src: string): Promise<void> => {
  finish?.();
  return new Promise((resolve) => {
    const done = () => {
      if (finish !== done) return;
      finish = null;
      player.removeEventListener("ended", done);
      player.removeEventListener("error", done);
      resolve();
    };
    finish = done;
    player.addEventListener("ended", done);
    player.addEventListener("error", done);
    player.src = src;
    player.play().catch(done);
  });
};

export const stopAudio = () => {
  player.pause();
  finish?.();
};
