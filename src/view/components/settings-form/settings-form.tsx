import { MaxDisplayMs, MinDisplayMs, type Settings } from "../../../backend/settings";

type Props = {
  settings: Settings;
  status?: "saved" | "invalid";
};

const NumberInput = "max-w-40 rounded-lg border border-neutral-300 p-2 text-lg";

export const SettingsForm = (props: Props) => {
  const { settings, status } = props;
  return (
    <form
      id="settings-form"
      class="mt-6 grid gap-4 rounded-xl bg-white p-5 shadow-sm"
      hx-post="/settings"
      hx-ext="json-enc-typed"
      hx-swap="outerHTML"
    >
      <label class="grid gap-1.5">
        <span>表面を見せる時間（ミリ秒）</span>
        <input
          type="number"
          name="front_ms"
          min={MinDisplayMs}
          max={MaxDisplayMs}
          step="100"
          required
          class={NumberInput}
          value={String(settings.front_ms)}
        />
      </label>
      <label class="grid gap-1.5">
        <span>裏面を見せる時間（ミリ秒）</span>
        <input
          type="number"
          name="back_ms"
          min={MinDisplayMs}
          max={MaxDisplayMs}
          step="100"
          required
          class={NumberInput}
          value={String(settings.back_ms)}
        />
      </label>
      <p class="text-sm text-neutral-500">
        自動再生で次へ進むまでの最低時間です（{MinDisplayMs}〜{MaxDisplayMs}
        ミリ秒）。音声が長い場合は再生が終わるまで待ちます。
      </p>
      <label class="flex items-center gap-2">
        <input
          type="checkbox"
          name="show_examples_on_front"
          checked={settings.show_examples_on_front}
        />
        <span>カードの表に例文（英語のみ）を表示する</span>
      </label>
      <button
        type="submit"
        class="cursor-pointer justify-self-start rounded-full bg-blue-700 px-6 py-2.5 text-white"
      >
        保存
      </button>
      {status === "saved" && <p class="text-green-700">保存しました。</p>}
      {status === "invalid" && (
        <p class="text-red-700">
          入力内容を確認してください（表示時間は {MinDisplayMs}〜{MaxDisplayMs} の整数ミリ秒）。
        </p>
      )}
    </form>
  );
};
