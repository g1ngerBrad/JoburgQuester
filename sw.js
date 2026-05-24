const CACHE = 'sq-v14';

const PRECACHE = [
  './pages/home.html',
  './pages/log.html',
  './styles/globals.css',
  './styles/index.css',
  './styles/log.css',
  './js/env.js',
  './js/config.js',
  './js/state.js',
  './js/api.js',
  './js/ui.js',
  './js/quests.js',
  './js/home.js',
  './js/log.js',
  './manifest.json',
  './pages/splash-640x1136.png',
  './pages/splash-750x1334.png',
  './pages/splash-1242x2208.png',
  './pages/splash-1125x2436.png',
  './pages/splash-828x1792.png',
  './pages/splash-1242x2688.png',
  './pages/splash-1170x2532.png',
  './pages/splash-1284x2778.png',
  './pages/splash-1179x2556.png',
  './pages/splash-1290x2796.png',
  './pages/splash-1206x2622.png',
  './pages/splash-1320x2868.png',
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
