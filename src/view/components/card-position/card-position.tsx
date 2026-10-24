type Props = {
  position: number;
  total: number;
};

export const CardPosition = (props: Props) => {
  const { position, total } = props;
  return (
    <div class="-mt-3 mb-6 flex items-center gap-3 text-sm">
      <input
        id="card-position"
        type="range"
        min="1"
        max={String(total)}
        value={String(position)}
        aria-label="再生した枚数"
        class="min-w-0 flex-1 accent-blue-700"
      />
      <input
        id="card-position-input"
        type="number"
        min="1"
        max={String(total)}
        value={String(position)}
        aria-label="何枚目か"
        class="w-20 rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 p-1 text-right tabular-nums"
      />
      <span id="card-position-total" class="text-neutral-500 dark:text-neutral-400 tabular-nums">
        / {total}
      </span>
    </div>
  );
};
