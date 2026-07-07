# 📚 DOKUMENTASI LENGKAP RELASI DATABASE SISTEM POS

## 🎯 Overview
Sistem ini menggunakan **100% relasi database** untuk menentukan fitur, akses, dan konfigurasi toko. 
Tidak ada lagi ketergantungan pada JSON atau hardcoded values.

**Prinsip Utama:**
- ✅ Semua data fitur ada di tabel `features` dan `feature_details`
- ✅ Store Type menentukan fitur mana yang relevan
- ✅ Plan menentukan limitasi akses fitur
- ✅ Store = intersection dari Store Type features + Plan features
- ✅ Employee terhubung ke Store dan Branch
- ✅ User terhubung ke Store via pivot table

---

## 🗺️ ERD - Entity Relationship Diagram

```
┌─────────────┐
│  features   │ ← Master list semua fitur sistem
├─────────────┤
│ id          │
│ code        │ (kitchen, stock, queue, dll)
│ label       │
│ description │
│ category    │ (pos, inventory, crm, finance, system)
│ is_active   │
│ sort_order  │
└─────────────┘
       │
       │ 1:N
       ▼
┌──────────────────┐
│ feature_details  │ ← Detail tambahan per fitur
├──────────────────┤
│ id               │
│ feature_id       │
│ code             │
│ label            │
│ description      │
│ sort_order       │
│ is_active        │
└──────────────────┘

        ┌──────────────────────────┐
        │                          │
        ▼                          ▼
┌─────────────────┐      ┌─────────────────┐
│ store_types     │      │     plans       │
├─────────────────┤      ├─────────────────┤
│ id              │      │ id              │
│ code            │      │ code            │
│ label           │      │ label           │
│ icon            │      │ description     │
│ description     │      │ max_users       │
│ order_types     │      │ max_branches    │
│ pos_behavior    │      │ price           │
│ is_active       │      │ trial_days      │
│ sort_order      │      │ is_active       │
└─────────────────┘      │ sort_order      │
        │                └─────────────────┘
        │ M:N                     │ M:N
        │ (store_type_feature)    │ (plan_feature)
        │                         │
        └────────┬────────────────┘
                 │
                 │ N:1
                 ▼
         ┌──────────────────┐
         │     stores       │ ← Toko/Tenant
         ├──────────────────┤
         │ id               │
         │ user_id          │ (owner utama, nullable)
         │ code             │
         │ name             │
         │ store_type_id    │ ← FK ke store_types
         │ logo             │
         │ currency         │
         │ decimal_places   │
         │ timezone         │
         │ tax_inclusive    │
         │ default_tax_rate │
         │ receipt_header   │
         │ receipt_footer   │
         │ phone            │
         │ email            │
         │ address          │
         │ is_active        │
         │ plan_id          │ ← FK ke plans
         │ plan_expires_at  │
         │ max_users        │ (override, nullable)
         │ max_branches     │ (override, nullable)
         └──────────────────┘
                │
                │ 1:N
                ▼
         ┌──────────────────┐
         │    branches      │ ← Cabang toko
         ├──────────────────┤
         │ id               │
         │ store_id         │ ← FK ke stores
         │ code             │
         │ name             │
         │ phone            │
         │ address          │
         │ is_active        │
         └──────────────────┘
                │
                │ 1:N
                ▼
         ┌──────────────────┐
         │   employees      │ ← Karyawan
         ├──────────────────┤
         │ id               │
         │ store_id         │ ← FK ke stores
         │ branch_id        │ ← FK ke branches
         │ user_id          │ ← FK ke users (nullable)
         │ employee_code    │
         │ name             │
         │ phone            │
         │ email            │
         │ position         │
         │ commission_type  │
         │ commission_value │
         │ status           │
         └──────────────────┘

┌──────────────────┐         ┌──────────────────┐
│     users        │ ◄─ M:N ─│   user_store     │ ── Pivot table
├──────────────────┤         ├──────────────────┤
│ id               │         │ user_id          │
│ name             │         │ store_id         │
│ email            │         └──────────────────┘
│ role             │
│ is_developer     │
└──────────────────┘
```

---

## 📋 TABEL 1: features (Master Fitur)

**Deskripsi:** Tabel master yang menyimpan semua fitur yang tersedia di sistem.

### Struktur:
| Column      | Type         | Deskripsi                          |
|-------------|--------------|-----------------------------------|
| id          | bigint(20)   | Primary key                        |
| code        | varchar(50)  | Kode unik fitur (kitchen, stock)   |
| label       | varchar(255) | Label untuk tampilan               |
| description | text         | Deskripsi fitur                    |
| category    | varchar(50)  | Kategori: pos, inventory, crm, dll |
| is_active   | tinyint(1)   | Status aktif                       |
| sort_order  | int(11)      | Urutan tampilan                    |

