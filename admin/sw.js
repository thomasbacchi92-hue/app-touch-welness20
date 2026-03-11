const CACHE_NAME = 'tw-admin-v1';
const urlsToCache = [
  './admin.html',
  './manifest.json',
  './Admin_Menu.js',
  './Admin_Core.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});