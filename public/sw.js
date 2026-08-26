// DokanDar Service Worker — STRUCTURE ONLY.
// Strategy:
//   - Static assets (JS/CSS/images): cache-first, fall back to network.
//   - GET /api/*:                    network-first, fall back to cached response.
//   - POST/PUT/DELETE /api/*:        forward; on failure, queue via Background Sync.
//   - Navigation requests offline:   serve /offline.html fallback.

const CACHE_NAME = 'dokandar-v1';
const OFFLINE_URL = '/offline.html'; // TODO: ship this static page from /app/offline/page.tsx
const STATIC_ASSETS = [
  '/',
  '/favicon.ico',
  '/manifest.json', // TODO: create public/manifest.json (PWA manifest)
  OFFLINE_URL,
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Drop stale caches from previous SW versions.
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))),
    ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle same-origin requests.
  if (url.origin !== self.location.origin) return;

  // Mutating API requests: try network, queue on failure for Background Sync.
  if (url.pathname.startsWith('/api/') && req.method !== 'GET') {
    event.respondWith(
      fetch(req.clone()).catch(async () => {
        // TODO: persist req body to the offline queue; register sync tag.
        try { await self.registration.sync.register('sync-offline-queue'); } catch (_) {}
        return new Response(JSON.stringify({ queued: true }), {
          status: 202,
          headers: { 'Content-Type': 'application/json' },
        });
      }),
    );
    return;
  }

  // Read API: network-first → cached.
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          return res;
        })
        .catch(() => caches.match(req)),
    );
    return;
  }

  // Static assets: cache-first.
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).catch(() => {
        // Navigation fallback when fully offline.
        if (req.mode === 'navigate') return caches.match(OFFLINE_URL);
        return Response.error();
      });
    }),
  );
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-offline-queue') {
    // TODO: postMessage to clients so the app can drain its IndexedDB queue.
    event.waitUntil(
      self.clients.matchAll({ includeUncontrolled: true }).then((clients) => {
        clients.forEach((c) => c.postMessage({ type: 'SYNC_QUEUE' }));
      }),
    );
  }
});