### Contoh Data:
```sql
INSERT INTO features VALUES
(1, 'kitchen', 'Kitchen Display', 'Layar dapur untuk pesanan', 'pos', 1, 10),
(2, 'stock', 'Manajemen Stok', 'Kelola stok barang', 'inventory', 1, 20),
(3, 'queue', 'Sistem Antrian', 'Antrian pelanggan', 'crm', 1, 30);
```

### Relasi:
- **1:N** dengan `feature_details`
- **M:N** dengan `store_types` via `store_type_feature`
- **M:N** dengan `plans` via `plan_feature`

### Cara Pakai di Code:
```php
// Ambil semua fitur aktif
$features = Feature::where('is_active', true)
    ->orderBy('sort_order')
    ->get();

// Ambil fitur berdasarkan kategori
$posFeatures = Feature::where('category', 'pos')
    ->where('is_active', true)
    ->get();
```

---

## 📋 TABEL 2: feature_details (Detail Fitur)

**Deskripsi:** Detail tambahan untuk konfigurasi fitur tertentu.

### Struktur:
| Column      | Type         | Deskripsi                    |
|-------------|--------------|------------------------------|
| id          | bigint(20)   | Primary key                  |
| feature_id  | bigint(20)   | FK ke features               |
| code        | varchar(50)  | Kode detail                  |
| label       | varchar(255) | Label detail                 |
| description | text         | Deskripsi detail             |
| sort_order  | int(11)      | Urutan                       |
| is_active   | tinyint(1)   | Status aktif                 |

### Contoh Use Case:
```sql
-- Feature: kitchen (id=1)
-- Detail: screen_layout
INSERT INTO feature_details VALUES
(1, 1, 'screen_layout', 'Layout Layar', 'Konfigurasi tampilan layar dapur', 1, 1),
(2, 1, 'auto_accept', 'Auto Accept Order', 'Otomatis terima pesanan', 2, 1);
```

### Cara Pakai di Code:
```php
// Ambil detail dari fitur kitchen
$kitchenFeature = Feature::where('code', 'kitchen')->first();
$details = $kitchenFeature->details()
    ->where('is_active', true)
    ->orderBy('sort_order')
    ->get();
```

---

## 📋 TABEL 3: store_types (Tipe Toko)

**Deskripsi:** Jenis-jenis toko (Retail, FnB, Service, dll) yang menentukan fitur relevan.

### Struktur:
| Column        | Type         | Deskripsi                         |
|---------------|--------------|-----------------------------------|
| id            | bigint(20)   | Primary key                       |
| code          | varchar(30)  | Kode: retail, fnb, service, dll   |
| label         | varchar(255) | Label tampilan                    |
| icon          | varchar(10)  | Emoji icon                        |
| description   | text         | Deskripsi tipe toko               |
| order_types   | json         | Jenis order yang didukung         |
| pos_behavior  | varchar(30)  | Behavior POS                      |
| is_active     | tinyint(1)   | Status aktif                      |
| sort_order    | int(11)      | Urutan tampilan                   |

### Contoh Data:
```sql
INSERT INTO store_types VALUES
(1, 'retail', 'Retail', '🏪', 'Toko, minimarket, grosir', 
 '[{"v":"takeaway","l":"Ambil"},{"v":"delivery","l":"Antar"}]', 
 'retail', 1, 1),
(2, 'fnb', 'FnB / Cafe', '☕', 'Restoran, cafe, warung',
 '[{"v":"dine_in","l":"Dine In"},{"v":"takeaway","l":"Takeaway"}]',
 'fnb', 1, 2);
```

### Relasi:
- **1:N** dengan `stores`
- **M:N** dengan `features` via `store_type_feature`

### Cara Pakai di Code:
```php
// Ambil store type dengan features-nya
$storeType = StoreType::with('features')
    ->where('code', 'fnb')
    ->first();

// Cek apakah store type punya fitur tertentu
$hasKitchen = $storeType->features()
    ->where('features.code', 'kitchen')
    ->exists(); // true untuk FnB
```

---

## 📋 TABEL 4: plans (Paket Langganan)

**Deskripsi:** Paket langganan yang menentukan limitasi dan fitur yang boleh diakses.

