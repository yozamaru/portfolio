# CLAUDE.md

naomaru.app のポートフォリオサイト。企画は `docs/PLAN.md`、構成と手順は `README.md` を読むこと。

## よく頼まれる作業

### 作品を追加する

1. `src/content/works/<slug>/` を作る（slug は URL になる。英小文字とハイフン）。
2. `icon.png`（正方形、512px 程度）と `screenshots/*.webp`（1枚以上）を置く。
3. `ja.mdx` を書く。項目は `src/content.config.ts` の `works` のスキーマに従う。既存の `src/content/works/himotoku-ai/ja.mdx` が見本。
   - 本文は `## なぜ作ったか` → `## 主な機能` → `## 設計の判断`（`<Decisions />`）→ `## 技術構成`（`<TechStack />`）→ `## 品質と運用` → `## 振り返りとこれから` の順。
   - `<Decisions />` と `<TechStack />` は frontmatter の `decisions` と `stack` を表示する部品。MDX の先頭で import する。
   - `decisions` は2〜4件。`options`（検討した選択肢）は、実際に検討した記録がなければ書かない。作り話をしない。
   - 数字（`metrics`）は載せない方針（本人の判断）。書かなければ「数字」の欄は表示されない。
4. 英訳 `en.mdx` を作る（下の「翻訳のルール」）。
5. `npm run build && npm run check:links && npm run check:translations` が通ることを確かめる。

### 作品の状態を変える（例：開発中の作品をリリースした）

`ja.mdx` の `status` を `live` にし、`releasedAt` を入れる。`ja.mdx` を変えたので、英訳の `sourceHash` も更新する（下のルール）。

## 翻訳のルール

- 日本語（`ja.mdx`）が正。英語（`en.mdx`）は任意で、無ければ英語ページは日本語のまま表示される。
- 翻訳は AI が担当する。**`ja.mdx` を変更したら、同じ作業の中で `en.mdx` も更新する。**
- `en.mdx` に書くのは翻訳する項目だけ（`title`, `tagline`, `screenshotAlts`, `stack`, `decisions` と本文）。URL・状態・日付・画像などは `ja.mdx` の値が使われる。
- 英訳を更新したら `npm run translations:hash -- <slug> --write` で `sourceHash` をそろえる。
  そろっていないと、ビルド後の英語ページに「翻訳が古い」注記が出て、CI で警告が出る。
- `npm run check:translations` で全作品の状態を確認できる。
- 画面の固定文言は `src/i18n/ui.ts`。日英の両方が必須（欠けると型チェックで失敗する）。

## コマンド

| コマンド | 内容 |
|---|---|
| `npm run dev` | 開発サーバー |
| `npm run build` | ビルド（作品データのスキーマ検証を含む。OGP 画像の生成に Google Fonts へのアクセスが必要） |
| `npm run check` | 型チェック（Astro と Worker） |
| `npm test` | 単体テスト（Vitest） |
| `npm run check:links` | `dist/` のリンク切れ確認 |
| `npm run check:translations` | 英訳が古くなっていないかの確認 |
| `npm run preview` | ビルドして `wrangler dev` で Worker ごと動かす |

## 守ること

- 秘密情報（API キー、送り先のメールアドレス）はコミットしない。`wrangler secret put` で登録する。
- 運用費は年0円を保つ。有料の仕組みを足す前に本人に確認する。
- 本人の情報は `docs/PLAN.md` §3 の範囲だけを載せる（本名は出す、経歴・会社名は載せない）。
