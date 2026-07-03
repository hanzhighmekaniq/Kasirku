const CACHE_NAME = "simkasir-v3";
const STATIC_ASSETS = [
    "/manifest.json",
    "/images/icon-192x192.png",
    "/images/icon-512x512.png",
];

// Penting: halaman yang paling sering dibuka — akan di-precache saat SW aktif
const PRECACHE_PAGES = [
    "/app/dashboard",
    "/app/kasir",
    "/app/products",
    "/app/customers",
    "/login",
];

// ---- Install: precache static assets ----
self.addEventListener("install", (event) => {
    event.waitUntil(
        (async () => {
            const cache = await caches.open(CACHE_NAME);
            await cache.addAll(STATIC_ASSETS);
            // Precache halaman penting (silent fail jika belum login)
            for (const page of PRECACHE_PAGES) {
                try {
                    const pageResp = await fetch(page);
                    if (pageResp.ok) cache.put(page, pageResp);
                } catch (_) {
                    // halaman mungkin require auth — skip, nanti di-cache saat dikunjungi
                }
            }

            // Also cache the current Vite build assets
            try {
                const buildResponse = await fetch("/build/manifest.json");
                if (buildResponse.ok) {
                    const buildManifest = await buildResponse.json();
                    const buildAssets = Object.values(buildManifest).flatMap(
                        (entry) =>
                            Array.isArray(entry)
                                ? entry
                                : [entry.file].concat(entry.css || []),
                    );
                    await cache.addAll(buildAssets.map((f) => "/build/" + f));
                }
            } catch (_) {
                // build manifest may not exist in dev
            }
        })(),
    );
    // Activate immediately without waiting for page reload
    self.skipWaiting();
});

// ---- Activate: clean old caches ----
self.addEventListener("activate", (event) => {
    event.waitUntil(
        (async () => {
            const keys = await caches.keys();
            await Promise.all(
                keys
                    .filter((k) => k !== CACHE_NAME)
                    .map((k) => caches.delete(k)),
            );
        })(),
    );
    // Take control of all clients immediately
    self.clients.claim();
});

// ---- Fetch: decide strategy per request type ----
self.addEventListener("fetch", (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Only handle same-origin requests
    if (url.origin !== self.location.origin) return;

    // ---- 1. Static assets: cache-first ----
    if (
        request.destination === "style" ||
        request.destination === "script" ||
        request.destination === "font" ||
        request.destination === "image" ||
        url.pathname.startsWith("/build/") ||
        url.pathname.startsWith("/images/") ||
        url.pathname === "/manifest.json"
    ) {
        event.respondWith(cacheFirst(request));
        return;
    }

    // ---- 2. Inertia page navigations & same-origin navigations: network-first ----
    if (
        request.mode === "navigate" ||
        request.headers.get("X-Inertia") === "true"
    ) {
        event.respondWith(networkFirstWithFallback(request));
        return;
    }

    // ---- 3. Other (API calls, form submissions, etc): network-only ----
    // Don't cache mutations (POST, PUT, PATCH, DELETE)
    return;
});

// ---- Cache-first strategy ----
async function cacheFirst(request) {
    const cached = await caches.match(request);
    if (cached) return cached;
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
        }
        return response;
    } catch (_) {
        return new Response("Offline", { status: 503 });
    }
}

// ---- Network-first with offline fallback ----
async function networkFirstWithFallback(request) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
        }
        return response;
    } catch (_) {
        // Try cached version
        const cached = await caches.match(request);
        if (cached) return cached;

        // Last resort: serve offline fallback page with navigation links
        return new Response(
            `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SIM-KASIR - Offline</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      display: flex; align-items: center; justify-content: center;
      min-height: 100vh; background: #f8fafc; color: #1e293b; padding: 1.5rem;
    }
    .card { text-align: center; max-width: 420px; width: 100%; }
    .icon { width: 72px; height: 72px; margin: 0 auto 1.5rem; display: block; }
    h1 { font-size: 1.375rem; font-weight: 700; margin-bottom: 0.5rem; }
    p { color: #64748b; line-height: 1.6; font-size: 0.9375rem; }
    .nav-list { margin-top: 1.75rem; display: flex; flex-direction: column; gap: 0.5rem; }
    .nav-link {
      display: flex; align-items: center; justify-content: center; gap: 0.5rem;
      padding: 0.75rem 1rem; border-radius: 0.75rem;
      background: #ffffff; border: 1px solid #e2e8f0;
      color: #334155; text-decoration: none; font-size: 0.875rem; font-weight: 500;
      transition: all 0.15s ease;
    }
    .nav-link:hover { border-color: #818cf8; background: #eef2ff; color: #4f46e5; }
    .nav-link:active { transform: scale(0.97); }
    .status { margin-top: 1.5rem; }
    .dot {
      display: inline-block; width: 8px; height: 8px; border-radius: 50%;
      background: #f59e0b; margin-right: 0.375rem; animation: pulse 1.5s ease-in-out infinite;
    }
    @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
  </style>
</head>
<body>
  <div class="card">
    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="1.5" xmlns="http://www.w3.org/2000/svg">
      <path stroke-linecap="round" stroke-linejoin="round" d="M18.364 5.636a9 9 0 010 12.728m-2.829-2.829a5 5 0 000-7.07m-4.243 4.243a1 1 0 010-1.414M3 3l18 18"/>
    </svg>
    <h1>Kamu sedang offline</h1>
    <p>Halaman ini belum tersimpan di cache. Coba buka salah satu halaman di bawah ini jika sudah pernah dikunjungi sebelumnya.</p>

    <div class="nav-list">
      <a href="/app/dashboard" class="nav-link">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
        Dashboard
      </a>
      <a href="/app/kasir" class="nav-link">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"/></svg>
        Kasir (POS)
      </a>
      <a href="/app/products" class="nav-link">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
        Produk
      </a>
      <a href="/app/customers" class="nav-link">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"/></svg>
        Pelanggan
      </a>
      <a href="/login" class="nav-link">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"/></svg>
        Login
      </a>
    </div>

    <div class="status">
      <span class="dot"></span>
      <span style="color: #64748b; font-size: 0.8125rem;">Mencoba menyambung kembali...</span>
    </div>
  </div>

  <script>
    // Coba refresh otomatis setiap 10 detik
    setTimeout(function() { location.reload(); }, 10000);
  </script>
</body>
</html>`,
            {
                status: 503,
                statusText: "Service Unavailable",
                headers: { "Content-Type": "text/html; charset=utf-8" },
            },
        );
    }
}
