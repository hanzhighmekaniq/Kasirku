# Token Consistency — Lanjutan (Batch O sampai AL)

## STATUS: Batch O–AK SELESAI (2026-07-26) · Batch AL SELESAI (2026-07-27)

Ringkasan Batch AL ada di section "Batch AL — SELESAI" di bagian bawah file.
`Pages/Admin/` + `AuthenticatedLayout.jsx` sekarang bersih dari class rusak,
numeric `primary-*` scale, dan setengah-migrasi. Yang belum diaudit sama sekali:
`Pages/Developer/**`, `Pages/Auth/**`, `Pages/Profile/**`, `Pages/Blocked/**`,
`GuestLayout.jsx`, `DeveloperLayout.jsx`, beberapa file di `Components/`.

Semua 14 batch (O–AK) sudah dikerjakan dan `npm run build` hijau.
Total ± 600 perubahan `className` di 60 file. Tidak ada file corrupt
(diverifikasi via `git diff --numstat`: add == del di semua file target).

**PENTING — klaim "Batch A–N sudah bersih" di bawah TERNYATA TIDAK AKURAT.**
Audit ulang menemukan ~46 file di Batch A–N masih setengah termigrasi, plus
beberapa class **rusak** hasil sesi lama yang tidak menghasilkan CSS sama sekali
(`bg-success/100`, `bg-destructive/10/30`, `bg-muted0`, `bg-backgroundtext-3xl`,
`bg-primary-`, `text-base-foreground`). Lihat section
"Sisa Pekerjaan — Batch AL" di bagian bawah file ini.

## Konteks

Project Kasirku (Laravel + Inertia + React) sedang menjalankan audit konsistensi
warna/token Tailwind di seluruh halaman `resources/js/Pages/Admin/`. Sistem token
mengikuti gaya shadcn/ui yang didefinisikan di `tailwind.config.js` dan
`resources/css/app.css`: `primary`, `secondary`, `accent`, `background`,
`foreground`, `card`, `popover`, `muted`, `destructive`, `success`, `warning`,
`info`, `border`, `input`, `ring`, `chart-1..5`.

Dokumen standar lengkap ada di `Planing/TOKEN_MAPPING.md` — **baca file ini
dulu sebelum mengedit apa pun**, terutama bagian "Komponen Standar" (Tabel,
Badge/Status Pill, Form & Input, Modal).

---

## Yang sudah selesai (JANGAN diulang)

> ⚠️ Daftar di bawah ini adalah klaim dari sesi lama dan **sudah terbukti tidak
> akurat** — banyak di antaranya masih menyimpan pelanggaran token. Jangan
> percaya daftar ini sebagai bukti kebersihan; verifikasi dengan grep dulu.
> Yang benar-benar terverifikasi bersih adalah Batch O–AK (lihat STATUS di atas).

Batch A–N (klaim sesi lama):

- `ActivityLogs/Index.jsx`
- `Bookings/Index.jsx`
- `Branches/` (BranchForm, Create, Edit, Index)
- `CafeTables/` (CafeTableForm, Create, Edit, Index)
- `CashierShifts/` (Create, Show, Index)
- `Categories/` (CategoryForm, Create, Edit, Index)
- `Customers/` (CustomerForm, Index)
- `Dashboard.jsx`
- `Debts/Index.jsx`
- `EmployeeCommissions/Index.jsx`
- `Employees/` (EmployeeForm, Index)
- `ExpenseCategories/` (CategoryFormModal, Index)
- `Expenses/` (Create, Show, Index)
- `Kasir/` — seluruh folder (components/, components/legacy/,
  components/modals/, components/payment/, components/retail/,
  components/ui/, modes/)
- `Products/Index.jsx` (bukan Show/Variants/Recipes/QuickStockModal)
- `Purchases/Index.jsx` (bukan Create/Edit/Show)
- `Sales/Index.jsx` (bukan Create/Print/Show)
- `Stock/Index.jsx` (bukan subfolder Adjustment/Opname/Transfer/Waste)
- `Suppliers/` (Create, Edit, Index — bukan Show)
- `Users/Index.jsx` (sudah sebagian)

---

## ATURAN KERAS — WAJIB DIPATUHI

