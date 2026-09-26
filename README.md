# naomaru.app

個人開発したWebアプリやツールを紹介するポートフォリオサイトです。
https://naomaru.app

- 企画：[`docs/PLAN.md`](docs/PLAN.md)
- 作品の追加と翻訳の手順：[`CLAUDE.md`](CLAUDE.md)

## 構成

| 領域 | 採用 |
|---|---|
| フレームワーク | Astro（Content Collections＋Zod で作品データを検証） |
| 配信 | Cloudflare Workers（静的アセット配信。`/api/*` だけ Worker が処理） |
| 問い合わせ | Cloudflare Turnstile＋Workers → Resend |
| OGP 画像 | ビルド時に satori と resvg で生成 |
| アクセス解析 | Cloudflare Web Analytics |

```
src/
  content/works/<slug>/   作品。ja.mdx（正）と en.mdx（英訳・任意）、icon.png、screenshots/
  content.config.ts       作品データのスキーマ
  i18n/                   画面の固定文言（日英）と言語まわりの処理
  views/                  ページの中身（日本語と英語のルートで共有）
  pages/                  ルート。/ が日本語、/en/ が英語。/og/ は OGP 画像
  lib/works.ts            作品の読み込み、英訳との合成、並び順
worker/                   /api/contact を処理する Worker とテスト
scripts/                  リンク切れと翻訳の鮮度を調べるスクリプト
```

## 開発

Node.js 22.18 以上が必要です。

```sh
npm install
npm run dev          # http://localhost:4321
npm run build        # dist/ に書き出す
npm run preview      # Worker ごとローカルで動かす（.dev.vars.example を .dev.vars にコピーしてから）
```

確認用のコマンドは `npm run check`（型）、`npm test`（単体テスト）、`npm run check:links`（リンク切れ）、`npm run check:translations`（英訳の鮮度）です。CI では、これらをプルリクエストごとに実行します。

## 公開の手順（初回だけ）

1. **Resend**：`naomaru.app` をドメインとして追加し、表示される DNS レコードを Cloudflare に登録する。
2. **Turnstile**：Cloudflare のダッシュボードでウィジェットを作り、ホスト名に `naomaru.app` を登録する。サイトキーとシークレットキーを控える。
3. **Worker を作る**：Cloudflare のダッシュボードの「Workers & Pages」→「作成」→「Git リポジトリをインポート」で、このリポジトリを接続する。
   - ビルドコマンド：`npm run build`、デプロイコマンド：`npx wrangler deploy`
   - ビルドの環境変数：`PUBLIC_TURNSTILE_SITE_KEY`（Turnstile のサイトキー）、`PUBLIC_CF_BEACON_TOKEN`（Web Analytics のトークン。任意）
   - 以後は `main` への push で自動的にデプロイされる。
4. **秘密情報を登録する**：
   ```sh
   npx wrangler secret put TURNSTILE_SECRET_KEY
   npx wrangler secret put RESEND_API_KEY
   npx wrangler secret put CONTACT_TO      # 問い合わせを受け取るメールアドレス
   ```
5. **ドメイン**：`wrangler.jsonc` の `routes` で `naomaru.app` をカスタムドメインにしている。初回のデプロイで自動的に割り当てられる。
6. **Web Analytics**：Cloudflare のダッシュボードで `naomaru.app` のサイトを追加し、トークンを `PUBLIC_CF_BEACON_TOKEN` に設定する。
