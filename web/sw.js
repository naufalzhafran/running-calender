// Service worker: pages and public API data are network-first with a cached
// fallback; static assets are served from cache and refreshed in the background.
// Bump CACHE_NAME when the cached file list changes.

const CACHE_NAME = "kalender-lari-v3";
const APP_SHELL = [
  "/",
  "/offline",
  "/archive",
  "/css/main.css",
  "/js/lib.js",
  "/js/event-list.js",
  "/js/home.js",
  "/js/archive.js",
  "/js/event.js",
  "/js/reminder.js",
  "/js/wallpaper.js",
  "/js/wallpaper-presets.js",
  "/icon.svg",
  "/favicon.ico",
  "/logo-mark.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))))
      .then(() => self.clients.claim()),
  );
});

function networkFirst(request, fallback) {
  return fetch(request)
    .then((response) => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
      }
      return response;
    })
    .catch(() => caches.match(request).then((cached) => cached || (fallback && caches.match(fallback))));
}

function staleWhileRevalidate(request) {
  return caches.match(request).then((cached) => {
    const network = fetch(request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() => cached);
    return cached || network;
  });
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, "/offline"));
    return;
  }

  if (url.pathname.startsWith("/api/")) {
    // Wallpapers and calendar files change daily or are downloads; only list
    // and detail JSON is worth keeping offline.
    if (url.pathname.startsWith("/api/events") && !url.pathname.endsWith(".ics")) {
      event.respondWith(networkFirst(request));
    }
    return;
  }

  event.respondWith(staleWhileRevalidate(request));
});