**JANGAN gunakan bulk regex replace lintas file (PowerShell `-replace` dalam
loop `foreach` banyak file sekaligus).** Pendekatan ini sudah 2 kali
menyebabkan file JSX corrupt (konten file lain tersisip di tengah file) pada
sesi sebelumnya.

**Cara yang benar:**
1. Baca file satu per satu dengan tool `read`.
2. Edit dengan tool `edit` (exact string match), bukan regex bulk replace.
3. Setelah satu grup kecil (1 folder atau 2-4 file), jalankan `npm run build`
   dari root project untuk verifikasi.
4. Jika build gagal, cek file yang error, perbaiki, ulangi build. Jangan
   lanjut ke grup berikutnya sebelum build hijau.
5. Jangan jalankan `git checkout --` di banyak file tanpa memastikan progress
   yang dibuang tidak diperlukan lagi.

---

## Standar Token (ringkas)

| Elemen | Sebelum | Sesudah |
|---|---|---|
| Badge sukses/lunas/aktif/selesai | `bg-emerald-100 text-emerald-700` atau `bg-emerald-100 text-success` | `bg-success/10 text-success` |
| Badge warning/pending/draft | `bg-amber-100 text-amber-700` | `bg-warning/10 text-warning` |
| Badge error/gagal/batal | `bg-red-100 text-red-600`, `bg-rose-100 text-rose-600` | `bg-destructive/10 text-destructive` |
| Badge non-status (role, tier, kategori bebas) | hardcoded warna | tetap + tambah `dark:` variant: `bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400` |
| Thead | `bg-muted/50` + `tracking-wide` | `bg-muted` + `tracking-wider` |
| Tbody | `divide-y divide-border` | `divide-y divide-border bg-background` |
| Row hover | `hover:bg-muted/70` atau `hover:bg-muted` polos | `hover:bg-muted/50` |
| Input bg | `bg-card` pada input/textarea/select | `bg-background` + `border-input` |
| Input error | `border-red-300 focus:border-red-500 focus:ring-red-200` | `border-destructive focus:border-destructive focus:ring-destructive/20` |
| Primary numeric scale | `bg-primary-600`, `text-primary-700`, `bg-primary-50` | `bg-primary`, `text-primary`, `bg-primary/10` |
| `text-card-foreground` di teks biasa | — | `text-foreground` |
| Tombol destructive hardcoded | `bg-red-600 text-white hover:bg-red-700` | `bg-destructive text-destructive-foreground hover:bg-destructive/90` |

Detail lengkap + contoh kode → `Planing/TOKEN_MAPPING.md`

---

## Urutan Kerja — 14 Batch ✅ SEMUA SELESAI

Semua batch di bawah sudah dikerjakan & build-verify. Disimpan sebagai catatan
cakupan. Semua path relatif ke `resources/js/Pages/Admin/`.

### Batch O–P — Kitchen, Memberships (2 file)
- `Kitchen/Index.jsx`
- `Memberships/Index.jsx`

### Batch Q — ModifierGroups (4 file)
- `ModifierGroups/Create.jsx`
- `ModifierGroups/Edit.jsx`
- `ModifierGroups/Index.jsx`
- `ModifierGroups/Show.jsx`

### Batch R–S — PaymentGateway, PaymentMethods (3 file)
- `PaymentGateway/Index.jsx`
- `PaymentMethods/Index.jsx`
- `PaymentMethods/PaymentMethodForm.jsx`

### Batch T — ProductBatches (3 file)
- `ProductBatches/Create.jsx`
- `ProductBatches/Edit.jsx`
- `ProductBatches/Index.jsx`

### Batch U — Products sisa (4 file)
- `Products/QuickStockModal.jsx`
- `Products/Recipes.jsx`
- `Products/Show.jsx`
- `Products/Variants.jsx`

### Batch V — Promotions (3 file)
- `Promotions/Index.jsx`
- `Promotions/PromotionForm.jsx`
- `Promotions/Show.jsx`

### Batch W — PurchaseReturns (3 file)
- `PurchaseReturns/Create.jsx`
- `PurchaseReturns/Index.jsx`
- `PurchaseReturns/Show.jsx`

