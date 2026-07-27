// Service Worker - Version v2
const CACHE_NAME = 'link-importer-v2';

self.addEventListener('install', event => {
  // Force le nouveau Service Worker à devenir actif immédiatement sans attendre
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    // Nettoie les anciens caches (comme la v1)
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request).catch(() => new Response("Mode hors-ligne"))
  );
});
