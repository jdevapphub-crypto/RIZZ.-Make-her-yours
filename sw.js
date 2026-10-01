const CACHE = 'rizz-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Domains that must NEVER be cached — always fetch fresh
const NEVER_CACHE = [
  'workers.dev',                    // your API worker
  'profitableratecpmnetwork.com',   // Adsterra / Profitableratecpmnetwork scripts
  'highperformanceformat.com',      // common Adsterra CDN
  'adsco.re',                       // Adsterra tracking
  'google-analytics.com',
  'googletagmanager.com'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const req = e.request;

  // Only handle GET requests — ignore POSTs (API calls, etc.)
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Never cache cross-origin ad / API requests — let the browser handle them
  if (NEVER_CACHE.some(domain => url.hostname.includes(domain))) return;

  // Only cache same-origin requests (your own app files)
  if (url.origin !== self.location.origin) return;

  // App shell: cache-first, fall back to network
  e.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req)
        .then(res => {
          // Cache successful GETs for our own origin
          if (res && res.status === 200 && res.type === 'basic') {
            const copy = res.clone();
            caches.open(CACHE).then(c => c.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match('./index.html')); // offline fallback
    })
  );
});
