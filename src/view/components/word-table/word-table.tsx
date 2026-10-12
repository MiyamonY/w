import type { WordWithGroups } from "../../../backend/db";
import { Examples } from "../examples";
import { GroupTags } from "../group-tags";
import { SpeakButton } from "../speak-button";

type Props = {
  words: WordWithGroups[];
  cardHref?: (index: number) => string;
  currentGroupId?: number;
};

export const WordTable = (props: Props) => {
  const { words, cardHref, currentGroupId } = props;
  if (words.length === 0) return <p class="muted">単語がありません。</p>;
  return (
    <table class="word-table">
      <thead>
        <tr>
          <th class="word-table-id">ID</th>
          <th>単語</th>
          <th>意味</th>
          <th>例文</th>
          <th>グループ</th>
        </tr>
      </thead>
      <tbody>
        {words.map((w, i) => (
          <tr>
            <td class="word-table-id">{w.id}</td>
            <td class="word-table-term">
              {cardHref ? <a href={cardHref(i)}>{w.term}</a> : w.term}
              <SpeakButton audioKey={w.audio_key} label="音声を再生" />
            </td>
            <td>{w.meaning}</td>
            <td>{w.examples.length > 0 && <Examples examples={w.examples} />}</td>
            <td>
              <GroupTags groups={w.groups.filter((g) => g.id !== currentGroupId)} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
