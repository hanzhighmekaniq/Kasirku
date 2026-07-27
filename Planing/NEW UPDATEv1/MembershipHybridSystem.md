Planning: Sistem Membership Hybrid (Manual + Beli Prabayar + Auto-Tier)

# Konteks

Saat ini pelanggan sudah bisa di-assign membership secara manual (gratis) lewat
`Customers/Show.jsx` (`CustomerController::assignMembership/revokeMembership`,
sudah ada dan jalan). Yang belum ada:

1. Membership **dibeli** oleh pelanggan lewat transaksi berbayar (prabayar) —
   tercatat sebagai `Sale` sah, masuk rekonsiliasi kas shift kasir, bisa cash
   atau Payment Gateway.
2. Tier pelanggan **naik/turun otomatis** berdasarkan pola belanja
   (auto-tier), tanpa pernah mencabut membership yang sumbernya manual/beli.
3. Field `discount_percent` di Membership (sudah ada di DB & form, belum
   pernah dipakai di mana pun) — disambungkan ke kalkulasi harga transaksi
   *selanjutnya* milik pelanggan yang punya membership aktif.
4. Guard hapus produk (bonus fix) — saat ini `ProductController::destroy()`
   tidak ada pengaman sama sekali, produk yang sudah pernah terjual bisa
   terhapus permanen beserta riwayat `sale_items`-nya (cascade delete).

Tiga sumber membership berjalan berdampingan, dibedakan lewat kolom
`customer_memberships.source`:

| Sumber       | Trigger                                   | Disentuh auto-tier? |
|--------------|--------------------------------------------|----------------------|
| `manual`     | Owner/admin assign lewat Show.jsx (sudah ada) | Tidak, aman sampai expired sendiri |
| `purchase`   | Pelanggan beli prabayar (baru)             | Tidak, aman sampai expired sendiri |
| `auto_tier`  | Sistem, real-time tiap transaksi + sapuan harian | Ya, baris miliknya sendiri saja |

Tier final pelanggan = rank tertinggi (`Membership.sort_order`) dari SEMUA
membership aktif miliknya (gabungan 3 sumber) — jadi pelanggan tidak pernah
dirugikan oleh evaluasi auto-tier.

Tidak ada perubahan pada grid produk POS. Pembelian membership terjadi di
`Customers/Show.jsx`, mereuse komponen shift-modal dan panel pembayaran yang
sudah ada di Kasir (import langsung, bukan tulis ulang).

---

## Yang sudah selesai (sesi sebelumnya)

- Migration `maps_to_tier` (Membership), `points_per_amount` (Store)
- `Customer::activeMembership()` fix (support `expired_date = null`),
  `Customer::syncTierFromMembership()`
- `SaleObserver` — loyalty points award on sale completed (idempotent via
  `extra_data.loyalty_awarded_at`)
- `CustomerController::show/assignMembership/revokeMembership` + routes
- `Customers/Show.jsx`, `Memberships/Index.jsx` (tier dropdown), `Settings/Index.jsx`
  (points_per_amount)
- Test: `CustomerMembershipAssignTest`, `SaleCompletionAwardsPointsTest`

---

# Tahap 1 — Database & Model Dasar

## Task 1.1 — Migration kolom baru

File baru: `database/migrations/xxxx_add_membership_purchase_and_auto_tier_columns.php`

```php
public function up(): void
{
    Schema::table('products', function (Blueprint $table) {
        $table->foreignId('membership_id')->nullable()->after('supplier_id')
            ->constrained('memberships')->cascadeOnDelete();
    });

    Schema::table('memberships', function (Blueprint $table) {
        $table->boolean('is_sellable_at_pos')->default(false)->after('maps_to_tier');
        $table->decimal('auto_tier_min_spend', 15, 2)->nullable()->after('is_sellable_at_pos');
        $table->string('auto_tier_window_type', 10)->nullable()->after('auto_tier_min_spend'); // day|month|year
        $table->unsignedInteger('auto_tier_window_value')->nullable()->after('auto_tier_window_type');
    });

    Schema::table('customer_memberships', function (Blueprint $table) {
        $table->string('source', 20)->default('manual')->after('status'); // manual|purchase|auto_tier
    });
}

public function down(): void
{
    Schema::table('customer_memberships', fn (Blueprint $t) => $t->dropColumn('source'));
    Schema::table('memberships', fn (Blueprint $t) => $t->dropColumn([
        'is_sellable_at_pos', 'auto_tier_min_spend', 'auto_tier_window_type', 'auto_tier_window_value',
    ]));
    Schema::table('products', function (Blueprint $t) {
        $t->dropConstrainedForeignId('membership_id');
    });
}
```

