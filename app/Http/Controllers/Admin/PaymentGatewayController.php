<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Concerns\FinalizesSaleStock;
use App\Http\Controllers\Controller;
use App\Models\PaymentAttempt;
use App\Models\PaymentGatewayTransaction;
use App\Models\PlatformPaymentGateway;
use App\Models\ProductStock;
use App\Models\Sale;
use App\Models\SalePayment;
use App\Models\StockMovement;
use App\Models\Store;
use App\Models\StoreWallet;
use App\Services\PaymentGateway\Exceptions\PaymentClientException;
use App\Services\PaymentGateway\Exceptions\PaymentServerException;
use App\Services\PaymentGateway\Exceptions\PaymentTimeoutException;
use App\Services\PaymentGateway\PaymentGatewayFactory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;

class PaymentGatewayController extends Controller
{
    use FinalizesSaleStock;

    /** Ambil store_id dari session. */
    private function getStoreId(): int
    {
        return session('current_store_id') ?? Store::first()->id;
    }

    // ── Info page ──────────────────────────────────
    // Payment gateway kini dikelola secara platform-level oleh developer.
    // Store tidak lagi setup credentials sendiri — halaman ini hanya
    // menampilkan info & mengarahkan ke halaman Wallet.

    public function index()
    {
        $providers = collect(PlatformPaymentGateway::availableProviders())
            ->map(fn ($meta, $key) => [
                'provider' => $key,
                'label' => $meta['label'],
                'is_active' => PlatformPaymentGateway::where('provider', $key)
                    ->where('is_active', true)
                    ->exists(),
            ])
            ->values();

        return Inertia::render('Admin/PaymentGateway/Index', [
            'providers' => $providers,
        ]);
    }

    // ── Create PG transaction (from Kasir) ──────────

    /**
     * Entry point called by the POS when the cashier selects a PG method.
     * Guards against double-charging: if there's already an active or
     * retryable PG transaction for this sale, reuse/continue it instead of
     * blindly creating a brand new charge.
     */
    public function createTransaction(Request $request)
    {
        $storeId = session('current_store_id');

        $validated = $request->validate([
            'sale_id' => 'required|exists:sales,id',
            'provider' => 'required|string',
            'payment_type' => 'required|string',
            'amount' => 'nullable|numeric|min:1',
        ]);

        $sale = Sale::with('items.product', 'customer')->findOrFail($validated['sale_id']);

        // Pastikan sale milik toko ini
        abort_if($sale->store_id !== $storeId, 403);

        // Sudah ada transaksi PG yang masih aktif/ambigu untuk sale ini?
        // Jangan buat charge baru — reconcile/lanjutkan yang sudah ada agar
        // tidak double charge.
        $existingTrx = PaymentGatewayTransaction::where('sale_id', $sale->id)
            ->whereNull('sale_split_payer_id')
            ->whereIn('status', ['initiating', 'pending', 'unknown', 'checking'])
            ->latest('id')
            ->first();

        if ($existingTrx) {
            return $this->reconcileOrReturn($existingTrx);
        }

        // Ada transaksi yang failed tapi masih boleh di-retry? Lanjutkan
        // attempt yang sama alih-alih membuat external_id baru.
        $failedTrx = PaymentGatewayTransaction::where('sale_id', $sale->id)
            ->whereNull('sale_split_payer_id')
            ->where('status', 'failed')
            ->latest('id')
            ->first();

        if ($failedTrx && $failedTrx->isRetryable()) {
            $failedTrx->update([
                'status' => 'initiating',
                'attempt_no' => $failedTrx->attempt_no + 1,
                'idempotency_key' => Str::uuid()->toString(),
                'error_message' => null,
                'gateway_error_code' => null,
                'gateway_http_status' => null,
            ]);

            return $this->attemptCharge($failedTrx, $sale);
        }

        $chargeAmount = ! empty($validated['amount']) ? (float) $validated['amount'] : (float) $sale->grand_total;

        $pgTrx = PaymentGatewayTransaction::create([
            'sale_id' => $sale->id,
            'provider' => $validated['provider'],
            'external_id' => 'SL-'.$sale->id.'-'.time(),
            'idempotency_key' => Str::uuid()->toString(),
            'attempt_no' => 1,
            'payment_type' => $validated['payment_type'],
            'status' => 'initiating',
            'amount' => $chargeAmount,
        ]);

        return $this->attemptCharge($pgTrx, $sale);
    }

