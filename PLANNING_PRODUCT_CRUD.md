# PLANNING: Product CRUD - Store Type Visibility Fix

## Objective
Memperbaiki visibilitas field/kolom pada Product CRUD agar sesuai dengan masing-masing store type.

---

## Checklist

| # | Task | File | Status | Verified |
|---|------|------|--------|----------|
| 1 | Hide Multi-Satuan section untuk non-inventory store | `Create.jsx`, `Edit.jsx` | ✅ | ✅ |
| 2 | Hide Supplier field berdasarkan feature flag | `Create.jsx`, `Edit.jsx` | ✅ | ✅ |
| 3 | Tambah Capacity field untuk hospitality | `Create.jsx`, `Edit.jsx`, `Index.jsx` | ✅ | ✅ |
| 4 | Tambah kolom valid_duration di Index untuk ticket | `Index.jsx` | ✅ | ✅ |
| 5 | Tambah kolom Deposit untuk hospitality/parking/session | `Index.jsx` | ✅ | ✅ |
| 6 | Jalankan Pint & verify | Terminal | ✅ | ✅ |

---

## PROMPT PER TASK

### Task 1: Hide Multi-Satuan Section

**File:** `resources/js/Pages/Admin/Products/Create.jsx` & `Edit.jsx`

**Prompt:**
```
Pada file resources/js/Pages/Admin/Products/Create.jsx dan Edit.jsx, 
section "Multi-Satuan" (packaging_units) saat ini tampil di semua store type.

PERBAIKAN:
- Section Multi-Satuan HANYA boleh tampil untuk store type: retail, fnb, rental
- Untuk store type: service, ticket, hospitality, parking, session → HIDE section ini

CARA:
Tambahkan kondisi pengecekan sebelum render section Multi-Satuan:

{["retail", "fnb", "rental"].includes(storeType) && (
    <SectionCard title="Multi-Satuan" ...>
        ...
    </SectionCard>
)}

JANGAN hapus code-nya, cukup bungkus dengan kondisi di atas.
```

---

### Task 2: Hide Supplier Field

**File:** `resources/js/Pages/Admin/Products/Create.jsx` & `Edit.jsx`

**Prompt:**
```
Pada file resources/js/Pages/Admin/Products/Create.jsx dan Edit.jsx,
field "Supplier" saat ini tampil di semua store type.

PERBAIKAN:
- Field Supplier HANYA boleh tampil jika store punya feature "supplier"
- Feature supplier aktif di store type: retail, fnb, rental
- Cek menggunakan: has("supplier") atau storeTypeFeatures.includes("supplier")

CARA:
Bungkus field Supplier dengan kondisi:

{has("supplier") && (
    <Field label="Supplier" ...>
        <select ...>
            ...
        </select>
    </Field>
)}

Pastikan variabel has() sudah ada (biasanya dari: const has = (f) => storeTypeFeatures.includes(f))
```

---

### Task 3: Tambah Capacity untuk Hospitality

**File:** `resources/js/Pages/Admin/Products/Create.jsx` & `Edit.jsx` & `Index.jsx`

**Prompt:**
```
PERBAIKAN 3A - Create.jsx & Edit.jsx:
Field "Capacity" (kapasitas) saat ini hanya tampil untuk store type "ticket".
Tambahkan juga untuk store type "hospitality" (kapasitas kamar/ruangan).

Ubah kondisi dari:
{storeType === "ticket" && ( ... )}

Menjadi:
{["ticket", "hospitality"].includes(storeType) && ( ... )}

Lakukan di SEMUA lokasi yang menampilkan field capacity.

---

PERBAIKAN 3B - Index.jsx:
Kolom "Kapasitas" di tabel Index juga harus tampil untuk hospitality.
Saat ini showCapacity = storeType === "ticket"

Ubah menjadi:
const showCapacity = ["ticket", "hospitality"].includes(storeType);
```

---

### Task 4: Tambah Kolom Durasi di Index untuk Ticket