### Struktur:
| Column       | Type           | Deskripsi                  |
|--------------|----------------|----------------------------|
| id           | bigint(20)     | Primary key                |
| code         | varchar(30)    | Kode: free, basic, pro     |
| label        | varchar(255)   | Label tampilan             |
| description  | text           | Deskripsi paket            |
| max_users    | int(11)        | Maks jumlah user           |
| max_branches | int(11)        | Maks jumlah cabang         |
| price        | decimal(15,2)  | Harga per bulan            |
| trial_days   | int(11)        | Hari trial                 |
| is_active    | tinyint(1)     | Status aktif               |
| sort_order   | int(11)        | Urutan tampilan            |

### Contoh Data:
```sql
INSERT INTO plans VALUES
(1, 'free', 'Free', 'Paket gratis', 1, 1, 0, 0, 1, 1),
(2, 'basic', 'Basic', 'Paket dasar', 5, 3, 99000, 7, 1, 2),
(3, 'pro', 'Pro', 'Paket profesional', 999, 999, 299000, 14, 1, 3);
```

### Relasi:
- **1:N** dengan `stores`
- **M:N** dengan `features` via `plan_feature`

### Cara Pakai di Code:
```php
// Ambil plan dengan features-nya
$plan = Plan::with('features')->where('code', 'basic')->first();

// Cek fitur yang diizinkan plan
$featureCodes = $plan->featureCodes(); // ['stock', 'purchase', 'kitchen', ...]

// Cek apakah plan mengizinkan fitur tertentu
$allowsKitchen = $plan->features()
    ->where('features.code', 'kitchen')
    ->exists();
```

---

## 📋 TABEL 5: store_type_feature (Pivot)

**Deskripsi:** Tabel pivot yang menghubungkan store_types dengan features.

### Struktur:
| Column        | Type       | Deskripsi          |
|---------------|------------|--------------------|
| id            | bigint(20) | Primary key        |
| store_type_id | bigint(20) | FK ke store_types  |
| feature_id    | bigint(20) | FK ke features     |

### Contoh Data:
```sql
-- FnB (id=2) punya fitur kitchen (id=1), stock (id=2), queue (id=3)
INSERT INTO store_type_feature VALUES
(1, 2, 1),  -- FnB → kitchen
(2, 2, 2),  -- FnB → stock
(3, 1, 2);  -- Retail → stock (tapi tidak ada kitchen)
```

### Cara Pakai di Code:
```php
// Cek fitur yang dimiliki store type FnB
$fnbType = StoreType::where('code', 'fnb')->first();
$fnbFeatures = $fnbType->features; // Collection of Feature models

// Attach fitur baru ke store type
$fnbType->features()->attach($featureId);

// Detach fitur
$fnbType->features()->detach($featureId);

// Sync semua fitur (replace existing)
$fnbType->features()->sync([1, 2, 3]);
```

---

## 📋 TABEL 6: plan_feature (Pivot)

**Deskripsi:** Tabel pivot yang menghubungkan plans dengan features.

### Struktur:
| Column     | Type       | Deskripsi       |
|------------|------------|-----------------|
| id         | bigint(20) | Primary key     |
| plan_id    | bigint(20) | FK ke plans     |
| feature_id | bigint(20) | FK ke features  |

### Contoh Data:
```sql
-- Plan Basic (id=2) punya fitur stock (id=2), kitchen (id=1)
-- Plan Free (id=1) hanya punya stock (id=2)
INSERT INTO plan_feature VALUES
(1, 1, 2),  -- Free → stock
(2, 2, 1),  -- Basic → kitchen
(3, 2, 2),  -- Basic → stock
(4, 3, 1),  -- Pro → kitchen
(5, 3, 2);  -- Pro → stock
```

### Cara Pakai di Code:
```php
// Cek fitur yang diizinkan plan Basic
$basicPlan = Plan::where('code', 'basic')->first();
$basicFeatures = $basicPlan->features; // Collection of Feature models

// Attach fitur baru ke plan
$basicPlan->features()->attach($featureId);

// Detach fitur
$basicPlan->features()->detach($featureId);

// Sync semua fitur (replace existing)
$basicPlan->features()->sync([1, 2, 3, 4]);
```

---

## 📋 TABEL 7: stores (Toko/Tenant)

**Deskripsi:** Tabel utama untuk data toko/tenant. Setiap toko punya store_type dan plan.

