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

Mapping untuk kode lama yang masih pakai `bg-[rgb(var(--color-xxx))]`:

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
<table>
    <thead className="bg-muted">
        <tr className="border-b border-border text-xs text-muted-foreground">
            <th>Nama</th>
        </tr>
    </thead>
    <tbody className="divide-y divide-border">
        <tr className="hover:bg-muted/50">
            <td className="text-foreground">Isi</td>
            <td className="text-muted-foreground">Detail</td>
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

Badge status informational dan warna per tipe tetap hardcoded karena semantik (bukan tema):

```jsx
// Status badges — makna warna spesifik, tidak ikut tema
<span className="bg-amber-100 text-amber-700">Pending</span>
<span className="bg-emerald-100 text-emerald-700">Aktif</span>
<span className="bg-red-100 text-red-700">Habis</span>

// Role badges
<span className="bg-blue-100 text-blue-700">Admin</span>
<span className="bg-violet-100 text-violet-700">Supervisor</span>

// Tipe produk
<span className="bg-blue-100 text-blue-700">Barang Jadi</span>
<span className="bg-purple-100 text-purple-700">Bahan Baku</span>
```
