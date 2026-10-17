import { imageUrl } from "../../helper/image-url";

type Props = {
  imageKey: string | null;
};

export const WordImage = (props: Props) => {
  const { imageKey } = props;
  if (!imageKey) return null;
  return (
    <img
      src={imageUrl(imageKey)}
      alt="覚え方のイメージ"
      loading="lazy"
      class="size-32 shrink-0 rounded-xl object-cover"
    />
  );
};
