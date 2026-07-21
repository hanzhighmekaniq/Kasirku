# Theme Audit Guide — Kasirku

Panduan lengkap untuk audit konsistensi tema, tombol gradient, UX, dan mobile
responsiveness di seluruh halaman Admin. Dokumen ini jadi referensi tetap
sampai semua halaman selesai di-audit.

## Status

| Item | Status |
|---|---|
| Theme system (tokens, ThemeProvider, seeder 6 preset) | ✅ Selesai |
| `Components/ui/Button.jsx` (shared, flat, no gradient) | ✅ Selesai |
| `Components/ConfirmDeleteModal.jsx` (shared) | ✅ Selesai |
| 23 halaman diarahkan ke `ConfirmDeleteModal` shared, 15 file lokal dihapus | ✅ Selesai |
| Products/Index.jsx (sorting, branch filter, stock fix) | ✅ Selesai |
| Themes/ (Index, Create, Edit, ThemeForm) | ✅ Selesai |
| Sisa halaman Admin (theme, gradient, UX, mobile) | ❌ Belum |
| Components lain (Modal, Dropdown, Select, dll) | ❌ Belum |
| Layouts (DeveloperLayout, GuestLayout) | ❌ Belum |
| Kasir/ (27 file) | ⏸ Skip — dikerjakan terakhir |

## Prinsip Dasar

1. **Semua warna interaktif/surface HARUS ikut tema** — pakai CSS variable
   token (`bg-primary`, `text-foreground`, dll), bukan hardcoded Tailwind
   palette (`bg-slate-500`, `text-white`, dll).
2. **Tidak ada gradient button** — semua tombol flat color via
   `<Button variant="...">`. Gradient terlihat buruk di light mode.
3. **Badge/status colors TETAP hardcoded** — badge tipe produk (biru, ungu,
   pink, dll), status transaksi, dan indicator lain sengaja tidak ikut tema
   karena warnanya informational, bukan surface/interactive element.
4. **ConfirmDeleteModal selalu dari shared component** — jangan buat copy
   lokal lagi.

---

## Shared Components yang Sudah Ada

### `<Button>` — `resources/js/Components/ui/Button.jsx`

```jsx
import Button from "@/Components/ui/Button";
import { Plus } from "lucide-react";

<Button variant="primary" size="md" icon={Plus}>
  Tambah Kategori
</Button>

// Sebagai Link (Inertia)
<Button as={Link} href={route("admin.categories.create")} icon={Plus}>
  Tambah Kategori
</Button>

// Loading state
<Button variant="danger" loading={processing}>
  Hapus
</Button>
```

| Prop | Value | Default |
|---|---|---|
| `variant` | `primary` \| `danger` \| `success` \| `ghost` \| `outline` | `primary` |
| `size` | `sm` \| `md` \| `lg` | `md` |
| `as` | Component (misal `Link`) | `"button"` |
| `icon` | Lucide icon component | — |
| `loading` | boolean | `false` |
| `disabled` | boolean | `false` |

### `<ConfirmDeleteModal>` — `resources/js/Components/ConfirmDeleteModal.jsx`

```jsx
import ConfirmDeleteModal from "@/Components/ConfirmDeleteModal";

<ConfirmDeleteModal
  open={!!target}
  title="Hapus Kategori"
  description={`Yakin ingin menghapus "${target?.name}"?`}
  processing={deleting}
  onConfirm={confirmDelete}
  onClose={() => !deleting && setTarget(null)}
/>
```

Semua prop opsional kecuali `open`, `onConfirm`, `onClose`. Prop `error`
opsional untuk tampilkan banner error di bawah deskripsi (dipakai kalau
delete bisa gagal karena constraint, misal data masih dipakai di tempat
lain).

---

## Color Mapping Guide

### Surface & Text

| Hardcoded (lama) | Theme Token (baru) |
|---|---|
| `bg-white` | `bg-card` |
| `bg-slate-50` | `bg-muted` atau `bg-background` |
| `bg-slate-100` | `bg-muted` |
| `bg-slate-200` | `bg-muted` |
| `bg-slate-900` | `bg-foreground` |
| `text-slate-900` / `text-slate-800` | `text-foreground` |
| `text-slate-700` | `text-foreground` |
| `text-slate-600` | `text-muted-foreground` |
| `text-slate-500` | `text-muted-foreground` |
| `text-slate-400` | `text-muted-foreground` |
| `text-white` (di atas primary) | `text-primary-foreground` |
| `border-slate-200` | `border-border` |
| `border-slate-100` | `border-border` |
| `divide-slate-100` | `divide-border` |
| `bg-slate-900/60` (modal backdrop) | `bg-black/50` |
| `focus:ring-blue-500` / `focus:border-blue-500` | `focus:ring-ring` / `focus:border-ring` |