### Struktur:
| Column           | Type            | Deskripsi                           |
|------------------|-----------------|-------------------------------------|
| id               | bigint(20)      | Primary key                         |
| user_id          | bigint(20)      | FK ke users (owner utama, nullable) |
| code             | varchar(50)     | Kode unik toko                      |
| name             | varchar(255)    | Nama toko                           |
| store_type_id    | bigint(20)      | FK ke store_types                   |
| logo             | varchar(255)    | Path logo                           |
| currency         | varchar(10)     | Mata uang (IDR, USD)                |
| decimal_places   | tinyint(3)      | Desimal harga                       |
| timezone         | varchar(50)     | Timezone                            |
| tax_inclusive    | tinyint(1)      | Pajak sudah termasuk?               |
| default_tax_rate | decimal(5,2)    | Persentase pajak default            |
| receipt_header   | text            | Header struk                        |
| receipt_footer   | text            | Footer struk                        |
| phone            | varchar(30)     | Telepon toko                        |
| email            | varchar(255)    | Email toko                          |
| address          | text            | Alamat toko                         |
| is_active        | tinyint(1)      | Status aktif                        |
| plan_id          | bigint(20)      | FK ke plans                         |
| plan_expires_at  | date            | Tanggal expired plan                |
| max_users        | smallint(5)     | Override maks user (nullable)       |
| max_branches     | smallint(5)     | Override maks cabang (nullable)     |

### Relasi:
- **N:1** dengan `store_types`
- **N:1** dengan `plans`
- **1:N** dengan `branches`
- **1:N** dengan `employees`
- **M:N** dengan `users` via `user_store`

### Cara Pakai di Code:
```php
// Ambil store dengan relasi lengkap
$store = Store::with(['storeType.features', 'planModel.features', 'branches', 'employees'])
    ->find($storeId);

// Cek fitur yang aktif di toko (intersection store_type + plan)
$hasKitchen = $store->hasFeature('kitchen');
// Returns true jika:
// 1. Store type punya feature kitchen
// 2. Plan mengizinkan feature kitchen

// Cek POS mode
$isFnb = $store->hasPosMode('fnb');
// Returns true jika store_type.code = 'fnb'

// Ambil config plan aktif
$planConfig = $store->activePlanConfig();
// Returns: ['label' => 'Basic', 'max_users' => 5, 'features' => [...]]

// Cek limit
$canAddUser = $store->canAddUser(); // Cek apakah bisa tambah user
$canAddBranch = $store->canAddBranch(); // Cek apakah bisa tambah cabang
```

---

## 📋 TABEL 8: branches (Cabang Toko)

**Deskripsi:** Cabang-cabang dari sebuah toko. Setiap toko bisa punya banyak cabang.

### Struktur:
| Column    | Type         | Deskripsi           |
|-----------|--------------|---------------------|
| id        | bigint(20)   | Primary key         |
| store_id  | bigint(20)   | FK ke stores        |
| code      | varchar(50)  | Kode unik cabang    |
| name      | varchar(255) | Nama cabang         |
| phone     | varchar(30)  | Telepon cabang      |
| address   | text         | Alamat cabang       |
| is_active | tinyint(1)   | Status aktif        |

### Relasi:
- **N:1** dengan `stores`
- **1:N** dengan `employees`
- **1:N** dengan `sales` (transaksi)
- **1:N** dengan `purchases` (pembelian)

### Cara Pakai di Code:
```php
// Ambil semua cabang dari toko
$branches = Branch::where('store_id', $storeId)
    ->where('is_active', true)
    ->orderBy('name')
    ->get();

// Ambil cabang dengan employee count
$branch = Branch::withCount('employees')
    ->find($branchId);

// Cek apakah store bisa tambah cabang baru
$store = Store::find($storeId);
if ($store->canAddBranch()) {
    // Buat cabang baru
    $branch = Branch::create([
        'store_id' => $storeId,
        'code' => 'CAB-02',
        'name' => 'Cabang Sudirman',
        'is_active' => true,
    ]);
}
```

---

## 📋 TABEL 9: employees (Karyawan)

**Deskripsi:** Data karyawan yang bekerja di toko dan cabang tertentu.

### Struktur:
| Column           | Type          | Deskripsi                       |
|------------------|---------------|---------------------------------|
| id               | bigint(20)    | Primary key                     |
| store_id         | bigint(20)    | FK ke stores                    |
| branch_id        | bigint(20)    | FK ke branches                  |
| user_id          | bigint(20)    | FK ke users (nullable)          |
| employee_code    | varchar(50)   | Kode karyawan                   |
| name             | varchar(255)  | Nama karyawan                   |
| phone            | varchar(20)   | Telepon                         |
| email            | varchar(255)  | Email                           |
| position         | varchar(100)  | Jabatan                         |
| commission_type  | varchar(20)   | Tipe komisi (percentage/fixed)  |
| commission_value | decimal(10,2) | Nilai komisi                    |
| status           | varchar(20)   | Status: active/inactive         |

### Relasi:
- **N:1** dengan `stores`
- **N:1** dengan `branches`
- **N:1** dengan `users` (nullable - tidak semua employee punya akun user)

