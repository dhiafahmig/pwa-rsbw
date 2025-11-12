/*
  FILE INI MENGGABUNGKAN SERVICE WORKER PWA & ONESIGNAL
*/

// ✅ PERBAIKAN: Impor file LOKAL, bukan dari CDN
try {
  importScripts("OneSignalSDKWorker.js"); // <-- INI PERUBAHANNYA
  console.log("✅ OneSignalSDKWorker.js LOKAL berhasil diimpor.");
} catch (e) {
  console.error("❌ Gagal mengimpor OneSignalSDKWorker.js LOKAL:", e);
}

// 2. Kode PWA Anda
const CACHE_NAME = 'dpjp-app-v2';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/offline.html' // Pastikan file /public/offline.html ada
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('SW PWA: Opened cache');
        const cachePromises = urlsToCache.map(url => {
          return cache.add(url).catch(err => {
            console.warn(`SW PWA: Gagal cache ${url}:`, err);
          });
        });
        return Promise.all(cachePromises);
      })
      .then(() => self.skipWaiting()) // Activate immediately
  );
});

// Activate event - Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('SW PWA: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  // Biarkan OneSignal menangani fetch-nya sendiri
  if (event.request.url.includes("onesignal") || event.request.url.includes("OneSignalSDKWorker.js")) {
    return;
  }
  // Logika PWA Anda
  if (event.request.method !== 'GET') {
    return;
  }
  const url = new URL(event.request.url);
  const isApi = url.pathname.includes('/api/');
  if (isApi) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request)
            .then(cached => cached || new Response('Offline', { status: 503 }));
        })
    );
  } else {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          return response || fetch(event.request)
            .then(response => {
              if (response && response.status === 200) {
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then(cache => {
                  cache.put(event.request, responseClone);
                });
              }
              return response;
            })
            .catch(() => {
              if (event.request.destination === 'document') {
                return caches.match('/offline.html');
              }
              return new Response('Resource not available offline', { status: 503 });
            });
        })
    );
  }
});