### Status Colors

| Hardcoded (lama) | Theme Token (baru) |
|---|---|
| `bg-red-100` | `bg-destructive/10` |
| `text-red-600` / `text-red-700` | `text-destructive` |
| `bg-red-600` | `bg-destructive` |
| `border-red-200` | `border-destructive/20` |
| `bg-emerald-100` | `bg-success/10` |
| `text-emerald-700` | `text-success` |
| `bg-amber-100` | `bg-warning/10` |
| `text-amber-700` | `text-warning` |

### Gradient → Flat Button

| Gradient (lama) | Ganti dengan |
|---|---|
| `bg-gradient-to-r from-primary-500 to-primary-600 ... text-white` | `<Button variant="primary">` |
| `bg-gradient-to-r from-red-500 to-rose-600 ... text-white` | `<Button variant="danger">` |
| `bg-gradient-to-r from-emerald-500 to-green-600 ... text-white` | `<Button variant="success">` |
| `bg-gradient-to-r from-indigo-500 to-violet-600 ...` (Kasir) | Ditunda — Kasir di-skip sampai terakhir |

### YANG TIDAK DIUBAH (Sengaja Tetap Hardcoded)

- **Type/category badges** — `bg-blue-100 text-blue-700` (Barang Jadi),
  `bg-purple-100 text-purple-700` (Bahan Baku), dll. Warna spesifik per
  kategori, tidak terkait tema.
- **Chart warna spesifik non-primary** kalau memang butuh warna fix untuk
  bedain seri data.
- **Warna di dalam `Themes/Preview*.jsx`** — ini legitimate inline style
  karena preview harus render token arbitrary dari form, bukan tema aktif.

---

## Checklist Per Halaman

Setiap file yang diaudit, cek 5 hal ini:

```
□ THEME    — Semua bg-/text-/border- surface & interactive pakai token, bukan hardcoded
□ GRADIENT — Semua gradient button diganti <Button variant="...">
□ MODAL    — ConfirmDeleteModal import dari @/Components/ConfirmDeleteModal
□ UX       — Empty state, loading state, error state ada dan konsisten
□ MOBILE   — Ada card layout responsive, bukan cuma desktop table
```

---

## Batch Plan (A-Z)

### Batch 1 — Index Only (9 file)
`ActivityLogs`, `Bookings`, `Debts`, `EmployeeCommissions`, `Kitchen`,
`Memberships`, `Queue`, `Roles`, `Users`

### Batch 2 — CRUD Standard (~35 file)
`Branches`, `Categories`, `Customers`, `Employees`, `ExpenseCategories`,
`Expenses`, `PaymentMethods`, `ProductBatches`, `Suppliers`

### Batch 3 — CRUD Kompleks (~80 file)
`CafeTables`, `CashierShifts`, `ModifierGroups`, `PaymentGateway`,
`Products`, `Promotions`, `PurchaseReturns`, `Purchases`, `SaleReturns`,
`Sales`, `Stock`, `Reports`, `Settings`

### Batch 4 — Standalone (~5 file)
`Dashboard.jsx`, `SelectBranch.jsx`, `SelectStore.jsx`, `PGPaymentModal.jsx`

### Phase 2 — Components (~21 file)
`TextInput`, `InputLabel`, `InputError`, `Modal`, `Dropdown`, `Checkbox`,
`TreePicker`, `BarcodeScanner`, `NavLink`, `ResponsiveNavLink`,
`AIChatWidget`, `SyncBadge`, `OfflineIndicator`, plus cek duplikat
`CurrencyInput`/`Field`/`SectionCard`/`Select`/`SearchableSelect` (root vs
`ui/`).

### Phase 3 — Layouts (~3 file)
`DeveloperLayout.jsx`, `GuestLayout.jsx` (`AuthenticatedLayout.jsx` sudah
di-fix sebagian).

### Skip — Terakhir
`Kasir/` (27 file) — halaman POS paling sensitif, dikerjakan paling
terakhir setelah semua yang lain selesai.

---

## Verifikasi Setelah Setiap Batch

```powershell
vendor/bin/pint --dirty --format agent
npm run build
php artisan test --compact tests/Feature/Theme*.php
```

Manual check: buka halaman yang baru diaudit, toggle light/dark mode di
`/app/themes`, pastikan tidak ada warna yang "pecah" atau kontras buruk di
salah satu mode.
