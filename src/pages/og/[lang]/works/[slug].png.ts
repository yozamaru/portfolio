import type { APIRoute, GetStaticPaths } from 'astro';
import { LANGS } from '../../../../i18n/ui';
import { assetFsPath, pngResponse, renderOg } from '../../../../lib/og';
import { getWorks, type Work } from '../../../../lib/works';
import { SITE } from '../../../../site';

export const getStaticPaths = (async () => {
  const paths = [];
  for (const lang of LANGS) {
    for (const work of await getWorks(lang)) {
      paths.push({ params: { lang, slug: work.slug }, props: { work } });
    }
  }
  return paths;
}) satisfies GetStaticPaths;

export const GET: APIRoute<{ work: Work }> = async ({ props }) => {
  const { work } = props;
  const png = await renderOg({
    title: work.data.title,
    subtitle: work.data.tagline,
    footer: `${SITE.name[work.lang]} · naomaru.app`,
    iconPath: assetFsPath(work.data.icon),
    accent: work.data.accentColor,
  });
  return pngResponse(png);
};
