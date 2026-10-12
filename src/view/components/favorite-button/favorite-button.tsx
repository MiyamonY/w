export const FavoriteButtonVariants = ["inline", "corner"] as const;
export type FavoriteButtonVariant = (typeof FavoriteButtonVariants)[number];

const VariantClass: Record<FavoriteButtonVariant, string> = {
  inline: "cursor-pointer px-1",
  corner: "absolute top-2 right-2 z-10 cursor-pointer p-2 text-2xl leading-none",
};

type Props = {
  wordId: number;
  favorite: boolean;
  variant?: FavoriteButtonVariant;
};

export const FavoriteButton = (props: Props) => {
  const { wordId, favorite, variant = "inline" } = props;
  return (
    <button
      type="button"
      class={`${VariantClass[variant]} ${favorite ? "text-amber-500" : "text-neutral-400"}`}
      hx-post={`/words/${wordId}/favorite?variant=${variant}`}
      hx-target="this"
      hx-swap="outerHTML"
      hx-push-url="false"
      aria-pressed={favorite ? "true" : "false"}
      aria-label={favorite ? "お気に入りから外す" : "お気に入りに追加"}
    >
      {favorite ? "★" : "☆"}
    </button>
  );
};
