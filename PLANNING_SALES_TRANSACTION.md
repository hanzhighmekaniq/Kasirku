# PLANNING: Sales/Transactions - Store Type Visibility Fix

## Objective
Memperbaiki visibilitas field/kolom/label pada Sales/Transactions CRUD agar sesuai dengan masing-masing store type.

---

## Checklist

| # | Task | File | Status | Verified |
|---|------|------|--------|----------|
| 1 | Fix Show.jsx OrderTypeBadge — missing order types | `Show.jsx` | ☐ | ☐ |
| 2 | Pass storeType ke Show.jsx dari Controller | `SaleController.php` | ☐ | ☐ |
| 3 | Adapt header/labels di Show.jsx per store type | `Show.jsx` | ☐ | ☐ |
| 4 | Tambah ExtraStatusBadge untuk parking di Index | `Index.jsx` | ☐ | ☐ |
| 5 | Tambah extra column untuk ticket di Index | `Index.jsx` | ☐ | ☐ |
| 6 | Adapt Summary Card labels per store type | `Index.jsx` | ☐ | ☐ |
| 7 | Adapt Show.jsx Info Row labels per store type | `Show.jsx` | ☐ | ☐ |
| 8 | Pass storeType ke Create.jsx dari Controller | `SaleController.php` | ☐ | ☐ |
| 9 | Adapt Create.jsx order type options per store type | `Create.jsx` | ☐ | ☐ |
| 10 | Jalankan Pint & verify | Terminal | ☐ | ☐ |

---

## ANALYSIS

### Current State — Sudah Benar ✅

| Element | Status | Keterangan |
|---------|--------|------------|
| ORDER_TYPE_OPTIONS | ✅ | 8 store types, masing-masing punya 3 order types |
| EXTRA_COL (Index) | ✅ | fnb=Meja, rental=Tgl Kembali, hospitality=Check-out, parking=Plat Nomor, session=Unit/Sesi |
| PAGE_TITLE (Index) | ✅ | 8 variasi label |
| ExtraStatusBadge (Index) | ✅ | rental, service, session, hospitality |
| Status Ops column (Index) | ✅ | rental, service, session, hospitality |
| Payment filter (Index) | ✅ | Lunas/Sebagian/Belum Bayar |
| Date range filter (Index) | ✅ | Server-side |
| Branch filter (Index) | ✅ | Server-side |
| Show.jsx Service Status | ✅ | Step indicator waiting→in_progress→done |
| Show.jsx Rental Status | ✅ | Status badge + action buttons |
| Show.jsx Hospitality Info | ✅ | Room number, guest count, check-in/out |
| Show.jsx Parking Info | ✅ | Plate number, vehicle type, entry/exit time |
| Show.jsx Session Info | ✅ | Unit name, session start/end time |

### Issues Found ❌

#### BUG 1: Show.jsx OrderTypeBadge HANYA punya 3 order types
- **Lokasi**: `Show.jsx:1459-1475`
- **Masalah**: Hanya ada `dine_in`, `takeaway`, `delivery`. Semua order type lain (wholesale, walk_in, booking, per_hour, per_day, per_week, online, group, check_in, reservation, short_stay, entry, exit, lost_ticket, postpaid, prepaid) TIDAK ADA
- **Dampak**: Badge menampilkan raw string (e.g. "per_hour" bukan "Per Jam") di halaman Detail

#### BUG 2: Show.jsx TIDAK menerima storeType
- **Lokasi**: `SaleController.php:352`
- **Masalah**: Controller tidak mengirim `storeType` ke Show page
- **Dampak**: Tidak bisa adapt label/header per store type

#### BUG 3: Show.jsx Header "Detail Penjualan" generic
- **Lokasi**: `Show.jsx:271-272`
- **Masalah**: Selalu "Detail Penjualan" meskipun fnb="Transaksi", rental="Sewa", dll