## Task 1.2 — Model `Product`

File: `app/Models/Product.php`

- Tambah `membership_id` ke `$fillable`.
- Tambah relasi:

```php
public function membership(): BelongsTo
{
    return $this->belongsTo(Membership::class);
}

public function saleItems(): HasMany
{
    return $this->hasMany(SaleItem::class);
}
```

`saleItems()` belum ada sama sekali di model ini — dibutuhkan juga untuk
guard hapus produk di Task 5.

## Task 1.3 — Model `Membership`

File: `app/Models/Membership.php`

- Tambah `is_sellable_at_pos`, `auto_tier_min_spend`, `auto_tier_window_type`,
  `auto_tier_window_value` ke `$fillable` + `casts()`.
- Tambah relasi:

```php
public function product(): HasOne
{
    return $this->hasOne(Product::class);
}
```

- Tambah `booted()` (ikuti konvensi `Category`/`Promotion` yang sudah pakai
  hook ini) untuk auto-sync Product **tersembunyi** (bukan ditampilkan di
  katalog/grid manapun — `is_sellable = false` selalu, cuma jadi jembatan
  teknis untuk `sale_items.product_id`):

```php
protected static function booted(): void
{
    static::saved(function (Membership $membership) {
        if (! $membership->is_sellable_at_pos) {
            $membership->product?->update(['is_active' => false]);

            return;
        }

        Product::updateOrCreate(
            ['membership_id' => $membership->id],
            [
                'store_id' => $membership->store_id,
                'name' => $membership->name,
                'sku' => 'MBR-'.$membership->code,
                'type' => 'membership',
                'unit' => 'pcs',
                'sell_price' => $membership->price,
                'track_stock' => false,
                'is_sellable' => false, // tidak pernah muncul di grid kasir
                'is_active' => $membership->is_active,
            ],
        );
    });
}
```

- Tambah helper rank:

```php
public function tierRank(): int
{
    return match ($this->maps_to_tier) {
        'bronze' => 1,
        'silver' => 2,
        'gold' => 3,
        'platinum' => 4,
        default => 0,
    };
}
```

## Task 1.4 — Model `CustomerMembership`

File: `app/Models/CustomerMembership.php`

- Tambah `source` ke `$fillable`.
- Tambah scope:

```php
public function scopeAutoTier(Builder $query): Builder
{
    return $query->where('source', 'auto_tier');
}

public function scopeManualOrPurchase(Builder $query): Builder
{
    return $query->whereIn('source', ['manual', 'purchase']);
}
```

## Task 1.5 — Model `Customer`

File: `app/Models/Customer.php`

`syncTierFromMembership()` diubah dari "ambil satu terbaru" jadi "ambil rank
tertinggi dari SEMUA membership aktif":

```php
public function syncTierFromMembership(): void
{
    $tier = $this->memberships()
        ->active()
        ->with('membership')
        ->get()
        ->map(fn ($cm) => $cm->membership)
        ->filter()
        ->sortByDesc(fn ($m) => $m->tierRank())
        ->first()
        ?->maps_to_tier ?? 'bronze';

    $this->forceFill(['tier' => $tier])->save();
}
```

`assignMembership()`/`revokeMembership()` di `CustomerController` yang sudah
ada TIDAK perlu diubah — mereka sudah panggil `syncTierFromMembership()`,
otomatis ikut pola baru ini. Tapi field `source` perlu ditambahkan saat
create di `assignMembership()`:

File: `app/Http/Controllers/Admin/CustomerController.php` — di
`assignMembership()`, tambahkan `'source' => 'manual'` ke array
`$customer->memberships()->create([...])`.

---

# Tahap 2 — Beli Prabayar (Sale + Payment)

## Task 2.1 — Validasi order_type baru

File: `app/Http/Controllers/Admin/KasirController.php` — TIDAK disentuh untuk
tahap ini (endpoint baru terpisah, lihat Task 2.3).

