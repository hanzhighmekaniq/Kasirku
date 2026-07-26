# Token Mapping — Theme System Reference

Mapping lengkap dari JSON token key → Tailwind class → implementasi di JSX.
File ini jadi referensi saat menulis atau audit kode supaya konsisten.

> Contoh warna menggunakan **Caffein Gelap** (dark mode).
> Setiap token punya **2 key**: background (`bg-xxx`) dan foreground (`text-xxx-foreground`).
> Pola konsisten di semua token: pakai `bg-TOKEN` untuk warna, `text-TOKEN-foreground` untuk teks di atasnya.

---

## Mapping Lengkap

# Panduan Penggunaan Warna / Theme

## Primary

**Background**  
Class: `bg-primary`  
Cocok untuk: background button utama, menu aktif, selected item, badge aktif, dan elemen utama.

**Foreground**  
Class: `text-primary-foreground`  
Cocok untuk: teks dan icon yang berada di atas background primary.

---

## Secondary

**Background**  
Class: `bg-secondary`  
Cocok untuk: background button sekunder, button alternatif, chip, tag, dan badge.

**Foreground**  
Class: `text-secondary-foreground`  
Cocok untuk: teks dan icon yang berada di atas background secondary.

---

## Accent

**Background**  
Class: `bg-accent`  
Cocok untuk: background hover menu, hover item, hover row, dan highlight ringan.

**Foreground**  
Class: `text-accent-foreground`  
Cocok untuk: teks dan icon yang berada di atas background accent.

---

## Background

**Background**  
Class: `bg-background`  
Cocok untuk: background utama halaman atau aplikasi.

**Foreground**  
Class: `text-foreground`  
Cocok untuk: teks utama, judul, label, isi tabel, dan icon utama.

---

## Card

**Background**  
Class: `bg-card`  
Cocok untuk: background card, panel, container, section, dan statistik dashboard.

**Foreground**  
Class: `text-card-foreground`  
Cocok untuk: teks dan icon yang berada di dalam card.

---

## Popover

**Background**  
Class: `bg-popover`  
Cocok untuk: background dropdown, popover, context menu, floating menu, dan tooltip.

**Foreground**  
Class: `text-popover-foreground`  
Cocok untuk: teks dan icon yang berada di dalam popover atau dropdown.

---

## Muted

**Background**  
Class: `bg-muted`  
Cocok untuk: background area redup, header tabel, disabled area, empty state, dan area informasi sekunder.

**Foreground**  
Class: `text-muted-foreground`  
Cocok untuk: teks sekunder, deskripsi, subtitle, placeholder, keterangan, dan informasi yang tidak terlalu penting.

---

## Destructive

**Background**  
Class: `bg-destructive`  
Cocok untuk: background button hapus, danger action, error, dan tindakan berbahaya.

**Foreground**  
Class: `text-destructive-foreground`  
Cocok untuk: teks dan icon yang berada di atas background destructive.

---

## Border

**Border**  
Class: `border-border`  
Cocok untuk: border card, tabel, divider, sidebar, modal, dropdown, dan container.

---

##   

**Input**  
Class: `border-input`  
Cocok untuk: border input, textarea, select, search field, dan form control lainnya.

---

## Ring

**Ring**  
Class: `ring-ring`  
Cocok untuk: focus input, focus button, selected control, dan keyboard navigation.

Contoh:

`focus-visible:ring-2 focus-visible:ring-ring`

---

# Chart

## Chart 1

Class: `fill-chart-1` / `text-chart-1`  
Cocok untuk: data utama atau series utama pada chart.

---

## Chart 2

Class: `fill-chart-2` / `text-chart-2`  
Cocok untuk: data kedua atau data pembanding pada chart.

---

## Chart 3

Class: `fill-chart-3` / `text-chart-3`  
Cocok untuk: data ketiga atau kategori tambahan pada chart.

---

## Chart 4

Class: `fill-chart-4` / `text-chart-4`  
Cocok untuk: data keempat atau supporting data pada chart.

---

## Chart 5

Class: `fill-chart-5` / `text-chart-5`  
Cocok untuk: data kelima atau supporting data tambahan pada chart.

---

# Sidebar

## Sidebar Background

