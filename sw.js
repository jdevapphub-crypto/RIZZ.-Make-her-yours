const CACHE_NAME = 'rizz-crm-v4';

const APP_FILES = [
    './',
    './index.html',
    './manifest.json',
    './app.js',
    './style.css',
    './icon-192.png',
    './icon-512.png'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(APP_FILES))
            .then(() => self.skipWaiting())
            .catch(error => {
                console.error('RIZZ CRM cache installation failed:', error);
            })
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(name => name !== CACHE_NAME)
                    .map(name => caches.delete(name))
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    const request = event.request;

    if (request.method !== 'GET') {
        return;
    }

    const url = new URL(request.url);

    // Never cache API requests
    if (
        url.hostname.includes('workers.dev') ||
        url.hostname.includes('groq.com')
    ) {
        return;
    }

    event.respondWith(
        caches.match(request).then(cachedResponse => {

            if (cachedResponse) {
                return cachedResponse;
            }

            return fetch(request)
                .then(networkResponse => {

                    if (!networkResponse || !networkResponse.ok) {
                        return networkResponse;
                    }

                    const responseToCache = networkResponse.clone();

                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(request, responseToCache);
                    });

                    return networkResponse;
                })
                .catch(() => {
                    return caches.match('./index.html');
                });
        })
    );
});
