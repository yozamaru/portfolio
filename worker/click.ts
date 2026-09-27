/**
 * 外部リンク（「サービスを開く」「GitHub」）のクリックを数える。
 * ブラウザが navigator.sendBeacon で送ってくる小さな JSON を検証し、
 * Workers Analytics Engine に1件ずつ書き込む。個人を特定できる値（IP アドレスなど）は保存しない。
 * 集計は `npm run stats`（scripts/click-stats.ts）で見る。
 */
export interface ClickEnv {
  CLICKS: AnalyticsEngineDataset;
}

export const CLICK_KINDS = ['service', 'github'] as const;
export const CLICK_PLACEMENTS = ['card', 'detail'] as const;

export interface ClickInput {
  project: string;
  kind: (typeof CLICK_KINDS)[number];
  placement: (typeof CLICK_PLACEMENTS)[number];
  lang: 'ja' | 'en';
}

const SLUG_RE = /^[a-z0-9-]{1,64}$/;
const MAX_BODY = 1024;

/** 送られてきた値を検証する。問題があれば undefined を返す */
export function parseClick(value: unknown): ClickInput | undefined {
  if (typeof value !== 'object' || value === null) return undefined;
  const v = value as Record<string, unknown>;
  const { project, kind, placement, lang } = v;
  if (typeof project !== 'string' || !SLUG_RE.test(project)) return undefined;
  if (!CLICK_KINDS.includes(kind as ClickInput['kind'])) return undefined;
  if (!CLICK_PLACEMENTS.includes(placement as ClickInput['placement'])) return undefined;
  return {
    project,
    kind: kind as ClickInput['kind'],
    placement: placement as ClickInput['placement'],
    lang: lang === 'en' ? 'en' : 'ja',
  };
}

export async function handleClick(request: Request, env: ClickEnv): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(null, { status: 405, headers: { Allow: 'POST' } });
  }
  // よそのサイトから数を水増しされないよう、同じオリジンからの送信だけを受け付ける
  const origin = request.headers.get('Origin');
  if (origin !== new URL(request.url).origin) return new Response(null, { status: 403 });

  const text = await request.text();
  if (text.length > MAX_BODY) return new Response(null, { status: 413 });
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return new Response(null, { status: 400 });
  }
  const input = parseClick(body);
  if (!input) return new Response(null, { status: 400 });

  // blob1=プロジェクト、blob2=種類、blob3=置き場所、blob4=言語。index はプロジェクトで引けるようにする
  env.CLICKS.writeDataPoint({
    indexes: [input.project],
    blobs: [input.project, input.kind, input.placement, input.lang],
    doubles: [1],
  });
  return new Response(null, { status: 204 });
}
