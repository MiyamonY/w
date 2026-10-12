import type { Child } from "hono/jsx";

const ClientAssets = () => {
  if (import.meta.env.DEV) {
    return (
      <>
        <script type="module" src="/@vite/client"></script>
        <script type="module" src="/src/view/client.ts"></script>
      </>
    );
  }
  return (
    <>
      <link rel="stylesheet" href="/assets/app.css" />
      <script type="module" src="/assets/app.js"></script>
    </>
  );
};

type Props = {
  title: string;
  wide?: boolean;
  children: Child;
};

export const Layout = (props: Props) => {
  const { title, wide, children } = props;
  return (
    <html lang="ja">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title}</title>
        <ClientAssets />
      </head>
      <body class="bg-gray-100 font-sans text-neutral-800">
        <main class={`mx-auto px-4 py-6 ${wide ? "max-w-240" : "max-w-140"}`}>{children}</main>
      </body>
    </html>
  );
};
