<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PaymentGatewayTransaction;
use App\Models\Plan;
use App\Models\PlanOrder;
use App\Models\PlatformPaymentGateway;
use App\Models\User;
use App\Notifications\NewPlanOrder;
use App\Services\PaymentGateway\Exceptions\PaymentClientException;
use App\Services\PaymentGateway\Exceptions\PaymentServerException;
use App\Services\PaymentGateway\Exceptions\PaymentTimeoutException;
use App\Services\PaymentGateway\PaymentGatewayFactory;
use App\Services\PlanOrderService;
use App\Services\ProrationService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PlanController extends Controller
{
    /**
     * Halaman pilih/upgrade plan — plan akun saat ini vs plan lain.
     * Plan sekarang menempel ke USER, berlaku untuk semua toko miliknya.
     */
    public function index(): Response
    {
        /** @var User $user */
        $user = Auth::user();
        $user->load('planModel');

        $plans = Plan::where('is_active', true)
            ->orderBy('sort_order')
            ->get()
            ->map(fn (Plan $p) => [
                'id' => $p->id,
                'code' => $p->code,
                'label' => $p->label,
                'description' => $p->description,
                'price_monthly' => (float) $p->price,
                'price_yearly' => (float) $p->price_yearly,
                'trial_days' => $p->trial_days,
                'max_users' => $p->max_users,
                'max_branches' => $p->max_branches,
                'max_products' => $p->max_products,
                'max_transactions_per_month' => $p->max_transactions_per_month,
                'max_stores' => $p->max_stores,
                'is_popular' => $p->is_popular,
                'is_active_plan' => $user->planModel?->id === $p->id,
            ]);

        // Order pending milik user ini
        $pendingOrder = PlanOrder::where('user_id', $user->id)
            ->where('status', PlanOrder::STATUS_PENDING)
            ->with('plan')
            ->latest()
            ->first();

        $storeCount = $user->stores()->count();

        return Inertia::render('Admin/Plan/Index', [
            'plans' => $plans,
            'currentPlan' => [
                'id' => $user->planModel?->id,
                'code' => $user->effectivePlanCode(),
                'label' => $user->planModel?->label ?? 'Free',
                'price_monthly' => (float) ($user->planModel?->price ?? 0),
                'price_yearly' => (float) ($user->planModel?->price_yearly ?? 0),
                'billing_period' => $user->currentBillingPeriod(),
                'expires_at' => $user->plan_expires_at,
                'is_expired' => $user->isPlanExpired(),
            ],
            'storeCount' => $storeCount,
            'isAutoMode' => ! PlatformPaymentGateway::isPlanOrderManual(),
            'hasPendingOrder' => $pendingOrder !== null,
            'billingConfig' => [
                'whatsapp' => config('billing.whatsapp'),
                'email' => config('billing.email'),
            ],
            'pendingOrder' => $pendingOrder ? [
                'id' => $pendingOrder->id,
                'idempotency_key' => $pendingOrder->idempotency_key,
                'plan_label' => $pendingOrder->plan?->label,
                'amount' => (float) $pendingOrder->amount,
                'period_label' => $pendingOrder->periodLabel(),
                'created_at' => $pendingOrder->created_at,
            ] : null,
        ]);
    }

    /**
     * Buat order upgrade plan untuk AKUN (user), bukan toko.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'plan_id' => ['required', 'integer', Rule::exists('plans', 'id')->where('is_active', true)],
            'billing_period' => ['required', Rule::in([PlanOrder::PERIOD_MONTHLY, PlanOrder::PERIOD_YEARLY])],
        ]);

        /** @var User $user */
        $user = Auth::user();
        $user->load('planModel');
        $plan = Plan::findOrFail($validated['plan_id']);

        // Tolak downgrade
        if ($user->planModel && $plan->sort_order < $user->planModel->sort_order) {
            return back()->with('error', 'Downgrade paket belum tersedia. Hubungi admin untuk bantuan.');
        }

        // Hitung harga dengan prorasi
        $proration = app(ProrationService::class)->calculateUpgradePrice(
            $user,
            $plan,
            $validated['billing_period'],
        );

        if ($proration['is_blocked']) {
            return back()->with('error', $proration['block_reason']);
        }

        if ($proration['amount'] <= 0) {
            return back()->with('error', 'Paket ini tidak memerlukan pembayaran.');
        }

        // Block jika masih ada order pending
        $hasPending = PlanOrder::where('user_id', $user->id)
            ->where('status', PlanOrder::STATUS_PENDING)
            ->exists();

        if ($hasPending) {
            return back()->with('error', 'Masih ada order yang belum diselesaikan. Selesaikan atau batalkan order terlebih dahulu.');
        }

        $order = PlanOrder::create([
            'user_id' => $user->id,
            'plan_id' => $plan->id,
            'billing_period' => $validated['billing_period'],
            'amount' => $proration['amount'],
            'original_amount' => $proration['original_amount'],
            'proration_type' => $proration['proration_type'],
            'status' => PlanOrder::STATUS_PENDING,
            'plan_active_until' => $this->calculateActiveUntil($user, $validated['billing_period']),
            'payment_gateway' => PlatformPaymentGateway::isPlanOrderManual() ? null : $this->activeGateway(),
            'idempotency_key' => PlanOrder::generateIdempotencyKey(),
            'created_by' => $user->id,
        ]);

        $this->notifyAdmin($order, $user);

        if ($order->isManual()) {
            return redirect()->route('admin.plan.confirm', $order->idempotency_key)
                ->with('success', 'Order berhasil dibuat. Lakukan pembayaran sesuai instruksi di bawah.');
        }

        return redirect()->route('admin.plan.confirm', $order->idempotency_key)
            ->with('success', 'Order dibuat. Lanjutkan ke pembayaran.');
    }

    /**
     * Daftar semua order upgrade plan milik user yang sedang login.
     */
    public function orders(): Response
    {
        /** @var User $user */
        $user = Auth::user();

        $orders = PlanOrder::where('user_id', $user->id)
            ->with('plan')
            ->latest()
            ->paginate(15);

        // Cari ID order terbaru yang belum dibatalkan/di-expire
        $latestNonPaidId = PlanOrder::where('user_id', $user->id)
            ->whereNotIn('status', [PlanOrder::STATUS_PAID])
            ->latest()
            ->value('id');

        return Inertia::render('Admin/Plan/Orders', [
            'orders' => $orders->through(fn (PlanOrder $o) => [
                'id' => $o->id,
                'idempotency_key' => $o->idempotency_key,
                'plan_label' => $o->plan?->label,
                'billing_period' => $o->billing_period,
                'period_label' => $o->periodLabel(),
                'amount' => (float) $o->amount,
                'original_amount' => $o->original_amount ? (float) $o->original_amount : null,
                'proration_type' => $o->proration_type,
                'is_prorated' => $o->isProrated(),
                'status' => $o->status,
                'status_label' => $o->statusLabel(),
                'is_manual' => $o->isManual(),
                'paid_at' => $o->paid_at,
                'plan_active_until' => $o->plan_active_until,
                'notes' => $o->notes,
                'cancel_count' => $o->cancel_count,
                'resume_count' => $o->resume_count,
                'created_at' => $o->created_at,
                'is_latest_non_paid' => $o->id === $latestNonPaidId,
            ]),
        ]);
    }

    /**
     * Batalkan order pending.
     */
    public function cancel(Request $request, int $orderId): RedirectResponse
    {
        /** @var User $user */
        $user = Auth::user();

        $order = PlanOrder::where('id', $orderId)
            ->where('user_id', $user->id)
            ->where('status', PlanOrder::STATUS_PENDING)
            ->firstOrFail();

        $order->update([
            'status' => PlanOrder::STATUS_CANCELLED,
            'cancel_count' => $order->cancel_count + 1,
        ]);

        return redirect()->route('admin.plan.orders')
            ->with('success', 'Order berhasil dibatalkan.');
    }

    /**
     * Lanjutkan order yang sudah dibatalkan/gagal/kadaluarsa.
     * Membuat order baru dengan plan + period yang sama.
     */
    public function resume(Request $request, int $orderId): RedirectResponse
    {
        /** @var User $user */
        $user = Auth::user();

        $order = PlanOrder::where('id', $orderId)
            ->where('user_id', $user->id)
            ->whereIn('status', [PlanOrder::STATUS_CANCELLED, PlanOrder::STATUS_FAILED, PlanOrder::STATUS_EXPIRED])
            ->firstOrFail();

        // Validasi max resume sekali
        if ($order->resume_count >= 1) {
            return back()->with('error', 'Order ini sudah pernah dilanjutkan. Buat order baru jika ingin upgrade.');
        }

        // Cek apakah ada pending order lain
        $hasPending = PlanOrder::where('user_id', $user->id)
            ->where('status', PlanOrder::STATUS_PENDING)
            ->exists();

        if ($hasPending) {
            return back()->with('error', 'Masih ada order yang belum diselesaikan.');
        }

        // Buat order baru (recalculate proration)
        $targetPlan = Plan::find($order->plan_id);
        $proration = app(ProrationService::class)->calculateUpgradePrice(
            $user,
            $targetPlan,
            $order->billing_period,
        );

        $newOrder = PlanOrder::create([
            'user_id' => $user->id,
            'plan_id' => $order->plan_id,
            'billing_period' => $order->billing_period,
            'amount' => $proration['amount'],
            'original_amount' => $proration['original_amount'],
            'proration_type' => $proration['proration_type'],
            'status' => PlanOrder::STATUS_PENDING,
            'plan_active_until' => $this->calculateActiveUntil($user, $order->billing_period),
            'payment_gateway' => PlatformPaymentGateway::isPlanOrderManual() ? null : $this->activeGateway(),
            'idempotency_key' => PlanOrder::generateIdempotencyKey(),
            'created_by' => $user->id,
            'resume_count' => $order->resume_count + 1,
        ]);

        // Update order lama: tandai sudah di-resume
        $order->update(['resume_count' => $order->resume_count + 1]);

        $this->notifyAdmin($newOrder, $user);

        return redirect()->route('admin.plan.confirm', $newOrder->idempotency_key)
            ->with('success', 'Order berhasil dilanjutkan.');
    }

    /**
     * Bayar order via Payment Gateway.
     * Membuat transaksi PG dan mengembalikan data pembayaran (QR/VA/URL).
     */
    public function payWithGateway(Request $request, int $orderId): JsonResponse
    {
        /** @var User $user */
        $user = Auth::user();

        $order = PlanOrder::where('id', $orderId)
            ->where('user_id', $user->id)
            ->where('status', PlanOrder::STATUS_PENDING)
            ->whereNotNull('payment_gateway')
            ->firstOrFail();

        // Ambil metode yang diaktifkan di gateway
        $gatewayConfig = PlatformPaymentGateway::where('provider', $order->payment_gateway)
            ->where('is_active', true)
            ->first();
        $enabledMethods = $gatewayConfig?->enabled_methods ?? [];

        $validated = $request->validate([
            'payment_type' => ['required', 'string', Rule::in($enabledMethods)],
        ]);

        // Cek apakah sudah ada transaksi PG yang aktif
        $existingTrx = PaymentGatewayTransaction::where('plan_order_id', $order->id)
            ->whereIn('status', ['initiating', 'pending', 'unknown', 'checking'])
            ->latest('id')
            ->first();

        if ($existingTrx) {
            $raw = $existingTrx->raw_response ?? [];
            $hasPaymentData = ($raw['_qr_code'] ?? $raw['qr_code'] ?? $raw['_va_number'] ?? $raw['va_number'] ?? $raw['_payment_url'] ?? $raw['payment_url'] ?? null) !== null;

            // Jika transaksi aktif tapi tidak punya QR/VA/URL (data lama sebelum fix),
            // mark sebagai failed supaya transaksi baru bisa dibuat
            if (! $hasPaymentData) {
                $existingTrx->update(['status' => 'failed', 'error_message' => 'No payment data stored, retrying.']);
            } else {
                return response()->json([
                    'success' => true,
                    'status' => 'pending',
                    'pg_trx_id' => $existingTrx->id,
                    'payment_url' => $raw['_payment_url'] ?? $raw['payment_url'] ?? null,
                    'qr_code' => $raw['_qr_code'] ?? $raw['qr_code'] ?? null,
                    'qr_image_url' => $raw['_qr_image_url'] ?? $raw['qr_image_url'] ?? null,
                    'va_number' => $raw['_va_number'] ?? $raw['va_number'] ?? null,
                    'va_bank' => $raw['_va_bank'] ?? $raw['va_bank'] ?? null,
                    'payment_type' => $existingTrx->payment_type,
                    'amount' => (float) $existingTrx->amount,
                ]);
            }
        }

        // Cek transaksi failed yang bisa di-retry
        $failedTrx = PaymentGatewayTransaction::where('plan_order_id', $order->id)
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

            return $this->attemptPlanCharge($failedTrx, $order, $validated['payment_type']);
        }

        // Buat transaksi PG baru
        $provider = $order->payment_gateway;
        $externalId = 'PO-'.$order->id.'-'.time();
        $idempotencyKey = Str::uuid()->toString();

        $pgTrx = PaymentGatewayTransaction::create([
            'sale_id' => null,
            'plan_order_id' => $order->id,
            'provider' => $provider,
            'external_id' => $externalId,
            'idempotency_key' => $idempotencyKey,
            'attempt_no' => 1,
            'payment_type' => $validated['payment_type'],
            'status' => 'initiating',
            'amount' => $order->amount,
        ]);

        return $this->attemptPlanCharge($pgTrx, $order, $validated['payment_type']);
    }

    /**
     * Ganti metode pembayaran untuk order yang sedang pending.
     * Batas: max 1x per order.
     */
    public function changePaymentMethod(Request $request, int $orderId): JsonResponse
    {
        /** @var User $user */
        $user = Auth::user();

        $order = PlanOrder::where('id', $orderId)
            ->where('user_id', $user->id)
            ->where('status', PlanOrder::STATUS_PENDING)
            ->firstOrFail();

        if (! $order->canChangePaymentMethod()) {
            return response()->json([
                'success' => false,
                'message' => 'Batas ganti metode pembayaran sudah tercapai.',
            ], 422);
        }

        // Mark semua transaksi PG aktif sebagai failed
        PaymentGatewayTransaction::where('plan_order_id', $order->id)
            ->whereIn('status', ['initiating', 'pending', 'unknown', 'checking'])
            ->update(['status' => 'failed', 'error_message' => 'Payment method changed by user.']);

        $order->update([
            'payment_method_change_count' => $order->payment_method_change_count + 1,
            'expires_at' => null,
        ]);

        return response()->json(['success' => true]);
    }

    /**
     * Perform charge call ke gateway untuk plan order.
     */
    private function attemptPlanCharge(PaymentGatewayTransaction $pgTrx, PlanOrder $order, string $paymentType): JsonResponse
    {
        try {
            $gateway = PaymentGatewayFactory::make($pgTrx->provider);

            $result = $gateway->createTransaction([
                'order_id' => $pgTrx->external_id,
                'amount' => $pgTrx->amount,
                'payment_type' => $paymentType,
                'idempotency_key' => $pgTrx->idempotency_key,
                'customer' => [
                    'name' => $order->user?->name ?? 'Customer',
                    'email' => $order->user?->email,
                ],
                'items' => [
                    [
                        'id' => (string) $order->plan_id,
                        'price' => (int) round($order->amount),
                        'quantity' => 1,
                        'name' => substr($order->plan?->label ?? 'Plan Upgrade', 0, 50),
                    ],
                ],
            ]);

            $pgTrx->update([
                'status' => 'pending',
                'gateway_http_status' => $result['http_status'] ?? null,
                'raw_response' => array_merge($result['raw'] ?? [], [
                    '_qr_code' => $result['qr_code'] ?? null,
                    '_qr_image_url' => $result['qr_image_url'] ?? null,
                    '_va_number' => $result['va_number'] ?? null,
                    '_va_bank' => $result['va_bank'] ?? null,
                    '_payment_url' => $result['payment_url'] ?? null,
                ]),
                'error_message' => null,
                'gateway_error_code' => null,
            ]);

            // Simpan pg_token ke order + set expires_at berdasarkan metode bayar
            $expiresAt = match (true) {
                in_array($paymentType, ['qris', 'gopay', 'shopeepay', 'dana', 'ovo']) => now()->addMinutes(15),
                str_contains($paymentType, '_va') => now()->addHours(24),
                default => now()->addMinutes(30),
            };
            $order->update([
                'pg_transaction_id' => $pgTrx->external_id,
                'pg_token' => $result['payment_url'] ?? $result['qr_code'] ?? null,
                'expires_at' => $expiresAt,
            ]);

            return response()->json([
                'success' => true,
                'status' => 'pending',
                'pg_trx_id' => $pgTrx->id,
                'payment_url' => $result['payment_url'] ?? null,
                'qr_code' => $result['qr_code'] ?? null,
                'qr_image_url' => $result['qr_image_url'] ?? null,
                'va_number' => $result['va_number'] ?? null,
                'va_bank' => $result['va_bank'] ?? null,
                'payment_type' => $pgTrx->payment_type,
                'amount' => (float) $pgTrx->amount,
            ]);
        } catch (PaymentClientException $e) {
            $pgTrx->update([
                'status' => 'failed',
                'gateway_http_status' => $e->httpStatus,
                'error_message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'status' => 'failed',
                'message' => 'Pembayaran gagal. Silakan coba lagi atau pilih metode lain.',
                'can_retry' => false,
            ], 422);
        } catch (PaymentServerException|PaymentTimeoutException|\Throwable $e) {
            $pgTrx->markUnknown(null, $e->getMessage());

            return response()->json([
                'success' => true,
                'status' => 'unknown',
                'pg_trx_id' => $pgTrx->id,
                'message' => 'Status pembayaran belum dapat dipastikan. Sedang memeriksa...',
            ]);
        }
    }

    /**
     * Cek status pembayaran PG untuk plan order (polling dari frontend).
     */
    public function checkStatus(Request $request, int $orderId): JsonResponse
    {
        /** @var User $user */
        $user = Auth::user();

        $order = PlanOrder::where('id', $orderId)
            ->where('user_id', $user->id)
            ->firstOrFail();

        $pgTrx = PaymentGatewayTransaction::where('plan_order_id', $order->id)
            ->latest('id')
            ->first();

        if (! $pgTrx) {
            return response()->json(['status' => $order->status]);
        }

        // Sudah terminal → return cached
        if ($pgTrx->isTerminal()) {
            if ($pgTrx->status === 'paid' && $order->status !== PlanOrder::STATUS_PAID) {
                $this->finalizePlanOrder($order, $pgTrx);
            }

            return response()->json([
                'status' => $pgTrx->status,
                'order_status' => $order->fresh()->status,
            ]);
        }

        // unknown/checking → reconcile
        if ($pgTrx->isAmbiguous()) {
            try {
                $gateway = PaymentGatewayFactory::make($pgTrx->provider);
                $result = $gateway->reconcile($pgTrx->external_id);

                if ($result['found']) {
                    $pgTrx->markReconciled($result['status']);

                    if ($result['status'] === 'paid') {
                        $this->finalizePlanOrder($order, $pgTrx);
                    }
                }
            } catch (\Throwable) {
                // Biarkan polling coba lagi nanti
            }

            return response()->json([
                'status' => $pgTrx->status,
                'order_status' => $order->fresh()->status,
            ]);
        }

        // Normal pending → call getStatus
        try {
            $gateway = PaymentGatewayFactory::make($pgTrx->provider);
            $result = $gateway->getStatus($pgTrx->external_id);

            $pgTrx->update([
                'status' => $result['status'],
                'status_checked_at' => now(),
                'raw_response' => $result['raw'],
            ]);

            if ($result['status'] === 'paid') {
                $this->finalizePlanOrder($order, $pgTrx);
            }
        } catch (\Throwable) {
            // Biarkan polling coba lagi
        }

        return response()->json([
            'status' => $pgTrx->fresh()->status,
            'order_status' => $order->fresh()->status,
        ]);
    }

    /**
     * Finalize plan order setelah pembayaran PG berhasil.
     */
    private function finalizePlanOrder(PlanOrder $order, PaymentGatewayTransaction $pgTrx): void
    {
        app(PlanOrderService::class)->finalize($order, $pgTrx->external_id);
    }

    /**
     * Halaman konfirmasi order.
     */
    public function confirm(string $orderRef): Response|RedirectResponse
    {
        /** @var User $user */
        $user = Auth::user();

        $order = PlanOrder::where('idempotency_key', $orderRef)
            ->where('user_id', $user->id)
            ->with('plan')
            ->firstOrFail();

        if ($order->isPaid()) {
            return redirect()->route('admin.plan.index')
                ->with('success', 'Paket sudah aktif!');
        }

        // Load PG transaction jika ada
        $pgTrx = PaymentGatewayTransaction::where('plan_order_id', $order->id)
            ->latest('id')
            ->first();

        $pgData = null;
        if ($pgTrx && in_array($pgTrx->status, ['pending', 'unknown', 'checking'])) {
            $raw = $pgTrx->raw_response ?? [];
            $pgData = [
                'pg_trx_id' => $pgTrx->id,
                'status' => $pgTrx->status,
                'payment_url' => $raw['_payment_url'] ?? $raw['payment_url'] ?? null,
                'qr_code' => $raw['_qr_code'] ?? $raw['qr_code'] ?? null,
                'qr_image_url' => $raw['_qr_image_url'] ?? $raw['qr_image_url'] ?? null,
                'va_number' => $raw['_va_number'] ?? $raw['va_number'] ?? null,
                'va_bank' => $raw['_va_bank'] ?? $raw['va_bank'] ?? null,
                'payment_type' => $pgTrx->payment_type,
            ];

            // Jika transaksi pending tidak punya data pembayaran, set pgData null
            // supaya frontend menampilkan payment selector
            $hasPaymentData = $pgData['qr_code'] || $pgData['qr_image_url'] || $pgData['va_number'] || $pgData['payment_url'];
            if (! $hasPaymentData) {
                $pgData = null;
            }
        }

        return Inertia::render('Admin/Plan/Confirm', [
            'order' => [
                'id' => $order->id,
                'idempotency_key' => $order->idempotency_key,
                'plan_label' => $order->plan?->label,
                'plan_code' => $order->plan?->code,
                'billing_period' => $order->billing_period,
                'period_label' => $order->periodLabel(),
                'amount' => (float) $order->amount,
                'original_amount' => $order->original_amount ? (float) $order->original_amount : null,
                'is_prorated' => $order->isProrated(),
                'status' => $order->status,
                'plan_active_until' => $order->plan_active_until,
                'is_manual' => $order->isManual(),
                'created_at' => $order->created_at,
                'payment_method_change_count' => $order->payment_method_change_count,
                'can_change_payment_method' => $order->canChangePaymentMethod(),
                'expires_at' => $order->expires_at?->toISOString(),
            ],
            'pgData' => $pgData,
            'billingConfig' => [
                'whatsapp' => config('billing.whatsapp'),
                'email' => config('billing.email'),
                'bank_name' => config('billing.bank_name'),
                'bank_account' => config('billing.bank_account'),
                'bank_holder' => config('billing.bank_holder'),
                'whatsapp_message' => str_replace(
                    '{order_ref}',
                    $order->idempotency_key,
                    config('billing.whatsapp_template', 'Halo, kode order saya: {order_ref}'),
                ),
            ],
        ]);
    }

    private function calculateActiveUntil(User $user, string $billingPeriod): Carbon
    {
        $base = ($user->plan_expires_at && $user->plan_expires_at->isFuture())
            ? $user->plan_expires_at
            : now();

        return match ($billingPeriod) {
            PlanOrder::PERIOD_YEARLY => $base->copy()->addYear(),
            default => $base->copy()->addMonth(),
        };
    }

    private function activeGateway(): ?string
    {
        return PlatformPaymentGateway::where('is_active', true)->value('provider');
    }

    private function notifyAdmin(PlanOrder $order, User $user): void
    {
        $adminEmail = config('billing.email');
        if (! $adminEmail) {
            return;
        }

        $store = $user->stores()->first();
        if ($store) {
            Notification::route('mail', $adminEmail)
                ->notify(new NewPlanOrder($order, $store));
        }
    }
}
