/* The Ether — hand-written service worker (no next-pwa).
 * - install: precache every route, the seed data, and the hashed /_next/static assets those pages reference
 * - /_next/static/*: cache-first (content-hashed, immutable)
 * - pages, data, icons: stale-while-revalidate (instant offline, fresh when online)
 * - RSC fetches (client-side navigation): network only; offline, Next falls back to a full page load,
 *   which is served from the cache.
 */
const VERSION = "ether-v2"; // bump when the UI changes so returning visitors drop the old cached pages
const CACHE = `${VERSION}-cache`;
const ROUTES = ["/", "/body", "/check", "/alerts", "/trends", "/quests", "/crew", "/learn"];
const ASSETS = ["/data/mission.json", "/data/steppe.json", "/manifest.webmanifest", "/icon.svg", "/icons/icon-192.png", "/icons/icon-512.png"];

async function precache() {
  const cache = await caches.open(CACHE);
  const statics = new Set();
  for (const route of ROUTES) {
    try {
      const res = await fetch(route, { cache: "reload" });
      if (!res.ok) continue;
      const html = await res.clone().text();
      for (const m of html.matchAll(/\/_next\/static\/[^"'\s)\\]+/g)) statics.add(m[0]);
      await cache.put(route, res);
    } catch {
      /* offline during install: skip */
    }
  }
  await Promise.all(
    [...ASSETS, ...statics].map((url) =>
      fetch(url, { cache: "reload" })
        .then((res) => (res.ok ? cache.put(url, res) : undefined))
        .catch(() => undefined),
    ),
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(precache().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const res = await fetch(request);
  if (res.ok) (await caches.open(CACHE)).put(request, res.clone());
  return res;
}

async function staleWhileRevalidate(request, fallbackUrl) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request, { ignoreSearch: true });
  const network = fetch(request)
    .then((res) => {
      if (res.ok) cache.put(request, res.clone());
      return res;
    })
    .catch(() => undefined);
  if (cached) return cached;
  const res = await network;
  if (res) return res;
  const fallback = fallbackUrl ? await cache.match(fallbackUrl) : undefined;
  return fallback ?? Response.error();
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (request.headers.get("RSC") || url.searchParams.has("_rsc")) return; // let Next fall back to a full load
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request));
    return;
  }
  if (request.mode === "navigate") {
    event.respondWith(staleWhileRevalidate(new Request(url.pathname), "/"));
    return;
  }
  event.respondWith(staleWhileRevalidate(request));
});
