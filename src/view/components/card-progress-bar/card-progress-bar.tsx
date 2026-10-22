// 小窓で表示しているときだけ、どこまで進んだかをカードの下にバーで出す。幅は deck.client.ts が入れる
export const CardProgressBar = () => (
  <div class="absolute inset-x-4 bottom-3 hidden h-1.5 overflow-hidden rounded-full bg-neutral-100 pip:block">
    <div data-progress-bar class="h-full w-0 rounded-full bg-blue-600" />
  </div>
);
