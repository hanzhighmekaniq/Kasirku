<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\CustomerDebtLog;
use App\Models\PaymentMethod;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class DebtController extends Controller
{
    public function aging(Request $request)
    {
        $storeId = session('current_store_id');
        $today = Carbon::today();

        // Ambil semua customer dengan debt_balance > 0
        $customersRaw = Customer::where('store_id', $storeId)
            ->where('debt_balance', '>', 0)
            ->get();

        if ($customersRaw->isEmpty()) {
            return Inertia::render('Admin/Debts/Aging', [
                'summary' => ['total_piutang' => 0, 'jumlah_pelanggan' => 0, 'rata_rata_hutang' => 0],
                'agingBuckets' => [
                    ['label' => '0-30 Hari', 'key' => '30', 'count' => 0, 'total' => 0],
                    ['label' => '31-60 Hari', 'key' => '60', 'count' => 0, 'total' => 0],
                    ['label' => '61-90 Hari', 'key' => '90', 'count' => 0, 'total' => 0],
                    ['label' => '> 90 Hari', 'key' => '90plus', 'count' => 0, 'total' => 0],
                    ['label' => 'Tanpa Jatuh Tempo', 'key' => 'none', 'count' => 0, 'total' => 0],
                ],
                'customers' => [],
            ]);
        }

        $customerIds = $customersRaw->pluck('id')->toArray();

        // Cari debt log tertua tipe 'add' per customer untuk tahu due_date terlama
        $oldestDebts = DB::table('customer_debt_logs')
            ->whereIn('customer_id', $customerIds)
            ->where('type', 'add')
            ->select('customer_id', DB::raw('MIN(due_date) as oldest_due_date'))
            ->groupBy('customer_id')
            ->get()
            ->keyBy('customer_id');

        $customers = [];
        $buckets = [
            '30' => ['label' => '0-30 Hari', 'key' => '30', 'count' => 0, 'total' => 0],
            '60' => ['label' => '31-60 Hari', 'key' => '60', 'count' => 0, 'total' => 0],
            '90' => ['label' => '61-90 Hari', 'key' => '90', 'count' => 0, 'total' => 0],
            '90plus' => ['label' => '> 90 Hari', 'key' => '90plus', 'count' => 0, 'total' => 0],
            'none' => ['label' => 'Tanpa Jatuh Tempo', 'key' => 'none', 'count' => 0, 'total' => 0],
        ];

        $totalPiutang = 0;

        foreach ($customersRaw as $c) {
            $oldestDue = $oldestDebts->get($c->id)?->oldest_due_date;
            $bucketKey = 'none';

            if ($oldestDue) {
                $dueObj = Carbon::parse($oldestDue)->startOfDay();
                $daysPastDue = (int) $today->diffInDays($dueObj, false) * -1;

                if ($daysPastDue <= 30) {
                    $bucketKey = '30';
                } elseif ($daysPastDue <= 60) {
                    $bucketKey = '60';
                } elseif ($daysPastDue <= 90) {
                    $bucketKey = '90';
                } else {
                    $bucketKey = '90plus';
                }
            }

            $buckets[$bucketKey]['count']++;
            $buckets[$bucketKey]['total'] += (float) $c->debt_balance;
            $totalPiutang += (float) $c->debt_balance;

            $customers[] = [
                'id' => $c->id,
                'name' => $c->name,
                'phone' => $c->phone,
                'debt_balance' => (float) $c->debt_balance,
                'oldest_due_date' => $oldestDue,
                'aging_bucket' => $bucketKey,
                'aging_label' => $buckets[$bucketKey]['label'],
            ];
        }

        // Sort customers by debt_balance descending
        usort($customers, fn ($a, $b) => $b['debt_balance'] <=> $a['debt_balance']);

        return Inertia::render('Admin/Debts/Aging', [
            'summary' => [
                'total_piutang' => $totalPiutang,
                'jumlah_pelanggan' => count($customers),
                'rata_rata_hutang' => count($customers) > 0 ? $totalPiutang / count($customers) : 0,
            ],
            'agingBuckets' => array_values($buckets),
            'customers' => $customers,
        ]);
    }

    public function index()
    {
        $storeId = session('current_store_id');

        $customers = Customer::where('store_id', $storeId)
            ->where('debt_balance', '>', 0)
            ->with(['debtLogs' => fn ($q) => $q->latest()->limit(5)])
            ->orderByDesc('debt_balance')
            ->get(['id', 'code', 'name', 'phone', 'debt_balance', 'credit_limit']);

        return Inertia::render('Admin/Debts/Index', [
            'customers' => $customers,
            // Metode pembayaran non-hutang saja: melunasi hutang dengan
            // hutang lagi tidak masuk akal dan hanya memindahkan saldo.
            'paymentMethods' => PaymentMethod::forStore($storeId)
                ->where('is_active', true)
                ->where('type', '!=', 'debt')
                ->orderBy('name')
                ->get(['id', 'name', 'type']),
        ]);
    }

    public function pay(Request $request, Customer $customer)
    {
        $storeId = session('current_store_id');

        abort_if($customer->store_id !== (int) $storeId, 403);

        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'payment_method_id' => [
                'required',
                Rule::exists('payment_methods', 'id')
                    ->where('store_id', $storeId)
                    ->where('is_active', true)
                    ->whereNot('type', 'debt'),
            ],
            'notes' => 'nullable|string|max:500',
        ]);

        return DB::transaction(function () use ($storeId, $validated, $customer) {
            // Lock customer row untuk mencegah race condition
            $lockedCustomer = Customer::lockForUpdate()->find($customer->id);

            $amount = (float) $validated['amount'];
            $currentDebt = (float) $lockedCustomer->debt_balance;

            if ($amount > $currentDebt) {
                throw ValidationException::withMessages([
                    'amount' => 'Jumlah pelunasan melebihi hutang. Sisa: Rp'.number_format($currentDebt),
                ]);
            }

            $newBalance = $currentDebt - $amount;

            CustomerDebtLog::create([
                'customer_id' => $lockedCustomer->id,
                'store_id' => $storeId,
                'type' => 'payment',
                'amount' => $amount,
                'payment_method_id' => $validated['payment_method_id'],
                'balance_after' => $newBalance,
                'notes' => $validated['notes'] ?? 'Pelunasan hutang',
                'created_by' => Auth::id(),
            ]);

            $lockedCustomer->update(['debt_balance' => $newBalance]);

            return back()->with('success', 'Pelunasan berhasil. Sisa: Rp'.number_format($newBalance));
        });
    }
}
