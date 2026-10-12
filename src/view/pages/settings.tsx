import type { Settings } from "../../backend/settings";
import { Layout } from "../components/layout";
import { SettingsForm } from "../components/settings-form";

type Props = {
  settings: Settings;
  status?: "saved" | "invalid";
};

export const SettingsPage = (props: Props) => {
  const { settings, status } = props;
  return (
    <Layout title="設定 - 単語帳">
      <main class="container">
        <header class="player-header">
          <a href="/" class="back-link">
            ← 一覧
          </a>
          <h1>設定</h1>
        </header>
        <SettingsForm settings={settings} status={status} />
      </main>
    </Layout>
  );
};
