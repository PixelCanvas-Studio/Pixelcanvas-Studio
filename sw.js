const CACHE_NAME = "pixelcanvas-studio-v4";

const APP_SHELL = [
  "/favicon.png",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;

  if (request.method !== "GET") return;

  // Let normal page navigation go directly to Cloudflare Pages.
  if (request.mode === "navigate") {
    return;
  }

  // IMPORTANT:
  // Do not intercept downloads or generated files.
  // Let the browser handle them directly.
  const url = new URL(request.url);

  const downloadExtensions = [
    ".pdf",
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".gif",
    ".heic",
    ".zip",
    ".txt",
    ".doc",
    ".docx"
  ];

  const isDownloadFile = downloadExtensions.some(ext =>
    url.pathname.toLowerCase().endsWith(ext)
  );

  if (
    isDownloadFile ||
    request.destination === "download" ||
    request.destination === "document"
  ) {
    return;
  }

  // For everything else, use the small PWA cache.
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) {
        return cached;
      }

      return fetch(request).then(response => {
        if (
          response &&
          response.status === 200 &&
          response.type === "basic"
        ) {
          const copy = response.clone();

          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, copy);
          });
        }

        return response;
      });
    })
  );
});