Class: `bg-sidebar`  
Cocok untuk: background utama sidebar.

---

## Sidebar Foreground

Class: `text-sidebar-foreground`  
Cocok untuk: teks dan icon normal di dalam sidebar.

---

## Sidebar Active

Class: `bg-primary text-primary-foreground`  
Cocok untuk: menu sidebar yang sedang aktif atau terpilih.

---

## Sidebar Hover

Class: `hover:bg-accent hover:text-accent-foreground`  
Cocok untuk: menu sidebar ketika diarahkan mouse.

---

## Sidebar Border

Class: `border-border`  
Cocok untuk: border atau garis pemisah sidebar.

---

# Komponen Standar

## Tabel

> **STANDAR RESMI (diputuskan 2026-07-26): ikuti `Pages/Admin/Products/Index.jsx`.**
> File itu adalah acuan tunggal untuk pewarnaan tabel. Semua tabel di seluruh
> halaman Admin sudah disamakan ke pola ini. Kalau ada keraguan, buka
> `Products/Index.jsx` baris 693 & 880–957, jangan mengarang sendiri.

Kontras berjenjang: `bg-popover` (header) → `bg-card` (wrapper) → `bg-background` (isi baris).

| Layer | Class |
|---|---|
| Card wrapper (pembungkus tabel) | `border border-border bg-card` |
| Thead | `bg-popover text-xs uppercase tracking-wide text-card-foreground` |
| `<tr>` di dalam thead | **tanpa className** — warna & tipografi diwarisi dari `<thead>` |
| Th | `px-4 py-3 text-left font-semibold` (pakai `text-center`/`text-right` sesuai kolom; **jangan** tambah class warna) |
| Tbody | `divide-y divide-border bg-background` |
| Tr baris data | `transition hover:bg-[rgb(var(--color-table-hover))]` |
| Td | `px-4 py-3` + `text-foreground` (data utama) atau `text-muted-foreground` (sekunder) |

```jsx
<div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
    <table className="w-full text-sm">
        <thead className="bg-popover text-xs uppercase tracking-wide text-card-foreground">
            <tr>
                <th className="px-4 py-3 text-left font-semibold">Nama</th>
                <th className="px-4 py-3 text-right font-semibold">Harga</th>
            </tr>
        </thead>
        <tbody className="divide-y divide-border bg-background">
            <tr className="transition hover:bg-[rgb(var(--color-table-hover))]">
                <td className="px-4 py-3 text-foreground">Isi</td>
                <td className="px-4 py-3 text-right text-muted-foreground">Rp 0</td>
            </tr>
        </tbody>
    </table>
</div>
```

### Kenapa `hover:bg-[rgb(var(--color-table-hover))]` dan bukan token?

Ini **pengecualian yang disengaja** dari aturan "jangan pakai `bg-[rgb(var(--color-xxx))]`"
di section "Old CSS Variable → New Tailwind Class". `--color-table-hover` **tetap
ikut tema aktif** karena `resources/js/Theme/ThemeProvider.jsx:149` mengesetnya
dari `tokens.muted` tema yang dipilih user saat runtime. Nilai di `app.css` hanya
fallback statis untuk light/dark. Jangan "perbaiki" ini jadi `hover:bg-muted`.

### Yang TIDAK boleh ada di baris tabel

- Tint dekoratif / zebra / hierarki: `even:bg-*`, `odd:bg-*`, `bg-muted/30`,
  `bg-muted/80`, tint karena `depth === 0`. Semua baris harus rata `bg-background`.
- Hover lain: `hover:bg-muted`, `hover:bg-muted/50`, `hover:bg-accent`,
  `hover:bg-slate-50` → semua diganti ke class hover standar di atas.

Highlight baris yang **bermakna data** (batch kadaluarsa `bg-destructive/10`,
stok habis, baris terpilih `bg-primary/10`) **tetap dipertahankan** — itu
informasi, bukan dekorasi.

---

## Modal / Dialog (Lengkap)

