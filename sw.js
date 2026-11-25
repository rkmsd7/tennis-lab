// Tennis Lab service worker: app shell cached on install, pages and data network-first with cache fallback,
// YouTube thumbnails cache-first. Bump VERSION to invalidate.
const VERSION = 'tl-v1';
const SHELL = ['/', '/rackets', '/grip', '/accessories', '/players', '/generator', '/tournaments', '/rankings', '/player',
  '/css/style.css', '/js/common.js', '/assets/favicon.svg', '/assets/icon-192.png', '/assets/icon-512.png', '/manifest.webmanifest', '/offline'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => Promise.allSettled(SHELL.map(u => c.add(u)))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.hostname.endsWith('ytimg.com')) { // thumbnails: cache-first
    e.respondWith(caches.open(VERSION).then(async c => (await c.match(req)) || fetch(req).then(r => { c.put(req, r.clone()); return r; }).catch(() => Response.error())));
    return;
  }
  if (url.origin !== location.origin) return;
  // same-origin: network-first, fall back to cache, then to the offline page for navigations
  e.respondWith(fetch(req).then(r => { if (r.ok) caches.open(VERSION).then(c => c.put(req, r.clone())); return r; })
    .catch(async () => (await caches.match(req, { ignoreSearch: req.mode === 'navigate' })) || (req.mode === 'navigate' ? caches.match('/offline') : Response.error())));
});