## Task 2.2 — SaleObserver: grant membership dari pembelian

File: `app/Observers/SaleObserver.php`

Tambah method baru, dipanggil dari `created()`/`updated()` (bareng
`awardLoyaltyIfCompleted`):

```php
public function created(Sale $sale): void
{
    $this->awardLoyaltyIfCompleted($sale);
    $this->grantPurchasedMemberships($sale);
}

public function updated(Sale $sale): void
{
    if ($sale->wasChanged('status')) {
        $this->awardLoyaltyIfCompleted($sale);
        $this->grantPurchasedMemberships($sale);
    }
}

private function grantPurchasedMemberships(Sale $sale): void
{
    if ($sale->status !== 'completed' || ! $sale->customer_id) {
        return;
    }

    $extraData = $sale->extra_data ?? [];
    if (! empty($extraData['membership_granted_at'])) {
        return;
    }

    $sale->loadMissing('items.product.membership');
    $membershipItems = $sale->items->filter(fn ($item) => $item->product?->membership_id);

    if ($membershipItems->isEmpty()) {
        return;
    }

    foreach ($membershipItems as $item) {
        $membership = $item->product->membership;
        $startDate = now()->startOfDay();

        $existingActive = CustomerMembership::where('customer_id', $sale->customer_id)
            ->where('membership_id', $membership->id)
            ->active()
            ->first();

        if ($existingActive) {
            // Extend dari expired_date lama, bukan reset (kesepakatan awal).
            $base = $existingActive->expired_date ?? $startDate;
            $existingActive->update([
                'expired_date' => $membership->calculateExpiry($base),
            ]);
        } else {
            CustomerMembership::create([
                'customer_id' => $sale->customer_id,
                'membership_id' => $membership->id,
                'sale_id' => $sale->id,
                'start_date' => $startDate,
                'expired_date' => $membership->calculateExpiry($startDate),
                'remaining_visits' => $membership->duration_type === 'visit'
                    ? $membership->duration_value
                    : null,
                'status' => 'active',
                'source' => 'purchase',
            ]);
        }
    }

    $sale->customer?->syncTierFromMembership();

    $sale->forceFill([
        'extra_data' => [...$extraData, 'membership_granted_at' => now()->toISOString()],
    ])->saveQuietly();
}
```

## Task 2.3 — Endpoint beli prabayar

File: `app/Http/Controllers/Admin/CustomerController.php`

Tambah method baru `purchaseMembership()`. Membuat `Sale` sederhana 1-item
yang STRUKTURAL SAMA dengan yang dibuat `KasirController::store()` (field
wajib yang sama), supaya rekonsiliasi shift (`CashierShiftController::
buildSummary()`) otomatis mendeteksinya — sistem itu filter berdasar
`user_id`+`store_id`+`branch_id`+`status=completed`+rentang waktu shift,
BUKAN `cashier_shift_id`, jadi tidak perlu logic tambahan di sisi shift.

