// Hand-written service worker (no Workbox/next-pwa): Next.js 16 builds with Turbopack by
// default, and next-pwa's webpack-plugin-based approach isn't compatible with that. This
// covers the same ground for our needs: cache the static app shell, always go to the network
// for pages/data (job listings must never look stale), and fall back to a static offline page
// when there's no connection at all.

const CACHE_NAME = "uae-driver-jobs-shell-v1";
const APP_SHELL = ["/offline.html", "/manifest.json", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Static build assets: safe to cache-first, Next.js fingerprints these filenames.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
      })
    );
    return;
  }

  // Page navigations: network-first (never serve stale listings), offline page as last resort.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("/offline.html").then((res) => res || Response.error()))
    );
    return;
  }

  // Everything else (API calls, data) goes straight to the network, uncached.
});
