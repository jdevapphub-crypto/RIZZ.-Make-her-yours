self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => self.clients.claim());
self.addEventListener('fetch', e => {
  // Don't cache API calls - always go to network
  if(e.request.url.includes('workers.dev')) return;
  e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)));
});
