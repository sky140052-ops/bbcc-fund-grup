/**
 * DFI Progressive Web App Service Worker
 * Automatic Background Updates & Resilient Offline Caching
 */

const CACHE_NAME = 'dfi-pwa-v2026.6';
const CORE_ASSETS = [
  '/',
  '/manifest.json',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/pay',
  '/loan-apply',
  '/rules',
  '/contact',
  '/terms',
  '/privacy',
  '/refund',
];

// 1. Install Event: Skip waiting immediately to activate latest version
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CORE_ASSETS).catch((err) => {
        console.warn('[DFI Service Worker] Pre-cache warning:', err);
      });
    })
  );
});

// 2. Activate Event: Claim all clients immediately and remove stale caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch Event: Network-First Strategy for fresh data, fallback to Cache
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Never cache POST, PUT, DELETE or API requests (always network only)
  if (request.method !== 'GET' || request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache).catch(() => {});
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          if (request.mode === 'navigate') {
            return caches.match('/');
          }
        });
      })
  );
});

// 4. Message Event: Listen for update triggers from client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
