# Sidebar Visibility Logic - Complete Documentation

## 🎯 Tujuan
Sidebar navigation memiliki **3 state** untuk setiap menu item:

| State | typeSupports | planAllows | Tampilan |
|-------|--------------|------------|----------|
| **NORMAL** | ✅ | ✅ | Klikable, normal styling, **muncul di ATAS** |
| **LOCKED** | ✅ | ❌ | Transparan, 🔒 badge, tidak bisa diklik, **muncul di BAWAH** |
| **HIDDEN** | ❌ | - | Tidak tampil sama sekali di sidebar |

## ✨ **NEW FEATURE: Auto-Sorting!**
**Item NORMAL otomatis naik ke atas, item LOCKED turun ke bawah** di setiap grup menu!

Dengan visual divider `🔒 Upgrade Plan` sebagai pemisah antara NORMAL dan LOCKED items.

**Contoh Visual:**
```
📊 MASTER DATA
  ✅ Produk         (NORMAL - bisa diklik)
  ✅ Kategori       (NORMAL - bisa diklik)
  ✅ Pelanggan      (NORMAL - bisa diklik)
  ━━━ 🔒 Upgrade Plan ━━━
  🔒 Modifier       (LOCKED - perlu upgrade)
  🔒 Membership     (LOCKED - perlu upgrade)
  🔒 Komisi         (LOCKED - perlu upgrade)
```

---

## 🔧 Implementasi

### 1️⃣ FILE: `resources/js/Hooks/useStoreModules.js`
**Fungsi:** Core logic untuk menentukan state fitur

```js
// Layer 1: Type features (dari pivot table store_type_feature)
const typeSupports = (feature) => {
    if (!typeFeaturesLoaded) return false;
    return typeFeatures.includes(feature);
};

// Layer 2: Plan features (dari plan_feature atau hardcoded fallback)
const planAllows = (feature) => {
    if (planAllAll) return true;
    return planFeatures.includes(feature);
};

// hasFeature = NORMAL (typeSupports ✅ && planAllows ✅)
const hasFeature = (feature) =>
    typeSupports(feature) && planAllows(feature);

// isFeatureLocked = LOCKED (typeSupports ✅ && planAllows ❌)
const isFeatureLocked = (feature) =>
    typeSupports(feature) && !planAllows(feature);
```

**Contoh flags yang dihasilkan:**
```js
return {
    hasDashboard,      // true jika type support DAN plan allow
    lockedDashboard,   // true jika type support TAPI plan tidak allow
    hasPos,
    lockedPos,
    // ... dst untuk semua 34 features
};
```

---

### 2️⃣ FILE: `resources/js/Config/navConfig.js`
**Fungsi:** Membangun struktur sidebar navigation + **auto-sorting**

#### Helper Function `add()`
```js
/**
 * @param {Array} items - Array untuk menambahkan item
 * @param {boolean} typeSupports - hasFeature || isFeatureLocked
 * @param {boolean} planAllows - hasFeature (BUKAN !isFeatureLocked)
 * @param {object} item - Item menu
 */
function add(items, typeSupports, planAllows, item) {
    if (!typeSupports) return;  // HIDDEN
    
    if (typeSupports && !planAllows) {
        items.push({ ...item, locked: true });  // LOCKED
        return;
    }
    
    items.push(item);  // NORMAL
}
```

#### ✨ **NEW: Helper Function `sortByLockState()`**
```js
/**
 * Sort items agar NORMAL di atas, LOCKED di bawah
 * Ini biar user langsung lihat fitur yang bisa diakses di atas!
 * 
 * @param {Array} items - Array items yang sudah diisi
 * @returns {Array} - Array yang sudah di-sort
 */
function sortByLockState(items) {
    return items.sort((a, b) => {
        const aLock = a.locked ? 1 : 0;
        const bLock = b.locked ? 1 : 0;
        return aLock - bLock;  // Normal items naik ke atas
    });
}
```

#### Cara Pakai yang Benar ✅
```js
// MASTER DATA - dengan auto-sorting
{
    const items = [];
    add(items, hasProduct || lockedProduct, hasProduct, {...});
    add(items, hasCategory || lockedCategory, hasCategory, {...});
    add(items, needsModifier || lockedModifier, needsModifier, {...});
    // ... tambah item lainnya
    
    if (items.length > 0)
        groups.push({
            key: "master",
            label: "Master Data",
            icon: "database",
            items: sortByLockState(items),  // ← AUTO-SORT disini!
        });
}
```

**Sebelum sorting (urutan acak):**
```
- Produk (NORMAL)
- Modifier (LOCKED)
- Kategori (NORMAL)
- Membership (LOCKED)
- Pelanggan (NORMAL)
```

