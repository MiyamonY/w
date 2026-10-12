import type { Word } from "../../../backend/db";
import { audioUrl } from "../../helper/audio-url";
import { Examples } from "../examples";
import { SpeakButton } from "../speak-button";

type Props = {
  groupId: number;
  index: number;
  total: number;
  word: Word;
  showExamplesOnFront: boolean;
};

export const Card = (props: Props) => {
  const { groupId, index, total, word, showExamplesOnFront } = props;
  const prev = (index - 1 + total) % total;
  const next = (index + 1) % total;
  return (
    <article id="card" class="card" data-audio={audioUrl(word.audio_key)}>
      <div class="card-inner">
        <div class="face front">
          <div class="term">{word.term}</div>
          {showExamplesOnFront && word.examples.length > 0 && (
            <ul class="front-examples">
              {word.examples.map((e) => (
                <li>{e.sentence}</li>
              ))}
            </ul>
          )}
        </div>
        <div class="face back">
          <div class="term small">{word.term}</div>
          <div class="meaning">{word.meaning}</div>
          {word.examples.length > 0 && <Examples examples={word.examples} />}
        </div>
      </div>
      <div class="card-footer">
        <button
          type="button"
          class="nav"
          data-nav="prev"
          hx-get={`/groups/${groupId}/cards/${prev}`}
          aria-label="前へ"
        >
          ‹
        </button>
        <span class="progress">
          {index + 1} / {total}
        </span>
        <SpeakButton audioKey={word.audio_key} label="音声を再生" />
        <button
          type="button"
          class="nav"
          data-nav="next"
          hx-get={`/groups/${groupId}/cards/${next}`}
          aria-label="次へ"
        >
          ›
        </button>
      </div>
    </article>
  );
};
