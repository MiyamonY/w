import { MaxDisplayMs, MinDisplayMs, type Settings } from "../../../backend/settings";

type Props = {
  settings: Settings;
  status?: "saved" | "invalid";
};

export const SettingsForm = (props: Props) => {
  const { settings, status } = props;
  return (
    <form
      id="settings-form"
      class="settings-form"
      hx-post="/settings"
      hx-ext="json-enc-typed"
      hx-swap="outerHTML"
    >
      <label>
        <span>表面を見せる時間（ミリ秒）</span>
        <input
          type="number"
          name="front_ms"
          min={MinDisplayMs}
          max={MaxDisplayMs}
          step="100"
          required
          value={String(settings.front_ms)}
        />
      </label>
      <label>
        <span>裏面を見せる時間（ミリ秒）</span>
        <input
          type="number"
          name="back_ms"
          min={MinDisplayMs}
          max={MaxDisplayMs}
          step="100"
          required
          value={String(settings.back_ms)}
        />
      </label>
      <p class="muted">
        自動再生で次へ進むまでの最低時間です（{MinDisplayMs}〜{MaxDisplayMs}
        ミリ秒）。音声が長い場合は再生が終わるまで待ちます。
      </p>
      <label class="checkbox">
        <input
          type="checkbox"
          name="show_examples_on_front"
          checked={settings.show_examples_on_front}
        />
        <span>カードの表に例文（英語のみ）を表示する</span>
      </label>
      <button type="submit">保存</button>
      {status === "saved" && <p class="settings-status">保存しました。</p>}
      {status === "invalid" && (
        <p class="settings-status error">
          入力内容を確認してください（表示時間は {MinDisplayMs}〜{MaxDisplayMs} の整数ミリ秒）。
        </p>
      )}
    </form>
  );
};
