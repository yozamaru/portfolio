import type { AstroGlobal } from 'astro';
import type { Work } from './works';

/** 作品詳細ページの中でだけ使える。MDX から呼ばれる部品が、描画中の作品を受け取るため */
export function currentWork(astro: AstroGlobal): Work {
  const work = astro.locals.work;
  if (!work) throw new Error('この部品は作品詳細ページ（/projects/[slug]/）の MDX の中でだけ使えます');
  return work;
}
