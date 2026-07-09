# 🩺 DOKUMENTASI TROUBLESHOOTING — Purchase Module & Umum

Dokumentasi semua error yang dialami selama development modul Purchase + error umum sistem,
beserta root cause dan fix. Simpan sebagai referensi kalau ketemu masalah serupa di masa depan.

---

## 📑 Daftar Error

| # | Error | Penyebab | Kategori |
|---|-------|----------|----------|
| 1 | Redirect silent `/app/purchases/create` ke dashboard | Route ordering bug | 🔴 Critical |
| 2 | Spatie `can()` selalu false / 403 tanpa pesan | Team context tidak di-set | 🔴 Critical |
| 3 | 403 / 404 redirect silent ke dashboard | Global exception handler | 🔴 Critical |
| 4 | Controller missing `create` + `store` method | Belum dibuat | 🟡 Missing |
| 5 | Halaman JSX Purchase tidak ada | Belum dibuat | 🟡 Missing |
| 6 | `storeType` accessor conflict (string vs object) | Model accessor override | 🟠 Gotcha |
| 7 | `RoleMiddleware` ≠ `PermissionMiddleware` | Salah swap middleware | 🔴 Critical |

---

## 🔴 Error 1: Route Ordering Bug — `/create` ke-intercept wildcard `{id}`

### Gejala
- `/app/purchases` (index) bisa dibuka ✅
- `/app/purchases/create` selalu redirect ke dashboard / 404 ❌
- Tidak ada error di log Laravel
- `php artisan route:list` menunjukkan route terdaftar

### Root Cause
Route `purchases.create` dan `purchases.show` didaftarkan di **middleware group berbeda**,
dengan `index`/`show` didaftar **duluan**:

```php
// ❌ SALAH — show didaftar sebelum create
Route::middleware(["feature:purchase", "permission:purchase.view"])->group(function () {
    Route::resource("purchases", PurchaseController::class)->only(["index", "show"]);
    // → mendaftarkan GET /purchases/{purchase}  ← wildcard!
});
Route::middleware(["feature:purchase", "permission:purchase.create"])->group(function () {
    Route::resource("purchases", PurchaseController::class)->only(["create", "store"]);
    // → mendaftarkan GET /purchases/create
});
```

**Laravel mencocokkan route berdasarkan URUTAN PENDAFTARAN, bukan spesifisitas path!**
Karena `/purchases/{purchase}` (wildcard) didaftar duluan, `/purchases/create` di-intercept
oleh wildcard → `Purchase::find('create')` → ModelNotFoundException → 404 → redirect.

> ⚠️ **Kesalahan fatal:** mengira Laravel memprioritaskan path statis (`/create`) di atas
> wildcard (`/{id}`). Laravel **tidak** melakukan itu — urutan pendaftaran adalah segalanya.

### Fix ✅
Tukar urutan — group `create`/`store` harus didaftar **sebelum** group `index`/`show`:

```php
// ✅ BENAR — create didaftar sebelum show
Route::middleware(["feature:purchase", "permission:purchase.create"])->group(function () {
    Route::resource("purchases", ...)->only(["create", "store"]);
    // → mendaftarkan GET /purchases/create  DULUAN
});
Route::middleware(["feature:purchase", "permission:purchase.view"])->group(function () {
    Route::resource("purchases", ...)->only(["index", "show"]);
    // → mendaftarkan GET /purchases/{purchase}  BELAKANGAN
});
```

### Pencegahan
- **Selalu daftarkan route statis (`create`, `edit`) SEBELUM route wildcard (`{id}`, `show`)** jika dipisah ke middleware group berbeda.
- Kalau dalam satu `Route::resource()` call, Laravel otomatis mengurutkan dengan benar.
- Cek dengan `php artisan route:list --path=purchases` — pastikan `/create` muncul sebelum `/{purchase}`.

### 📖 Konsep: Kenapa Urutan Route di Laravel Itu Kritis?

Laravel menggunakan **first-match routing** — **bukan** most-specific-match.

```
Request GET /purchases/create masuk:
→ Laravel iterasi daftar route SATU PER SATU sesuai URUTAN PENDAFTARAN
→ STOP di route PERTAMA yang pola path-nya cocok
→ /purchases/{purchase} (wildcard) cocok duluan karena didaftar duluan!
→ "create" dianggap sebagai ID → Purchase::find('create') → 404
```

