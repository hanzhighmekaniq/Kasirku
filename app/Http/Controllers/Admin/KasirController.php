<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Concerns\HasStoreScope;
use App\Http\Controllers\Controller;
use App\Models\CafeTable;
use App\Models\CashierShift;
use App\Models\Category;
use App\Models\Customer;
use App\Models\Employee;
use App\Models\EmployeeCommission;
use App\Models\PaymentMethod;
use App\Models\Product;
use App\Models\ProductStock;
use App\Models\Promotion;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\SalePayment;
use App\Models\StockMovement;
use App\Models\Store;
use App\Models\StorePaymentGateway;
use App\Models\StoreType;
use App\Services\PromotionService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class KasirController extends Controller
{
    use HasStoreScope;

    public function index()
    {
        /** @var User $user */
        $user = Auth::user();
        [$storeId, $branchId] = $this->storeScope();
        $store =
            $user->stores()->with('storeType')->find($storeId) ??
            $user->stores()->with('storeType')->first();
        $storeTypeCode = $store?->getRelation('storeType')?->code ?? 'retail';

        $products = Product::forStore($storeId)
            ->where('is_active', true)
            ->where('is_sellable', true)
            ->with([
                'category:id,name',
                'variants:id,product_id,name,sku,price,cost_price,is_active',
                'modifierGroups.modifiers',
                'recipes.rawMaterial:id,name,unit,base_unit,cost_price',
                'stocks' => fn ($q) => $q->where('store_id', $storeId),
                'packagingUnits' => fn ($q) => $q->where('sell_price', '>', 0),
            ])
            ->get()
            ->map(function ($p) use ($storeId) {
                $p->stock =
                    $p->stocks->sum('quantity') -
                    $p->stocks->sum('reserved_quantity');
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
            ->orderBy('sort_order')
            ->orderBy('type')
            ->get(['id', 'code', 'name', 'type', 'provider']);

        // Active promotions with their associated products
        $promotions = Promotion::forStore($storeId)
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
            ]);

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
            ->with(['customer:id,name', 'payments.paymentMethod:id,name'])
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
            ]);

        // Check for active shift
        $activeShift = CashierShift::where('store_id', $storeId)
            ->where('user_id', $user->id)
            ->where('status', 'open')
            ->first();

        $orderTypes = StoreType::where(
            'code',
            $storeTypeCode,
        )->value('order_types');

        return Inertia::render('Admin/Kasir/Kasir', [
            'products' => $products,
            'categories' => $categories,
            'paymentMethods' => $paymentMethods,
            'promotions' => $promotions,
            'initialCustomers' => $customers,
            'tables' => $tables,
            'todaySales' => $todaySales,
            'orderTypes' => $orderTypes,
            'storeType' => $storeTypeCode,
            'posMode' => $storeTypeCode,
            'storeName' => $store?->name ?? '',
            'receiptFooter' => $store?->receipt_footer ?? '',
            'pgMethods' => $this->getActivePgMethods($storeId),
            'activeShift' => $activeShift,
            'employees' => $employees,
        ]);
    }

    /** Ambil daftar metode PG aktif per toko, dengan label user-friendly */
    private function getActivePgMethods(int $storeId): array
    {
        $gateways = StorePaymentGateway::where('store_id', $storeId)
            ->where('is_active', true)
            ->get();

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
            'customer_name' => 'nullable|string|max:200',
            // ── Mode-specific fields ──────────────────────────────────────
            // Service / Ticket
            'service_weight' => 'nullable|numeric|min:0',
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
            $promoService = new PromotionService;
            $items = $promoService->applyPromosToCart($items, $customerTier);

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
            $cartPromoResult = $promoService->findBestCartPromo(
                $subtotal,
                $customerTier,
            );
            $cartPromoDiscount = 0;
            $cartPromoId = null;
            if ($cartPromoResult) {
                $cartPromoDiscount = $cartPromoResult['discount'];
                $cartPromoId = $cartPromoResult['promotion']->id;
            }

            $grandTotal =
                $subtotal -
                $discount -
                $cartPromoDiscount +
                $tax +
                ($validated['shipping_amount'] ?? 0);
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
                                'store_id' => $storeId,
                            ],
                            ['quantity' => 0, 'reserved_quantity' => 0],
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
                    // Potong stok produk langsung (minimarket behavior)
                    if ($product?->track_stock) {
                        $conversionQty = $item['unit_conversion_qty'] ?? 1;
                        $actualQty = $item['quantity'] * $conversionQty;

                        $stock = ProductStock::firstOrCreate(
                            [
                                'product_id' => $item['product_id'],
                                'store_id' => $storeId,
                            ],
                            ['quantity' => 0, 'reserved_quantity' => 0],
                        );
                        $stock->decrement('quantity', $actualQty);

                        $unitLabel = ! empty($item['unit_name']) ? " ({$item['unit_name']})" : '';

                        // Catat riwayat pergerakan stok produk (branch_id untuk audit)
                        StockMovement::create([
                            'product_id' => $item['product_id'],
                            'store_id' => $storeId,
                            'branch_id' => $branchId,
                            'reference_type' => Sale::class,
                            'reference_id' => $sale->id,
                            'movement_type' => 'sale_out',
                            'quantity' => $actualQty,
                            'unit_cost' => $product?->cost_price ?? 0,
                            'reference_no' => $saleNo,
                            'notes' => "Penjualan #{$saleNo} — {$item['quantity']}x{$unitLabel} {$item['product_id']}",
                            'moved_at' => $now,
                        ]);
                    }
                }
            }

            // Only create SalePayment for non-PG payments (PG creates it on callback)
            foreach ($validated['payments'] as $pay) {
                if (empty($pay['is_pg'])) {
                    SalePayment::create([
                        'sale_id' => $sale->id,
                        'payment_method_id' => $pay['method_id'],
                        'paid_at' => $now,
                        'amount' => $pay['amount'],
                        'reference_no' => $pay['reference_no'] ?? null,
                    ]);
                }
            }

            DB::commit();

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
}
