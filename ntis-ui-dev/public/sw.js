// Grievance Portal Service Worker
const CACHE_PREFIX = 'amc-grievance-';
const CACHE_VERSION = 'v3';
const CACHE_NAME = `${CACHE_PREFIX}${CACHE_VERSION}`;

// Precache essential static assets only (no authenticated HTML pages)
const STATIC_PRECACHE = [
  '/manifest.json',
  '/favicon.ico',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-maskable-512x512.png',
];

// Whitelist of public citizen routes eligible for offline caching
const PUBLIC_PORTAL_PATTERN = /^\/(?:en|hi|mr)\/(?:grievance(?!\/admin)|departments)(?:\/.*)?$/i;

function isPublicGrievanceRoute(url) {
  // Never cache admin or back-office routes
  if (url.pathname.includes('/admin')) return false;
  return PUBLIC_PORTAL_PATTERN.test(url.pathname);
}

function isCacheableResponse(response) {
  if (!response || response.status !== 200 || response.type !== 'basic') {
    return false;
  }
  const cacheControl = response.headers.get('cache-control');
  if (cacheControl && (cacheControl.includes('no-store') || cacheControl.includes('private'))) {
    return false;
  }
  return true;
}

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await Promise.allSettled(
        STATIC_PRECACHE.map((url) =>
          cache.add(url).catch((err) => {
            console.warn('[SW] Pre-caching warning for ' + url + ':', err);
          })
        )
      );
    })
  );
});

// Activation: Clean up old versions ONLY within this PWA's cache namespace
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => {
        return Promise.all(
          keys
            .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
            .map((key) => {
              console.log('[SW] Purging old namespace cache:', key);
              return caches.delete(key);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only intercept GET requests
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Skip browser extensions and non-HTTP schemes
  if (!url.protocol.startsWith('http')) return;

  // Never intercept development server, webpack chunks, Next.js internal calls, or API calls
  if (
    url.hostname === 'localhost' ||
    url.hostname === '127.0.0.1' ||
    url.port === '3000' ||
    url.pathname.includes('/_next/') ||
    url.pathname.includes('/__nextjs') ||
    url.pathname.includes('/api/')
  ) {
    return;
  }

  // Strategy 1: Public static assets (icons, manifest, favicon, static images) -> Cache-first
  if (
    url.pathname.startsWith('/icons/') ||
    url.pathname === '/manifest.json' ||
    url.pathname === '/favicon.ico' ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|webp|ico|woff2?)$/i)
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (isCacheableResponse(response)) {
            const responseToCache = response.clone();
            if (event.waitUntil) {
              event.waitUntil(
                caches.open(CACHE_NAME).then((cache) => cache.put(request, responseToCache))
              );
            }
          }
          return response;
        });
      })
    );
    return;
  }

  // Strategy 2: Page navigations
  if (request.mode === 'navigate') {
    // If request is NOT a public citizen grievance page, NEVER cache or read from cache (security protection)
    if (!isPublicGrievanceRoute(url)) {
      event.respondWith(
        fetch(request).catch(() => {
          return new Response(
            '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Network Connection Required</title><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="font-family:sans-serif;text-align:center;padding:40px;background:#0f172a;color:#f8fafc;"><h2>Internet Connection Required</h2><p>This authenticated page requires an active internet connection.</p><p style="margin-top:20px;"><a href="/en/grievance" style="color:#10b981;text-decoration:underline;">Go to Citizen Grievance Portal</a></p></body></html>',
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        })
      );
      return;
    }

    // Public citizen portal navigation -> Network-first with cache fallback
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (isCacheableResponse(response)) {
            const responseToCache = response.clone();
            if (event.waitUntil) {
              event.waitUntil(
                caches.open(CACHE_NAME).then((cache) => cache.put(request, responseToCache))
              );
            }
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          return new Response(
            '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Grievance Portal Offline</title><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="font-family:sans-serif;text-align:center;padding:40px;background:#0f172a;color:#f8fafc;"><h2>Grievance Portal Offline</h2><p>Please check your internet connection and reload.</p></body></html>',
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        })
    );
    return;
  }
});