    /**
     * Perform (or re-perform) the actual charge call to the gateway and
     * categorize the result: success, definitive client error, or
     * ambiguous server error/timeout that needs reconciliation.
     */
    private function attemptCharge(PaymentGatewayTransaction $pgTrx, Sale $sale): JsonResponse
    {
        $requestSnapshot = [
            'order_id' => $pgTrx->external_id,
            'amount' => (float) $pgTrx->amount,
            'payment_type' => $pgTrx->payment_type,
        ];

        try {
            $gateway = PaymentGatewayFactory::make($pgTrx->provider);

            $result = $gateway->createTransaction([
                'order_id' => $pgTrx->external_id,
                'amount' => $pgTrx->amount,
                'payment_type' => $pgTrx->payment_type,
                'idempotency_key' => $pgTrx->idempotency_key,
                'customer' => [
                    'name' => $sale->customer?->name ?? Auth::user()?->name,
                    'email' => $sale->customer?->email ?? Auth::user()?->email,
                    'phone' => $sale->customer?->phone ?? null,
                ],
                'items' => $sale->items()->get()->map(fn ($i) => [
                    'id' => (string) $i->product_id,
                    'price' => (int) round($i->price),
                    'quantity' => $i->quantity,
                    'name' => substr($i->product?->name ?? 'Item', 0, 50),
                ])->toArray(),
            ]);

            $pgTrx->update([
                'status' => 'pending',
                'gateway_http_status' => $result['http_status'] ?? null,
                'raw_response' => $result['raw'] ?? [],
                'error_message' => null,
                'gateway_error_code' => null,
            ]);

            $this->recordAttempt($pgTrx, 'success', $result['http_status'] ?? null, $requestSnapshot, $result['raw'] ?? null);

            return response()->json([
                'success' => true,
                'status' => 'pending',
                'pg_trx_id' => $pgTrx->id,
                'external_id' => $pgTrx->external_id,
                'payment_url' => $result['payment_url'] ?? null,
                'qr_code' => $result['qr_code'] ?? null,
                'qr_image_url' => $result['qr_image_url'] ?? null,
                'va_number' => $result['va_number'] ?? null,
                'va_bank' => $result['va_bank'] ?? null,
                'payment_type' => $pgTrx->payment_type,
                'amount' => (float) $pgTrx->amount,
            ]);
        } catch (PaymentClientException $e) {
            // 4xx — definitive failure. Retrying the same payload won't help.
            $pgTrx->update([
                'status' => 'failed',
                'gateway_http_status' => $e->httpStatus,
                'error_message' => $e->getMessage(),
            ]);

            $this->recordAttempt($pgTrx, 'client_error', $e->httpStatus, $requestSnapshot, $e->responseBody, $e->getMessage());

            return response()->json([
                'success' => false,
                'status' => 'failed',
                'message' => 'Pembayaran gagal karena kesalahan konfigurasi. Hubungi admin toko.',
                'can_retry' => false,
                'pg_trx_id' => $pgTrx->id,
            ], 422);
        } catch (PaymentServerException $e) {
            // 5xx — ambiguous. Reconcile before deciding retry vs paid.
            $pgTrx->markUnknown($e->httpStatus, $e->getMessage());
            $this->recordAttempt($pgTrx, 'server_error', $e->httpStatus, $requestSnapshot, $e->responseBody, $e->getMessage());

            return $this->reconcileAfterError($pgTrx);
        } catch (PaymentTimeoutException $e) {
            // Timeout — same ambiguity as 5xx.
            $pgTrx->markUnknown(null, $e->getMessage());
            $this->recordAttempt($pgTrx, 'timeout', null, $requestSnapshot, null, $e->getMessage());

            return $this->reconcileAfterError($pgTrx);
        } catch (\Throwable $e) {
            // Unexpected — treat conservatively as ambiguous rather than failed
            // outright, since we don't know if the gateway received the charge.
            $pgTrx->markUnknown(null, $e->getMessage());
            $this->recordAttempt($pgTrx, 'timeout', null, $requestSnapshot, null, $e->getMessage());

            return $this->reconcileAfterError($pgTrx);
        }
    }

