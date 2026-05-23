const CACHE = 'jhb-v2';

const PRECACHE = [
  './pages/home.html',
  './pages/log.html',
  './styles/globals.css',
  './styles/index.css',
  './styles/log.css',
  './js/config.js',
  './js/state.js',
  './js/api.js',
  './js/ui.js',
  './js/quests.js',
  './js/home.js',
  './js/log.js',
  './manifest.json',
];

self.addEventListener('install', e =>
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  )
);

self.addEventListener('activate', e =>
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
);

self.addEventListener('fetch', e => {
  if (e.request.url.includes('api.groq.com')) return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res.ok || res.type === 'opaque') {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      });
    })
  );
});