#### BUG 4: Parking tidak punya status badge di Index
- **Lokasi**: `Index.jsx:79-150`
- **Masalah**: `ExtraStatusBadge` hanya untuk rental, service, session, hospitality. Parking tidak punya status (entry/exit) di tabel Index

#### BUG 5: Ticket tidak punya extra column di Index
- **Lokasi**: `Index.jsx:54-77`
- **Masalah**: `EXTRA_COL` tidak punya entry untuk ticket. Seharusnya bisa show event/schedule info

#### BUG 6: Summary Card labels generic
- **Lokasi**: `Index.jsx:354-371`
- **Masalah**: "Total Transaksi", "Selesai", "Draft" generic. Bisa lebih spesifik per type

#### BUG 7: Show.jsx Info Row labels generic
- **Lokasi**: `Show.jsx:346-384`
- **Masalah**: "Tipe Pesanan" bisa "Tipe Sewa" untuk rental, "Tipe Layanan" untuk service, dll

#### BUG 8: Create.jsx tidak menerima storeType
- **Lokasi**: `SaleController.php:110-131`
- **Masalah**: Create page tidak tahu store type, jadi order type options mungkin tidak terfilter dengan benar

---

## PROMPT PER TASK

### Task 1: Fix Show.jsx OrderTypeBadge

**File:** `resources/js/Pages/Admin/Sales/Show.jsx`

**Prompt:**
```
Pada file resources/js/Pages/Admin/Sales/Show.jsx, komponen OrderTypeBadge 
(line ~1459) HANYA punya 3 order types: dine_in, takeaway, delivery.

PERBAIKAN:
Tambahkan SEMUA order types yang ada di Index.jsx agar konsisten. 
Copy mapping dari Index.jsx OrderTypeBadge ke Show.jsx OrderTypeBadge:

const map = {
    // FnB
    dine_in: { label: "Dine In", cls: "bg-blue-100 text-blue-700" },
    takeaway: { label: "Takeaway", cls: "bg-orange-100 text-orange-700" },
    delivery: { label: "Delivery", cls: "bg-purple-100 text-purple-700" },
    // Retail
    wholesale: { label: "Grosir", cls: "bg-cyan-100 text-cyan-700" },
    // Service
    walk_in: { label: "Walk-in", cls: "bg-emerald-100 text-emerald-700" },
    booking: { label: "Booking", cls: "bg-violet-100 text-violet-700" },
    pickup_delivery: { label: "Jemput & Antar", cls: "bg-purple-100 text-purple-700" },
    // Rental
    per_hour: { label: "Per Jam", cls: "bg-amber-100 text-amber-700" },
    per_day: { label: "Per Hari", cls: "bg-amber-100 text-amber-700" },
    per_week: { label: "Per Minggu", cls: "bg-amber-100 text-amber-700" },
    // Ticket
    online: { label: "Online", cls: "bg-rose-100 text-rose-700" },
    group: { label: "Group", cls: "bg-pink-100 text-pink-700" },
    // Hospitality
    check_in: { label: "Check-in", cls: "bg-teal-100 text-teal-700" },
    reservation: { label: "Reservasi", cls: "bg-indigo-100 text-indigo-700" },
    short_stay: { label: "Short Stay", cls: "bg-sky-100 text-sky-700" },
    // Parking
    entry: { label: "Masuk", cls: "bg-slate-100 text-slate-700" },
    exit: { label: "Keluar", cls: "bg-slate-200 text-slate-600" },
    lost_ticket: { label: "Tiket Hilang", cls: "bg-red-100 text-red-600" },
    // Session
    postpaid: { label: "Postpaid", cls: "bg-indigo-100 text-indigo-700" },
    prepaid: { label: "Prepaid", cls: "bg-violet-100 text-violet-700" },
};

JANGAN hapus yang sudah ada, cukup tambahkan yang kurang.
```

---

### Task 2: Pass storeType ke Show.jsx