    /**
     * After a 5xx/timeout, ask the provider directly whether the charge
     * actually went through before telling the cashier anything is wrong.
     */
    private function reconcileAfterError(PaymentGatewayTransaction $pgTrx): JsonResponse
    {
        $pgTrx->markChecking();

        try {
            $gateway = PaymentGatewayFactory::make($pgTrx->provider);
            $result = $gateway->reconcile($pgTrx->external_id);
        } catch (\Throwable $e) {
            // Reconciliation itself failed — stay unknown, let cron/polling retry later.
            $pgTrx->update(['status' => 'unknown']);

            return response()->json([
                'success' => true,
                'status' => 'unknown',
                'pg_trx_id' => $pgTrx->id,
                'message' => 'Status pembayaran belum dapat dipastikan. Sedang memeriksa ke penyedia pembayaran...',
            ]);
        }

        if ($result['found']) {
            // Simpan raw_response dari Status API supaya data QR/VA tersimpan
            // untuk digunakan nanti (misalnya saat retry atau polling).
            if (! empty($result['raw'])) {
                $pgTrx->update([
                    'raw_response' => $result['raw'],
                    'status_checked_at' => now(),
                ]);
            }

            $pgTrx->markReconciled($result['status']);

            if ($result['status'] === 'paid') {
                $this->finalizeSale($pgTrx->sale, $pgTrx);

                return response()->json([
                    'success' => true,
                    'status' => 'paid',
                    'pg_trx_id' => $pgTrx->id,
                    'message' => 'Pembayaran berhasil dikonfirmasi.',
                ]);
            }

            // Kembalikan QR/VA data. Status API tidak menyertakan qr_string,
            // jadi ensurePaymentData() akan safe-recharge untuk mengambilnya.
            $raw = $result['raw'] ?? [];
            $paymentData = $this->ensurePaymentData($pgTrx, $raw);

            return response()->json(array_merge([
                'success' => true,
                'status' => $result['status'],
                'pg_trx_id' => $pgTrx->id,
                'message' => 'Transaksi ditemukan, menunggu konfirmasi pembayaran.',
            ], $paymentData));
        }

        // Not found at the provider — genuinely failed, safe to retry.
        $pgTrx->update(['status' => 'failed']);

        return response()->json([
            'success' => false,
            'status' => 'failed',
            'message' => 'Pembayaran belum berhasil. Silakan coba lagi.',
            'can_retry' => $pgTrx->isRetryable(),
            'pg_trx_id' => $pgTrx->id,
        ], 422);
    }

    /**
     * Called when the POS asks to create a PG transaction for a sale that
     * already has one in-flight/ambiguous. Re-checks the provider instead
     * of creating a duplicate charge.
     */
    private function reconcileOrReturn(PaymentGatewayTransaction $pgTrx): JsonResponse
    {
        if ($pgTrx->status === 'pending') {
            $raw = $pgTrx->raw_response ?? [];

            // Kalau raw_response tidak punya data pembayaran (misalnya hasil
            // dari reconcile setelah 5xx), ambil data segar dari Status API.
            if (empty($raw['qr_code']) && empty($raw['qr_string'])
                && empty($raw['va_numbers']) && empty($raw['permata_va_number'])
                && empty($raw['redirect_url'])) {
                try {
                    $gateway = PaymentGatewayFactory::make($pgTrx->provider);
                    $fresh = $gateway->reconcile($pgTrx->external_id);
                    if ($fresh['found'] && ! empty($fresh['raw'])) {
                        $raw = $fresh['raw'];
                        $pgTrx->update([
                            'raw_response' => $raw,
                            'status_checked_at' => now(),
                        ]);
                        // Kalau status berubah (misalnya paid), update juga
                        if ($fresh['status'] !== 'pending') {
                            $pgTrx->markReconciled($fresh['status']);
                            if ($fresh['status'] === 'paid') {
                                $this->finalizeSale($pgTrx->sale, $pgTrx);

                                return response()->json([
                                    'success' => true,
                                    'status' => 'paid',
                                    'pg_trx_id' => $pgTrx->id,
                                    'message' => 'Pembayaran berhasil dikonfirmasi.',
                                ]);
                            }
                        }
                    }
                } catch (\Throwable) {
                    // Status API gagal — tetap kembalikan apa yang ada
                }
            }

            $paymentData = $this->ensurePaymentData($pgTrx, $raw);

            return response()->json(array_merge([
                'success' => true,
                'status' => $pgTrx->status,
                'pg_trx_id' => $pgTrx->id,
                'external_id' => $pgTrx->external_id,
                'payment_type' => $pgTrx->payment_type,
                'amount' => (float) $pgTrx->amount,
            ], $paymentData));
        }

        // initiating/unknown/checking → actively reconcile now.
        return $this->reconcileAfterError($pgTrx);
    }