Artinya: meskipun `/purchases/create` (path statis) lebih spesifik daripada
`/purchases/{purchase}` (wildcard), Laravel **tidak peduli** spesifisitas.
Yang penting: **siapa yang didaftar duluan?**

##### 🛒 Analogi: Antrian di Kasir

| Antrian ke- | Jalur | Aturan |
|-------------|-------|--------|
| 1 (duluan) | `/{id}` | "Terima SEMUA — angka maupun KATA" |
| 2 (belakangan) | `/create` | "Khusus yang bernama create" |

Kamu bawa `"create"`. Antri di jalur 1 → kasir cari `"create"` di database →
gak ada → **ERROR 404**. Jalur 2 gak pernah dikunjungi.

##### Kenapa Route Lain (Stock, Waste) Aman?

Semua action (`index`, `create`, `show`) didaftar dalam **SATU** `Route::resource()`
→ Laravel otomatis urutkan path statis (`/create`) sebelum wildcard (`/{id}`).

Masalah di Purchase muncul karena dipecah ke **DUA group middleware terpisah** —
urutan antar-group tidak diurutkan otomatis.

---

## 🔴 Error 2: Spatie Permission Check Selalu False / 403

### Gejala
- User biasa (non-developer) selalu dapat 403 saat akses route dengan `permission:*`
- Developer bisa akses (karena `isDeveloper()` bypass di `RoleMiddleware`)
- `$user->can('purchase.create')` di tinker return `false`

### Root Cause
**Spatie `PermissionMiddleware` tidak men-set `team_id` (store context) sebelum cek permission.**

Spatie dengan fitur teams: permission di-assign ke role per store (`roles.store_id`).
Tanpa `setPermissionsTeamId()`, `$user->can()` mencari role **tanpa store context**
(`team_id = null`) → tidak ketemu → selalu `false`.

```php
// Spatie middleware TIDAK melakukan ini:
app(PermissionRegistrar::class)->setPermissionsTeamId($storeId);

// Akibatnya: $user->can('purchase.create') mencari role dengan store_id = null
// → tidak ada role global → return false → UnauthorizedException → redirect
```

### Fix ✅
Buat custom `PermissionMiddleware` yang extends Spatie dan set team context:

```php
// app/Http/Middleware/PermissionMiddleware.php
class PermissionMiddleware extends \Spatie\Permission\Middleware\PermissionMiddleware
{
    public function handle($request, Closure $next, $permission, $guard = null)
    {
        if ($request->user()?->isDeveloper()) {
            return $next($request);
        }

        // SET TEAM CONTEXT sebelum cek permission
        $storeId = $request->session()->get("current_store_id");
        if ($storeId) {
            app(PermissionRegistrar::class)->setPermissionsTeamId((int) $storeId);
        }

        return parent::handle($request, $next, $permission, $guard);
    }
}
```

Lalu daftarkan di `bootstrap/app.php`:
```php
"permission" => \App\Http\Middleware\PermissionMiddleware::class,
```

### Verifikasi di Tinker
```php
// Harus set team context dulu kalau manual!
app(\Spatie\Permission\PermissionRegistrar::class)->setPermissionsTeamId($storeId);
\User::find($userId)->can('purchase.create'); // baru akan return true/false yang benar
```

---

## 🔴 Error 3: Global Exception Handler — 403/404 Redirect Silent

### Gejala
- Akses halaman yang tidak diizinkan → redirect ke dashboard tanpa pesan error
- Akses halaman tidak ada → redirect ke dashboard tanpa pesan error
- User bingung kenapa dilempar ke dashboard

### Root Cause
Di `bootstrap/app.php`, exception handler 403 dan 404 **redirect ke dashboard tanpa flash error**:

```php
// ❌ SALAH
$exceptions->renderable(fn(AccessDeniedHttpException $e) =>
    redirect()->route("admin.dashboard")  // tanpa with('error', ...)
);
$exceptions->renderable(fn(NotFoundHttpException $e) =>
    redirect()->route("admin.dashboard")  // tanpa with('error', ...)
);
```

### Fix ✅
Tampilkan halaman error Inertia yang jelas (403 / 404), atau redirect dengan flash error:

```php
// ✅ BENAR — tampilkan halaman error Inertia
$exceptions->renderable(function (AccessDeniedHttpException $e, $request) {
    if ($request->header("X-Inertia")) {
        return Inertia::render("Blocked/PermissionDenied", [
            "permission" => "...",
            "error" => "Anda tidak memiliki akses.",
        ])->toResponse($request)->setStatusCode(403);
    }
    return redirect()->route("admin.dashboard")->with("error", "Akses ditolak.");
});
```