**File:** `app/Http/Controllers/Admin/SaleController.php`

**Prompt:**
```
Pada file app/Http/Controllers/Admin/SaleController.php, method show() (line ~320),
TIDAK mengirim storeType ke Inertia view.

PERBAIKAN:
Tambahkan storeType ke Inertia::render di method show():

$storeId = session("current_store_id");
$store = \App\Models\Store::with("storeType")->find($storeId);
$storeType = $store?->getRelation("storeType")?->code ?? "retail";

Lalu tambahkan di return Inertia::render:
"storeType" => $storeType,

Pastikan tidak mengganggu data lain yang sudah ada (sale, paymentMethods, pgConfigs, can* flags).
```

---

### Task 3: Adapt Header/Labels di Show.jsx

**File:** `resources/js/Pages/Admin/Sales/Show.jsx`

**Prompt:**
```
Pada file resources/js/Pages/Admin/Sales/Show.jsx, 
header dan label bersifat generic untuk semua store type.

PERBAIKAN:
1. Terima prop storeType dari controller (setelah Task 2 selesai)
2. Buat PAGE_TITLE mapping:
const PAGE_TITLE = {
    retail: "Penjualan",
    fnb: "Transaksi",
    service: "Transaksi Jasa",
    rental: "Transaksi Sewa",
    ticket: "Penjualan Tiket",
    hospitality: "Transaksi Penginapan",
    parking: "Transaksi Parkir",
    session: "Transaksi Sesi",
};
const pageTitle = PAGE_TITLE[storeType] ?? "Penjualan";

3. Ubah header subtitle dari "Detail Penjualan" menjadi `Detail ${pageTitle}`
4. Ubah Head title dari `Penjualan ${sale.sale_no}` menjadi `${pageTitle} ${sale.sale_no}`
5. Ubah "Item Penjualan" menjadi `Item ${pageTitle}`
6. Ubah "Informasi Penjualan" menjadi `Informasi ${pageTitle}`
```

---

### Task 4: Tambah ExtraStatusBadge untuk Parking

**File:** `resources/js/Pages/Admin/Sales/Index.jsx`

**Prompt:**
```
Pada file resources/js/Pages/Admin/Sales/Index.jsx,
komponen ExtraStatusBadge (line ~80) TIDAK punya handler untuk parking.

PERBAIKAN:
Tambahkan case untuk parking di ExtraStatusBadge:

if (storeType === "parking" && (sale.exit_at || sale.entry_at)) {
    const map = {
        active: "bg-blue-100 text-blue-700",
        exited: "bg-emerald-100 text-emerald-700",
    };
    const label = {
        active: "🟢 Di Parkir",
        exited: "✅ Keluar",
    };
    const status = sale.exit_at ? "exited" : "active";
    return (
        <span className={`inline-flex rounded-lg px-2 py-0.5 text-xs font-medium ${map[status]}`}>
            {label[status]}
        </span>
    );
}

Lalu tambahkan "parking" ke array store type yang menampilkan kolom "Status Ops":
{["rental", "service", "session", "hospitality", "parking"].includes(storeType) && (
    <th ...>Status Ops</th>
)}

Lakukan perubahan yang sama di desktop table header, desktop table body, dan mobile cards.
```

---

### Task 5: Tambah Extra Column untuk Ticket

**File:** `resources/js/Pages/Admin/Sales/Index.jsx`

**Prompt:**
```
Pada file resources/js/Pages/Admin/Sales/Index.jsx,
EXTRA_COL (line ~54) TIDAK punya entry untuk ticket.

PERBAIKAN:
Tambahkan entry untuk ticket di EXTRA_COL. Ticket bisa menampilkan info booking/event:

ticket: {
    header: "No. Booking",
    render: (s) => s.booking?.booking_no ?? s.extra_data?.booking_no ?? "-",
},

Atau jika tidak ada data booking, gunakan info dari extra_data:
ticket: {
    header: "Info",
    render: (s) => s.extra_data?.event_name ?? s.extra_data?.schedule ?? "-",
},

Pilih salah satu approach tergantung data yang tersedia di Sale model untuk ticket.
Jika tidak ada data spesifik yang bisa ditampilkan, skip task ini dan tandai sebagai "N/A - no data available".
```

