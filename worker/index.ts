import { handleContact, type ContactEnv } from './contact';

interface Env extends ContactEnv {
  ASSETS: Fetcher;
}

/**
 * wrangler.jsonc の run_worker_first により、この Worker が動くのは /api/* だけ。
 * それ以外のページや画像は、Worker を通さず静的ファイルとして配信される。
 */
export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/api/contact') {
      return handleContact(request, env);
    }
    if (url.pathname.startsWith('/api/')) {
      return new Response('Not Found', { status: 404 });
    }
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
