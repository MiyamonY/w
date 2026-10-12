import { audioUrl } from "../../helper/audio-url";

type Props = {
  audioKey: string | null;
  label: string;
};

export const SpeakButton = (props: Props) => {
  const { audioKey, label } = props;
  if (!audioKey) return null;
  return (
    <button type="button" class="speak" data-audio={audioUrl(audioKey)} aria-label={label}>
      🔊
    </button>
  );
};
