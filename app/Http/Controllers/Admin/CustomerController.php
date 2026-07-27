<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\CustomerDebtLog;
use App\Models\CustomerMembership;
use App\Models\Membership;
use App\Models\Store;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        $storeId = session('current_store_id');
        abort_unless($storeId, 403);

        $customers = Customer::where('store_id', $storeId)
            ->with([
                'memberships' => fn ($query) => $query
                    ->active()
                    ->with('membership')
                    ->latest(),
            ])
            ->orderByDesc('created_at')
            ->get();

        return Inertia::render('Admin/Customers/Index', [
            'customers' => $customers,
            'storeType' => Store::with('storeType')
                ->find($storeId)
                ?->getRelation('storeType')?->code ?? 'retail',
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Customers/Create', [
            'storeType' => $this->resolveStoreType(),
        ]);
    }

    public function edit(Customer $customer)
    {
        $this->ensureSameStore($customer);

        return Inertia::render('Admin/Customers/Edit', [
            'customer' => $customer,
            'storeType' => $this->resolveStoreType(),
        ]);
    }

    public function show(Customer $customer)
    {
        $this->ensureSameStore($customer);
        $storeId = session('current_store_id');

        $customer->load([
            'memberships' => fn ($query) => $query
                ->with('membership')
                ->latest(),
            'debtLogs' => fn ($query) => $query->latest()->limit(20),
        ])->loadCount('sales');

        $recentSales = $customer->sales()
            ->with('user:id,name')
            ->latest('sale_date')
            ->limit(20)
            ->get();

        $membershipPlans = Membership::where('store_id', $storeId)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        return Inertia::render('Admin/Customers/Show', [
            'customer' => $customer,
            'activeMembership' => $customer->activeMembership(),
            'membershipPlans' => $membershipPlans,
            'recentSales' => $recentSales,
            'storeType' => $this->resolveStoreType(),
        ]);
    }

    public function store(Request $request)
    {
        $storeId = session('current_store_id');
        abort_unless($storeId, 403);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:30',
            'email' => [
                'nullable',
                'email',
                Rule::unique('customers', 'email')->where('store_id', $storeId),
            ],
            'address' => 'nullable|string',
            'birth_date' => 'nullable|date',
            'gender' => 'nullable|in:male,female',
            'notes' => 'nullable|string|max:500',
            'deposit_balance' => 'nullable|numeric|min:0',
            'credit_limit' => 'nullable|numeric|min:0',
        ]);

        $validated['store_id'] = $storeId;
        $validated['code'] = $this->nextCode($storeId);

        if (isset($validated['deposit_balance'])) {
            $validated['deposit_balance'] = $validated['deposit_balance'] ?: 0;
        }

        $customer = Customer::create($validated);

        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'customer' => $customer->fresh(),
            ]);
        }

        return redirect()
            ->route('admin.customers.index')
            ->with('success', 'Pelanggan berhasil ditambahkan.');
    }

    public function update(Request $request, Customer $customer)
    {
        $this->ensureSameStore($customer);
        $storeId = session('current_store_id');

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:30',
            'email' => [
                'nullable',
                'email',
                Rule::unique('customers', 'email')
                    ->ignore($customer->id)
                    ->where('store_id', $storeId),
            ],
            'address' => 'nullable|string',
            'birth_date' => 'nullable|date',
            'gender' => 'nullable|in:male,female',
            'notes' => 'nullable|string|max:500',
            'deposit_balance' => 'nullable|numeric|min:0',
            'credit_limit' => 'nullable|numeric|min:0',
        ]);

        $customer->update($validated);

        return redirect()
            ->route('admin.customers.index')
            ->with('success', 'Pelanggan berhasil diupdate.');
    }

    public function destroy(Customer $customer)
    {
        $this->ensureSameStore($customer);

        $customer->delete();

        return redirect()
            ->route('admin.customers.index')
            ->with('success', 'Pelanggan berhasil dihapus.');
    }

    public function payDebt(Request $request, Customer $customer)
    {
        $this->ensureSameStore($customer);

        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'notes' => 'nullable|string|max:500',
        ]);

        $amount = (float) $validated['amount'];
        $currentDebt = (float) $customer->debt_balance;

        // Ditolak sebagai error validasi, bukan back()->with('error'):
        // pesannya menempel di field dan klien JSON menerima 422, bukan 302
        // yang terlihat seolah berhasil.
        if ($amount > $currentDebt) {
            throw ValidationException::withMessages([
                'amount' => 'Jumlah pelunasan melebihi hutang. Hutang saat ini: Rp'.number_format($currentDebt),
            ]);
        }

        $newBalance = $currentDebt - $amount;

        CustomerDebtLog::create([
            'customer_id' => $customer->id,
            'store_id' => $customer->store_id,
            'type' => 'payment',
            'amount' => $amount,
            'balance_after' => $newBalance,
            'notes' => $validated['notes'] ?? 'Pelunasan hutang',
            'created_by' => Auth::id(),
        ]);

        $customer->update(['debt_balance' => $newBalance]);

        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'debt_balance' => $newBalance,
            ]);
        }

        return back()->with('success', 'Pelunasan berhasil. Sisa hutang: Rp'.number_format($newBalance));
    }

    public function assignMembership(Request $request, Customer $customer)
    {
        $this->ensureSameStore($customer);
        $storeId = session('current_store_id');

        $validated = $request->validate([
            'membership_id' => [
                'required',
                Rule::exists('memberships', 'id')->where('store_id', $storeId),
            ],
            'notes' => 'nullable|string|max:500',
        ]);

        $membership = Membership::where('store_id', $storeId)
            ->where('is_active', true)
            ->findOrFail($validated['membership_id']);
        $startDate = now()->startOfDay();

        DB::transaction(function () use ($customer, $membership, $startDate, $validated) {
            $customer->memberships()
                ->active()
                ->update(['status' => 'cancelled']);

            $customer->memberships()->create([
                'membership_id' => $membership->id,
                'start_date' => $startDate,
                'expired_date' => $membership->calculateExpiry($startDate),
                'remaining_visits' => $membership->duration_type === 'visit'
                    ? $membership->duration_value
                    : null,
                'status' => 'active',
                'notes' => $validated['notes'] ?? null,
            ]);

            $customer->syncTierFromMembership();
        });

        return back()->with('success', "Membership {$membership->name} berhasil diaktifkan.");
    }

    public function revokeMembership(CustomerMembership $customerMembership)
    {
        $customerMembership->load('customer');
        $this->ensureSameStore($customerMembership->customer);

        $customerMembership->update(['status' => 'cancelled']);
        $customerMembership->customer->syncTierFromMembership();

        return back()->with('success', 'Membership pelanggan berhasil dicabut.');
    }

    // ── Helpers ──────────────────────────────────────────

    private function resolveStoreType(): string
    {
        $storeId = session('current_store_id');

        return Store::with('storeType')
            ->find($storeId)
            ?->getRelation('storeType')?->code ?? 'retail';
    }

    private function ensureSameStore(Customer $customer): void
    {
        abort_if(
            $customer->store_id !== (int) session('current_store_id'),
            403,
        );
    }

    private function nextCode(int $storeId): string
    {
        $last = Customer::where('store_id', $storeId)
            ->orderByDesc('id')
            ->value('code');

        if ($last && preg_match('/(\d+)$/', $last, $m)) {
            return 'CST'.str_pad((int) $m[1] + 1, 3, '0', STR_PAD_LEFT);
        }

        return 'CST001';
    }
}
