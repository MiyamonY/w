import { isIncludedIn } from "remeda";

export const AudioModes = ["word", "word-examples"] as const;
export type AudioMode = (typeof AudioModes)[number];

export const AudioModeLabels: Record<AudioMode, string> = {
  word: "単語",
  "word-examples": "単語+例文",
};

export const AudioModeStorageKey = "audioMode";

export const parseAudioMode = (value: string | null | undefined): AudioMode =>
  isIncludedIn(value, AudioModes) ? value : "word-examples";
