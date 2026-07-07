# PERBAIKAN PURCHASE CONTROLLER - CREATE PAGE

## MASALAH
Purchase create page tidak bisa dibuka, redirect ke dashboard dengan error Inertia.

## ROOT CAUSE ANALYSIS

### 1. **Session Store ID Tidak Ada**
   - Controller hanya menggunakan `session("current_store_id")` tanpa fallback
   - Jika session kosong, `$storeId` menjadi `null`
   - Menyebabkan redirect ke dashboard

### 2. **Accessor Conflict pada Store Model**
   - `Store` model memiliki:
     - Method `storeType()` yang return relationship (Model object)
     - Accessor `getStoreTypeAttribute()` yang return string code
   - Saat akses `$store->storeType`, Laravel memanggil accessor (return string)
   - Saat akses `$store->storeType->code`, error "Attempt to read property on string"

### 3. **Product Cost Price Null**
   - Beberapa product bisa punya `cost_price` = null
   - Perlu cast ke float dengan default 0

## SOLUSI YANG DITERAPKAN

### 1. Menggunakan Trait `HasStoreScope`
```php
use App\Http\Controllers\Concerns\HasStoreScope;

class PurchaseController extends Controller
{
    use HasStoreScope;

    public function create()
    {
        // Gunakan storeScope() untuk fallback otomatis
        [$storeId, $branchId] = $this->storeScope();
        // Fallback: session → user's first store
    }
}
```

**Cara Kerja `storeScope()`:**
```php
protected function storeScope(): array
{
    $user     = Auth::user();
    $storeId  = session('current_store_id') ?? $user->stores()->get()->first()?->id;
    $branchId = session('current_branch_id') ?? session('branch_id') 
                ?? (!$user->can('sale.void') ? $user->branch_id : null);

    return [(int) $storeId, $branchId ? (int) $branchId : null];
}
```

### 2. Menggunakan `getRelation()` untuk Akses Store Type
```php
// ❌ SALAH - Memanggil accessor (return string)
$storeTypeCode = $store->storeType->code; // Error: read property on string

// ✅ BENAR - Akses relasi langsung
$storeType = $store->getRelation("storeType");
$storeTypeCode = $storeType->code ?? "retail";
```

**Penjelasan:**
- `$store->storeType` → Memanggil `getStoreTypeAttribute()` → Return string
- `$store->getRelation("storeType")` → Akses relasi langsung → Return Model object

### 3. Error Handling dan Logging
```php
try {
    [$storeId, $branchId] = $this->storeScope();
    
    if (!$storeId) {
        \Log::warning('Purchase Create: No store ID found');
        return redirect()->route('admin.dashboard')
            ->with('error', 'Silakan pilih toko terlebih dahulu.');
    }
    
    $store = Store::with("storeType")->find($storeId);
    
    if (!$store) {
        \Log::error("Purchase Create: Store not found - ID: {$storeId}");
        return redirect()->route('admin.dashboard')
            ->with('error', 'Toko tidak ditemukan.');
    }
    
    $storeType = $store->getRelation("storeType");
    if (!$storeType) {
        \Log::error("Purchase Create: Store type not found for store ID: {$storeId}");
        return redirect()->route('admin.dashboard')
            ->with('error', 'Tipe toko tidak ditemukan.');
    }
    
    $storeTypeCode = $storeType->code ?? "retail";
    \Log::info("Purchase Create: Store {$storeId}, Type: {$storeTypeCode}");
    
    // ... rest of the code
    
} catch (\Exception $e) {
    \Log::error('Purchase Create Error: ' . $e->getMessage());
    \Log::error('Stack Trace: ' . $e->getTraceAsString());
    
    return redirect()->route('admin.dashboard')
        ->with('error', 'Terjadi kesalahan saat memuat halaman pembelian: ' . $e->getMessage());
}
```

### 4. Safe Cast Cost Price
```php
"cost_price" => (float) ($p->cost_price ?? 0), // Default 0 jika null
```

### 5. Redirect ke Dashboard (Bukan Index)
```php
// Redirect ke dashboard karena user mungkin belum setup store dengan benar
return redirect()->route('admin.dashboard')
    ->with('error', 'Terjadi kesalahan saat memuat halaman pembelian: ' . $e->getMessage());
```

## PERUBAHAN FILE

### File: `app/Http/Controllers/Admin/PurchaseController.php`

**Method yang Diubah:**
1. `create()` - Load data untuk form create purchase
2. `index()` - Konsistensi penggunaan `getRelation()`

**Perubahan Utama:**
```php
// Sebelum:
$storeId = session("current_store_id");
$storeTypeCode = $store->storeType?->code ?? "retail"; // Error!

// Sesudah:
[$storeId, $branchId] = $this->storeScope(); // Fallback otomatis
$storeType = $store->getRelation("storeType"); // Return Model
$storeTypeCode = $storeType->code ?? "retail"; // Safe access
```

## CARA VERIFIKASI

### 1. Cek Laravel Log
```bash
# Windows CMD
type storage\logs\laravel.log | findstr "Purchase Create"

# Windows PowerShell
Get-Content storage\logs\laravel.log | Select-String "Purchase Create"
```

### 2. Test Flow
1. Login sebagai user yang punya akses ke store
2. Buka `/admin/purchases/create`
3. Halaman harus load dengan:
   - Daftar produk sesuai store type
   - Daftar supplier
   - Daftar payment methods