    /**
     * Retry a failed PG transaction — reuses the same PaymentGatewayTransaction
     * row but bumps attempt_no and issues a fresh idempotency key.
     */
    public function retryTransaction(Request $request)
    {
        $validated = $request->validate([
            'pg_trx_id' => 'required|exists:payment_gateway_transactions,id',
        ]);

        $storeId = session('current_store_id');
        $pgTrx = PaymentGatewayTransaction::with('sale')->findOrFail($validated['pg_trx_id']);

        abort_if($pgTrx->sale?->store_id !== $storeId, 403);
        abort_if($pgTrx->status !== 'failed', 422, 'Transaksi ini tidak dalam status yang bisa di-retry.');
        abort_unless($pgTrx->isRetryable(), 422, 'Batas maksimum percobaan pembayaran tercapai. Gunakan metode pembayaran lain.');

        $pgTrx->update([
            'status' => 'initiating',
            'attempt_no' => $pgTrx->attempt_no + 1,
            'idempotency_key' => Str::uuid()->toString(),
            'error_message' => null,
            'gateway_error_code' => null,
            'gateway_http_status' => null,
        ]);

        return $this->attemptCharge($pgTrx, $pgTrx->sale);
    }

    /**
     * Persist a PaymentAttempt row for observability/debugging. Never
     * store credentials — only order/transaction identifiers, HTTP
     * status, and sanitized request/response snapshots.
     */
    private function recordAttempt(
        PaymentGatewayTransaction $pgTrx,
        string $result,
        ?int $httpStatus,
        array $requestSnapshot,
        ?array $responseSnapshot,
        ?string $errorMessage = null,
    ): void {
        PaymentAttempt::create([
            'pg_transaction_id' => $pgTrx->id,
            'attempt_no' => $pgTrx->attempt_no,
            'idempotency_key' => $pgTrx->idempotency_key,
            'http_status' => $httpStatus,
            'result' => $result,
            'error_message' => $errorMessage,
            'request_snapshot' => $requestSnapshot,
            'response_snapshot' => $responseSnapshot,
        ]);
    }

    /**
     * Extract payment data from a raw response; if it lacks QR/VA/URL data
     * (as happens when the raw came from the Status API after a 5xx), replay
     * the charge with the SAME idempotency key to fetch the original charge
     * response — which is the only place the qr_string lives. Midtrans won't
     * create a duplicate for a matching idempotency key, so this is safe.
     *
     * Guarded: only replays when an idempotency key exists (older rows may
     * not have one) and the gateway actually supports safeRecharge().
     */
    private function ensurePaymentData(PaymentGatewayTransaction $pgTrx, array $raw): array
    {
        $paymentData = $this->extractPaymentData($raw, $pgTrx->payment_type);

        $hasData = ! empty($paymentData['qr_code'])
            || ! empty($paymentData['va_number'])
            || ! empty($paymentData['payment_url']);

        if ($hasData || empty($pgTrx->idempotency_key)) {
            return $paymentData;
        }

        try {
            $gateway = PaymentGatewayFactory::make($pgTrx->provider);

            if (! method_exists($gateway, 'safeRecharge')) {
                return $paymentData;
            }

            $fresh = $gateway->safeRecharge(
                $pgTrx->external_id,
                $pgTrx->idempotency_key,
                (int) $pgTrx->amount,
                $pgTrx->payment_type,
            );

            $paymentData = $this->extractPaymentData($fresh, $pgTrx->payment_type);
            $pgTrx->update(['raw_response' => $fresh]);
        } catch (\Throwable) {
            // Gateway still down — return without QR; polling/cron retries later.
        }

        return $paymentData;
    }