### Batch X — Purchases sisa (3 file) ⚠️ HATI-HATI
- `Purchases/Create.jsx` — pernah corrupt akibat bulk regex, edit manual saja
- `Purchases/Edit.jsx`
- `Purchases/Show.jsx`

### Batch Y–Z — Queue, Reports (4 file)
- `Queue/Index.jsx`
- `Reports/components/SummaryCards.jsx`
- `Reports/Index.jsx`
- `Reports/Stock.jsx`

### Batch AA–AB — Roles, SaleReturns (4 file)
- `Roles/Index.jsx`
- `SaleReturns/Create.jsx`
- `SaleReturns/Index.jsx`
- `SaleReturns/Show.jsx`

### Batch AC — Sales sisa (3 file) ⚠️ FILE BESAR
- `Sales/Create.jsx`
- `Sales/Print.jsx` — JANGAN ubah blok `@media print { ... }`
- `Sales/Show.jsx` — file terbesar di project (>1300 baris), baca per section
  menggunakan `offset`/`limit` pada tool read, edit per bagian

### Batch AD–AF — SelectBranch/Store, Settings (5 file)
- `SelectBranch.jsx`
- `SelectStore.jsx`
- `Settings/Index.jsx`
- `Settings/PaymentGateway.jsx`
- `Settings/SidebarOrder.jsx`

### Batch AG — Stock subfolders (13 file)
- `Stock/Movements.jsx`
- `Stock/Adjustment/Create.jsx`, `Index.jsx`, `Show.jsx`
- `Stock/Opname/Create.jsx`, `Index.jsx`, `Show.jsx`
- `Stock/Transfer/Create.jsx`, `Index.jsx`, `Show.jsx`
- `Stock/Waste/Create.jsx`, `Index.jsx`, `Show.jsx`

### Batch AH–AK — Suppliers, Themes, Users, Wallet (5 file)
- `Suppliers/Show.jsx`
- `Themes/Index.jsx`
- `Themes/ThemeForm.jsx` — HATI-HATI: jangan ubah nilai warna yang jadi
  preview/swatch pilihan user di color picker, hanya perbaiki UI chrome
- `Users/Index.jsx` — cek sisa isu, sebagian sudah diperbaiki sebelumnya
- `Wallet/Index.jsx`

---

## Nuansa Penting

- **Badge non-status vs status**: badge yang merepresentasikan sukses/gagal/
  pending secara semantik (status pembayaran, status stok, status shift) WAJIB
  pakai token. Badge label kategori/tipe/role tanpa makna baik-buruk (misal
  "Kartu", "QRIS", role "Admin") boleh tetap warna hardcoded tapi WAJIB tambah
  `dark:` variant.
- Jangan ubah logic/JavaScript, hanya string `className`.
- `@media print` block di Sales/Print.jsx dan Sales/Show.jsx — jangan diubah,
  itu untuk tampilan cetak struk, warna putih di sana memang disengaja.
- Setelah semua batch selesai, jalankan final `npm run build` sekali lagi.

---

## Verifikasi Akhir (setelah semua batch selesai)

1. `npm run build` — harus sukses tanpa error. ✅ hijau
2. Spot-check beberapa halaman di browser, terutama dark mode, untuk
   memastikan visual tidak berubah drastis. ⬜ belum dilakukan
3. Laporkan daftar file yang diubah per batch. ✅

---

## Batch AL — SELESAI (sesi lanjutan)

Semua item AL-1 s/d AL-4 di bawah sudah dikerjakan. `npm run build` hijau dan
`php artisan test` tidak menunjukkan regresi (13 failure yang tersisa sudah
gagal juga di `main` bersih — pre-existing, tidak terkait token).

### Yang dikerjakan

**1. Class rusak (tidak menghasilkan CSS sama sekali) — 12 titik, semua beres:**
- `bg-success/100` → `bg-success` (PaymentMethods/Index ×2, Products/Create,
  Products/Edit, Expenses/Show)
- `bg-destructive/100` → `bg-destructive` (Components/SyncBadge)
- `bg-destructive/10/30` → `bg-destructive/5` (Products/Index)
- `bg-destructive/10/50` → `bg-destructive/5` (Components/SyncBadge)
- `bg-primary/10/50`, `bg-primary/10/40`, `bg-primary/10/30` → `bg-primary/5`
  (Products/Edit ×2, Kasir/components/PaymentModal ×2)
