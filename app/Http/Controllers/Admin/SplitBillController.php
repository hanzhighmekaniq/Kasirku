<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Concerns\FinalizesSaleStock;
use App\Http\Controllers\Concerns\HasStoreScope;
use App\Http\Controllers\Controller;
use App\Models\CafeTable;
use App\Models\CashierShift;
use App\Models\Customer;
use App\Models\Employee;
use App\Models\EmployeeCommission;
use App\Models\PaymentGatewayTransaction;
use App\Models\PaymentMethod;
use App\Models\Promotion;
use App\Models\Sale;
use App\Models\SalePayment;
use App\Models\SaleSplitPayer;
use App\Models\Store;
use App\Services\CashRoundingService;
use App\Services\PaymentGateway\PaymentGatewayFactory;
use App\Services\PromotionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class SplitBillController extends Controller
{
    use FinalizesSaleStock, HasStoreScope;

    /**
     * Start a split bill: create Sale (pending) + SaleItems + SaleSplitPayers.
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
            // Split-specific
            'split_mode' => 'required|in:item,equal',
            'payers' => 'required|array|min:2|max:10',
            'payers.*.name' => 'required|string|max:100',
            'payers.*.customer_id' => 'nullable|exists:customers,id',
            'payers.*.assignments' => 'nullable|array',
            'payers.*.assignments.*.cartId' => 'required_with:payers.*.assignments|string',
            'payers.*.assignments.*.unitIndex' => 'required_with:payers.*.assignments|integer|min:0',
            // Mode-specific (reuse from KasirController)
            'rental_duration' => 'nullable|integer|min:1',
            'rental_unit' => 'nullable|in:per_hour,per_day,per_week',
            'ticket_event' => 'nullable|string|max:200',
            'ticket_slot' => 'nullable|string|max:100',
            'room_number' => 'nullable|string|max:50',
            'guest_count' => 'nullable|integer|min:1',
            'employee_id' => 'nullable|exists:employees,id',
        ]);

        // Idempotency check
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
                    'split_payers' => $existing->splitPayers()
                        ->orderBy('sort_order')
                        ->get(['id', 'name', 'total', 'status']),
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

            // Generate sale number
            $prefix = 'SL-'.$now->format('Ymd').'-';
            $last = Sale::where('sale_no', 'like', $prefix.'%')
                ->orderByDesc('sale_no')
                ->first();
            $seq = $last ? (int) substr($last->sale_no, -3) + 1 : 1;
            $saleNo = $prefix.str_pad($seq, 3, '0', STR_PAD_LEFT);

            $items = $validated['items'];

            // Apply promos
            $customerTier = null;
            if (! empty($validated['customer_id'])) {
                $customerTier = Customer::find($validated['customer_id'])?->tier;
            }
            $promoEnabled = $store->hasFeature('promo');
            $promoService = new PromotionService;
            if ($promoEnabled) {
                $items = $promoService->applyPromosToCart($items, $customerTier);
            }

            // Calculate subtotal
            $subtotal = 0;
            foreach ($items as $item) {
                $disc = ($item['discount_amount'] ?? 0) + ($item['promo_discount'] ?? 0);
                $modExtra = collect($item['modifiers'] ?? [])->sum('price_addition');
                $subtotal += $item['quantity'] * ($item['price'] + $modExtra) - $disc;
            }

            $discount = $validated['discount_amount'] ?? 0;
            $tax = $validated['tax_amount'] ?? 0;

            // Cart-level promo
            $cartPromoResult = $promoEnabled
                ? $promoService->findBestCartPromo($subtotal, $customerTier)
                : null;
            $cartPromoDiscount = $cartPromoResult ? $cartPromoResult['discount'] : 0;
            $cartPromoId = $cartPromoResult ? $cartPromoResult['promotion']->id : null;

            // No rounding at sale level — rounding applies per-payer in payOffline()
            $grandTotal = $subtotal - $discount - $cartPromoDiscount + $tax
                + ($validated['shipping_amount'] ?? 0);

            // Pre-validate stock
            $this->validateStockForItems($items, $storeId);

            // Create Sale (pending, no stock deduction yet)
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
                'rounding_adjustment' => 0,
                'grand_total' => $grandTotal,
                'paid_amount' => 0,
                'change_amount' => 0,
                'status' => 'pending',
                'payment_status' => 'unpaid',
                'split_status' => 'in_progress',
                'delivery_address' => $validated['delivery_address'] ?? null,
                'customer_name' => $validated['customer_name'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'idempotency_key' => $validated['idempotency_key'] ?? null,
            ]);

            // Create SaleItems (no stock deduction)
            $this->createSaleItems($sale, $items, $storeId);

            // Mark table as occupied
            if (! empty($validated['table_id'])) {
                CafeTable::where('id', $validated['table_id'])
                    ->where('store_id', $storeId)
                    ->update(['status' => 'occupied']);
            }

            // Calculate per-payer totals (SERVER-SIDE)
            $payers = $validated['payers'];
            $splitMode = $validated['split_mode'];

            if ($splitMode === 'equal') {
                $payerTotals = $this->calculateEqualSplit($payers, $grandTotal);
            } else {
                $payerTotals = $this->calculateItemSplit($payers, $items, $grandTotal, $subtotal);
            }

            // Create SaleSplitPayers
            $createdPayers = [];
            foreach ($payerTotals as $i => $pt) {
                $payer = SaleSplitPayer::create([
                    'sale_id' => $sale->id,
                    'name' => $pt['name'],
                    'customer_id' => $pt['customer_id'] ?? null,
                    'subtotal' => $pt['subtotal'],
                    'discount' => $pt['discount'],
                    'tax' => $pt['tax'],
                    'total' => $pt['total'],
                    'status' => 'pending',
                    'sort_order' => $i,
                ]);
                $createdPayers[] = $payer;
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
                'split_payers' => $createdPayers->map(fn ($p) => [
                    'id' => $p->id,
                    'name' => $p->name,
                    'total' => (float) $p->total,
                    'status' => $p->status,
                ]),
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
     * Process offline payment for one split payer.
     */
    public function payOffline(Request $request)
    {
        $validated = $request->validate([
            'sale_id' => 'required|exists:sales,id',
            'split_payer_id' => 'required|exists:sale_split_payers,id',
            'method_id' => 'required|exists:payment_methods,id',
            'paid_amount' => 'required|numeric|min:0',
            'rounding_mode' => 'nullable|in:nearest,up,down,custom',
            'rounding_nearest' => 'nullable|integer|min:1',
            'rounding_custom' => 'nullable|numeric',
            'kasbon_due_date' => 'nullable|date',
            'kasbon_note' => 'nullable|string|max:500',
        ]);

        DB::beginTransaction();
        try {
            $storeId = session('current_store_id');
            $sale = Sale::findOrFail($validated['sale_id']);
            abort_if($sale->store_id !== $storeId, 403);
            abort_if($sale->split_status !== 'in_progress', 422, 'Split bill sudah selesai atau dibatalkan.');

            $payer = SaleSplitPayer::findOrFail($validated['split_payer_id']);
            abort_if($payer->sale_id !== $sale->id, 422, 'Payer tidak sesuai dengan transaksi.');
            abort_if($payer->status !== 'pending', 422, 'Payer ini sudah dibayar.');

            // ── Rounding per-payer (cash only) ──
            $paymentMethod = PaymentMethod::find($validated['method_id']);
            $roundingService = app(CashRoundingService::class);
            $payerTotal = (float) $payer->total;
            $roundingMode = null;
            $roundingNearest = null;
            $roundingAdjustment = 0.0;

            if ($paymentMethod && $paymentMethod->type === 'cash') {
                $rMode = $validated['rounding_mode'] ?? 'nearest';
                $rNearest = (int) ($validated['rounding_nearest'] ?? 100);
                $rCustom = $validated['rounding_custom'] ?? null;

                $roundingResult = $roundingService->calculateForPayment(
                    $payerTotal,
                    'cash',
                    $rNearest,
                    $rMode,
                    $rCustom,
                );
                $payerTotal = $roundingResult['rounded'];
                $roundingMode = $roundingResult['mode'];
                $roundingNearest = $roundingResult['nearest'];
                $roundingAdjustment = $roundingResult['adjustment'];
            }

            $paidAmount = (float) $validated['paid_amount'];
            $change = max(0, $paidAmount - $payerTotal);

            // Create SalePayment
            $salePayment = SalePayment::create([
                'sale_id' => $sale->id,
                'payment_method_id' => $validated['method_id'],
                'paid_at' => now(),
                'amount' => $payerTotal,
                'payer_name' => $payer->name,
                'payer_customer_id' => $payer->customer_id,
                'paid_amount' => $paidAmount,
                'change_amount' => $change,
                'is_split' => true,
            ]);

            // ── Debt/kasbon processing (per payer) ──
            if ($paymentMethod && $paymentMethod->type === 'debt') {
                if (! $request->user()->can('debt.create')) {
                    throw new \Exception('Anda tidak memiliki izin untuk menerima pembayaran hutang.');
                }

                $debtCustomerId = $payer->customer_id ?? $sale->customer_id;
                if (! $debtCustomerId) {
                    throw new \Exception('Pelanggan wajib dipilih untuk pembayaran kasbon.');
                }
                $debtCustomer = Customer::find($debtCustomerId);
                if (! $debtCustomer) {
                    throw new \Exception('Pelanggan tidak ditemukan.');
                }

                $newDebt = (float) $debtCustomer->debt_balance + $payerTotal;
                if ($debtCustomer->credit_limit > 0 && $newDebt > $debtCustomer->credit_limit) {
                    throw new \Exception(
                        'Hutang melebihi limit kredit. Limit: Rp'.number_format($debtCustomer->credit_limit).
                        ', Hutang saat ini: Rp'.number_format($debtCustomer->debt_balance).
                        ', Ditambah: Rp'.number_format($payerTotal),
                    );
                }

                $kasbonDueDate = $validated['kasbon_due_date'] ?? null;
                $kasbonNote = $validated['kasbon_note'] ?? "Hutang dari split bill #{$sale->sale_no} — {$payer->name}";

                CustomerDebtLog::create([
                    'customer_id' => $debtCustomer->id,
                    'store_id' => $storeId,
                    'sale_id' => $sale->id,
                    'type' => 'add',
                    'amount' => $payerTotal,
                    'balance_after' => $newDebt,
                    'due_date' => $kasbonDueDate,
                    'notes' => $kasbonNote,
                    'created_by' => $request->user()->id,
                ]);
                $debtCustomer->update(['debt_balance' => $newDebt]);
            }

            // Update split payer (with rounding info)
            $payer->update([
                'status' => 'paid',
                'payment_method_id' => $validated['method_id'],
                'paid_amount' => $paidAmount,
                'change_amount' => $change,
                'rounding_mode' => $roundingMode,
                'rounding_nearest' => $roundingNearest,
                'rounding_adjustment' => $roundingAdjustment,
                'sale_payment_id' => $salePayment->id,
            ]);

            // Check if all payers are paid
            $allPaid = $sale->splitPayers()->where('status', 'pending')->count() === 0;

            $receiptData = null;
            if ($allPaid) {
                $receiptData = $this->finalizeSplitSale($sale);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'payer_id' => $payer->id,
                'payer_status' => 'paid',
                'all_paid' => $allPaid,
                'receipt' => $receiptData,
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
     * Create PG transaction for one split payer.
     * Reuses PaymentGatewayController::createTransaction logic.
     */
    public function createPg(Request $request)
    {
        $validated = $request->validate([
            'sale_id' => 'required|exists:sales,id',
            'split_payer_id' => 'required|exists:sale_split_payers,id',
            'provider' => 'required|string',
            'payment_type' => 'required|string',
        ]);

        $storeId = session('current_store_id');
        $sale = Sale::with('items.product', 'customer')->findOrFail($validated['sale_id']);
        abort_if($sale->store_id !== $storeId, 403);

        $payer = SaleSplitPayer::findOrFail($validated['split_payer_id']);
        abort_if($payer->sale_id !== $sale->id, 422);
        abort_if($payer->status !== 'pending', 422, 'Payer ini sudah dibayar.');

        try {
            $gateway = PaymentGatewayFactory::make($validated['provider']);

            $orderId = 'SL-'.$sale->id.'-SPL-'.$payer->id.'-'.time();

            $result = $gateway->createTransaction([
                'order_id' => $orderId,
                'amount' => (int) round((float) $payer->total),
                'payment_type' => $validated['payment_type'],
                'customer' => [
                    'name' => $payer->customer?->name ?? $sale->customer?->name ?? Auth::user()->name,
                    'email' => $sale->customer?->email ?? Auth::user()->email,
                    'phone' => $payer->customer?->phone ?? $sale->customer?->phone ?? null,
                ],
                // Don't pass items — payer amount != full sale total,
                // so item_details sum wouldn't match gross_amount.
                // The gateway falls back to a single-item format that always matches.
            ]);

            $pgTrx = PaymentGatewayTransaction::create([
                'sale_id' => $sale->id,
                'sale_split_payer_id' => $payer->id,
                'provider' => $validated['provider'],
                'external_id' => $orderId,
                'payment_type' => $validated['payment_type'],
                'status' => 'pending',
                'amount' => (float) $payer->total,
                'raw_response' => $result['raw'] ?? [],
            ]);

            // Link pg_trx to payer
            $payer->update(['pg_trx_id' => $pgTrx->id]);

            return response()->json([
                'success' => true,
                'pg_trx_id' => $pgTrx->id,
                'external_id' => $orderId,
                'payment_url' => $result['payment_url'] ?? null,
                'qr_code' => $result['qr_code'] ?? null,
                'qr_image_url' => $result['qr_image_url'] ?? null,
                'va_number' => $result['va_number'] ?? null,
                'va_bank' => $result['va_bank'] ?? null,
                'payment_type' => $validated['payment_type'],
                'amount' => (float) $payer->total,
            ]);
        } catch (\Throwable $e) {
            return response()->json(
                ['success' => false, 'message' => $e->getMessage()],
                422,
            );
        }
    }

    /**
     * Get split bill details (for resume from history).
     */
    public function show(Sale $sale)
    {
        $storeId = session('current_store_id');
        abort_if($sale->store_id !== $storeId, 403);
        abort_if($sale->split_status !== 'in_progress', 422, 'Transaksi ini bukan split bill aktif.');

        $sale->load(['items.product:id,name,price', 'splitPayers.paymentMethod:id,name', 'customer:id,name']);

        return response()->json([
            'success' => true,
            'sale' => [
                'id' => $sale->id,
                'sale_no' => $sale->sale_no,
                'grand_total' => (float) $sale->grand_total,
                'order_type' => $sale->order_type,
                'customer_id' => $sale->customer_id,
                'table_id' => $sale->table_id,
                'split_status' => $sale->split_status,
            ],
            'items' => $sale->items->map(fn ($i) => [
                'cartId' => $i->product_id.'-'.$i->variant_id.'-'.$i->id,
                'productId' => $i->product_id,
                'variantId' => $i->variant_id,
                'name' => $i->product?->name ?? 'Item',
                'price' => (float) $i->price,
                'qty' => $i->quantity,
            ]),
            'payers' => $sale->splitPayers->map(fn ($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'customer_id' => $p->customer_id,
                'subtotal' => (float) $p->subtotal,
                'discount' => (float) $p->discount,
                'tax' => (float) $p->tax,
                'total' => (float) $p->total,
                'status' => $p->status,
                'payment_method_id' => $p->payment_method_id,
                'paid_amount' => $p->paid_amount ? (float) $p->paid_amount : null,
                'change_amount' => $p->change_amount ? (float) $p->change_amount : null,
                'payment_method_name' => $p->paymentMethod?->name,
            ]),
        ]);
    }

    /**
     * Cancel a split bill.
     */
    public function cancel(Request $request, Sale $sale)
    {
        $storeId = session('current_store_id');
        abort_if($sale->store_id !== $storeId, 403);
        abort_if($sale->split_status !== 'in_progress', 422, 'Transaksi ini bukan split bill aktif.');

        $hasPaidPayers = $sale->splitPayers()->where('status', 'paid')->exists();

        if ($hasPaidPayers) {
            // Requires sale.void permission
            if (! $request->user()->can('sale.void')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Sudah ada pembayaran masuk. Butuh permission sale.void untuk membatalkan.',
                ], 403);
            }

            // Soft cancel: mark as cancelled, keep payments as-is
            DB::beginTransaction();
            try {
                $sale->update([
                    'split_status' => 'cancelled',
                    'status' => 'cancelled',
                ]);

                // Void unpaid payers
                $sale->splitPayers()
                    ->where('status', 'pending')
                    ->update(['status' => 'void']);

                // Release table
                if ($sale->table_id) {
                    CafeTable::where('id', $sale->table_id)
                        ->where('store_id', $storeId)
                        ->update(['status' => 'available']);
                }

                DB::commit();

                return response()->json([
                    'success' => true,
                    'message' => 'Split bill dibatalkan. Pembayaran yang sudah masuk tetap tercatat.',
                ]);
            } catch (\Throwable $e) {
                DB::rollBack();

                return response()->json(
                    ['success' => false, 'message' => $e->getMessage()],
                    500,
                );
            }
        }

        // No payers paid: hard delete
        DB::beginTransaction();
        try {
            if ($sale->table_id) {
                CafeTable::where('id', $sale->table_id)
                    ->where('store_id', $storeId)
                    ->update(['status' => 'available']);
            }

            $sale->delete(); // cascade deletes split_payers + items

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Split bill dibatalkan.',
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();

            return response()->json(
                ['success' => false, 'message' => $e->getMessage()],
                500,
            );
        }
    }

    // ── Private helpers ──────────────────────────────────────────────

    /**
     * Finalize a split sale: deduct stock, update status, return receipt data.
     */
    private function finalizeSplitSale(Sale $sale): array
    {
        $storeId = $sale->store_id;
        $branchId = $sale->branch_id;
        $items = $sale->items()->with('product')->get()->toArray();

        // Deduct stock
        $this->deductStockForSale($sale, $items, $storeId, $branchId, $sale->sale_no);

        // Calculate totals from paid payers
        $paidTotal = $sale->splitPayers()->where('status', 'paid')->sum('paid_amount');
        $changeTotal = $sale->splitPayers()->where('status', 'paid')->sum('change_amount');

        // Update sale status
        $sale->update([
            'status' => 'completed',
            'payment_status' => 'paid',
            'split_status' => 'completed',
            'paid_amount' => $paidTotal,
            'change_amount' => $changeTotal,
        ]);

        // Employee commission (if applicable)
        $this->maybeCreateCommission($sale);

        // Build receipt data
        return $this->buildReceiptData($sale);
    }

    /**
     * Build receipt data array for a completed split sale.
     */
    private function buildReceiptData(Sale $sale): array
    {
        $sale->load(['items.product:id,name', 'splitPayers.paymentMethod:id,name', 'customer:id,name', 'table:id,table_number']);

        $methodMap = PaymentMethod::pluck('name', 'id')->toArray();

        return [
            'saleNo' => $sale->sale_no,
            'items' => $sale->items->map(fn ($i) => [
                'name' => $i->product?->name ?? 'Item',
                'variantName' => null,
                'qty' => $i->quantity,
                'price' => (float) $i->price,
                'subtotal' => (float) $i->subtotal,
                'promoDiscount' => (float) $i->promo_discount,
                'promoName' => null,
                'modifiers' => $i->modifiers,
            ])->toArray(),
            'subtotal' => (float) $sale->subtotal,
            'discount' => (float) $sale->discount_amount,
            'tax' => (float) $sale->tax_amount,
            'totalPromoDisc' => 0,
            'cartPromoDiscount' => 0,
            'cartPromoName' => null,
            'grandTotal' => (float) $sale->grand_total,
            'change' => (float) $sale->change_amount,
            'payments' => $sale->splitPayers->where('status', 'paid')->map(fn ($p) => [
                'methodName' => $p->paymentMethod?->name ?? '?',
                'amount' => (float) $p->total,
            ])->toArray(),
            'customerName' => $sale->customer?->name,
            'tableName' => $sale->table?->table_number,
            'orderType' => $sale->order_type,
            'splitPayers' => $sale->splitPayers->where('status', 'paid')->map(fn ($p) => [
                'name' => $p->name,
                'customer_id' => $p->customer_id,
                'amount' => (float) $p->total,
                'paid_amount' => $p->paid_amount ? (float) $p->paid_amount : (float) $p->total,
                'change_amount' => $p->change_amount ? (float) $p->change_amount : 0,
                'methodName' => $p->paymentMethod?->name,
                'items' => [],
            ])->toArray(),
            'splitReceiptMode' => 'per_payer',
        ];
    }

    /**
     * Calculate equal split totals.
     */
    private function calculateEqualSplit(array $payers, float $grandTotal): array
    {
        $n = count($payers);
        $each = (int) floor($grandTotal / $n);
        $remainder = $grandTotal - ($each * $n);

        $result = [];
        foreach ($payers as $i => $payer) {
            $total = $i === $n - 1 ? $each + $remainder : $each;
            $result[] = [
                'name' => $payer['name'],
                'customer_id' => $payer['customer_id'] ?? null,
                'subtotal' => $total,
                'discount' => 0,
                'tax' => 0,
                'total' => $total,
            ];
        }

        return $result;
    }

    /**
     * Calculate per-item split totals (server-side).
     */
    private function calculateItemSplit(array $payers, array $items, float $grandTotal, float $subtotal): array
    {
        // Build item price map: cartId => unit price
        $itemPriceMap = [];
        foreach ($items as $item) {
            $modExtra = collect($item['modifiers'] ?? [])->sum('price_addition');
            $price = $item['price'] + $modExtra;
            // Each unit of this item costs $price
            $qty = $item['quantity'];
            for ($u = 0; $u < $qty; $u++) {
                $cartId = ($item['product_id'] ?? '').'-'.($item['variant_id'] ?? '').'-'.$u;
                $itemPriceMap[$cartId] = $price;
            }
        }

        // Calculate subtotal per payer from assignments
        $payerSubtotals = [];
        foreach ($payers as $payer) {
            $ps = 0;
            if (! empty($payer['assignments'])) {
                foreach ($payer['assignments'] as $a) {
                    $cartId = $a['cartId'] ?? '';
                    // Try to match by cartId pattern
                    if (isset($itemPriceMap[$cartId])) {
                        $ps += $itemPriceMap[$cartId];
                    }
                }
            }
            $payerSubtotals[] = $ps;
        }

        $sumSubtotal = array_sum($payerSubtotals) ?: 1;
        $totalAdjust = $grandTotal - $sumSubtotal;

        $result = [];
        $allocatedSoFar = 0;
        $n = count($payers);

        foreach ($payers as $i => $payer) {
            $ps = $payerSubtotals[$i];
            $share = $ps / $sumSubtotal;
            $adjust = (int) round($share * $totalAdjust);

            if ($i === $n - 1) {
                $adjust = $totalAdjust - $allocatedSoFar;
            } else {
                $allocatedSoFar += $adjust;
            }

            $total = max(0, $ps + $adjust);
            $result[] = [
                'name' => $payer['name'],
                'customer_id' => $payer['customer_id'] ?? null,
                'subtotal' => $ps,
                'discount' => $adjust < 0 ? -$adjust : 0,
                'tax' => $adjust > 0 ? $adjust : 0,
                'total' => $total,
            ];
        }

        return $result;
    }

    /**
     * Create employee commission if applicable.
     */
    private function maybeCreateCommission(Sale $sale): void
    {
        $employeeId = $sale->employee_id;
        if (! $employeeId) {
            return;
        }

        $employee = Employee::find($employeeId);
        if (! $employee || $employee->commission_value <= 0) {
            return;
        }

        $baseAmount = (float) $sale->grand_total;
        $commissionAmount = match ($employee->commission_type) {
            'percent' => round($baseAmount * ($employee->commission_value / 100), 2),
            'flat' => min($employee->commission_value, $baseAmount),
            default => 0,
        };

        if ($commissionAmount > 0) {
            EmployeeCommission::create([
                'employee_id' => $employee->id,
                'store_id' => $sale->store_id,
                'sale_id' => $sale->id,
                'type' => $employee->commission_type ?? 'percent',
                'commission_rate' => $employee->commission_value,
                'base_amount' => $baseAmount,
                'commission_amount' => $commissionAmount,
                'status' => 'pending',
                'commission_date' => now()->toDateString(),
                'notes' => "Split bill #{$sale->sale_no}",
            ]);
        }
    }

    /**
     * Get active shift ID for current user.
     */
    private function getActiveShiftId(int $storeId, int $userId): ?int
    {
        return CashierShift::where('store_id', $storeId)
            ->where('user_id', $userId)
            ->where('status', 'open')
            ->value('id');
    }
}