| Layer | Token | Class |
|---|---|---|
| Overlay backdrop | — | `bg-background/80 backdrop-blur-sm` |
| Background modal | popover | `bg-popover` |
| Border modal | border | `border border-border rounded-2xl` |
| Judul modal | popover-foreground | `text-popover-foreground font-semibold` |
| Deskripsi modal | muted | `text-muted-foreground text-sm` |
| Footer modal background | muted | `bg-muted/50 border-t border-border` |

```jsx
<div className="fixed inset-0 bg-background/80 backdrop-blur-sm" />
<div className="rounded-2xl border border-border bg-popover p-6 shadow-xl">
    <h3 className="text-popover-foreground font-semibold">Judul</h3>
    <p className="text-muted-foreground text-sm">Deskripsi</p>
    <div className="mt-4 flex justify-end gap-2 border-t border-border bg-muted/50 -m-6 mt-6 p-4">
        <button className="bg-destructive text-destructive-foreground rounded-lg px-4 py-2 hover:bg-destructive/90">
            Hapus
        </button>
    </div>
</div>
```

---

## PageHeader / Topbar

| Layer | Token | Class |
|---|---|---|
| Background topbar/header | sidebar | `bg-sidebar border-b border-border` |
| Judul halaman (h1) | foreground | `text-foreground font-bold text-xl` |
| Breadcrumb teks | muted | `text-muted-foreground text-xs` |
| Breadcrumb separator | muted | `text-muted-foreground/40` |
| Deskripsi halaman | muted | `text-muted-foreground text-sm` |

---

## Tombol Inline (Lengkap)

Dipakai saat tidak memakai komponen `Button`, misalnya aksi kecil dalam tabel/card.

| Jenis | Class |
|---|---|
| Primary | `bg-primary text-primary-foreground hover:bg-primary/90` |
| Secondary | `bg-secondary text-secondary-foreground hover:bg-secondary/80` |
| Destructive | `bg-destructive text-destructive-foreground hover:bg-destructive/90` |
| Success | `bg-success text-success-foreground hover:bg-success/90` |
| Warning | `bg-warning text-warning-foreground hover:bg-warning/90` |
| Outline | `border border-border text-foreground hover:bg-muted` |
| Ghost | `text-muted-foreground hover:bg-muted hover:text-foreground` |
| Hover ringan (ganti numeric scale) | `hover:bg-primary/10 hover:text-primary` (bukan `hover:bg-primary-50 hover:text-primary-600`) |

**Jangan pakai** `bg-primary-50`, `text-primary-600`, `border-primary-200`, dst — itu numeric palette scale, bukan token tema. Gunakan opacity modifier: `bg-primary/10`, `text-primary`, `border-primary/20`.

---

## Badge / Status Pill (Lengkap)

Status yang punya makna universal (sukses/gagal/peringatan) **wajib** pakai token tema supaya ikut berubah sesuai tema aktif:

| Status | Token | Class | Kapan dipakai |
|---|---|---|---|
| Sukses / Lunas / Aktif / Stok Aman | success | `bg-success/10 text-success` | paid, active, open, safe |
| Peringatan / Pending / Stok Menipis | warning | `bg-warning/10 text-warning` | pending, draft, low stock |
| Error / Gagal / Habis / Batal | destructive | `bg-destructive/10 text-destructive` | failed, void, out of stock |
| Info / Netral / Terpilih | primary | `bg-primary/10 text-primary` | info, selected |
| Non-aktif / Tutup / Sekunder | muted | `bg-muted text-muted-foreground` | inactive, closed |

**Dilarang** pakai `bg-emerald-100`, `bg-rose-100`, `bg-red-100`, `bg-amber-100` untuk status di atas — semua diganti ke token yang sesuai.

### Badge non-semantik (kategori, role, tipe — bukan status)

Untuk label yang **bukan** status universal (role user, tier membership, tipe produk per kategori bebas), warna hardcoded per kategori masih boleh, **tapi wajib punya varian `dark:`** supaya kontras tetap terjaga di dark mode:

```jsx
// Role badge
<span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Admin</span>
<span className="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">Supervisor</span>

// Tier membership
<span className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Gold</span>
<span className="bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300">Silver</span>

// Tipe produk
<span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Barang Jadi</span>
<span className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">Bahan Baku</span>
```

