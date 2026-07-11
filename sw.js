/* Baqarah Tafsir Journal — service worker for full offline use.
   Strategy:
   - App shell / navigations: network-first (so you get the latest when online),
     falling back to the cached copy when offline.
   - CDN runtime deps (React, ReactDOM, Babel, Firebase SDK) and same-origin
     assets (icons, manifest): cache-first (they are versioned / immutable).
   - Firebase Realtime Database + Auth traffic: never touched — always the network,
     so live sync and sign-in are never served stale.
   Bump CACHE to invalidate old caches on deploy. */
const CACHE = "baqarah-tafsir-v11";

const PRECACHE = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
  "https://unpkg.com/react@18.3.1/umd/react.production.min.js",
  "https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js",
  "https://unpkg.com/@babel/standalone@7.26.4/babel.min.js",
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js",
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-database-compat.js",
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js"
];

// Hosts whose responses we cache at runtime (immutable, versioned CDN files + fonts).
const CACHEABLE_HOSTS = /(^|\.)(unpkg\.com|gstatic\.com|googleapis\.com)$/;
// Live Firebase traffic that must always hit the network (never cache).
const BYPASS = /(firebaseio\.com|firebasedatabase\.app|identitytoolkit\.googleapis\.com|securetoken\.googleapis\.com|www\.googleapis\.com)$/;

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE)
      // Cache each item independently so one CDN failure doesn't abort the whole install.
      .then((c) => Promise.all(PRECACHE.map((u) =>
        c.add(new Request(u, { cache: "reload" })).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  let url;
  try { url = new URL(req.url); } catch (_) { return; }

  // Always go to the network for live Firebase sync/auth (fonts host googleapis is
  // handled by CACHEABLE_HOSTS below via fonts.googleapis, but the auth/db endpoints
  // are matched here first and bypassed).
  if (BYPASS.test(url.hostname)) return;

  const isNav = req.mode === "navigate";
  const sameOrigin = url.origin === self.location.origin;

  // App shell / navigations: network-first, fall back to cache (offline).
  if (isNav || (sameOrigin && (url.pathname === "/" || url.pathname.endsWith("/index.html")))) {
    e.respondWith(
      fetch(req)
        .then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put("/index.html", copy)); return res; })
        .catch(() => caches.match(req).then((hit) => hit || caches.match("/index.html")))
    );
    return;
  }

  // Everything else (CDN deps, icons, fonts): cache-first, then network (and cache it).
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res && (res.ok || res.type === "opaque") && (sameOrigin || CACHEABLE_HOSTS.test(url.hostname))) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
      }
      return res;
    }).catch(() => hit))
  );
});
