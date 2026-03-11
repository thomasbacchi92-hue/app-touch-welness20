const CACHE_NAME = 'admin-cache-v1';
const urlsToCache = [
  './admin.html',
  './manifest.json'
];

// Installa il Service Worker e salva in cache i file base
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aperta');
        return cache.addAll(urlsToCache);
      })
  );
});

// Intercetta le richieste di rete
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Ritorna la risorsa dalla cache se esiste, altrimenti fa la chiamata di rete
        return response || fetch(event.request);
      })
  );
});