Aturan: `bg-{color}-100 text-{color}-700` (light) dipasangkan dengan `dark:bg-{color}-900/30 dark:text-{color}-400` (dark). Jangan campur skala berbeda (misal `bg-{color}-50` dengan `dark:bg-{color}-900`), tetap konsisten `100↔900/30` supaya kontrasnya setara.

---

## Alert / Notification Banner

| Jenis | Class |
|---|---|
| Success banner | `bg-success/10 border border-success/20 text-success` |
| Warning banner | `bg-warning/10 border border-warning/20 text-warning` |
| Error banner | `bg-destructive/10 border border-destructive/20 text-destructive` |
| Info banner | `bg-primary/10 border border-primary/20 text-primary` |

---

## Form & Input (Lengkap)

| Layer | Token | Class |
|---|---|---|
| Background input | background | `bg-background` |
| Border normal | input | `border-input` |
| Border focus | ring | `focus:border-ring focus:ring-2 focus:ring-ring/20` |
| Label | foreground | `text-foreground text-sm font-medium` |
| Placeholder | muted | `placeholder:text-muted-foreground` |
| Error border | destructive | `border-destructive` |
| Error teks | destructive | `text-destructive text-xs mt-1` |
| Helper text | muted | `text-muted-foreground text-xs mt-1` |
| Disabled | muted | `opacity-50 cursor-not-allowed bg-muted` |

---

## Empty State

| Layer | Token | Class |
|---|---|---|
| Container background | muted | `bg-muted/30 rounded-xl` |
| Icon | muted | `text-muted-foreground/50 h-8 w-8` |
| Teks utama | foreground | `text-foreground font-medium text-sm` |
| Teks deskripsi | muted | `text-muted-foreground text-sm` |

---

## Divider / Separator

```
Horizontal      → border-t border-border
Vertical        → w-px bg-border
List divider    → divide-y divide-border
Section divider → border-b border-border
```

> Catatan: pakai `border-border` polos (tanpa `/50`) di semua kondisi — sudah distandarkan, jangan pakai `border-border/50` lagi.

---

## Tabel Referensi Cepat — Semua Komponen

| Komponen | Background | Foreground | Border |
|---|---|---|---|
| Card | `bg-card` | `text-card-foreground` | `border-border` |
| Tabel wrapper | `bg-card` | `text-card-foreground` | `border-border` |
| Tabel header (thead) | `bg-popover` | `text-card-foreground` | — |
| Tabel row (tbody) | `bg-background` | `text-foreground` | `divide-border` |
| Tabel row hover | `bg-[rgb(var(--color-table-hover))]` | — | — |
| Modal | `bg-popover` | `text-popover-foreground` | `border-border` |
| Input | `bg-background` | `text-foreground` | `border-input` |
| Sidebar | `bg-sidebar` | `text-sidebar-foreground` | `border-border` |
| Topbar/PageHeader | `bg-sidebar` | `text-foreground` | `border-border` |
| Dropdown/Popover | `bg-popover` | `text-popover-foreground` | `border-border` |
| Badge sukses | `bg-success/10` | `text-success` | — |
| Badge warning | `bg-warning/10` | `text-warning` | — |
| Badge error | `bg-destructive/10` | `text-destructive` | — |
| Badge info | `bg-primary/10` | `text-primary` | — |
| Button primary | `bg-primary` | `text-primary-foreground` | — |
| Button secondary | `bg-secondary` | `text-secondary-foreground` | — |
| Button outline | transparent | `text-foreground` | `border-border` |
| Button ghost | transparent | `text-muted-foreground` | — |
| Button destructive | `bg-destructive` | `text-destructive-foreground` | — |

---

# Ringkasan Penggunaan

`primary`  
Untuk button utama, active state, selected state, dan elemen yang ingin ditonjolkan.

`secondary`  
Untuk button kedua, alternatif, chip, tag, dan badge.

`accent`  
Untuk hover, highlight, dan interactive state ringan.

`background`  
Untuk background utama halaman atau aplikasi.

`foreground`  
Untuk teks dan icon utama.

`card`  
Untuk card, panel, container, dan section.

`popover`  
Untuk dropdown, popover, context menu, dan floating element.

`muted`  
Untuk background yang lebih redup dan tidak terlalu menonjol.

