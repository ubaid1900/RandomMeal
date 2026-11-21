const CACHE_NAME = "random-meal-picker-__BUILD_VERSION__";
const APP_SHELL = [
  "./",
  "./index.html",
  "./theme.js?v=__BUILD_VERSION__",
  "./app.js?v=__BUILD_VERSION__",
  "./meals.html",
  "./meals.js?v=__BUILD_VERSION__",
  "./meals-page.js?v=__BUILD_VERSION__",
  "./manifest.webmanifest",
  "./icon.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.all(
        APP_SHELL.map((path) =>
          cache.add(new Request(new URL(path, self.registration.scope), { cache: "reload" }))
        ),
      )
    ),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
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
  if (event.request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    fetch(new Request(event.request, {
      cache: event.request.mode === "navigate" ? "reload" : "default",
    })).then(async (response) => {
      if (response.ok) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(event.request, response.clone());
      }
      return response;
    }).catch(async () => {
      const cachedResponse = await caches.match(event.request);
      return cachedResponse || Response.error();
    }),
  );
});