Halaman error dibuat:
- `Blocked/PermissionDenied.jsx` — 403 dengan petunjuk cara fix
- `Blocked/NotFound.jsx` — 404 dengan tombol kembali

---

## 🟡 Error 4: Controller Method Belum Ada

### Gejala
- Route terdaftar tapi controller method tidak ditemukan
- Error: `ReflectionException: Method ... does not exist`

### Root Cause
`PurchaseController` hanya punya `index`, `show`, `edit`, `update`, `destroy`, `updateStatus`.
Method `create` dan `store` belum dibuat.

### Fix ✅
Tambahkan `create()` dan `store()` di `PurchaseController`:
- `create()` → return Inertia view dengan `suppliers`, `products`, `paymentMethods`, `storeType`
- `store()` → validasi input, generate `purchase_no`, hitung subtotal/grand total, simpan Purchase + PurchaseItem + PurchasePayment, auto stok masuk jika langsung completed. Semua dalam `DB::transaction`.

---

## 🟡 Error 5: Halaman JSX Belum Ada

### Gejala
- Controller return Inertia render, tapi halaman tidak ditemukan
- Error: Vite / Inertia tidak bisa resolve component

### Root Cause
File JSX untuk halaman Purchase belum dibuat. Controller me-render:
- `Admin/Purchases/Index`
- `Admin/Purchases/Create`
- `Admin/Purchases/Show`
- `Admin/Purchases/Edit`

Tapi tidak ada file di `resources/js/Pages/Admin/Purchases/`.

### Fix ✅
Buat 4 halaman JSX:
| Halaman | Fitur Utama |
|---------|-------------|
| `Index.jsx` | List, stats (total/selesai/draft/unpaid), search, status badge, delete modal |
| `Create.jsx` | Form supplier, items dinamis (add/remove), kalkulasi real-time, payment |
| `Show.jsx` | Detail, items table, ringkasan keuangan, riwayat bayar, aksi status |
| `Edit.jsx` | Edit header (draft only), items read-only, summary real-time |

---

## 🟠 Error 6: `storeType` Accessor Conflict

### Gejala
- `Attempt to read property "code" on string at RoleController.php:32`
- Mencoba akses `$store->storeType?->code` tapi `$store->storeType` sudah berupa string

### Root Cause
Model `Store` punya **accessor** `getStoreTypeAttribute()` yang return `$type?->code` (string):

```php
// app/Models/Store.php
public function getStoreTypeAttribute(): ?string
{
    $type = $this->getRelationValue("storeType");
    return $type?->code;  // ← return string "fnb", bukan object StoreType!
}
```

Jadi `$store->storeType` sudah string, tidak bisa di-chain `?->code`.

### Fix ✅
Gunakan `getRelationValue()` atau `getRelation()` untuk bypass accessor dan dapat object asli:

```php
// ❌ SALAH
$store->storeType?->code  // "fnb"->code → Error!

// ✅ BENAR
$store->getRelationValue("storeType")?->code  // object StoreType → "fnb" ✅
$store->getRelation("storeType")?->code       // sama
```

### Catatan
Masalah ini muncul karena setelah migration dari JSON `modules`, banyak controller
di-update menggunakan `getRelation('storeType')?->code` (lihat `RINGKASAN_PERUBAHAN.md`).
Accessor `getStoreTypeAttribute()` tetap dipertahankan untuk backward compat di frontend.

---

## 🔴 Error 7: Jangan Swap `RoleMiddleware` Sebagai `PermissionMiddleware`

### Gejala
- **SEMUA user non-owner tidak bisa akses apapun** setelah ganti middleware
- User dengan role admin/kasir/gudang/supervisor dapat 403 di semua route

### Root Cause (KESALAHAN FATAL)
Mencoba mengganti `"permission"` alias dari Spatie `PermissionMiddleware` ke `RoleMiddleware`
tanpa membaca isi `RoleMiddleware`. Method-nya mengecek **ROLE**, bukan **PERMISSION**:

```php
// RoleMiddleware — cek hasRole(), BUKAN can()!
foreach ($roles as $role) {
    if ($user->hasRole($role)) {   // ← ini cek NAMA ROLE
        return $next($request);
    }
}
```

