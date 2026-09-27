/**
 * 外部リンクのクリック数を、Workers Analytics Engine（worker/click.ts が書き込む）から集計して表示する。
 *
 *   npm run stats            # 直近30日
 *   npm run stats -- 7       # 直近7日
 *
 * 環境変数 CLOUDFLARE_ACCOUNT_ID と CLOUDFLARE_API_TOKEN が必要。
 * トークンには「Account Analytics: Read」の権限が要る。
 */
export {};

const DATASET = 'portfolio_clicks';

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const token = process.env.CLOUDFLARE_API_TOKEN;
if (!accountId || !token) {
  console.error('CLOUDFLARE_ACCOUNT_ID と CLOUDFLARE_API_TOKEN を設定してください。');
  process.exit(1);
}

const days = Number(process.argv[2] ?? 30);
if (!Number.isInteger(days) || days < 1 || days > 90) {
  console.error('日数は 1〜90 の整数で指定してください（Analytics Engine のデータは90日で消えます）。');
  process.exit(1);
}

async function query<T>(sql: string): Promise<T[]> {
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/analytics_engine/sql`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: sql,
  });
  const text = await res.text();
  if (!res.ok) {
    console.error(`集計の取得に失敗しました（HTTP ${res.status}）: ${text}`);
    if (res.status === 401 || res.status === 403 || /auth/i.test(text)) {
      console.error('API トークンに「Account Analytics: Read」の権限があるか確認してください。');
    }
    process.exit(1);
  }
  return (JSON.parse(text) as { data: T[] }).data;
}

// _sample_interval は、Analytics Engine が間引いて保存したときの重み。足し合わせると実際の件数になる
const where = `timestamp > NOW() - INTERVAL '${days}' DAY`;

const totals = await query<{ project: string; kind: string; clicks: string }>(`
  SELECT blob1 AS project, blob2 AS kind, SUM(_sample_interval) AS clicks
  FROM ${DATASET}
  WHERE ${where}
  GROUP BY project, kind
  ORDER BY clicks DESC
`);

const daily = await query<{ day: string; project: string; clicks: string }>(`
  SELECT toStartOfDay(timestamp) AS day, blob1 AS project, SUM(_sample_interval) AS clicks
  FROM ${DATASET}
  WHERE ${where} AND blob2 = 'service'
  GROUP BY day, project
  ORDER BY day DESC, project
`);

console.log(`\n直近${days}日のクリック数（プロジェクト × リンクの種類）`);
if (totals.length === 0) console.log('  まだ記録がありません。');
else
  console.table(
    totals.map((r) => ({
      プロジェクト: r.project,
      種類: r.kind === 'service' ? 'サービスを開く' : 'GitHub',
      クリック数: Number(r.clicks),
    })),
  );

console.log(`\n「サービスを開く」の日ごとのクリック数（UTC）`);
if (daily.length === 0) console.log('  まだ記録がありません。');
else
  console.table(
    daily.map((r) => ({ 日付: r.day.slice(0, 10), プロジェクト: r.project, クリック数: Number(r.clicks) })),
  );
