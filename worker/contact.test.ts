import { describe, expect, it, vi } from 'vitest';
import { handleContact, parseContact, type ContactEnv } from './contact';

const env: ContactEnv = {
  TURNSTILE_SECRET_KEY: 'secret',
  RESEND_API_KEY: 're_test',
  CONTACT_TO: 'me@example.com',
  CONTACT_FROM: 'naomaru.app <contact@naomaru.app>',
};

function form(values: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(values)) f.append(k, v);
  return f;
}

const valid = {
  name: '山田 太郎',
  email: 'taro@example.com',
  message: 'お仕事のご相談です。',
  lang: 'ja',
  'cf-turnstile-response': 'token',
};

function post(values: Record<string, string>): Request {
  return new Request('https://naomaru.app/api/contact', { method: 'POST', body: form(values) });
}

/** Turnstile と Resend への呼び出しを差し替える */
function fakeFetch({ human = true, sent = true } = {}) {
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes('turnstile')) return Response.json({ success: human });
    if (url.includes('resend')) return new Response('{}', { status: sent ? 200 : 500 });
    throw new Error(`unexpected fetch: ${url}`);
  }) as unknown as typeof fetch & ReturnType<typeof vi.fn>;
}

describe('parseContact', () => {
  it('正しい入力を受け付け、前後の空白を取り除く', () => {
    expect(parseContact(form({ ...valid, name: '  山田 太郎 ' }))).toEqual({
      name: '山田 太郎',
      email: 'taro@example.com',
      message: 'お仕事のご相談です。',
      lang: 'ja',
    });
  });

  it.each([
    ['名前が空', { name: '' }],
    ['メールアドレスの形式が違う', { email: 'not-an-email' }],
    ['本文が空', { message: '   ' }],
    ['本文が長すぎる', { message: 'あ'.repeat(5001) }],
    ['名前に改行が入っている（ヘッダーの差し込み対策）', { name: 'a\r\nBcc: x@example.com' }],
    ['ボット避けの欄に入力がある', { website: 'https://spam.example' }],
  ])('%s場合は受け付けない', (_, override) => {
    expect(parseContact(form({ ...valid, ...override }))).toBeUndefined();
  });

  it('言語は ja か en のどちらかにそろえる', () => {
    expect(parseContact(form({ ...valid, lang: 'fr' }))?.lang).toBe('ja');
    expect(parseContact(form({ ...valid, lang: 'en' }))?.lang).toBe('en');
  });
});

describe('handleContact', () => {
  it('Turnstile の確認が通れば、自分宛てにメールを送る', async () => {
    const fetcher = fakeFetch();
    const res = await handleContact(post(valid), env, fetcher);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });

    const [, init] = fetcher.mock.calls.find(([url]) => String(url).includes('resend'))!;
    const mail = JSON.parse(String((init as RequestInit).body));
    expect(mail.to).toEqual(['me@example.com']);
    expect(mail.reply_to).toBe('taro@example.com');
    expect(mail.text).toContain('お仕事のご相談です。');
  });

  it('Turnstile の確認に失敗したら、メールを送らずに 403 を返す', async () => {
    const fetcher = fakeFetch({ human: false });
    const res = await handleContact(post(valid), env, fetcher);
    expect(res.status).toBe(403);
    expect(await res.json()).toMatchObject({ error: 'captcha' });
    expect(fetcher.mock.calls.some(([url]) => String(url).includes('resend'))).toBe(false);
  });

  it('入力が不正なら、外部サービスを呼ばずに 400 を返す', async () => {
    const fetcher = fakeFetch();
    const res = await handleContact(post({ ...valid, email: 'x' }), env, fetcher);
    expect(res.status).toBe(400);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('メールの送信に失敗したら 502 を返す', async () => {
    const res = await handleContact(post(valid), env, fakeFetch({ sent: false }));
    expect(res.status).toBe(502);
    expect(await res.json()).toMatchObject({ error: 'send' });
  });

  it('POST 以外は 405 を返す', async () => {
    const res = await handleContact(new Request('https://naomaru.app/api/contact'), env, fakeFetch());
    expect(res.status).toBe(405);
  });
});