```php
public function purchaseMembership(Request $request, Customer $customer)
{
    $this->ensureSameStore($customer);
    $storeId = session('current_store_id');
    $branchId = session('current_branch_id') ?? session('branch_id');
    $user = $request->user();

    abort_unless($user->can('shift.open') === false || $this->getActiveShiftId($storeId, $user->id), 422,
        'Buka shift kasir terlebih dahulu.');

    $validated = $request->validate([
        'membership_id' => ['required', Rule::exists('memberships', 'id')->where('store_id', $storeId)],
        'payment_method_id' => 'required_without:is_pg|nullable|exists:payment_methods,id',
        'is_pg' => 'nullable|boolean',
        'pg_provider' => 'required_if:is_pg,true|nullable|string',
        'pg_payment_type' => 'required_if:is_pg,true|nullable|string',
    ]);

    $membership = Membership::where('store_id', $storeId)
        ->where('is_sellable_at_pos', true)
        ->where('is_active', true)
        ->findOrFail($validated['membership_id']);

    $product = $membership->product;
    abort_if(! $product, 422, 'Produk membership belum tersinkron.');

    $now = now();
    $prefix = 'SL-'.$now->format('Ymd').'-';
    $last = Sale::where('sale_no', 'like', $prefix.'%')->orderByDesc('sale_no')->first();
    $seq = $last ? (int) substr($last->sale_no, -3) + 1 : 1;
    $saleNo = $prefix.str_pad($seq, 3, '0', STR_PAD_LEFT);

    $isPg = $request->boolean('is_pg');

    $sale = Sale::create([
        'store_id' => $storeId,
        'branch_id' => $branchId,
        'customer_id' => $customer->id,
        'user_id' => $user->id,
        'cashier_shift_id' => $this->getActiveShiftIdForShift($storeId, $user->id),
        'sale_no' => $saleNo,
        'sale_date' => $now,
        'pos_mode' => $this->resolveStoreType(),
        'order_type' => 'membership_purchase',
        'subtotal' => $membership->price,
        'grand_total' => $membership->price,
        'paid_amount' => $isPg ? 0 : $membership->price,
        'change_amount' => 0,
        'status' => $isPg ? 'pending' : 'completed',
        'payment_status' => $isPg ? 'pending' : 'paid',
        'notes' => "Pembelian membership {$membership->name}",
    ]);

    SaleItem::create([
        'sale_id' => $sale->id,
        'product_id' => $product->id,
        'quantity' => 1,
        'price' => $membership->price,
        'subtotal' => $membership->price,
    ]);

    if ($isPg) {
        // Reuse endpoint PG yang sudah ada — tidak duplikasi logic gateway.
        return app(PaymentGatewayController::class)->createTransaction(
            new Request([
                'sale_id' => $sale->id,
                'provider' => $validated['pg_provider'],
                'payment_type' => $validated['pg_payment_type'],
                'amount' => $membership->price,
            ]),
        );
    }

    SalePayment::create([
        'sale_id' => $sale->id,
        'payment_method_id' => $validated['payment_method_id'],
        'paid_at' => $now,
        'amount' => $membership->price,
        'paid_amount' => $membership->price,
        'change_amount' => 0,
    ]);

    return back()->with('success', "Membership {$membership->name} berhasil dibeli.");
}
```

Catatan:
- `getActiveShiftIdForShift()` — pakai helper yang sama seperti
  `KasirController::getActiveShiftId()`, extract jadi trait/helper bersama
  atau duplikasi kecil sesuai pola yang sudah ada di codebase
  (`CashierShiftController` juga punya versi sendiri).
- Untuk jalur PG, `PaymentGatewayController::createTransaction()` yang sudah
  ada akan handle sisanya (callback, `finalizeSale()`) — TIDAK ada logic PG
  baru yang ditulis di sini.
- `SaleObserver::grantPurchasedMemberships()` (Task 2.2) otomatis jalan saat
  `Sale::create()` (langsung completed) ATAU saat PG callback update status
  jadi completed — satu logic, dua trigger, konsisten dengan pola loyalty
  points yang sudah ada.

## Task 2.4 — Route

File: `routes/web.php`, di dalam grup customers yang sudah ada:

```php
Route::post('/customers/{customer}/purchase-membership', [CustomerController::class, 'purchaseMembership'])
    ->middleware(['feature:membership', 'permission:sale.create'])
    ->name('customers.purchase-membership');
```

`permission:sale.create` dipakai (bukan `customer.edit`) karena ini
transaksi finansial nyata — harus permission yang sama dengan yang dipakai
kasir untuk transaksi normal.

## Task 2.5 — Update `MembershipController` validasi

File: `app/Http/Controllers/Admin/MembershipController.php`

Tambah ke `store()`/`update()`:

```php
'is_sellable_at_pos' => 'boolean',
'auto_tier_min_spend' => 'nullable|numeric|min:0',
'auto_tier_window_type' => 'nullable|in:day,month,year',
'auto_tier_window_value' => 'nullable|integer|min:1',
```

---

# Tahap 3 — Auto-Tier

## Task 3.1 — Service `AutoTierService`

File baru: `app/Services/AutoTierService.php`

Satu sumber logic, dipanggil dari `SaleObserver` (real-time) dan command
sapuan harian (Task 3.3) — supaya tidak duplikasi.

