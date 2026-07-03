# SIM-KASIR 🛒

**Sistem Informasi Manajemen Kasir** — aplikasi Point of Sale (POS) dan manajemen bisnis berbasis web, dibangun dengan Laravel + Inertia + React.

---

## 🚀 Fitur Utama

### 🛍️ Transaksi
| Modul | Deskripsi |
|-------|-----------|
| **POS / Kasir** | Layar kasir responsif (desktop + mobile) dengan barcode scanner, kategori, pencarian pelanggan, meja cafe, promo otomatis, payment gateway (QRIS, GoPay, dll) |
| **Penjualan** | CRUD penjualan, print struk, switch payment, retur penjualan |
| **Pembelian** | CRUD pembelian, update status |
| **Retur Pembelian** | Retur barang ke supplier dengan stok reversal |
| **Retur Penjualan** | Retur barang dari pelanggan dengan refund |
| **Shift Kasir** | Buka/tutup shift, catat kas awal & aktual, selisih kas per metode bayar |

### 📦 Inventaris
| Modul | Deskripsi |
|-------|-----------|
| **Stok** | Monitoring stok real-time per toko & cabang |
| **Batch / Expired** | Manajemen batch produk dengan tracking expired date (FIFO) |
| **Penyesuaian Stok** | Stock adjustment |
| **Opname Stok** | Stock opname / stock take |
| **Transfer Stok** | Transfer stok antar cabang |
| **Waste** | Catat produk rusak/kadaluarsa |

### 👥 Master Data
- Produk (dengan variant, modifier group, recipes/bahan baku)
- Kategori, Pelanggan (dengan tier & loyalty points), Supplier
- Karyawan, Meja Cafe, Metode Pembayaran, Promo (multi-tipe)

### 📊 Laporan & Analitik
- Dashboard interaktif (trend penjualan, payment distribution, top products)
- Laporan komprehensif: penjualan, pembelian, pengeluaran, COGS, profit, cash flow
- **AI Chat** — tanya laporan pakai bahasa Indonesia via DeepSeek AI
- Export grafik & data

### 🔐 Sistem
- Multi-store & multi-branch
- Role-based access: Admin, Kasir, Developer
- Activity log semua operasi
- Offline-ready: IndexedDB queue untuk transaksi offline

---

## 🛠️ Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Backend | Laravel 12, PHP 8.2+ |
| Frontend | React 19, Inertia.js 2 |
| Styling | Tailwind CSS 4 |
| Database | MySQL / MariaDB |
| AI | DeepSeek API (via openai-php client) |
| Payment | Midtrans / custom PG integration |
| Offline | IndexedDB, Service Worker |

---

## ⚡ Quick Start

### Prasyarat
- PHP 8.2+
- Composer
- Node.js 18+
- MySQL 5.7+ / MariaDB 10.3+
- Laragon / XAMPP (disarankan)

### Install

```bash
# 1. Clone repo
git clone <repo-url> sim-kasir
cd sim-kasir

# 2. Install dependencies
composer install
npm install

# 3. Setup environment
cp .env.example .env
php artisan key:generate

# 4. Konfigurasi database di .env
# DB_DATABASE=simkasir
# DB_USERNAME=root
# DB_PASSWORD=

# 5. Migrate & seed
php artisan migrate:fresh --seed

# 6. Build frontend
npm run build   # production
# atau
npm run dev     # development

# 7. Jalankan server
php artisan serve
```

### Default Users (dari seeder)

| Role | Email | Password |
|------|-------|----------|
| Developer | developer@simkasir.test | password |
| Admin | admin@simkasir.test | password |
| Kasir | kasir@simkasir.test | password |

---

## 📁 Struktur Proyek

```
SIM-KASIR/
├── app/
│   ├── Http/Controllers/Admin/    # Controller admin
│   ├── Http/Middleware/           # Middleware (Store, Branch, Role, Shift)
│   ├── Models/                    # Eloquent models
│   └── Services/                  # Promo service, dll
├── database/
│   ├── migrations/                # Database migrations (~50 tabel)
│   └── seeders/                   # Data seeder
├── resources/js/
│   ├── Pages/Admin/               # Halaman React/Inertia
│   ├── Layouts/                   # Layout (Authenticated, Developer)
│   ├── Components/                # Shared components
│   ├── Hooks/                     # Custom hooks
│   └── Services/                  # mutationQueue, sync, db
├── routes/
│   └── web.php                    # All web routes
└── config/                        # Konfigurasi Laravel
```

---

## 🔑 Role & Permission

| Fitur | Developer | Admin | Kasir |
|-------|-----------|-------|-------|
| Dashboard | ✅ (dev) | ✅ | ✅ |
| POS / Kasir | - | - | ✅ |
| Kelola Produk | ✅ | ✅ | ❌ |
| Kelola Stok | ✅ | ✅ | ❌ |
| Lihat Penjualan | ✅ | ✅ | ✅ |
| Buat/Edit Penjualan | - | ✅ | ❌ |
| Shift Kasir | - | ✅ | ✅ |
| Laporan | ✅ | ✅ | ❌ |
| Pengaturan | ✅ | ✅ | ❌ |
| Kelola User | ✅ | ❌ | ❌ |
| Kelola Toko | ✅ | ❌ | ❌ |
| Log Aktivitas | ✅ | ✅ | ❌ |

---

## 📄 License

Proprietary — internal use only.