---

### Task 6: Adapt Summary Card Labels

**File:** `resources/js/Pages/Admin/Sales/Index.jsx`

**Prompt:**
```
Pada file resources/js/Pages/Admin/Sales/Index.jsx,
Summary Card labels (line ~354) generic untuk semua store type.

PERBAIKAN (OPSIONAL — low priority):
Buat label mapping per store type:

const STATS_LABEL = {
    retail: { total: "Total Penjualan", completed: "Selesai", draft: "Draft", revenue: "Pendapatan" },
    fnb: { total: "Total Transaksi", completed: "Selesai", draft: "Draft", revenue: "Pendapatan" },
    service: { total: "Total Layanan", completed: "Selesai", draft: "Draft", revenue: "Pendapatan" },
    rental: { total: "Total Sewa", completed: "Dikembalikan", draft: "Aktif", revenue: "Pendapatan" },
    ticket: { total: "Total Tiket", completed: "Selesai", draft: "Draft", revenue: "Pendapatan" },
    hospitality: { total: "Total Menginap", completed: "Check-out", draft: "Check-in", revenue: "Pendapatan" },
    parking: { total: "Total Kendaraan", completed: "Keluar", draft: "Di Parkir", revenue: "Pendapatan" },
    session: { total: "Total Sesi", completed: "Selesai", draft: "Aktif", revenue: "Pendapatan" },
};

Ini OPSIONAL karena dampaknya kecil. Jika tidak dikerjakan, tandai sebagai "Skip - low priority".
```

---

### Task 7: Adapt Show.jsx Info Labels

**File:** `resources/js/Pages/Admin/Sales/Show.jsx`

**Prompt:**
```
Pada file resources/js/Pages/Admin/Sales/Show.jsx,
label "Tipe Pesanan" (line ~364) generic untuk semua store type.

PERBAIKAN (OPSIONAL — low priority):
Buat label mapping:

const ORDER_TYPE_LABEL = {
    retail: "Tipe Pesanan",
    fnb: "Tipe Pesanan",
    service: "Tipe Layanan",
    rental: "Tipe Sewa",
    ticket: "Tipe Tiket",
    hospitality: "Tipe Menginap",
    parking: "Tipe Parkir",
    session: "Tipe Sesi",
};

const orderTypeLabel = ORDER_TYPE_LABEL[storeType] ?? "Tipe Pesanan";

Lalu ganti <InfoRow label="Tipe Pesanan" ... /> menjadi <InfoRow label={orderTypeLabel} ... />

Ini OPSIONAL karena dampaknya kecil.
```

---

### Task 8: Pass storeType ke Create.jsx

**File:** `app/Http/Controllers/Admin/SaleController.php`

**Prompt:**
```
Pada file app/Http/Controllers/Admin/SaleController.php, method create() (line ~110),
TIDAK mengirim storeType ke Inertia view.

PERBAIKAN:
Tambahkan storeType:

$store = \App\Models\Store::with("storeType")->find($storeId);
$storeType = $store?->getRelation("storeType")?->code ?? "retail";

Lalu tambahkan di return Inertia::render:
"storeType" => $storeType,
```

---

### Task 9: Adapt Create.jsx Order Type Options

**File:** `resources/js/Pages/Admin/Sales/Create.jsx`

