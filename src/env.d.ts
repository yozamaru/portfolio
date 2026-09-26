/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    /** 作品詳細ページで描画中の作品。MDX の <Decisions /> などが読む */
    work?: import('./lib/works').Work;
  }
}

interface ImportMetaEnv {
  /** Cloudflare Web Analytics のトークン（未設定なら計測タグを出さない） */
  readonly PUBLIC_CF_BEACON_TOKEN?: string;
  /** Cloudflare Turnstile のサイトキー（未設定ならテスト用のキーを使う） */
  readonly PUBLIC_TURNSTILE_SITE_KEY?: string;
}
