# 🏗️ PLANNING — CRUD Branch Developer

## Overview
Modul CRUD Cabang (Branch) untuk Developer panel. Developer bisa mengelola cabang dari semua toko tanpa batasan store/branch middleware.

---

## Task 1: Routes (`routes/web.php`)

**File:** `routes/web.php`

Hapus semua route branch lama, ganti dengan 1 resource route:

```php
Route::resource("branches", \App\Http\Controllers\Developer\BranchController::class)
    ->names("branches");
```

Route names yang dihasilkan:
| Method | URI | Name | Controller Method |
|--------|-----|------|-------------------|
| GET | `/developer/branches` | `developer.branches.index` | `index()` |
| GET | `/developer/branches/create` | `developer.branches.create` | `create()` |
| POST | `/developer/branches` | `developer.branches.store` | `store()` |
| GET | `/developer/branches/{branch}` | `developer.branches.show` | `show()` |
| GET | `/developer/branches/{branch}/edit` | `developer.branches.edit` | `edit()` |
| PUT | `/developer/branches/{branch}` | `developer.branches.update` | `update()` |
| DELETE | `/developer/branches/{branch}` | `developer.branches.destroy` | `destroy()` |

**Status:** ✅ Sudah selesai

---

## Task 2: Controller (`app/Http/Controllers/Developer/BranchController.php`)

**File:** `app/Http/Controllers/Developer/BranchController.php`

Buat ulang dari 0. Struktur:

### 2.1 `index()`
- Query `Branch::with("store")->withCount("employees", "sales", "purchases")`
- Return array flat: `id, code, name, address, phone, is_active, employees_count, sales_count, purchases_count`
- `store` → nested object `{ id, code, name }`
- Juga return `stores` (list semua toko untuk filter dropdown)
- Render `Developer/Branches/Index`

### 2.2 `create()`
- Return list `stores` untuk dropdown
- Render `Developer/Branches/Create`

### 2.3 `store(Request $request)`
- Validate: `store_id` (required), `code`, `name`, `phone`, `address`, `is_active`
- Unique code per store (manual check)
- Create branch
- Redirect ke `developer.branches.index` with success

### 2.4 `show(Branch $branch)`
- Load `store`, `employees.user`
- Return branch, store, employees
- Render `Developer/Branches/Show`

### 2.5 `edit(Branch $branch)`
- Return branch data + list stores
- Render `Developer/Branches/Edit`

### 2.6 `update(Request $request, Branch $branch)`
- Validate same as store
- Unique code per store (ignore self)
- Update branch
- Redirect ke `developer.branches.index` with success

### 2.7 `destroy(Branch $branch)`
- Check if branch has employees/sales/purchases
- If used → return error
- Delete branch
- Redirect ke `developer.branches.index` with success

**Status:** ✅ Sudah selesai

---

## Task 3: View — Index (`resources/js/Pages/Developer/Branches/Index.jsx`)

**Props dari controller:** `{ branches, stores }`

### Layout:
```
┌─────────────────────────────────────────────┐
│ Header: "Cabang (count)"    [+ Tambah] btn  │
├─────────────────────────────────────────────┤
│ Flash success/error                          │
├─────────────────────────────────────────────┤
│ Search input                                 │
├─────────────────────────────────────────────┤
│ Table:                                       │
│  # | Cabang | Toko | Status | Aksi          │
│  1 | Name   | Toko | Aktif  | Detail Edit Hapus │
│  2 | ...    | ...  | ...    | ...           │
└─────────────────────────────────────────────┘
```

### Fitur:
- [x] Search by name, code, store name
- [x] Link ke create, show, edit
- [x] Delete dengan confirm + router.delete
- [x] Flash messages
- [x] Empty state

**Status:** ✅ Sudah selesai

---

## Task 4: View — BranchForm (`resources/js/Pages/Developer/Branches/BranchForm.jsx`)

**Props:** `{ data, setData, errors, processing, onSubmit, submitLabel, cancelHref }`

### Fields:
- Code (text, uppercase auto)
- Name (text)
- Phone (text)
- Address (textarea)
- Is Active (toggle switch)
- Submit + Cancel buttons

