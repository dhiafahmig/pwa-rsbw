/*
  FILE INI MENGGABUNGKAN SERVICE WORKER PWA & ONESIGNAL
*/

// 1. Impor file OneSignal yang BENAR untuk digabung
// Kita pakai 'OneSignalSDK.sw.js' dari CDN (yang bekerja)
try {
  importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");
  console.log("✅ OneSignalSDK.sw.js berhasil diimpor.");
} catch (e) {
  console.warn("⚠️ OneSignalSDK.sw.js gagal diimpor (CDN timeout/network issue):", e.message);
  // Lanjutkan meski gagal - OneSignal SDK tidak critical untuk PWA
  // Push notifications mungkin tidak bekerja, tapi app tetap berfungsi
}


// 2. Kode PWA Anda yang sudah ada
const CACHE_NAME = 'dpjp-app-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/offline.html'
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('SW PWA: Opened cache');
        // Cache static assets
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
  // (PENTING: Jangan ganggu request OneSignal)
  if (event.request.url.includes("onesignal")) {
    return;
  }

  // Handle GET requests only
  if (event.request.method !== 'GET') {
    return;
  }

  // Logika cache-first untuk static assets
  // Network-first untuk API calls
  const url = new URL(event.request.url);
  const isApi = url.pathname.includes('/api/');

  if (isApi) {
    // Network-first untuk API
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache valid responses
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback ke cache jika offline
          return caches.match(event.request)
            .then(cached => cached || new Response('Offline', { status: 503 }));
        })
    );
  } else {
    // Cache-first untuk static assets
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          // Return cached version atau fetch dari network
          return response || fetch(event.request)
            .then(response => {
              // Cache new responses
              if (response && response.status === 200) {
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then(cache => {
                  cache.put(event.request, responseClone);
                });
              }
              return response;
            })
            .catch(() => {
              // Offline fallback
              if (event.request.destination === 'document') {
                return caches.match('/offline.html');
              }
              return new Response('Resource not available offline', { status: 503 });
            });
        })
    );
  }
});