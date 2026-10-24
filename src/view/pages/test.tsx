import type { Passage as PassageData } from "../../backend/passages";
import { BackToTests } from "../components/back-to-tests";
import { FavoriteButton } from "../components/favorite-button";
import { Layout } from "../components/layout";
import { PageHeader } from "../components/page-header";
import { Passage } from "../components/passage";
import { SpeakButton } from "../components/speak-button";

type Props = {
  passage: PassageData;
};

export const TestPage = (props: Props) => {
  const { passage } = props;
  return (
    <Layout title={`${passage.title} - 単語帳`}>
      <PageHeader
        title={`${passage.group_name} のテスト`}
        backHref={`/groups/${passage.group_id}/tests`}
      />
      <div class="mt-4">
        <Passage passage={passage} />
      </div>
      <h2 class="mt-6 text-neutral-500 dark:text-neutral-400">出題した単語</h2>
      <ul class="mt-2 grid gap-2">
        {passage.words.map((w) => (
          <li class="rounded-xl bg-white dark:bg-neutral-800 p-3 shadow-sm">
            <div class="flex items-center gap-1">
              <span class="font-semibold">{w.term}</span>
              <SpeakButton audioKey={w.audio_key} label="音声を再生" />
              <FavoriteButton wordId={w.id} favorite={w.favorite} />
            </div>
            {w.ipa && <div class="text-sm text-neutral-500 dark:text-neutral-400">/{w.ipa}/</div>}
            <div class="text-sm">{w.meaning}</div>
          </li>
        ))}
      </ul>
      <BackToTests groupId={passage.group_id} />
    </Layout>
  );
};