    /**
     * Extract payment data (QR/VA/payment URL) from a Midtrans raw response.
     * Used when returning payment data from reconcile/retry flows.
     */
    private function extractPaymentData(array $raw, string $paymentType): array
    {
        // QR image URL from Midtrans actions
        $qrImageUrl = null;
        if (! empty($raw['actions'])) {
            $genQr = collect($raw['actions'])->firstWhere('name', 'generate-qr-code');
            $qrImageUrl = $genQr['url'] ?? $raw['actions'][0]['url'] ?? null;
        }

        // VA number
        $vaNumber = $raw['va_numbers'][0]['va_number'] ?? $raw['permata_va_number'] ?? null;
        $vaBank = null;
        if ($vaNumber) {
            $vaBank = $raw['va_numbers'][0]['bank'] ?? str_replace('_va', '', $paymentType);
        }

        return [
            'qr_code' => $raw['qr_code'] ?? $raw['qr_string'] ?? null,
            'qr_image_url' => $qrImageUrl,
            'va_number' => $vaNumber,
            'va_bank' => $vaBank,
            'payment_url' => $raw['redirect_url'] ?? null,
        ];
    }

    // ── Check status (polling) ─────────────────────

    public function checkStatus(Request $request, int $pgTrxId)
    {
        $pgTrx = PaymentGatewayTransaction::with('sale', 'splitPayer')->findOrFail($pgTrxId);

        // Sudah terminal → return cached status, jangan hit provider lagi.
        if ($pgTrx->isTerminal()) {
            return response()->json([
                'status' => $pgTrx->status,
                'sale_id' => $pgTrx->sale_id,
                'sale_no' => $pgTrx->sale?->sale_no,
                'can_retry' => $pgTrx->status === 'failed' && $pgTrx->isRetryable(),
            ]);
        }

        // unknown/checking → langsung reconcile alih-alih polling getStatus biasa,
        // supaya konsisten dengan flow attemptCharge.
        if ($pgTrx->isAmbiguous()) {
            $gateway = PaymentGatewayFactory::make($pgTrx->provider);
            $result = $gateway->reconcile($pgTrx->external_id);

            if ($result['found']) {
                $pgTrx->markReconciled($result['status']);

                if ($result['status'] === 'paid') {
                    if ($pgTrx->sale_split_payer_id) {
                        $this->finalizeSplitPayerPayment($pgTrx);
                    } else {
                        $this->finalizeSale($pgTrx->sale, $pgTrx);
                    }
                }

                return response()->json([
                    'status' => $result['status'],
                    'sale_id' => $pgTrx->sale_id,
                    'sale_no' => $pgTrx->sale?->sale_no,
                ]);
            }

            return response()->json([
                'status' => 'unknown',
                'sale_id' => $pgTrx->sale_id,
                'message' => 'Status pembayaran belum dapat dipastikan. Sedang memeriksa...',
            ]);
        }

        try {
            $gateway = PaymentGatewayFactory::make($pgTrx->provider);
            $result = $gateway->getStatus($pgTrx->external_id);

            $pgTrx->update([
                'status' => $result['status'],
                'status_checked_at' => now(),
                'raw_response' => $result['raw'],
            ]);

            if ($result['status'] === 'paid') {
                if ($pgTrx->sale_split_payer_id) {
                    $this->finalizeSplitPayerPayment($pgTrx);
                } else {
                    $this->finalizeSale($pgTrx->sale, $pgTrx);
                }
            }

            return response()->json([
                'status' => $result['status'],
                'sale_id' => $pgTrx->sale_id,
                'sale_no' => $pgTrx->sale?->sale_no,
            ]);
        } catch (\Throwable $e) {
            // Gagal cek status — jangan ubah apa-apa, biarkan polling/cron coba lagi.
            return response()->json([
                'status' => $pgTrx->status,
                'sale_id' => $pgTrx->sale_id,
                'message' => 'Gagal memeriksa status pembayaran. Mencoba lagi...',
            ]);
        }
    }