```php
<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\CustomerMembership;
use App\Models\Membership;
use Illuminate\Support\Carbon;

class AutoTierService
{
    public function evaluate(Customer $customer): void
    {
        $plans = Membership::where('store_id', $customer->store_id)
            ->whereNotNull('auto_tier_min_spend')
            ->where('is_active', true)
            ->get()
            ->sortByDesc(fn ($m) => $m->tierRank());

        $qualifiedPlan = null;

        foreach ($plans as $plan) {
            $windowStart = match ($plan->auto_tier_window_type) {
                'day' => now()->subDays($plan->auto_tier_window_value),
                'month' => now()->subMonths($plan->auto_tier_window_value),
                'year' => now()->subYears($plan->auto_tier_window_value),
                default => null,
            };

            if (! $windowStart) {
                continue;
            }

            $totalSpend = $customer->sales()
                ->where('status', 'completed')
                ->where('sale_date', '>=', $windowStart)
                ->sum('grand_total');

            if ($totalSpend >= $plan->auto_tier_min_spend) {
                $qualifiedPlan = $plan;
                break; // sudah diurutkan rank tertinggi dulu
            }
        }

        $currentAutoTier = $customer->memberships()->active()->autoTier()->first();

        if (! $qualifiedPlan) {
            $currentAutoTier?->update(['status' => 'cancelled']);
            $customer->syncTierFromMembership();

            return;
        }

        if ($currentAutoTier?->membership_id === $qualifiedPlan->id) {
            return; // tidak berubah
        }

        $currentAutoTier?->update(['status' => 'cancelled']);

        CustomerMembership::create([
            'customer_id' => $customer->id,
            'membership_id' => $qualifiedPlan->id,
            'start_date' => now(),
            'expired_date' => $qualifiedPlan->calculateExpiry(now()),
            'status' => 'active',
            'source' => 'auto_tier',
        ]);

        $customer->syncTierFromMembership();
    }
}
```

## Task 3.2 — Panggil dari `SaleObserver`

File: `app/Observers/SaleObserver.php`

Tambah panggilan di `awardLoyaltyIfCompleted()` (atau method terpisah
dipanggil bareng), setelah update `total_spent`:

```php
app(AutoTierService::class)->evaluate($customer);
```

## Task 3.3 — Command sapuan harian

```bash
php artisan make:command CheckExpiredMemberships
php artisan make:command SweepAutoTier
```

File: `app/Console/Commands/CheckExpiredMemberships.php`

```php
protected $signature = 'membership:check-expired';
protected $description = 'Tandai customer_memberships yang sudah lewat expired_date jadi status expired';

public function handle(): int
{
    $count = CustomerMembership::where('status', 'active')
        ->whereNotNull('expired_date')
        ->where('expired_date', '<', now())
        ->update(['status' => 'expired']);

    $this->info("Done: {$count} membership ditandai expired.");
    Log::channel('daily')->info("[membership:check-expired] Expired={$count}");

    return self::SUCCESS;
}
```

File: `app/Console/Commands/SweepAutoTier.php`

```php
protected $signature = 'membership:sweep-auto-tier';
protected $description = 'Re-evaluasi auto-tier semua customer di toko yang punya plan auto-tier aktif';

public function handle(AutoTierService $service): int
{
    $storeIds = Membership::whereNotNull('auto_tier_min_spend')->distinct()->pluck('store_id');
    $count = 0;

    Customer::whereIn('store_id', $storeIds)->each(function ($customer) use ($service, &$count) {
        $service->evaluate($customer);
        $count++;
    });

    $this->info("Done: {$count} customer dievaluasi ulang.");

    return self::SUCCESS;
}
```

## Task 3.4 — Registrasi scheduler

File: `routes/console.php`

```php
Schedule::command('membership:check-expired')->daily();
Schedule::command('membership:sweep-auto-tier')->dailyAt('01:00');
```

## Task 3.5 — Frontend: form Auto-Tier di Membership

File: `resources/js/Pages/Admin/Memberships/Index.jsx`

Tambah ke `useForm` initial state: `is_sellable_at_pos: false,
auto_tier_min_spend: "", auto_tier_window_type: "", auto_tier_window_value:
""`. Tambah section baru di modal, sesudah blok "Setara Tier" yang sudah
ada:

