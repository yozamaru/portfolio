import type { Lang } from './i18n/ui';

/** サイト全体の設定。名前や自己紹介はここだけを書き換える。 */
export const SITE = {
  url: 'https://naomaru.app',
  repo: 'https://github.com/yozamaru/portfolio',
  github: 'https://github.com/yozamaru',
  /** TODO: 本名に差し替える（企画書 §3：本名を出す） */
  name: { ja: 'naomaru', en: 'naomaru' },
  /** トップページの肩書き */
  role: {
    ja: 'プロダクトエンジニア',
    en: 'Product Engineer',
  },
  /** トップページの自己紹介（下書き。本人の確認待ち） */
  intro: {
    ja: '企画から設計・開発・公開・運用まで、一人でやり切るプロダクトづくりをしています。AIや統計の仕組みを、実際に使えるサービスに落とし込むことが得意です。',
    en: 'I build products end to end, from planning and design to development, launch, and operations. I specialize in turning AI and statistical methods into services people can actually use.',
  },
} satisfies {
  url: string;
  repo: string;
  github: string;
  name: Record<Lang, string>;
  role: Record<Lang, string>;
  intro: Record<Lang, string>;
};