    // ── List pending PG transactions for current store ──

    public function pendingTransactions()
    {
        $storeId = $this->getStoreId();

        $pending = PaymentGatewayTransaction::with('sale')
            ->whereHas('sale', fn ($q) => $q->where('store_id', $storeId))
            ->whereIn('status', ['pending', 'unknown', 'checking'])
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
                'status' => $trx->status,
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

            $this->creditStoreWallet($sale, $pgTrx, (float) $pgTrx->amount);
        });
    }

    /**
     * Finalize one split payer's PG payment.
     * Does NOT finalize the entire sale — only marks the payer as paid.
     * If all payers are now paid, then finalize the full sale.
     */
    public function finalizeSplitPayerPayment(PaymentGatewayTransaction $pgTrx): void
    {
        $sale = $pgTrx->sale;
        $payer = $pgTrx->splitPayer;

        if (! $sale || ! $payer) {
            return;
        }

        if ($payer->status === 'paid') {
            return; // already processed
        }

        DB::transaction(function () use ($sale, $payer, $pgTrx) {
            // Create SalePayment for this payer
            $salePayment = SalePayment::create([
                'sale_id' => $sale->id,
                'payment_method_id' => null, // PG doesn't map to a local method
                'paid_at' => now(),
                'amount' => (float) $payer->total,
                'reference_no' => $pgTrx->external_id,
                'note' => "PG: {$pgTrx->provider} / {$pgTrx->payment_type}",
                'payer_name' => $payer->name,
                'payer_customer_id' => $payer->customer_id,
                'paid_amount' => (float) $payer->total,
                'change_amount' => 0,
                'is_split' => true,
            ]);

            // Update split payer
            $payer->update([
                'status' => 'paid',
                'paid_amount' => (float) $payer->total,
                'change_amount' => 0,
                'sale_payment_id' => $salePayment->id,
            ]);

            $this->creditStoreWallet($sale, $pgTrx, (float) $payer->total);

            // Check if all payers are paid
            $allPaid = $sale->splitPayers()->where('status', 'pending')->count() === 0;

            if ($allPaid) {
                // Finalize the full sale: deduct stock, update status
                $items = $sale->items()->with('product')->get()->toArray();
                $this->deductStockForSale(
                    $sale,
                    $items,
                    $sale->store_id,
                    $sale->branch_id,
                    $sale->sale_no,
                );

                $paidTotal = $sale->splitPayers()->where('status', 'paid')->sum('paid_amount');
                $changeTotal = $sale->splitPayers()->where('status', 'paid')->sum('change_amount');

                $sale->update([
                    'status' => 'completed',
                    'payment_status' => 'paid',
                    'split_status' => 'completed',
                    'paid_amount' => $paidTotal,
                    'change_amount' => $changeTotal,
                ]);
            }
        });
    }

    /**
     * Credit the store wallet with the PG payment amount. All PG
     * transactions settle into the developer's platform PG account, so
     * each successful payment is credited to the owning store's wallet
     * for later withdrawal.
     */
    private function creditStoreWallet(Sale $sale, PaymentGatewayTransaction $pgTrx, float $amount): void
    {
        $wallet = StoreWallet::firstOrCreate(
            ['store_id' => $sale->store_id],
            ['balance' => 0, 'pending_balance' => 0, 'withdrawn' => 0],
        );

        $wallet->credit(
            $amount,
            'sale_credit',
            $sale,
            "Pembayaran PG #{$sale->sale_no} ({$pgTrx->provider}/{$pgTrx->payment_type})",
        );
    }
}
