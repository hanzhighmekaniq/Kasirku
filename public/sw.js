const CACHE_NAME = "simkasir-v4";
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
  <title>SIM-KASIR — Offline</title>
  <style>
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      min-height: 100vh;
      display: flex;
      background: #f1f5f9;
      color: #1e293b;
    }

    /* ── Brand panel (kiri) ─────────────────────────────── */
    .brand {
      display: none;
      width: 58%;
      flex-direction: column;
      justify-content: space-between;
      padding: 2.5rem 3.5rem;
      background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 55%, #2e1065 100%);
      position: relative;
      overflow: hidden;
    }
    .brand::before {
      content: '';
      position: absolute;
      top: -6rem; left: -6rem;
      width: 26rem; height: 26rem;
      border-radius: 50%;
      background: rgba(99,102,241,0.18);
      filter: blur(72px);
      pointer-events: none;
    }
    .brand::after {
      content: '';
      position: absolute;
      bottom: -5rem; right: -5rem;
      width: 22rem; height: 22rem;
      border-radius: 50%;
      background: rgba(139,92,246,0.18);
      filter: blur(72px);
      pointer-events: none;
    }
    .brand-top, .brand-mid, .brand-bot { position: relative; z-index: 1; }

    .logo-row { display: flex; align-items: center; gap: 0.75rem; }
    .logo-icon {
      width: 2.75rem; height: 2.75rem;
      border-radius: 0.75rem;
      background: linear-gradient(135deg, #6366f1, #7c3aed);
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 20px rgba(99,102,241,0.45);
      flex-shrink: 0;
    }
    .logo-name { display: block; font-size: 1.125rem; font-weight: 700; color: #fff; letter-spacing: -0.02em; }
    .logo-sub  { display: block; font-size: 0.75rem; font-weight: 500; color: #94a3b8; }

    .brand-headline {
      font-size: 2.5rem; font-weight: 700;
      color: #fff; line-height: 1.2;
      letter-spacing: -0.03em;
      max-width: 22rem;
    }
    .brand-desc {
      margin-top: 1rem;
      color: #94a3b8; line-height: 1.7;
      font-size: 0.9375rem; max-width: 24rem;
    }

    .brand-tags { display: flex; flex-wrap: wrap; gap: 0.625rem; margin-top: 1.75rem; }
    .brand-tag {
      padding: 0.375rem 0.875rem;
      border-radius: 9999px;
      border: 1px solid rgba(255,255,255,0.1);
      background: rgba(255,255,255,0.05);
      color: #e2e8f0;
      font-size: 0.8125rem; font-weight: 500;
      backdrop-filter: blur(4px);
    }

    .brand-footer { color: #475569; font-size: 0.8125rem; }

    /* ── Content panel (kanan) ──────────────────────────── */
    .content {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem 1.5rem;
    }
    .card { width: 100%; max-width: 26rem; }

    /* Mobile logo */
    .mobile-logo {
      display: flex; align-items: center; gap: 0.625rem;
      margin-bottom: 2rem;
    }
    .mobile-logo-icon {
      width: 2.5rem; height: 2.5rem;
      border-radius: 0.75rem;
      background: linear-gradient(135deg, #6366f1, #7c3aed);
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 16px rgba(99,102,241,0.35);
      flex-shrink: 0;
    }
    .mobile-logo-name { font-size: 1.125rem; font-weight: 700; color: #1e293b; letter-spacing: -0.02em; }
    .mobile-logo-sub  { font-size: 0.75rem; color: #64748b; }

    /* White card container */
    .inner {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 1.25rem;
      padding: 1.75rem;
      box-shadow: 0 20px 60px rgba(15,23,42,0.08);
    }

    /* Status pill */
    .pill {
      display: inline-flex; align-items: center; gap: 0.5rem;
      padding: 0.3rem 0.875rem;
      border-radius: 9999px;
      background: #fef3c7;
      border: 1px solid #fde68a;
      color: #92400e;
      font-size: 0.75rem; font-weight: 600;
      margin-bottom: 1.25rem;
    }
    .pill-dot {
      width: 7px; height: 7px; border-radius: 50%;
      background: #f59e0b;
      animation: blink 1.4s ease-in-out infinite;
    }

    /* Icon box */
    .icon-box {
      width: 4rem; height: 4rem;
      border-radius: 1rem;
      background: linear-gradient(135deg, #eef2ff, #ede9fe);
      border: 1px solid #c7d2fe;
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 1.25rem;
    }

    .card-title { font-size: 1.375rem; font-weight: 700; color: #0f172a; letter-spacing: -0.02em; }
    .card-desc  { margin-top: 0.375rem; color: #64748b; font-size: 0.875rem; line-height: 1.65; margin-bottom: 1.5rem; }

    /* Section label */
    .section-label {
      font-size: 0.6875rem; font-weight: 600;
      text-transform: uppercase; letter-spacing: 0.08em;
      color: #94a3b8; margin-bottom: 0.625rem;
    }

    /* Nav items */
    .nav-list { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1.25rem; }
    .nav-link {
      display: flex; align-items: center; gap: 0.875rem;
      padding: 0.75rem 0.875rem;
      border-radius: 1rem;
      background: #fff;
      border: 1.5px solid #e2e8f0;
      color: #334155; text-decoration: none;
      font-size: 0.875rem; font-weight: 500;
      transition: border-color 0.15s, background 0.15s, box-shadow 0.15s, transform 0.1s;
    }
    .nav-link:hover {
      border-color: #a5b4fc;
      background: #eef2ff;
      color: #4338ca;
      box-shadow: 0 2px 12px rgba(99,102,241,0.1);
    }
    .nav-link:active { transform: scale(0.985); }

    .nav-icon {
      width: 2.25rem; height: 2.25rem; border-radius: 0.625rem;
      background: #f1f5f9;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      transition: background 0.15s;
    }
    .nav-link:hover .nav-icon { background: #e0e7ff; }

    .nav-text { flex: 1; min-width: 0; }
    .nav-title { display: block; font-weight: 600; }
    .nav-hint  { display: block; font-size: 0.75rem; color: #94a3b8; margin-top: 0.0625rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .nav-link:hover .nav-hint { color: #818cf8; }

    .nav-arrow { color: #cbd5e1; flex-shrink: 0; transition: color 0.15s, transform 0.15s; }
    .nav-link:hover .nav-arrow { color: #818cf8; transform: translateX(2px); }

    /* Retry button */
    .btn-retry {
      display: flex; align-items: center; justify-content: center; gap: 0.5rem;
      width: 100%; padding: 0.8rem;
      border-radius: 0.875rem;
      background: linear-gradient(135deg, #6366f1, #7c3aed);
      color: #fff;
      font-size: 0.875rem; font-weight: 600;
      border: none; cursor: pointer;
      box-shadow: 0 4px 16px rgba(99,102,241,0.35);
      transition: opacity 0.15s, transform 0.1s;
    }
    .btn-retry:hover { opacity: 0.9; }
    .btn-retry:active { transform: scale(0.98); }

    /* Reconnect status */
    .reconnect {
      display: flex; align-items: center; justify-content: center; gap: 0.5rem;
      margin-top: 1rem;
      color: #94a3b8; font-size: 0.8125rem;
    }
    .spinner {
      width: 13px; height: 13px;
      border: 2px solid #e2e8f0;
      border-top-color: #94a3b8;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0.2; } }
    @keyframes spin  { to { transform: rotate(360deg); } }

    @media (min-width: 1024px) {
      .brand       { display: flex; }
      .mobile-logo { display: none; }
      .content     { padding: 3rem 4rem; }
    }
  </style>
</head>
<body>

  <!-- ── Brand panel (kiri, desktop only) ───────────────────────── -->
  <div class="brand">
    <div class="brand-top">
      <div class="logo-row">
        <div class="logo-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"/>
          </svg>
        </div>
        <div>
          <span class="logo-name">SIM-KASIR</span>
          <span class="logo-sub">Point of Sale System</span>
        </div>
      </div>
    </div>

    <div class="brand-mid">
      <p class="brand-headline">Koneksi internet terputus.</p>
      <p class="brand-desc">
        Tenang — semua data transaksi yang sudah dibuat tetap aman.
        Akan otomatis tersinkronisasi saat koneksi kembali.
      </p>
      <div class="brand-tags">
        <span class="brand-tag">Minimart</span>
        <span class="brand-tag">Cafe</span>
        <span class="brand-tag">Coffee Shop</span>
        <span class="brand-tag">Retail</span>
      </div>
    </div>

    <div class="brand-bot">
      <p class="brand-footer">&copy; <span id="yr"></span> SIM-KASIR. All rights reserved.</p>
    </div>
  </div>

  <!-- ── Content panel (kanan) ──────────────────────────────────── -->
  <div class="content">
    <div class="card">

      <!-- Mobile logo -->
      <div class="mobile-logo">
        <div class="mobile-logo-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"/>
          </svg>
        </div>
        <div>
          <span class="mobile-logo-name">SIM-KASIR</span><br>
          <span class="mobile-logo-sub">Point of Sale System</span>
        </div>
      </div>

      <div class="inner">
        <!-- Status pill -->
        <div class="pill">
          <span class="pill-dot"></span>
          Tidak ada koneksi internet
        </div>

        <!-- Icon -->
        <div class="icon-box">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18.364 5.636a9 9 0 010 12.728m-2.829-2.829a5 5 0 000-7.07m-4.243 4.243a1 1 0 010-1.414M3 3l18 18"/>
          </svg>
        </div>

        <p class="card-title">Kamu sedang offline</p>
        <p class="card-desc">Halaman ini belum tersimpan di cache. Coba buka salah satu halaman berikut yang mungkin sudah pernah dikunjungi.</p>

        <p class="section-label">Halaman tersedia</p>
        <div class="nav-list">

          <a href="/app/dashboard" class="nav-link">
            <div class="nav-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
              </svg>
            </div>
            <div class="nav-text">
              <span class="nav-title">Dashboard</span>
              <span class="nav-hint">Ringkasan penjualan &amp; statistik</span>
            </div>
            <svg class="nav-arrow" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
          </a>

          <a href="/app/kasir" class="nav-link">
            <div class="nav-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"/>
              </svg>
            </div>
            <div class="nav-text">
              <span class="nav-title">Kasir (POS)</span>
              <span class="nav-hint">Transaksi offline tetap tersedia</span>
            </div>
            <svg class="nav-arrow" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
          </a>

          <a href="/app/products" class="nav-link">
            <div class="nav-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
              </svg>
            </div>
            <div class="nav-text">
              <span class="nav-title">Produk</span>
              <span class="nav-hint">Daftar &amp; manajemen produk</span>
            </div>
            <svg class="nav-arrow" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
          </a>

          <a href="/app/customers" class="nav-link">
            <div class="nav-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"/>
              </svg>
            </div>
            <div class="nav-text">
              <span class="nav-title">Pelanggan</span>
              <span class="nav-hint">Data pelanggan &amp; membership</span>
            </div>
            <svg class="nav-arrow" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
          </a>

          <a href="/login" class="nav-link">
            <div class="nav-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"/>
              </svg>
            </div>
            <div class="nav-text">
              <span class="nav-title">Login</span>
              <span class="nav-hint">Masuk ke akun kamu</span>
            </div>
            <svg class="nav-arrow" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
          </a>

        </div>

        <!-- Retry button -->
        <button class="btn-retry" onclick="location.reload()">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          Coba Sambung Ulang
        </button>

        <!-- Reconnect spinner -->
        <div class="reconnect">
          <div class="spinner"></div>
          <span>Mencoba menyambung kembali secara otomatis...</span>
        </div>
      </div>

      <!-- Mobile copyright -->
      <p style="margin-top:1.25rem;text-align:center;font-size:0.75rem;color:#94a3b8;display:block;" class="lg-hide">
        &copy; <span class="yr"></span> SIM-KASIR. All rights reserved.
      </p>
    </div>
  </div>

  <script>
    // Isi tahun
    var y = new Date().getFullYear();
    document.getElementById('yr') && (document.getElementById('yr').textContent = y);
    document.querySelectorAll('.yr').forEach(function(el){ el.textContent = y; });

    // Auto-reload setiap 12 detik
    setTimeout(function() { location.reload(); }, 12000);

    // Reload instan saat koneksi kembali
    window.addEventListener('online', function() { location.reload(); });
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
