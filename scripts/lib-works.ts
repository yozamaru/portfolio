// scripts/ から使う、作品フォルダまわりの共通処理
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { sourceHash } from '../src/lib/source-hash.mjs';

export const WORKS_DIR = 'src/content/works';

export function workSlugs(): string[] {
  return readdirSync(WORKS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(join(WORKS_DIR, d.name, 'ja.mdx')))
    .map((d) => d.name)
    .sort();
}

export function jaPath(slug: string): string {
  return join(WORKS_DIR, slug, 'ja.mdx');
}

export function enPath(slug: string): string {
  return join(WORKS_DIR, slug, 'en.mdx');
}

export function currentHash(slug: string): string {
  return sourceHash(readFileSync(jaPath(slug), 'utf8'));
}

/** en.mdx の frontmatter にある sourceHash。無ければ undefined */
export function recordedHash(slug: string): string | undefined {
  const path = enPath(slug);
  if (!existsSync(path)) return undefined;
  return readFileSync(path, 'utf8').match(/^sourceHash:\s*['"]?([0-9a-f]+)['"]?\s*$/m)?.[1];
}