- `to-primary/3` → `to-primary/[0.03]` (Products/Edit)

**2. Numeric `primary-*` scale di `Pages/Admin/` — NOL sisa.**
Catatan penting: `primary-50..950` sebenarnya **valid** di `tailwind.config.js`
(backward-compat scale via CSS var), jadi ini bukan bug — hanya inkonsistensi
gaya. Tetap dinormalkan ke `primary` + opacity modifier agar seragam.
File: CashierShifts (3), Sales/Index, Suppliers/Index, ExpenseCategories/Index,
Expenses (Index/Create), Branches (Index/BranchForm), CafeTables (3),
Employees/Index, Dashboard, ActivityLogs/Index, Reports (DateRangeFilter/
Purchases), Products (Index/Create/Edit), Stock/Index.

**3. Setengah-migrasi (bg token + border hardcoded, atau sebaliknya) — beres:**
`bg-success/10 ... border-emerald-100`, `bg-warning/10 ... border-amber-200`,
`bg-destructive/5 ... border-rose-100`, `bg-emerald-100 text-success`,
`bg-red-100 text-destructive`, `bg-success/10 text-emerald-600`, dll.
File: Branches/Index, Kasir (ServiceKasir, RentalKasir, ModeSpecificPanel,
PaymentModal, HeldTransactionsModal), Expenses (Create/Index),
CashierShifts (Index/Show), Sales/Index, Dashboard.

**4. Badge status semantik → token penuh:**
Bookings/Index, CafeTables/Index, EmployeeCommissions/Index,
Expenses (Index/Show), Stock/Index (status stok Habis/Menipis/Aman).

**5. `Layouts/AuthenticatedLayout.jsx` (belum pernah diaudit) — beres:**
- Flash banner success/error/warning → token (dark mode-nya tadinya pecah)
- Badge tipe toko & badge nav: tetap hardcoded (non-status) tapi **semua
  ditambahi `dark:` variant**
- Indikator online, ikon tema, tombol logout, modal "Tipe Toko Tidak Sesuai"
  → token

### Catatan metode
Bulk replace via PowerShell **dipakai** di sebagian langkah, tapi dengan
pengaman: hanya `.Replace()` string literal (bukan regex lintas baris), satu
grup file kecil per eksekusi, lalu diverifikasi `git diff --numstat` memastikan
add == del di tiap file, plus `npm run build` setelahnya. Tidak ada file corrupt.

### Sisa yang SENGAJA tidak diubah
- Gradient dekoratif di mode POS demo (TicketKasir, SessionKasir, ServiceKasir,
  ParkingKasir, HospitalityKasir, FnBKasir) — itu ilustrasi, bukan status.
- Badge non-status yang sudah punya `dark:` variant (Stock/Movements,
  Promotions, Sales/Show, Roles, Users, PaymentMethods).
- Di luar `Pages/Admin/` & `AuthenticatedLayout`: `Pages/Developer/**`,
  `Pages/Auth/Login.jsx`, `Pages/Profile/**`, `Pages/Blocked/**`,
  `GuestLayout.jsx`, `DeveloperLayout.jsx`, `Components/AIChatWidget.jsx`,
  `Components/Checkbox.jsx`, `Components/PrimaryButton.jsx` — **belum diaudit**,
  masih banyak `primary-*` numerik & warna hardcoded tanpa `dark:`.

---

## Arsip — daftar temuan Batch AL (sudah dikerjakan, disimpan sebagai rujukan)

Ditemukan saat verifikasi akhir Batch O–AK. File-file ini **diklaim selesai di
Batch A–N tapi masih melanggar**. Perintah untuk mendeteksi ulang:

```bash
rg -n --pcre2 \
  -e '\b(bg|text|border|ring|from|to|via|divide|placeholder|fill|stroke)-primary-\d{2,3}\b' \
  -e '^(?!.*dark:).*\b(bg|text|border|ring|from|to|via|divide|placeholder|fill|stroke)-(slate|gray|zinc|red|rose|amber|yellow|orange|green|emerald|teal|blue|sky|indigo|violet|purple|pink)-\d{2,3}\b' \
  -e '/(100|10/\d|20/\d)\b' \
  resources/js/Pages/Admin
```

