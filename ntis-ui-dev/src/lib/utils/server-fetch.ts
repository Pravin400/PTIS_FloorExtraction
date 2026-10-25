// Shared serverFetch utility for consistent TLS handling
import { LOCAL_HTTPS_RE } from '@/services/api.service';

let relaxedTlsDispatcher: unknown;

export async function serverFetch(url: string, init: RequestInit): Promise<Response> {
  const isDev = (process.env.NODE_ENV === 'development' || process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0') && process.env.NTIS_STRICT_LOCAL_TLS !== '1';
  if (typeof window === 'undefined' && isDev && LOCAL_HTTPS_RE.test(url)) {
    const { Agent, fetch: uFetch } = await import('undici');
    relaxedTlsDispatcher ??= new Agent({ connect: { rejectUnauthorized: false } });
    return uFetch(url, { ...init, body: init.body ?? undefined, dispatcher: relaxedTlsDispatcher } as unknown as import('undici').RequestInit) as unknown as Promise<Response>;
  }
  return fetch(url, init);
}
