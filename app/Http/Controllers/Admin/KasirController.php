<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Concerns\FinalizesSaleStock;
use App\Http\Controllers\Concerns\HasStoreScope;
use App\Http\Controllers\Controller;
use App\Models\CafeTable;
use App\Models\CashierShift;
use App\Models\Category;
use App\Models\Customer;
use App\Models\CustomerDebtLog;
use App\Models\Employee;
use App\Models\EmployeeCommission;
use App\Models\PaymentMethod;
use App\Models\PlatformPaymentGateway;
use App\Models\Product;
use App\Models\ProductStock;
use App\Models\Promotion;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\SalePayment;
use App\Models\StockMovement;
use App\Models\Store;
use App\Services\CashRoundingService;
use App\Services\PromotionService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class KasirController extends Controller
{
    use FinalizesSaleStock, HasStoreScope;

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
            ->with([
                'category:id,name',
                'variants:id,product_id,name,sku,price,cost_price,is_active',
                'variants.priceTiers',
                'variants.packagingUnits',
                'modifierGroups.modifiers',
                'recipes.rawMaterial:id,name,unit,base_unit,cost_price',
                'stocks' => fn ($q) => $q->where('store_id', $storeId),
                'packagingUnits' => fn ($q) => $q->where('sell_price', '>', 0),
                'priceTiers',
            ])
            ->get()
            ->map(function ($p) use ($storeId) {
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
                $p->recipes->each(function ($r) use ($storeId) {
                    if ($r->rawMaterial) {
                        $r->rawMaterial->current_stock = $r->rawMaterial
                            ->stocks()
                            ->where('store_id', $storeId)
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
            ->get([
                'id',
                'code',
                'name',
                'phone',
                'tier',
                'points',
                'total_spent',
                'debt_balance',
                'credit_limit',
            ]);

        $tables = [];
        if (in_array($storeTypeCode, ['fnb', 'hospitality'])) {
            $tables = CafeTable::where('store_id', $storeId)
                ->where('branch_id', $branchId)
                ->where('is_active', true)
                ->orderBy('table_number')
                ->get(['id', 'table_number', 'capacity', 'status']);
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
            ]);

        // Check for active shift
        $activeShift = CashierShift::where('store_id', $storeId)
            ->where('user_id', $user->id)
            ->where('status', 'open')
            ->first();

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
            'todaySales' => $todaySales,
            'storeType' => $storeTypeCode,
            'posMode' => $storeTypeCode,
            'storeName' => $store?->name ?? '',
            'receiptFooter' => $store?->receipt_footer ?? '',
            'pgMethods' => $this->getActivePgMethods($storeId),
            'activeShift' => $activeShift,
            'employees' => $employees,
        ]);
    }

    /**
     * Ambil daftar metode PG aktif dari config platform (dikelola developer),
     * dengan label user-friendly. Semua store memakai akun PG yang sama.
     */
    private function getActivePgMethods(int $storeId): array
    {
        $gateways = PlatformPaymentGateway::where('is_active', true)->get();

        $methods = [];
        foreach ($gateways as $gw) {
            foreach ($gw->enabled_methods ?? [] as $method) {
                $methods[] = [
                    'provider' => $gw->provider,
                    'payment_type' => $method,
                ];
            }
        }

        return $methods;
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

    public function store(Request $request)
    {
        $validated = $request->validate([
            'idempotency_key' => 'nullable|string|max:100',
            'customer_id' => 'nullable|exists:customers,id',
            'table_id' => 'nullable|integer',
            'order_type' => 'required|string|max:30',
            'discount_amount' => 'nullable|numeric|min:0',
            'tax_amount' => 'nullable|numeric|min:0',
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

        DB::beginTransaction();
        try {
            $user = $request->user();
            $storeId = session('current_store_id');
            $branchId = session('branch_id');
            $store = Store::with('storeType')->find($storeId);
            $storeTypeCode =
                $store?->getRelation('storeType')?->code ?? 'retail';

            // Load relations needed for hasFeature() gate check
            $store?->load(['planModel.features', 'storeFeatures.feature']);
            $now = now();

            $prefix = 'SL-'.$now->format('Ymd').'-';
            $last = Sale::where('sale_no', 'like', $prefix.'%')
                ->orderByDesc('sale_no')
                ->first();
            $seq = $last ? (int) substr($last->sale_no, -3) + 1 : 1;
            $saleNo = $prefix.str_pad($seq, 3, '0', STR_PAD_LEFT);

            $items = $validated['items'];

            // ── Resolve customer tier for promo ──
            $customerTier = null;
            if (! empty($validated['customer_id'])) {
                $customerTier = Customer::find($validated['customer_id'])
                    ?->tier;
            }

            // ── Auto-apply promosi per item ──
            $promoEnabled = $store->hasFeature('promo');
            $promoService = new PromotionService;
            if ($promoEnabled) {
                $items = $promoService->applyPromosToCart($items, $customerTier);
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

            // ── Auto-apply cart-level promo ──
            $cartPromoResult = $promoEnabled
                ? $promoService->findBestCartPromo(
                    $subtotal,
                    $customerTier,
                )
                : null;
            $cartPromoDiscount = 0;
            $cartPromoId = null;
            if ($cartPromoResult) {
                $cartPromoDiscount = $cartPromoResult['discount'];
                $cartPromoId = $cartPromoResult['promotion']->id;
            }

            // ── Grand total sebelum rounding ──
            $grandTotal = $subtotal - $discount - $cartPromoDiscount + $tax
                + ($validated['shipping_amount'] ?? 0);

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
                'discount_amount' => $discount + $cartPromoDiscount,
                'tax_amount' => $tax,
                'shipping_amount' => $validated['shipping_amount'] ?? 0,
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

            // Set kitchen_status untuk mode FnB
            if (
                in_array($storeTypeCode, ['fnb']) &&
                $saleStatus !== 'pending'
            ) {
                $sale->update(['kitchen_status' => 'pending']);
            }

            // Mark table as occupied
            if (! empty($validated['table_id'])) {
                CafeTable::where('id', $validated['table_id'])
                    ->where('store_id', $storeId)
                    ->update(['status' => 'occupied']);
            }

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
                            ->sum('quantity');

                        // Cek stok bahan (kecuali is_nullable)
                        if (! $recipe->is_nullable && $rawStock < $needed) {
                            throw new \Exception(
                                "Stok bahan \"{$recipe->rawMaterial->name}\" tidak cukup. ".
                                    "Dibutuhkan {$needed} {$recipe->unit}, tersedia {$rawStock}.",
                            );
                        }

                        $ingredientCost +=
                            $needed * (float) $recipe->rawMaterial->cost_price;

                        $snapshot[] = [
                            'raw_material_id' => $recipe->raw_material_id,
                            'raw_material_name' => $recipe->rawMaterial->name,
                            'quantity_per_unit' => (float) $recipe->quantity,
                            'total_quantity' => $needed,
                            'unit' => $recipe->unit,
                            'cost_price' => (float) $recipe->rawMaterial->cost_price,
                            'total_cost' => $needed *
                                (float) $recipe->rawMaterial->cost_price,
                            'is_nullable' => $recipe->is_nullable,
                        ];
                    }
                    $recipeSnapshot = $snapshot;
                }

                SaleItem::create([
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
                    // Potong stok bahan baku
                    foreach ($product->recipes as $recipe) {
                        $needed = $recipe->quantity * $item['quantity'];
                        if ($recipe->is_nullable) {
                            $rawStock = $recipe->rawMaterial->stocks
                                ->where('store_id', $storeId)
                                ->sum('quantity');
                            if ($rawStock <= 0) {
                                continue;
                            } // skip bahan opsional yang habis
                        }
                        $stock = ProductStock::firstOrCreate(
                            [
                                'product_id' => $recipe->raw_material_id,
                                'variant_id' => null,
                                'packaging_unit_id' => null,
                                'store_id' => $storeId,
                            ],
                            ['quantity' => 0, 'reserved_quantity' => 0, 'average_cost' => 0],
                        );
                        $stock->decrement('quantity', $needed);

                        // Catat riwayat pergerakan stok bahan baku (branch_id untuk audit)
                        StockMovement::create([
                            'product_id' => $recipe->raw_material_id,
                            'store_id' => $storeId,
                            'branch_id' => $branchId,
                            'reference_type' => Sale::class,
                            'reference_id' => $sale->id,
                            'movement_type' => 'sale_out',
                            'quantity' => $needed,
                            'unit_cost' => $recipe->rawMaterial->cost_price,
                            'reference_no' => $saleNo,
                            'notes' => "Penjualan #{$saleNo} — bahan untuk {$product->name}",
                            'moved_at' => $now,
                        ]);
                    }
                } else {
                    // Potong stok dari bucket yang tepat (product + variant +
                    // packaging_unit) — minimarket behavior. Menjual per dus
                    // hanya mengurangi bucket dus (dalam satuan dus itu
                    // sendiri, tidak ada konversi otomatis ke pcs), tidak
                    // menyentuh bucket pcs.
                    if ($product?->track_stock) {
                        $actualQty = $item['quantity'];
                        $variantId = $item['variant_id'] ?? null;
                        $packagingUnitId = $item['packaging_unit_id'] ?? null;

                        $stock = ProductStock::firstOrCreate(
                            [
                                'product_id' => $item['product_id'],
                                'variant_id' => $variantId,
                                'packaging_unit_id' => $packagingUnitId,
                                'store_id' => $storeId,
                            ],
                            ['quantity' => 0, 'reserved_quantity' => 0, 'average_cost' => 0],
                        );
                        $stock->decrement('quantity', $actualQty);

                        $unitLabel = ! empty($item['unit_name']) ? " ({$item['unit_name']})" : '';

                        // Catat riwayat pergerakan stok produk (branch_id untuk audit)
                        StockMovement::create([
                            'product_id' => $item['product_id'],
                            'variant_id' => $variantId,
                            'packaging_unit_id' => $packagingUnitId,
                            'store_id' => $storeId,
                            'branch_id' => $branchId,
                            'reference_type' => Sale::class,
                            'reference_id' => $sale->id,
                            'movement_type' => 'sale_out',
                            'quantity' => $actualQty,
                            'unit_cost' => $stock->average_cost > 0 ? $stock->average_cost : ($product?->cost_price ?? 0),
                            'reference_no' => $saleNo,
                            'notes' => "Penjualan #{$saleNo} — {$item['quantity']}x{$unitLabel} {$item['product_id']}",
                            'moved_at' => $now,
                        ]);
                    }
                }
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

                $customer = Customer::find($validated['customer_id'] ?? null);
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
            'customer_name' => 'nullable|string|max:200',
            'notes' => 'nullable|string|max:500',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|integer',
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
            $store?->load(['planModel.features', 'storeFeatures.feature']);
            $now = now();

            $prefix = 'SL-'.$now->format('Ymd').'-';
            $last = Sale::where('sale_no', 'like', $prefix.'%')
                ->orderByDesc('sale_no')
                ->first();
            $seq = $last ? (int) substr($last->sale_no, -3) + 1 : 1;
            $saleNo = $prefix.str_pad($seq, 3, '0', STR_PAD_LEFT);

            $items = $validated['items'];

            $customerTier = null;
            if (! empty($validated['customer_id'])) {
                $customerTier = Customer::find($validated['customer_id'])?->tier;
            }
            $promoEnabled = $store->hasFeature('promo');
            $promoService = new PromotionService;
            if ($promoEnabled) {
                $items = $promoService->applyPromosToCart($items, $customerTier);
            }

            $subtotal = 0;
            foreach ($items as $item) {
                $disc = ($item['discount_amount'] ?? 0) + ($item['promo_discount'] ?? 0);
                $modExtra = collect($item['modifiers'] ?? [])->sum('price_addition');
                $subtotal += $item['quantity'] * ($item['price'] + $modExtra) - $disc;
            }

            $discount = $validated['discount_amount'] ?? 0;
            $tax = $validated['tax_amount'] ?? 0;
            $cartPromoResult = $promoEnabled ? $promoService->findBestCartPromo($subtotal, $customerTier) : null;
            $cartPromoDiscount = $cartPromoResult ? $cartPromoResult['discount'] : 0;
            $cartPromoId = $cartPromoResult ? $cartPromoResult['promotion']->id : null;

            $preRoundingTotal = $subtotal - $discount - $cartPromoDiscount + $tax + ($validated['shipping_amount'] ?? 0);

            // Rounding — only if store feature enabled AND has cash payment in the (future) payment
            // We defer the full rounding check to finalize(), but pre-calculate from frontend hints
            $roundingService = app(CashRoundingService::class);
            $roundingMode = $validated['rounding_mode'] ?? null;
            $roundingNearest = (int) ($validated['rounding_nearest'] ?? 0);
            $roundingCustom = $validated['rounding_custom'] ?? null;
            $roundingAdjustment = (float) ($validated['rounding_adjustment'] ?? 0);
            $grandTotal = $preRoundingTotal + $roundingAdjustment;

            // Pre-validate stock
            $this->validateStockForItems($items, $storeId);

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
                'discount_amount' => $discount + $cartPromoDiscount,
                'tax_amount' => $tax,
                'shipping_amount' => $validated['shipping_amount'] ?? 0,
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
                'extra_data' => $this->buildExtraData($validated, $storeTypeCode),
            ]);

            if (! empty($validated['employee_id'])) {
                $sale->update(['employee_id' => $validated['employee_id']]);
            }

            // Create SaleItems (no stock deduction)
            $this->createSaleItems($sale, $items, $storeId);

            // Mark table occupied
            if (! empty($validated['table_id'])) {
                CafeTable::where('id', $validated['table_id'])
                    ->where('store_id', $storeId)
                    ->update(['status' => 'occupied']);
            }

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
            abort_if($sale->status !== 'pending', 422, 'Transaksi sudah selesai atau dibatalkan.');

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
                $customer = Customer::find($customerId);
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
     */
    public function cancelPending(Request $request, Sale $sale)
    {
        $storeId = session('current_store_id');
        abort_if($sale->store_id !== $storeId, 403);
        abort_if($sale->status !== 'pending', 422, 'Transaksi sudah selesai atau dibatalkan.');

        if ($sale->table_id) {
            CafeTable::where('id', $sale->table_id)
                ->where('store_id', $storeId)
                ->update(['status' => 'available']);
        }

        $sale->delete(); // cascade deletes items

        return response()->json(['success' => true, 'message' => 'Transaksi dibatalkan.']);
    }
}
