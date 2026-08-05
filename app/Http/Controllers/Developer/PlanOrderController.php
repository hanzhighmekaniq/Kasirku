<?php

namespace App\Http\Controllers\Developer;

use App\Http\Controllers\Controller;
use App\Models\DeveloperActionLog;
use App\Models\Plan;
use App\Models\PlanOrder;
use App\Services\PlanOrderService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class PlanOrderController extends Controller
{
    public function index(Request $request): Response
    {
        $orders = PlanOrder::with(['user.stores', 'plan', 'createdBy', 'processedBy'])
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->status))
            ->when($request->filled('search'), fn ($q) => $q->whereHas('user.stores', fn ($sq) => $sq->where('name', 'like', "%{$request->search}%")->orWhere('code', 'like', "%{$request->search}%")))
            ->orderByRaw("FIELD(status, 'pending', 'paid', 'cancelled', 'expired', 'failed')")
            ->orderByDesc('created_at')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Developer/PlanOrders/Index', [
            'orders' => $orders->through(fn (PlanOrder $o) => [
                'id' => $o->id,
                'idempotency_key' => $o->idempotency_key,
                'user_name' => $o->user?->name,
                'store_name' => $o->user?->stores()?->first()?->name,
                'store_code' => $o->user?->stores()?->first()?->code,
                'store_id' => $o->user?->stores()?->first()?->id,
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

        // Simpan notes sebelum finalize
        if ($validated['notes'] ?? null) {
            $order->update(['notes' => $validated['notes']]);
        }

        // Finalize via service
        app(PlanOrderService::class)->finalize($order, null, Auth::id());

        // Audit log
        DeveloperActionLog::record('plan_order.approve', $order, null, [
            'order_ref' => $order->idempotency_key,
            'plan' => $order->plan?->label,
            'user' => $order->user?->name,
        ]);

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
