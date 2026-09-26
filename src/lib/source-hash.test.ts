import { describe, expect, it } from 'vitest';
import { sourceHash } from './source-hash.mjs';

describe('sourceHash', () => {
  it('12 桁の 16 進数を返す', () => {
    expect(sourceHash('# タイトル\n')).toMatch(/^[0-9a-f]{12}$/);
  });

  it('改行コードや末尾の空行の違いでは変わらない', () => {
    expect(sourceHash('a\r\nb\r\n')).toBe(sourceHash('a\nb'));
    expect(sourceHash('a\nb\n\n\n')).toBe(sourceHash('a\nb\n'));
  });

  it('本文が変われば変わる', () => {
    expect(sourceHash('a\nb\n')).not.toBe(sourceHash('a\nc\n'));
  });
});
