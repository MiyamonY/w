type Props = {
  title: string;
  backHref?: string;
  link?: { href: string; label: string; data?: Record<string, string> };
};

export const PageHeader = (props: Props) => {
  const { title, backHref, link } = props;
  return (
    <header class="flex items-center gap-4">
      {backHref && (
        <a href={backHref} class="text-neutral-500 dark:text-neutral-400">
          ← 一覧
        </a>
      )}
      <h1 class="text-xl font-bold">{title}</h1>
      {link && (
        <a href={link.href} class="ml-auto text-sm text-blue-700 dark:text-blue-400" {...link.data}>
          {link.label}
        </a>
      )}
    </header>
  );
};