Ketika route pakai `permission:purchase.create`, middleware menerima `$roles = ['purchase.create']`,
lalu cek `$user->hasRole('purchase.create')` → **tidak ada role bernama "purchase.create"** → false.

Hanya user dengan role **"owner"** yang lolos (karena ada bypass khusus di line 48-51).

### Fix ✅
**Jangan swap!** Buat middleware custom yang extends Spatie, bukan ganti dengan `RoleMiddleware`:

```php
// ✅ Custom PermissionMiddleware
class PermissionMiddleware extends \Spatie\Permission\Middleware\PermissionMiddleware
{
    public function handle($request, Closure $next, $permission, $guard = null)
    {
        if ($request->user()?->isDeveloper()) return $next($request);
        // ... set team context ...
        return parent::handle($request, $next, $permission, $guard);
    }
}
```

### Pelajaran
- **Selalu baca isi class sebelum menggunakannya sebagai pengganti class lain**
- `RoleMiddleware` dan `PermissionMiddleware` punya signature mirip (parameter `...$roles` vs `$permission`)
  tapi logika internalnya **berbeda total** — satu cek `hasRole()`, satu cek `can()`
- Kalau ragu, **extend**, jangan replace

---

## 📊 Pola Error yang Sering Terjadi

### 🥇 Juara 1: Route Ordering
Gejala: satu route bisa, route lain (biasanya `/create` atau `/edit`) 404.
Penyebab: wildcard `/{id}` didaftar sebelum path statis.
Cek: `php artisan route:list --path=<prefix>`

### 🥈 Juara 2: Spatie Team Context
Gejala: permission check selalu false meskipun role & permission sudah benar di DB.
Penyebab: `setPermissionsTeamId()` tidak dipanggil sebelum `$user->can()`.
Cek: pastikan team ID di-set di middleware atau sebelum pengecekan manual.

### 🥉 Juara 3: Redirect Silent
Gejala: user dilempar ke dashboard tanpa tahu kenapa.
Penyebab: exception handler tidak menambahkan `with('error', ...)` flash message.
Cek: `bootstrap/app.php` → `withExceptions(...)`

---

## 🧪 Checklist Debugging Cepat

Kalau ketemu error "halaman tidak bisa diakses", cek urutan ini:

```
1. php artisan route:list --path=<prefix>
   → Pastikan route terdaftar dan URUTANNYA benar

2. php artisan tinker
   → Cek middleware: apakah feature + permission aktif?
   → \App\Models\Store::find($id)->hasFeature('purchase')
   → \App\Models\Store::find($id)->planAllowsFeature('purchase')

3. Cek team context Spatie:
   → app(\Spatie\Permission\PermissionRegistrar::class)->setPermissionsTeamId($storeId);
   → User::find($userId)->can('purchase.create')

4. Cek error log:
   → tail -30 storage/logs/laravel.log

5. Restart server setelah edit bootstrap/app.php
   → php artisan optimize:clear && php artisan serve
```

---

## 📁 File yang Terlibat dalam Fix

| File | Perubahan |
|------|-----------|
| `routes/web.php` | Reorder route purchase — create sebelum show |
| `app/Http/Middleware/PermissionMiddleware.php` | **BARU** — custom Spatie middleware dengan team context + developer bypass |
| `bootstrap/app.php` | Update exception handler (403/404/500) + alias permission ke custom middleware |
| `app/Http/Controllers/Admin/PurchaseController.php` | Tambah method `create()` + `store()` |
| `app/Http/Controllers/Developer/RoleController.php` | **BARU** — kelola role & permission per store |
| `resources/js/Pages/Admin/Purchases/Index.jsx` | **BARU** |
| `resources/js/Pages/Admin/Purchases/Create.jsx` | **BARU** |
| `resources/js/Pages/Admin/Purchases/Show.jsx` | **BARU** |
| `resources/js/Pages/Admin/Purchases/Edit.jsx` | **BARU** |
| `resources/js/Pages/Developer/Roles/Index.jsx` | **BARU** |
| `resources/js/Pages/Blocked/PermissionDenied.jsx` | **BARU** |
| `resources/js/Pages/Blocked/NotFound.jsx` | **BARU** |
| `resources/js/Layouts/DeveloperLayout.jsx` | Tambah sidebar "Role & Permission" |
| `routes/web.php` | Tambah route developer roles |

---

*Update: 9 Juli 2026 — Sesi debugging Purchase Module*
