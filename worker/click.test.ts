import { describe, expect, it, vi } from 'vitest';
import { handleClick, parseClick, type ClickEnv } from './click';

function fakeEnv() {
  const writeDataPoint = vi.fn();
  const env = { CLICKS: { writeDataPoint } } as unknown as ClickEnv;
  return { env, writeDataPoint };
}

const valid = { project: 'koukin-map', kind: 'service', placement: 'card', lang: 'ja' };

function post(body: unknown, origin: string | null = 'https://naomaru.app'): Request {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (origin) headers.Origin = origin;
  return new Request('https://naomaru.app/api/click', {
    method: 'POST',
    headers,
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

describe('parseClick', () => {
  it('正しい値を受け付ける', () => {
    expect(parseClick(valid)).toEqual(valid);
  });

  it('言語が不明なら ja として扱う', () => {
    expect(parseClick({ ...valid, lang: 'fr' })?.lang).toBe('ja');
  });

  it.each([
    ['プロジェクト名が不正', { ...valid, project: '../etc' }],
    ['プロジェクト名が長すぎる', { ...valid, project: 'a'.repeat(65) }],
    ['種類が不正', { ...valid, kind: 'other' }],
    ['置き場所が不正', { ...valid, placement: 'footer' }],
    ['オブジェクトでない', 'koukin-map'],
    ['null', null],
  ])('%s なら拒否する', (_label, value) => {
    expect(parseClick(value)).toBeUndefined();
  });
});

describe('handleClick', () => {
  it('正しいクリックを記録して 204 を返す', async () => {
    const { env, writeDataPoint } = fakeEnv();
    const res = await handleClick(post(valid), env);
    expect(res.status).toBe(204);
    expect(writeDataPoint).toHaveBeenCalledWith({
      indexes: ['koukin-map'],
      blobs: ['koukin-map', 'service', 'card', 'ja'],
      doubles: [1],
    });
  });

  it('POST 以外は 405', async () => {
    const { env, writeDataPoint } = fakeEnv();
    const res = await handleClick(new Request('https://naomaru.app/api/click'), env);
    expect(res.status).toBe(405);
    expect(writeDataPoint).not.toHaveBeenCalled();
  });

  it.each([
    ['よそのオリジン', 'https://evil.example'],
    ['Origin なし', null],
  ])('%s からの送信は 403', async (_label, origin) => {
    const { env, writeDataPoint } = fakeEnv();
    const res = await handleClick(post(valid, origin), env);
    expect(res.status).toBe(403);
    expect(writeDataPoint).not.toHaveBeenCalled();
  });

  it('JSON でなければ 400', async () => {
    const { env, writeDataPoint } = fakeEnv();
    const res = await handleClick(post('not json'), env);
    expect(res.status).toBe(400);
    expect(writeDataPoint).not.toHaveBeenCalled();
  });

  it('大きすぎる本文は 413', async () => {
    const { env, writeDataPoint } = fakeEnv();
    const res = await handleClick(post({ ...valid, padding: 'x'.repeat(2000) }), env);
    expect(res.status).toBe(413);
    expect(writeDataPoint).not.toHaveBeenCalled();
  });
});