**Setelah sorting (NORMAL naik, LOCKED turun):**
```
- Produk (NORMAL) ⬆️
- Kategori (NORMAL) ⬆️
- Pelanggan (NORMAL) ⬆️
━━━ divider ━━━
- Modifier (LOCKED) ⬇️
- Membership (LOCKED) ⬇️
```

#### ❌ CARA SALAH (SUDAH DIPERBAIKI)
```js
// ❌ JANGAN SEPERTI INI
add(items, hasDashboard, !lockedDashboard, {...});
// Parameter ke-2 sudah typeSupports + planAllows (wrong!)
// Parameter ke-3 pakai !locked (wrong!)

// ✅ HARUS SEPERTI INI
add(items, hasDashboard || lockedDashboard, hasDashboard, {...});
// Parameter ke-2 = typeSupports (OR antara has dan locked)
// Parameter ke-3 = planAllows (langsung has)
```

---

### 3️⃣ FILE: `resources/js/Layouts/AuthenticatedLayout.jsx`
**Fungsi:** Render UI sidebar dengan 3 state

```jsx
function NavItem({ item, collapsed, onClick }) {
    const locked = item.locked;

    if (locked) {
        // 🔒 LOCKED STATE
        return (
            <div
                className="cursor-not-allowed opacity-50"
                title="🔓 Upgrade Plan untuk mengakses fitur ini"
            >
                <span className="text-slate-300 line-through">
                    {item.name}
                </span>
                <span className="text-amber-600">🔓</span>
            </div>
        );
    }

    // ✅ NORMAL STATE (klikable)
    return (
        <Link href={item.href} className="...">
            {item.name}
        </Link>
    );
}
```

**Catatan:** Item dengan state HIDDEN tidak akan sampai ke component ini karena sudah tidak ditambahkan ke array `items` di `navConfig.js`.

---

### 4️⃣ FILE: `app/Http/Middleware/HandleInertiaRequests.php`
**Fungsi:** Mengirim data ke frontend

#### Data 1: `storeTypeFeatures` (dari pivot table)
```php
"storeTypeFeatures" => fn() => rescue(
    function () use ($storeId) {
        if (!$storeId) return [];
        $store = Store::with("storeType.features")->find($storeId);
        if (!$store || !$store->getRelationValue('storeType')) {
            return [];
        }

        return $store
            ->getRelationValue("storeType")
            ->features
            ->where("is_active", true)
            ->pluck("code")
            ->toArray();
    },
    [],
    false,
),
```

**Contoh output:**
```php
// Toko FnB
[
    "dashboard",
    "basic_pos",
    "table",
    "kitchen",
    "product",
    "category",
    "modifier",
    // ... semua fitur yang di-centang di TypeFeatures CRUD
]
```

#### Data 2: `storePlan` (dari plan_feature atau fallback)
```php
private function getStorePlan(int $storeId): ?array
{
    $store = Store::with("planModel.features")->find($storeId);
    $planModel = $store->planModel;

    // Fitur dari DB (via pivot plan_feature)
    if ($planModel && !empty($planModel->featureCodes())) {
        $featureCodes = $planModel->featureCodes();
    } else {
        // Fallback hardcoded
        $planConfig = Store::planConfig()[$planCode] ?? Store::planConfig()["free"];
        $featureCodes = $planConfig["features"];
    }

    return [
        "plan" => $planCode,
        "features" => $featureCodes,
        // ... meta lainnya
    ];
}
```

**Contoh output:**
```php
// Plan Free
[
    "plan" => "free",
    "features" => ["dashboard", "basic_pos"],  // Hanya 2 fitur
]

// Plan Pro
[
    "plan" => "pro",
    "features" => ["*"],  // Semua fitur
]
```

---

## 🧪 Contoh Skenario

### Skenario 1: Toko FnB dengan Plan Free
**Setup:**
- Store Type: FnB
- Plan: Free (features: `["dashboard", "basic_pos"]`)
- Type Features: `["dashboard", "basic_pos", "table", "kitchen", "product", ...]`

**Hasil:**
| Menu | typeSupports | planAllows | State |
|------|--------------|------------|-------|
| Dashboard | ✅ | ✅ | **NORMAL** |
| Kasir/POS | ✅ | ✅ | **NORMAL** |
| Meja | ✅ | ❌ | **🔒 LOCKED** |
| Kitchen | ✅ | ❌ | **🔒 LOCKED** |
| Produk | ✅ | ❌ | **🔒 LOCKED** |
| Queue (Service-only) | ❌ | - | **HIDDEN** |

---

### Skenario 2: Toko Retail dengan Plan Pro
**Setup:**
- Store Type: Retail
- Plan: Pro (features: `["*"]`)
- Type Features: `["dashboard", "basic_pos", "product", "stock", "purchase", ...]`

