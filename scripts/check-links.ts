// ビルド結果（dist/）の中のリンク切れを調べる。サイト内のリンクと画像、ページ内の #id を対象にする。
// 外部サイトへのリンクは、相手の都合で落ちることがあるため調べない。
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const DIST = 'dist';
/** Worker が処理するパス（静的ファイルとしては存在しない） */
const DYNAMIC = [/^\/api\//];

if (!existsSync(DIST)) {
  console.error('dist/ がありません。先に npm run build を実行してください。');
  process.exit(1);
}

function htmlFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return htmlFiles(path);
    return name.endsWith('.html') ? [path] : [];
  });
}

/** URL のパスを dist/ の中のファイルに対応づける */
function resolveFile(pathname: string): string | undefined {
  const decoded = decodeURIComponent(pathname);
  const candidates = decoded.endsWith('/')
    ? [join(DIST, decoded, 'index.html')]
    : [join(DIST, decoded), join(DIST, `${decoded}.html`), join(DIST, decoded, 'index.html')];
  return candidates.find((c) => existsSync(c) && statSync(c).isFile());
}

const idCache = new Map<string, Set<string>>();
function idsOf(file: string): Set<string> {
  let ids = idCache.get(file);
  if (!ids) {
    ids = new Set([...readFileSync(file, 'utf8').matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]!));
    idCache.set(file, ids);
  }
  return ids;
}

const problems: string[] = [];
const files = htmlFiles(DIST);

for (const file of files) {
  const html = readFileSync(file, 'utf8');
  const page = '/' + relative(DIST, file).replace(/index\.html$/, '').replace(/\\/g, '/');
  const refs = [
    ...[...html.matchAll(/\s(?:href|src)="([^"]+)"/g)].map((m) => m[1]!),
    ...[...html.matchAll(/\ssrcset="([^"]+)"/g)].flatMap((m) => m[1]!.split(',').map((s) => s.trim().split(/\s+/)[0]!)),
  ];
  for (const raw of refs) {
    const ref = raw.replace(/&amp;/g, '&');
    if (/^(https?:|mailto:|tel:|data:|javascript:)/.test(ref) || ref.startsWith('//')) continue;
    const url = new URL(ref, `https://site.invalid${page}`);
    if (DYNAMIC.some((re) => re.test(url.pathname))) continue;
    const target = resolveFile(url.pathname);
    if (!target) {
      problems.push(`${file}: ${ref} が見つかりません`);
      continue;
    }
    const hash = decodeURIComponent(url.hash.slice(1));
    if (hash && target.endsWith('.html') && !idsOf(target).has(hash)) {
      problems.push(`${file}: ${ref} の #${hash} がリンク先のページにありません`);
    }
  }
}

if (problems.length > 0) {
  console.error(problems.join('\n'));
  console.error(`\nリンク切れが ${problems.length} 件あります。`);
  process.exit(1);
}
console.log(`✓ ${files.length} ページのリンクを確認しました。リンク切れはありません。`);
