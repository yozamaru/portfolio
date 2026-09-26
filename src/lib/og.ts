import { readFile } from 'node:fs/promises';
import satori from 'satori';
import sharp from 'sharp';
import { Resvg } from '@resvg/resvg-js';

/**
 * ビルド時に OGP 画像（1200×630）を作る。
 * 日本語フォントはリポジトリに置かず、Google Fonts から「画像に使う文字だけ」を取り寄せる。
 */
const WIDTH = 1200;
const HEIGHT = 630;
const fontCache = new Map<string, Promise<ArrayBuffer>>();

async function loadFont(text: string, weight: 400 | 800): Promise<ArrayBuffer> {
  const chars = [...new Set(text)].sort().join('');
  const key = `${weight}:${chars}`;
  let cached = fontCache.get(key);
  if (!cached) {
    cached = (async () => {
      const cssUrl = `https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@${weight}&text=${encodeURIComponent(chars)}`;
      // User-Agent を付けないと TrueType（satori が読める形式）が返る
      const css = await (await fetch(cssUrl)).text();
      const url = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1];
      if (!url) throw new Error(`OGP 用のフォントを取得できませんでした: ${cssUrl}`);
      return (await fetch(url)).arrayBuffer();
    })();
    fontCache.set(key, cached);
  }
  return cached;
}

/** 画像を data URL にする。アイコンは元が大きいので縮めてから埋め込む */
async function iconDataUrl(fsPath: string, size: number): Promise<string> {
  const png = await sharp(await readFile(fsPath)).resize(size, size).png().toBuffer();
  return `data:image/png;base64,${png.toString('base64')}`;
}

/** astro:assets の画像オブジェクトからファイルシステム上のパスを得る */
export function assetFsPath(image: { src: string; fsPath?: string }): string {
  const withFsPath = image as { fsPath?: string };
  if (withFsPath.fsPath) return withFsPath.fsPath;
  // 開発サーバーでは src が /@fs/... になる
  const match = image.src.match(/^\/@fs(\/[^?]+)/);
  if (match) return match[1]!;
  throw new Error(`画像のパスを解決できません: ${image.src}`);
}

interface OgInput {
  title: string;
  subtitle: string;
  footer: string;
  /** アイコン画像のファイルパス（無ければサイトのマーク） */
  iconPath?: string;
  accent?: string;
}

type Node = { type: string; props: Record<string, unknown> & { children?: unknown } };
const h = (type: string, style: Record<string, unknown>, children?: unknown, extra: Record<string, unknown> = {}): Node => ({
  type,
  props: { style, children, ...extra },
});

export async function renderOg({ title, subtitle, footer, iconPath, accent = '#1d5be0' }: OgInput): Promise<Buffer> {
  const allText = title + subtitle + footer;
  const [regular, bold] = await Promise.all([loadFont(allText, 400), loadFont(allText, 800)]);
  const icon = iconPath
    ? h('img', { width: 168, height: 168, borderRadius: 38 }, undefined, {
        src: await iconDataUrl(iconPath, 336),
        width: 168,
        height: 168,
      })
    : h(
        'div',
        {
          width: 168,
          height: 168,
          borderRadius: 38,
          display: 'flex',
          background: 'linear-gradient(135deg, #1d5be0, #0b1f5c)',
          position: 'relative',
        },
        h('div', {
          position: 'absolute',
          right: 30,
          top: 30,
          width: 42,
          height: 42,
          borderRadius: 21,
          background: '#f28c28',
        }),
      );

  const tree = h(
    'div',
    {
      width: WIDTH,
      height: HEIGHT,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '72px 80px',
      background: 'linear-gradient(135deg, #ffffff 0%, #eef3ff 60%, #fff4e8 100%)',
      fontFamily: 'Noto Sans JP',
      color: '#0e1630',
    },
    [
      h('div', { display: 'flex', alignItems: 'center', gap: 48 }, [
        icon,
        h('div', { display: 'flex', flexDirection: 'column', flex: 1, gap: 20 }, [
          h('div', { fontSize: 64, fontWeight: 800, lineHeight: 1.2, letterSpacing: -1 }, title),
          h('div', { fontSize: 30, lineHeight: 1.55, color: '#4a5572', display: 'flex' }, subtitle),
        ]),
      ]),
      h('div', { display: 'flex', alignItems: 'center', justifyContent: 'space-between' }, [
        h('div', { fontSize: 28, fontWeight: 800, color: '#0b1f5c' }, footer),
        h('div', { width: 180, height: 10, borderRadius: 5, background: accent, display: 'flex' }),
      ]),
    ],
  );

  const svg = await satori(tree as unknown as Parameters<typeof satori>[0], {
    width: WIDTH,
    height: HEIGHT,
    fonts: [
      { name: 'Noto Sans JP', data: regular, weight: 400, style: 'normal' },
      { name: 'Noto Sans JP', data: bold, weight: 800, style: 'normal' },
    ],
  });
  return new Resvg(svg, { fitTo: { mode: 'width', value: WIDTH } }).render().asPng();
}

export function pngResponse(png: Buffer): Response {
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
}