**Hasil:**
| Menu | typeSupports | planAllows | State |
|------|--------------|------------|-------|
| Dashboard | ✅ | ✅ | **NORMAL** |
| Kasir/POS | ✅ | ✅ | **NORMAL** |
| Produk | ✅ | ✅ | **NORMAL** |
| Stok | ✅ | ✅ | **NORMAL** |
| Pembelian | ✅ | ✅ | **NORMAL** |
| Meja (FnB-only) | ❌ | - | **HIDDEN** |
| Kitchen (FnB-only) | ❌ | - | **HIDDEN** |

---

### Skenario 3: Toko Service dengan Plan Basic
**Setup:**
- Store Type: Service
- Plan: Basic (features: `["dashboard", "basic_pos", "customer", "employee"]`)
- Type Features: `["dashboard", "basic_pos", "queue", "booking", "customer", "membership", "employee", "commission", ...]`

**Hasil:**
| Menu | typeSupports | planAllows | State |
|------|--------------|------------|-------|
| Dashboard | ✅ | ✅ | **NORMAL** |
| Kasir/POS | ✅ | ✅ | **NORMAL** |
| Pelanggan | ✅ | ✅ | **NORMAL** |
| Karyawan | ✅ | ✅ | **NORMAL** |
| Antrian | ✅ | ❌ | **🔒 LOCKED** |
| Booking | ✅ | ❌ | **🔒 LOCKED** |
| Membership | ✅ | ❌ | **🔒 LOCKED** |
| Komisi | ✅ | ❌ | **🔒 LOCKED** |
| Produk (Retail/FnB) | ❌ | - | **HIDDEN** |
| Meja (FnB) | ❌ | - | **HIDDEN** |

---

## ✅ Checklist Implementasi

- [x] `useStoreModules.js` - Logic untuk `hasFeature()` dan `isFeatureLocked()`
- [x] `navConfig.js` - Fungsi `add()` dengan parameter yang benar
- [x] `navConfig.js` - Semua pemanggilan `add()` menggunakan format: `(hasX || lockedX, hasX, {...})`
- [x] `AuthenticatedLayout.jsx` - Render `locked` state dengan transparan + 🔒 badge
- [x] `HandleInertiaRequests.php` - Share `storeTypeFeatures` dan `storePlan` ke frontend
- [x] `Feature.php`, `StoreType.php`, `Plan.php` - Relasi Eloquent sudah benar

---

## 🚀 Testing

### Test 1: Verifikasi Data dari Backend
```js
// Di browser console
console.log(usePage().props.storeTypeFeatures);
// Output: ["dashboard", "basic_pos", "table", ...]

console.log(usePage().props.storePlan);
// Output: { plan: "free", features: ["dashboard", "basic_pos"], ... }
```

### Test 2: Verifikasi Flags di Hook
```js
// Di browser console
import { useStoreModules } from '@/Hooks/useStoreModules';
const modules = useStoreModules();

console.log('Dashboard:', {
    has: modules.hasDashboard,
    locked: modules.lockedDashboard
});

console.log('Kitchen:', {
    has: modules.needsKitchen,
    locked: modules.lockedKitchen
});
```

### Test 3: Verifikasi Sidebar Rendering
1. Login sebagai toko FnB dengan plan Free
2. Cek sidebar:
   - Dashboard & Kasir/POS → **Normal** (bisa diklik)
   - Meja, Kitchen, Produk → **Locked** (transparan + 🔒)
   - Queue (Service-only) → **Hidden** (tidak muncul)

3. Switch ke plan Pro
4. Cek sidebar:
   - Semua menu FnB → **Normal** (bisa diklik)
   - Menu Service (Queue) → **Hidden** (tetap tidak muncul karena type tidak support)

---

## 📝 Notes

1. **Permission check** (`can()`) adalah layer tambahan setelah type+plan check
2. **Locked items** tetap muncul untuk UX - user tahu fitur ada tapi butuh upgrade
3. **Hidden items** tidak muncul sama sekali - fitur tidak relevan untuk tipe toko
4. **Fallback hardcoded** di `Store::planConfig()` hanya dipakai jika pivot `plan_feature` kosong

---

## 🐛 Common Issues & Solutions

### Issue 1: Semua fitur HIDDEN
**Penyebab:** `storeTypeFeatures` kosong
**Solusi:** Cek pivot table `store_type_feature`, jalankan seeder `FeatureSeeder`

### Issue 2: Semua fitur LOCKED
**Penyebab:** `storePlan.features` kosong atau tidak cocok
**Solusi:** Cek pivot table `plan_feature`, atau fallback hardcoded di `Store::planConfig()`

### Issue 3: Fitur muncul NORMAL tapi seharusnya LOCKED
**Penyebab:** Parameter `add()` salah (pakai `!locked` bukan `hasFeature`)
**Solusi:** Pastikan parameter ke-3 adalah `hasFeature` (sudah diperbaiki)

---

**Last Updated:** 2025-01-XX
**Status:** ✅ IMPLEMENTED & TESTED
