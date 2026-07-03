<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PaymentGatewayTransaction;
use App\Models\Sale;
use App\Models\SalePayment;
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
        return session('current_store_id') ?? \App\Models\Store::first()->id;
    }

    // ── Settings page ──────────────────────────────

    public function settings()
    {
        $storeId   = $this->getStoreId();
        $configs   = StorePaymentGateway::where('store_id', $storeId)->get()->keyBy('provider');
        $providers = StorePaymentGateway::availableProviders();

        return Inertia::render('Admin/Settings/PaymentGateway', [
            'providers' => $providers,
            'configs'   => $configs->map(fn($c) => [
                'id'              => $c->id,
                'provider'        => $c->provider,
                'is_active'       => $c->is_active,
                'environment'     => $c->environment,
                'merchant_id'     => $c->merchant_id,
                'enabled_methods' => $c->enabled_methods,
                // Keys ditampilkan sebagai masked
                'has_server_key'  => !empty($c->server_key),
                'has_client_key'  => !empty($c->client_key),
            ]),
        ]);
    }

    public function saveSettings(Request $request, string $provider)
    {
        $storeId = $this->getStoreId();

        $validated = $request->validate([
            'is_active'       => 'boolean',
            'environment'     => 'required|in:sandbox,production',
            'server_key'      => 'nullable|string|max:500',
            'client_key'      => 'nullable|string|max:500',
            'merchant_id'     => 'nullable|string|max:100',
            'enabled_methods' => 'nullable|array',
            'enabled_methods.*' => 'string',
        ]);

        $config = StorePaymentGateway::firstOrNew([
            'store_id' => $storeId,
            'provider' => $provider,
        ]);

        $config->is_active       = $validated['is_active'] ?? false;
        $config->environment     = $validated['environment'];
        $config->merchant_id     = $validated['merchant_id'] ?? null;
        $config->enabled_methods = $validated['enabled_methods'] ?? [];

        // Hanya update key jika dikirim (bukan masked placeholder)
        if (!empty($validated['server_key']) && $validated['server_key'] !== '••••••••') {
            $config->server_key = $validated['server_key'];
        }
        if (!empty($validated['client_key']) && $validated['client_key'] !== '••••••••') {
            $config->client_key = $validated['client_key'];
        }

        $config->save();

        PaymentGatewayFactory::flushCache($storeId, $provider);

        return back()->with('success', "Konfigurasi {$provider} berhasil disimpan.");
    }

    // ── Create PG transaction (from Kasir) ──────────

    public function createTransaction(Request $request)
    {
        $user    = Auth::user();
        $storeId = session('current_store_id');

        $validated = $request->validate([
            'sale_id'      => 'required|exists:sales,id',
            'provider'     => 'required|string',
            'payment_type' => 'required|string',
        ]);

        $sale = Sale::with('items.product', 'customer')->findOrFail($validated['sale_id']);

        // Pastikan sale milik toko ini
        abort_if($sale->store_id !== $storeId, 403);

        try {
            $gateway = PaymentGatewayFactory::make($validated['provider'], $storeId);

            $orderId = 'SL-' . $sale->id . '-' . time();

            $result = $gateway->createTransaction([
                'order_id'     => $orderId,
                'amount'       => $sale->grand_total,
                'payment_type' => $validated['payment_type'],
                'customer'     => [
                    'name'  => $sale->customer?->name  ?? $user->name,
                    'email' => $sale->customer?->email ?? $user->email,
                    'phone' => $sale->customer?->phone ?? null,
                ],
                'items' => $sale->items()->get()->map(fn($i) => [
                    'id' => (string) $i->product_id,
                    'price' => (int) round($i->price),
                    'quantity' => $i->quantity,
                    'name' => substr($i->product?->name ?? 'Item', 0, 50),
                ])->toArray(),
            ]);

            // Simpan record transaksi PG
            $pgTrx = PaymentGatewayTransaction::create([
                'sale_id'      => $sale->id,
                'provider'     => $validated['provider'],
                'external_id'  => $orderId,
                'payment_type' => $validated['payment_type'],
                'status'       => 'pending',
                'amount'       => $sale->grand_total,
                'raw_response' => $result['raw'] ?? [],
            ]);

            return response()->json([
                'success'        => true,
                'pg_trx_id'      => $pgTrx->id,
                'external_id'    => $orderId,
                'payment_url'    => $result['payment_url']   ?? null,
                'qr_code'        => $result['qr_code']       ?? null,
                'qr_image_url'   => $result['qr_image_url']  ?? null,
                'va_number'      => $result['va_number']     ?? null,
                'va_bank'        => $result['va_bank']       ?? null,
                'payment_type'   => $validated['payment_type'],
                'amount'         => $sale->grand_total,
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
                'status'    => $pgTrx->status,
                'sale_id'   => $pgTrx->sale_id,
                'sale_no'   => $pgTrx->sale?->sale_no,
            ]);
        }

        try {
            $storeId = $this->getStoreId();
            $gateway = PaymentGatewayFactory::make($pgTrx->provider, $storeId);
            $result  = $gateway->getStatus($pgTrx->external_id);

            $pgTrx->update([
                'status'       => $result['status'],
                'raw_response' => $result['raw'],
            ]);

            if ($result['status'] === 'paid') {
                $this->finalizeSale($pgTrx->sale, $pgTrx);
            }

            return response()->json([
                'status'  => $result['status'],
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
            ->whereHas('sale', fn($q) => $q->where('store_id', $storeId))
            ->where('status', 'pending')
            ->where('created_at', '>=', now()->subHours(2))
            ->orderByDesc('created_at')
            ->get()
            ->map(fn($trx) => [
                'pg_trx_id'    => $trx->id,
                'external_id'  => $trx->external_id,
                'sale_id'      => $trx->sale_id,
                'sale_no'      => $trx->sale?->sale_no,
                'provider'     => $trx->provider,
                'payment_type' => $trx->payment_type,
                'amount'       => $trx->amount,
                'created_at'   => $trx->created_at->toISOString(),
            ]);

        return response()->json(['transactions' => $pending]);
    }

    // ── Finalize sale setelah pembayaran sukses ────

    public function finalizeSale(Sale $sale, PaymentGatewayTransaction $pgTrx): void
    {
        if ($sale->status === 'completed') return;

        DB::transaction(function () use ($sale, $pgTrx) {
            // Buat SalePayment
            SalePayment::firstOrCreate(
                ['sale_id' => $sale->id, 'payment_method_id' => null],
                [
                    'paid_at'      => now(),
                    'amount'       => $pgTrx->amount,
                    'reference_no' => $pgTrx->external_id,
                    'note'         => "PG: {$pgTrx->provider} / {$pgTrx->payment_type}",
                ]
            );

            // Potong stok
            $sale->load('items.product');
            foreach ($sale->items as $item) {
                $product = $item->product;
                if (!$product) continue;

                // Cek resep
                $product->load('recipes.rawMaterial.stocks');
                if ($product->recipes->isNotEmpty()) {
                    foreach ($product->recipes as $recipe) {
                        $needed = $recipe->quantity * $item->quantity;
                        if ($recipe->is_nullable) {
                            $avail = $recipe->rawMaterial->stocks->where('store_id', $sale->store_id)->sum('quantity');
                            if ($avail <= 0) continue;
                        }
                        $stock = \App\Models\ProductStock::firstOrCreate(
                            ['product_id' => $recipe->raw_material_id, 'store_id' => $sale->store_id],
                            ['quantity' => 0, 'reserved_quantity' => 0]
                        );
                        $stock->decrement('quantity', $needed);
                    }
                } elseif ($product->track_stock) {
                    $stock = \App\Models\ProductStock::firstOrCreate(
                        ['product_id' => $item->product_id, 'store_id' => $sale->store_id],
                        ['quantity' => 0, 'reserved_quantity' => 0]
                    );
                    $stock->decrement('quantity', $item->quantity);
                }
            }

            $sale->update([
                'status'         => 'completed',
                'payment_status' => 'paid',
                'paid_amount'    => $pgTrx->amount,
                'change_amount'  => 0,
            ]);
        });
    }
}
