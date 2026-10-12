import type { WordWithGroups } from "../../../backend/db";
import { Examples } from "../examples";
import { SpeakButton } from "../speak-button";

type Props = {
  words: WordWithGroups[];
  cardHref?: (index: number) => string;
  currentGroupId?: number;
};

export const WordRows = (props: Props) => {
  const { words, cardHref, currentGroupId } = props;
  if (words.length === 0) return <p class="muted">単語がありません。</p>;
  return (
    <ol class="word-list">
      {words.map((w, i) => {
        const body = (
          <>
            <span class="word-term">{w.term}</span>
            <span class="word-meaning">{w.meaning}</span>
          </>
        );
        const tags = w.groups.filter((g) => g.id !== currentGroupId);
        return (
          <li>
            {cardHref ? (
              <a href={cardHref(i)} class="word-main">
                {body}
              </a>
            ) : (
              <div class="word-main">{body}</div>
            )}
            <SpeakButton audioKey={w.audio_key} label="音声を再生" />
            {w.examples.length > 0 && <Examples examples={w.examples} />}
            {tags.length > 0 && (
              <div class="word-tags">
                {tags.map((g) => (
                  <a href={`/groups/${g.id}/words`} class="tag">
                    {g.name}
                  </a>
                ))}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
};
