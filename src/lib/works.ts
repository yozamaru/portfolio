import { readFileSync } from 'node:fs';
import { getCollection, render, type CollectionEntry } from 'astro:content';
import type { Lang } from '../i18n/ui';
import { sourceHash } from './source-hash.mjs';

type JaEntry = CollectionEntry<'works'>;
type EnEntry = CollectionEntry<'worksEn'>;

export type Translation = 'original' | 'translated' | 'stale' | 'missing';

export interface Work {
  slug: string;
  lang: Lang;
  /** 英語ページで翻訳がどうなっているか。日本語ページは常に original */
  translation: Translation;
  data: JaEntry['data'];
  /** 本文の描画に使うエントリ（英訳が無ければ日本語のエントリ） */
  bodyEntry: JaEntry | EnEntry;
}

/** 翻訳元の ja.mdx のハッシュ */
export function jaSourceHash(entry: JaEntry): string {
  if (!entry.filePath) throw new Error(`filePath がありません: ${entry.id}`);
  return sourceHash(readFileSync(entry.filePath, 'utf8'));
}

function localize(ja: JaEntry, en: EnEntry | undefined, lang: Lang): Work {
  if (lang === 'ja') {
    return { slug: ja.id, lang, translation: 'original', data: ja.data, bodyEntry: ja };
  }
  if (!en) {
    return { slug: ja.id, lang, translation: 'missing', data: ja.data, bodyEntry: ja };
  }
  const e = en.data;
  const screenshots = ja.data.screenshots.map((s, i) => ({
    ...s,
    alt: e.screenshotAlts?.[i] ?? s.alt,
  }));
  return {
    slug: ja.id,
    lang,
    translation: e.sourceHash === jaSourceHash(ja) ? 'translated' : 'stale',
    data: {
      ...ja.data,
      title: e.title ?? ja.data.title,
      tagline: e.tagline,
      screenshots,
      metrics: e.metrics ?? ja.data.metrics,
      stack: e.stack ?? ja.data.stack,
      decisions: e.decisions ?? ja.data.decisions,
    },
    bodyEntry: en,
  };
}

/**
 * 表示順：代表作が先頭、そのあとリリースが新しい順。
 * 未リリース（開発中）の作品は、リリース済みより新しいものとして扱う。
 */
function compareWorks(a: Work, b: Work): number {
  if (a.data.featured !== b.data.featured) return a.data.featured ? -1 : 1;
  const ta = a.data.releasedAt?.getTime() ?? Number.POSITIVE_INFINITY;
  const tb = b.data.releasedAt?.getTime() ?? Number.POSITIVE_INFINITY;
  if (ta !== tb) return tb - ta;
  const rank = { live: 0, beta: 1, developing: 2, archived: 3 } as const;
  if (a.data.status !== b.data.status) return rank[a.data.status] - rank[b.data.status];
  return a.slug.localeCompare(b.slug);
}

export async function getWorks(lang: Lang): Promise<Work[]> {
  const [jaEntries, enEntries] = await Promise.all([
    getCollection('works'),
    getCollection('worksEn'),
  ]);
  const enBySlug = new Map(enEntries.map((e) => [e.id, e]));
  for (const slug of enBySlug.keys()) {
    if (!jaEntries.some((j) => j.id === slug)) {
      throw new Error(`en.mdx に対応する ja.mdx がありません: src/content/works/${slug}/`);
    }
  }
  return jaEntries.map((ja) => localize(ja, enBySlug.get(ja.id), lang)).sort(compareWorks);
}

export async function renderWork(work: Work) {
  return render(work.bodyEntry);
}

/** About ページ用：全作品の技術を名前ごとにまとめる */
export function aggregateStack(works: Work[]): { name: string; works: Work[] }[] {
  const map = new Map<string, Work[]>();
  for (const work of works) {
    for (const { name } of work.data.stack) {
      const list = map.get(name) ?? [];
      if (!list.includes(work)) list.push(work);
      map.set(name, list);
    }
  }
  return [...map.entries()]
    .map(([name, ws]) => ({ name, works: ws }))
    .sort((a, b) => b.works.length - a.works.length || a.name.localeCompare(b.name));
}
