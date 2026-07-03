# Panduan Developer — SIM-KASIR

## Arsitektur

### Tipe Toko (Store Types)
Tipe toko dikelola di database tabel `store_types`. Untuk menambah tipe baru:

1. **INSERT ke database** atau gunakan seeder:
```sql
INSERT INTO store_types (code, label, icon, order_types, pos_behavior, sort_order)
VALUES ('bisnis', 'Bisnis', '💼',
  '[{"v":"kontrak","l":"Kontrak"},{"v":"project","l":"Project"}]',
  'service', 7);
```

2. **Assign fitur**: Buka `/developer/type-features` → pilih tipe baru → centang fitur.

3. **Selesai!** Sidebar, POS, dan semua form otomatis kebaca.

### Fitur (Features)
Fitur adalah modul yang bisa diaktifkan/dinonaktifkan per tipe toko.

**Menambah fitur baru:**
1. INSERT ke tabel `features`:
```sql
INSERT INTO features (code, label, category, applicable_types, sort_order)
VALUES ('loyalty', 'Loyalty Points', 'crm', '["retail","fnb"]', 21);
```

2. Buka `/developer/type-features` → centang fitur untuk tipe yang sesuai.

3. Buka `/developer/plans/{id}/edit` → centang fitur untuk paket yang sesuai.

### Paket (Plans)
Paket menentukan fitur mana yang DIIZINKAN berdasarkan level langganan.

**3 Layer AND Gate:**
```
Fitur muncul di sidebar = Type PUNYA fitur & Plan IZINKAN fitur & User PUNYA permission
```

### Struktur Folder
```
app/Http/Controllers/
├── Developer/     ← Panel Developer (kelola toko, user, paket, tipe)
└── Admin/         ← Panel Owner/Client (POS, laporan, pengaturan)

resources/js/Pages/
├── Developer/     ← Halaman Developer
│   ├── Dashboard.jsx
│   ├── Stores/    ← CRUD toko
│   ├── Branches/  ← CRUD cabang
│   ├── Users/     ← CRUD user
│   ├── Plans/     ← CRUD paket + fitur
│   └── TypeFeatures/ ← Atur fitur per tipe
└── Admin/         ← Halaman Owner/Client
    ├── Dashboard.jsx
    ├── Kasir/     ← POS 6 mode
    ├── Reports/
    ├── Settings/
    ├── Bookings/
    └── Memberships/
```

### Cara Tambah Tipe Toko Baru (Full Guide)

1. **Database**: Insert ke `store_types` (code, label, icon, order_types)
2. **Fitur**: Buka `/developer/type-features`, centang fitur untuk tipe baru
3. **Paket**: Buka `/developer/plans/{id}/edit`, pastikan paket mengizinkan fitur
4. **Buat Toko**: Buka `/developer/stores/create`, pilih tipe baru
5. **Test**: Login sebagai owner toko baru, cek sidebar dan POS

### Cara Tambah Fitur Baru (Full Guide)

1. **Database**: Insert ke `features` (code, label, category, applicable_types)
2. **Tipe**: Buka `/developer/type-features`, centang fitur untuk tipe yang sesuai
3. **Paket**: Buka `/developer/plans/{id}/edit`, centang fitur di paket
4. **Permission**: Pastikan role user punya permission terkait (opsional)
5. **Test**: Login owner, cek sidebar — fitur baru muncul

### Cara Tambah Menu Sidebar Kustom

1. **Buat fitur baru** (ikuti langkah di atas)
2. **Tambah ke `navConfig.js`**:
```javascript
hasFeature('nama_fitur') && {
    key: 'menu-key',
    name: 'Nama Menu',
    href: r('admin.nama-route'),
    icon: 'nama-icon',
    current: 'admin.nama-route',
},
```
3. **Assign fitur ke tipe** via Type Features
4. **Assign fitur ke paket** via Plan edit