```jsx
<label className="flex items-center gap-3">
    <input type="checkbox" checked={data.is_sellable_at_pos}
        onChange={(e) => setData("is_sellable_at_pos", e.target.checked)} />
    <span className="text-sm text-foreground">Bisa dijual prabayar ke pelanggan</span>
</label>

<div className="rounded-xl border border-border p-4 space-y-3">
    <p className="text-sm font-semibold text-foreground">Auto-Tier (opsional)</p>
    <p className="text-xs text-muted-foreground">
        Pelanggan otomatis naik ke tier ini kalau belanjanya melewati ambang berikut.
        Kosongkan untuk menonaktifkan.
    </p>
    <CurrencyInput
        value={data.auto_tier_min_spend}
        onChange={(v) => setData("auto_tier_min_spend", v)}
        placeholder="Ambang belanja, cth. 2000000"
    />
    <div className="grid grid-cols-2 gap-3">
        <SearchableSelect
            options={[
                { id: "day", name: "Hari" },
                { id: "month", name: "Bulan" },
                { id: "year", name: "Tahun" },
            ]}
            value={data.auto_tier_window_type}
            onChange={(v) => setData("auto_tier_window_type", v)}
            placeholder="Satuan window..."
        />
        <input type="number" min={1} value={data.auto_tier_window_value}
            onChange={(e) => setData("auto_tier_window_value", e.target.value)}
            className={inp(errors.auto_tier_window_value)} placeholder="Nilai, cth. 30" />
    </div>
</div>
```

Update juga `useEffect` prefill saat `editing` dan `transform()` di
`handleSubmit` (kosongkan jadi `null` kalau field ambang tidak diisi).

---

# Tahap 4 — Diskon Membership di Transaksi Selanjutnya

## Task 4.1 — Tes regresi DULU sebelum ubah apa pun

File baru: `tests/Feature/PromotionCartCalculationBaselineTest.php`

Tulis test yang mengunci perilaku `PromotionService::findBestCartPromo()`
dan `applyPromosToCart()` SAAT INI (sebelum ada perubahan) — supaya kalau
Task 4.2 merusak sesuatu, ketahuan langsung. Cakup minimal: promo tier-gated
tetap match, promo percentage/fixed_amount tetap terhitung benar tanpa
membership sama sekali.

## Task 4.2 — Integrasi discount_percent sebagai kandidat promo virtual

File: `app/Services/PromotionService.php`

Tambah method baru, dipanggil dari `KasirController::store()` sebagai
kandidat tambahan yang dibandingkan bareng promo asli — pilih yang paling
menguntungkan pelanggan, TIDAK ditumpuk:

```php
public function membershipDiscountCandidate(?Customer $customer, float $cartSubtotal): ?array
{
    $activeMembership = $customer?->activeMembership();
    $discountPercent = (float) ($activeMembership?->membership?->discount_percent ?? 0);

    if ($discountPercent <= 0) {
        return null;
    }

    return [
        'discount' => round($cartSubtotal * ($discountPercent / 100), 2),
        'source' => 'membership',
        'membership_id' => $activeMembership->membership_id,
    ];
}
```

File: `app/Http/Controllers/Admin/KasirController.php`, di `store()`, pada
blok `$cartPromoResult = $promoEnabled ? $promoService->findBestCartPromo(...)
: null;` — tambahkan perbandingan:

```php
$membershipCandidate = $promoService->membershipDiscountCandidate($customerForPromo, $subtotal);

if ($membershipCandidate && (! $cartPromoResult || $membershipCandidate['discount'] > $cartPromoResult['discount'])) {
    $cartPromoDiscount = $membershipCandidate['discount'];
    $cartPromoId = null; // bukan Promotion model, jangan increment used_count
} else {
    $cartPromoDiscount = $cartPromoResult['discount'] ?? 0;
    $cartPromoId = $cartPromoResult['promotion']->id ?? null;
}
```

**PENTING**: ini menyentuh method `store()` yang sudah kompleks dan
kritikal (checkout utama). Ubah SEMINIMAL mungkin, jalankan
`PromotionCartCalculationBaselineTest` (Task 4.1) tiap kali setelah
perubahan kecil, jangan gabung dengan perubahan lain dalam commit yang sama.

## Task 4.3 — Test integrasi diskon membership

File baru: `tests/Feature/MembershipDiscountAtCheckoutTest.php`

