type Props = {
  groupId: number;
};

export const BackToTests = (props: Props) => {
  const { groupId } = props;
  return (
    <div class="mt-8 mb-4 text-center">
      <a
        href={`/groups/${groupId}/tests`}
        class="inline-block rounded-full bg-blue-700 px-6 py-2.5 text-white shadow"
      >
        テスト一覧に戻る
      </a>
    </div>
  );
};
