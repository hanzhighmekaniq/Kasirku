<?php

namespace App\Http\Controllers\Developer;

use App\Http\Controllers\Controller;
use App\Models\DeveloperActionLog;
use App\Models\Plan;
use App\Models\PlanOrder;
use App\Models\PlanSubscription;
use App\Models\Store;
use App\Notifications\PlanUpgradeSuccess;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PlanOrderController extends Controller
{
    public function index(Request $request): Response
    {
        $orders = PlanOrder::with(['store', 'plan', 'createdBy', 'processedBy'])
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->status))
            ->when($request->filled('search'), fn ($q) => $q->whereHas('store', fn ($sq) => $sq->where('name', 'like', "%{$request->search}%")->orWhere('code', 'like', "%{$request->search}%")))
            ->orderByRaw("FIELD(status, 'pending', 'paid', 'cancelled', 'expired', 'failed')")
            ->orderByDesc('created_at')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Developer/PlanOrders/Index', [
            'orders' => $orders->through(fn (PlanOrder $o) => [
                'id' => $o->id,
                'idempotency_key' => $o->idempotency_key,
                'store_name' => $o->store?->name,
                'store_code' => $o->store?->code,
                'store_id' => $o->store_id,
                'plan_label' => $o->plan?->label,
                'billing_period' => $o->billing_period,
                'period_label' => $o->periodLabel(),
                'amount' => (float) $o->amount,
                'status' => $o->status,
                'status_label' => $o->statusLabel(),
                'is_manual' => $o->isManual(),
                'payment_gateway' => $o->payment_gateway,
                'created_by_name' => $o->createdBy?->name,
                'processed_by_name' => $o->processedBy?->name,
                'notes' => $o->notes,
                'plan_active_until' => $o->plan_active_until,
                'paid_at' => $o->paid_at,
                'created_at' => $o->created_at,
            ]),
            'filters' => $request->only(['status', 'search']),
            'statusOptions' => PlanOrder::STATUS_LABELS,
        ]);
    }

    /**
     * Developer approve order manual — plan toko langsung terupgrade.
     */
    public function approve(Request $request, PlanOrder $order): RedirectResponse
    {
        $validated = $request->validate([
            'notes' => 'nullable|string|max:500',
        ]);

        if (! $order->isPending()) {
            return back()->with('error', 'Order ini sudah tidak dalam status pending.');
        }

        DB::transaction(function () use ($order, $validated) {
            $user = $order->user;
            $plan = $order->plan;

            $order->update([
                'status' => PlanOrder::STATUS_PAID,
                'paid_at' => now(),
                'processed_by' => Auth::id(),
                'notes' => $validated['notes'] ?? null,
            ]);

            // Tutup subscription aktif user sebelumnya
            PlanSubscription::where('user_id', $user->id)
                ->whereNull('ended_at')
                ->update(['ended_at' => now()]);

            // Tentukan plan aktif baru
            $oldPlanId = $user->plan_id;
            $newPlanId = $plan->id;
            $reason = ($oldPlanId && Plan::find($oldPlanId)?->sort_order > $plan->sort_order)
                ? 'downgraded'
                : 'upgraded';

            // Update plan di USER (bukan store)
            $user->update([
                'plan_id' => $newPlanId,
                'plan_expires_at' => $order->plan_active_until,
            ]);

            // Catat riwayat subscription
            PlanSubscription::create([
                'user_id' => $user->id,
                'plan_id' => $newPlanId,
                'started_at' => now(),
                'reason' => $reason,
                'created_by' => Auth::id(),
            ]);

            // Audit log
            DeveloperActionLog::record('plan_order.approve', $order, null, [
                'order_ref' => $order->idempotency_key,
                'plan' => $plan->label,
                'user' => $user->name,
            ]);

            // Notifikasi owner — kirim ke user (bukan store owner)
            $store = $user->stores()->first();
            $user->notify(new PlanUpgradeSuccess($store ?? new Store, $plan, $order));
        });

        return back()->with('success', "Order {$order->idempotency_key} berhasil di-approve. Plan toko sudah diupgrade.");
    }

    /**
     * Developer tolak/cancel order manual.
     */
    public function reject(Request $request, PlanOrder $order): RedirectResponse
    {
        $validated = $request->validate([
            'notes' => 'required|string|max:500',
        ]);

        if (! $order->isPending()) {
            return back()->with('error', 'Order ini sudah tidak dalam status pending.');
        }

        $order->update([
            'status' => PlanOrder::STATUS_CANCELLED,
            'processed_by' => Auth::id(),
            'notes' => $validated['notes'],
        ]);

        DeveloperActionLog::record('plan_order.reject', $order, null, [
            'order_ref' => $order->idempotency_key,
            'reason' => $validated['notes'],
        ]);

        return back()->with('success', "Order {$order->idempotency_key} ditolak.");
    }
}