1. Customer punya membership aktif dengan `discount_percent=10`, belanja
   tanpa promo lain aktif → grand_total terpotong 10%.
2. Customer punya membership DAN qualify promo cart lain yang lebih besar →
   sistem pilih yang lebih besar, tidak ditumpuk.
3. Customer tanpa membership aktif → tidak ada diskon membership diterapkan.

---

# Tahap 5 — Guard Hapus Produk (Bonus Fix)

## Task 5.1 — Guard di `ProductController::destroy()`

File: `app/Http/Controllers/Admin/ProductController.php`

```php
public function destroy(Product $product)
{
    if ($product->type === 'membership') {
        return back()->with('error',
            'Produk membership tidak bisa dihapus langsung. Nonaktifkan lewat halaman Membership.');
    }

    if ($product->saleItems()->exists()) {
        return back()->with('error',
            'Produk sudah pernah terjual, tidak bisa dihapus. Nonaktifkan saja agar riwayat transaksi tetap aman.');
    }

    $product->delete();

    return redirect()->route('admin.products.index')->with('success', 'Produk berhasil dihapus.');
}
```

## Task 5.2 — Exclude produk membership dari katalog

File: `app/Http/Controllers/Admin/ProductController.php`, di `index()`:

```php
$query = Product::forStore($storeId)->where('type', '!=', 'membership')->with([...]);
```

## Task 5.3 — Exclude dari grid Kasir (defense-in-depth)

File: `app/Http/Controllers/Admin/KasirController.php`, di `index()`:

```php
$products = Product::forStore($storeId)
    ->where('is_active', true)
    ->where('is_sellable', true) // produk membership sudah is_sellable=false, otomatis tidak lolos
    ...
```

Tidak perlu filter tambahan — `is_sellable = false` di Task 1.3 sudah cukup,
konsisten dengan filter yang sudah ada.

## Task 5.4 — Test guard

File baru: `tests/Feature/ProductDeleteGuardTest.php`

1. Produk `type='membership'` tidak bisa dihapus → response error, produk
   masih ada di DB.
2. Produk biasa yang sudah punya `sale_items` tidak bisa dihapus → response
   error.
3. Produk biasa yang belum pernah terjual tetap bisa dihapus seperti biasa
   (regresi check).

---

# Tahap 6 — Frontend: Beli Prabayar di Customer Show

## Task 6.1 — Ambil data pendukung di `CustomerController::show()`

File: `app/Http/Controllers/Admin/CustomerController.php`, di `show()`,
tambah props baru:

```php
'sellableMemberships' => Membership::where('store_id', $storeId)
    ->where('is_sellable_at_pos', true)->where('is_active', true)->get(),
'paymentMethods' => PaymentMethod::forStore($storeId)->active()->get(),
'pgMethods' => $this->getActivePgMethodsPublic(), // extract dari KasirController atau duplikasi kecil
'activeShift' => CashierShift::where('store_id', $storeId)
    ->where('user_id', auth()->id())->where('status', 'open')->first(),
'canOpenShift' => auth()->user()->can('shift.open'),
```

## Task 6.2 — Komponen `PurchaseMembershipModal.jsx`

File baru: `resources/js/Pages/Admin/Customers/PurchaseMembershipModal.jsx`

- Reuse `ShiftModal.jsx` dari Kasir (import langsung dari
  `@/Pages/Admin/Kasir/components/modals/ShiftModal`) untuk kondisi belum
  ada shift aktif — kondisi tampil: `!activeShift && canOpenShift`, sama
  seperti pola `blockedByShift` di `KasirLayout.jsx`.
- Dropdown pilih plan (dari `sellableMemberships`, `SearchableSelect`).
- Tab pilih metode bayar: "Langsung" (grid `paymentMethods`, mirror
  `PaymentMethodCards.jsx`) vs "Payment Gateway" (grid `pgMethods`, mirror
  `GatewayPanel.jsx` — reuse komponen kalau strukturnya cukup generic,
  kalau tidak, tulis versi ringkas khusus modal ini).
- Submit ke `route("admin.customers.purchase-membership", customer.id)`.

## Task 6.3 — Integrasi ke `Customers/Show.jsx`

File: `resources/js/Pages/Admin/Customers/Show.jsx`

