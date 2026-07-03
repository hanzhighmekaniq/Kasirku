# SIM-KASIR — Dokumentasi Database

> Panduan lengkap struktur database untuk pengembang yang ingin memahami, memodifikasi, atau mengembangkan lebih lanjut sistem POS (Point of Sale) SIM-KASIR.

---

## Daftar Isi

1. [Ikhtisar Umum](#1-ikhtisar-umum)
2. [Arsitektur Database](#2-arsitektur-database)
3. [Detil Tabel](#3-detil-tabel)
   - [3.1 Autentikasi & Pengguna](#31-autentikasi--pengguna)
   - [3.2 Master Data](#32-master-data)
   - [3.3 Manajemen Produk](#33-manajemen-produk)
   - [3.4 Inventaris & Stok](#34-inventaris--stok)
   - [3.5 Penjualan (Sales)](#35-penjualan-sales)
   - [3.6 Promosi](#36-promosi)
   - [3.7 Pembelian (Purchases)](#37-pembelian-purchases)
   - [3.8 Retur Pembelian](#38-retur-pembelian)
   - [3.9 Keuangan (Expenses)](#39-keuangan-expenses)
   - [3.10 Fitur Khusus Cafe](#310-fitur-khusus-cafe)
   - [3.11 Integrasi Payment Gateway](#311-integrasi-payment-gateway)
   - [3.12 Sistem & Audit Log](#312-sistem--audit-log)
   - [3.13 Retur Penjualan](#313-retur-penjualan)
4. [Diagram Relasi Antar Tabel (ERD)](#4-diagram-relasi-antar-tabel-erd)
5. [Alur Data Utama](#5-alur-data-utama)
   - [5.1 Alur Penjualan (POS)](#51-alur-penjualan-pos)
   - [5.2 Alur Pembelian](#52-alur-pembelian)
   - [5.3 Alur Retur Penjualan](#53-alur-retur-penjualan)
   - [5.4 Alur Retur Pembelian](#54-alur-retur-pembelian)
   - [5.5 Alur Stok Opname](#55-alur-stok-opname)
6. [Panduan Multi-Toko & Multi-Cabang](#6-panduan-multi-toko--multi-cabang)
7. [Catatan untuk Pengembang](#7-catatan-untuk-pengembang)

---

## 1. Ikhtisar Umum

**SIM-KASIR** adalah sistem Point of Sale (POS) all-in-one yang mendukung 3 mode bisnis:

| Mode Bisnis | Deskripsi | Contoh |
|---|---|---|
| `minimarket` | Toko kelontong / minimarket dengan banyak produk, stok, dan supplier | Indomaret, Alfamart |
| `cafe` | Kafe / restoran dengan meja, variasi produk, dan modifier (topping) | Kopi Kenangan, Starbucks |
| `booth_coffee` | Booth kopi kecil / kios dengan transaksi cepat | Booth kopi di mall |

Database dirancang dengan pendekatan **multi-tenant** (satu database bisa menampung banyak toko) dan **multi-cabang** (satu toko punya banyak cabang).

**Total Tabel Custom: 38 tabel** (dari 37 migration files custom)

**Tech Stack Database:**
- MySQL 8.4.8
- Laravel 12 + Eloquent ORM
- 42 migration files total (5 dari Breeze, 37 custom — `stock_transfers` migration membuat 2 tabel)

---

## 2. Arsitektur Database

```
┌─────────────────────────────────────────────────────────┐
│                    AKUN & OTORISASI                      │
│  users (Breeze + custom fields)                         │
└───────────────────────┬─────────────────────────────────┘
                        │ store_id
┌───────────────────────▼─────────────────────────────────┐
│                    MASTER DATA                           │
│  stores ──┬── branches ──── employees                    │
│           │                                              │
│  categories (self-referencing parent)                    │
│  suppliers                                               │
│  customers (loyalty: points, tier)                       │
│  payment_methods                                         │
└───────────────────────┬─────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────┐
│                 MANAJEMEN PRODUK                         │
│  products ──┬── product_variants                         │
│             ├── product_batches                          │
│             ├── product_stocks (per toko/cabang)         │
│             └── product_modifier_products ──┐            │
│                                            │            │
│  product_modifier_groups ── product_modifiers            │
└───────────────────────┬─────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────┐
│              INVENTARIS & PERGERAKAN STOK                │
│  stock_movements (log semua perubahan stok)              │
│  stock_adjustments ── stock_adjustment_items             │
│  stock_opnames ── stock_opname_items                     │
│  stock_transfers ── stock_transfer_items                 │
└───────────────────────┬─────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        ▼                               ▼
┌───────────────┐             ┌───────────────┐
│   PENJUALAN   │             │   PEMBELIAN   │
│  sales        │             │  purchases    │
│  sale_items   │             │  purchase_items│
│  sale_payments│             │  purchase_payments│
│               │             │  purchase_returns│
│  promotions   │             │  purchase_return_items│
│  promotion_products│        │               │
└───────┬───────┘             └───────┬───────┘
        │                             │
        └──────────┬──────────────────┘
                   ▼
        ┌───────────────┐
        │   KEUANGAN    │
        │  expenses     │
        │  expense_categories│
        │  payment_gateway_transactions│
        └───────────────┘
```

---

## 3. Detil Tabel

---

### 3.1 Autentikasi & Pengguna

#### `users` (diperluas dari Breeze)

Tabel default Laravel Breeze yang ditambahkan kolom `store_id` dan `role` untuk mendukung multi-toko dan otorisasi berbasis peran.

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| `id` | bigint (PK) | auto-increment | ID unik pengguna |
| `store_id` | bigint (FK → stores) | nullable | ID toko tempat pengguna terdaftar. `NULL` untuk super admin |
| `name` | varchar | required | Nama lengkap pengguna |
| `role` | varchar(20) | default: `cashier` | Peran pengguna: `owner` / `manager` / `cashier` |
| `email` | varchar | unique | Email untuk login |
| `email_verified_at` | timestamp | nullable | Waktu email diverifikasi |
| `password` | varchar | required | Hash password (bcrypt) |
| `remember_token` | varchar | nullable | Token "ingat saya" |
| `created_at` | timestamp | auto | Waktu pembuatan |
| `updated_at` | timestamp | auto | Waktu update terakhir |

**Peran Pengguna:**

| Role | Hak Akses |
|---|---|
| `owner` | Akses penuh: pengaturan toko, laporan keuangan, manajemen user, semua CRUD |
| `manager` | Kelola produk, stok, pembelian, penjualan, laporan. Tidak bisa ubah pengaturan toko |
| `cashier` | Hanya kasir (POS), melihat produk, proses penjualan |

**Seed Data:**
- `owner@gmail.com` / password → role: owner
- `manager@gmail.com` / password → role: manager
- `kasir@gmail.com` / password → role: cashier

---

### 3.2 Master Data

#### `stores`

Tabel utama yang merepresentasikan sebuah bisnis/toko. Setiap data lain di dalam sistem terikat ke satu toko.

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| `id` | bigint (PK) | auto-increment | ID unik toko |
| `code` | varchar(50) | unique | Kode toko (misal: `STORE001`) |
| `name` | varchar | required | Nama toko |
| `store_type` | varchar(30) | default: `minimarket` | Tipe bisnis: `minimarket` / `cafe` / `booth_coffee` |
| `logo` | varchar | nullable | Path file logo toko |
| `receipt_footer` | text | nullable | Teks footer struk (misal: "Terima kasih telah berbelanja") |
| `phone` | varchar(30) | nullable | No. telepon toko |
| `email` | varchar | unique | Email toko |
| `address` | text | nullable | Alamat lengkap toko |
| `is_active` | boolean | default: `true` | Apakah toko aktif |
| `created_at` | timestamp | auto | Waktu pembuatan |
| `updated_at` | timestamp | auto | Waktu update terakhir |

**Seed Data:** 1 toko (`STORE001`, "SIM-KASIR Demo", type: `minimarket`)

---

#### `branches`

Tabel cabang. Satu toko bisa punya banyak cabang. Cabang digunakan untuk membedakan lokasi stok dan transaksi.

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| `id` | bigint (PK) | auto-increment | ID unik cabang |
| `store_id` | bigint (FK → stores) | required, cascade delete | ID toko pemilik cabang |
| `code` | varchar(50) | unique per store | Kode cabang (misal: `BR001`). Unik dalam 1 toko |
| `name` | varchar | required | Nama cabang |
| `phone` | varchar(30) | nullable | No. telepon cabang |
| `address` | text | nullable | Alamat cabang |
| `is_active` | boolean | default: `true` | Apakah cabang aktif |
| `created_at` | timestamp | auto | Waktu pembuatan |
| `updated_at` | timestamp | auto | Waktu update terakhir |

**Unique Constraint:** `(store_id, code)` — kode cabang unik dalam 1 toko.

**Seed Data:** 1 cabang (`BR001`, "Cabang Utama")

---

#### `employees`

Tabel karyawan. Karyawan bisa dihubungkan ke akun `users` untuk login, atau berdiri sendiri sebagai data karyawan tanpa akses sistem.

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| `id` | bigint (PK) | auto-increment | ID unik karyawan |
| `store_id` | bigint (FK → stores) | required, cascade delete | ID toko |
| `branch_id` | bigint (FK → branches) | nullable, null on delete | ID cabang tempat karyawan bekerja |
| `user_id` | bigint (FK → users) | nullable, unique, null on delete | ID akun user untuk login. 1 user = 1 karyawan |
| `employee_code` | varchar(50) | unique per store | Kode karyawan (misal: `EMP001`) |
| `name` | varchar | required | Nama lengkap karyawan |
| `phone` | varchar(30) | nullable | No. telepon |
| `email` | varchar | unique | Email karyawan |
| `position` | varchar(100) | nullable | Jabatan (misal: "Kasir", "Manager Shift") |
| `status` | varchar(20) | default: `active` | Status: `active` / `inactive` / `terminated` |
| `created_at` | timestamp | auto | Waktu pembuatan |
| `updated_at` | timestamp | auto | Waktu update terakhir |

**Unique Constraint:** `(store_id, employee_code)` — kode karyawan unik dalam 1 toko.

---

#### `categories`

Tabel kategori produk. Mendukung **hirarki parent-child** (sub-kategori) dan tipe kategori.

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| `id` | bigint (PK) | auto-increment | ID unik kategori |
| `parent_id` | bigint (FK → categories) | nullable, null on delete | ID kategori induk. `NULL` untuk kategori root. Self-referencing FK |
| `name` | varchar | required | Nama kategori |
| `type` | varchar(30) | default: `product` | Tipe: `product` (produk jual) / `raw_material` (bahan baku) |
| `slug` | varchar | unique | Slug URL-friendly (misal: `minuman`, `makanan-ringan`) |
| `description` | text | nullable | Deskripsi kategori |
| `created_at` | timestamp | auto | Waktu pembuatan |
| `updated_at` | timestamp | auto | Waktu update terakhir |

**Self-Referencing:** Kolom `parent_id` mereferensi tabel `categories` sendiri, memungkinkan struktur hierarki seperti:
```
Makanan Ringan
├── Keripik
├── Biskuit
└── Permen
```

**Seed Data:** 5 kategori (Minuman, Makanan Ringan, Sembako, Rokok, Perlengkapan Kebersihan)

---

#### `customers`

Tabel pelanggan dengan sistem **loyalty points** dan **tier**. Digunakan untuk program loyalitas (kumpulkan poin dari pembelian).

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| `id` | bigint (PK) | auto-increment | ID unik pelanggan |
| `code` | varchar(50) | unique | Kode pelanggan (misal: `CUST001`) |
| `name` | varchar | required | Nama pelanggan |
| `phone` | varchar(30) | nullable | No. telepon (bisa digunakan sebagai identifikasi saat kasir) |
| `email` | varchar | unique | Email pelanggan |
| `address` | text | nullable | Alamat pelanggan |
| `points` | unsigned int | default: `0` | Poin loyalitas yang terkumpul |
| `tier` | varchar(20) | default: `bronze` | Level pelanggan: `bronze` / `silver` / `gold` |
| `total_spent` | decimal(15,2) | default: `0` | Total belanja sepanjang waktu (Rp) |
| `last_visit_at` | timestamp | nullable | Waktu kunjungan terakhir |
| `created_at` | timestamp | auto | Waktu pembuatan |
| `updated_at` | timestamp | auto | Waktu update terakhir |

**Sistem Tier:**
| Tier | Threshold (total_spent) | Benefit |
|---|---|---|
| Bronze | < Rp 1.000.000 | Default, tanpa benefit khusus |
| Silver | Rp 1.000.000 - Rp 5.000.000 | Discount khusus |
| Gold | > Rp 5.000.000 | Maximum discount + priority |

---

#### `suppliers`

Tabel pemasok/barang. Menyimpan data pemasok yang menyuplai produk ke toko.

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| `id` | bigint (PK) | auto-increment | ID unik supplier |
| `code` | varchar(50) | unique | Kode supplier (misal: `SUP0001`) |
| `name` | varchar | required | Nama perusahaan/perorangan supplier |
| `phone` | varchar(30) | nullable | No. telepon supplier |
| `email` | varchar | unique | Email supplier |
| `address` | text | nullable | Alamat supplier |
| `created_at` | timestamp | auto | Waktu pembuatan |
| `updated_at` | timestamp | auto | Waktu update terakhir |

> **Catatan:** Tabel ini TIDAK memiliki kolom `contact_person`. Jika diperlukan, tambahkan melalui migration baru.

**Seed Data:** 1 supplier (`SUP0001`, "Supplier Utama")

---

#### `payment_methods`

Tabel metode pembayaran yang tersedia di toko (tunai, kartu, QRIS, transfer, dll).

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| `id` | bigint (PK) | auto-increment | ID unik metode pembayaran |
| `code` | varchar(50) | unique | Kode singkat (misal: `CASH`, `QRIS`, `CARD`, `TF`) |
| `name` | varchar | required | Nama metode pembayaran |
| `type` | varchar(50) | nullable | Tipe: `cash` / `digital` / `card` / `credit` |
| `provider` | varchar(100) | nullable | Provider (misal: "GoPay", "OVO", "BCA") |
| `is_active` | boolean | default: `true` | Apakah metode ini aktif digunakan |
| `created_at` | timestamp | auto | Waktu pembuatan |
| `updated_at` | timestamp | auto | Waktu update terakhir |

**Seed Data:**
- `CASH` — Tunai (type: `cash`)
- `QRIS` — QRIS (type: `digital`)
- `CARD` — Kartu Debit/Kredit (type: `card`)
- `TF` — Transfer Bank (type: `digital`)

---

### 3.3 Manajemen Produk

#### `products`

Tabel produk utama. Mendukung 3 tipe produk: barang jadi, bahan baku, dan combo/paket.

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| `id` | bigint (PK) | auto-increment | ID unik produk |
| `category_id` | bigint (FK → categories) | nullable, null on delete | ID kategori produk |
| `supplier_id` | bigint (FK → suppliers) | nullable, null on delete | ID supplier utama produk ini |
| `sku` | varchar(100) | unique | SKU (Stock Keeping Unit) — kode unik internal |
| `barcode` | varchar(100) | unique, nullable | Barcode produk (EAN-13/EAN-8) untuk scanner |
| `name` | varchar | required | Nama produk |
| `type` | varchar(30) | default: `finished_goods` | Tipe: `finished_goods` (barang jadi) / `raw_material` (bahan baku) / `combo` (paket) |
| `image` | varchar | nullable | Path file gambar produk |
| `is_composable` | boolean | default: `false` | Apakah produk ini bisa dikomposisi dari produk lain (untuk combo) |
| `preparation_time` | unsigned int | nullable | Waktu persiapan dalam menit (untuk cafe, misal: kopi butuh 5 menit) |
| `is_sellable` | boolean | default: `true` | Apakah produk bisa dijual. `false` untuk bahan baku |
| `unit` | varchar(30) | default: `pcs` | Satuan: `pcs` / `kg` / `liter` / `box` / `pack` |
| `cost_price` | decimal(15,2) | default: `0` | Harga beli/modal produk (Rp) |
| `sell_price` | decimal(15,2) | default: `0` | Harga jual produk (Rp) |
| `stock_minimum` | int | default: `0` | Batas minimum stok. Di bawah ini = stok menipis |
| `track_stock` | boolean | default: `true` | Apakah stok perlu dilacak. `false` untuk produk unlimited |
| `is_active` | boolean | default: `true` | Apakah produk aktif dijual |
| `created_at` | timestamp | auto | Waktu pembuatan |
| `updated_at` | timestamp | auto | Waktu update terakhir |

> **PENTING:** Gunakan `sell_price` dan `cost_price`, BUKAN `price`. Ini adalah bug umum di React components.

**Seed Data:** 15 produk (Aqua, Teh Pucuk, Indomie, Beras, dll)

---

#### `product_variants`

Tabel variasi produk. Digunakan untuk produk yang punya beberapa varian (misal: ukuran S/M/L, rasa Original/Sambal).

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| `id` | bigint (PK) | auto-increment | ID unik varian |
| `product_id` | bigint (FK → products) | required, cascade delete | ID produk induk |
| `name` | varchar(100) | required | Nama varian (misal: "Ukuran Large", "Rasa Sambal") |
| `sku` | varchar(100) | unique | SKU unik varian |
| `barcode` | varchar(100) | unique, nullable | Barcode varian |
| `price` | decimal(15,2) | default: `0` | Harga jual varian |
| `cost_price` | decimal(15,2) | default: `0` | Harga beli varian |
| `is_active` | boolean | default: `true` | Apakah varian aktif |
| `created_at` | timestamp | auto | Waktu pembuatan |
| `updated_at` | timestamp | auto | Waktu update terakhir |

**Contoh Penggunaan:**
```
Produk: "Kopi Susu"
├── Varian: "Regular" (SKU: KOPIS_REG, Rp 18.000)
├── Varian: "Large" (SKU: KOPIS_LRG, Rp 23.000)
└── Varian: "Extra Large" (SKU: KOPIS_XL, Rp 28.000)
```

---

#### `product_modifier_groups`

Tabel grup modifier untuk produk cafe. Modifier adalah pilihan tambahan yang bisa dipilih pelanggan saat memesan (misal: level gula, topping, ukuran).

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| `id` | bigint (PK) | auto-increment | ID unik grup modifier |
| `name` | varchar(100) | required | Nama grup (misal: "Level Gula", "Topping", "Level Pedas") |
| `description` | varchar(255) | nullable | Deskripsi grup |
| `is_required` | boolean | default: `false` | Apakah wajib dipilih (misal: level gula untuk minuman) |
| `selection_type` | varchar(20) | default: `single` | `single` (pilih 1) / `multiple` (bisa pilih banyak) |
| `max_selection` | unsigned int | nullable | Batas maksimal pilihan (untuk `multiple`) |
| `sort_order` | unsigned int | default: `0` | Urutan tampil |
| `is_active` | boolean | default: `true` | Apakah grup aktif |
| `created_at` | timestamp | auto | Waktu pembuatan |
| `updated_at` | timestamp | auto | Waktu update terakhir |

---

#### `product_modifiers`

Tabel pilihan modifier di dalam sebuah grup. Setiap grup punya banyak pilihan.

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| `id` | bigint (PK) | auto-increment | ID unik modifier |
| `modifier_group_id` | bigint (FK → product_modifier_groups) | required, cascade delete | ID grup modifier |
| `name` | varchar(100) | required | Nama pilihan (misal: "Less Sugar", "Extra Shot", "Taro") |
| `price_addition` | decimal(15,2) | default: `0` | Tambahan harga (Rp). 0 = gratis, 3000 = +Rp 3.000 |
| `is_active` | boolean | default: `true` | Apakah pilihan aktif |
| `sort_order` | unsigned int | default: `0` | Urutan tampil |
| `created_at` | timestamp | auto | Waktu pembuatan |
| `updated_at` | timestamp | auto | Waktu update terakhir |

**Contoh Struktur:**
```
Grup: "Level Gula" (required, single)
├── "Normal" (+Rp 0)
├── "Less Sugar" (+Rp 0)
└── "No Sugar" (+Rp 0)

Grup: "Topping" (optional, multiple, max: 3)
├── "Extra Shot" (+Rp 5.000)
├── "Taro" (+Rp 3.000)
└── "Bobba" (+Rp 4.000)
```

---

#### `product_modifier_products`

Tabel **pivot** (penghubung) antara produk dan grup modifier. Menentukan grup modifier mana yang berlaku untuk produk mana.

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| `id` | bigint (PK) | auto-increment | ID |
| `product_id` | bigint (FK → products) | required, cascade delete | ID produk |
| `modifier_group_id` | bigint (FK → product_modifier_groups) | required, cascade delete | ID grup modifier |
| `created_at` | timestamp | auto | Waktu pembuatan |
| `updated_at` | timestamp | auto | Waktu update terakhir |

**Unique Constraint:** `(product_id, modifier_group_id)` — satu produk hanya bisa punya satu grup modifier sekali.

**Contoh:**
```
Produk "Kopi Susu" → grup "Level Gula" + grup "Topping"
Produk "Teh Tarik" → grup "Level Gula" saja
```

---

### 3.4 Inventaris & Stok

#### `product_batches`

Tabel **batch/stok masuk**. Setiap kali produk masuk (pembelian), dibuat batch baru dengan nomor batch, tanggal beli, dan kadaluarsa. Ini memungkinkan **FIFO** (First In First Out) dan pelacakan expiry.

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| `id` | bigint (PK) | auto-increment | ID unik batch |
| `product_id` | bigint (FK → products) | required, cascade delete | ID produk |
| `store_id` | bigint (FK → stores) | nullable, null on delete | ID toko |
| `branch_id` | bigint (FK → branches) | nullable, null on delete | ID cabang |
| `batch_no` | varchar(100) | unique per product | Nomor batch (misal: `BATCH-20260601-001`) |
| `purchase_date` | date | nullable | Tanggal batch dibeli/diterima |
| `expiry_date` | date | nullable | Tanggal kadaluarsa. `NULL` = tidak kadaluarsa |
| `quantity` | int | default: `0` | Sisa quantity dalam batch ini |
| `cost_price` | decimal(15,2) | default: `0` | Harga beli per unit saat batch ini dibeli (harga bisa berubah tiap pembelian) |
| `created_at` | timestamp | auto | Waktu pembuatan |
| `updated_at` | timestamp | auto | Waktu update terakhir |

**Unique Constraint:** `(product_id, batch_no)` — nomor batch unik per produk.

**Penggunaan:**
```
Pembelian "Aqua 600ml" pada 1 Juni 2026
  → Batch: BATCH-AQUA600-20260601, qty: 100, cost: Rp 3.000, expiry: 1 Des 2026

Pembelian "Aqua 600ml" pada 15 Juni 2026
  → Batch: BATCH-AQUA600-20260615, qty: 50, cost: Rp 3.200, expiry: 15 Des 2026

Penjualan akan mengurangi batch paling lama dulu (FIFO)
```

---

#### `product_stocks`

Tabel **stok agregat** per produk, per toko, per cabang. Ini adalah jumlah stok total yang terlihat di UI. Diupdate setiap ada transaksi masuk/keluar.

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| `id` | bigint (PK) | auto-increment | ID |
| `product_id` | bigint (FK → products) | required, cascade delete | ID produk |
| `store_id` | bigint (FK → stores) | nullable, null on delete | ID toko |
| `branch_id` | bigint (FK → branches) | nullable, null on delete | ID cabang |
| `quantity` | int | default: `0` | Jumlah stok aktual |
| `reserved_quantity` | int | default: `0` | Jumlah stok yang di-reserve (belum dikurangi tapi sudah "dipesan") |
| `created_at` | timestamp | auto | Waktu pembuatan |
| `updated_at` | timestamp | auto | Waktu update terakhir |

**Unique Constraint:** `(product_id, store_id, branch_id)` — satu kombinasi produk+toko+cabang hanya punya 1 baris stok.

**Field Penting:**
- `quantity` = stok aktual yang bisa dijual
- `reserved_quantity` = stok yang sudah dipesan/di-reserve (misal: pesanan online belum diambil)
- **Stok tersedia** = `quantity - reserved_quantity`

---

#### `stock_movements`

Tabel **log pergerakan stok**. Setiap perubahan stok (masuk, keluar, penyesuaian) dicatat di sini sebagai audit trail.

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| `id` | bigint (PK) | auto-increment | ID |
| `product_id` | bigint (FK → products) | required, cascade delete | ID produk |
| `product_batch_id` | bigint (FK → product_batches) | nullable, null on delete | ID batch (jika pelacakan per batch) |
| `store_id` | bigint (FK → stores) | nullable, null on delete | ID toko |
| `branch_id` | bigint (FK → branches) | nullable, null on delete | ID cabang |
| `reference_type` | varchar | nullable | Tipe relasi polimorfik (misal: `App\Models\Purchase`) |
| `reference_id` | bigint | nullable | ID relasi polimorfik |
| `movement_type` | varchar(30) | required | Tipe pergerakan (lihat tabel di bawah) |
| `quantity` | int | required | Jumlah (+ untuk masuk, - untuk keluar) |
| `unit_cost` | decimal(15,2) | nullable | Harga satuan saat pergerakan ini |
| `reference_no` | varchar(100) | nullable | No. referensi (misal: nomor faktur pembelian) |
| `notes` | text | nullable | Catatan |
| `moved_at` | timestamp | default: now() | Waktu pergerakan terjadi |
| `created_at` | timestamp | auto | Waktu record dibuat |
| `updated_at` | timestamp | auto | Waktu update terakhir |

**Jenis Pergerakan (`movement_type`):**

| Tipe | Keterangan | Quantity |
|---|---|---|
| `purchase_in` | Stok masuk dari pembelian | Positif (+) |
| `sale_out` | Stok keluar karena penjualan | Negatif (-) |
| `adjustment_in` | Penyesuaian stok naik | Positif (+) |
| `adjustment_out` | Penyesuaian stok turun | Negatif (-) |
| `transfer_in` | Stok masuk dari transfer | Positif (+) |
| `transfer_out` | Stok keluar ke transfer | Negatif (-) |
| `return_in` | Stok masuk dari retur pembelian | Positif (+) |
| `opname_adjustment` | Koreksi dari stock opname | +/- |

**Relasi Polimorfik (`reference_type` + `reference_id`):**
Menghubungkan pergerakan stok ke sumbernya. Contoh:
- `reference_type: Purchase, reference_id: 1` → stok ini masuk dari Pembelian #1
- `reference_type: Sale, reference_id: 5` → stok ini keluar karena Penjualan #5

---

#### `stock_adjustments`

Tabel **penyesuaian stok manual**. Digunakan ketika ada selisih antara stok sistem dan stok fisik yang perlu dikoreksi (bukan karena pembelian/penjualan).

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| `id` | bigint (PK) | auto-increment | ID |
| `store_id` | bigint (FK → stores) | nullable, null on delete | ID toko |
| `branch_id` | bigint (FK → branches) | nullable, null on delete | ID cabang |
| `user_id` | bigint (FK → users) | nullable, null on delete | ID user yang melakukan penyesuaian |
| `adjustment_no` | varchar(100) | unique | Nomor dokumen penyesuaian (misal: `ADJ-20260601-001`) |
| `adjustment_date` | date | required | Tanggal penyesuaian |
| `reason` | varchar(150) | nullable | Alasan penyesuaian (misal: "Barang rusak", "Kesalahan input") |
| `notes` | text | nullable | Catatan detail |
| `status` | varchar(20) | default: `draft` | Status: `draft` / `approved` / `rejected` |
| `created_at` | timestamp | auto | Waktu pembuatan |
| `updated_at` | timestamp | auto | Waktu update terakhir |

---

#### `stock_adjustment_items`

Tabel **item penyesuaian stok**. Setiap penyesuaian bisa mencakup banyak produk.

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| `id` | bigint (PK) | auto-increment | ID |
| `stock_adjustment_id` | bigint (FK → stock_adjustments) | required, cascade delete | ID penyesuaian induk |
| `product_id` | bigint (FK → products) | required, cascade delete | ID produk |
| `product_batch_id` | bigint (FK → product_batches) | nullable, null on delete | ID batch (opsional) |
| `system_qty` | int | default: `0` | Jumlah stok menurut sistem |
| `actual_qty` | int | default: `0` | Jumlah stok fisik aktual |
| `difference_qty` | int | default: `0` | Selisih: `actual_qty - system_qty` |
| `notes` | text | nullable | Catatan item |
| `created_at` | timestamp | auto | Waktu pembuatan |
| `updated_at` | timestamp | auto | Waktu update terakhir |

---

#### `stock_opnames`

Tabel **stock opname** (hitung fisik). Proses menghitung semua stok fisik di gudang/toko dan membandingkan dengan stok sistem.

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| `id` | bigint (PK) | auto-increment | ID |
| `store_id` | bigint (FK → stores) | nullable, null on delete | ID toko |
| `branch_id` | bigint (FK → branches) | nullable, null on delete | ID cabang |
| `user_id` | bigint (FK → users) | nullable, null on delete | ID user yang melakukan opname |
| `opname_no` | varchar(100) | unique | Nomor dokumen opname (misal: `OPN-20260601-001`) |
| `opname_date` | date | required | Tanggal opname |
| `status` | varchar(20) | default: `draft` | Status: `draft` / `in_progress` / `completed` / `cancelled` |
| `notes` | text | nullable | Catatan |
| `created_at` | timestamp | auto | Waktu pembuatan |
| `updated_at` | timestamp | auto | Waktu update terakhir |

---

#### `stock_opname_items`

Tabel **item stock opname**. Detail perhitungan per produk.

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| `id` | bigint (PK) | auto-increment | ID |
| `stock_opname_id` | bigint (FK → stock_opnames) | required, cascade delete | ID opname induk |
| `product_id` | bigint (FK → products) | required, cascade delete | ID produk |
| `product_batch_id` | bigint (FK → product_batches) | nullable, null on delete | ID batch (opsional) |
| `system_qty` | int | default: `0` | Stok menurut sistem |
| `counted_qty` | int | default: `0` | Stok dihitung secara fisik |
| `difference_qty` | int | default: `0` | Selisih: `counted_qty - system_qty` |
| `notes` | text | nullable | Catatan item |
| `created_at` | timestamp | auto | Waktu pembuatan |
| `updated_at` | timestamp | auto | Waktu update terakhir |

> **Perbedaan `stock_adjustments` vs `stock_opnames`:**
> - **Adjustment**: Penyesuaian untuk 1-3 produk yang diketahui selisihnya (misal: barang pecah)
> - **Opname**: Proses hitung fisik menyeluruh untuk SEMUA produk di satu lokasi

---

#### `stock_transfers` & `stock_transfer_items`

Tabel **transfer stok antar cabang**. Digunakan untuk memindahkan stok dari satu cabang ke cabang lain dalam 1 toko yang sama.

**`stock_transfers`:**

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| `id` | bigint (PK) | auto-increment | ID |
| `store_id` | bigint (FK → stores) | required, cascade delete | ID toko |
| `from_branch_id` | bigint (FK → branches) | required, cascade delete | ID cabang asal |
| `to_branch_id` | bigint (FK → branches) | required, cascade delete | ID cabang tujuan |
| `user_id` | bigint (FK → users) | nullable, null on delete | ID user yang melakukan transfer |
| `transfer_no` | varchar(100) | unique | Nomor dokumen (misal: `TRF-20260601-001`) |
| `transfer_date` | date | required | Tanggal transfer |
| `status` | varchar(20) | default: `pending` | Status: `pending` / `in_transit` / `received` / `cancelled` |
| `notes` | text | nullable | Catatan |
| `created_at` | timestamp | auto | Waktu pembuatan |
| `updated_at` | timestamp | auto | Waktu update terakhir |

**`stock_transfer_items`:**

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| `id` | bigint (PK) | auto-increment | ID |
| `stock_transfer_id` | bigint (FK → stock_transfers) | required, cascade delete | ID transfer induk |
| `product_id` | bigint (FK → products) | required, cascade delete | ID produk |
| `quantity` | unsigned int | required | Jumlah yang ditransfer |
| `notes` | text | nullable | Catatan item |
| `created_at` | timestamp | auto | Waktu pembuatan |
| `updated_at` | timestamp | auto | Waktu update terakhir |

**Alur Transfer:**
```
1. Buat transfer: pending
2. Kurangi stok cabang asal (transfer_out)
3. Status → in_transit
4. Cabang tujuan terima barang
5. Tambah stok cabang tujuan (transfer_in)
6. Status → received
```

---

### 3.5 Penjualan (Sales)

#### `sales`

Tabel **header penjualan**. Setiap transaksi kasir menghasilkan 1 record di sini.

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| `id` | bigint (PK) | auto-increment | ID |
| `store_id` | bigint (FK → stores) | nullable, null on delete | ID toko |
| `branch_id` | bigint (FK → branches) | nullable, null on delete | ID cabang |
| `table_id` | bigint | nullable | ID meja (untuk mode cafe). Tidak ada FK langsung untuk fleksibilitas |
| `customer_id` | bigint (FK → customers) | nullable, null on delete | ID pelanggan (opsional, untuk loyalty) |
| `user_id` | bigint (FK → users) | nullable, null on delete | ID kasir/user yang melayani |
| `sale_no` | varchar(100) | unique | Nomor struk (misal: `SL-20260601-001`) |
| `sale_date` | datetime | required | Waktu transaksi |
| `subtotal` | decimal(15,2) | default: `0` | Total sebelum diskon & pajak |
| `discount_amount` | decimal(15,2) | default: `0` | Total diskon (Rp) |
| `tax_amount` | decimal(15,2) | default: `0` | Pajak (PPN 11%) |
| `shipping_amount` | decimal(15,2) | default: `0` | Biaya pengiriman (untuk delivery) |
| `grand_total` | decimal(15,2) | default: `0` | Total akhir: `subtotal - discount + tax + shipping` |
| `paid_amount` | decimal(15,2) | default: `0` | Jumlah yang dibayar pelanggan |
| `change_amount` | decimal(15,2) | default: `0` | Kembalian: `paid_amount - grand_total` |
| `status` | varchar(20) | default: `draft` | Status: `draft` / `completed` / `cancelled` / `refunded` |
| `payment_status` | varchar(20) | default: `unpaid` | Status bayar: `unpaid` / `partial` / `paid` / `refunded` |
| `order_type` | varchar(20) | default: `takeaway` | Tipe pesanan: `dine_in` / `takeaway` / `delivery` |
| `notes` | text | nullable | Catatan (misal: "Jangan pakai es") |
| `created_at` | timestamp | auto | Waktu pembuatan |
| `updated_at` | timestamp | auto | Waktu update terakhir |

**Rumus Keuangan:**
```
grand_total = (subtotal - discount_amount) + tax_amount + shipping_amount
change_amount = paid_amount - grand_total
```

**Status Transaksi:**
```
draft → completed → (refunded)
                  → cancelled
```

---

#### `sale_items`

Tabel **detail item penjualan**. Setiap produk yang dibeli pelanggan.

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| `id` | bigint (PK) | auto-increment | ID |
| `sale_id` | bigint (FK → sales) | required, cascade delete | ID penjualan induk |
| `product_id` | bigint (FK → products) | required, cascade delete | ID produk |
| `variant_id` | bigint | nullable | ID varian produk (jika ada). Tidak ada FK langsung untuk fleksibilitas |
| `product_batch_id` | bigint (FK → product_batches) | nullable, null on delete | ID batch (untuk FIFO) |
| `quantity` | int | required | Jumlah yang dibeli |
| `price` | decimal(15,2) | default: `0` | Harga satuan saat transaksi (bisa berbeda dari `products.sell_price` jika ada promo) |
| `discount_amount` | decimal(15,2) | default: `0` | Diskon per item |
| `subtotal` | decimal(15,2) | default: `0` | Subtotal item: `(price * quantity) - discount_amount` |
| `modifiers` | json | nullable | Pilihan modifier (misal: `[{"name":"Less Sugar","price_addition":0},{"name":"Extra Shot","price_addition":5000}]`) |
| `notes` | text | nullable | Catatan item (misal: "Tanpa es") |
| `created_at` | timestamp | auto | Waktu pembuatan |
| `updated_at` | timestamp | auto | Waktu update terakhir |

---

#### `sale_payments`

Tabel **pembayaran penjualan**. Mendukung **split payment** (bayar dengan 2 metode sekaligus, misal: setengah tunai, setengah QRIS).

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| `id` | bigint (PK) | auto-increment | ID |
| `sale_id` | bigint (FK → sales) | required, cascade delete | ID penjualan |
| `payment_method_id` | bigint (FK → payment_methods) | nullable, null on delete | ID metode pembayaran |
| `paid_at` | datetime | required | Waktu pembayaran |
| `amount` | decimal(15,2) | default: `0` | Jumlah pembayaran (Rp) |
| `reference_no` | varchar(100) | nullable | No. referensi (misal: no. transaksi QRIS) |
| `note` | text | nullable | Catatan |
| `created_at` | timestamp | auto | Waktu pembuatan |
| `updated_at` | timestamp | auto | Waktu update terakhir |

**Contoh Split Payment:**
```
Penjualan #1: grand_total = Rp 50.000
  → Payment 1: Tunai Rp 30.000
  → Payment 2: QRIS Rp 20.000
  → Total bayar = Rp 50.000 ✓
```

---

### 3.6 Promosi

#### `promotions`

Tabel **promosi/diskon**. Mendukung berbagai tipe promosi: diskon persen, diskon nominal, beli X dapat Y, dll.

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| `id` | bigint (PK) | auto-increment | ID |
| `code` | varchar(100) | unique | Kode promo (misal: `DISKON10`, `HAPPYHOUR`) |
| `name` | varchar | required | Nama promosi (misal: "Diskon 10% untuk Minuman") |
| `type` | varchar(50) | required | Tipe: `percentage` / `fixed_amount` / `buy_x_get_y` / `bundle` |
| `discount_value` | decimal(15,2) | default: `0` | Nilai diskon. Untuk `percentage`: 10 = 10%. Untuk `fixed_amount`: 5000 = Rp 5.000 |
| `min_purchase_amount` | decimal(15,2) | default: `0` | Minimum pembelian untuk berlaku (Rp) |
| `max_discount_amount` | decimal(15,2) | nullable | Batas maksimal diskon (untuk tipe `percentage`) |
| `start_date` | date | nullable | Tanggal mulai berlaku |
| `end_date` | date | nullable | Tanggal berakhir berlaku |
| `is_active` | boolean | default: `true` | Apakah promosi aktif |
| `created_at` | timestamp | auto | Waktu pembuatan |
| `updated_at` | timestamp | auto | Waktu update terakhir |

---

#### `promotion_products`

Tabel **pivot** antara promosi dan produk. Menentukan promosi berlaku untuk produk mana.

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| `id` | bigint (PK) | auto-increment | ID |
| `promotion_id` | bigint (FK → promotions) | required, cascade delete | ID promosi |
| `product_id` | bigint (FK → products) | required, cascade delete | ID produk |
| `created_at` | timestamp | auto | Waktu pembuatan |
| `updated_at` | timestamp | auto | Waktu update terakhir |

**Unique Constraint:** `(promotion_id, product_id)`

---

### 3.7 Pembelian (Purchases)

#### `purchases`

Tabel **header pembelian** dari supplier.

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| `id` | bigint (PK) | auto-increment | ID |
| `store_id` | bigint (FK → stores) | nullable, null on delete | ID toko |
| `branch_id` | bigint (FK → branches) | nullable, null on delete | ID cabang penerima |
| `supplier_id` | bigint (FK → suppliers) | required, cascade delete | ID supplier |
| `user_id` | bigint (FK → users) | nullable, null on delete | ID user yang membuat pembelian |
| `purchase_no` | varchar(100) | unique | Nomor faktur (misal: `PUR-20260601-001`) |
| `purchase_date` | datetime | required | Tanggal pembelian |
| `subtotal` | decimal(15,2) | default: `0` | Total sebelum diskon & pajak |
| `discount_amount` | decimal(15,2) | default: `0` | Diskon dari supplier |
| `tax_amount` | decimal(15,2) | default: `0` | Pajak masukan |
| `shipping_amount` | decimal(15,2) | default: `0` | Biaya pengiriman |
| `grand_total` | decimal(15,2) | default: `0` | Total akhir: `subtotal - discount + tax + shipping` |
| `paid_amount` | decimal(15,2) | default: `0` | Sudah dibayar ke supplier |
| `status` | varchar(20) | default: `draft` | Status: `draft` / `confirmed` / `received` / `cancelled` |
| `payment_status` | varchar(20) | default: `unpaid` | Status bayar: `unpaid` / `partial` / `paid` |
| `created_at` | timestamp | auto | Waktu pembuatan |
| `updated_at` | timestamp | auto | Waktu update terakhir |

**Alur Pembelian:**
```
draft → confirmed → received → (payment berulang sampai lunas)
      → cancelled
```

---

#### `purchase_items`

Tabel **detail item pembelian**.

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| `id` | bigint (PK) | auto-increment | ID |
| `purchase_id` | bigint (FK → purchases) | required, cascade delete | ID pembelian induk |
| `product_id` | bigint (FK → products) | required, cascade delete | ID produk |
| `product_batch_id` | bigint (FK → product_batches) | nullable, null on delete | ID batch yang dibuat/ditambah |
| `quantity` | int | required | Jumlah yang dibeli |
| `cost_price` | decimal(15,2) | default: `0` | Harga beli per unit |
| `subtotal` | decimal(15,2) | default: `0` | Subtotal: `cost_price * quantity` |
| `created_at` | timestamp | auto | Waktu pembuatan |
| `updated_at` | timestamp | auto | Waktu update terakhir |

---

#### `purchase_payments`

Tabel **pembayaran ke supplier**. Mendukung cicilan (bayar bertahap).

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| `id` | bigint (PK) | auto-increment | ID |
| `purchase_id` | bigint (FK → purchases) | required, cascade delete | ID pembelian |
| `payment_method_id` | bigint (FK → payment_methods) | nullable, null on delete | ID metode pembayaran |
| `paid_at` | datetime | required | Waktu pembayaran |
| `amount` | decimal(15,2) | default: `0` | Jumlah pembayaran |
| `reference_no` | varchar(100) | nullable | No. referensi (misal: no. transfer) |
| `note` | text | nullable | Catatan |
| `created_at` | timestamp | auto | Waktu pembuatan |
| `updated_at` | timestamp | auto | Waktu update terakhir |

---

### 3.8 Retur Pembelian

#### `purchase_returns`

Tabel **retur pembelian**. Ketika barang dari supplier rusak/tidak sesuai, dikembalikan.

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| `id` | bigint (PK) | auto-increment | ID |
| `purchase_id` | bigint (FK → purchases) | required, cascade delete | ID pembelian asal |
| `supplier_id` | bigint (FK → suppliers) | required, cascade delete | ID supplier |
| `user_id` | bigint (FK → users) | nullable, null on delete | ID user yang melakukan retur |
| `return_no` | varchar(100) | unique | Nomor retur (misal: `RET-20260601-001`) |
| `return_date` | datetime | required | Tanggal retur |
| `subtotal` | decimal(15,2) | default: `0` | Total nilai retur |
| `total_amount` | decimal(15,2) | default: `0` | Total pengembalian dana |
| `notes` | text | nullable | Alasan retur |
| `status` | varchar(20) | default: `draft` | Status: `draft` / `approved` / `completed` / `cancelled` |
| `created_at` | timestamp | auto | Waktu pembuatan |
| `updated_at` | timestamp | auto | Waktu update terakhir |

---

#### `purchase_return_items`

Tabel **detail retur**. Item mana saja yang dikembalikan.

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| `id` | bigint (PK) | auto-increment | ID |
| `purchase_return_id` | bigint (FK → purchase_returns) | required, cascade delete | ID retur induk |
| `purchase_item_id` | bigint (FK → purchase_items) | nullable, null on delete | ID item pembelian asal |
| `product_id` | bigint (FK → products) | required, cascade delete | ID produk yang diretur |
| `quantity` | int | required | Jumlah yang diretur |
| `cost_price` | decimal(15,2) | default: `0` | Harga beli per unit |
| `subtotal` | decimal(15,2) | default: `0` | Subtotal: `cost_price * quantity` |
| `reason` | text | nullable | Alasan retur per item |
| `created_at` | timestamp | auto | Waktu pembuatan |
| `updated_at` | timestamp | auto | Waktu update terakhir |

---

### 3.9 Keuangan (Expenses)

#### `expense_categories`

Tabel **kategori pengeluaran**. Memisahkan pengeluaran berdasarkan jenis.

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| `id` | bigint (PK) | auto-increment | ID |
| `code` | varchar(50) | unique | Kode kategori (misal: `EXP001`) |
| `name` | varchar | unique, required | Nama (misal: "Listrik", "Gaji Karyawan", "Sewa Tempat") |
| `description` | text | nullable | Deskripsi |
| `created_at` | timestamp | auto | Waktu pembuatan |
| `updated_at` | timestamp | auto | Waktu update terakhir |

---

#### `expenses`

Tabel **pengeluaran operasional**. Catatan semua pengeluaran yang bukan pembelian barang.

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| `id` | bigint (PK) | auto-increment | ID |
| `expense_category_id` | bigint (FK → expense_categories) | nullable, null on delete | ID kategori pengeluaran |
| `store_id` | bigint (FK → stores) | nullable, null on delete | ID toko |
| `branch_id` | bigint (FK → branches) | nullable, null on delete | ID cabang |
| `user_id` | bigint (FK → users) | nullable, null on delete | ID user yang mencatat |
| `expense_no` | varchar(100) | unique | Nomor pengeluaran (misal: `EXP-20260601-001`) |
| `expense_date` | datetime | required | Tanggal pengeluaran |
| `amount` | decimal(15,2) | default: `0` | Jumlah pengeluaran (Rp) |
| `notes` | text | nullable | Catatan |
| `status` | varchar(20) | default: `posted` | Status: `draft` / `posted` / `cancelled` |
| `created_at` | timestamp | auto | Waktu pembuatan |
| `updated_at` | timestamp | auto | Waktu update terakhir |

**Contoh Pengeluaran:**
```
Listrik bulanan: Rp 1.500.000 (kategori: "Listrik")
Gaji kasir: Rp 3.000.000 (kategori: "Gaji Karyawan")
Sewa tempat: Rp 5.000.000 (kategori: "Sewa")
```

---

### 3.10 Fitur Khusus Cafe

#### `cafe_tables`

Tabel **meja cafe**. Hanya digunakan jika `store_type = cafe`. Melacak status meja (kosong, terisi, dipesan).

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| `id` | bigint (PK) | auto-increment | ID |
| `store_id` | bigint (FK → stores) | required, cascade delete | ID toko |
| `branch_id` | bigint (FK → branches) | required, cascade delete | ID cabang |
| `table_number` | varchar(20) | unique per branch | Nomor/label meja (misal: "A1", "VIP-2") |
| `capacity` | unsigned int | default: `4` | Kapasitas jumlah orang |
| `status` | varchar(20) | default: `available` | Status: `available` / `occupied` / `reserved` |
| `is_active` | boolean | default: `true` | Apakah meja aktif |
| `created_at` | timestamp | auto | Waktu pembuatan |
| `updated_at` | timestamp | auto | Waktu update terakhir |

**Unique Constraint:** `(branch_id, table_number)`

**Alur Meja:**
```
available → occupied (saat ada pelanggan duduk)
         → reserved (saat dipesan untuk jam tertentu)
occupied → available (saat pelanggan selesai & bayar)
reserved → occupied (saat waktu reservasi tiba)
```

**Integrasi dengan Sales:** Kolom `sales.table_id` mereferensi `cafe_tables.id` untuk melacak transaksi per meja.

---

### 3.11 Integrasi Payment Gateway

#### `payment_gateway_transactions`

Tabel **transaksi payment gateway online**. Mencatat semua interaksi dengan payment gateway (Midtrans, Xendit, Duitku) untuk reconcilasi.

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| `id` | bigint (PK) | auto-increment | ID |
| `sale_id` | bigint (FK → sales) | required, cascade delete | ID penjualan |
| `provider` | varchar(50) | required | Nama provider: `midtrans` / `xendit` / `duitku` |
| `external_id` | varchar(255) | required | ID transaksi dari provider (untuk webhook/callback) |
| `payment_type` | varchar(50) | nullable | Tipe pembayaran dari provider (misal: `credit_card`, `gopay`, `bca_va`) |
| `status` | varchar(30) | default: `pending` | Status: `pending` / `paid` / `failed` / `expired` / `cancelled` |
| `amount` | decimal(15,2) | default: `0` | Jumlah transaksi |
| `raw_response` | json | nullable | Response mentah dari provider (untuk debugging) |
| `created_at` | timestamp | auto | Waktu pembuatan |
| `updated_at` | timestamp | auto | Waktu update terakhir |

**Flow Payment Gateway:**
```
1. Sale dibuat → payment_gateway_transactions status: pending
2. Pelanggan bayar via QR/VA/link
3. Provider kirim webhook → status berubah: paid / failed
4. Jika paid → sale.payment_status: paid
5. raw_response disimpan untuk audit/debugging
```

---

### 3.12 Sistem & Audit Log

#### `activity_logs`

Tabel **log aktivitas**. Mencatat semua aksi penting yang dilakukan user untuk audit trail.

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| `id` | bigint (PK) | auto-increment | ID |
| `user_id` | bigint (FK → users) | nullable, null on delete | ID user yang melakukan aksi |
| `log_name` | varchar(100) | nullable | Nama log (misal: `auth`, `sale`, `stock`) |
| `description` | text | required | Deskripsi aksi (misal: "User login", "Produk ditambahkan") |
| `subject_type` | varchar | nullable | Tipe relasi polimorfik (model apa yang diubah) |
| `subject_id` | bigint | nullable | ID model yang diubah |
| `properties` | json | nullable | Data tambahan (misal: nilai lama & baru untuk perubahan) |
| `ip_address` | varchar(45) | nullable | IP address user (mendukung IPv6) |
| `user_agent` | text | nullable | Browser/device info |
| `created_at` | timestamp | auto | Waktu aksi |
| `updated_at` | timestamp | auto | Waktu update |

**Contoh Log:**
```json
{
  "log_name": "auth",
  "description": "User logged in",
  "subject_type": "App\\Models\\User",
  "subject_id": 1,
  "properties": {
    "email": "owner@simkasir.id"
  }
}
```

```json
{
  "log_name": "sale",
  "description": "Sale completed",
  "subject_type": "App\\Models\\Sale",
  "subject_id": 15,
  "properties": {
    "sale_no": "SL-20260601-001",
    "grand_total": 50000,
    "payment_method": "cash"
  }
}
```

---

### 3.13 Retur Penjualan

#### `sale_returns`

Tabel **header retur penjualan**. Ketika pelanggan mengembalikan barang, dibuat record di sini. Mendukung refund sebagian atau seluruhnya.

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| `id` | bigint (PK) | auto-increment | ID unik retur |
| `sale_id` | bigint (FK → sales) | required, cascade delete | ID penjualan asal |
| `customer_id` | bigint (FK → customers) | nullable, null on delete | ID pelanggan |
| `user_id` | bigint (FK → users) | nullable, null on delete | ID user/kasir yang memproses retur |
| `return_no` | varchar(100) | unique | Nomor retur (misal: `SRET-20260601-001`) |
| `return_date` | datetime | required | Tanggal retur |
| `subtotal` | decimal(15,2) | default: `0` | Total nilai barang yang diretur |
| `total_amount` | decimal(15,2) | default: `0` | Total pengembalian dana (refund) |
| `notes` | text | nullable | Alasan retur |
| `status` | varchar(20) | default: `draft` | Status: `draft` / `completed` / `cancelled` |
| `created_at` | timestamp | auto | Waktu pembuatan |
| `updated_at` | timestamp | auto | Waktu update terakhir |

**Alur Retur Penjualan:**
```
1. Pelanggan datang dengan barang yang ingin diretur
2. Kasir cari transaksi asal (sales) berdasarkan struk/no. transaksi
3. Pilih item yang akan diretur
4. Buat sale_return → status: draft
5. Buat sale_return_items untuk setiap item
6. Sistem menambah kembali product_stocks.quantity (jika barang kembali ke stok)
7. Sistem membuat stock_movements (type: return_in)
8. Proses refund ke pelanggan (tunai / kembali ke metode bayar asal)
9. Status → completed
10. sales.payment_status → refunded (jika seluruh transaksi diretur)
```

**Pengaruh ke Stok:**
```
Jika produk dikembalikan ke stok:
  → product_stocks.quantity += sale_return_items.quantity
  → stock_movements: movement_type = return_in

Jika produk rusak/tidak bisa dijual:
  → product_stocks.quantity tidak berubah
  → Catatan di notes: "Barang rusak, tidak kembali ke stok"
```

---

#### `sale_return_items`

Tabel **detail item retur penjualan**. Item mana saja yang dikembalikan oleh pelanggan.

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| `id` | bigint (PK) | auto-increment | ID unik item retur |
| `sale_return_id` | bigint (FK → sale_returns) | required, cascade delete | ID retur induk |
| `sale_item_id` | bigint (FK → sale_items) | required, cascade delete | ID item penjualan asal |
| `product_id` | bigint (FK → products) | required, cascade delete | ID produk yang diretur |
| `quantity` | decimal(10,2) | default: `1` | Jumlah yang diretur |
| `unit_price` | decimal(15,2) | default: `0` | Harga satuan saat dibeli (dari sale_items) |
| `subtotal` | decimal(15,2) | default: `0` | Subtotal: `unit_price × quantity` |
| `reason` | text | nullable | Alasan retur per item (misal: "Barang rusak", "Tidak sesuai pesanan") |
| `created_at` | timestamp | auto | Waktu pembuatan |
| `updated_at` | timestamp | auto | Waktu update terakhir |

**Contoh Kasus:**
```
Penjualan #10: 3 item
  → Aqua 600ml × 2 = Rp 6.000
  → Indomie × 3 = Rp 9.000
  → Teh Pucuk × 1 = Rp 3.500

Pelanggan retur Aqua 600ml (1 botol, bocor):
  → sale_return: sale_id=10, total_amount=Rp 3.000
  → sale_return_items: sale_item_id=1, product_id=aqua, qty=1, unit_price=Rp 3.000
  → Stok Aqua bertambah 1
  → Refund Rp 3.000 ke pelanggan
```

---

## 4. Diagram Relasi Antar Tabel (ERD)

```
stores ─────────────────────────────────────────────────────────────────────┐
  │                                                                         │
  ├── branches ───────────────────────────────────────────────────────────┐  │
  │     │                                                                 │  │
  │     ├── employees                                                     │  │
  │     │                                                                │  │
  │     ├── cafe_tables ──── sales (table_id)                            │  │
  │     │                                                                │  │
  │     ├── product_stocks ──┐                                            │  │
  │     │                    │                                            │  │
  │     ├── product_batches ─┤                                            │  │
  │     │                    │                                            │  │
  │     ├── stock_adjustments ── stock_adjustment_items                   │  │
  │     │                                                                 │  │
  │     ├── stock_opnames ── stock_opname_items                           │  │
  │     │                                                                 │  │
  │     └── stock_transfers ── stock_transfer_items                       │  │
  │                                                                       │  │
  ├── users ────────────────────────────────────────────────────────────┐ │  │
  │     │                                                               │ │  │
  │     ├── employees                                                   │ │  │
  │     │                                                               │ │  │
  │     ├── sales (user_id)                                             │ │  │
  │     ├── purchases (user_id)                                         │ │  │
  │     ├── expenses (user_id)                                          │ │  │
  │     ├── stock_adjustments (user_id)                                 │ │  │
  │     ├── stock_opnames (user_id)                                     │ │  │
  │     └── activity_logs                                               │ │  │
  │                                                                     │ │  │
  ├── expenses ── expense_categories                                     │ │  │
  │                                                                     │ │  │
  ├── stock_adjustments                                                 │ │  │
  ├── stock_opnames                                                     │ │  │
  └── stock_transfers                                                   │ │  │
                                                                       │ │  │
categories (self-ref: parent_id) ────────────────────────┐             │ │  │
  │                                                       │             │ │  │
  └── products ────────────────────────────────────────┐  │             │ │  │
        │                                              │  │             │ │  │
        ├── product_variants                           │  │             │ │  │
        ├── product_batches                            │  │             │ │  │
        ├── product_stocks                             │  │             │ │  │
        ├── stock_movements                            │  │             │ │  │
        │   (reference: Purchase/Sale/Transfer/Adj)    │  │             │ │  │
        ├── product_modifier_products ───┐             │  │             │ │  │
        │                               │             │  │             │ │  │
        │   product_modifier_groups ─────┘             │  │             │ │  │
        │     └── product_modifiers                    │  │             │ │  │
        │                                              │  │             │ │  │
        ├── sale_items ──── sales ──┐                  │  │             │ │  │
        │                          ├── sale_payments   │  │             │ │  │
        │                          ├── sale_returns ──┐│  │             │ │  │
        │                          │                 ││  │             │ │  │
        │                          │  sale_return_items ┘│             │ │  │
        │                          │                  │  │             │ │  │
        │                          ├── customers      │  │             │ │  │
        │                          │                  │  │             │ │  │
        │                          ├── payment_gateway_transactions     │ │  │
        │                          │                  │  │             │ │  │
        │                          └── promotions ── promotion_products ┘  │
        │                                                                 │
        ├── purchase_items ── purchases ──┐                               │
        │                                ├── purchase_payments            │
        │                                ├── purchase_returns ──┐         │
        │                                │                     │         │
        │                                │   purchase_return_items ──┘    │
        │                                │                               │
        │                                └── suppliers                    │
        │                                                                │
        └── stock_adjustment_items ── stock_adjustments                  │
                                                                         │
payment_methods ──── sale_payments                                       │
                  └── purchase_payments                                  │
                                                                       │ │
suppliers ──── products                                                 │ │
            └── purchases                                               │ │
            └── purchase_returns                                        │ │
                                                                       │ │
customers ──── sales                                                   │ │
                                                                       │ │
expense_categories ──── expenses                                       │ │
                                                                       │ │
product_modifier_groups ──── product_modifiers                         │ │
                          └── product_modifier_products                │ │
                                                                       │ │
```

---

## 5. Alur Data Utama

### 5.1 Alur Penjualan (POS)

```
1. Kasir buka halaman Kasir (POS)
2. Pilih produk dari grid → masuk ke cart
3. (Jika cafe) Pilih meja & modifier
4. Pilih pelanggan (opsional, untuk loyalty points)
5. Klik "Bayar"
6. Sistem membuat record di `sales` (status: draft)
7. Sistem membuat record di `sale_items` untuk setiap item
8. Sistem membuat record di `sale_payments` untuk pembayaran
9. Sistem mengurangi `product_stocks.quantity` untuk setiap item
10. Sistem membuat record di `stock_movements` (type: sale_out)
11. Sistem mengurangi `product_batches.quantity` (FIFO)
12. Status `sales` → completed, `payment_status` → paid
13. Jika ada customer → tambah `customers.points` & update `total_spent`
14. Cetak struk (data dari `stores.receipt_footer`)
```

### 5.2 Alur Pembelian

```
1. Manager buka halaman Pembelian → Create
2. Pilih supplier
3. Tambah item produk (qty + harga beli)
4. Simpan → record di `purchases` (status: draft)
5. Record di `purchase_items` untuk setiap item
6. Konfirmasi → status: confirmed
7. Barang diterima → status: received
8. Sistem membuat record di `product_batches` untuk setiap item
9. Sistem menambah `product_stocks.quantity`
10. Sistem membuat record di `stock_movements` (type: purchase_in)
11. Bayar ke supplier → record di `purchase_payments`
12. `purchases.payment_status` berubah: unpaid → partial → paid
```

### 5.3 Alur Retur Penjualan

```
1. Pelanggan datang mengembalikan barang
2. Kasir cari transaksi asal (berdasarkan struk/no. transaksi)
3. Pilih item yang akan diretur
4. Sistem membuat record di `sale_returns` (status: draft)
5. Sistem membuat record di `sale_return_items` untuk setiap item
6. Jika barang kembali ke stok:
   → Tambah `product_stocks.quantity`
   → Buat record di `stock_movements` (type: return_in)
7. Proses refund ke pelanggan (tunai / kembali ke metode bayar asal)
8. Status `sale_returns` → completed
9. Jika seluruh transaksi diretur → `sales.payment_status` → refunded
```

### 5.4 Alur Retur Pembelian

```
1. Manager buka halaman Pembelian → Retur
2. Pilih pembelian asal
3. Pilih item yang akan diretur ke supplier
4. Sistem membuat record di `purchase_returns` (status: draft)
5. Sistem membuat record di `purchase_return_items` untuk setiap item
6. Sistem mengurangi `product_stocks.quantity`
7. Sistem membuat record di `stock_movements` (type: return_out — belum ada, perlu penambahan)
8. Review dan approve
9. Status → completed
10. Konsolidasi dengan `purchases` (kurangi total atau catat kredit)
```

### 5.5 Alur Stok Opname

```
1. Manager buka halaman Stok → Opname
2. Buat dokumen opname → record di `stock_opnames`
3. Isi jumlah fisik per produk → record di `stock_opname_items`
4. Sistem hitung selisih (system_qty vs counted_qty)
5. Review dan approve
6. Sistem update `product_stocks.quantity` sesuai counted_qty
7. Sistem buat record di `stock_movements` (type: opname_adjustment)
8. Status → completed
```

---

## 6. Panduan Multi-Toko & Multi-Cabang

### Struktur Hierarki

```
Platform SIM-KASIR
├── Toko 1 (Store A - Minimarket)
│   ├── Cabang Utama
│   ├── Cabang Mall
│   └── Cabang Pasar
├── Toko 2 (Store B - Cafe)
│   ├── Cafe Utama (Pusat)
│   └── Cafe Branch 2
└── Toko 3 (Store C - Booth Kopi)
    └── Booth 1 (single branch)
```

### Aturan Isolasi Data

1. **Produk**: Produk dibuat per toko. Satu toko punya produk yang berbeda dengan toko lain.
2. **Stok**: Stok dipisah per toko + cabang (`product_stocks.unique: product_id + store_id + branch_id`)
3. **Transaksi**: Sales dan Purchases terikat ke toko + cabang
4. **User**: User terikat ke 1 toko via `users.store_id`
5. **Pelanggan**: Pelanggan bisa diakses dari semua toko (global) atau per toko (tergantung implementasi)

### Query Filter Berdasarkan Toko

```php
// Selalu filter berdasarkan toko yang sedang aktif
$sales = Sale::where('store_id', auth()->user()->store_id)->get();
$products = Product::where('store_id', auth()->user()->store_id)->get();
```

---

## 7. Catatan untuk Pengembang

### Kolom yang Sering Salah Akses

| Salah | Benar | Tabel |
|---|---|---|
| `product.price` | `product.sell_price` | `products` |
| `product.price` | `product.cost_price` | `products` |
| `store.business_mode` | `store.store_type` | `stores` |
| `supplier.contact_person` | *(tidak ada kolom ini)* | `suppliers` |

### Route Naming Convention

Semua route admin menggunakan prefix `admin.`:
```php
route('admin.dashboard')    // /admin/dashboard
route('admin.products.index')  // /admin/products
route('admin.kasir')        // /admin/kasir
```

### Status Field Patterns

Banyak tabel menggunakan field `status` dengan value string:

| Tabel | Status Values |
|---|---|
| `sales` | `draft`, `completed`, `cancelled`, `refunded` |
| `sales.payment_status` | `unpaid`, `partial`, `paid`, `refunded` |
| `purchases` | `draft`, `confirmed`, `received`, `cancelled` |
| `purchases.payment_status` | `unpaid`, `partial`, `paid` |
| `stock_adjustments` | `draft`, `approved`, `rejected` |
| `stock_opnames` | `draft`, `in_progress`, `completed`, `cancelled` |
| `stock_transfers` | `pending`, `in_transit`, `received`, `cancelled` |
| `employees` | `active`, `inactive`, `terminated` |
| `cafe_tables` | `available`, `occupied`, `reserved` |
| `payment_gateway_transactions` | `pending`, `paid`, `failed`, `expired`, `cancelled` |
| `expenses` | `draft`, `posted`, `cancelled` |
| `purchase_returns` | `draft`, `approved`, `completed`, `cancelled` |
| `sale_returns` | `draft`, `completed`, `cancelled` |

### Decimal Fields Semua Pakai `decimal(15,2)`

Semua kolom harga/nilai uang menggunakan format `decimal(15,2)`:
- Maksimum: Rp 9.999.999.999.999,99 (hampir 10 triliun)
- Presisi: 2 desimal

### Polimorfik Relations

Dua tabel menggunakan **nullableMorphs**:
- `stock_movements.reference` → bisa merujuk ke Purchase, Sale, Transfer, dll
- `activity_logs.subject` → bisa merujuk ke model apa saja

Format kolom di database:
```
reference_type → varchar (nama model, misal: "App\Models\Purchase")
reference_id   → bigint (ID model)
```

### Seed Data Default

| Tabel | Jumlah | Keterangan |
|---|---|---|
| `stores` | 1 | STORE001, minimarket |
| `branches` | 1 | BR001, Cabang Utama |
| `users` | 3 | owner, manager, kasir |
| `categories` | 5 | Minuman, Makanan Ringan, Sembako, Rokok, Kebersihan |
| `suppliers` | 1 | Supplier Utama |
| `payment_methods` | 4 | Tunai, QRIS, Kartu, Transfer |
| `products` | 15 | 4 Minuman, 4 Makanan, 3 Sembako, 3 Rokok, 1 Kebersihan |
| `product_stocks` | 15 | 1 per produk (quantity: random 10-100) |

**Password semua user:** `password`

---

> **Dokumentasi ini terakhir diperbarui: 20 Juni 2026**
> **Database version: 46 migrations (5 Breeze + 41 custom)**
