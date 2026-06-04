const CACHE_NAME = "pokemon-typen-trainer-v10";
const APP_SHELL = [
  "./",
  "./index.html",
  "./style.css?v=10",
  "./app.js?v=10",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => caches.delete(cacheName)),
        ),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const requestUrl = new URL(event.request.url);
  const isAppFile = requestUrl.origin === self.location.origin;
  const isPokemonAsset =
    requestUrl.hostname === "pokeapi.co" ||
    requestUrl.hostname === "raw.githubusercontent.com";

  if (isAppFile && event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put("./", copy));
          return response;
        })
        .catch(() => caches.match("./index.html").then((cached) => cached || caches.match("./"))),
    );
    return;
  }

  if (isAppFile) {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request)),
    );
    return;
  }

  if (isPokemonAsset) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(event.request);
        if (cached) return cached;

        const response = await fetch(event.request);
        if (response.ok) cache.put(event.request, response.clone());
        return response;
      }),
    );
  }
});
