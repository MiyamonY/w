import type { Example } from "../../../backend/db";
import { audioUrl } from "../../helper/audio-url";
import { SpeakButton } from "../speak-button";

type Props = {
  examples: Example[];
};

export const Examples = (props: Props) => {
  const { examples } = props;
  return (
    <ul class="grid w-full gap-2 text-left">
      {examples.map((e) => (
        <li class="example flex items-start gap-2" data-audio={audioUrl(e.audio_key)}>
          <div class="flex-1">
            <div class="text-neutral-700">{e.sentence}</div>
            {e.translation && <div class="text-sm text-neutral-500">{e.translation}</div>}
            {e.source_title && (
              <div class="text-xs text-neutral-400">
                出典:{" "}
                {e.source_url ? (
                  <a
                    href={e.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-blue-700"
                  >
                    {e.source_title}
                  </a>
                ) : (
                  e.source_title
                )}
              </div>
            )}
          </div>
          <SpeakButton audioKey={e.audio_key} label="例文の音声を再生" />
        </li>
      ))}
    </ul>
  );
};
