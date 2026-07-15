# PLANNING: Purchases - Store Type Visibility Fix

## Objective
Memperbaiki visibilitas label Purchases & Purchase Returns agar sesuai per store type.

---

## Checklist

| # | Task | File | Status | Verified |
|---|------|------|--------|----------|
| 1 | Pass storeType ke Show.jsx dari Controller | `PurchaseController.php` | ☐ | ☐ |
| 2 | Adapt Show.jsx labels per store type | `Show.jsx` | ☐ | ☐ |
| 3 | Pass storeType ke PurchaseReturn pages | `PurchaseReturnController.php` | ☐ | ☐ |
| 4 | Adapt PurchaseReturns Index.jsx labels | `PurchaseReturns/Index.jsx` | ☐ | ☐ |
| 5 | Adapt PurchaseReturns Create.jsx labels | `PurchaseReturns/Create.jsx` | ☐ | ☐ |
| 6 | Adapt PurchaseReturns Show.jsx labels | `PurchaseReturns/Show.jsx` | ☐ | ☐ |
| 7 | Fix Create.jsx sidebar summary label | `Purchases/Create.jsx` | ☐ | ☐ |
| 8 | Jalankan Pint & verify | Terminal | ☐ | ☐ |

---

## ANALYSIS

### Purchase Feature Store Types
Feature `purchase` aktif di: **retail**, **fnb**, **rental** (3 types saja)

### Current State — Sudah Benar ✅

| Element | Status | Keterangan |
|---------|--------|------------|
| Controller passes storeType ke Index | ✅ | `PurchaseController::index()` |
| Controller passes storeType ke Create | ✅ | `PurchaseController::create()` |
| Controller passes storeType ke Edit | ✅ | `PurchaseController::edit()` |
| Index.jsx page title | ✅ | retail="Pembelian", fnb="Pembelian Bahan Baku", rental="Pembelian Unit" |
| Index.jsx add button | ✅ | retail/rental="Tambah Pembelian", fnb="Tambah Bahan Baku" |
| Create.jsx product label | ✅ | retail/rental="Cari Produk", fnb="Cari Bahan Baku" |
| Create.jsx unit label | ✅ | retail/rental="pcs", fnb="stok" |

### Issues Found ❌

#### ISSUE 1: Show.jsx TIDAK menerima storeType
- **Lokasi**: `PurchaseController.php` show() method
- **Masalah**: Controller tidak mengirim storeType ke Show page
- **Dampak**: Label "Produk", "Item Pembelian", "Informasi Pembelian" generic untuk semua type

#### ISSUE 2: Show.jsx labels generic
- **Lokasi**: `Show.jsx:75`, `Show.jsx:163`, `Show.jsx:192`, `Show.jsx:204`
- **Masalah**: 
  - "Detail Pembelian" → should be "Detail Pembelian Bahan Baku" for fnb
  - "Informasi Pembelian" → should be "Informasi Pembelian Bahan Baku" for fnb
  - "Item Pembelian" → should be "Item Bahan Baku" for fnb
  - "Produk" column → should be "Bahan Baku" for fnb

#### ISSUE 3: PurchaseReturnController TIDAK pass storeType
- **Lokasi**: `PurchaseReturnController.php`
- **Masalah**: Semua method (index, create, show) tidak mengirim storeType
- **Dampak**: Semua PurchaseReturn pages generic

#### ISSUE 4: PurchaseReturns Index.jsx labels generic
- **Lokasi**: `PurchaseReturns/Index.jsx:72`, `PurchaseReturns/Index.jsx:84`
- **Masalah**: "Retur Pembelian" generic, should adapt per store type

#### ISSUE 5: PurchaseReturns Create.jsx labels generic
- **Lokasi**: `PurchaseReturns/Create.jsx`
- **Masalah**: Labels generic, should adapt per store type

#### ISSUE 6: PurchaseReturns Show.jsx labels generic
- **Lokasi**: `PurchaseReturns/Show.jsx`
- **Masalah**: Labels generic, should adapt per store type

