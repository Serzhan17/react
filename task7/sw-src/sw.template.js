/* Task Tracker service worker.
 * Generated at build time by sw-src/generate-sw.js:
 *   __VERSION__ and the precache list are injected into dist/sw.js.
 */
const VERSION = "__VERSION__";
const PRECACHE = `tt-precache-${VERSION}`; // versioned: a new build = a new cache
const API_CACHE = "tt-api-v1"; // runtime caches keep their own format version
const STATIC_CACHE = "tt-static-v1";
const PRECACHE_URLS = __PRECACHE_MANIFEST__;
const PRECACHE_SET = new Set(PRECACHE_URLS);

const MAX_API_ENTRIES = 50; // cache growth limits
const MAX_STATIC_ENTRIES = 60;
const API_TIMEOUT_MS = 4000;

/* ---------- install: pre-cache the app shell ---------- */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PRECACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS.map((url) => new Request(url, { cache: "reload" }))))
  );
  // No skipWaiting() here on purpose: a new version waits until the user presses "Update".
});

/* ---------- activate: remove outdated caches ---------- */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keep = new Set([PRECACHE, API_CACHE, STATIC_CACHE]);
      const names = await caches.keys();
      await Promise.all(names.filter((name) => name.startsWith("tt-") && !keep.has(name)).map((name) => caches.delete(name)));
      await self.clients.claim();
    })()
  );
});

/* ---------- update mechanism: the page asks the waiting worker to take over ---------- */
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

/* ---------- fetch ---------- */
self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return; // never touch POST/PUT/DELETE

  const url = new URL(request.url);
  // Cross-origin traffic (Firebase Auth, Google sign-in, token endpoints) is never intercepted or cached.
  if (url.origin !== self.location.origin) return;
  if (request.headers.has("Authorization")) return;
  if (url.searchParams.has("__ping")) return; // real connectivity probe: always goes to the network
  if (url.pathname === "/sw.js") return;

  if (request.mode === "navigate") {
    event.respondWith(handleNavigation(request));
  } else if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirstApi(request)); // strategy 1: network-first (public API)
  } else if (PRECACHE_SET.has(url.pathname)) {
    event.respondWith(precacheFirst(request)); // app shell and built assets
  } else if (request.destination === "image" || request.destination === "font" || url.pathname.startsWith("/icons/")) {
    event.respondWith(cacheFirstStatic(request)); // strategy 2: cache-first (static assets)
  }
});

/* App shell navigation: serve the cached index.html (the React router renders the page).
 * If even the shell is missing, fall back to the network and finally to offline.html. */
async function handleNavigation(request) {
  const cache = await caches.open(PRECACHE);
  if (new URL(request.url).pathname === "/offline.html") {
    return (await cache.match("/offline.html")) || Response.error();
  }
  const shell = await cache.match("/index.html");
  if (shell) return shell;
  try {
    return await fetch(request);
  } catch (error) {
    return (await cache.match("/offline.html")) || Response.error();
  }
}

async function precacheFirst(request) {
  const cache = await caches.open(PRECACHE);
  const cached = await cache.match(request, { ignoreSearch: true });
  return cached || fetch(request);
}

/* Cache-first with a size limit: images, fonts, icons. */
async function cacheFirstStatic(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok && response.type === "basic") {
    await cache.put(request, response.clone());
    await trimCache(cache, MAX_STATIC_ENTRIES);
  }
  return response;
}

/* Network-first for the public API (list + details):
 * fresh data when online, the last saved copy when the network fails.
 * Cached answers are marked with X-Served-From so the UI can tell the user. */
async function networkFirstApi(request) {
  const cache = await caches.open(API_CACHE);
  try {
    const response = await fetchWithTimeout(request, API_TIMEOUT_MS);
    const type = response.headers.get("Content-Type") || "";
    if (response.status === 200 && type.includes("json")) {
      await cache.delete(request); // re-insert so the oldest entries are the least recently refreshed
      await cache.put(request, response.clone());
      await trimCache(cache, MAX_API_ENTRIES);
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return markAsCached(cached);
    return new Response(JSON.stringify({ error: "offline" }), {
      status: 503,
      headers: { "Content-Type": "application/json", "X-Offline": "1" },
    });
  }
}

/* ---------- helpers ---------- */
function markAsCached(response) {
  const headers = new Headers(response.headers);
  headers.set("X-Served-From", "service-worker-cache");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function fetchWithTimeout(request, ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(request, { signal: controller.signal }).finally(() => clearTimeout(timer));
}

async function trimCache(cache, maxEntries) {
  const keys = await cache.keys();
  const extra = keys.length - maxEntries;
  for (let i = 0; i < extra; i++) await cache.delete(keys[i]);
}