**Status:** ✅ Sudah selesai

---

## Task 5: View — Create (`resources/js/Pages/Developer/Branches/Create.jsx`)

**Props dari controller:** `{ stores }`

### Layout:
```
┌─────────────────────────────────────────────┐
│ Header: ← Kembali | "Tambah Cabang"         │
├─────────────────────────────────────────────┤
│ Card:                                        │
│  Store dropdown (required)                   │
│  BranchForm (code, name, phone, addr, active)│
└─────────────────────────────────────────────┘
```

### Flow:
1. User pilih toko dari dropdown
2. Isi form cabang
3. Submit → POST ke `developer.branches.store`
4. Redirect ke index

**Status:** ✅ Sudah selesai

---

## Task 6: View — Edit (`resources/js/Pages/Developer/Branches/Edit.jsx`)

**Props dari controller:** `{ branch, store, stores }`

### Layout:
```
┌─────────────────────────────────────────────┐
│ Header: ← Kembali | "Edit Cabang"           │
├─────────────────────────────────────────────┤
│ Card:                                        │
│  Store dropdown                              │
│  BranchForm (pre-filled)                     │
└─────────────────────────────────────────────┘
```

### Flow:
1. Form pre-filled dengan data branch
2. User bisa pindah toko via dropdown
3. Submit → PUT ke `developer.branches.update`
4. Redirect ke index

**Status:** ✅ Sudah selesai

---

## Task 7: View — Show (`resources/js/Pages/Developer/Branches/Show.jsx`)

**Props dari controller:** `{ branch, store, employees }`

### Layout:
```
┌─────────────────────────────────────────────┐
│ Header: "Branch Name" | [Edit] btn          │
├─────────────────────────────────────────────┤
│ Flash success                                │
├─────────────────────────────────────────────┤
│ Info Card:                                   │
│  Icon | Name | Code | Status                 │
│  📞 phone                                    │
│  📍 address                                  │
├─────────────────────────────────────────────┤
│ Employees Table:                             │
│  Nama | Posisi | Akun | Status               │
│  ...                                         │
├─────────────────────────────────────────────┤
│ [← Kembali] btn                              │
└─────────────────────────────────────────────┘
```

**Status:** ✅ Sudah selesai

---

## Task 8: Sync Fix (`resources/js/Services/sync.js`)

**File:** `resources/js/Services/sync.js`

Developer pages (`/developer/*`) tidak punya store/branch session. `syncAll()` yang fetch `/app/master-data` akan 403.

**Fix:** Skip sync jika path startsWith `/developer`.

**Status:** ✅ Sudah selesai

---

## Task 9: Verification

- [ ] Buka `/developer/branches` → table tampil
- [ ] Search berfungsi
- [ ] Klik "+ Tambah" → form create tampil
- [ ] Pilih toko, isi form, submit → redirect ke index, data muncul
- [ ] Klik "Detail" → halaman show tampil dengan info + karyawan
- [ ] Klik "Edit" → form edit pre-filled, ubah data, submit → data berubah
- [ ] Klik "Hapus" → confirm dialog → data terhapus
- [ ] Tidak ada error 403 di console
- [ ] Flash messages tampil (success/error)

---

## File Summary

| # | File | Status |
|---|------|--------|
| 1 | `routes/web.php` | ✅ Done |
| 2 | `app/Http/Controllers/Developer/BranchController.php` | ✅ Done |
| 3 | `resources/js/Pages/Developer/Branches/Index.jsx` | ✅ Done |
| 4 | `resources/js/Pages/Developer/Branches/BranchForm.jsx` | ✅ Done |
| 5 | `resources/js/Pages/Developer/Branches/Create.jsx` | ✅ Done |
| 6 | `resources/js/Pages/Developer/Branches/Edit.jsx` | ✅ Done |
| 7 | `resources/js/Pages/Developer/Branches/Show.jsx` | ✅ Done |
| 8 | `resources/js/Services/sync.js` | ✅ Done |
| 9 | Verification | ⬜ Pending user test |
