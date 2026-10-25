/**
 * Cache buster utility for image and document URLs.
 * Ensures HTTP, HTTPS, and relative URLs get a timestamp query parameter to bypass browser caching,
 * while strictly leaving `data:` and `blob:` URLs unchanged so that Base64 and Object URLs are not invalidated.
 */

export function withCacheBuster(url?: string | null, customTimestamp?: number | string): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  // Data URLs (e.g. base64 image data) and Blob URLs MUST NOT have query strings appended
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  const timestamp = customTimestamp !== undefined ? customTimestamp : Date.now();
  if (trimmed.includes('?')) {
    if (trimmed.includes('t=')) {
      return trimmed;
    }
    return `${trimmed}&t=${timestamp}`;
  }
  return `${trimmed}?t=${timestamp}`;
}