#### ISSUE 7: Create.jsx sidebar summary uses "produk" for fnb
- **Lokasi**: `Purchases/Create.jsx` sidebar
- **Masalah**: "{n} produk" should be "{n} bahan baku" for fnb

---

## PROMPT PER TASK

### Task 1: Pass storeType ke Show.jsx

**File:** `app/Http/Controllers/Admin/PurchaseController.php`

**Prompt:**
```
Pada file app/Http/Controllers/Admin/PurchaseController.php, method show() 
TIDAK mengirim storeType ke Inertia view.

PERBAIKAN:
Tambahkan storeType di return Inertia::render:

$storeId = session("current_store_id");
$store = \App\Models\Store::with("storeType")->find($storeId);
$storeType = $store?->getRelation("storeType")?->code ?? "retail";

return Inertia::render("Admin/Purchases/Show", [
    ...existing props...,
    "storeType" => $storeType,
]);
```

---

### Task 2: Adapt Show.jsx labels

**File:** `resources/js/Pages/Admin/Purchases/Show.jsx`

**Prompt:**
```
Pada file resources/js/Pages/Admin/Purchases/Show.jsx,
labels bersifat generic untuk semua store type.

PERBAIKAN:
1. Terima prop storeType dari controller (setelah Task 1 selesai)
2. Buat label mapping:

const PAGE_TITLE = {
    retail: "Pembelian",
    fnb: "Pembelian Bahan Baku",
    rental: "Pembelian Unit",
};
const PRODUCT_LABEL = {
    retail: "Produk",
    fnb: "Bahan Baku",
    rental: "Unit",
};
const pageTitle = PAGE_TITLE[storeType] ?? "Pembelian";
const productLabel = PRODUCT_LABEL[storeType] ?? "Produk";

3. Ganti labels:
- "Detail Pembelian" → `Detail ${pageTitle}`
- Head title → `${pageTitle} ${purchase.purchase_no}`
- "Informasi Pembelian" → `Informasi ${pageTitle}`
- "Item Pembelian" → `Item ${pageTitle}`
- "Produk" column header → productLabel
```

---

### Task 3: Pass storeType ke PurchaseReturn pages

**File:** `app/Http/Controllers/Admin/PurchaseReturnController.php`

**Prompt:**
```
Pada file app/Http/Controllers/Admin/PurchaseReturnController.php,
semua method (index, create, show) TIDAK mengirim storeType.

PERBAIKAN:
1. Tambahkan helper:

private function resolveStoreType(): string
{
    $storeId = session("current_store_id");
    return \App\Models\Store::with("storeType")
        ->find($storeId)
        ?->getRelation("storeType")?->code ?? "retail";
}

2. Di method index(), tambahkan:
"storeType" => $this->resolveStoreType(),

3. Di method create(), tambahkan:
"storeType" => $this->resolveStoreType(),

4. Di method show(), tambahkan:
"storeType" => $this->resolveStoreType(),
```

---

### Task 4: Adapt PurchaseReturns Index.jsx

**File:** `resources/js/Pages/Admin/PurchaseReturns/Index.jsx`

**Prompt:**
```
Pada file resources/js/Pages/Admin/PurchaseReturns/Index.jsx,
labels bersifat generic.

PERBAIKAN:
1. Terima prop storeType dari controller
2. Buat label mapping:

const PAGE_TITLE = {
    retail: "Retur Pembelian",
    fnb: "Retur Bahan Baku",
    rental: "Retur Pembelian Unit",
};
const pageTitle = PAGE_TITLE[storeType] ?? "Retur Pembelian";

3. Ganti:
- header "Retur Pembelian" → pageTitle
- Head title → pageTitle
- "Belum ada retur pembelian" → `Belum ada ${pageTitle.toLowerCase()}`
```

---

### Task 5: Adapt PurchaseReturns Create.jsx

**File:** `resources/js/Pages/Admin/PurchaseReturns/Create.jsx`

**Prompt:**
```
Pada file resources/js/Pages/Admin/PurchaseReturns/Create.jsx,
labels bersifat generic.

PERBAIKAN:
1. Terima prop storeType dari controller
2. Buat label mapping yang sama dengan Index
3. Ganti labels yang generic sesuai store type
```

---

