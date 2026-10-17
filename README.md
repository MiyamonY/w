# 単語帳

英単語を覚えるための個人用 Web アプリ。Cloudflare Workers 上で動き、Cloudflare Access で自分だけが使えるようにしている。

## 機能

- 単語カード: 表面・裏面を自動で切り替えて再生する。音声の自動再生、お気に入り、続きからの再生に対応
- 単語リスト: グループやお気に入りで絞り込んで一覧する
- 4択テスト: 空所補充の4択と、英単語から意味を選ぶ4択。直近の結果を見ながら解ける
- 英文テスト: グループの単語を使った英文を OpenAI の API で生成し、意味がわかるか確かめる
- PWA としてインストールできる

## 構成

- Cloudflare Workers + Hono（JSX でサーバー側描画）+ htmx
- D1（データ）、R2（音声・画像）
- Vite でビルドし、GitHub Actions からデプロイする

## 開発

```sh
pnpm install
pnpm db:migrate:local
pnpm dev
```

```sh
pnpm format   # 整形（確認だけなら pnpm format:check）
pnpm lint
pnpm typecheck
```

デプロイに必要な値（D1 の ID、Access の設定など）は環境変数で渡し、リポジトリには載せない。
