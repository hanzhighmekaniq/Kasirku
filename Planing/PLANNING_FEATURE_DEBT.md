
# Planning: Fitur Hutang / Kasbon (Feature-Gated)

## Ringkasan

Menambahkan fitur **Hutang / Kasbon** sebagai feature code tersendiri (`debt`) yang dikontrol oleh 3 layer validasi existing:
1. **StoreType** — tipe toko mana yang support (semua tipe)
2. **Plan** — plan mana yang mengizinkan (basic ke atas)
3. **Permission** — user role mana yang boleh (owner, cashier)

Ketika fitur ini **tidak aktif**, opsi "Hutang/Kasbon" di PaymentModal dan sidebar menu "Kasbon" tidak muncul.

---

## Task List

### Task 1: Registrasi Feature `debt` di FeatureSeeder

**File:** `database/seeders/DatabaseSeeder/FeatureSeeder.php`

Tambahkan entry baru:
```php
[
    'code' => 'debt',
    'label' => 'Hutang / Kasbon',
    'description' => 'Catat pembayaran hutang pelanggan, atur limit kredit, & pelunasan',
    'category' => 'finance',
    'sort_order' => 37,
    'applicable_types' => self::ALL_TYPES,
],
```
Pastikan seeder attach ke pivot `plan_feature` dan `store_type_feature`.

---

### Task 2: Permission baru di PermissionSeeder

**File:** `database/seeders/DatabaseSeeder/PermissionSeeder.php`

```
'debt.view'   — Lihat daftar kasbon/hutang
'debt.create' — Buat transaksi kasbon (di POS)
'debt.pay'    — Lunasi hutang pelanggan
```

---

### Task 3: Attach ke Plan (PlanSeeder)

- Plan `basic`, `professional`, `enterprise` → dapat `debt`.
- Plan `free` → tidak dapat (muncul 🔒 di sidebar).

---

### Task 4: Frontend — useStoreModules.js

```js
const hasDebt = hasFeature("debt");
const lockedDebt = isFeatureLocked("debt");
```
Export keduanya.

---

### Task 5: Frontend — navConfig.js (Sidebar)

Group **Keuangan**, tambah menu:
```js
add(items, modules.hasDebt || modules.lockedDebt, modules.hasDebt, {
    key: "debt", name: "Hutang / Kasbon",
    href: r("admin.debts.index"), icon: "debt", current: "admin.debts.*",
});
```
Permission gate: `can('debt.view')`.

---

### Task 6: PaymentModal feature gate

- Tambah prop `hasDebtFeature`.
- Mode chooser: `{debtMethod && hasDebtFeature && ( ... )}`
- Pass dari `Kasir.jsx` & `KasirLayout.jsx` via `useStoreModules`.

---

### Task 7: KasirController conditional loading

- Filter payment methods: jika `!$store->hasFeature('debt')` → exclude `type='debt'`.
- Tambah `credit_limit`, `debt_balance` ke customer query.

---

### Task 8: Route & DebtController

```php
Route::middleware(['feature:debt'])->group(function () {
    Route::get('app/debts', [DebtController::class, 'index'])->name('admin.debts.index');
    Route::post('app/debts/{customer}/pay', [DebtController::class, 'pay'])->name('admin.debts.pay');
});
```
- `index()` — Daftar pelanggan berhutang.
- `pay()` — Pelunasan (reuse logika dari `CustomerController@payDebt`).

---

### Task 9: Halaman Debts/Index.jsx

- Tabel: Nama, Telepon, Total Hutang, Limit Kredit, Sisa Limit.
- Tombol "Lunasi" → modal pelunasan.
- Filter, search, detail riwayat (customer_debt_logs).

---

### Task 10: Middleware & Permission gate di Controller

- `feature:debt` + `permission:debt.view` untuk halaman.
- `permission:debt.pay` untuk pelunasan.
- `permission:debt.create` di `KasirController@store()` saat ada pembayaran hutang.

---

### Task 11: Limit Kredit di Halaman Pelanggan

- `CustomerForm.jsx` sudah punya field `credit_limit` (confirmed).
- Pastikan validasi >= 0, tampilkan sisa limit.

---

### Task 12: Tests

`tests/Feature/DebtFeatureGateTest.php`:
- Store tanpa feature `debt` → POST kasir type=debt → ditolak.
- Store dengan feature `debt` → berhasil.
- Route tanpa feature → redirect.
- Permission gate tests.

---

### Task 13: Seeder re-run & Final

- `php artisan db:seed` ulang.
- Tidak perlu migration baru.
- `php artisan test --compact` all pass.

---

## Urutan Eksekusi

| # | Task | Dependensi |
|---|------|-----------|
| 1 | FeatureSeeder | — |
| 2 | PermissionSeeder | — |
| 3 | PlanSeeder | 1 |
| 4 | useStoreModules.js | 1 |
| 5 | navConfig.js | 4 |
| 6 | PaymentModal gate | 4 |
| 7 | KasirController | 1 |
| 8 | Route & Controller | 1, 2 |
| 9 | Debts/Index.jsx | 5, 8 |
| 10 | Middleware/Permission | 2, 8 |
| 11 | CustomerForm limit | — |
| 12 | Tests | 1-10 |
| 13 | Seeder re-run | 1-3 |

---

## Catatan Arsitektur

- Feature `debt` hanya kontrol visibilitas. Payment method type `debt` tetap di DB, cuma tidak dikirim frontend jika fitur off.
- Layer 3 (store toggle off) → backend juga tolak transaksi hutang.
- Sidebar: 📒 di group Keuangan — locked jika plan tidak support, hidden jika tipe tidak support.
- Limit kredit diatur per pelanggan, validasi server-side di `KasirController@store()` tetap jalan.


