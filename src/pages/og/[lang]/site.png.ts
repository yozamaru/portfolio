import type { APIRoute, GetStaticPaths } from 'astro';
import { LANGS, type Lang } from '../../../i18n/ui';
import { t } from '../../../i18n/utils';
import { assetFsPath, pngResponse, renderOg } from '../../../lib/og';
import { SITE } from '../../../site';

export const getStaticPaths = (() => LANGS.map((lang) => ({ params: { lang } }))) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ params }) => {
  const lang = params.lang as Lang;
  const png = await renderOg({
    title: SITE.name[lang],
    subtitle: `${SITE.role[lang]} — ${t(lang, 'home.catch')}`,
    footer: 'naomaru.app',
    iconPath: assetFsPath(SITE.icon),
  });
  return pngResponse(png);
};
