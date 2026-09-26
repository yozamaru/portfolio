import { DEFAULT_LANG, ui, type Lang, type UiKey } from './ui';

export function t(lang: Lang, key: UiKey): string {
  return ui[lang][key];
}

/** 言語ごとのパス。日本語はルート、英語は /en/ 以下に置く。path は "/" から始め "/" で終える。 */
export function localePath(lang: Lang, path: string): string {
  return lang === DEFAULT_LANG ? path : `/${lang}${path}`;
}

/** 現在のパスから言語の接頭辞を取り除いたパス */
export function stripLang(pathname: string): string {
  const stripped = pathname.replace(/^\/en(?=\/|$)/, '');
  return stripped === '' ? '/' : stripped;
}

export const HTML_LANG: Record<Lang, string> = { ja: 'ja', en: 'en' };
export const OG_LOCALE: Record<Lang, string> = { ja: 'ja_JP', en: 'en_US' };

export function formatDate(lang: Lang, date: Date): string {
  return new Intl.DateTimeFormat(lang === 'ja' ? 'ja-JP' : 'en-US', {
    year: 'numeric',
    month: lang === 'ja' ? 'numeric' : 'short',
    timeZone: 'Asia/Tokyo',
  }).format(date);
}
