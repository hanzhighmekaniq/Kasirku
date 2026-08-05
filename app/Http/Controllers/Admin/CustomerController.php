<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\CustomerDebtLog;
use App\Models\CustomerMembership;
use App\Models\CustomerPointLog;
use App\Models\CustomerTier;
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
                'customerTier:id,name,rank,color',
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
            'customerTier:id,name,rank,color',
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
            ->get()
            ->each->withNormalizedBenefits();

        // Benefit dinormalkan sebelum dikirim ke Inertia supaya tampilan membaca
        // satu bentuk saja, tidak perlu tahu soal kolom lama.
        $activeMembership = $customer->activeMembership();
        $activeMembership?->membership?->withNormalizedBenefits();
        $customer->memberships->each(
            fn ($cm) => $cm->membership?->withNormalizedBenefits(),
        );

        return Inertia::render('Admin/Customers/Show', [
            'customer' => $customer,
            'activeMembership' => $activeMembership,
            'membershipPlans' => $membershipPlans,
            'recentSales' => $recentSales,
            'storeType' => $this->resolveStoreType(),
            // Dipakai tampilan untuk menilai sebuah paket itu upgrade atau
            // downgrade dibanding tier pelanggan sekarang.
            'customerTiers' => CustomerTier::forStore($storeId)
                ->ranked()
                ->get(['id', 'name', 'rank', 'color']),
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
            'credit_limit' => 'nullable|numeric|min:0',
        ]);

        $validated['store_id'] = $storeId;
        $validated['code'] = $this->nextCode($storeId);
        $validated['deposit_balance'] = 0;

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

        if ($customer->debt_balance > 0) {
            return back()->withErrors(['customer' => 'Pelanggan masih memiliki hutang sebesar Rp'.number_format($customer->debt_balance).'. Lunasi terlebih dahulu.']);
        }

        if ($customer->sales()->exists()) {
            return back()->withErrors(['customer' => 'Pelanggan sudah memiliki riwayat transaksi. Nonaktifkan saja agar data tetap aman.']);
        }

        $customer->delete();

        return redirect()
            ->route('admin.customers.index')
            ->with('success', 'Pelanggan berhasil dihapus.');
    }

    public function pointHistory(Customer $customer)
    {
        $this->ensureSameStore($customer);

        $logs = CustomerPointLog::where('customer_id', $customer->id)
            ->with('creator:id,name', 'sale:id,sale_no')
            ->orderByDesc('created_at')
            ->paginate(20);

        return Inertia::render('Admin/Customers/PointHistory', [
            'customer' => [
                'id' => $customer->id,
                'name' => $customer->name,
                'code' => $customer->code,
                'points' => $customer->points,
            ],
            'pointLogs' => $logs,
        ]);
    }

    public function adjustPoints(Request $request, Customer $customer)
    {
        $this->ensureSameStore($customer);

        $validated = $request->validate([
            'adjustment' => 'required|integer|not_in:0',
            'notes' => 'nullable|string|max:255',
        ]);

        return DB::transaction(function () use ($validated, $customer) {
            // Lock customer row untuk mencegah race condition
            $lockedCustomer = Customer::lockForUpdate()->find($customer->id);

            $newBalance = max(0, $lockedCustomer->points + $validated['adjustment']);
            $actualAdjustment = $newBalance - $lockedCustomer->points;

            $lockedCustomer->update(['points' => $newBalance]);

            CustomerPointLog::create([
                'customer_id' => $lockedCustomer->id,
                'store_id' => $lockedCustomer->store_id,
                'type' => 'adjust',
                'points' => $actualAdjustment,
                'balance_after' => $newBalance,
                'notes' => $validated['notes'],
                'created_by' => Auth::id(),
            ]);

            return back()->with('success', 'Poin berhasil disesuaikan.');
        });
    }

    public function payDebt(Request $request, Customer $customer)
    {
        $this->ensureSameStore($customer);

        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'payment_method_id' => [
                'nullable',
                Rule::exists('payment_methods', 'id')
                    ->where('store_id', $customer->store_id)
                    ->where('is_active', true)
                    ->whereNot('type', 'debt'),
            ],
            'notes' => 'nullable|string|max:500',
        ]);

        return DB::transaction(function () use ($request, $customer, $validated) {
            // Lock customer row untuk mencegah race condition
            $lockedCustomer = Customer::lockForUpdate()->find($customer->id);

            $amount = (float) $validated['amount'];
            $currentDebt = (float) $lockedCustomer->debt_balance;

            if ($amount > $currentDebt) {
                throw ValidationException::withMessages([
                    'amount' => 'Jumlah pelunasan melebihi hutang. Hutang saat ini: Rp'.number_format($currentDebt),
                ]);
            }

            $newBalance = $currentDebt - $amount;

            CustomerDebtLog::create([
                'customer_id' => $lockedCustomer->id,
                'store_id' => $lockedCustomer->store_id,
                'type' => 'payment',
                'amount' => $amount,
                'payment_method_id' => $validated['payment_method_id'] ?? null,
                'balance_after' => $newBalance,
                'notes' => $validated['notes'] ?? 'Pelunasan hutang',
                'created_by' => Auth::id(),
            ]);

            $lockedCustomer->update(['debt_balance' => $newBalance]);

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'debt_balance' => $newBalance,
                ]);
            }

            return back()->with('success', 'Pelunasan berhasil. Sisa hutang: Rp'.number_format($newBalance));
        });
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
                'source' => 'manual',
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
            (int) $customer->store_id !== (int) session('current_store_id'),
            403,
        );
    }

    private function nextCode(int $storeId): string
    {
        $maxRetries = 5;
        for ($attempt = 0; $attempt < $maxRetries; $attempt++) {
            $last = Customer::where('store_id', $storeId)
                ->orderByDesc('id')
                ->value('code');

            if ($last && preg_match('/(\d+)$/', $last, $m)) {
                $code = 'CST'.str_pad((int) $m[1] + 1, 3, '0', STR_PAD_LEFT);
            } else {
                $code = 'CST001';
            }

            if (! Customer::where('store_id', $storeId)->where('code', $code)->exists()) {
                return $code;
            }
        }

        // Fallback: gunakan timestamp untuk uniqueness
        return 'CST'.str_pad((string) mt_rand(1, 999), 3, '0', STR_PAD_LEFT);
    }
}
