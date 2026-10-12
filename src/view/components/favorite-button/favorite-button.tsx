export const FavoriteButtonVariants = ["inline", "footer"] as const;
export type FavoriteButtonVariant = (typeof FavoriteButtonVariants)[number];

const VariantClass: Record<FavoriteButtonVariant, string> = {
  inline: "cursor-pointer px-1",
  footer: "cursor-pointer rounded-full bg-white px-4 py-2 text-lg shadow",
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
