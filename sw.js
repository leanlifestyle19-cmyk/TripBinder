/* ══════════════════════════════════════════════════════
   WAYFARER SERVICE WORKER  v1.0
   Strategy: Cache-first for app shell & assets;
             Network-first fallback for everything else.
══════════════════════════════════════════════════════ */

const CACHE_NAME    = 'wayfarer-v2';
const DYNAMIC_CACHE = 'wayfarer-dynamic-v2';

/* Resources to pre-cache on install */
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700&family=Inter:wght@400;500&family=DM+Mono:wght@400;500&display=swap',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
];

/* ── INSTALL ─────────────────────────────────────────── */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Pre-caching app shell');
        /* Cache each individually so one failure won't block */
        return Promise.allSettled(
          APP_SHELL.map(url =>
            cache.add(url).catch(err =>
              console.warn('[SW] Failed to cache:', url, err)
            )
          )
        );
      })
      .then(() => self.skipWaiting())
  );
});

/* ── ACTIVATE ────────────────────────────────────────── */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => {
        return Promise.all(
          keys
            .filter(k => k !== CACHE_NAME && k !== DYNAMIC_CACHE)
            .map(k => {
              console.log('[SW] Deleting old cache:', k);
              return caches.delete(k);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

/* ── FETCH ───────────────────────────────────────────── */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  /* Skip non-GET & chrome-extension requests */
  if (request.method !== 'GET') return;
  if (url.protocol === 'chrome-extension:') return;
  if (url.protocol === 'blob:') return;

  /* For OpenStreetMap tiles — cache then network update */
  if (url.hostname.endsWith('tile.openstreetmap.org')) {
    event.respondWith(cacheThenNetwork(request, DYNAMIC_CACHE));
    return;
  }

  /* For Google Fonts — cache first */
  if (
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com'
  ) {
    event.respondWith(cacheFirst(request, CACHE_NAME));
    return;
  }

  /* Leaflet CDN — cache first */
  if (url.hostname === 'unpkg.com') {
    event.respondWith(cacheFirst(request, CACHE_NAME));
    return;
  }

  /* App shell (same origin) — cache first, fall back to network */
  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(request, CACHE_NAME));
    return;
  }

  /* Everything else — network first, cache as fallback */
  event.respondWith(networkFirst(request, DYNAMIC_CACHE));
});

/* ── STRATEGIES ──────────────────────────────────────── */

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    /* Return offline fallback for HTML navigation */
    if (request.headers.get('accept')?.includes('text/html')) {
      const fallback = await caches.match('./index.html');
      if (fallback) return fallback;
    }
    throw err;
  }
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw err;
  }
}

async function cacheThenNetwork(request, cacheName) {
  const cached = await caches.match(request);

  /* Fetch and cache in background regardless */
  const networkPromise = fetch(request).then(async (response) => {
    if (response && response.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => null);

  return cached || (await networkPromise);
}

/* ── PUSH NOTIFICATIONS ──────────────────────────────── */
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Wayfarer Reminder';
  const options = {
    body:    data.body || 'You have an upcoming item.',
    icon:    data.icon || './manifest.json',
    badge:   data.badge || './manifest.json',
    tag:     data.tag  || 'wayfarer',
    data:    { url: data.url || './' },
    actions: [
      { action: 'open',    title: 'View' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
    requireInteraction: false,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;

  const targetUrl = event.notification.data?.url || './';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) return clients.openWindow(targetUrl);
      })
  );
});

/* ── BACKGROUND SYNC (future-proof) ─────────────────── */
self.addEventListener('sync', (event) => {
  if (event.tag === 'wayfarer-sync') {
    console.log('[SW] Background sync triggered');
  }
});

console.log('[SW] Wayfarer service worker loaded');