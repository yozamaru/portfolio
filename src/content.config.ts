import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * 作品は src/content/works/<slug>/ に 1 フォルダずつ置く。
 *   ja.mdx … 正（必須）。事実データと日本語の文章をすべて持つ
 *   en.mdx … 英訳（任意）。翻訳する文章だけを持ち、無い項目は ja の値を使う
 */
const WORKS_BASE = './src/content/works';
const slugOf = ({ entry }: { entry: string }) => entry.split('/')[0]!;

export const STATUSES = ['live', 'beta', 'developing', 'archived'] as const;
export const CATEGORIES = ['webapp', 'tool', 'api', 'cli', 'extension', 'bot', 'library'] as const;

const metric = z.object({
  value: z.string(),
  label: z.string(),
});

const stackItem = z.object({
  name: z.string(),
  role: z.string(),
});

/** 設計の判断：課題 → 検討した選択肢 → 選んだ方法と理由 → 結果 */
const decision = z.object({
  title: z.string(),
  problem: z.string(),
  /** 記録が無ければ省略してよい（その場合は見出しごと表示しない） */
  options: z.array(z.string()).default([]),
  choice: z.string(),
  outcome: z.string(),
});

const works = defineCollection({
  loader: glob({ pattern: '*/ja.mdx', base: WORKS_BASE, generateId: slugOf }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      tagline: z.string().max(160),
      icon: image(),
      status: z.enum(STATUSES),
      category: z.enum(CATEGORIES),
      url: z.url().optional(),
      repo: z.url().optional(),
      /** 未リリースの作品は省略する */
      releasedAt: z.coerce.date().optional(),
      featured: z.boolean().default(false),
      /** リンクやタグなど細部に使う差し色 */
      accentColor: z
        .string()
        .regex(/^#[0-9a-fA-F]{6}$/)
        .optional(),
      screenshots: z.array(z.object({ src: image(), alt: z.string() })).min(1),
      metrics: z.array(metric).default([]),
      stack: z.array(stackItem).min(1),
      decisions: z.array(decision).default([]),
    }),
});

const worksEn = defineCollection({
  loader: glob({ pattern: '*/en.mdx', base: WORKS_BASE, generateId: slugOf }),
  schema: z.object({
    /** 翻訳元 ja.mdx のハッシュ。npm run translations:hash -- <slug> で更新する */
    sourceHash: z.string().regex(/^[0-9a-f]{12}$/),
    title: z.string().optional(),
    tagline: z.string().max(260),
    screenshotAlts: z.array(z.string()).optional(),
    metrics: z.array(metric).optional(),
    stack: z.array(stackItem).optional(),
    decisions: z.array(decision).optional(),
  }),
});

export const collections = { works, worksEn };
