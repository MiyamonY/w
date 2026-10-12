import { audioUrl } from "../../helper/audio-url";

type Props = {
  audioKey: string | null;
  label: string;
  class?: string;
};

export const SpeakButton = (props: Props) => {
  const { audioKey, label, class: className = "cursor-pointer px-1" } = props;
  if (!audioKey) return null;
  return (
    <button
      type="button"
      class={`speak ${className}`}
      data-audio={audioUrl(audioKey)}
      aria-label={label}
    >
      🔊
    </button>
  );
};