**Prompt:**
```
Pada file resources/js/Pages/Admin/Sales/Create.jsx,
order type options mungkin tidak terfilter berdasarkan store type.

PERBAIKAN:
1. Terima prop storeType dari controller (setelah Task 8 selesai)
2. Import ORDER_TYPE_OPTIONS dari Index.jsx atau buat mapping yang sama
3. Filter order type options berdasarkan storeType:

const ORDER_TYPE_OPTIONS = {
    retail: [
        { v: "takeaway", l: "Ambil" },
        { v: "delivery", l: "Antar" },
        { v: "wholesale", l: "Grosir" },
    ],
    fnb: [
        { v: "dine_in", l: "Dine-in" },
        { v: "takeaway", l: "Takeaway" },
        { v: "delivery", l: "Delivery" },
    ],
    // ... (sama seperti di Index.jsx)
};

const orderTypeOptions = ORDER_TYPE_OPTIONS[storeType] ?? ORDER_TYPE_OPTIONS.retail;

Lalu gunakan orderTypeOptions untuk render dropdown order type di form Create.
```

---

### Task 10: Jalankan Pint & Verify

**Prompt:**
```
Setelah semua perubahan selesai:
1. Jalankan: vendor/bin/pint --dirty --format agent
2. Jalankan: npm run build
3. Buka halaman Sales Index dan Show untuk setiap store type
4. Pastikan:
   - Index: Extra column, Status Ops, Order Type filter sesuai per type
   - Show: OrderTypeBadge benar, header label sesuai, Info Panel sesuai
   - Create: Order type options sesuai per store type
```

---

## EXPECTED RESULT MATRIX

### Index Page

| Element | retail | fnb | service | rental | ticket | hospitality | parking | session |
|---------|:------:|:---:|:-------:|:------:|:------:|:-----------:|:-------:|:-------:|
| Page Title | Penjualan | Transaksi | Transaksi Jasa | Transaksi Sewa | Penjualan Tiket | Transaksi Penginapan | Transaksi Parkir | Transaksi Sesi |
| Extra Column | ❌ | Meja | ❌ | Tgl Kembali | No. Booking | Check-out | Plat Nomor | Unit/Sesi |
| Status Ops | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| Extra Status | ❌ | ❌ | waiting/progress/done | active/returned/overdue | ❌ | check-in/out | active/exited | running/ended |
| Order Type Filter | Ambil/Antar/Grosir | Dine-in/Takeaway/Delivery | Walk-in/Booking/Jemput-Antar | Per Jam/Hari/Minggu | Online/Walk-in/Group | Check-in/Reservasi/Short Stay | Masuk/Keluar/Tiket Hilang | Postpaid/Prepaid/Booking |

### Show Page

| Element | retail | fnb | service | rental | ticket | hospitality | parking | session |
|---------|:------:|:---:|:-------:|:------:|:------:|:-----------:|:-------:|:-------:|
| Header | Detail Penjualan | Detail Transaksi | Detail Transaksi Jasa | Detail Transaksi Sewa | Detail Penjualan Tiket | Detail Transaksi Penginapan | Detail Transaksi Parkir | Detail Transaksi Sesi |
| Info Panel | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Service Status | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Rental Status | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Hospitality Info | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Parking Info | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Session Info | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| OrderTypeBadge | Semua types | Semua types | Semua types | Semua types | Semua types | Semua types | Semua types | Semua types |

---

## NOTES
- Task 6 & 7 bersifat OPSIONAL (low priority) — bisa skip jika mau fokus yang penting dulu
- Task 5 (ticket extra column) tergantung data yang tersedia di Sale model — jika tidak ada data, skip
- Show.jsx sudah punya logic yang benar untuk service/rental/hospitality/parking/session panels — yang perlu fix hanya OrderTypeBadge dan labels
- Jika ada perubahan di Controller, pastikan tidak mengganggu logic yang sudah ada (canUpdateServiceStatus, canUpdateRentalStatus, dll)
- Selalu jalankan `vendor/bin/pint --dirty --format agent` setelah edit PHP
- Selalu jalankan `npm run build` setelah edit JSX
