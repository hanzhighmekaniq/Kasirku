<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PaymentGatewayTransaction;
use App\Models\ProductStock;
use App\Models\Sale;
use App\Models\SalePayment;
use App\Models\StockMovement;
use App\Models\Store;
use App\Models\StorePaymentGateway;
use App\Services\PaymentGateway\PaymentGatewayFactory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PaymentGatewayController extends Controller
{
    /** Ambil store_id dari session. */
    private function getStoreId(): int
    {
        return session('current_store_id') ?? Store::first()->id;
    }

    // ── CRUD: Gateway configuration ───────────────

    public function index()
    {
        $storeId = $this->getStoreId();
        $gateways = StorePaymentGateway::where('store_id', $storeId)->get()
            ->map(fn ($c) => [
                'id' => $c->id,
                'provider' => $c->provider,
                'is_active' => $c->is_active,
                'environment' => $c->environment,
                'merchant_id' => $c->merchant_id,
                'enabled_methods' => $c->enabled_methods,
                'has_server_key' => ! empty($c->server_key),
                'has_client_key' => ! empty($c->client_key),
            ]);

        $stats = [
            'total' => $gateways->count(),
            'active' => $gateways->where('is_active', true)->count(),
            'inactive' => $gateways->where('is_active', false)->count(),
        ];

        return Inertia::render('Admin/PaymentGateway/Index', [
            'gateways' => $gateways->values(),
            'stats' => $stats,
        ]);
    }

    public function create()
    {
        $storeId = $this->getStoreId();
        $allProviders = StorePaymentGateway::availableProviders();
        $configured = StorePaymentGateway::where('store_id', $storeId)
            ->pluck('provider')->toArray();

        $availableProviders = array_filter(
            $allProviders,
            fn ($key) => ! in_array($key, $configured),
            ARRAY_FILTER_USE_KEY,
        );

        return Inertia::render('Admin/PaymentGateway/Create', [
            'availableProviders' => $availableProviders,
        ]);
    }

    public function store(Request $request)
    {
        $storeId = $this->getStoreId();

        $validated = $request->validate([
            'provider' => 'required|string|max:50',
            'is_active' => 'boolean',
            'environment' => 'required|in:sandbox,production',
            'server_key' => 'nullable|string|max:500',
            'client_key' => 'nullable|string|max:500',
            'merchant_id' => 'nullable|string|max:100',
            'enabled_methods' => 'nullable|array',
            'enabled_methods.*' => 'string',
        ]);

        $isActive = $validated['is_active'] ?? false;

        // Hanya 1 gateway aktif — nonaktifkan yang lain
        if ($isActive) {
            StorePaymentGateway::where('store_id', $storeId)
                ->update(['is_active' => false]);
        }

        $gateway = StorePaymentGateway::create([
            'store_id' => $storeId,
            'provider' => $validated['provider'],
            'is_active' => $isActive,
            'environment' => $validated['environment'],
            'server_key' => $validated['server_key'] ?? null,
            'client_key' => $validated['client_key'] ?? null,
            'merchant_id' => $validated['merchant_id'] ?? null,
            'enabled_methods' => $validated['enabled_methods'] ?? [],
        ]);

        PaymentGatewayFactory::flushCache($storeId, $validated['provider']);

        return redirect()
            ->route('admin.payment-gateway.index')
            ->with('success', "Gateway {$validated['provider']} berhasil ditambahkan.");
    }

    public function edit(StorePaymentGateway $storePaymentGateway)
    {
        return Inertia::render('Admin/PaymentGateway/Edit', [
            'gateway' => [
                'id' => $storePaymentGateway->id,
                'provider' => $storePaymentGateway->provider,
                'is_active' => $storePaymentGateway->is_active,
                'environment' => $storePaymentGateway->environment,
                'merchant_id' => $storePaymentGateway->merchant_id,
                'enabled_methods' => $storePaymentGateway->enabled_methods,
                'has_server_key' => ! empty($storePaymentGateway->server_key),
                'has_client_key' => ! empty($storePaymentGateway->client_key),
            ],
        ]);
    }

    public function update(Request $request, StorePaymentGateway $storePaymentGateway)
    {
        $validated = $request->validate([
            'is_active' => 'boolean',
            'environment' => 'required|in:sandbox,production',
            'server_key' => 'nullable|string|max:500',
            'client_key' => 'nullable|string|max:500',
            'merchant_id' => 'nullable|string|max:100',
            'enabled_methods' => 'nullable|array',
            'enabled_methods.*' => 'string',
        ]);

        $isActive = $validated['is_active'] ?? false;

        // Hanya 1 gateway aktif — nonaktifkan yang lain
        if ($isActive) {
            StorePaymentGateway::where('store_id', $storePaymentGateway->store_id)
                ->where('id', '!=', $storePaymentGateway->id)
                ->update(['is_active' => false]);
        }

        $storePaymentGateway->is_active = $isActive;
        $storePaymentGateway->environment = $validated['environment'];
        $storePaymentGateway->merchant_id = $validated['merchant_id'] ?? null;
        $storePaymentGateway->enabled_methods = $validated['enabled_methods'] ?? [];

        if (! empty($validated['server_key']) && $validated['server_key'] !== '••••••••') {
            $storePaymentGateway->server_key = $validated['server_key'];
        }
        if (! empty($validated['client_key']) && $validated['client_key'] !== '••••••••') {
            $storePaymentGateway->client_key = $validated['client_key'];
        }

        $storePaymentGateway->save();

        PaymentGatewayFactory::flushCache($storePaymentGateway->store_id, $storePaymentGateway->provider);

        return redirect()
            ->route('admin.payment-gateway.index')
            ->with('success', "Gateway {$storePaymentGateway->provider} berhasil diperbarui.");
    }

    public function destroy(StorePaymentGateway $storePaymentGateway)
    {
        $storePaymentGateway->delete();

        return redirect()
            ->route('admin.payment-gateway.index')
            ->with('success', "Gateway {$storePaymentGateway->provider} berhasil dihapus.");
    }

    public function toggle(StorePaymentGateway $storePaymentGateway)
    {
        $newStatus = ! $storePaymentGateway->is_active;

        // Hanya 1 gateway aktif — nonaktifkan yang lain saat mengaktifkan
        if ($newStatus) {
            StorePaymentGateway::where('store_id', $storePaymentGateway->store_id)
                ->where('id', '!=', $storePaymentGateway->id)
                ->update(['is_active' => false]);
        }

        $storePaymentGateway->update(['is_active' => $newStatus]);
        PaymentGatewayFactory::flushCache($storePaymentGateway->store_id, $storePaymentGateway->provider);

        return back()->with('success', "Status {$storePaymentGateway->provider} diubah.");
    }

    public function toggleEnv(StorePaymentGateway $storePaymentGateway)
    {
        $newEnv = $storePaymentGateway->environment === 'production' ? 'sandbox' : 'production';
        $storePaymentGateway->update(['environment' => $newEnv]);
        PaymentGatewayFactory::flushCache($storePaymentGateway->store_id, $storePaymentGateway->provider);

        return back()->with('success', "{$storePaymentGateway->provider} beralih ke ".($newEnv === 'production' ? 'Production' : 'Sandbox').'.');
    }

    // ── Create PG transaction (from Kasir) ──────────

    public function createTransaction(Request $request)
    {
        $user = Auth::user();
        $storeId = session('current_store_id');

        $validated = $request->validate([
            'sale_id' => 'required|exists:sales,id',
            'provider' => 'required|string',
            'payment_type' => 'required|string',
        ]);

        $sale = Sale::with('items.product', 'customer')->findOrFail($validated['sale_id']);

        // Pastikan sale milik toko ini
        abort_if($sale->store_id !== $storeId, 403);

        try {
            $gateway = PaymentGatewayFactory::make($validated['provider'], $storeId);

            $orderId = 'SL-'.$sale->id.'-'.time();

            $result = $gateway->createTransaction([
                'order_id' => $orderId,
                'amount' => $sale->grand_total,
                'payment_type' => $validated['payment_type'],
                'customer' => [
                    'name' => $sale->customer?->name ?? $user->name,
                    'email' => $sale->customer?->email ?? $user->email,
                    'phone' => $sale->customer?->phone ?? null,
                ],
                'items' => $sale->items()->get()->map(fn ($i) => [
                    'id' => (string) $i->product_id,
                    'price' => (int) round($i->price),
                    'quantity' => $i->quantity,
                    'name' => substr($i->product?->name ?? 'Item', 0, 50),
                ])->toArray(),
            ]);

            // Simpan record transaksi PG
            $pgTrx = PaymentGatewayTransaction::create([
                'sale_id' => $sale->id,
                'provider' => $validated['provider'],
                'external_id' => $orderId,
                'payment_type' => $validated['payment_type'],
                'status' => 'pending',
                'amount' => $sale->grand_total,
                'raw_response' => $result['raw'] ?? [],
            ]);

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
                'amount' => $sale->grand_total,
            ]);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }
    }

    // ── Check status (polling) ─────────────────────

    public function checkStatus(Request $request, int $pgTrxId)
    {
        $pgTrx = PaymentGatewayTransaction::with('sale')->findOrFail($pgTrxId);

        // Kalau sudah paid/expired/failed, return cached status
        if (in_array($pgTrx->status, ['paid', 'expired', 'failed'])) {
            return response()->json([
                'status' => $pgTrx->status,
                'sale_id' => $pgTrx->sale_id,
                'sale_no' => $pgTrx->sale?->sale_no,
            ]);
        }

        try {
            $storeId = $this->getStoreId();
            $gateway = PaymentGatewayFactory::make($pgTrx->provider, $storeId);
            $result = $gateway->getStatus($pgTrx->external_id);

            $pgTrx->update([
                'status' => $result['status'],
                'raw_response' => $result['raw'],
            ]);

            if ($result['status'] === 'paid') {
                $this->finalizeSale($pgTrx->sale, $pgTrx);
            }

            return response()->json([
                'status' => $result['status'],
                'sale_id' => $pgTrx->sale_id,
                'sale_no' => $pgTrx->sale?->sale_no,
            ]);
        } catch (\Throwable $e) {
            return response()->json(['status' => 'pending', 'message' => $e->getMessage()]);
        }
    }

    // ── List pending PG transactions for current store ──

    public function pendingTransactions()
    {
        $storeId = $this->getStoreId();

        $pending = PaymentGatewayTransaction::with('sale')
            ->whereHas('sale', fn ($q) => $q->where('store_id', $storeId))
            ->where('status', 'pending')
            ->where('created_at', '>=', now()->subHours(2))
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($trx) => [
                'pg_trx_id' => $trx->id,
                'external_id' => $trx->external_id,
                'sale_id' => $trx->sale_id,
                'sale_no' => $trx->sale?->sale_no,
                'provider' => $trx->provider,
                'payment_type' => $trx->payment_type,
                'amount' => $trx->amount,
                'created_at' => $trx->created_at->toISOString(),
            ]);

        return response()->json(['transactions' => $pending]);
    }

    // ── Finalize sale setelah pembayaran sukses ────

    public function finalizeSale(Sale $sale, PaymentGatewayTransaction $pgTrx): void
    {
        if ($sale->status === 'completed') {
            return;
        }

        DB::transaction(function () use ($sale, $pgTrx) {
            // Buat SalePayment
            SalePayment::firstOrCreate(
                ['sale_id' => $sale->id, 'payment_method_id' => null],
                [
                    'paid_at' => now(),
                    'amount' => $pgTrx->amount,
                    'reference_no' => $pgTrx->external_id,
                    'note' => "PG: {$pgTrx->provider} / {$pgTrx->payment_type}",
                ]
            );

            // Potong stok — bucket-aware (pattern Fase 1)
            $sale->load('items.product');
            $now = now();

            foreach ($sale->items as $item) {
                $product = $item->product;
                if (! $product) {
                    continue;
                }

                // Cek resep — bahan baku selalu product-level (variant_id=null, packaging_unit_id=null)
                $product->load('recipes.rawMaterial.stocks');
                if ($product->recipes->isNotEmpty()) {
                    foreach ($product->recipes as $recipe) {
                        $needed = $recipe->quantity * $item->quantity;
                        if ($recipe->is_nullable) {
                            $avail = $recipe->rawMaterial->stocks
                                ->where('store_id', $sale->store_id)
                                ->sum('quantity');
                            if ($avail <= 0) {
                                continue;
                            }
                        }
                        $stock = ProductStock::firstOrCreate(
                            [
                                'product_id' => $recipe->raw_material_id,
                                'variant_id' => null,
                                'packaging_unit_id' => null,
                                'store_id' => $sale->store_id,
                            ],
                            ['quantity' => 0, 'reserved_quantity' => 0, 'average_cost' => 0],
                        );
                        $stock->decrement('quantity', $needed);

                        StockMovement::create([
                            'product_id' => $recipe->raw_material_id,
                            'store_id' => $sale->store_id,
                            'reference_type' => Sale::class,
                            'reference_id' => $sale->id,
                            'movement_type' => 'sale_out',
                            'quantity' => $needed,
                            'unit_cost' => $recipe->rawMaterial->cost_price ?? 0,
                            'reference_no' => $pgTrx->external_id,
                            'notes' => "PG {$pgTrx->provider} #{$pgTrx->external_id} — bahan untuk {$product->name}",
                            'moved_at' => $now,
                        ]);
                    }
                } elseif ($product->track_stock) {
                    // Bucket-aware: potong stok dari bucket yang tepat
                    $stock = ProductStock::firstOrCreate(
                        [
                            'product_id' => $item->product_id,
                            'variant_id' => $item->variant_id,
                            'packaging_unit_id' => $item->packaging_unit_id,
                            'store_id' => $sale->store_id,
                        ],
                        ['quantity' => 0, 'reserved_quantity' => 0, 'average_cost' => 0],
                    );
                    $stock->decrement('quantity', $item->quantity);

                    $unitLabel = $item->unit_name ? " ({$item->unit_name})" : '';

                    StockMovement::create([
                        'product_id' => $item->product_id,
                        'variant_id' => $item->variant_id,
                        'packaging_unit_id' => $item->packaging_unit_id,
                        'store_id' => $sale->store_id,
                        'reference_type' => Sale::class,
                        'reference_id' => $sale->id,
                        'movement_type' => 'sale_out',
                        'quantity' => $item->quantity,
                        'unit_cost' => $stock->average_cost > 0 ? $stock->average_cost : ($product->cost_price ?? 0),
                        'reference_no' => $pgTrx->external_id,
                        'notes' => "PG {$pgTrx->provider} #{$pgTrx->external_id} — {$item->quantity}x{$unitLabel} {$product->name}",
                        'moved_at' => $now,
                    ]);
                }
            }

            $sale->update([
                'status' => 'completed',
                'payment_status' => 'paid',
                'paid_amount' => $pgTrx->amount,
                'change_amount' => 0,
            ]);
        });
    }
}
