/**
 * 問い合わせフォームの処理。
 * 1. 入力を検証する  2. Turnstile でボットでないことを確かめる  3. Resend で自分宛てにメールを送る
 */
export interface ContactEnv {
  TURNSTILE_SECRET_KEY: string;
  RESEND_API_KEY: string;
  /** 問い合わせの送り先（自分のメールアドレス） */
  CONTACT_TO: string;
  /** 送信元。Resend で認証したドメインのアドレス（例: "naomaru.app <contact@naomaru.app>"） */
  CONTACT_FROM: string;
}

export type ContactError = 'invalid' | 'captcha' | 'send' | 'method';

export interface ContactInput {
  name: string;
  email: string;
  message: string;
  lang: 'ja' | 'en';
}

const LIMITS = { name: 100, email: 254, message: 5000 } as const;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** フォームの値を検証する。問題があれば undefined を返す */
export function parseContact(form: FormData): ContactInput | undefined {
  const get = (key: string) => {
    const value = form.get(key);
    return typeof value === 'string' ? value.trim() : '';
  };
  // 人には見えない欄に入力があるのはボット
  if (get('website') !== '') return undefined;
  const input = {
    name: get('name'),
    email: get('email'),
    message: get('message'),
    lang: get('lang') === 'en' ? 'en' : 'ja',
  } as const;
  if (!input.name || input.name.length > LIMITS.name) return undefined;
  if (!EMAIL_RE.test(input.email) || input.email.length > LIMITS.email) return undefined;
  if (!input.message || input.message.length > LIMITS.message) return undefined;
  // メールのヘッダーに改行を混ぜさせない
  if (/[\r\n]/.test(input.name) || /[\r\n]/.test(input.email)) return undefined;
  return input;
}

export async function verifyTurnstile(
  token: string,
  secret: string,
  ip: string | null,
  fetcher: typeof fetch = fetch,
): Promise<boolean> {
  if (!token) return false;
  const body = new FormData();
  body.append('secret', secret);
  body.append('response', token);
  if (ip) body.append('remoteip', ip);
  const res = await fetcher('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body,
  });
  if (!res.ok) return false;
  const result = (await res.json()) as { success?: boolean };
  return result.success === true;
}

export async function sendMail(input: ContactInput, env: ContactEnv, fetcher: typeof fetch = fetch): Promise<boolean> {
  const res = await fetcher('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.CONTACT_FROM,
      to: [env.CONTACT_TO],
      reply_to: input.email,
      subject: `[naomaru.app] お問い合わせ: ${input.name}`,
      text: [`お名前: ${input.name}`, `メール: ${input.email}`, `言語: ${input.lang}`, '', input.message].join('\n'),
    }),
  });
  return res.ok;
}

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

export async function handleContact(request: Request, env: ContactEnv, fetcher: typeof fetch = fetch): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ ok: false, error: 'method' }), {
      status: 405,
      headers: { Allow: 'POST', 'Content-Type': 'application/json; charset=utf-8' },
    });
  }
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json(400, { ok: false, error: 'invalid' satisfies ContactError });
  }
  const input = parseContact(form);
  if (!input) return json(400, { ok: false, error: 'invalid' satisfies ContactError });

  const token = form.get('cf-turnstile-response');
  const human = await verifyTurnstile(
    typeof token === 'string' ? token : '',
    env.TURNSTILE_SECRET_KEY,
    request.headers.get('CF-Connecting-IP'),
    fetcher,
  );
  if (!human) return json(403, { ok: false, error: 'captcha' satisfies ContactError });

  const sent = await sendMail(input, env, fetcher);
  if (!sent) return json(502, { ok: false, error: 'send' satisfies ContactError });
  return json(200, { ok: true });
}