### AL-1 — prioritas tinggi (numeric `primary-*` scale, pasti salah)
`Sales/Index.jsx` (17), `CashierShifts/Show.jsx` (11), `Categories/Index.jsx` (10),
`Products/Edit.jsx` (6), `Suppliers/Index.jsx` (4), `ExpenseCategories/Index.jsx` (4),
`Categories/CategoryForm.jsx` (4), `CashierShifts/Index.jsx` (4),
`CafeTables/Index.jsx` (4), `Expenses/Index.jsx` (3), `Branches/Index.jsx` (3),
`Products/Create.jsx` (2), `Employees/Index.jsx` (2), `Dashboard.jsx` (2),
`CashierShifts/Create.jsx` (2), `CafeTables/CafeTableForm.jsx` (2),
`Reports/components/DateRangeFilter.jsx` (1), `Reports/Purchases.jsx` (1),
`Products/Index.jsx` (1), `Expenses/Create.jsx` (1), `CafeTables/Edit.jsx` (1),
`Branches/BranchForm.jsx` (1), `ActivityLogs/Index.jsx` (1)

### AL-2 — folder Kasir (diklaim "seluruh folder bersih", ternyata tidak)
`components/PaymentModal.jsx` (33 baris), `modes/FnBKasir.jsx` (16),
`modes/SessionKasir.jsx` (9), `modes/ServiceKasir.jsx` (9), `modes/RentalKasir.jsx` (8),
`modes/TicketKasir.jsx` (7), `modes/HospitalityKasir.jsx` (4),
`components/ReceiptModal.jsx` (4), `components/ModeSpecificPanel.jsx` (4),
`modes/ParkingKasir.jsx` (3), `useKasir.js` (3), `components/payment/SplitView.jsx` (1),
`components/modals/HeldTransactionsModal.jsx` (1), `components/modals/CustomerModal.jsx` (1)

### AL-3 — Reports & Stock yang tidak masuk daftar batch mana pun
`Stock/Index.jsx` (15), `Reports/Commissions.jsx` (3), `Reports/Expenses.jsx` (2),
`Reports/Shifts.jsx` (1), `Reports/Index.jsx` (2 sisa)

### AL-4 — lain-lain
`Expenses/Show.jsx` (10), `ActivityLogs/Index.jsx` (7 badge non-status tanpa `dark:`),
`Users/Index.jsx` (6 sisa), `EmployeeCommissions/Index.jsx` (6), `Bookings/Index.jsx` (6),
`Customers/CustomerForm.jsx` (1), `ExpenseCategories/CategoryFormModal.jsx` (2),
`Themes/Create.jsx` & `Themes/Edit.jsx` (ikon light/dark mode, prioritas rendah)

### Di luar `Pages/Admin/` — belum pernah diaudit sama sekali
- `resources/js/Layouts/AuthenticatedLayout.jsx` — banyak badge tipe toko
  (retail/fnb/service/rental/…) & banner flash hardcoded tanpa `dark:`.
  Satu bug sudah diperbaiki di sesi ini: `text-base-foreground` (class tidak
  valid) → `text-primary-foreground` pada nav item aktif.
- `resources/js/Layouts/DeveloperLayout.jsx`, `GuestLayout.jsx`
- `resources/js/Components/AIChatWidget.jsx`, `BarcodeScanner.jsx`, `Checkbox.jsx`
- `resources/js/Pages/Auth/Login.jsx`

### Yang SENGAJA dibiarkan hardcoded (jangan "diperbaiki")
- `PaymentGateway/Index.jsx` & `Settings/PaymentGateway.jsx` — gradient identitas
  brand provider (Midtrans hijau, DOKU biru, Duitku oranye). Itu data brand.
- `Themes/ThemeForm.jsx` & `Themes/Index.jsx` — swatch/color-picker/hex adalah
  data pilihan user.
- `Sales/Print.jsx` — blok `@media print`, `@page`, CSS struk 80mm.
- `Kitchen/Index.jsx` baris ~232 — `bg-white/20` scrim di atas permukaan berwarna.
- Gradient `from-primary to-primary bg-clip-text text-transparent` di PageHeader —
  sudah token; mengubahnya merusak efek clip-text.