### Task 6: Adapt PurchaseReturns Show.jsx

**File:** `resources/js/Pages/Admin/PurchaseReturns/Show.jsx`

**Prompt:**
```
Pada file resources/js/Pages/Admin/PurchaseReturns/Show.jsx,
labels bersifat generic.

PERBAIKAN:
1. Terima prop storeType dari controller
2. Buat label mapping yang sama dengan Index
3. Ganti labels yang generic sesuai store type
```

---

### Task 7: Fix Create.jsx sidebar summary

**File:** `resources/js/Pages/Admin/Purchases/Create.jsx`

**Prompt:**
```
Pada file resources/js/Pages/Admin/Purchases/Create.jsx,
sidebar summary menggunakan "{n} produk" untuk semua store type.

PERBAIKAN:
Buat label dinamis:
const itemLabel = storeType === "fnb" ? "bahan baku" : "produk";

Lalu ganti "{n} produk" menjadi `{n} ${itemLabel}`
```

---

### Task 8: Jalankan Pint & Verify

**Prompt:**
```
Setelah semua perubahan selesai:
1. Jalankan: vendor/bin/pint --dirty --format agent
2. Jalankan: npm run build
3. Buka halaman Purchase Show, PurchaseReturns Index/Create/Show
4. Pastikan:
   - retail: Labels "Produk", "Pembelian"
   - fnb: Labels "Bahan Baku", "Pembelian Bahan Baku"
   - rental: Labels "Unit", "Pembelian Unit"
```

---

## EXPECTED RESULT MATRIX

### Purchases Pages

| Element | retail | fnb | rental |
|---------|:------:|:---:|:------:|
| Index title | Pembelian | Pembelian Bahan Baku | Pembelian Unit |
| Create product label | Cari Produk | Cari Bahan Baku | Cari Produk |
| Create unit label | pcs | stok | pcs |
| Create sidebar | {n} produk | {n} bahan baku | {n} produk |
| Show title | Detail Pembelian | Detail Pembelian Bahan Baku | Detail Pembelian Unit |
| Show info title | Informasi Pembelian | Informasi Pembelian Bahan Baku | Informasi Pembelian Unit |
| Show items title | Item Pembelian | Item Bahan Baku | Item Pembelian Unit |
| Show product column | Produk | Bahan Baku | Unit |

### PurchaseReturns Pages

| Element | retail | fnb | rental |
|---------|:------:|:---:|:------:|
| Index title | Retur Pembelian | Retur Bahan Baku | Retur Pembelian Unit |
| Create title | Retur Pembelian | Retur Bahan Baku | Retur Pembelian Unit |
| Show title | Retur Pembelian | Retur Bahan Baku | Retur Pembelian Unit |

---

## NOTES
- Purchase feature hanya aktif di retail, fnb, rental (3 types)
- Task 1-2 (Show.jsx) dan Task 3-6 (PurchaseReturns) bisa dikerjakan paralel
- Task 7 (sidebar summary) minor, bisa di-skip jika mau cepat
- Selalu jalankan `vendor/bin/pint --dirty --format agent` setelah edit PHP
- Selalu jalankan `npm run build` setelah edit JSX

+ Thought: 161ms
PLANNING_PURCHASES.md — DONE ✅
8 Tasks
#	Task
1	Pass storeType ke Show.jsx dari Controller
2	Adapt Show.jsx labels per store type
3	Pass storeType ke PurchaseReturn pages
4	Adapt PurchaseReturns Index.jsx labels
5	Adapt PurchaseReturns Create.jsx labels
6	Adapt PurchaseReturns Show.jsx labels
7	Fix Create.jsx sidebar summary label
8	Jalankan Pint & verify
BUG Terpenting
Show.jsx tidak menerima storeType — Label "Produk" muncul di fnb rental, seharusnya "Bahan Baku" atau "Unit"
PurchaseReturn pages 100% generic — Tidak ada store-type awareness sama sekali
Prioritas Eksekusi
Batch 1 (HARUS): Task 1, 2, 3, 8
Batch 2 (SEBAIKNYA): Task 4, 5, 6
Batch 3 (OPSIONAL): Task 7