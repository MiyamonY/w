export const MinPlaybackRate = 1;
export const MaxPlaybackRate = 2;
export const PlaybackRateStep = 0.1;
export const DefaultPlaybackRate = 1;
export const PlaybackRateStorageKey = "playbackRate";

export const formatPlaybackRate = (rate: number) => rate.toFixed(1);

export const parsePlaybackRate = (value: string | null | undefined) => {
  const rate = Math.round(Number(value) / PlaybackRateStep) * PlaybackRateStep;
  if (!Number.isFinite(rate) || value == null || value === "") return DefaultPlaybackRate;
  return Number(Math.min(Math.max(rate, MinPlaybackRate), MaxPlaybackRate).toFixed(1));
};
