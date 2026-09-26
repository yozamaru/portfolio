// 英訳が日本語版より古くなっていないかを確かめる。
// 古い・無い英訳は警告として出すだけで、失敗にはしない（英語は任意のため）。
// --strict を付けると、古い英訳があるときに失敗させる。
import { currentHash, recordedHash, workSlugs } from './lib-works.ts';

const strict = process.argv.includes('--strict');
const inGitHubActions = process.env.GITHUB_ACTIONS === 'true';
let stale = 0;

for (const slug of workSlugs()) {
  const recorded = recordedHash(slug);
  const current = currentHash(slug);
  const file = `src/content/works/${slug}/en.mdx`;
  if (recorded === undefined) {
    console.log(`・${slug}: 英訳はまだありません（英語ページでは日本語を表示します）`);
  } else if (recorded !== current) {
    stale += 1;
    const message = `${slug}: 英訳が古くなっています（sourceHash ${recorded} → 現在の日本語版 ${current}）。英訳を更新して npm run translations:hash -- ${slug} --write を実行してください。`;
    console.log(inGitHubActions ? `::warning file=${file}::${message}` : `⚠ ${message}`);
  } else {
    console.log(`✓ ${slug}: 英訳は最新です`);
  }
}

if (strict && stale > 0) process.exit(1);
