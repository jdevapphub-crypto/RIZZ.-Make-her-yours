const CACHE = 'rizz-v3';
const FILES = [
  './',
  './index.html',
  './manifest.json',
  './app.js',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => 
      Promise.all(keys.map(k => k !== CACHE ? caches.delete(k) : null))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // NEVER cache API - always go to network
  if (e.request.url.includes('workers.dev') || e.request.url.includes('groq.com')) {
    return;
  }
  
  e.respondWith(
    caches.match(e.request).then(cached => {
      return cached || fetch(e.request).then(res => {
        // Cache new files
        return caches.open(CACHE).then(cache => {
          cache.put(e.request, res.clone());
          return res;
        });
      }).catch(() => cached);
    })
  );
});
