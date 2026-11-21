const CACHE = 'la-preparatoria-v1';
const RECURSOS_BASICOS = ['/', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(RECURSOS_BASICOS)).catch(() => {})
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((claves) => Promise.all(claves.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // nunca interceptar llamadas a la API

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/').then((r) => r || caches.match(request)))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(
      (cacheada) =>
        cacheada ||
        fetch(request)
          .then((respuesta) => {
            const copia = respuesta.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copia));
            return respuesta;
          })
          .catch(() => cacheada)
    )
  );
});