`muted-foreground`  
Untuk teks sekunder, subtitle, deskripsi, placeholder, dan keterangan.

`destructive`  
Untuk hapus, error, danger action, dan tindakan berbahaya.

`border`  
Untuk border card, tabel, divider, modal, dan container.

`input`  
Untuk border input dan form control.

`ring`  
Untuk focus state pada input, button, dan interactive element.

`sidebar`  
Untuk background dan elemen dasar sidebar.

`chart-1` sampai `chart-5`  
Untuk membedakan series atau kategori data pada chart.

**Elemen sidebar pakai token utama:**

| Kegunaan | Class |
|---|---|
| Hover nav item | `hover:bg-muted hover:text-foreground` |
| Active nav item | `bg-primary text-primary-foreground` |
| Border sidebar | `border-border` |
| Input search | `bg-muted border-border` |
| Focus ring | `focus:ring-ring/20` |

### Status (Standar di semua tema)

| Token | Warna | Tailwind Class | Kegunaan |
|---|---|---|---|
| Success `#16A34A` | hijau | `bg-success` | Status sukses |
| Success FG `#FFFFFF` | putih | `text-success-foreground` | Teks di atas success |
| Warning `#F59E0B` | kuning | `bg-warning` | Status peringatan |
| Warning FG `#FFFFFF` | putih | `text-warning-foreground` | Teks di atas warning |
| Info `#0284C7` | biru | `bg-info` | Status info |
| Info FG `#FFFFFF` | putih | `text-info-foreground` | Teks di atas info |

---

## Pola Konsisten: 2 Token per Komponen

```
bg-primary          → warna background utama
text-primary-foreground → teks di atasnya

bg-card             → background kartu
text-card-foreground → teks di dalam kartu

bg-sidebar          → background sidebar
text-sidebar-foreground → teks di sidebar

bg-muted            → background sekunder / hover
text-muted-foreground → teks sekunder / label

bg-popover          → background modal / dropdown
text-popover-foreground → teks di dalam modal
```

---

## Old CSS Variable → New Tailwind Class

Mapping untuk kode lama yang masih pakai `bg-[rgb(var(--color-xxx))]`.

> **Pengecualian:** `--color-table-hover` pada baris tabel JANGAN dikonversi —
> lihat penjelasan di section "Tabel". Itu standar resmi, bukan kode lama.

```
bg-[rgb(var(--color-card))]              → bg-card
bg-[rgb(var(--color-background))]        → bg-background
bg-[rgb(var(--color-modal))]             → bg-popover
bg-[rgb(var(--color-surface-secondary))] → bg-muted

text-[rgb(var(--color-text-primary))]    → text-foreground
text-[rgb(var(--color-text-secondary))]  → text-muted-foreground
text-[rgb(var(--color-text-muted))]      → text-muted-foreground

border-[rgb(var(--color-border))]        → border-border
text-[rgb(var(--color-primary-500))]     → text-primary
bg-[rgb(var(--color-primary-500))]       → bg-primary
```

---

## Hardcoded Tailwind → Theme Token

```
bg-white      → bg-card
bg-slate-50   → bg-muted
bg-slate-100  → bg-muted
bg-slate-900  → bg-background

text-slate-900 → text-foreground
text-slate-700 → text-foreground
text-slate-600 → text-muted-foreground
text-slate-500 → text-muted-foreground
text-slate-400 → text-muted-foreground

border-slate-200 → border-border
border-slate-300 → border-border

hover:bg-slate-50  → hover:bg-muted
hover:bg-slate-100 → hover:bg-muted

focus:border-primary-500 → focus:border-ring
focus:ring-primary-200   → focus:ring-ring/20

bg-gradient-to-r from-primary-500 to-primary-600 → bg-primary
text-white (di atas primary)                      → text-primary-foreground
```

---

## Contoh Implementasi (Caffein Gelap)

### Kartu
```jsx
<div className="bg-card text-card-foreground border border-border rounded-xl p-4">
    {/* bg=#191919  text=#eeeeee  border=#201e18 */}
    <h3 className="text-foreground font-bold">Judul</h3>
    <p className="text-muted-foreground text-sm">Deskripsi</p>
</div>
```

