// 使い方:
//   npm run translations:hash -- <slug>          … ja.mdx の現在のハッシュを表示する
//   npm run translations:hash -- <slug> --write  … en.mdx の sourceHash を現在の値に書き換える
// 英訳を更新したら --write で sourceHash をそろえる。
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { currentHash, enPath, workSlugs } from './lib-works.ts';

const [slug, flag] = process.argv.slice(2);
if (!slug || !workSlugs().includes(slug)) {
  console.error(`作品の slug を指定してください: ${workSlugs().join(', ')}`);
  process.exit(1);
}

const hash = currentHash(slug);
if (flag !== '--write') {
  console.log(hash);
  process.exit(0);
}

const path = enPath(slug);
if (!existsSync(path)) {
  console.error(`${path} がありません。先に英訳を作ってください。`);
  process.exit(1);
}
const text = readFileSync(path, 'utf8');
if (!/^sourceHash:.*$/m.test(text)) {
  console.error(`${path} の frontmatter に sourceHash がありません。`);
  process.exit(1);
}
writeFileSync(path, text.replace(/^sourceHash:.*$/m, `sourceHash: '${hash}'`));
console.log(`${path}: sourceHash を ${hash} に更新しました`);