### Cara Pakai di Code:
```php
// Ambil employee dengan relasi
$employee = Employee::with(['store', 'branch', 'user'])
    ->find($employeeId);

// Ambil employee dari branch tertentu
$employees = Employee::where('branch_id', $branchId)
    ->where('status', 'active')
    ->get();

// Cek apakah employee punya akun user
if ($employee->user) {
    echo "Employee ini punya akun: " . $employee->user->email;
} else {
    echo "Employee ini belum punya akun user";
}

// Buat employee baru
$employee = Employee::create([
    'store_id' => $storeId,
    'branch_id' => $branchId,
    'employee_code' => 'EMP-001',
    'name' => 'John Doe',
    'position' => 'Kasir',
    'status' => 'active',
]);
```

---

## 📋 TABEL 10: users (User/Akun Login)

**Deskripsi:** Akun user yang bisa login ke sistem. User bisa punya akses ke banyak toko.

### Struktur:
| Column              | Type         | Deskripsi                  |
|---------------------|--------------|----------------------------|
| id                  | bigint(20)   | Primary key                |
| name                | varchar(255) | Nama user                  |
| email               | varchar(255) | Email (unique)             |
| role                | varchar(20)  | Role global (deprecated)   |
| is_developer        | tinyint(1)   | Akses developer/super?     |
| email_verified_at   | timestamp    | Verifikasi email           |
| password            | varchar(255) | Hashed password            |
| remember_token      | varchar(100) | Token remember me          |

### Relasi:
- **M:N** dengan `stores` via `user_store` (satu user bisa akses banyak toko)
- **1:N** dengan `employees` (nullable - tidak semua user adalah employee)

### Cara Pakai di Code:
```php
// Ambil user dengan stores yang bisa diakses
$user = User::with('stores')->find($userId);

// Cek apakah user punya akses ke toko tertentu
$hasAccess = $user->stores()->where('stores.id', $storeId)->exists();

// Ambil semua toko yang bisa diakses user
$userStores = $user->stores; // Collection of Store models

// Assign user ke toko (buat jadi owner/staff)
$user->stores()->attach($storeId); // Tambah akses
$user->stores()->detach($storeId); // Cabut akses
$user->stores()->sync([$store1, $store2]); // Replace semua akses

// Cek apakah user adalah developer
if ($user->is_developer) {
    // User ini bisa akses semua toko dan fitur developer
}
```

---

## 📋 TABEL 11: user_store (Pivot User-Store)

**Deskripsi:** Tabel pivot yang menghubungkan users dengan stores (akses multi-toko).

### Struktur:
| Column   | Type       | Deskripsi      |
|----------|------------|----------------|
| user_id  | bigint(20) | FK ke users    |
| store_id | bigint(20) | FK ke stores   |

### Cara Pakai di Code:
```php
// Cek toko yang bisa diakses user
$userStores = DB::table('user_store')
    ->where('user_id', $userId)
    ->pluck('store_id');

// Atau pakai relasi
$userStores = User::find($userId)->stores;

// Cek user yang punya akses ke toko tertentu
$storeUsers = Store::find($storeId)->users;

// Tambah akses user ke toko
DB::table('user_store')->insert([
    'user_id' => $userId,
    'store_id' => $storeId,
]);

// Atau pakai relasi
$user->stores()->attach($storeId);
```

---

## 🔄 FLOW PENGECEKAN FITUR

### Alur Lengkap: "Apakah Toko Bisa Pakai Fitur Kitchen?"

```php
// 1. Load toko dengan relasi yang diperlukan
$store = Store::with(['storeType.features', 'planModel.features'])
    ->find($storeId);

// 2. Cek store type (FnB, Retail, dll)
$storeType = $store->getRelation('storeType');
// Output: StoreType { code: 'fnb', label: 'FnB / Cafe' }

// 3. Cek apakah store type punya fitur kitchen
$storeTypeHasKitchen = $storeType->features()
    ->where('features.code', 'kitchen')
    ->where('features.is_active', true)
    ->exists();
// Output: true (FnB punya kitchen) atau false (Retail tidak punya)

// 4. Cek plan (Free, Basic, Pro)
$plan = $store->getRelation('planModel');
// Output: Plan { code: 'basic', label: 'Basic' }

// 5. Cek apakah plan mengizinkan kitchen
$planAllowsKitchen = $plan->features()
    ->where('features.code', 'kitchen')
    ->where('features.is_active', true)
    ->exists();
// Output: true (Basic/Pro punya kitchen) atau false (Free tidak punya)

// 6. Hasil akhir (intersection)
$canUseKitchen = $storeTypeHasKitchen && $planAllowsKitchen;
// Returns: true hanya jika KEDUANYA true

// 7. Atau pakai helper method
$canUseKitchen = $store->hasFeature('kitchen');
// Shortcut yang melakukan pengecekan di atas
```