4. Check Laravel log untuk info:
   ```
   [2026-07-08] local.INFO: Purchase Create: Store 1, Type: retail
   [2026-07-08] local.INFO: Purchase Create: Rendering with 50 products, 10 suppliers, 5 payment methods
   ```

### 3. Test Edge Cases

**Test 1: User Tanpa Store**
```php
// Buat user baru tanpa store
$user = User::create([...]);
// Login sebagai user ini
// Akses /admin/purchases/create
// Expected: Redirect ke dashboard dengan error "Silakan pilih toko terlebih dahulu"
```

**Test 2: Store Tanpa Store Type**
```php
// Update store agar store_type_id = null (edge case, seharusnya tidak terjadi)
Store::find(1)->update(['store_type_id' => null]);
// Akses /admin/purchases/create
// Expected: Redirect ke dashboard dengan error "Tipe toko tidak ditemukan"
```

**Test 3: Store FnB**
```php
// Login ke store dengan store_type = 'fnb'
// Akses /admin/purchases/create
// Expected: Products yang muncul hanya type = 'raw_material'
// Check log: "Purchase Create: Store 1, Type: fnb"
```

## PATTERN YANG HARUS DIIKUTI DI CONTROLLER LAIN

### ✅ DO: Gunakan Pola Ini

```php
use App\Http\Controllers\Concerns\HasStoreScope;

class YourController extends Controller
{
    use HasStoreScope;
    
    public function index()
    {
        try {
            // 1. Get store ID dengan fallback
            [$storeId, $branchId] = $this->storeScope();
            
            if (!$storeId) {
                return redirect()->route('admin.dashboard')
                    ->with('error', 'Silakan pilih toko terlebih dahulu.');
            }
            
            // 2. Load store dengan eager loading
            $store = Store::with('storeType')->find($storeId);
            
            if (!$store) {
                return redirect()->route('admin.dashboard')
                    ->with('error', 'Toko tidak ditemukan.');
            }
            
            // 3. Akses relasi dengan getRelation()
            $storeType = $store->getRelation('storeType');
            $storeTypeCode = $storeType?->code ?? 'retail';
            
            // 4. Query data dengan store scope
            $data = YourModel::where('store_id', $storeId)
                ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
                ->get();
            
            // 5. Return Inertia render
            return Inertia::render('Admin/YourPage/Index', [
                'data' => $data,
                'storeType' => $storeTypeCode,
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Your Controller Error: ' . $e->getMessage());
            \Log::error('Stack Trace: ' . $e->getTraceAsString());
            
            return redirect()->route('admin.dashboard')
                ->with('error', 'Terjadi kesalahan: ' . $e->getMessage());
        }
    }
}
```

### ❌ DON'T: Hindari Pola Ini

```php
// ❌ Langsung akses session tanpa fallback
$storeId = session('current_store_id'); // Bisa null!

// ❌ Akses accessor yang return string sebagai object
$storeTypeCode = $store->storeType->code; // Error jika storeType adalah string!

// ❌ Tidak ada error handling
public function index()
{
    $storeId = session('current_store_id');
    $data = Model::where('store_id', $storeId)->get(); // Bisa error jika storeId null
    return Inertia::render('Page', ['data' => $data]);
}

// ❌ Load relasi tanpa eager loading (N+1 query)
$stores = Store::all();
foreach ($stores as $store) {
    echo $store->storeType->label; // Query di setiap iterasi!
}
```

## RINGKASAN BEST PRACTICES

1. **Selalu gunakan `HasStoreScope` trait** untuk mendapatkan `$storeId` dengan fallback
2. **Gunakan `getRelation('storeType')`** untuk akses relasi Store Type (bukan `->storeType`)
3. **Eager load relasi** dengan `->with()` untuk hindari N+1 query
4. **Tambahkan error handling** dengan try-catch dan logging
5. **Validasi data** sebelum digunakan (cek null, cek exists, dll)
6. **Redirect ke dashboard** jika ada masalah fundamental (store tidak ada, dll)
7. **Log semua error** untuk debugging
8. **Cast data numerik** ke float/int untuk konsistensi

## CHECKLIST PERBAIKAN CONTROLLER LAIN

Gunakan checklist ini untuk memperbaiki controller lain:

- [x] Import trait `HasStoreScope`
- [x] Gunakan `$this->storeScope()` untuk get store ID
- [x] Load `Store::with('storeType')` dengan eager loading
- [x] Gunakan `getRelation('storeType')` bukan `->storeType`
- [x] Tambahkan validasi `if (!$storeId)` dan `if (!$store)`
- [x] Wrap dalam try-catch dengan logging
- [x] Cast numeric fields ke float/int
- [ ] Test dengan user yang tidak punya store
- [ ] Test dengan store yang tidak punya store type
- [ ] Verify di Laravel log

## NEXT STEPS

1. ✅ Fix PurchaseController::create() - **DONE**
2. ✅ Fix PurchaseController::index() - **DONE**
3. ⏳ Test purchase create page - **TO DO**
4. ⏳ Verify error logs - **TO DO**
5. ⏳ Apply same pattern to other controllers - **TO DO**

## RELATED FILES

- `app/Http/Controllers/Admin/PurchaseController.php` - Controller yang diperbaiki
- `app/Http/Controllers/Concerns/HasStoreScope.php` - Trait untuk store scope
- `app/Models/Store.php` - Model dengan accessor dan relasi
- `resources/js/Pages/Admin/Purchases/Create.jsx` - Frontend component
- `DOKUMENTASI_RELASI_DATABASE.md` - Dokumentasi lengkap relasi database
