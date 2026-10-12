import type { Example } from "../../../backend/db";
import { audioUrl } from "../../helper/audio-url";
import { SpeakButton } from "../speak-button";

type Props = {
  examples: Example[];
};

export const Examples = (props: Props) => {
  const { examples } = props;
  return (
    <ul class="examples">
      {examples.map((e) => (
        <li class="example" data-audio={audioUrl(e.audio_key)}>
          <div class="example-text">
            <div class="example-sentence">{e.sentence}</div>
            {e.translation && <div class="example-translation">{e.translation}</div>}
            {e.source_title && (
              <div class="example-source">
                出典:{" "}
                {e.source_url ? (
                  <a href={e.source_url} target="_blank" rel="noopener noreferrer">
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