---

## 📊 CONTOH SKENARIO LENGKAP

### Skenario 1: Toko FnB dengan Plan Basic

```php
// Data:
// - Store: "Cafe Kita" (store_type: fnb, plan: basic)
// - Store Type FnB punya: kitchen, stock, table, modifier
// - Plan Basic punya: kitchen, stock, queue

// Cek fitur yang aktif
$store->hasFeature('kitchen');   // ✅ true  (ada di FnB & Basic)
$store->hasFeature('stock');     // ✅ true  (ada di FnB & Basic)
$store->hasFeature('table');     // ❌ false (ada di FnB, tapi Basic tidak punya)
$store->hasFeature('modifier');  // ❌ false (ada di FnB, tapi Basic tidak punya)
$store->hasFeature('queue');     // ❌ false (Basic punya, tapi FnB tidak punya)

// POS Mode
$store->hasPosMode('fnb');       // ✅ true
$store->hasPosMode('retail');    // ❌ false
```

### Skenario 2: Toko Retail dengan Plan Pro

```php
// Data:
// - Store: "Toko Maju" (store_type: retail, plan: pro)
// - Store Type Retail punya: stock, purchase, batch, expiry
// - Plan Pro punya: SEMUA FITUR (wildcard)

// Cek fitur yang aktif
$store->hasFeature('stock');     // ✅ true  (ada di Retail & Pro)
$store->hasFeature('purchase');  // ✅ true  (ada di Retail & Pro)
$store->hasFeature('kitchen');   // ❌ false (Pro punya, tapi Retail tidak support)
$store->hasFeature('table');     // ❌ false (Pro punya, tapi Retail tidak support)

// POS Mode
$store->hasPosMode('retail');    // ✅ true
$store->hasPosMode('fnb');       // ❌ false
```

### Skenario 3: Upgrade Plan dari Free ke Basic

```php
// Sebelum upgrade
$store->plan_id = 1; // Free
$store->hasFeature('kitchen');   // ❌ false (Free tidak punya kitchen)

// Upgrade plan
$store->update(['plan_id' => 2]); // Basic

// Setelah upgrade
$store->refresh(); // Reload dari database
$store = Store::with(['storeType.features', 'planModel.features'])
    ->find($store->id);

$store->hasFeature('kitchen');   // ✅ true (Basic punya kitchen)
```

---

## 🔍 CARA CEK YANG SALAH DAN BENAR

### ❌ SALAH - Pakai JSON modules (sudah dihapus)

```php
// ❌ JANGAN PAKAI INI LAGI
$features = $store->modules['features'] ?? [];
if (in_array('kitchen', $features)) {
    // ...
}

// ❌ Field modules sudah tidak ada
$store->modules; // null atau error
```

### ✅ BENAR - Pakai relasi database

```php
// ✅ Pakai helper method
if ($store->hasFeature('kitchen')) {
    // Kitchen tersedia
}

// ✅ Atau query relasi langsung
$hasKitchen = $store->storeType()
    ->first()
    ->features()
    ->where('features.code', 'kitchen')
    ->exists();

// ✅ Ambil semua fitur aktif
$store = Store::with(['storeType.features', 'planModel.features'])
    ->find($storeId);

$storeTypeFeatures = $store->getRelation('storeType')->features;
$planFeatures = $store->getRelation('planModel')->features;

// Intersection = fitur yang aktif
$activeFeatures = $storeTypeFeatures->filter(function($f) use ($planFeatures) {
    return $planFeatures->contains('code', $f->code);
});
```

---

## 🛠️ CARA MENGELOLA FITUR (Developer/Admin)

### Menambah Fitur Baru ke Sistem

```php
// 1. Insert fitur baru ke tabel features
$feature = Feature::create([
    'code' => 'loyalty_program',
    'label' => 'Program Loyalitas',
    'description' => 'Sistem poin dan reward pelanggan',
    'category' => 'crm',
    'is_active' => true,
    'sort_order' => 100,
]);

// 2. Assign ke store types yang relevan
$retailType = StoreType::where('code', 'retail')->first();
$fnbType = StoreType::where('code', 'fnb')->first();

$retailType->features()->attach($feature->id);
$fnbType->features()->attach($feature->id);

// 3. Assign ke plans yang relevan
$basicPlan = Plan::where('code', 'basic')->first();
$proPlan = Plan::where('code', 'pro')->first();

$basicPlan->features()->attach($feature->id);
$proPlan->features()->attach($feature->id);

// 4. Sekarang toko dengan Retail/FnB + Basic/Pro bisa pakai loyalty_program
```