**File:** `resources/js/Pages/Admin/Products/Index.jsx`

**Prompt:**
```
Pada file resources/js/Pages/Admin/Products/Index.jsx,
kolom "Durasi" saat ini hanya tampil untuk store type "session" dan "parking".

PERBAIKAN:
Tambahkan "ticket" ke daftar store type yang menampilkan kolom durasi.
Ticket punya field valid_duration_minutes (durasi berlaku tiket).

Ubah dari:
const showDuration = ["session", "parking"].includes(storeType);

Menjadi:
const showDuration = ["session", "parking", "ticket"].includes(storeType);

Lalu sesuaikan render cell durasi agar menggunakan field yang benar:
- Untuk session/parking → gunakan session_duration_minutes
- Untuk ticket → gunakan valid_duration_minutes

Contoh render:
<td ...>
    {storeType === "ticket" ? (
        product.valid_duration_minutes
            ? `${product.valid_duration_minutes} mnt`
            : <span className="text-slate-300">—</span>
    ) : product.session_duration_minutes === 0 ? (
        <span className="text-xs text-emerald-600 font-medium">Unlimited</span>
    ) : product.session_duration_minutes ? (
        `${product.session_duration_minutes} mnt`
    ) : (
        <span className="text-slate-300">—</span>
    )}
</td>
```

---

### Task 5: Tambah Kolom Deposit untuk Hospitality/Parking/Session

**File:** `resources/js/Pages/Admin/Products/Index.jsx`

**Prompt:**
```
Pada file resources/js/Pages/Admin/Products/Index.jsx,
kolom "Deposit" saat ini hanya tampil untuk store type "rental".

PERBAIKAN:
Deposit juga relevan untuk: hospitality, parking, session (cek feature "deposit").

Ubah dari:
const showDeposit = storeType === "rental";

Menjadi:
const showDeposit = ["rental", "hospitality", "parking", "session"].includes(storeType);

Atau lebih baik menggunakan feature flag:
const showDeposit = has("deposit");

Karena feature "deposit" aktif di: service, rental, hospitality, parking, session.
Tapi untuk "service", deposit kurang relevan di index table.
Jadi gunakan:
const showDeposit = ["rental", "hospitality", "parking", "session"].includes(storeType);
```

---

### Task 6: Jalankan Pint & Verify

**Prompt:**
```
Setelah semua perubahan selesai:
1. Jalankan: vendor/bin/pint --dirty --format agent
2. Jalankan: npm run build
3. Buka halaman Product Index dan Create untuk setiap store type
4. Pastikan:
   - retail: Multi-Satuan ✅, Supplier ✅, Stok ✅, Margin ✅
   - fnb: Multi-Satuan ✅, Supplier ✅, Stok ✅, Prep Time ✅
   - service: Multi-Satuan ❌, Supplier ❌, Stok ❌
   - rental: Multi-Satuan ✅, Supplier ✅, Stok ✅, Deposit ✅
   - ticket: Multi-Satuan ❌, Capacity ✅, Durasi ✅
   - hospitality: Multi-Satuan ❌, Capacity ✅, Max Tamu ✅, Deposit ✅
   - parking: Multi-Satuan ❌, Durasi ✅, Deposit ✅
   - session: Multi-Satuan ❌, Durasi ✅, Deposit ✅
```

---

## EXPECTED RESULT SUMMARY

| Store Type | Multi-Satuan | Supplier | Capacity | Durasi | Deposit | Stok | Margin | Prep |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| retail | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| fnb | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| service | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| rental | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ |
| ticket | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| hospitality | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| parking | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| session | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |

---

## NOTES
- Edit.jsx mengikuti pola yang sama dengan Create.jsx
- Jika ada perubahan di Create.jsx, pastikan Edit.jsx juga konsisten
- Selalu jalankan `vendor/bin/pint --dirty --format agent` setelah edit PHP
- Selalu jalankan `npm run build` setelah edit JSX
