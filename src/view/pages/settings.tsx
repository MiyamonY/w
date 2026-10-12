import type { Settings } from "../../backend/settings";
import { Layout } from "../components/layout";
import { PageHeader } from "../components/page-header";
import { SettingsForm } from "../components/settings-form";

type Props = {
  settings: Settings;
  status?: "saved" | "invalid";
};

export const SettingsPage = (props: Props) => {
  const { settings, status } = props;
  return (
    <Layout title="設定 - 単語帳">
      <PageHeader title="設定" backHref="/" />
      <SettingsForm settings={settings} status={status} />
    </Layout>
  );
};
