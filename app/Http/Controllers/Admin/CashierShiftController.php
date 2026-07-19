<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Concerns\HasStoreScope;
use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Branch;
use App\Models\CashierShift;
use App\Models\CashierShiftPayment;
use App\Models\Sale;
use App\Models\Store;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class CashierShiftController extends Controller
{
    use HasStoreScope;

    /* ─────────────────────────────────────────────────────────
     * INDEX
     * Permission: shift.view
     * - punya shift.manage → lihat semua shift di store
     * - hanya shift.view   → lihat shift sendiri saja
     * ──────────────────────────────────────────────────────── */
    public function index(Request $request)
    {
        [$storeId] = $this->storeScope();
        $user = $request->user();

        $query = CashierShift::with(['user:id,name', 'branch:id,name'])
            ->where('store_id', $storeId)
            ->latest('opened_at');

        // Kasir (tidak punya shift.manage) hanya lihat shift sendiri
        if (! $user->can('shift.manage')) {
            $query->where('user_id', $user->id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('search')) {
            $q = $request->search;
            $query->where(function ($sq) use ($q) {
                $sq->where('shift_no', 'like', "%{$q}%")->orWhereHas(
                    'user',
                    fn ($u) => $u->where('name', 'like', "%{$q}%"),
                );
            });
        }

        // Date range filter
        if ($request->filled('date_from')) {
            $query->whereDate('opened_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('opened_at', '<=', $request->date_to);
        }

        // Sorting
        $sort = $request->get('sort', 'opened_at');
        $direction = $request->get('direction', 'desc');
        $allowed = [
            'shift_no',
            'opened_at',
            'closed_at',
            'total_sales',
            'user_id',
        ];
        if (in_array($sort, $allowed)) {
            $query->orderBy($sort, $direction === 'asc' ? 'asc' : 'desc');
        }

        $activeShift = CashierShift::where('store_id', $storeId)
            ->where('user_id', $user->id)
            ->where('status', 'open')
            ->first();

        return Inertia::render('Admin/CashierShifts/Index', [
            'shifts' => $query->paginate(20)->withQueryString(),
            'activeShift' => $activeShift,
            'filters' => $request->only([
                'status',
                'search',
                'date_from',
                'date_to',
                'sort',
                'direction',
            ]),
            'canOpen' => $user->can('shift.open') && ! $activeShift,
            'canManage' => $user->can('shift.manage'),
            'storeType' => $this->resolveStoreType(),
        ]);
    }

    /* ─────────────────────────────────────────────────────────
     * CREATE — form buka shift baru
     * Permission: shift.open
     * ──────────────────────────────────────────────────────── */
    public function create(Request $request)
    {
        abort_unless(
            $request->user()->can('shift.open'),
            403,
            'Tidak punya izin membuka shift.',
        );

        [$storeId] = $this->storeScope();
        $user = $request->user();

        // Jika masih ada shift aktif, redirect ke halaman shift itu
        $active = $this->getActiveShift($storeId, $user->id);
        if ($active) {
            return redirect()
                ->route('admin.cashier-shifts.show', $active)
                ->with(
                    'error',
                    'Kamu masih punya shift aktif. Tutup dulu sebelum membuka yang baru.',
                );
        }

        $branchId = $this->resolveBranchId($storeId);

        return Inertia::render('Admin/CashierShifts/Create', [
            'branchName' => $this->resolveBranchName($branchId),
            'suggestedShiftNo' => $this->generateShiftNo($storeId),
            'storeType' => $this->resolveStoreType(),
        ]);
    }

    /* ─────────────────────────────────────────────────────────
     * STORE — simpan shift baru
     * Permission: shift.open
     * ──────────────────────────────────────────────────────── */
    public function store(Request $request)
    {
        abort_unless(
            $request->user()->can('shift.open'),
            403,
            'Tidak punya izin membuka shift.',
        );

        [$storeId] = $this->storeScope();
        $user = $request->user();

        if ($this->getActiveShift($storeId, $user->id)) {
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Kamu masih punya shift aktif.',
                ], 422);
            }

            return back()->with('error', 'Kamu masih punya shift aktif.');
        }

        $data = $request->validate([
            'opening_cash' => ['required', 'numeric', 'min:0'],
            'opening_note' => ['nullable', 'string', 'max:1000'],
        ]);

        $branchId = $this->resolveBranchId($storeId);

        $shift = $this->createShiftWithRetry(
            $storeId,
            $branchId,
            $user->id,
            $data,
            3,
        );

        $this->log(
            $storeId,
            $branchId,
            $user->id,
            $shift->id,
            "Membuka shift {$shift->shift_no} kas awal Rp ".
                number_format($data['opening_cash'], 0, ',', '.'),
            ['action' => 'open', 'opening_cash' => $data['opening_cash']],
        );

        // AJAX (modal Buka Shift di halaman POS) — balikan JSON supaya kasir
        // tidak pindah halaman; frontend cukup reload prop activeShift.
        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Shift berhasil dibuka.',
                'shift' => $shift->only([
                    'id',
                    'shift_no',
                    'opening_cash',
                    'opened_at',
                    'status',
                ]),
            ]);
        }

        return redirect()
            ->route('admin.cashier-shifts.show', $shift)
            ->with('success', 'Shift berhasil dibuka.');
    }

    /* ─────────────────────────────────────────────────────────
     * SHOW — detail shift
     * Permission: shift.view
     * - shift.manage → bisa lihat shift siapapun
     * - hanya shift.view → hanya shift sendiri
     * ──────────────────────────────────────────────────────── */
    public function show(Request $request, CashierShift $cashierShift)
    {
        abort_unless(
            $request->user()->can('shift.view'),
            403,
            'Tidak punya izin melihat shift.',
        );

        [$storeId] = $this->storeScope();
        $user = $request->user();

        abort_if($cashierShift->store_id !== $storeId, 404);

        // Tanpa shift.manage, hanya bisa lihat shift sendiri
        if (
            ! $user->can('shift.manage') &&
            $cashierShift->user_id !== $user->id
        ) {
            abort(403, 'Bukan shift kamu.');
        }

        $cashierShift->load([
            'user:id,name',
            'branch:id,name',
            'store:id,store_type_id',
            'store.storeType',
            'payments.paymentMethod:id,name,type',
        ]);

        $summary = $this->buildSummary($cashierShift);
        $storeType =
            $cashierShift->store?->getRelation('storeType')?->code ?? 'retail';

        // Data tambahan per store type
        $typeSummary = $this->buildTypeSummary($cashierShift, $storeType);

        $canClose =
            $cashierShift->isOpen() &&
            $user->can('shift.close') &&
            ($user->can('shift.manage') ||
                $cashierShift->user_id === $user->id);

        // Prev / next navigation
        $prevShift = CashierShift::where('store_id', $storeId)
            ->where('opened_at', '<', $cashierShift->opened_at)
            ->orderBy('opened_at', 'desc')
            ->first(['id', 'shift_no']);

        $nextShift = CashierShift::where('store_id', $storeId)
            ->where('opened_at', '>', $cashierShift->opened_at)
            ->orderBy('opened_at', 'asc')
            ->first(['id', 'shift_no']);

        // Check pending transactions for close warning
        $pendingCount = 0;
        if ($cashierShift->isOpen()) {
            $pendingCount = Sale::where(
                'cashier_shift_id',
                $cashierShift->id,
            )
                ->whereIn('status', ['hold', 'draft'])
                ->count();
        }

        return Inertia::render('Admin/CashierShifts/Show', [
            'shift' => $cashierShift,
            'summary' => $summary,
            'typeSummary' => $typeSummary,
            'storeType' => $storeType,
            'canClose' => $canClose,
            'canManage' => $user->can('shift.manage'),
            'prevShift' => $prevShift,
            'nextShift' => $nextShift,
            'pendingCount' => $pendingCount,
        ]);
    }

    /* ─────────────────────────────────────────────────────────
     * CLOSE — tutup shift
     * Permission: shift.close
     * - shift.manage → tutup shift siapapun
     * - hanya shift.close → tutup shift sendiri
     * ──────────────────────────────────────────────────────── */
    public function close(Request $request, CashierShift $cashierShift)
    {
        abort_unless(
            $request->user()->can('shift.close'),
            403,
            'Tidak punya izin menutup shift.',
        );

        [$storeId] = $this->storeScope();
        $user = $request->user();

        abort_if($cashierShift->store_id !== $storeId, 404);
        abort_unless($cashierShift->isOpen(), 422, 'Shift sudah ditutup.');
        abort_unless(
            $user->can('shift.manage') || $cashierShift->user_id === $user->id,
            403,
            'Bukan hak kamu menutup shift ini.',
        );

        $data = $request->validate([
            'actual_cash' => ['required', 'numeric', 'min:0'],
            'closing_note' => ['nullable', 'string', 'max:1000'],
            'payment_actuals' => ['nullable', 'array'],
            'payment_actuals.*.payment_method_id' => [
                'required',
                'integer',
                'exists:payment_methods,id',
            ],
            'payment_actuals.*.actual_amount' => [
                'required',
                'numeric',
                'min:0',
            ],
        ]);

        // Cek transaksi tertunda
        $pendingCount = Sale::where(
            'cashier_shift_id',
            $cashierShift->id,
        )
            ->whereIn('status', ['hold', 'draft'])
            ->count();

        $summary = $this->buildSummary($cashierShift);

        // Cek selisih besar (threshold Rp 50.000)
        $discrepancy = abs(
            (float) $data['actual_cash'] - (float) $summary['expected_cash'],
        );
        $discrepancyThreshold = 50000;

        if (
            $discrepancy > $discrepancyThreshold &&
            ! $request->has('force_close')
        ) {
            return back()->with(
                'warning',
                'Selisih kas terlalu besar (Rp '.
                    number_format($discrepancy, 0, ',', '.').
                    '). Konfirmasi ulang atau gunakan force_close.',
            );
        }

        DB::transaction(function () use ($cashierShift, $data, $summary) {
            $cashierShift->update([
                'closed_at' => now(),
                'actual_cash' => $data['actual_cash'],
                'cash_difference' => $data['actual_cash'] - $summary['expected_cash'],
                'total_sales' => $summary['total_sales'],
                'total_refunds' => $summary['total_refunds'],
                'expected_cash' => $summary['expected_cash'],
                'status' => 'closed',
                'closing_note' => $data['closing_note'] ?? null,
            ]);

            $byMethod = collect($data['payment_actuals'] ?? [])->keyBy(
                'payment_method_id',
            );
            foreach ($summary['payment_breakdown'] as $item) {
                $actual =
                    $byMethod->get($item['payment_method_id'])[
                        'actual_amount'
                    ] ?? null;
                CashierShiftPayment::updateOrCreate(
                    [
                        'cashier_shift_id' => $cashierShift->id,
                        'payment_method_id' => $item['payment_method_id'],
                    ],
                    [
                        'system_amount' => $item['total'],
                        'actual_amount' => $actual,
                        'difference_amount' => $actual !== null ? $actual - $item['total'] : 0,
                    ],
                );
            }
        });

        $this->log(
            $storeId,
            $cashierShift->branch_id,
            $user->id,
            $cashierShift->id,
            "Menutup shift {$cashierShift->shift_no}. Total Rp ".
                number_format($summary['total_sales'], 0, ',', '.'),
            [
                'action' => 'close',
                'actual_cash' => $data['actual_cash'],
                'pending_count' => $pendingCount,
            ],
        );

        return redirect()
            ->route('admin.cashier-shifts.show', $cashierShift)
            ->with('success', 'Shift berhasil ditutup.');
    }

    /* ─────────────────────────────────────────────────────────
     * UPDATE — edit data shift
     * Permission: shift.manage
     * ──────────────────────────────────────────────────────── */
    public function update(Request $request, CashierShift $cashierShift)
    {
        abort_unless(
            $request->user()->can('shift.manage'),
            403,
            'Tidak punya izin mengedit shift.',
        );

        [$storeId] = $this->storeScope();
        abort_if($cashierShift->store_id !== $storeId, 404);

        $data = $request->validate([
            'opening_cash' => ['sometimes', 'numeric', 'min:0'],
            'actual_cash' => ['sometimes', 'numeric', 'min:0'],
            'opening_note' => ['nullable', 'string', 'max:1000'],
            'closing_note' => ['nullable', 'string', 'max:1000'],
        ]);

        $cashierShift->update($data);

        if (array_key_exists('opening_cash', $data)) {
            $summary = $this->buildSummary($cashierShift);
            $cashierShift->update([
                'expected_cash' => $summary['expected_cash'],
            ]);
        }
        if (
            array_key_exists('actual_cash', $data) &&
            ! $cashierShift->isOpen()
        ) {
            $cashierShift->refresh();
            $cashierShift->update([
                'cash_difference' => $cashierShift->actual_cash - $cashierShift->expected_cash,
            ]);
        }

        $this->log(
            $storeId,
            $cashierShift->branch_id,
            $request->user()->id,
            $cashierShift->id,
            "Mengedit shift {$cashierShift->shift_no}",
            ['action' => 'edit', 'changes' => $data],
        );

        return redirect()
            ->route('admin.cashier-shifts.show', $cashierShift)
            ->with('success', 'Shift berhasil diperbarui.');
    }

    /* ─────────────────────────────────────────────────────────
     * DESTROY — hapus shift
     * Permission: shift.manage
     * ──────────────────────────────────────────────────────── */
    public function destroy(Request $request, CashierShift $cashierShift)
    {
        abort_unless(
            $request->user()->can('shift.manage'),
            403,
            'Tidak punya izin menghapus shift.',
        );

        [$storeId] = $this->storeScope();
        abort_if($cashierShift->store_id !== $storeId, 404);

        $shiftNo = $cashierShift->shift_no;

        // Soft delete — catat penghapus
        $cashierShift->deleted_by = $request->user()->id;
        $cashierShift->save();
        $cashierShift->delete(); // soft delete via SoftDeletes trait

        // Soft-delete related payments
        CashierShiftPayment::where(
            'cashier_shift_id',
            $cashierShift->id,
        )->delete();

        $this->log(
            $storeId,
            $cashierShift->branch_id,
            $request->user()->id,
            null,
            "Mengarsipkan shift {$shiftNo}",
            ['action' => 'delete', 'shift_no' => $shiftNo],
        );

        return redirect()
            ->route('admin.cashier-shifts.index')
            ->with('success', "Shift {$shiftNo} berhasil diarsipkan.");
    }

    /* ─────────────────────────────────────────────────────────
     * REOPEN — buka ulang shift yang sudah ditutup
     * Permission: shift.manage
     * ──────────────────────────────────────────────────────── */
    public function reopen(Request $request, CashierShift $cashierShift)
    {
        abort_unless(
            $request->user()->can('shift.manage'),
            403,
            'Tidak punya izin membuka ulang shift.',
        );

        [$storeId] = $this->storeScope();
        abort_if($cashierShift->store_id !== $storeId, 404);
        abort_unless(
            $cashierShift->status === 'closed',
            422,
            'Shift belum ditutup.',
        );

        $alreadyOpen = $this->getActiveShift($storeId, $cashierShift->user_id);
        if ($alreadyOpen) {
            return back()->with(
                'error',
                "Kasir masih punya shift aktif (#{$alreadyOpen->shift_no}). Tutup dulu sebelum membuka ulang.",
            );
        }

        $cashierShift->update([
            'closed_at' => null,
            'actual_cash' => null,
            'cash_difference' => 0,
            'status' => 'open',
            'closing_note' => null,
        ]);

        $this->log(
            $storeId,
            $cashierShift->branch_id,
            $request->user()->id,
            $cashierShift->id,
            "Membuka ulang shift {$cashierShift->shift_no}",
            ['action' => 'reopen'],
        );

        return redirect()
            ->route('admin.cashier-shifts.show', $cashierShift)
            ->with(
                'success',
                "Shift {$cashierShift->shift_no} berhasil dibuka ulang.",
            );
    }

    /* ─────────────────────────────────────────────────────────
     * PRIVATE HELPERS
     * ──────────────────────────────────────────────────────── */
    private function getActiveShift(int $storeId, int $userId): ?CashierShift
    {
        return CashierShift::where('store_id', $storeId)
            ->where('user_id', $userId)
            ->where('status', 'open')
            ->first();
    }

    private function resolveBranchId(int $storeId): ?int
    {
        $id = session('current_branch_id') ?? session('branch_id');
        if ($id) {
            return (int) $id;
        }

        $first = Branch::where('store_id', $storeId)
            ->where('is_active', true)
            ->first();

        if ($first) {
            session([
                'current_branch_id' => $first->id,
                'branch_id' => $first->id,
            ]);

            return $first->id;
        }

        return null;
    }

    private function resolveBranchName(?int $branchId): string
    {
        if (! $branchId) {
            return 'Pusat';
        }

        return Branch::find($branchId)?->name ?? 'Pusat';
    }

    private function generateShiftNo(int $storeId): string
    {
        $prefix = 'SHF-'.now()->format('Ymd').'-';
        $last = CashierShift::where('shift_no', 'like', $prefix.'%')
            ->orderByDesc('id')
            ->first();
        $seq = $last ? (int) substr($last->shift_no, -3) + 1 : 1;

        return $prefix.str_pad((string) $seq, 3, '0', STR_PAD_LEFT);
    }

    /** Retry create shift — antisipasi race condition duplicate shift_no */
    private function createShiftWithRetry(
        int $storeId,
        int $branchId,
        int $userId,
        array $data,
        int $maxRetries = 3,
    ): CashierShift {
        for ($attempt = 0; $attempt < $maxRetries; $attempt++) {
            try {
                return CashierShift::create([
                    'store_id' => $storeId,
                    'branch_id' => $branchId,
                    'user_id' => $userId,
                    'shift_no' => $this->generateShiftNo($storeId),
                    'opened_at' => now(),
                    'opening_cash' => $data['opening_cash'],
                    'expected_cash' => $data['opening_cash'],
                    'status' => 'open',
                    'opening_note' => $data['opening_note'] ?? null,
                ]);
            } catch (\Exception $e) {
                if (
                    $attempt === $maxRetries - 1 ||
                    ! str_contains($e->getMessage(), 'Duplicate entry')
                ) {
                    throw $e;
                }
                usleep(100000); // 100ms delay before retry
            }
        }
        throw new \RuntimeException(
            "Gagal membuat shift setelah {$maxRetries}x percobaan.",
        );
    }

    private function buildSummary(CashierShift $shift): array
    {
        $salesQ = Sale::where('store_id', $shift->store_id)
            ->where('user_id', $shift->user_id)
            ->where('status', 'completed')
            ->whereBetween('sale_date', [
                $shift->opened_at,
                $shift->closed_at ?? now(),
            ]);

        if ($shift->branch_id) {
            $salesQ->where('branch_id', $shift->branch_id);
        }

        $totalSales = (float) $salesQ->sum('grand_total');
        $totalRefunds = 0;
        $saleIds = $salesQ->pluck('id');

        $breakdown = DB::table('sale_payments')
            ->join(
                'payment_methods',
                'sale_payments.payment_method_id',
                '=',
                'payment_methods.id',
            )
            ->whereIn('sale_payments.sale_id', $saleIds)
            ->select(
                'sale_payments.payment_method_id',
                'payment_methods.name as method_name',
                'payment_methods.type as method_type',
                DB::raw('SUM(sale_payments.amount) as total'),
            )
            ->groupBy(
                'sale_payments.payment_method_id',
                'payment_methods.name',
                'payment_methods.type',
            )
            ->orderByDesc('total')
            ->get()
            ->map(
                fn ($r) => [
                    'payment_method_id' => $r->payment_method_id,
                    'method_name' => $r->method_name,
                    'method_type' => $r->method_type,
                    'total' => (float) $r->total,
                ],
            )
            ->toArray();

        $cashSales = collect($breakdown)
            ->where('method_type', 'cash')
            ->sum('total');
        $expectedCash =
            (float) $shift->opening_cash + $cashSales - $totalRefunds;

        return [
            'total_sales' => $totalSales,
            'total_refunds' => $totalRefunds,
            'expected_cash' => $expectedCash,
            'cash_sales' => $cashSales,
            'payment_breakdown' => $breakdown,
        ];
    }

    private function buildTypeSummary(
        CashierShift $shift,
        string $storeType,
    ): array {
        $salesQ = Sale::where('store_id', $shift->store_id)
            ->where('user_id', $shift->user_id)
            ->where('status', 'completed')
            ->whereBetween('sale_date', [
                $shift->opened_at,
                $shift->closed_at ?? now(),
            ]);

        if ($shift->branch_id) {
            $salesQ->where('branch_id', $shift->branch_id);
        }

        $result = [];

        // SERVICE / TICKET (barbershop, salon, bioskop, event, dll) — tampilkan komisi karyawan
        if (in_array($storeType, ['service', 'ticket'])) {
            if (Schema::hasTable('employee_commissions')) {
                $saleIds = (clone $salesQ)->pluck('id');
                $commissions = DB::table('employee_commissions')
                    ->join(
                        'employees',
                        'employee_commissions.employee_id',
                        '=',
                        'employees.id',
                    )
                    ->whereIn('employee_commissions.sale_id', $saleIds)
                    ->select(
                        'employees.name as employee_name',
                        DB::raw(
                            'SUM(employee_commissions.commission_amount) as total_commission',
                        ),
                        DB::raw(
                            'COUNT(employee_commissions.id) as transaction_count',
                        ),
                    )
                    ->groupBy('employees.id', 'employees.name')
                    ->orderByDesc('total_commission')
                    ->get()
                    ->map(
                        fn ($r) => [
                            'employee_name' => $r->employee_name,
                            'total_commission' => (float) $r->total_commission,
                            'transaction_count' => (int) $r->transaction_count,
                        ],
                    )
                    ->toArray();

                $result['commissions'] = $commissions;
                $result['total_commission'] = collect($commissions)->sum(
                    'total_commission',
                );
            }
        }

        // RETAIL + FNB — tampilkan breakdown per kategori
        if (in_array($storeType, ['retail', 'fnb'])) {
            $saleIds = (clone $salesQ)->pluck('id');
            $categoryBreakdown = DB::table('sale_items')
                ->join('products', 'sale_items.product_id', '=', 'products.id')
                ->join(
                    'categories',
                    'products.category_id',
                    '=',
                    'categories.id',
                )
                ->whereIn('sale_items.sale_id', $saleIds)
                ->select(
                    'categories.name as category_name',
                    DB::raw('SUM(sale_items.subtotal) as total'),
                    DB::raw('SUM(sale_items.quantity) as qty'),
                )
                ->groupBy('categories.id', 'categories.name')
                ->orderByDesc('total')
                ->limit(10)
                ->get()
                ->map(
                    fn ($r) => [
                        'category_name' => $r->category_name,
                        'total' => (float) $r->total,
                        'qty' => (int) $r->qty,
                    ],
                )
                ->toArray();

            $result['category_breakdown'] = $categoryBreakdown;
            $result['total_transactions'] = (clone $salesQ)->count();
        }

        // RENTAL / HOSPITALITY — tampilkan total booking/sesi
        if (in_array($storeType, ['rental', 'hospitality'])) {
            $result['total_transactions'] = (clone $salesQ)->count();

            if (Schema::hasTable('bookings')) {
                $result['booking_count'] = DB::table('bookings')
                    ->where('store_id', $shift->store_id)
                    ->whereBetween('created_at', [
                        $shift->opened_at,
                        $shift->closed_at ?? now(),
                    ])
                    ->count();
            }
        }

        return $result;
    }

    private function resolveStoreType(): string
    {
        $storeId = session('current_store_id');

        return Store::with('storeType')
            ->find($storeId)
            ?->getRelation('storeType')?->code ?? 'retail';
    }

    private function log(
        int $storeId,
        ?int $branchId,
        int $userId,
        ?int $subjectId,
        string $desc,
        array $props,
    ): void {
        if (! class_exists(ActivityLog::class)) {
            return;
        }
        ActivityLog::create([
            'store_id' => $storeId,
            'branch_id' => $branchId,
            'user_id' => $userId,
            'log_name' => 'shift',
            'description' => $desc,
            'subject_type' => CashierShift::class,
            'subject_id' => $subjectId,
            'properties' => $props,
        ]);
    }
}
