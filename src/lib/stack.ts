/** 技術構成の名前をそろえ、分類する（About の技術一覧で使う） */
export const STACK_CATEGORIES = ['frontend', 'backend', 'data', 'quality', 'other'] as const;
export type StackCategory = (typeof STACK_CATEGORIES)[number];

/** 技術名を分類する。載っていない名前は other に入る */
const CATEGORY_OF: Record<string, StackCategory> = {
  HTML: 'frontend',
  JavaScript: 'frontend',
  TypeScript: 'frontend',
  'Next.js': 'frontend',
  'Tailwind CSS': 'frontend',
  MDX: 'frontend',
  KaTeX: 'frontend',
  CodeMirror: 'frontend',
  Pyodide: 'frontend',
  Leaflet: 'frontend',
  地理院タイル: 'frontend',
  'GSI tiles': 'frontend',
  'Cloudflare Workers': 'backend',
  Hono: 'backend',
  'Cloudflare D1': 'backend',
  'Cloudflare Turnstile': 'backend',
  Supabase: 'backend',
  Resend: 'backend',
  Python: 'data',
  LightGBM: 'data',
  'pdfminer.six': 'data',
  pypdf: 'data',
  fontTools: 'data',
  openpyxl: 'data',
  xlrd: 'data',
  'JSON Schema': 'data',
  Vitest: 'quality',
  PGlite: 'quality',
  Playwright: 'quality',
  'axe-core': 'quality',
  'GitHub Actions': 'quality',
  Sentry: 'quality',
};

/**
 * 技術構成の表記を、集計用の名前にそろえる。
 * 「A / B」は2つに分け、末尾のバージョン番号（「Next.js 16」「Python 3.12」）は外す。
 */
export function normalizeStackName(name: string): string[] {
  return name
    .split(' / ')
    .map((part) => part.trim().replace(/\s+\d+(\.\d+)*$/, ''))
    .filter(Boolean);
}

/** 分類を返す。表に無い名前は other */
export function categoryOf(name: string): StackCategory {
  return CATEGORY_OF[name] ?? 'other';
}