### Tabel
```jsx
<table className="w-full text-sm">
    <thead className="bg-popover text-xs uppercase tracking-wide text-card-foreground">
        <tr>
            <th className="px-4 py-3 text-left font-semibold">Nama</th>
        </tr>
    </thead>
    <tbody className="divide-y divide-border bg-background">
        <tr className="transition hover:bg-[rgb(var(--color-table-hover))]">
            <td className="px-4 py-3 text-foreground">Isi</td>
            <td className="px-4 py-3 text-muted-foreground">Detail</td>
        </tr>
    </tbody>
</table>
```

### Input
```jsx
<input className="border-input bg-background text-foreground
    focus:border-ring focus:ring-2 focus:ring-ring/20
    placeholder:text-muted-foreground" />
```

### Modal / Dropdown
```jsx
<div className="bg-popover text-popover-foreground border border-border rounded-2xl p-6">
    <h3 className="text-foreground font-semibold">Judul</h3>
    <p className="text-muted-foreground text-sm">Deskripsi</p>
    <button className="bg-destructive text-destructive-foreground rounded-lg px-4 py-2">
        Hapus
    </button>
</div>
```

### Tombol
```jsx
{/* Primary — warna utama tema */}
<button className="bg-primary text-primary-foreground rounded-lg px-4 py-2 hover:bg-primary/90">
    Simpan
</button>

{/* Secondary */}
<button className="bg-secondary text-secondary-foreground rounded-lg px-4 py-2 hover:bg-secondary/80">
    Batal
</button>

{/* Destructive */}
<button className="bg-destructive text-destructive-foreground rounded-lg px-4 py-2">
    Hapus
</button>

{/* Outline */}
<button className="border border-border text-foreground rounded-lg px-4 py-2 hover:bg-muted">
    Detail
</button>

{/* Ghost */}
<button className="text-muted-foreground rounded-lg px-4 py-2 hover:bg-muted hover:text-foreground">
    Tutup
</button>
```

### Sidebar Navigation
```jsx
<aside className="bg-sidebar text-sidebar-foreground border-r border-border">

    {/* Nav item — inactive */}
    <a className="flex items-center gap-2 rounded-lg px-3 py-2
        text-sidebar-foreground/70 hover:bg-muted hover:text-foreground">
        <Icon />
        Menu
    </a>

    {/* Nav item — active */}
    <a className="flex items-center gap-2 rounded-lg px-3 py-2
        bg-primary text-primary-foreground">
        <Icon />
        Menu Aktif
    </a>

    {/* Search input */}
    <input className="w-full rounded-xl border border-border bg-muted
        text-sidebar-foreground placeholder:text-sidebar-foreground/50
        focus:border-ring focus:ring-2 focus:ring-ring/20" />

    {/* Group header */}
    <span className="text-muted-foreground text-xs uppercase tracking-wider">
        Grup Menu
    </span>

</aside>
```

### Badge / Pill Aktif
```jsx
{/* Mengikuti warna tema */}
<span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs">
    Aktif
</span>

{/* Mengikuti success token */}
<span className="bg-success/10 text-success rounded-full px-2 py-0.5 text-xs">
    Sukses
</span>
```

---

## Yang TIDAK Diubah (Hardcoded Sengaja)

**Update:** Status universal (Pending/Aktif/Habis/dst) **sekarang wajib pakai token** (`bg-warning/10`, `bg-success/10`, `bg-destructive/10`) — lihat section "Badge / Status Pill (Lengkap)" di atas. Yang tetap hardcoded hanyalah label **non-status**: role user, tier membership, dan kategori/tipe bebas yang tidak punya makna sukses/gagal/peringatan. Semua wajib punya varian `dark:`.

```jsx
// Role badges — bukan status, warna per-role
<span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Admin</span>
<span className="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">Supervisor</span>

// Tipe produk — kategori bebas, bukan status
<span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Barang Jadi</span>
<span className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">Bahan Baku</span>

// Status universal — WAJIB token, bukan hardcoded
<span className="bg-warning/10 text-warning">Pending</span>
<span className="bg-success/10 text-success">Aktif</span>
<span className="bg-destructive/10 text-destructive">Habis</span>
```
