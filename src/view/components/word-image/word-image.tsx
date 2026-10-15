import { imageUrl } from "../../helper/image-url";

type Props = {
  wordId: number;
  imageKey: string | null;
};

export const WordImage = (props: Props) => {
  const { wordId, imageKey } = props;
  if (!imageKey) {
    return (
      <div
        hx-post={`/words/${wordId}/image`}
        hx-trigger="load"
        hx-swap="outerHTML"
        hx-push-url="false"
        hidden
      />
    );
  }
  return (
    <img
      src={imageUrl(imageKey)}
      alt="覚え方のイメージ"
      loading="lazy"
      class="size-32 shrink-0 rounded-xl object-cover"
    />
  );
};
