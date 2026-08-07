<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Concerns\FinalizesSaleStock;
use App\Http\Controllers\Concerns\HasStoreScope;
use App\Http\Controllers\Concerns\ManagesTableStatus;
use App\Http\Controllers\Concerns\ResolvesPgMethods;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\CafeTable;
use App\Models\CashierShift;
use App\Models\Category;
use App\Models\Customer;
use App\Models\CustomerDebtLog;
use App\Models\CustomerPointLog;
use App\Models\CustomerTier;
use App\Models\Employee;
use App\Models\EmployeeCommission;
use App\Models\Membership;
use App\Models\PaymentGatewayTransaction;
use App\Models\PaymentMethod;
use App\Models\Product;
use App\Models\ProductStock;
use App\Models\Promotion;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\SalePayment;
use App\Models\StockMovement;
use App\Models\Store;
use App\Services\CashRoundingService;
use App\Services\MembershipBenefitService;
use App\Services\PromotionService;
use App\Services\Stock\StockMutation;
use App\Services\Stock\StockService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class KasirController extends Controller
{
    use FinalizesSaleStock, HasStoreScope, ManagesTableStatus, ResolvesPgMethods;

    public function index()
    {
        /** @var User $user */
        $user = Auth::user();
        [$storeId, $branchId] = $this->storeScope();
        $store =
            $user->stores()->with('storeType')->find($storeId) ??
            $user->stores()->with('storeType')->first();
        $storeTypeCode = $store?->getRelation('storeType')?->code ?? 'retail';

        // Load relations needed for hasFeature() gate check
        $store?->load(['planModel.features', 'storeFeatures.feature']);

        $products = Product::forStore($storeId)
            ->where('is_active', true)
            ->where('is_sellable', true)
            ->select([
                'id', 'store_id', 'category_id', 'supplier_id',
                'name', 'sku', 'barcode', 'type', 'image',
                'unit', 'base_unit', 'base_unit_conversion',
                'sell_price', 'cost_price',
                'stock_minimum', 'track_stock', 'is_active', 'is_sellable',
                'is_variant', 'sell_base', 'preparation_time',
            ])
            ->with([
                'category:id,name',
                'variants:id,product_id,name,sku,price,cost_price,is_active',
                'variants.priceTiers',
                'variants.packagingUnits',
                'modifierGroups.modifiers',
                'recipes.rawMaterial:id,name,unit,base_unit,cost_price',
                'stocks' => fn ($q) => $q->where('store_id', $storeId)
                    ->when($branchId, fn ($sq) => $sq->where('branch_id', $branchId)),
                'packagingUnits' => fn ($q) => $q->where('sell_price', '>', 0),
                'priceTiers',
            ])
            ->get()
            ->map(function ($p) use ($storeId, $branchId) {
                // Bucket base produk (variant_id=null, packaging_unit_id=null) —
                // ini stok yang dipakai untuk produk simple tanpa variant/unit.
                $baseStocks = $p->stocks->filter(
                    fn ($s) => $s->variant_id === null && $s->packaging_unit_id === null,
                );
                $p->stock =
                    $baseStocks->sum('quantity') -
                    $baseStocks->sum('reserved_quantity');

                // Stok per variant (bucket variant_id=X, packaging_unit_id=null)
                $p->variants->each(function ($v) use ($p) {
                    $variantStocks = $p->stocks->filter(
                        fn ($s) => $s->variant_id === $v->id && $s->packaging_unit_id === null,
                    );
                    $v->stock = $variantStocks->sum('quantity') - $variantStocks->sum('reserved_quantity');

                    // Stok per packaging unit milik variant ini
                    $v->packagingUnits->each(function ($u) use ($p) {
                        $unitStocks = $p->stocks->filter(
                            fn ($s) => $s->packaging_unit_id === $u->id,
                        );
                        $u->stock = $unitStocks->sum('quantity') - $unitStocks->sum('reserved_quantity');
                    });
                });

                // Stok per packaging unit level produk (tanpa variant)
                $p->packagingUnits->each(function ($u) use ($p) {
                    $unitStocks = $p->stocks->filter(
                        fn ($s) => $s->packaging_unit_id === $u->id,
                    );
                    $u->stock = $unitStocks->sum('quantity') - $unitStocks->sum('reserved_quantity');
                });

                // Sertakan stok bahan baku agar frontend bisa cek kecukupan
                $p->recipes->each(function ($r) use ($storeId, $branchId) {
                    if ($r->rawMaterial) {
                        $r->rawMaterial->current_stock = $r->rawMaterial
                            ->stocks()
                            ->where('store_id', $storeId)
                            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
                            ->sum('quantity');
                    }
                });
                unset($p->stocks);

                return $p;
            });

        $categories = Category::forStore($storeId)
            ->withCount([
                'products' => fn ($q) => $q
                    ->where('is_active', true)
                    ->where('is_sellable', true),
            ])
            ->get(['id', 'name', 'products_count']);

        $paymentMethods = PaymentMethod::forStore($storeId)
            ->active()
            ->when(! $store->hasFeature('debt'), fn ($q) => $q->where('type', '!=', 'debt'))
            ->orderBy('sort_order')
            ->orderBy('type')
            ->get(['id', 'code', 'name', 'type', 'provider', 'image', 'account_number', 'account_name']);

        // Active promotions with their associated products
        // Gate check: skip if promo feature is disabled for this store
        $promotions = $store->hasFeature('promo')
            ? Promotion::forStore($storeId)
                ->where('is_active', true)
                ->where(function ($q) {
                    $q->whereNull('start_date')->orWhere('start_date', '<=', now());
                })
                ->where(function ($q) {
                    $q->whereNull('end_date')->orWhere('end_date', '>=', now());
                })
                ->where(function ($q) {
                    $q->whereNull('start_hour')->orWhere(
                        'start_hour',
                        '<=',
                        now()->format('H:i'),
                    );
                })
                ->where(function ($q) {
                    $q->whereNull('end_hour')->orWhere(
                        'end_hour',
                        '>=',
                        now()->format('H:i'),
                    );
                })
                ->with(['products:id', 'freeProduct:id,sell_price'])
                ->get([
                    'id',
                    'code',
                    'name',
                    'type',
                    'scope',
                    'discount_value',
                    'min_purchase_amount',
                    'max_discount_amount',
                    'min_quantity',
                    'tier_price',
                    'customer_tier',
                    'start_hour',
                    'end_hour',
                    'free_product_id',
                ])
            : collect();

        $customers = Customer::where('store_id', $storeId)
            ->orderBy('name')
            ->with('customerTier:id,name,rank,color')
            ->get([
                'id',
                'code',
                'name',
                'phone',
                'tier',
                'customer_tier_id',
                'points',
                'total_spent',
                'debt_balance',
                'credit_limit',
            ]);

        // Meja + order yang sedang berjalan di atasnya, supaya floor map bisa
        // menampilkan meja mana memegang order apa (bukan cuma warna status).
        $tables = [];
        if (in_array($storeTypeCode, ['fnb', 'hospitality'])) {
            // Reservasi hari ini yang belum lewat, dikelompokkan per meja.
            //
            // Sengaja dihitung saat render, BUKAN dengan menulis status
            // 'reserved' ke cafe_tables. Kolom status itu punya satu penulis
            // (syncTableStatus) yang menurunkannya dari order; menambah
            // penulis kedua mengembalikan pola yang dulu membuat meja
            // nyangkut. Cara ini juga bebas dari status basi — booking yang
            // dibatalkan langsung hilang, dan booking untuk besok tidak
            // memblokir meja hari ini.
            $bookingsByTable = Booking::where('store_id', $storeId)
                ->where('resource_type', 'table')
                ->whereNotNull('resource_id')
                ->whereIn('status', ['pending', 'confirmed', 'checked_in'])
                ->whereDate('booking_start_at', Carbon::today())
                ->where(function ($q) {
                    $q->where('booking_end_at', '>=', now())
                        ->orWhereNull('booking_end_at');
                })
                ->orderBy('booking_start_at')
                ->get(['id', 'booking_no', 'resource_id', 'customer_name', 'guest_count', 'booking_start_at', 'status'])
                ->groupBy('resource_id');

            $tables = CafeTable::where('store_id', $storeId)
                ->where('branch_id', $branchId)
                ->where('is_active', true)
                ->with('activeSale')
                ->orderBy('table_number')
                ->get(['id', 'table_number', 'capacity', 'status'])
                ->map(fn ($t) => [
                    'id' => $t->id,
                    'table_number' => $t->table_number,
                    'capacity' => $t->capacity,
                    'status' => $t->status,
                    'upcoming_booking' => ($b = $bookingsByTable->get($t->id)?->first()) ? [
                        'id' => $b->id,
                        'booking_no' => $b->booking_no,
                        'customer_name' => $b->customer_name,
                        'guest_count' => $b->guest_count,
                        'status' => $b->status,
                        'time' => $b->booking_start_at->format('H:i'),
                    ] : null,
                    'active_sale' => $t->activeSale ? [
                        'id' => $t->activeSale->id,
                        'sale_no' => $t->activeSale->sale_no,
                        'kitchen_status' => $t->activeSale->kitchen_status,
                        'grand_total' => (float) $t->activeSale->grand_total,
                        'guest_count' => $t->activeSale->guest_count,
                    ] : null,
                ]);
        }

        // Antrian dapur untuk widget di POS. Filternya sengaja disamakan
        // dengan KitchenController::index() supaya kasir dan layar dapur
        // tidak pernah menampilkan daftar yang berbeda.
        $kitchenQueue = [];
        if ($storeTypeCode === 'fnb') {
            $kitchenQueue = Sale::where('store_id', $storeId)
                ->where('branch_id', $branchId)
                ->where('pos_mode', 'fnb')
                ->whereIn('kitchen_status', ['pending', 'cooking', 'ready'])
                ->whereDate('sale_date', Carbon::today())
                ->with(['table:id,table_number', 'items:id,sale_id,product_id,quantity', 'items.product:id,name'])
                ->orderBy('sale_date')
                ->limit(10)
                ->get(['id', 'sale_no', 'table_id', 'order_type', 'kitchen_status', 'sale_date'])
                ->map(fn ($s) => [
                    'id' => $s->id,
                    'sale_no' => $s->sale_no,
                    'table' => $s->table?->table_number
                        ?? ($s->order_type === 'delivery' ? 'DEL' : 'TA'),
                    'status' => $s->kitchen_status,
                    'items' => $s->items
                        ->map(fn ($i) => ($i->product?->name ?? 'Item').' ×'.(int) $i->quantity)
                        ->implode(', '),
                    'minutes' => $s->sale_date
                        ? (int) $s->sale_date->diffInMinutes(now())
                        : null,
                ]);
        }

        // Hanya untuk mode service/ticket — kirim daftar karyawan aktif
        $employees = [];
        if (in_array($storeTypeCode, ['service', 'ticket'])) {
            $employees = Employee::where('store_id', $storeId)
                ->where('status', 'active')
                ->orderBy('name')
                ->get([
                    'id',
                    'name',
                    'position',
                    'commission_type',
                    'commission_value',
                ]);
        }

        // Today's transactions (last 20) for history panel
        $todaySales = Sale::where('store_id', $storeId)
            ->where('branch_id', $branchId)
            ->whereDate('sale_date', Carbon::today())
            ->with(['customer:id,name', 'payments.paymentMethod:id,name', 'splitPayers:id,sale_id,status'])
            ->orderByDesc('sale_date')
            ->limit(20)
            ->get([
                'id',
                'sale_no',
                'grand_total',
                'paid_amount',
                'payment_status',
                'order_type',
                'sale_date',
                'customer_id',
                'status',
                'split_status',
                'is_split_stale',
                // Dipakai untuk menghitung batas waktu ganti metode pembayaran,
                // harus sama dengan field yang divalidasi di updatePayment().
                'created_at',
            ]);

        // Check for active shift
        $activeShift = CashierShift::where('store_id', $storeId)
            ->where('user_id', $user->id)
            ->where('status', 'open')
            ->first();

        // Query active pending sale & PG transaction for page refresh recovery
        $pendingSale = null;
        $pendingPgTransaction = null;

        if ($user) {
            $pendingSale = Sale::with(['items.product:id,name'])
                ->where('store_id', $storeId)
                ->where('user_id', $user->id)
                ->where('status', 'pending')
                ->orderByDesc('id')
                ->first();

            if ($pendingSale) {
                $pendingPgTransaction = PaymentGatewayTransaction::where('sale_id', $pendingSale->id)
                    ->whereNull('sale_split_payer_id')
                    ->whereIn('status', ['initiating', 'pending', 'unknown', 'checking'])
                    ->latest('id')
                    ->first();
            }
        }

        // NOTE: order type per store type SEKARANG hanya bersumber dari
        // resources/js/Pages/Admin/Kasir/config/posModes.js (frontend).
        // StoreType::order_types di database tidak dipakai untuk render POS —
        // dulu dikirim sebagai prop 'orderTypes' tapi tidak pernah dikonsumsi
        // oleh useKasir.js, jadi dihapus supaya tidak jadi dead output yang
        // menyesatkan. Kalau nanti ada kebutuhan admin bisa kustomisasi order
        // type per toko dari database, sinkronkan dulu dengan posModes.js.

        // Map store type to the correct Inertia page component.
        // Retail uses the new dedicated mode page; others fall back to the
        // generic Kasir page for now (will be migrated one by one).
        $modePages = [
            'retail' => 'Admin/Kasir/modes/RetailKasir',
            'fnb' => 'Admin/Kasir/modes/FnBKasir',
            'service' => 'Admin/Kasir/modes/ServiceKasir',
            'rental' => 'Admin/Kasir/modes/RentalKasir',
            'ticket' => 'Admin/Kasir/modes/TicketKasir',
            'hospitality' => 'Admin/Kasir/modes/HospitalityKasir',
            'parking' => 'Admin/Kasir/modes/ParkingKasir',
            'session' => 'Admin/Kasir/modes/SessionKasir',
        ];

        $page = $modePages[$storeTypeCode] ?? 'Admin/Kasir/modes/RetailKasir';

        return Inertia::render($page, [
            'products' => $products,
            'categories' => $categories,
            'paymentMethods' => $paymentMethods,
            'promotions' => $promotions,
            'initialCustomers' => $customers,
            'tables' => $tables,
            'kitchenQueue' => $kitchenQueue,
            'todaySales' => $todaySales,
            'storeType' => $storeTypeCode,
            'posMode' => $storeTypeCode,
            'storeName' => $store?->name ?? '',
            'receiptFooter' => $store?->receipt_footer ?? '',
            'receiptHeader' => $store?->receipt_header ?? '',
            'storeAddress' => $store?->address ?? '',
            'storePhone' => $store?->phone ?? '',
            'storeLogo' => $store?->logo ? "/storage/{$store->logo}" : null,
            'defaultTaxRate' => (float) ($store?->default_tax_rate ?? 0),
            'taxInclusive' => (bool) ($store?->tax_inclusive ?? false),
            'currency' => $store?->currency ?? 'IDR',
            'decimalPlaces' => (int) ($store?->decimal_places ?? 0),
            'paymentEditLimitMinutes' => $store?->paymentEditLimitMinutes(),
            'paymentEditLimitLabel' => $store?->paymentEditLimitLabel(),
            'pgMethods' => $this->getActivePgMethods($storeId),
            'activeShift' => $activeShift,
            'employees' => $employees,
            'sellableMemberships' => $store->hasFeature('membership')
                ? Membership::where('store_id', $storeId)
                    ->where('is_sellable_at_pos', true)
                    ->where('is_active', true)
                    ->with('product:id,membership_id,sell_price,is_active')
                    ->get(['id', 'name', 'price', 'duration_type', 'duration_value', 'maps_to_tier', 'maps_to_tier_id'])
                : collect(),
            'customerTiers' => CustomerTier::forStore($storeId)->ranked()->get(['id', 'name', 'rank', 'color']),
            // Benefit member aktif, dipetakan per customer_id. Kasir memakainya
            // untuk preview total agar angka di layar sama dengan hitungan
            // server saat checkout.
            'membershipBenefits' => $store->hasFeature('membership')
                ? app(MembershipBenefitService::class)
                    ->summaryForCustomers($customers->pluck('id')->all())
                : [],
            'pendingSale' => $pendingSale ? [
                'sale_id' => $pendingSale->id,
                'sale_no' => $pendingSale->sale_no,
                'grand_total' => (float) $pendingSale->grand_total,
                'items' => $pendingSale->items->map(fn ($i) => [
                    'productId' => $i->product_id,
                    'variantId' => $i->variant_id,
                    'quantity' => (float) $i->quantity,
                    'price' => (float) $i->price,
                    'name' => $i->product?->name ?? 'Item',
                ])->toArray(),
            ] : null,
            'pendingPgTransaction' => $pendingPgTransaction ? [
                'pg_trx_id' => $pendingPgTransaction->id,
                'payment_type' => $pendingPgTransaction->payment_type,
                'status' => $pendingPgTransaction->status,
                'amount' => (float) $pendingPgTransaction->amount,
                'can_retry' => $pendingPgTransaction->isRetryable(),
                'qr_code' => $pendingPgTransaction->raw_response['qr_code']
                    ?? $pendingPgTransaction->raw_response['qr_string']
                    ?? null,
                'qr_image_url' => $pendingPgTransaction->raw_response['qr_image_url']
                    ?? $pendingPgTransaction->raw_response['qr_url']
                    ?? null,
                'va_number' => $pendingPgTransaction->raw_response['va_numbers'][0]['va_number']
                    ?? $pendingPgTransaction->raw_response['permata_va_number']
                    ?? $pendingPgTransaction->raw_response['va_number']
                    ?? null,
                'va_bank' => $pendingPgTransaction->raw_response['va_numbers'][0]['bank']
                    ?? $pendingPgTransaction->raw_response['bank']
                    ?? null,
                'payment_url' => $pendingPgTransaction->raw_response['actions'][0]['url']
                    ?? $pendingPgTransaction->raw_response['payment_url']
                    ?? null,
            ] : null,
            'pointValue' => (float) ($store->point_value ?? 1000),
            'pointsPerAmount' => (float) ($store->points_per_amount ?? 0),
        ]);
    }

    /**
     * Pastikan harga tiap item yang dikirim kasir cocok dengan salah satu
     * harga valid produk: base price, tier price, harga variant, atau
     * harga packaging unit. Toleransi kecil (Rp 1) untuk pembulatan
     * floating point. Mencegah kasir mengirim harga sembarangan lewat
     * request langsung ke endpoint (bypass UI POS).
     */
    private function assertItemPricesValid(array $items, int $storeId): void
    {
        $productIds = collect($items)->pluck('product_id')->unique()->all();
        $products = Product::forStore($storeId)
            ->whereIn('id', $productIds)
            ->with(['variants.priceTiers', 'variants.packagingUnits', 'priceTiers', 'packagingUnits'])
            ->get()
            ->keyBy('id');

        foreach ($items as $item) {
            $product = $products->get($item['product_id']);
            if (! $product) {
                continue; // sudah divalidasi exists:products,id di rules
            }

            $qty = (int) ($item['quantity'] ?? 1);
            $sentPrice = round((float) $item['price'], 2);
            $variantId = $item['variant_id'] ?? null;
            $packagingUnitId = $item['packaging_unit_id'] ?? null;

            $validPrices = [];

            if ($packagingUnitId) {
                // Packaging unit — dari variant kalau ada, atau dari product langsung.
                $unit = $variantId
                    ? optional($product->variants->firstWhere('id', $variantId))->packagingUnits?->firstWhere('id', $packagingUnitId)
                    : $product->packagingUnits->firstWhere('id', $packagingUnitId);
                if ($unit) {
                    $validPrices[] = round((float) $unit->sell_price, 2);
                }
            } elseif ($variantId) {
                $variant = $product->variants->firstWhere('id', $variantId);
                if ($variant) {
                    $validPrices[] = round((float) $variant->price, 2);
                    $tierPrice = $variant->getTierPrice($qty);
                    if ($tierPrice !== null) {
                        $validPrices[] = round($tierPrice, 2);
                    }
                }
            } else {
                $validPrices[] = round((float) $product->sell_price, 2);
                $tierPrice = $product->getTierPrice($qty);
                if ($tierPrice !== null) {
                    $validPrices[] = round($tierPrice, 2);
                }
            }

            // Tidak ada harga valid yang bisa dicocokkan (mis. data relasi
            // tidak ditemukan) — lewati saja, biar tidak false-positive block.
            if (empty($validPrices)) {
                continue;
            }

            $matches = collect($validPrices)->contains(
                fn ($p) => abs($p - $sentPrice) < 1.0,
            );

            if (! $matches) {
                throw new \RuntimeException(
                    "Harga untuk \"{$product->name}\" tidak valid. Silakan muat ulang halaman kasir.",
                );
            }
        }
    }

    /** Dapatkan ID shift aktif user saat ini, atau null */
    private function getActiveShiftId(int $storeId, int $userId): ?int
    {
        return CashierShift::where('store_id', $storeId)
            ->where('user_id', $userId)
            ->where('status', 'open')
            ->value('id');
    }

    /**
     * Bangun array extra_data berisi field mode-specific.
     * Hanya isi key yang relevan dengan store_type saat ini.
     */
    private function buildExtraData(
        array $validated,
        ?string $storeType,
    ): ?array {
        $data = [];

        switch ($storeType) {
            case 'service':
            case 'ticket':
                if (! empty($validated['ticket_event'])) {
                    $data['employee_name'] = $validated['ticket_event'];
                }
                if (! empty($validated['ticket_slot'])) {
                    $data['booking_or_queue'] = $validated['ticket_slot'];
                }
                break;

            case 'rental':
                if (! empty($validated['rental_duration'])) {
                    $data['rental_duration'] =
                        (int) $validated['rental_duration'];
                    $data['rental_unit'] =
                        $validated['rental_unit'] ?? 'per_hour';
                }
                if (! empty($validated['room_number'])) {
                    $data['rental_unit_name'] = $validated['room_number'];
                }
                $data['rental_status'] = 'active';
                break;

            case 'hospitality':
                if (! empty($validated['room_number'])) {
                    $data['room_number'] = $validated['room_number'];
                }
                if (! empty($validated['guest_count'])) {
                    $data['guest_count'] = (int) $validated['guest_count'];
                }
                if (! empty($validated['rental_duration'])) {
                    $data['rental_duration'] =
                        (int) $validated['rental_duration'];
                    $data['rental_unit'] =
                        $validated['rental_unit'] ?? 'per_day';
                }
                $data['rental_status'] = 'active';
                break;

            case 'parking':
                // Parking data disimpan langsung ke kolom (plate_number, vehicle_type, entry_at)
                // Extra_data tidak perlu parking_status
                break;
        }

        return empty($data) ? null : $data;
    }

    /**
     * Terapkan field yang hanya relevan untuk mode FnB ke sale yang baru
     * dibuat: antrian dapur, jumlah tamu, dan asal order delivery.
     *
     * kitchen_status di-set untuk SEMUA order FnB tanpa melihat status
     * pembayaran. Dapur perlu tahu pesanan masuk sebelum dibayar — pelanggan
     * memesan dulu, membayar belakangan. Sebelumnya order yang menunggu
     * konfirmasi payment gateway (QRIS/e-wallet) tidak pernah dapat
     * kitchen_status sehingga tidak pernah muncul di Kitchen Display.
     */
    private function applyFnbFields(
        Sale $sale,
        array $validated,
        ?string $storeType,
    ): void {
        if ($storeType !== 'fnb') {
            return;
        }

        $update = ['kitchen_status' => 'pending'];

        if (! empty($validated['guest_count'])) {
            $update['guest_count'] = (int) $validated['guest_count'];
        }

        if (($validated['order_type'] ?? null) === 'delivery') {
            $update['delivery_platform'] = $validated['delivery_platform'] ?? null;
            $update['delivery_order_no'] = $validated['delivery_order_no'] ?? null;
        }

        $sale->update($update);
    }

    /**
     * Kurangi biaya kirim sesuai benefit gratis ongkir membership pelanggan.
     *
     * Mengembalikan nominal ongkir yang benar-benar ditagihkan. Perhitungan
     * ditaruh di server karena frontend tidak boleh menentukan sendiri berapa
     * subsidi yang berlaku.
     */
    private function applyMembershipShippingWaiver(
        ?Customer $customer,
        float $shippingAmount,
        float $subtotal,
    ): float {
        if (! $customer || $shippingAmount <= 0) {
            return $shippingAmount;
        }

        $waiver = app(MembershipBenefitService::class)
            ->shippingWaiver($customer, $shippingAmount, $subtotal);

        return $waiver ? $waiver['remaining'] : $shippingAmount;
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'idempotency_key' => 'nullable|string|max:100',
            'customer_id' => 'nullable|exists:customers,id',
            'table_id' => 'nullable|integer',
            'order_type' => 'required|string|max:30',
            'discount_amount' => 'nullable|numeric|min:0',
            'tax_amount' => 'nullable|numeric|min:0',
            'redeem_points' => 'nullable|integer|min:1',
            'notes' => 'nullable|string|max:500',
            'payments' => 'required|array|min:1',
            'payments.*.method_id' => 'required|exists:payment_methods,id',
            'payments.*.amount' => 'required|numeric|min:0.01',
            'payments.*.is_pg' => 'nullable|boolean',
            'payments.*.pg_provider' => 'nullable|string',
            'payments.*.pg_method' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.variant_id' => 'nullable|integer',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'required|numeric|min:0',
            'items.*.discount_amount' => 'nullable|numeric|min:0',
            'items.*.modifiers' => 'nullable|array',
            'items.*.notes' => 'nullable|string|max:255',
            'items.*.packaging_unit_id' => 'nullable|exists:product_packaging_units,id',
            'items.*.unit_name' => 'nullable|string|max:50',
            'items.*.unit_conversion_qty' => 'nullable|integer|min:1',
            'delivery_address' => 'required_if:order_type,delivery|nullable|string|max:500',
            // Asal order delivery (FnB): GoFood / GrabFood / ShopeeFood / dsb.
            'delivery_platform' => 'nullable|string|max:50',
            'delivery_order_no' => 'nullable|string|max:100',
            'shipping_amount' => 'nullable|numeric|min:0',
            'rounding_adjustment' => 'nullable|numeric',
            'rounding_mode' => 'nullable|in:nearest,up,down,custom',
            'rounding_nearest' => 'nullable|integer|min:1',
            'rounding_custom' => 'nullable|numeric',
            'customer_name' => 'nullable|string|max:200',
            // ── Mode-specific fields ──────────────────────────────────────
            // Rental
            'rental_duration' => 'nullable|integer|min:1',
            'rental_unit' => 'nullable|in:per_hour,per_day,per_week',
            // Flexible mode fields: service booking, ticket, hospitality
            'ticket_event' => 'nullable|string|max:200',
            'ticket_slot' => 'nullable|string|max:100',
            'room_number' => 'nullable|string|max:50',
            'guest_count' => 'nullable|integer|min:1',
            // Session mode
            // room_number & guest_count already declared above
            // Employee for service/ticket mode
            'employee_id' => 'nullable|exists:employees,id',
        ]);

        // ── Idempotency check: jika key sudah pernah diproses, kembalikan data existing ──
        if (! empty($validated['idempotency_key'])) {
            $existing = Sale::where(
                'idempotency_key',
                $validated['idempotency_key'],
            )
                ->where('store_id', session('current_store_id'))
                ->first();

            if ($existing) {
                return response()->json([
                    'success' => true,
                    'sale_no' => $existing->sale_no,
                    'sale_id' => $existing->id,
                    'change' => (float) $existing->change_amount,
                    'grand_total' => (float) $existing->grand_total,
                    'is_pg' => $existing->payment_status === 'pending',
                    'pg_info' => null,
                    'idempotent' => true,
                ]);
            }
        }

        // ── Cek limit transaksi bulanan plan SEBELUM buka transaksi DB ──
        $limitCheckStore = Store::with('planModel')->find(session('current_store_id'));
        if ($limitCheckStore && ! $limitCheckStore->canAddTransaction()) {
            return response()->json([
                'success' => false,
                'message' => "Batas transaksi bulan ini untuk plan {$limitCheckStore->planModel?->label} sudah tercapai ({$limitCheckStore->effectiveMaxTransactionsPerMonth()} transaksi). Upgrade plan untuk melanjutkan transaksi.",
            ], 422);
        }

        DB::beginTransaction();
        try {
            $user = $request->user();
            [$storeId, $branchId] = $this->storeScope();
            $store = Store::with('storeType')->find($storeId);
            $storeTypeCode =
                $store?->getRelation('storeType')?->code ?? 'retail';

            // ── Grosir (retail) wajib punya pelanggan ──
            // Mencerminkan guard di frontend (missingRequiredField), supaya
            // tidak bisa dilewati dengan request langsung ke endpoint ini.
            if (
                $storeTypeCode === 'retail'
                && $validated['order_type'] === 'wholesale'
                && empty($validated['customer_id'])
            ) {
                throw new \RuntimeException(
                    'Transaksi grosir wajib memilih pelanggan.',
                );
            }

            // Load relations needed for hasFeature() gate check
            $store?->load(['planModel.features', 'storeFeatures.feature']);
            $now = now();

            $saleNo = $this->generateUniqueSaleNo($now);

            $items = $validated['items'];

            // ── Validasi harga item terhadap harga produk asli ──
            // Cegah manipulasi harga dari client (misal kirim price: 1 untuk
            // produk seharga Rp 100.000). Harga yang dikirim harus cocok
            // dengan salah satu harga valid produk: base price, tier price,
            // harga variant, atau harga packaging unit.
            $this->assertItemPricesValid($items, $storeId);

            // ── Resolve customer tier for promo ──
            $customerTierId = null;
            if (! empty($validated['customer_id'])) {
                $customerTierId = Customer::find($validated['customer_id'])
                    ?->customer_tier_id;
            }

            // ── Auto-apply promosi per item ──
            $promoEnabled = $store->hasFeature('promo');
            $promoService = new PromotionService;
            if ($promoEnabled) {
                $items = $promoService->applyPromosToCart($items, $customerTierId);
            }

            // ── Hitung subtotal (termasuk promo discount) ──
            $subtotal = 0;
            foreach ($items as $item) {
                $disc =
                    ($item['discount_amount'] ?? 0) +
                    ($item['promo_discount'] ?? 0);
                $modExtra = collect($item['modifiers'] ?? [])->sum(
                    'price_addition',
                );
                $subtotal +=
                    $item['quantity'] * ($item['price'] + $modExtra) - $disc;
            }

            $discount = $validated['discount_amount'] ?? 0;
            $tax = $validated['tax_amount'] ?? 0;

            // ── Diskon manual tidak boleh melebihi subtotal ──
            // Tanpa guard ini, kasir bisa input diskon Rp yang lebih besar
            // dari subtotal dan grand_total jadi negatif di laporan.
            if ($discount > $subtotal) {
                throw new \RuntimeException(
                    'Diskon tidak boleh melebihi subtotal ('.number_format($subtotal, 0, ',', '.').').',
                );
            }

            // ── Auto-apply cart-level promo ──
            $cartPromoResult = $promoEnabled
                ? $promoService->findBestCartPromo($subtotal, $customerTierId)
                : null;

            // ── Membership discount kandidat (dibandingkan, ambil terbesar) ──
            $customerForPromo = ! empty($validated['customer_id'])
                ? Customer::find($validated['customer_id'])
                : null;
            $membershipCandidate = $promoService->membershipDiscountCandidate($customerForPromo, $subtotal);

            $cartPromoDiscount = 0;
            $cartPromoId = null;
            if ($membershipCandidate && (! $cartPromoResult || $membershipCandidate['discount'] > $cartPromoResult['discount'])) {
                $cartPromoDiscount = $membershipCandidate['discount'];
                $cartPromoId = null; // bukan Promotion model, jangan increment used_count
            } elseif ($cartPromoResult) {
                $cartPromoDiscount = $cartPromoResult['discount'];
                $cartPromoId = $cartPromoResult['promotion']->id;
            }

            // ── Benefit gratis ongkir dari membership ──
            // Dihitung server-side supaya nominal ongkir yang tersimpan sudah
            // bersih; frontend hanya mengirim ongkir asli.
            $shippingAmount = $this->applyMembershipShippingWaiver(
                $customerForPromo,
                (float) ($validated['shipping_amount'] ?? 0),
                (float) $subtotal,
            );

            // ── Redeem Points ──
            $pointsRedeemed = 0;
            $pointsDiscount = 0;
            if (! empty($validated['redeem_points']) && $customerForPromo) {
                $pointsRedeemed = (int) $validated['redeem_points'];
                if ($pointsRedeemed > $customerForPromo->points) {
                    throw new \RuntimeException("Poin tidak cukup. Poin tersedia: {$customerForPromo->points}");
                }
                $pointValue = (float) ($store->point_value ?? 1000);
                $pointsDiscount = $pointsRedeemed * $pointValue;
                // Cannot discount more than subtotal
                if ($pointsDiscount > $subtotal) {
                    $pointsDiscount = $subtotal;
                    $pointsRedeemed = ceil($pointsDiscount / $pointValue);
                }
            }

            // ── Grand total sebelum rounding ──
            $grandTotal = max(0, $subtotal - $discount - $cartPromoDiscount - $pointsDiscount + $tax
                + $shippingAmount);

            // ── Rounding: recalculate server-side (trust CashRoundingService, not client) ──
            $roundingService = app(CashRoundingService::class);
            $roundingMode = $validated['rounding_mode'] ?? 'nearest';
            $roundingNearest = (int) ($validated['rounding_nearest'] ?? 100);
            $roundingCustom = $validated['rounding_custom'] ?? null;

            // Find the cash payment method to check if rounding applies
            $cashMethodIds = PaymentMethod::where('store_id', $storeId)
                ->where('type', 'cash')
                ->pluck('id')
                ->toArray();
            $hasCashPayment = collect($validated['payments'])->contains(
                fn ($p) => in_array($p['method_id'], $cashMethodIds),
            );

            if ($hasCashPayment) {
                $roundingResult = $roundingService->calculateForPayment(
                    $grandTotal,
                    'cash',
                    $roundingNearest,
                    $roundingMode,
                    $roundingCustom,
                );
                $roundingAdjustment = $roundingResult['adjustment'];
                $roundingMode = $roundingResult['mode'];
                $roundingNearest = $roundingResult['nearest'];
                $grandTotal = $roundingResult['rounded'];
            } else {
                $roundingAdjustment = 0;
                $roundingMode = null;
                $roundingNearest = null;
            }

            $paidTotal = collect($validated['payments'])->sum('amount');
            $change = max(0, $paidTotal - $grandTotal);

            // Check if this is a PG payment (needs external confirmation)
            $hasPgPayment = collect($validated['payments'])->contains(
                'is_pg',
                true,
            );
            $paymentStatus = $hasPgPayment
                ? 'pending'
                : ($paidTotal <= 0
                    ? 'unpaid'
                    : ($paidTotal < $grandTotal
                        ? 'partial'
                        : 'paid'));
            $saleStatus = $hasPgPayment ? 'pending' : 'completed';

            $sale = Sale::create([
                'store_id' => $storeId,
                'branch_id' => $branchId,
                'table_id' => $validated['table_id'] ?? null,
                'customer_id' => $validated['customer_id'] ?? null,
                'user_id' => $user->id,
                'cashier_shift_id' => $this->getActiveShiftId(
                    $storeId,
                    $user->id,
                ),
                'sale_no' => $saleNo,
                'sale_date' => $now,
                'pos_mode' => $storeTypeCode,
                'order_type' => $validated['order_type'],
                'subtotal' => $subtotal,
                'discount_amount' => $discount + $cartPromoDiscount + ($pointsDiscount ?? 0),
                'tax_amount' => $tax,
                'shipping_amount' => $shippingAmount,
                'rounding_adjustment' => $roundingAdjustment,
                'rounding_mode' => $roundingMode,
                'rounding_nearest' => $roundingNearest,
                'delivery_address' => $validated['delivery_address'] ?? null,
                'customer_name' => $validated['customer_name'] ?? null,
                'grand_total' => $grandTotal,
                'paid_amount' => $paidTotal,
                'change_amount' => $change,
                'status' => $saleStatus,
                'payment_status' => $paymentStatus,
                'notes' => $validated['notes'] ?? null,
                'idempotency_key' => $validated['idempotency_key'] ?? null,
                // ── extra_data: mode-specific fields ───────────────────────
                'extra_data' => $this->buildExtraData(
                    $validated,
                    $storeTypeCode,
                ),
            ]);

            // Simpan employee_id jika ada (mode service/ticket)
            if (! empty($validated['employee_id'])) {
                $sale->update(['employee_id' => $validated['employee_id']]);
            }

            // Set tanggal sewa untuk mode rental
            if (
                in_array($storeTypeCode, ['rental']) &&
                ! empty($validated['rental_duration'])
            ) {
                $unit = $validated['rental_unit'] ?? 'per_day';
                $duration = (int) $validated['rental_duration'];

                $endAt = match ($unit) {
                    'per_hour' => $now->copy()->addHours($duration),
                    'per_week' => $now->copy()->addWeeks($duration),
                    default => $now->copy()->addDays($duration), // per_day
                };

                $sale->update([
                    'rent_start_at' => $now,
                    'rent_end_at' => $endAt,
                    'rental_status' => 'active',
                    'service_status' => null, // bukan service
                ]);
            }

            // Set check-in/check-out untuk mode hospitality
            if ($storeTypeCode === 'hospitality') {
                $checkIn = $now;
                // Default durasi 1 malam (per_day)
                $nights = 1;
                $rentalUnit = $validated['rental_unit'] ?? 'per_day';

                if (! empty($validated['rental_duration'])) {
                    $nights = (int) $validated['rental_duration'];
                }

                $checkOut = match ($rentalUnit) {
                    'per_hour' => $checkIn->copy()->addHours($nights),
                    'per_week' => $checkIn->copy()->addWeeks($nights),
                    default => $checkIn
                        ->copy()
                        ->addDays($nights), // per_day / per malam
                };

                $sale->update([
                    'rent_start_at' => $checkIn,
                    'rent_end_at' => $checkOut,
                    'rental_status' => 'active',
                ]);
            }

            // Set parking fields untuk mode parking
            if ($storeTypeCode === 'parking') {
                $parkingUpdate = ['entry_at' => $now];

                if (! empty($validated['ticket_event'])) {
                    $parkingUpdate['plate_number'] = strtoupper(
                        $validated['ticket_event'],
                    );
                }
                if (! empty($validated['ticket_slot'])) {
                    $parkingUpdate['vehicle_type'] = $validated['ticket_slot']; // motorcycle/car/truck
                }
                if (! empty($validated['room_number'])) {
                    $parkingUpdate['parking_ticket_no'] =
                        $validated['room_number'];
                }

                $sale->update($parkingUpdate);
            }

            // Set session fields untuk mode session
            if ($storeTypeCode === 'session') {
                $sessionUpdate = [
                    'session_status' => 'running',
                    'session_started_at' => $now,
                    'guest_count' => $validated['guest_count'] ?? 1,
                ];

                if (! empty($validated['room_number'])) {
                    $sessionUpdate['unit_name'] = $validated['room_number'];
                }

                $sale->update($sessionUpdate);
            }

            // Field khusus FnB: antrian dapur, jumlah tamu, asal delivery
            $this->applyFnbFields($sale, $validated, $storeTypeCode);

            // Samakan status meja dengan kondisi order. Kalau sale langsung
            // selesai (tunai), meja tidak perlu ditandai terisi sama sekali;
            // kalau masih menunggu pembayaran, meja jadi 'occupied'.
            $this->syncTableStatus($validated['table_id'] ?? null, $storeId);

            // ── Pre-validate stock for all items (before any deduction) ──
            // Setiap item dicek dari bucket-nya sendiri (product + variant +
            // packaging_unit) — menjual dus tidak boleh mengurangi/mengecek
            // stok bucket pcs milik variant yang sama, dan sebaliknya. Bucket
            // tidak melakukan konversi otomatis: qty yang dicek/dipotong
            // selalu dalam satuan bucket itu sendiri (mis. bucket dus dalam
            // satuan dus, bukan dikali conversion_qty ke pcs).
            if (! $hasPgPayment) {
                foreach ($items as $item) {
                    $product = Product::find($item['product_id']);
                    if (! $product || ! $product->track_stock) {
                        continue;
                    }
                    $hasRecipe = $product->recipes()->exists();
                    if ($hasRecipe) {
                        continue;
                    }

                    $actualQty = $item['quantity'];

                    $currentStock = ProductStock::where('product_id', $item['product_id'])
                        ->where('variant_id', $item['variant_id'] ?? null)
                        ->where('packaging_unit_id', $item['packaging_unit_id'] ?? null)
                        ->where('store_id', $storeId)
                        ->where('branch_id', $branchId)
                        ->sum('quantity');

                    if ($currentStock < $actualQty) {
                        $unitLabel = ! empty($item['unit_name']) ? " ({$item['unit_name']})" : '';
                        throw new \Exception(
                            "Stok \"{$product->name}{$unitLabel}\" tidak cukup. ".
                            "Dibutuhkan {$actualQty}, tersedia {$currentStock}.",
                        );
                    }
                }
            }

            foreach ($items as $item) {
                $disc =
                    ($item['discount_amount'] ?? 0) +
                    ($item['promo_discount'] ?? 0);
                $modExtra = collect($item['modifiers'] ?? [])->sum(
                    'price_addition',
                );
                $unitPrice = $item['price'] + $modExtra;

                // ── Recipe logic ──────────────────────────────────
                $product = Product::with(
                    'recipes.rawMaterial.stocks',
                )->find($item['product_id']);

                $recipeSnapshot = null;
                $ingredientCost = 0;
                $hasRecipe = $product && $product->recipes->isNotEmpty();

                if ($hasRecipe) {
                    $snapshot = [];
                    foreach ($product->recipes as $recipe) {
                        $needed = $recipe->quantity * $item['quantity'];
                        $rawStock = $recipe->rawMaterial->stocks
                            ->where('store_id', $storeId)
                            ->when($branchId, fn ($stocks) => $stocks->where('branch_id', $branchId))
                            ->sum('quantity');

                        // Cek stok bahan (kecuali is_nullable)
                        if (! $recipe->is_nullable && $rawStock < $needed) {
                            throw new \Exception(
                                "Stok bahan \"{$recipe->rawMaterial->name}\" tidak cukup. ".
                                    "Dibutuhkan {$needed} {$recipe->unit}, tersedia {$rawStock}.",
                            );
                        }

                        // Modal per satuan pakai — sepadan dengan $needed.
                        $costPerUnit = $recipe->rawMaterial->costPerBaseUnit();
                        $ingredientCost += $needed * $costPerUnit;

                        $snapshot[] = [
                            'raw_material_id' => $recipe->raw_material_id,
                            'raw_material_name' => $recipe->rawMaterial->name,
                            'quantity_per_unit' => (float) $recipe->quantity,
                            'total_quantity' => $needed,
                            'unit' => $recipe->unit,
                            'cost_price' => $costPerUnit,
                            'total_cost' => $needed * $costPerUnit,
                            'is_nullable' => $recipe->is_nullable,
                        ];
                    }
                    $recipeSnapshot = $snapshot;
                }

                $saleItem = SaleItem::create([
                    'sale_id' => $sale->id,
                    'product_id' => $item['product_id'],
                    'variant_id' => $item['variant_id'] ?? null,
                    'packaging_unit_id' => $item['packaging_unit_id'] ?? null,
                    'unit_name' => $item['unit_name'] ?? null,
                    'unit_conversion_qty' => $item['unit_conversion_qty'] ?? 1,
                    'promotion_id' => $item['promotion_id'] ?? null,
                    'quantity' => $item['quantity'],
                    'price' => $unitPrice,
                    'discount_amount' => $item['discount_amount'] ?? 0,
                    'promo_discount' => $item['promo_discount'] ?? 0,
                    'subtotal' => $item['quantity'] * $unitPrice -
                        ($item['discount_amount'] ?? 0) -
                        ($item['promo_discount'] ?? 0),
                    'modifiers' => $item['modifiers'] ?? null,
                    'recipe_snapshot' => $recipeSnapshot,
                    'ingredient_cost' => $ingredientCost,
                    'notes' => $item['notes'] ?? null,
                ]);

                // ── Deduct stock + catat StockMovement ──────────────
                // Skip stock deduction for PG payments — only deduct when payment confirmed
                if ($hasPgPayment) {
                    // Still record recipe snapshot for reference, but don't deduct
                } elseif ($hasRecipe) {
                    app(StockService::class)->decreaseRecipeIngredients(
                        item: $item,
                        product: $product,
                        referenceType: Sale::class,
                        referenceId: $sale->id,
                        referenceNo: $saleNo,
                        storeId: $storeId,
                        branchId: $branchId,
                        movedAt: $movedAt ?? null,
                    );
                } elseif ($product?->track_stock) {
                    $variantId = $item['variant_id'] ?? null;
                    $packagingUnitId = $item['packaging_unit_id'] ?? null;
                    $unitLabel = ! empty($item['unit_name']) ? " ({$item['unit_name']})" : '';

                    $existing = ProductStock::where([
                        'product_id' => $item['product_id'],
                        'variant_id' => $variantId,
                        'packaging_unit_id' => $packagingUnitId,
                        'store_id' => $storeId,
                        'branch_id' => $branchId,
                    ])->first();

                    $unitCost = $existing && $existing->average_cost > 0
                        ? $existing->average_cost
                        : ($product->cost_price ?? 0);

                    $batchDeductions = app(StockService::class)->decrease(new StockMutation(
                        productId: $item['product_id'],
                        variantId: $variantId,
                        packagingUnitId: $packagingUnitId,
                        storeId: $storeId,
                        branchId: $branchId,
                        quantity: (float) $item['quantity'],
                        unitCost: (float) $unitCost,
                        movementType: 'sale_out',
                        referenceType: Sale::class,
                        referenceId: $sale->id,
                        referenceNo: $saleNo,
                        notes: "Penjualan #{$saleNo} — {$item['quantity']}x{$unitLabel} {$product->name}",
                        movedAt: $now ? (string) $now : null,
                    ));

                    // Jika seluruh qty berasal dari 1 batch, catat pada SaleItem
                    if (count($batchDeductions) === 1) {
                        $saleItem->update(['product_batch_id' => $batchDeductions[0]['batch_id']]);
                    }
                }
            }

            // Catat redeem poin jika ada — gunakan lockForUpdate untuk mencegah race condition
            if (isset($pointsRedeemed) && $pointsRedeemed > 0 && $customerForPromo) {
                $lockedCustomer = Customer::lockForUpdate()->find($customerForPromo->id);
                if ($lockedCustomer->points < $pointsRedeemed) {
                    throw new \RuntimeException("Poin tidak cukup. Poin tersedia: {$lockedCustomer->points}");
                }
                $lockedCustomer->decrement('points', $pointsRedeemed);
                CustomerPointLog::create([
                    'store_id' => $storeId,
                    'customer_id' => $lockedCustomer->id,
                    'sale_id' => $sale->id,
                    'type' => 'redeem',
                    'points' => -$pointsRedeemed,
                    'balance_after' => $lockedCustomer->fresh()->points,
                    'notes' => "Redeem pada transaksi {$saleNo}",
                    'created_by' => $user->id,
                ]);
            }

            // Only create SalePayment for non-PG payments (PG creates it on callback)
            $debtTotal = 0;
            foreach ($validated['payments'] as $pay) {
                if (empty($pay['is_pg'])) {
                    SalePayment::create([
                        'sale_id' => $sale->id,
                        'payment_method_id' => $pay['method_id'],
                        'paid_at' => $now,
                        'amount' => $pay['amount'],
                        'reference_no' => $pay['reference_no'] ?? null,
                        'payer_name' => $pay['payer_name'] ?? null,
                        'payer_customer_id' => $pay['payer_customer_id'] ?? null,
                        'paid_amount' => $pay['paid_amount'] ?? null,
                        'change_amount' => $pay['change_amount'] ?? null,
                        'is_split' => ! empty($pay['is_split']),
                    ]);

                    // Track debt payments
                    $method = PaymentMethod::find($pay['method_id']);
                    if ($method && $method->type === 'debt') {
                        $debtTotal += $pay['amount'];
                    }
                }
            }

            // Process debt payments
            if ($debtTotal > 0) {
                if (! auth()->user()->can('debt.create')) {
                    throw new \Exception('Anda tidak memiliki izin untuk menerima pembayaran hutang.');
                }

                $customerId = $validated['customer_id'] ?? null;
                $customer = Customer::where('store_id', $storeId)->lockForUpdate()->find($customerId);
                if (! $customer) {
                    throw new \Exception('Pilih pelanggan terlebih dahulu untuk pembayaran hutang.');
                }

                $newDebt = (float) $customer->debt_balance + $debtTotal;
                if ($customer->credit_limit > 0 && $newDebt > $customer->credit_limit) {
                    throw new \Exception(
                        'Hutang melebihi limit. Limit: Rp'.number_format($customer->credit_limit).
                        ', Hutang saat ini: Rp'.number_format($customer->debt_balance).
                        ', Ditambah: Rp'.number_format($debtTotal),
                    );
                }

                CustomerDebtLog::create([
                    'customer_id' => $customer->id,
                    'store_id' => $storeId,
                    'sale_id' => $sale->id,
                    'type' => 'add',
                    'amount' => $debtTotal,
                    'balance_after' => $newDebt,
                    'notes' => "Hutang dari penjualan #{$saleNo}",
                    'created_by' => $user->id,
                ]);
                $customer->update(['debt_balance' => $newDebt]);
            }

            DB::commit();

            // Increment used_count for applied promotions
            $promoIds = collect($items)->pluck('promotion_id')->filter()->unique();
            if ($cartPromoId) {
                $promoIds->push($cartPromoId);
            }
            if ($promoIds->isNotEmpty()) {
                Promotion::whereIn('id', $promoIds)->increment('used_count');
            }

            // Hitung komisi untuk mode service/ticket (setelah commit berhasil)
            if (
                ! empty($validated['employee_id']) &&
                in_array($storeTypeCode, ['service', 'ticket'])
            ) {
                $employee = Employee::find(
                    $validated['employee_id'],
                );
                if ($employee && $employee->commission_value > 0) {
                    $baseAmount = $grandTotal;

                    $commissionAmount = match ($employee->commission_type) {
                        'percent' => round(
                            $baseAmount * ($employee->commission_value / 100),
                            2,
                        ),
                        'flat' => min($employee->commission_value, $baseAmount),
                        default => 0,
                    };

                    if ($commissionAmount > 0) {
                        EmployeeCommission::create([
                            'employee_id' => $employee->id,
                            'store_id' => $storeId,
                            'sale_id' => $sale->id,
                            'type' => $employee->commission_type ?? 'percent',
                            'commission_rate' => $employee->commission_value,
                            'base_amount' => $baseAmount,
                            'commission_amount' => $commissionAmount,
                            'status' => 'pending',
                            'commission_date' => now()->toDateString(),
                            'notes' => "Auto dari POS transaksi {$saleNo}",
                        ]);
                    }
                }
            }

            // Build PG info for frontend
            $pgInfo = null;
            if ($hasPgPayment) {
                $pgPayment = collect($validated['payments'])->firstWhere(
                    'is_pg',
                    true,
                );
                $pgInfo = [
                    'provider' => $pgPayment['pg_provider'],
                    'method' => $pgPayment['pg_method'],
                    'amount' => $pgPayment['amount'],
                    'sale_id' => $sale->id,
                ];
            }

            return response()->json([
                'success' => true,
                'sale_no' => $saleNo,
                'sale_id' => $sale->id,
                'change' => $change,
                'grand_total' => $grandTotal,
                'is_pg' => $hasPgPayment,
                'pg_info' => $pgInfo,
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();

            return response()->json(
                ['success' => false, 'message' => $e->getMessage()],
                422,
            );
        }
    }

    /**
     * Phase 1 — pre-create a pending Sale (no stock deduction, no payment).
     * Called when the full-screen payment view opens.
     */
    public function start(Request $request)
    {
        $validated = $request->validate([
            'idempotency_key' => 'nullable|string|max:100',
            'customer_id' => 'nullable|exists:customers,id',
            'table_id' => 'nullable|integer',
            'order_type' => 'required|string|max:30',
            'discount_amount' => 'nullable|numeric|min:0',
            'tax_amount' => 'nullable|numeric|min:0',
            'shipping_amount' => 'nullable|numeric|min:0',
            'rounding_adjustment' => 'nullable|numeric',
            'rounding_mode' => 'nullable|in:nearest,up,down,custom',
            'rounding_nearest' => 'nullable|integer|min:1',
            'rounding_custom' => 'nullable|numeric',
            'delivery_address' => 'required_if:order_type,delivery|nullable|string|max:500',
            // Asal order delivery (FnB): GoFood / GrabFood / ShopeeFood / dsb.
            'delivery_platform' => 'nullable|string|max:50',
            'delivery_order_no' => 'nullable|string|max:100',
            'customer_name' => 'nullable|string|max:200',
            'notes' => 'nullable|string|max:500',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.variant_id' => 'nullable|integer',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'required|numeric|min:0',
            'items.*.discount_amount' => 'nullable|numeric|min:0',
            'items.*.modifiers' => 'nullable|array',
            'items.*.notes' => 'nullable|string|max:255',
            'items.*.packaging_unit_id' => 'nullable|integer',
            'items.*.unit_name' => 'nullable|string|max:50',
            'items.*.unit_conversion_qty' => 'nullable|integer|min:1',
            'rental_duration' => 'nullable|integer|min:1',
            'rental_unit' => 'nullable|in:per_hour,per_day,per_week',
            'ticket_event' => 'nullable|string|max:200',
            'ticket_slot' => 'nullable|string|max:100',
            'room_number' => 'nullable|string|max:50',
            'guest_count' => 'nullable|integer|min:1',
            'employee_id' => 'nullable|exists:employees,id',
            'redeem_points' => 'nullable|integer|min:1',
        ]);

        if (! empty($validated['idempotency_key'])) {
            $existing = Sale::where('idempotency_key', $validated['idempotency_key'])
                ->where('store_id', session('current_store_id'))
                ->first();
            if ($existing) {
                return response()->json([
                    'success' => true,
                    'sale_id' => $existing->id,
                    'sale_no' => $existing->sale_no,
                    'grand_total' => (float) $existing->grand_total,
                ]);
            }
        }

        DB::beginTransaction();
        try {
            $user = $request->user();
            $storeId = session('current_store_id');
            $branchId = session('branch_id');
            $store = Store::with('storeType')->find($storeId);
            $storeTypeCode = $store?->getRelation('storeType')?->code ?? 'retail';

            // ── Grosir (retail) wajib punya pelanggan ──
            if (
                $storeTypeCode === 'retail'
                && $validated['order_type'] === 'wholesale'
                && empty($validated['customer_id'])
            ) {
                throw new \RuntimeException(
                    'Transaksi grosir wajib memilih pelanggan.',
                );
            }

            $store?->load(['planModel.features', 'storeFeatures.feature']);
            $now = now();

            $saleNo = $this->generateUniqueSaleNo($now);

            $items = $validated['items'];

            // ── Validasi harga item terhadap harga produk asli ──
            $this->assertItemPricesValid($items, $storeId);

            $customerTierId = null;
            if (! empty($validated['customer_id'])) {
                $customerTierId = Customer::find($validated['customer_id'])?->customer_tier_id;
            }
            $promoEnabled = $store->hasFeature('promo');
            $promoService = new PromotionService;
            if ($promoEnabled) {
                $items = $promoService->applyPromosToCart($items, $customerTierId);
            }

            $subtotal = 0;
            foreach ($items as $item) {
                $disc = ($item['discount_amount'] ?? 0) + ($item['promo_discount'] ?? 0);
                $modExtra = collect($item['modifiers'] ?? [])->sum('price_addition');
                $subtotal += $item['quantity'] * ($item['price'] + $modExtra) - $disc;
            }

            $discount = $validated['discount_amount'] ?? 0;
            $tax = $validated['tax_amount'] ?? 0;

            // ── Diskon manual tidak boleh melebihi subtotal ──
            if ($discount > $subtotal) {
                throw new \RuntimeException(
                    'Diskon tidak boleh melebihi subtotal ('.number_format($subtotal, 0, ',', '.').').',
                );
            }

            $cartPromoResult = $promoEnabled ? $promoService->findBestCartPromo($subtotal, $customerTierId) : null;

            // ── Membership discount kandidat (dibandingkan, ambil terbesar) ──
            $customerForPromo = ! empty($validated['customer_id'])
                ? Customer::find($validated['customer_id'])
                : null;
            $membershipCandidate = $promoService->membershipDiscountCandidate($customerForPromo, $subtotal);

            $cartPromoDiscount = 0;
            $cartPromoId = null;
            if ($membershipCandidate && (! $cartPromoResult || $membershipCandidate['discount'] > $cartPromoResult['discount'])) {
                $cartPromoDiscount = $membershipCandidate['discount'];
                $cartPromoId = null;
            } elseif ($cartPromoResult) {
                $cartPromoDiscount = $cartPromoResult['discount'];
                $cartPromoId = $cartPromoResult['promotion']->id;
            }

            // ── Benefit gratis ongkir dari membership ──
            $shippingAmount = $this->applyMembershipShippingWaiver(
                $customerForPromo,
                (float) ($validated['shipping_amount'] ?? 0),
                (float) $subtotal,
            );

            // ── Redeem Points ──
            $pointsRedeemed = 0;
            $pointsDiscount = 0;
            if (! empty($validated['redeem_points']) && $customerForPromo) {
                $pointsRedeemed = (int) $validated['redeem_points'];
                if ($pointsRedeemed > $customerForPromo->points) {
                    throw new \RuntimeException("Poin tidak cukup. Poin tersedia: {$customerForPromo->points}");
                }
                $pointValue = (float) ($store->point_value ?? 1000);
                $pointsDiscount = $pointsRedeemed * $pointValue;
                if ($pointsDiscount > $subtotal) {
                    $pointsDiscount = $subtotal;
                    $pointsRedeemed = (int) ceil($pointsDiscount / $pointValue);
                }
            }

            $preRoundingTotal = max(0, $subtotal - $discount - $cartPromoDiscount - $pointsDiscount + $tax + $shippingAmount);

            // Rounding — only if store feature enabled AND has cash payment in the (future) payment
            // We defer the full rounding check to finalize(), but pre-calculate from frontend hints
            $roundingService = app(CashRoundingService::class);
            $roundingMode = $validated['rounding_mode'] ?? null;
            $roundingNearest = (int) ($validated['rounding_nearest'] ?? 0);
            $roundingCustom = $validated['rounding_custom'] ?? null;
            $roundingAdjustment = (float) ($validated['rounding_adjustment'] ?? 0);
            $grandTotal = $preRoundingTotal + $roundingAdjustment;

            // Pre-validate stock
            $this->validateStockForItems($items, $storeId, $branchId);

            $sale = Sale::create([
                'store_id' => $storeId,
                'branch_id' => $branchId,
                'table_id' => $validated['table_id'] ?? null,
                'customer_id' => $validated['customer_id'] ?? null,
                'user_id' => $user->id,
                'cashier_shift_id' => $this->getActiveShiftId($storeId, $user->id),
                'sale_no' => $saleNo,
                'sale_date' => $now,
                'pos_mode' => $storeTypeCode,
                'order_type' => $validated['order_type'],
                'subtotal' => $subtotal,
                'discount_amount' => $discount + $cartPromoDiscount + ($pointsDiscount ?? 0),
                'tax_amount' => $tax,
                'shipping_amount' => $shippingAmount,
                'rounding_adjustment' => $roundingAdjustment,
                'rounding_mode' => $roundingMode,
                'rounding_nearest' => $roundingNearest,
                'grand_total' => $grandTotal,
                'paid_amount' => 0,
                'change_amount' => 0,
                'status' => 'pending',
                'payment_status' => 'unpaid',
                'delivery_address' => $validated['delivery_address'] ?? null,
                'customer_name' => $validated['customer_name'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'idempotency_key' => $validated['idempotency_key'] ?? null,
                'extra_data' => array_merge($this->buildExtraData($validated, $storeTypeCode) ?? [], $pointsRedeemed > 0 ? ['points_redeemed' => $pointsRedeemed, 'points_discount' => $pointsDiscount] : []),
            ]);

            if (! empty($validated['employee_id'])) {
                $sale->update(['employee_id' => $validated['employee_id']]);
            }

            // Field khusus FnB. Ini jalur yang benar-benar dipakai POS
            // (frontend memanggil start() lalu finalize(), bukan store()),
            // jadi tanpa ini order FnB tidak pernah sampai ke dapur.
            $this->applyFnbFields($sale, $validated, $storeTypeCode);

            // Create SaleItems (no stock deduction)
            $this->createSaleItems($sale, $items, $storeId, $branchId);

            // Sale ini masih 'pending' — meja otomatis jadi terisi.
            $this->syncTableStatus($validated['table_id'] ?? null, $storeId);

            // Increment promo used_count
            $promoIds = collect($items)->pluck('promotion_id')->filter()->unique();
            if ($cartPromoId) {
                $promoIds->push($cartPromoId);
            }
            if ($promoIds->isNotEmpty()) {
                Promotion::whereIn('id', $promoIds)->increment('used_count');
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'sale_id' => $sale->id,
                'sale_no' => $saleNo,
                'grand_total' => $grandTotal,
                'subtotal' => $subtotal,
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();

            return response()->json(
                ['success' => false, 'message' => $e->getMessage()],
                422,
            );
        }
    }

    /**
     * Phase 2 — finalize a pending sale with payment info.
     * Deducts stock, creates SalePayments, processes debt, computes commission.
     */
    public function finalize(Request $request)
    {
        $validated = $request->validate([
            'sale_id' => 'required|exists:sales,id',
            'payments' => 'required|array|min:1',
            'payments.*.method_id' => 'required|exists:payment_methods,id',
            'payments.*.amount' => 'required|numeric|min:0.01',
            'payments.*.is_pg' => 'nullable|boolean',
            'payments.*.pg_provider' => 'nullable|string',
            'payments.*.pg_method' => 'nullable|string',
            'payments.*.payer_name' => 'nullable|string',
            'payments.*.payer_customer_id' => 'nullable|exists:customers,id',
            'payments.*.paid_amount' => 'nullable|numeric',
            'payments.*.change_amount' => 'nullable|numeric',
            'payments.*.is_split' => 'nullable|boolean',
            // Kasbon fields
            'customer_id' => 'nullable|exists:customers,id',
            'kasbon_due_date' => 'nullable|date',
            'kasbon_note' => 'nullable|string|max:500',
        ]);

        DB::beginTransaction();
        try {
            $user = $request->user();
            $storeId = session('current_store_id');
            $branchId = session('branch_id');
            $sale = Sale::findOrFail($validated['sale_id']);
            abort_if($sale->store_id !== $storeId, 403);

            if ($sale->status === 'completed') {
                return response()->json([
                    'success' => true,
                    'sale_no' => $sale->sale_no,
                    'sale_id' => $sale->id,
                    'change' => (float) $sale->change_amount,
                    'grand_total' => (float) $sale->grand_total,
                    'is_pg' => false,
                    'message' => 'Transaksi sudah selesai.',
                ]);
            }
            abort_if(! in_array($sale->status, ['pending']), 422, 'Transaksi tidak dapat diproses.');

            $hasPgPayment = collect($validated['payments'])->contains('is_pg', true);
            $paidTotal = collect($validated['payments'])->sum('amount');
            $grandTotal = (float) $sale->grand_total;

            if (! $hasPgPayment) {
                $change = max(0, $paidTotal - $grandTotal);

                // Deduct stock
                $items = $sale->items()->with('product')->get()->toArray();
                $this->deductStockForSale($sale, $items, $storeId, $branchId, $sale->sale_no);
            } else {
                $change = 0;
            }

            // Create SalePayments
            $debtTotal = 0;
            foreach ($validated['payments'] as $pay) {
                if (empty($pay['is_pg'])) {
                    SalePayment::create([
                        'sale_id' => $sale->id,
                        'payment_method_id' => $pay['method_id'],
                        'paid_at' => now(),
                        'amount' => $pay['amount'],
                        'reference_no' => $pay['reference_no'] ?? null,
                        'payer_name' => $pay['payer_name'] ?? null,
                        'payer_customer_id' => $pay['payer_customer_id'] ?? null,
                        'paid_amount' => $pay['paid_amount'] ?? null,
                        'change_amount' => $pay['change_amount'] ?? null,
                        'is_split' => ! empty($pay['is_split']),
                    ]);

                    $method = PaymentMethod::find($pay['method_id']);
                    if ($method && $method->type === 'debt') {
                        $debtTotal += $pay['amount'];
                    }
                }
            }

            // Process debt
            if ($debtTotal > 0) {
                if (! $user->can('debt.create')) {
                    throw new \Exception('Anda tidak memiliki izin untuk menerima pembayaran hutang.');
                }
                // Use customer_id from request if provided (kasbon flow), fallback to sale's customer_id
                $customerId = $validated['customer_id'] ?? $sale->customer_id;
                $customer = Customer::where('store_id', $storeId)->lockForUpdate()->find($customerId);
                if (! $customer) {
                    throw new \Exception('Pilih pelanggan terlebih dahulu untuk pembayaran hutang.');
                }
                // Also update sale's customer_id if kasbon customer differs
                if ($customerId != $sale->customer_id) {
                    $sale->update(['customer_id' => $customerId]);
                }
                $newDebt = (float) $customer->debt_balance + $debtTotal;
                if ($customer->credit_limit > 0 && $newDebt > $customer->credit_limit) {
                    throw new \Exception(
                        'Hutang melebihi limit. Limit: Rp'.number_format($customer->credit_limit).
                        ', Hutang saat ini: Rp'.number_format($customer->debt_balance).
                        ', Ditambah: Rp'.number_format($debtTotal),
                    );
                }

                $kasbonDueDate = $validated['kasbon_due_date'] ?? null;
                $kasbonNote = $validated['kasbon_note'] ?? "Hutang dari penjualan #{$sale->sale_no}";

                CustomerDebtLog::create([
                    'customer_id' => $customer->id,
                    'store_id' => $storeId,
                    'sale_id' => $sale->id,
                    'type' => 'add',
                    'amount' => $debtTotal,
                    'balance_after' => $newDebt,
                    'due_date' => $kasbonDueDate,
                    'notes' => $kasbonNote,
                    'created_by' => $user->id,
                ]);
                $customer->update(['debt_balance' => $newDebt]);
            }

            $paymentStatus = $hasPgPayment
                ? 'pending'
                : ($paidTotal <= 0 ? 'unpaid' : ($paidTotal < $grandTotal ? 'partial' : 'paid'));
            $saleStatus = $hasPgPayment ? 'pending' : 'completed';

            $sale->update([
                'status' => $saleStatus,
                'payment_status' => $paymentStatus,
                'paid_amount' => $paidTotal,
                'change_amount' => $change,
            ]);

            // Deduct loyalty points if redeemed during start()
            $extraData = $sale->extra_data ?? [];
            if (! empty($extraData['points_redeemed']) && $sale->customer_id && $saleStatus === 'completed') {
                $customerForPoints = Customer::find($sale->customer_id);
                if ($customerForPoints) {
                    $ptsRedeemed = (int) $extraData['points_redeemed'];
                    $customerForPoints->decrement('points', $ptsRedeemed);
                    CustomerPointLog::create([
                        'store_id' => $storeId,
                        'customer_id' => $customerForPoints->id,
                        'sale_id' => $sale->id,
                        'type' => 'redeem',
                        'points' => -$ptsRedeemed,
                        'balance_after' => $customerForPoints->fresh()->points,
                        'notes' => "Redeem pada transaksi {$sale->sale_no}",
                        'created_by' => $user->id,
                    ]);
                }
            }

            // Order FnB yang dibuat lewat jalur lama bisa saja belum punya
            // kitchen_status — pastikan tetap masuk antrian dapur.
            if ($sale->pos_mode === 'fnb' && is_null($sale->kitchen_status)) {
                $sale->update(['kitchen_status' => 'pending']);
            }

            // Sale sudah tuntas (atau tinggal menunggu PG) — bebaskan meja
            // kalau tidak ada order lain yang masih berjalan di sana.
            $this->syncTableStatus($sale->table_id, $storeId);

            // Commission
            if (! empty($sale->employee_id)) {
                $employee = Employee::find($sale->employee_id);
                if ($employee && $employee->commission_value > 0) {
                    $baseAmount = (float) $grandTotal;
                    $commissionAmount = match ($employee->commission_type) {
                        'percent' => round($baseAmount * ($employee->commission_value / 100), 2),
                        'flat' => min($employee->commission_value, $baseAmount),
                        default => 0,
                    };
                    if ($commissionAmount > 0) {
                        EmployeeCommission::create([
                            'employee_id' => $employee->id,
                            'store_id' => $storeId,
                            'sale_id' => $sale->id,
                            'type' => $employee->commission_type ?? 'percent',
                            'commission_rate' => $employee->commission_value,
                            'base_amount' => $baseAmount,
                            'commission_amount' => $commissionAmount,
                            'status' => 'pending',
                            'commission_date' => now()->toDateString(),
                            'notes' => "Auto dari POS transaksi {$sale->sale_no}",
                        ]);
                    }
                }
            }

            DB::commit();

            // Build PG info
            $pgInfo = null;
            if ($hasPgPayment) {
                $pgPayment = collect($validated['payments'])->firstWhere('is_pg', true);
                $pgInfo = [
                    'provider' => $pgPayment['pg_provider'],
                    'method' => $pgPayment['pg_method'],
                    'amount' => $pgPayment['amount'],
                    'sale_id' => $sale->id,
                ];
            }

            return response()->json([
                'success' => true,
                'sale_no' => $sale->sale_no,
                'sale_id' => $sale->id,
                'change' => $change,
                'grand_total' => $grandTotal,
                'is_pg' => $hasPgPayment,
                'pg_info' => $pgInfo,
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();

            return response()->json(
                ['success' => false, 'message' => $e->getMessage()],
                422,
            );
        }
    }

    /**
     * Cancel a pending sale — only if no payments have been made.
     * Idempotent: already-completed sales are silently skipped.
     */
    public function cancelPending(Request $request, Sale $sale)
    {
        $storeId = session('current_store_id');
        abort_if($sale->store_id !== $storeId, 403);

        // Already completed or voided — nothing to cancel, return success.
        if ($sale->status !== 'pending') {
            return response()->json(['success' => true, 'message' => 'Transaksi sudah selesai.']);
        }

        $tableId = $sale->table_id;

        $sale->delete(); // cascade deletes items

        // Bebaskan meja hanya kalau tidak ada order lain yang masih berjalan
        // di sana — meja bisa saja menahan lebih dari satu order.
        $this->syncTableStatus($tableId, $storeId);

        return response()->json(['success' => true, 'message' => 'Transaksi dibatalkan.']);
    }

    /**
     * Membatalkan transaksi yang sudah selesai (Void).
     * Mengubah status menjadi cancelled dan mengembalikan stok.
     */
    public function voidSale(Request $request, Sale $sale)
    {
        $storeId = session('current_store_id');
        abort_if($sale->store_id !== $storeId, 403);

        // Hanya kasir yang bersangkutan atau user dengan izin sale.void yang bisa membatalkan
        if (! $request->user()->can('sale.void') && $sale->user_id !== $request->user()->id) {
            abort(403, 'Anda tidak memiliki izin membatalkan transaksi kasir lain.');
        }

        if ($sale->status === 'cancelled') {
            return response()->json(['success' => false, 'message' => 'Transaksi sudah dibatalkan sebelumnya.'], 422);
        }

        DB::beginTransaction();
        try {
            if ($sale->status === 'completed') {
                // Return stock
                foreach ($sale->items as $item) {
                    $product = $item->product;
                    if ($product && $product->track_stock) {
                        $existing = ProductStock::where([
                            'product_id' => $item->product_id,
                            'variant_id' => $item->variant_id,
                            'packaging_unit_id' => $item->packaging_unit_id,
                            'store_id' => $sale->store_id,
                            'branch_id' => $sale->branch_id,
                        ])->first();

                        if ($existing) {
                            app(StockService::class)->increase(new StockMutation(
                                productId: $item->product_id,
                                variantId: $item->variant_id,
                                packagingUnitId: $item->packaging_unit_id,
                                storeId: $sale->store_id,
                                branchId: $sale->branch_id,
                                quantity: (float) $item->quantity,
                                unitCost: (float) ($existing->average_cost ?: $product->cost_price ?? 0),
                                movementType: 'sale_cancel',
                                referenceType: Sale::class,
                                referenceId: $sale->id,
                                referenceNo: $sale->sale_no,
                                notes: "Penjualan #{$sale->sale_no} di-void dari Kasir",
                            ));
                        }
                    }
                }
            }

            $sale->update(['status' => 'cancelled']);

            // Bebaskan meja jika fnb
            if ($sale->table_id) {
                $this->syncTableStatus($sale->table_id, $storeId);
            }

            DB::commit();

            return response()->json(['success' => true, 'message' => 'Transaksi berhasil dibatalkan (void).']);
        } catch (\Throwable $e) {
            DB::rollBack();

            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }
    }

    /**
     * Mengubah metode pembayaran transaksi yang sudah selesai.
     */
    public function updatePayment(Request $request, Sale $sale)
    {
        $storeId = session('current_store_id');
        abort_if($sale->store_id !== $storeId, 403);

        $validated = $request->validate([
            'payment_method_id' => 'required|exists:payment_methods,id',
        ]);

        if ($sale->status !== 'completed') {
            return response()->json(['success' => false, 'message' => 'Hanya transaksi selesai yang dapat diubah pembayarannya.'], 422);
        }

        // Batas waktu ubah pembayaran diatur per toko di Pengaturan Toko.
        // Kalau tidak diisi, pembayaran boleh diubah kapan saja.
        $store = Store::find($storeId);

        if ($store && ! $store->canEditPaymentFor($sale)) {
            return response()->json([
                'success' => false,
                'message' => "Batas waktu ubah pembayaran sudah terlewat (maksimal {$store->paymentEditLimitLabel()} setelah transaksi).",
            ], 422);
        }

        // Ambil pembayaran utama
        $mainPayment = $sale->payments()->first();
        if ($mainPayment) {
            $mainPayment->update([
                'payment_method_id' => $validated['payment_method_id'],
            ]);
        }

        return response()->json(['success' => true, 'message' => 'Metode pembayaran berhasil diubah.']);
    }

    /**
     * Generate nomor penjualan unik secara atomik.
     * Retry otomatis jika terjadi race condition (unique constraint violation).
     */
    private function generateUniqueSaleNo(Carbon $now): string
    {
        $maxRetries = 5;
        for ($attempt = 0; $attempt < $maxRetries; $attempt++) {
            $prefix = 'SL-'.$now->format('Ymd').'-';
            $last = Sale::where('sale_no', 'like', $prefix.'%')
                ->orderByDesc('sale_no')
                ->first();
            $seq = $last ? (int) substr($last->sale_no, -3) + 1 : 1;
            $saleNo = $prefix.str_pad((string) $seq, 3, '0', STR_PAD_LEFT);

            // Cek duplikat sebelum insert (optimistic check)
            if (! Sale::where('sale_no', $saleNo)->exists()) {
                return $saleNo;
            }
        }

        // Fallback: gunakan timestamp untuk uniqueness
        return $prefix.str_pad((string) mt_rand(1, 999), 3, '0', STR_PAD_LEFT);
    }

    /**
     * Top 20 produk paling sering terjual untuk PLU shortcuts.
     */
    public function topProducts(Request $request)
    {
        $storeId = session('current_store_id');
        $branchId = session('current_branch_id') ?? session('branch_id');
        $limit = min((int) $request->get('limit', 20), 50);

        $topProductIds = SaleItem::select('product_id', DB::raw('SUM(quantity) as total_qty'))
            ->whereHas('sale', function ($q) use ($storeId, $branchId) {
                $q->where('store_id', $storeId)
                    ->where('status', 'final')
                    ->when($branchId, fn ($sq) => $sq->where('branch_id', $branchId));
            })
            ->groupBy('product_id')
            ->orderByDesc('total_qty')
            ->limit($limit)
            ->pluck('product_id');

        $products = Product::forStore($storeId)
            ->where('is_active', true)
            ->where('is_sellable', true)
            ->whereIn('id', $topProductIds)
            ->select([
                'id', 'name', 'sku', 'barcode', 'sell_price', 'image',
            ])
            ->get()
            ->sortBy(fn ($p) => $topProductIds->search($p->id))
            ->values();

        return response()->json([
            'products' => $products,
        ]);
    }

    /**
     * Cari customer berdasarkan nama, kode, atau nomor HP.
     */
    public function searchCustomer(Request $request)
    {
        $storeId = session('current_store_id');
        $query = $request->get('q', '');

        if (strlen($query) < 2) {
            return response()->json(['customers' => []]);
        }

        $customers = Customer::where('store_id', $storeId)
            ->where(function ($q) use ($query) {
                $q->where('name', 'like', "%{$query}%")
                    ->orWhere('code', 'like', "%{$query}%")
                    ->orWhere('phone', 'like', "%{$query}%");
            })
            ->with('customerTier:id,name,rank,color')
            ->select([
                'id', 'code', 'name', 'phone', 'tier', 'customer_tier_id',
                'points', 'total_spent', 'debt_balance', 'credit_limit',
            ])
            ->limit(20)
            ->get();

        return response()->json(['customers' => $customers]);
    }
}
