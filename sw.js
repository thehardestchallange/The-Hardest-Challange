const CACHE = 'thc-v1';
const ASSETS = [
  './',
  './index.html',
  './game.js',
  './manifest.json',
  './icon.png',
  'https://cdn.jsdelivr.net/npm/kaboom@3000.1.17/dist/kaboom.js'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
