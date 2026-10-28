// Althentic.Dev Service Worker - PWA offline support
// Cache static assets + fallback offline page

// Bump this when changing URL canonicalization so stale HTML/assets are evicted.
const CACHE_NAME = "althentic-v2";
const OFFLINE_URL = "/offline";

// Assets to pre-cache on install
const PRECACHE_URLS = ["/", "/offline", "/logo.png"];

// Install - pre-cache critical assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).catch(() => {})
  );
  self.skipWaiting();
});

// Activate - clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch - stale-while-revalidate for assets, network-first for pages
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  // Skip non-same-origin requests (API calls, etc.)
  if (url.origin !== self.location.origin) return;
  // Skip Next.js internal HMR/dev requests
  if (url.pathname.startsWith("/_next/webpack-hmr")) return;

  // Network-first for navigation requests (pages)
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match(OFFLINE_URL))
        )
    );
    return;
  }

  // Stale-while-revalidate for static assets
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
