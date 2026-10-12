---
name: view-components
description: src/view の JSX コンポーネント規約（1ファイル1コンポーネント、配置、命名、ブラウザ側コードの置き方）。src/view 配下でコンポーネント・ページ・ブラウザの動作を追加・分割・移動するときに使う。
---

# src/view のコンポーネント規約

## 1ファイル1コンポーネント

各 `.tsx` ファイルは、コンポーネントを1つだけアロー関数で公開する。props は `type Props` で定義し、引数では分割せず本体の先頭で分割代入する:

```tsx
type Props = {
  word: Word;
  index: number;
};

export const Card = (props: Props) => {
  const { word, index } = props;
  return <article>...</article>;
};
```

関数はコンポーネント・補助関数・ブラウザ側のコードとも `const` + アロー関数で書く。`const` は巻き上げられないので、呼び出しは定義より後に置く。

定数（固定の数値・文字列）は PascalCase で書く: `const FrontMs = 3000;`。環境変数名（`env.ACCESS_AUD` など、`wrangler.jsonc` / `.dev.vars` で決まる名前）はそのまま使う。
新しいコンポーネントは既存ファイルに足さず、新しいファイルを作る。

- ファイル名はコンポーネント名のケバブケース: `WordTable` → `word-table.tsx`
- ファイル内で使うだけの小さな JSX 断片や関数は、export しないローカル変数に留めてよい（例: `pagination.tsx` の `link`）

## components はコンポーネントごとのディレクトリ

`components/` では、コンポーネント1つにつきディレクトリを1つ作り、関連ファイルをまとめる。

```
components/deck/
├── index.ts          外から使うものだけを export する: export { Deck } from "./deck";
├── deck.tsx          コンポーネント本体
└── deck.client.ts    ブラウザ側の動作（あれば）
```

- 外からはディレクトリを import し、`index.ts` を経由する: `import { Deck } from "../components/deck";`（中のファイルを直接指さない）
- `index.ts` が export するのはコンポーネントだけ。`.client.ts` はビルドが自動で集めるので export しない

## 置き場所

| 種類                                                              | 場所                       | 例                    |
| ----------------------------------------------------------------- | -------------------------- | --------------------- |
| ページ（`Layout` で包み、ルートから `c.html()` で返す）           | `pages/`                   | `pages/player.tsx`    |
| 部品（ページや他の部品から使う。htmx の断片として返すものも含む） | `components/<名前>/`       | `components/card/`    |
| コンポーネントではない補助関数                                    | `helper/` に1関数1ファイル | `helper/audio-url.ts` |

- 型は `src/backend/db.ts` から `import type` で取り込む。データ取得はルート（`src/index.tsx`）で行い、ビューは props で受け取る。
- 新しいページは `src/index.tsx` からファイル単位で import する: `import { Player } from "./view/pages/player";`

## ブラウザで動くコード

コンポーネントの動作（クリック・音声再生・DOM 操作）は、そのコンポーネントの隣に `<名前>.client.ts` として置く。

- 例: `components/deck/deck.tsx` の動作は `components/deck/deck.client.ts`
- 複数の `.client.ts` で共有する処理は `helper/<名前>.client.ts`（例: `helper/audio-player.client.ts`）
- `.client.ts` は読み込まれた時点で動き出す。対象要素は `id` や `class` で探し、無いページでは何もしない
- htmx は npm の `htmx.org` を `import htmx from "htmx.org"` で使う（CDN からは読み込まない）。htmx の拡張は `helper/<名前>.client.ts` で `htmx.defineExtension` する（例: フォームを型付き JSON で送る `helper/htmx-json-enc.client.ts` の `json-enc-typed`）
- ブラウザ側の入口は `src/view/client.ts`。`app.css`（Tailwind）を読み込み、`import.meta.glob` で `src/view/**/*.client.ts` を自動で読み込む。新しい `.client.ts` を置けば登録は不要
- Vite がバンドルする。`pnpm dev` ではホットリロード、`pnpm build` で `dist/client/assets/app.js` / `app.css` を出力し、`Layout` がそれを読み込む
- `client.ts` と `.client.ts` は DOM 用の `tsconfig.client.json`、それ以外は Worker 用の `tsconfig.json` で型チェックされる

## スタイル（Tailwind CSS）

スタイルは Tailwind のユーティリティクラスを JSX の `class` に直接書く。コンポーネントごとの CSS ファイルは作らない。

- CSS ファイルは `src/view/app.css` の1つだけ。`@import "tailwindcss"`、`@theme`、`@custom-variant` など Tailwind の設定だけを書く
- htmx や JS が付け外しするクラスに応じたスタイルは `app.css` の `@custom-variant` で書き方を定義して使う（例: `flipped:rotate-y-0`、`swap-out-next:opacity-0`）
- 同じファイル内で繰り返すクラスの組み合わせは、ファイル内の定数にまとめる（例: `card.tsx` の `Face`）。複数のページで繰り返すまとまりは部品にする（例: `PageHeader`）
- JS が要素を探す目印のクラス（`speak`、`example`、`flipped` など）は、ユーティリティと並べて残す
- ページの幅は `Layout` の `wide` で切り替える
- Tailwind v4 の `translate-*` / `rotate-*` は `transform` ではなく `translate` / `rotate` プロパティを使う。アニメーションさせるときは `transition-[translate,rotate,opacity]` のように対象を合わせる

## 完了条件

`src/view` のどの `.tsx` も export されたコンポーネントがちょうど1つで、`components/` の各ディレクトリに `index.ts` があり、`pnpm format` で整形済みで、`pnpm lint`・`pnpm typecheck`・`pnpm build` が通る。