### Mengubah Fitur Store Type

```php
// Ambil store type FnB
$fnbType = StoreType::where('code', 'fnb')->first();

// Lihat fitur yang sudah ada
$existingFeatures = $fnbType->features->pluck('code');
// ['kitchen', 'stock', 'table', 'modifier']

// Tambah fitur baru (queue)
$queueFeature = Feature::where('code', 'queue')->first();
$fnbType->features()->attach($queueFeature->id);

// Hapus fitur (modifier)
$modifierFeature = Feature::where('code', 'modifier')->first();
$fnbType->features()->detach($modifierFeature->id);

// Atau ganti semua sekaligus (sync)
$newFeatureIds = Feature::whereIn('code', ['kitchen', 'stock', 'table', 'queue'])
    ->pluck('id');
$fnbType->features()->sync($newFeatureIds);
```

### Mengubah Fitur Plan

```php
// Ambil plan Basic
$basicPlan = Plan::where('code', 'basic')->first();

// Tambah fitur membership
$membershipFeature = Feature::where('code', 'membership')->first();
$basicPlan->features()->attach($membershipFeature->id);

// Hapus fitur kitchen (downgrade)
$kitchenFeature = Feature::where('code', 'kitchen')->first();
$basicPlan->features()->detach($kitchenFeature->id);

// Sync multiple features
$featureIds = Feature::whereIn('code', ['stock', 'purchase', 'report'])
    ->pluck('id');
$basicPlan->features()->sync($featureIds);
```

---

## 🚀 QUERY OPTIMIZATION

### Eager Loading (Hindari N+1 Query)

```php
// ❌ BURUK - N+1 Query
$stores = Store::all();
foreach ($stores as $store) {
    echo $store->storeType->label; // Query per iterasi
    echo $store->planModel->label;  // Query per iterasi
}

// ✅ BAIK - Eager Loading
$stores = Store::with(['storeType', 'planModel'])->get();
foreach ($stores as $store) {
    echo $store->storeType->label; // Sudah di-load
    echo $store->planModel->label;  // Sudah di-load
}

// ✅ LEBIH BAIK - Nested Eager Loading
$stores = Store::with([
    'storeType.features',
    'planModel.features',
    'branches.employees',
    'users'
])->get();
```

### Lazy Eager Loading (Load Setelah Query)

```php
$store = Store::find($storeId);

// Load relasi setelah query
$store->load(['storeType.features', 'planModel.features']);

// Sekarang bisa akses tanpa query lagi
$features = $store->storeType->features;
```

### Menggunakan withCount

```php
// Hitung jumlah relasi tanpa load semua data
$stores = Store::withCount(['branches', 'employees', 'users'])
    ->get();

foreach ($stores as $store) {
    echo "Cabang: " . $store->branches_count;
    echo "Karyawan: " . $store->employees_count;
    echo "Users: " . $store->users_count;
}
```

---

## 📝 CHECKLIST IMPLEMENTASI

Gunakan checklist ini untuk memastikan kode Anda mengikuti arsitektur baru:

### ✅ Do (Yang Harus Dilakukan)

- [x] Gunakan `$store->hasFeature('feature_code')` untuk cek fitur
- [x] Gunakan `$store->hasPosMode('mode')` untuk cek POS mode
- [x] Load relasi dengan `with(['storeType.features', 'planModel.features'])`
- [x] Gunakan `getRelation('storeType')` untuk bypass accessor
- [x] Query features dari pivot table: `store_type_feature` & `plan_feature`
- [x] Tambah fitur baru via insert ke tabel `features`
- [x] Assign fitur via `$storeType->features()->attach($featureId)`
- [x] Cek intersection store type features + plan features

### ❌ Don't (Yang JANGAN Dilakukan)

- [ ] ~~Jangan akses `$store->modules`~~ (sudah dihapus)
- [ ] ~~Jangan hardcode array features di PHP~~ (pakai database)
- [ ] ~~Jangan pakai `$store->storeType->id`~~ (gunakan `getRelation()`)
- [ ] ~~Jangan lupa eager loading~~ (hindari N+1)
- [ ] ~~Jangan query di loop~~ (pakai `withCount` atau eager load)

---

## 🐛 TROUBLESHOOTING

### Error: "Attempt to read property on string"

**Penyebab:** Accessor conflict antara `getStoreTypeAttribute()` dan relasi `storeType()`.

**Solusi:**
```php
// ❌ Salah
$storeType = $store->storeType; // Returns string dari accessor

// ✅ Benar
$storeType = $store->getRelation('storeType'); // Returns Model object
```

### Fitur Tidak Muncul Padahal Sudah Diset

