import type { Lang } from './i18n/ui';
import profilePhoto from './assets/profile.jpg';
import siteIcon from './assets/site-icon.png';

/** サイト全体の設定。名前や自己紹介はここだけを書き換える。 */
export const SITE = {
  url: 'https://naomaru.app',
  repo: 'https://github.com/yozamaru/portfolio',
  github: 'https://github.com/yozamaru',
  name: { ja: '與座 直寛', en: 'Naohiro Yoza' },
  /** トップページの肩書き */
  role: {
    ja: 'システムエンジニア',
    en: 'Systems Engineer',
  },
  /** トップページと About の自己紹介 */
  intro: {
    ja: 'システムエンジニアとして5年間、システム開発に携わってきました。個人でも、企画から設計・開発・公開・運用まで一人でやり切るプロダクトづくりをしています。AIや統計の仕組みを、実際に使えるサービスに落とし込むことが得意です。',
    en: 'I have worked as a systems engineer for five years. On my own, I also build products end to end, from planning and design to development, launch, and operations. I specialize in turning AI and statistical methods into services people can actually use.',
  },
  /** About の写真の横に添える、ひとこと */
  bio: {
    ja: 'バスケットボールが好きです。',
    en: 'I love basketball.',
  },
  /** サイトのアイコン（ヘッダーの印と OGP 画像。ファビコンは public/ に同じ絵柄の縮小版を置いている） */
  icon: siteIcon,
  /** プロフィール写真（位置情報などのメタデータは取り除いてある） */
  photo: profilePhoto,
  photoAlt: {
    ja: 'バスケットボールの試合会場の客席から、背番号18のユニフォームを着てコートを見下ろす後ろ姿',
    en: 'Seen from behind in the stands of a basketball arena, wearing a No. 18 jersey and looking down at the court',
  },
} satisfies {
  url: string;
  repo: string;
  github: string;
  name: Record<Lang, string>;
  role: Record<Lang, string>;
  intro: Record<Lang, string>;
  bio: Record<Lang, string>;
  icon: ImageMetadata;
  photo: ImageMetadata;
  photoAlt: Record<Lang, string>;
};
