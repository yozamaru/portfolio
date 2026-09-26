// 翻訳元 (ja.mdx) の内容から短いハッシュを作る。
// サイトのビルドと scripts/ の両方から使うため、素の JS にしている。
import { createHash } from 'node:crypto';

/**
 * @param {string} text ja.mdx の中身
 * @returns {string} 12 桁の 16 進数
 */
export function sourceHash(text) {
  const normalized = text.replace(/\r\n/g, '\n').trimEnd() + '\n';
  return createHash('sha256').update(normalized, 'utf8').digest('hex').slice(0, 12);
}
