<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Models\PlanOrder;
use App\Models\PlatformPaymentGateway;
use App\Models\User;
use App\Notifications\NewPlanOrder;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Notification;
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
                'code' => $user->effectivePlanCode(),
                'label' => $user->planModel?->label ?? 'Free',
                'expires_at' => $user->plan_expires_at,
                'is_expired' => $user->isPlanExpired(),
            ],
            'storeCount' => $storeCount,
            'isAutoMode' => PlatformPaymentGateway::hasActiveGateway(),
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

        // Tolak kalau plan yang dipilih sama dengan plan aktif sekarang
        if ($user->planModel?->id === $plan->id && ! $user->isPlanExpired()) {
            return back()->with('error', "Akun kamu sudah menggunakan paket {$plan->label}.");
        }

        // Tolak downgrade
        if ($user->planModel && $plan->sort_order < $user->planModel->sort_order) {
            return back()->with('error', 'Downgrade paket belum tersedia. Hubungi admin untuk bantuan.');
        }

        $amount = $validated['billing_period'] === PlanOrder::PERIOD_YEARLY
            ? $plan->price_yearly
            : $plan->price;

        if ($amount <= 0) {
            return back()->with('error', 'Paket Free tidak memerlukan pembayaran.');
        }

        // Batalkan order pending yang sudah ada
        PlanOrder::where('user_id', $user->id)
            ->where('status', PlanOrder::STATUS_PENDING)
            ->update(['status' => PlanOrder::STATUS_CANCELLED]);

        $order = PlanOrder::create([
            'user_id' => $user->id,
            'plan_id' => $plan->id,
            'billing_period' => $validated['billing_period'],
            'amount' => $amount,
            'status' => PlanOrder::STATUS_PENDING,
            'plan_active_until' => $this->calculateActiveUntil($user, $validated['billing_period']),
            'payment_gateway' => PlatformPaymentGateway::hasActiveGateway() ? $this->activeGateway() : null,
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

        return Inertia::render('Admin/Plan/Confirm', [
            'order' => [
                'id' => $order->id,
                'idempotency_key' => $order->idempotency_key,
                'plan_label' => $order->plan?->label,
                'plan_code' => $order->plan?->code,
                'billing_period' => $order->billing_period,
                'period_label' => $order->periodLabel(),
                'amount' => (float) $order->amount,
                'status' => $order->status,
                'plan_active_until' => $order->plan_active_until,
                'is_manual' => $order->isManual(),
                'created_at' => $order->created_at,
            ],
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

        // Ambil toko pertama milik user sebagai konteks notifikasi
        $store = $user->stores()->first();
        if ($store) {
            Notification::route('mail', $adminEmail)
                ->notify(new NewPlanOrder($order, $store));
        }
    }
}
