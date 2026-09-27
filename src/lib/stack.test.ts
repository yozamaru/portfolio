import { describe, expect, it } from 'vitest';
import { categoryOf, normalizeStackName } from './stack';

describe('normalizeStackName', () => {
  it.each([
    ['Next.js 16', ['Next.js']],
    ['Python 3.12', ['Python']],
    ['Cloudflare Workers / Hono', ['Cloudflare Workers', 'Hono']],
    ['pdfminer.six / pypdf', ['pdfminer.six', 'pypdf']],
    ['Cloudflare D1', ['Cloudflare D1']],
    ['Leaflet / 地理院タイル', ['Leaflet', '地理院タイル']],
  ])('%s → %j', (input, expected) => {
    expect(normalizeStackName(input)).toEqual(expected);
  });
});

describe('categoryOf', () => {
  it('知っている技術は分類し、知らないものは other にする', () => {
    expect(categoryOf('Next.js')).toBe('frontend');
    expect(categoryOf('Hono')).toBe('backend');
    expect(categoryOf('LightGBM')).toBe('data');
    expect(categoryOf('Playwright')).toBe('quality');
    expect(categoryOf('Google フォーム')).toBe('other');
  });
});
