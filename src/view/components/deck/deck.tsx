import type { Group, Word } from "../../../backend/db";
import type { Settings } from "../../../backend/settings";
import { Card } from "../card";

type Props = {
  group: Group;
  start: number;
  first: Word | null;
  settings: Settings;
};

export const Deck = (props: Props) => {
  const { group, start, first, settings } = props;
  if (!first) return <p class="muted">単語がありません。</p>;
  return (
    <>
      <div
        id="deck"
        hx-target="#deck"
        hx-swap="innerHTML swap:250ms"
        data-front-ms={String(settings.front_ms)}
        data-back-ms={String(settings.back_ms)}
      >
        <Card groupId={group.id} index={start} total={group.word_count} word={first} />
      </div>
      <div class="controls">
        <button id="toggle-play" type="button">
          ▶ スタート
        </button>
        <label>
          <input id="auto-audio" type="checkbox" checked /> 音声を自動再生
        </label>
      </div>
    </>
  );
};
