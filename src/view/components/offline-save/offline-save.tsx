export const OfflineSave = () => (
  <div id="offline-save" hidden class="mt-3 flex items-center justify-center gap-3 text-sm">
    <button
      type="button"
      data-offline-save
      class="cursor-pointer rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-1.5 text-neutral-700 dark:text-neutral-200 disabled:cursor-wait disabled:opacity-60"
    >
      オフライン用に保存
    </button>
    <span data-offline-status class="text-neutral-500 dark:text-neutral-400 tabular-nums" />
  </div>
);