Di card "Aktifkan Membership" yang sudah ada, ubah jadi tab:
- Tab "Gratis / Manual" — form yang sudah ada sekarang.
- Tab "Beli Prabayar" — buka `PurchaseMembershipModal`.

Kondisi tampil tab "Beli Prabayar": hanya kalau `sellableMemberships.length >
0` DAN store punya feature `membership` aktif.

## Task 6.4 — Kolom "Sumber" di riwayat membership

File: `resources/js/Pages/Admin/Customers/Show.jsx`, di tabel "Riwayat
Membership" yang sudah ada, tambah kolom baru menampilkan `source` (mapping
`manual`→"Manual", `purchase`→"Dibeli", `auto_tier`→"Otomatis").

---

# Tahap 7 — Test Akhir & Verifikasi

## Task 7.1 — Test baru yang wajib ada

| File | Cakupan |
|---|---|
| `ProductMembershipSyncTest.php` | Toggle `is_sellable_at_pos` bikin/nonaktifkan Product otomatis, harga ikut sinkron saat Membership diupdate |
| `PurchaseMembershipCashTest.php` | Beli prabayar metode langsung → Sale completed, SalePayment tercatat, CustomerMembership `source=purchase` tercipta |
| `PurchaseMembershipExtendTest.php` | Beli plan yang sama saat masih aktif → expired_date extend, bukan reset |
| `PurchaseMembershipRequiresShiftTest.php` | Tanpa shift aktif → request ditolak dengan pesan jelas |
| `AutoTierUpgradeTest.php` | Belanja tembus ambang → CustomerMembership `source=auto_tier` tercipta, tier customer naik |
| `AutoTierDowngradeTest.php` | Belanja turun di bawah ambang → baris `auto_tier` di-cancel, TIDAK menyentuh baris `manual`/`purchase` yang aktif |
| `AutoTierDoesNotOverrideManualTest.php` | Customer punya membership manual tier tinggi, auto-tier cuma qualify tier rendah → tier final tetap yang tinggi (rank tertinggi menang) |
| `MembershipExpiryCommandTest.php` | Command `membership:check-expired` menandai baris lewat tanggal jadi status expired, semua source |
| `SweepAutoTierCommandTest.php` | Command `membership:sweep-auto-tier` re-evaluasi customer tanpa transaksi baru |
| `PromotionCartCalculationBaselineTest.php` | Baseline sebelum Task 4.2 (lihat Task 4.1) |
| `MembershipDiscountAtCheckoutTest.php` | Diskon membership vs promo lain, ambil yang terbesar |
| `ProductDeleteGuardTest.php` | Guard hapus produk membership & produk yang sudah terjual |

## Task 7.2 — Verifikasi penuh

```bash
php artisan migrate --no-interaction
vendor/bin/pint --dirty --format agent
php artisan test --compact
npm run build
```

Target: 0 regresi dari baseline test suite yang sudah ada (200 passed
sebelum tahap ini dimulai).

---

# Urutan Eksekusi

```
Tahap 1 (DB + Model dasar)
    ↓
Tahap 5 (guard hapus produk — independen, kerjakan sekalian selagi di area Product)
    ↓
Tahap 2 (beli prabayar: observer → endpoint → route)
    ↓
Tahap 6 (frontend beli prabayar, butuh endpoint Tahap 2 selesai)
    ↓
Tahap 3 (auto-tier: service → observer hook → command → scheduler → frontend form)
    ↓
Tahap 4 (diskon membership di checkout — PALING SENSITIF, kerjakan TERAKHIR
         setelah semua lain stabil, baseline test dulu sebelum ubah kode)
    ↓
Tahap 7 (test akhir + verifikasi penuh)
```

Catatan eksekusi:
- Tahap 4 sengaja ditaruh paling akhir karena menyentuh
  `KasirController::store()` yang jadi jantung checkout — risiko regresi
  paling tinggi di seluruh rencana ini. Jangan gabung dengan perubahan lain.
- Tiap tahap harus `php artisan test --compact` lulus sebelum lanjut ke
  tahap berikutnya — jangan tumpuk banyak tahap lalu baru test di akhir.
- `vendor/bin/pint --dirty` dijalankan setiap habis edit file PHP, bukan
  cuma di akhir (mengikuti konvensi project).
</content>
