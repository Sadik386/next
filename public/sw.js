const CACHE_NAME = 'accoraze-v1';
const STATIC_ASSETS = [
  '/',
  '/favicon.ico',
  '/manifest.json', // TODO: Create manifest
];

// TODO: Implement full Service Worker logic
self.addEventListener('install', (event: any) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

self.addEventListener('fetch', (event: any) => {
  // TODO: Implement stale-while-revalidate for static assets
  // TODO: Implement Network-only or Network-first for API
});

self.addEventListener('sync', (event: any) => {
  if (event.tag === 'sync-offline-queue') {
    // TODO: Trigger queue processing
  }
});
