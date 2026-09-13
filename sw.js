"use strict";

// Naikkan versi saat memperbarui file aplikasi nanti.
const CACHE_VERSION = "v3";

// Nama cache dipisahkan berdasarkan lokasi Saju Content Planner.
const CACHE_PREFIX =
  "saju-content-planner-" +
  encodeURIComponent(self.registration.scope) +
  "-";

const CACHE_NAME = CACHE_PREFIX + CACHE_VERSION;

const APP_URL = new URL("./", self.location.href);

const APP_FILES = [
  "index.html",
  "style.css",
  "app.js",
    "security.js",
  "manifest.webmanifest",
  "icons/icon.svg",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/apple-touch-icon.png",
];

const FILE_URLS = APP_FILES.map((path) => {
  return new URL(path, APP_URL).href;
});

// Siapkan seluruh file sebelum versi offline dinyatakan terpasang.
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      const requests = FILE_URLS.map((url) => {
        return new Request(url, { cache: "reload" });
      });

      await cache.addAll(requests);
    })()
  );
});

// Bersihkan hanya versi lama milik Saju Content Planner di lokasi ini.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();

      await Promise.all(
        names
          .filter((name) => {
            return (
              name.startsWith(CACHE_PREFIX) &&
              name !== CACHE_NAME
            );
          })
          .map((name) => caches.delete(name))
      );

      await self.clients.claim();
    })()
  );
});

// Sajikan file aplikasi dari cache.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  if (url.origin !== APP_URL.origin) return;

  const indexURL = new URL("index.html", APP_URL);

  const isAppPage =
    event.request.mode === "navigate" &&
    (
      url.pathname === APP_URL.pathname ||
      url.pathname === indexURL.pathname
    );

  // Parameter URL tidak mengubah file aplikasi yang diminta.
  const fileURL = new URL(url);
  fileURL.search = "";
  fileURL.hash = "";

  const cacheKey = isAppPage ? indexURL.href : fileURL.href;

  // Jangan menangani file atau halaman di luar daftar aplikasi.
  if (!FILE_URLS.includes(cacheKey)) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cachedResponse = await cache.match(cacheKey);

      if (cachedResponse) return cachedResponse;

      return fetch(event.request);
    })()
  );
});