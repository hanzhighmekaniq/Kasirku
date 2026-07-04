# SIM-KASIR — Dokumentasi Lengkap

> Sistem Kasir Multi-Mode untuk berbagai jenis usaha kecil menengah.
> Dibangun dengan Laravel 12 + React (Inertia.js) + Spatie Permission.

---

## Daftar Isi

1. [Gambaran Umum](#1-gambaran-umum)
2. [Teknologi & Stack](#2-teknologi--stack)
3. [Struktur Proyek](#3-struktur-proyek)
4. [Alur Pengguna (User Flow)](#4-alur-pengguna-user-flow)
5. [Sistem Role & Permission](#5-sistem-role--permission)
6. [Sistem Plan/Paket](#6-sistem-planpaket)
7. [7 Mode Kasir](#7-7-mode-kasir)
8. [Database Schema](#8-database-schema)
9. [API & Routes](#9-api--routes)
10. [Konfigurasi Sidebar](#10-konfigurasi-sidebar)
11. [Akun Demo](#11-akun-demo)
12. [Cara Setup & Menjalankan](#12-cara-setup--menjalankan)

---

## 1. Gambaran Umum

SIM-KASIR adalah platform kasir SaaS (Software as a Service) yang mendukung **7 jenis bisnis** dalam satu aplikasi:

| Mode | Contoh Bisnis | Fitur Utama |
|---|---|---|
| `retail` | Minimarket, apotek, toko baju | Stok, barcode, batch/expired |
| `fnb` | Cafe, restoran, warung | Meja, kitchen display, modifier, resep |
| `service` | Barbershop, salon, bengkel | Antrian, komisi, booking |
| `laundry` | Laundry kiloan, dry cleaning | Status proses, berat, estimasi |
| `rental` | Rental motor, alat, kostum | Deposit, durasi, kondisi |
| `parking` | Parkir mall, gedung | Tiket, plat nomor, durasi |
| `session` | Warnet, PS, karaoke | Unit, timer, billing otomatis |

### Konsep Platform

```
Developer (kamu) → buat toko → set paket → assign owner
Owner → setup toko → kelola karyawan → buat role
Karyawan → operasional harian (POS, stok, shift)
```

---

## 2. Teknologi & Stack

### Backend
- **PHP 8.3** + **Laravel 12**
- **MySQL** — database utama
- **Spatie Laravel Permission v8** — role & permission dengan fitur teams (per store)
- **Inertia.js** — jembatan antara Laravel dan React

### Frontend
- **React 18** + **Vite**
- **Tailwind CSS v3**
- **Recharts** — grafik dashboard
- **@zxing/library** — barcode scanner

### Struktur Utama
```
app/
  Http/
    Controllers/
      Admin/          ← Semua controller untuk owner/kasir
      Developer/      ← Controller developer panel
      Auth/           ← Authentication
    Middleware/
      AuthenticatedMiddleware.php
      StoreMiddleware.php      ← Set Spatie team = current_store_id
      BranchMiddleware.php     ← Set branch aktif
      DeveloperMiddleware.php  ← Guard khusus developer
      RoleMiddleware.php       ← Cek role via Spatie
  Models/             ← Eloquent models
  Services/
    StoreRoleService.php   ← Buat roles per store
    PromotionService.php   ← Hitung promo otomatis

resources/js/
  Layouts/
    AuthenticatedLayout.jsx   ← Layout owner/kasir (sidebar adaptif)
    DeveloperLayout.jsx       ← Layout developer panel
  Pages/
    Admin/              ← Semua halaman owner/kasir
    Developer/          ← Halaman developer panel
    Auth/               ← Login, register
  Config/
    navConfig.js        ← Konfigurasi sidebar dinamis
  Hooks/
    useStoreModules.js  ← Hook untuk cek fitur aktif + plan
```

---

## 3. Struktur Proyek

### Database — Tabel Utama

```
users                   ← Semua pengguna
  └── is_developer      ← Flag boolean, bukan Spatie role

stores                  ← Data toko
  ├── store_type        ← retail/fnb/service/laundry/rental/parking/session
  ├── modules (JSON)    ← { pos_modes: [], features: [] }
  ├── plan              ← free/basic/pro
  ├── max_users         ← Batas pengguna sesuai paket
  └── max_branches      ← Batas cabang sesuai paket

branches                ← Cabang per toko

user_store              ← Pivot: user bisa akses store mana saja
  ├── user_id
  └── store_id

roles (Spatie)          ← Role PER STORE (store_id wajib ada)
  ├── name
  ├── store_id          ← Setiap store punya copy role-nya sendiri
  └── is_system         ← true = bawaan, false = custom owner

model_has_roles (Spatie) ← User X punya role Y di store Z
  ├── model_id (user_id)
  ├── model_type
  ├── role_id
  └── store_id
```

### Struktur Relasi Multi-Store

```
User (owner@gmail.com)
  ├── user_store → store_id=1 (Kopi Senja, FnB)
  │     └── model_has_roles → role=owner, store_id=1
  └── user_store → store_id=2 (Minimarket, Retail)
        └── model_has_roles → role=owner, store_id=2
```

---

## 4. Alur Pengguna (User Flow)

### 4.1 Developer Login

```
Login: dev@gmail.com / password
  → isDeveloper() = true (cek kolom users.is_developer)
  → redirect /developer/dashboard
  → Bisa: buat toko, set paket, assign owner, kelola user global
```

### 4.2 Owner Login (1 Toko)

```
Login: owner@gmail.com / password
  → isDeveloper() = false
  → punya 1 store di user_store
  → set current_store_id = store.id di session
  → set Spatie team_id = store_id
  → redirect /app/dashboard
  → Sidebar muncul sesuai:
      1. modules.features store (fitur yang aktif)
      2. Plan yang berlaku (free/basic/pro)
      3. Permissions role owner
```

### 4.3 Owner Login (Multi-Toko)

```
Login: owner@gmail.com / password
  → punya >1 store di user_store
  → redirect /app/select-store
  → Pilih toko → simpan current_store_id di session
  → redirect /app/dashboard
  → Bisa switch toko kapan saja lewat header
```

### 4.4 Kasir Login

```
Login: kasir@gmail.com / password
  → punya 1 store, role=kasir
  → set branch_id dari employee.branch_id langsung
  → redirect /app/dashboard (tampilan mode kasir)
  → Akses terbatas sesuai permission kasir:
      - Buka/tutup shift
      - Kasir POS
      - Lihat penjualan sendiri
      - Catat pengeluaran
```

### 4.5 Alur Transaksi POS

```
Kasir buka shift (opening_cash)
  → Pilih produk / scan barcode
  → Pilih modifier/variant (FnB)
  → Pilih pelanggan (opsional)
  → Pilih meja (FnB dine-in)
  → Promo otomatis diterapkan
  → Pilih metode bayar
  → Submit → transaksi tersimpan
  → Stok otomatis berkurang
  → Struk bisa dicetak
Kasir tutup shift (actual_cash + rekap per metode bayar)
```

---

## 5. Sistem Role & Permission

### Konsep Kunci: Role Per Store

Dengan Spatie teams aktif (`store_id` sebagai team), **setiap store punya copy role-nya sendiri**. Ini berarti:
- Owner Toko A bisa punya role berbeda dari Owner Toko B
- Kasir Toko Retail tidak bisa akses Toko FnB meskipun user sama
- Permission di-enforce berdasarkan `current_store_id` di session

### Role Sistem (Bawaan, is_system=true)

| Role | Deskripsi | Permissions |
|---|---|---|
| `owner` | Pemilik toko | ~71 permissions (semua) |
| `admin` | Manager operasional | ~70 permissions (kecuali setting.module) |
| `supervisor` | Pengawas shift | ~33 permissions |
| `kasir` | Operator POS | ~19 permissions |
| `gudang` | Operator stok | ~19 permissions |
| `kitchen` | Staff dapur (FnB) | 2 permissions |

### Role Custom (Buatan Owner)

Owner bisa buat role baru dengan nama bebas dan permission sesuai kebutuhan. Role ini tersimpan dengan `store_id` toko tersebut dan `is_system=false`.

Contoh:
```
Owner Barbershop buat role "Resepsionis"
  → Permission: queue.view, queue.manage, customer.create, sale.create
  → Hanya berlaku di Barbershop tersebut
```

### Developer — Tidak Pakai Spatie

Developer menggunakan kolom `users.is_developer = true` (bukan Spatie role). Ini karena Spatie teams mensyaratkan `store_id`, sedangkan developer tidak terikat toko manapun.

```php
// Cek developer
$user->isDeveloper()  // cek kolom is_developer

// Cek role lain (butuh team context)
app(PermissionRegistrar::class)->setPermissionsTeamId($storeId);
$user->hasRole('kasir')
$user->can('sale.create')
```

### Cara Kerja Middleware

```
Request masuk
  → auth middleware (cek login)
  → StoreMiddleware
      → baca current_store_id dari session
      → setPermissionsTeamId($storeId)  ← KUNCI
  → BranchMiddleware
      → set branch aktif
  → permission:sale.create (contoh)
      → $user->can('sale.create') → cek di store aktif
```

---

## 6. Sistem Plan/Paket

### Definisi Paket (Store::planConfig())

```php
free:
  max_users: 1
  max_branches: 1
  fitur: basic POS + stok + pembelian + promo
  blokir: payment_gateway

basic: (Rp 99k/bulan)
  max_users: 5
  max_branches: 3
  fitur: semua operasional + laporan + payment gateway + custom role

pro: (Rp 199k/bulan)
  max_users: ∞
  max_branches: ∞
  fitur: semua
```

### Cara Plan Bekerja

Plan tersimpan di `stores.plan`. Saat setiap request:

```
HandleInertiaRequests::share()
  → baca stores.plan
  → share ke frontend sebagai storePlan: { plan, features, max_users, ... }

useStoreModules hook (frontend):
  → hasFeature('kitchen') =
      planAllows('kitchen')     // plan izinkan?
      AND moduleActive('kitchen') // modules toko aktifkan?

Sidebar:
  → Menu Kitchen hanya muncul jika hasFeature('kitchen') = true
```

### Enforce di Backend

```php
// UserManagementController::invite()
if (!$store->canAddUser()) {
    return back()->withErrors(['invite' => 'Batas user plan tercapai']);
}

// Store model
public function canAddUser(): bool {
    return $this->users()->count() < $this->max_users;
}
```

### Developer Set Plan

Developer masuk ke `/developer/stores/{id}` → Tab Paket → Pilih paket → Save.

---

## 7. Seven Mode Kasir

### Bagaimana Mode Bekerja

Mode ditentukan oleh `stores.modules.pos_modes[]`. Sidebar dan fitur menyesuaikan otomatis.

### Tabel Fitur per Mode

| Fitur | retail | fnb | service | laundry | rental | parking | session |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Produk & Kategori | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Stok & Gudang | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Pembelian | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Retur | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Promo | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Modifier/Topping | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Resep Bahan Baku | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Meja Cafe | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Kitchen Display | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Waste/Pemborosan | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Antrian | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Komisi Karyawan | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Booking | ❌ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ |
| Membership | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ |
| Deposit Pelanggan | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Laporan | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### Data di Tabel Sales

Semua transaksi disimpan di 1 tabel `sales` dengan kolom mode-specific yang nullable:

```
sales
  ├── pos_mode          ← retail/fnb/service/laundry/rental/parking/session
  ├── order_type        ← dine_in/takeaway/delivery (FnB)
  │
  ├── [FnB]
  │   ├── table_id
  │   ├── kitchen_status
  │   └── delivery_address
  │
  ├── [Service]
  │   ├── employee_id
  │   ├── service_status
  │   └── service_started/finished_at
  │
  ├── [Laundry]
  │   ├── laundry_status
  │   ├── weight_kg
  │   └── estimated_done_at
  │
  ├── [Rental]
  │   ├── rental_status
  │   ├── rent_start/end_at
  │   └── deposit_amount
  │
  ├── [Parking]
  │   ├── plate_number
  │   ├── parking_ticket_no
  │   └── entry/exit_at
  │
  └── [Session]
      ├── session_status
      ├── unit_name
      └── session_started/ended_at
```

---

## 8. Database Schema

### Tabel Inti

```sql
-- users
id, name, email, password, is_developer, created_at

-- stores
id, code, name, store_type, modules (JSON), logo,
currency, decimal_places, timezone,
tax_inclusive, default_tax_rate,
receipt_header, receipt_footer,
phone, email, address, is_active,
plan, plan_expires_at, max_users, max_branches

-- branches
id, store_id, code, name, phone, address, is_active

-- user_store (pivot)
user_id, store_id

-- employees
id, store_id, branch_id, user_id, employee_code, name,
phone, email, position,
commission_type (none/percent/flat), commission_value,
status (active/inactive/terminated)

-- customers
id, store_id, code, name, phone, email, address,
birth_date, gender, points, tier, total_spent,
deposit_balance, last_visit_at, is_active

-- products
id, store_id, category_id, supplier_id, sku, barcode, name,
type (finished_goods/raw_material/combo/service/rental_item/time_based),
unit, base_unit, cost_price, sell_price,
price_per_hour, min_duration_minutes,
stock_minimum, track_stock, is_active

-- sales
id, store_id, branch_id, customer_id, user_id, cashier_shift_id,
sale_no, sale_date, pos_mode, order_type,
subtotal, discount_amount, tax_amount, grand_total,
paid_amount, change_amount, status, payment_status,
[+ kolom spesifik mode: table_id, kitchen_status, dll]

-- sale_items
id, sale_id, product_id, variant_id, employee_id,
quantity, price, discount_amount, subtotal,
item_status, modifiers (JSON), recipe_snapshot (JSON)

-- cashier_shifts
id, store_id, branch_id, user_id, shift_no,
opened_at, closed_at, opening_cash, actual_cash,
total_sales, status

-- Spatie permission tables
permissions, roles, model_has_permissions, model_has_roles, role_has_permissions
```

---

## 9. API & Routes

### Developer Routes (`/developer/*`)

| Method | URL | Nama | Keterangan |
|---|---|---|---|
| GET | /developer/dashboard | developer.dashboard | Dashboard platform |
| GET/POST | /developer/stores | developer.stores.* | CRUD toko |
| GET | /developer/stores/{id} | developer.stores.show | Detail + plan + modules |
| PATCH | /developer/stores/{id} | developer.stores.update | Update termasuk plan |
| POST | /developer/stores/{id}/assign-owner | developer.stores.assign-owner | Assign owner ke toko |
| DELETE | /developer/stores/{id}/revoke-owner | developer.stores.revoke-owner | Cabut akses owner |
| GET/POST | /developer/users | developer.users.* | CRUD user global |
| GET | /developer/branches | developer.branches.index | Overview semua cabang |

### Store Routes (`/app/*`)

| Method | URL | Permission | Keterangan |
|---|---|---|---|
| GET | /app/dashboard | - | Dashboard (semua role) |
| GET | /app/kasir | sale.create | Halaman POS |
| POST | /app/kasir/store | sale.create | Submit transaksi |
| GET | /app/sales | sale.view | List penjualan |
| GET/POST | /app/purchases | purchase.view/create | Pembelian |
| GET/POST | /app/cashier-shifts | shift.view/open | Shift kasir |
| GET/POST | /app/expenses | expense.view/create | Pengeluaran |
| GET/POST | /app/products | product.view/create | Produk |
| GET/POST | /app/employees | employee.view/create | Karyawan |
| GET/POST | /app/customers | customer.view/create | Pelanggan |
| GET/POST | /app/roles | role:owner | Role management |
| GET/POST | /app/store-users | role:owner | User management |
| GET/POST | /app/settings | setting.edit | Pengaturan toko |

---

## 10. Konfigurasi Sidebar

### Cara Kerja (2 Layer Check)

```
Sidebar item muncul jika SEMUA kondisi terpenuhi:
  1. can('permission_name')          → user punya permission?
  2. hasFeature('feature_name')      → fitur aktif di modules DAN diizinkan plan?
  3. hasMode('mode_name')            → toko pakai mode ini?
```

### File Terkait

- `resources/js/Config/navConfig.js` — definisi semua menu dan kondisinya
- `resources/js/Hooks/useStoreModules.js` — hook helper untuk cek modules + plan
- `resources/js/Layouts/AuthenticatedLayout.jsx` — render sidebar + topbar

### Contoh Penggunaan

```javascript
// Di navConfig.js
if (needsTable && can('table.view')) {
    // Menu Meja hanya muncul jika:
    // - store aktifkan fitur 'table' di modules
    // - plan mengizinkan 'table'
    // - user punya permission 'table.view'
    sidebarItems.push({ name: 'Meja', href: route('admin.cafe-tables.index') })
}
```

---

## 11. Akun Demo

### Developer
| Email | Password | Keterangan |
|---|---|---|
| dev@gmail.com | password | Developer utama |
| dev@simkasir.id | password | Developer 2 |

### Owner
| Email | Password | Toko | Tipe |
|---|---|---|---|
| owner@gmail.com | password | Minimarket Sejahtera | Retail |
| owner2@gmail.com | password | Warung Kopi Senja | FnB |
| owner3@gmail.com | password | Barbershop Rapi | Service |
| owner4@gmail.com | password | Sewa Alat Jaya | Rental |
| owner5@gmail.com | password | Futsal Merdeka | Ticket |
| owner6@gmail.com | password | Villa Sunrise | Hospitality |

### Kasir
| Email | Password | Toko | Cabang |
|---|---|---|---|
| rizki@gmail.com | password | Minimarket Sejahtera | Pusat |
| sari@gmail.com | password | Minimarket Sejahtera | Babarsari |
| kasir@gmail.com | password | Kopi Senja | Pusat |
| dewi@gmail.com | password | Kopi Senja | UGM |
| barber@gmail.com | password | Barbershop Rapi | Pusat |
| sewa@gmail.com | password | Sewa Alat Jaya | Pusat |
| futsal@gmail.com | password | Futsal Merdeka | Pusat |
| villa@gmail.com | password | Villa Sunrise | Pusat |

---

## 12. Cara Setup & Menjalankan

### Prerequisites
- PHP 8.3+
- MySQL 8+
- Node.js 18+
- Composer

### Instalasi

```bash
# Clone dan install dependencies
composer install
npm install

# Setup environment
cp .env.example .env
php artisan key:generate

# Edit .env — set DB_DATABASE, DB_USERNAME, DB_PASSWORD

# Migrate dan seed data demo
php artisan migrate:fresh --seed

# Build frontend
npm run build

# Jalankan server
php artisan serve
```

### Akses
- **Aplikasi**: http://127.0.0.1:8000
- **Login developer**: dev@gmail.com / password → http://127.0.0.1:8000/developer/dashboard
- **Login owner**: owner@gmail.com / password → http://127.0.0.1:8000/app/dashboard

### Development Mode

```bash
# Terminal 1 — PHP server
php artisan serve

# Terminal 2 — Vite dev server (hot reload)
npm run dev
```

### Tambah Toko Baru (via Developer Panel)

1. Login sebagai developer
2. Buka `/developer/stores/create`
3. Isi info toko, pilih tipe, buat cabang
4. Assign atau buat user owner
5. Toko siap dipakai

### Reset Data Demo

```bash
php artisan migrate:fresh --seed
```

---

## Catatan Teknis Penting

### Spatie Teams (store_id)

Karena `config/permission.php` mengaktifkan `teams = true` dengan `team_foreign_key = 'store_id'`, **semua operasi Spatie harus selalu mengatur team context terlebih dahulu**:

```php
// BENAR
app(PermissionRegistrar::class)->setPermissionsTeamId($storeId);
$user->hasRole('kasir');  // cek role di store ini

// SALAH — akan selalu return false
$user->hasRole('kasir');  // tanpa set team dulu
```

`StoreMiddleware` otomatis set team context untuk setiap request web. Untuk code di luar request (command, job), harus set manual.

### Developer Role

Developer **tidak menggunakan Spatie role** karena Spatie teams mensyaratkan store_id. Developer diidentifikasi via `users.is_developer = true`.

```php
// Cek developer
$user->isDeveloper()  // → cek kolom is_developer, bukan Spatie

// Buat user developer baru
User::create([
    'name'         => 'Dev Baru',
    'email'        => 'dev2@simkasir.id',
    'password'     => Hash::make('password'),
    'is_developer' => true,
]);
```

### Modules vs Plan

- **`modules.features`** = fitur yang *diaktifkan developer* untuk toko ini (via developer panel)
- **`stores.plan`** = batas yang *boleh diaktifkan* berdasarkan paket langganan

Kedua-duanya harus lolos agar fitur muncul di sidebar:
```
hasFeature('kitchen') = moduleActive('kitchen') AND planAllows('kitchen')
```

---

*Dokumentasi ini digenerate pada: Juli 2026*
*Versi: 1.0.0*