**Cek:**
1. Apakah fitur aktif? `features.is_active = 1`
2. Apakah ada di `store_type_feature`?
3. Apakah ada di `plan_feature`?
4. Apakah sudah eager load relasi?

**Debug:**
```php
$store = Store::with(['storeType.features', 'planModel.features'])
    ->find($storeId);

// Cek store type features
dd($store->getRelation('storeType')->features->pluck('code'));

// Cek plan features
dd($store->getRelation('planModel')->features->pluck('code'));
```

### Performance Lambat

**Solusi:**
```php
// Gunakan eager loading
Store::with(['storeType.features', 'planModel.features'])->get();

// Atau pakai withCount untuk menghitung saja
Store::withCount('branches')->get();

// Cache hasil query yang sering dipakai
$features = Cache::remember('store_features_' . $storeId, 3600, function() use ($storeId) {
    return Store::with(['storeType.features', 'planModel.features'])
        ->find($storeId)
        ->getActiveFeatures();
});
```

---

## 📚 REFERENSI MODEL METHODS

### Store Model

```php
// Cek fitur
$store->hasFeature('kitchen');              // bool
$store->planAllowsFeature('kitchen');       // bool
$store->hasPosMode('fnb');                  // bool

// Config
$store->activePlanConfig();                 // array
$store->effectiveMaxUsers();                // int
$store->effectiveMaxBranches();             // int

// Limitasi
$store->canAddUser();                       // bool
$store->canAddBranch();                     // bool
$store->isPlanExpired();                    // bool
$store->effectivePlanCode();                // string

// Relasi (gunakan getRelation untuk bypass accessor)
$store->getRelation('storeType');           // StoreType model
$store->getRelation('planModel');           // Plan model
$store->branches;                           // Collection<Branch>
$store->employees;                          // Collection<Employee>
$store->users;                              // Collection<User>
```

### StoreType Model

```php
// Relasi
$storeType->stores;                         // Collection<Store>
$storeType->features;                       // Collection<Feature>

// Methods
$storeType->featureCodes();                 // array ['kitchen', 'stock', ...]
$storeType->featureList();                  // array ['kitchen' => 'Kitchen Display', ...]

// Static
StoreType::active();                        // array
StoreType::codes();                         // array ['retail', 'fnb', ...]
```

### Plan Model

```php
// Relasi
$plan->stores;                              // Collection<Store>
$plan->features;                            // Collection<Feature>

// Methods
$plan->featureCodes();                      // array ['kitchen', 'stock', ...]
```

### Feature Model

```php
// Relasi
$feature->details;                          // Collection<FeatureDetail>
$feature->storeTypes;                       // Collection<StoreType>
$feature->plans;                            // Collection<Plan>

// Scope
Feature::active();                          // Query builder
Feature::byCategory('pos');                 // Query builder
```

---

## 🎓 KESIMPULAN

### Prinsip Utama Sistem:

1. **Single Source of Truth**
   - Semua fitur ada di tabel `features`
   - Tidak ada hardcoded array di PHP

2. **Relasi sebagai Konfigurasi**
   - Store Type → Features (fitur yang relevan)
   - Plan → Features (fitur yang diizinkan)
   - Store = intersection keduanya

3. **Fleksibilitas**
   - Admin bisa atur fitur via database
   - Tidak perlu edit code untuk tambah fitur
   - Easy to maintain dan scale

4. **Performa**
   - Eager loading untuk hindari N+1
   - Cache untuk query yang sering dipakai
   - Index database untuk relasi

### Kapan Menggunakan Apa:

| Kebutuhan                      | Method/Query                              |
|--------------------------------|-------------------------------------------|
| Cek fitur aktif di toko        | `$store->hasFeature('code')`              |
| Cek POS mode                   | `$store->hasPosMode('fnb')`               |
| Cek limitasi plan              | `$store->canAddUser()`                    |
| Ambil fitur store type         | `$storeType->features`                    |
| Ambil fitur plan               | `$plan->features`                         |
| Tambah fitur ke store type     | `$storeType->features()->attach($id)`     |
| Tambah fitur ke plan           | `$plan->features()->attach($id)`          |
| Load relasi                    | `Store::with(['storeType.features'])`     |
| Bypass accessor                | `$store->getRelation('storeType')`        |

---

## 📞 SUPPORT

Jika ada pertanyaan atau butuh bantuan implementasi:

1. Baca dokumentasi ini dengan teliti
2. Cek contoh kode di setiap section
3. Gunakan `dd()` untuk debug query dan data
4. Pastikan eager loading sudah benar
5. Cek apakah data pivot table sudah terisi

**Happy Coding! 🚀**
