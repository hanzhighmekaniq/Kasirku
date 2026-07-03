<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Concerns\HasStoreScope;
use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\CashierShift;
use App\Models\CashierShiftPayment;
use App\Models\Sale;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class CashierShiftController extends Controller
{
    use HasStoreScope;

    public function index(Request $request)
    {
        [$storeId, $branchId] = $this->storeScope();
        $user = $request->user();

        $query = CashierShift::with([
            "user:id,name,email",
            "branch:id,name,code",
        ])
            ->where("store_id", $storeId)
            ->latest("opened_at");

        if ($user->isKasir()) {
            $query->where("user_id", $user->id);
        }
        if ($branchId) {
            $query->where("branch_id", $branchId);
        }
        if ($request->filled("status")) {
            $query->where("status", $request->status);
        }

        $activeShift = CashierShift::where("store_id", $storeId)
            ->where("user_id", $user->id)
            ->where("status", "open")
            ->first();

        return Inertia::render("Admin/CashierShifts/Index", [
            "shifts" => $query->paginate(20)->withQueryString(),
            "activeShift" => $activeShift,
            "filters" => $request->only("status"),
            "canOpenShift" => $user->can("shift.open") && !$activeShift,
        ]);
    }

    public function create(Request $request)
    {
        abort_unless($request->user()->can("shift.open"), 403);

        [$storeId, $branchId] = $this->storeScope();
        $activeShift = $this->activeShift($storeId, $request->user()->id);

        if ($activeShift) {
            return redirect()
                ->route("admin.cashier-shifts.show", $activeShift)
                ->with("error", "Kamu masih punya shift yang sedang berjalan.");
        }

        return Inertia::render("Admin/CashierShifts/Create", [
            "branchId" => $branchId,
            "suggestedShiftNo" => $this->nextShiftNo($storeId),
        ]);
    }

    public function store(Request $request)
    {
        abort_unless($request->user()->can("shift.open"), 403);

        [$storeId, $branchId] = $this->storeScope();
        $validated = $request->validate([
            "opening_cash" => ["required", "numeric", "min:0"],
            "opening_note" => ["nullable", "string", "max:1000"],
        ]);

        if ($this->activeShift($storeId, $request->user()->id)) {
            return redirect()
                ->route("admin.cashier-shifts.index")
                ->with("error", "Kamu masih punya shift yang sedang berjalan.");
        }

        $shift = CashierShift::create([
            "store_id" => $storeId,
            "branch_id" => $branchId,
            "user_id" => $request->user()->id,
            "shift_no" => $this->nextShiftNo($storeId),
            "opened_at" => now(),
            "opening_cash" => $validated["opening_cash"],
            "expected_cash" => $validated["opening_cash"],
            "status" => "open",
            "opening_note" => $validated["opening_note"] ?? null,
        ]);

        ActivityLog::create([
            "store_id" => $storeId,
            "branch_id" => $branchId,
            "user_id" => $request->user()->id,
            "log_name" => "shift",
            "description" =>
                "Membuka shift {$shift->shift_no} dengan kas awal Rp " .
                number_format($validated["opening_cash"], 0, ",", "."),
            "subject_type" => CashierShift::class,
            "subject_id" => $shift->id,
            "properties" => [
                "action" => "open",
                "opening_cash" => $validated["opening_cash"],
            ],
        ]);

        return redirect()
            ->route("admin.cashier-shifts.show", $shift)
            ->with("success", "Shift kasir berhasil dibuka.");
    }

    public function show(Request $request, CashierShift $cashierShift)
    {
        $this->authorizeShift($request, $cashierShift);

        $cashierShift->load([
            "user:id,name,email",
            "branch:id,name,code",
            "payments.paymentMethod:id,name,code,type",
        ]);

        $summary = $this->calculateSummary($cashierShift);

        return Inertia::render("Admin/CashierShifts/Show", [
            "shift" => $cashierShift,
            "summary" => $summary,
            "canClose" =>
                $request->user()->can("shift.close") && $cashierShift->isOpen(),
        ]);
    }

    public function close(Request $request, CashierShift $cashierShift)
    {
        // Owner/admin bisa tutup shift siapapun, kasir hanya bisa tutup shift sendiri
        $isAdmin = $request->user()->isAdmin();
        abort_unless(
            $request->user()->can("shift.close") &&
                ($isAdmin || $cashierShift->user_id === $request->user()->id),
            403,
        );
        abort_unless($cashierShift->isOpen(), 422, "Shift sudah ditutup.");

        $validated = $request->validate([
            "actual_cash" => ["required", "numeric", "min:0"],
            "closing_note" => ["nullable", "string", "max:1000"],
            "payment_actuals" => ["nullable", "array"],
            "payment_actuals.*.payment_method_id" => [
                "required",
                "integer",
                "exists:payment_methods,id",
            ],
            "payment_actuals.*.actual_amount" => [
                "required",
                "numeric",
                "min:0",
            ],
        ]);

        $summary = $this->calculateSummary($cashierShift);

        DB::transaction(function () use ($cashierShift, $validated, $summary) {
            $cashierShift->update([
                "closed_at" => now(),
                "actual_cash" => $validated["actual_cash"],
                "cash_difference" =>
                    $validated["actual_cash"] - $summary["expected_cash"],
                "total_sales" => $summary["total_sales"],
                "total_refunds" => $summary["total_refunds"],
                "expected_cash" => $summary["expected_cash"],
                "status" => "closed",
                "closing_note" => $validated["closing_note"] ?? null,
            ]);

            $actualsByMethod = collect(
                $validated["payment_actuals"] ?? [],
            )->keyBy("payment_method_id");

            foreach ($summary["payment_breakdown"] as $item) {
                $actualAmount =
                    $actualsByMethod->get($item["payment_method_id"])[
                        "actual_amount"
                    ] ?? null;

                CashierShiftPayment::updateOrCreate(
                    [
                        "cashier_shift_id" => $cashierShift->id,
                        "payment_method_id" => $item["payment_method_id"],
                    ],
                    [
                        "system_amount" => $item["total"],
                        "actual_amount" =>
                            $actualAmount !== null ? $actualAmount : null,
                        "difference_amount" =>
                            $actualAmount !== null
                                ? $actualAmount - $item["total"]
                                : 0,
                    ],
                );
            }
        });

        ActivityLog::create([
            "store_id" => $cashierShift->store_id,
            "branch_id" => $cashierShift->branch_id,
            "user_id" => $request->user()->id,
            "log_name" => "shift",
            "description" =>
                "Menutup shift {$cashierShift->shift_no}. " .
                "Total penjualan: Rp " .
                number_format($summary["total_sales"], 0, ",", ".") .
                ", selisih kas: Rp " .
                number_format($cashierShift->cash_difference, 0, ",", "."),
            "subject_type" => CashierShift::class,
            "subject_id" => $cashierShift->id,
            "properties" => [
                "action" => "close",
                "actual_cash" => $validated["actual_cash"],
                "expected_cash" => $summary["expected_cash"],
                "cash_difference" =>
                    $validated["actual_cash"] - $summary["expected_cash"],
                "total_sales" => $summary["total_sales"],
            ],
        ]);

        return redirect()
            ->route("admin.cashier-shifts.show", $cashierShift)
            ->with("success", "Shift kasir berhasil ditutup.");
    }

    // ── Admin override: edit shift ───────────────────────────────────
    public function update(Request $request, CashierShift $cashierShift)
    {
        abort_unless($request->user()->isAdmin(), 403);
        [$storeId] = $this->storeScope();
        abort_unless($cashierShift->store_id === $storeId, 404);

        $validated = $request->validate([
            "opening_cash" => ["sometimes", "numeric", "min:0"],
            "actual_cash" => ["sometimes", "numeric", "min:0"],
            "opening_note" => ["nullable", "string", "max:1000"],
            "closing_note" => ["nullable", "string", "max:1000"],
        ]);

        $cashierShift->update($validated);

        // Recalculate expected cash if opening_cash changed
        if (array_key_exists("opening_cash", $validated)) {
            $summary = $this->calculateSummary($cashierShift);
            $cashierShift->update([
                "expected_cash" => $summary["expected_cash"],
            ]);
        }

        // Recalculate cash_difference if actual_cash changed
        if (
            array_key_exists("actual_cash", $validated) &&
            !$cashierShift->isOpen()
        ) {
            $cashierShift->update([
                "cash_difference" =>
                    $validated["actual_cash"] - $cashierShift->expected_cash,
            ]);
        }

        ActivityLog::create([
            "store_id" => $storeId,
            "branch_id" => $cashierShift->branch_id,
            "user_id" => $request->user()->id,
            "log_name" => "shift",
            "description" => "Admin mengedit shift {$cashierShift->shift_no}",
            "subject_type" => CashierShift::class,
            "subject_id" => $cashierShift->id,
            "properties" => [
                "action" => "edit",
                "changes" => $validated,
            ],
        ]);

        return redirect()
            ->route("admin.cashier-shifts.show", $cashierShift)
            ->with("success", "Shift berhasil diperbarui.");
    }

    // ── Admin override: delete shift ──────────────────────────────────
    public function destroy(Request $request, CashierShift $cashierShift)
    {
        abort_unless($request->user()->isAdmin(), 403);
        [$storeId] = $this->storeScope();
        abort_unless($cashierShift->store_id === $storeId, 404);

        $shiftNo = $cashierShift->shift_no;

        // Detach sales from this shift before deleting
        Sale::where("cashier_shift_id", $cashierShift->id)->update([
            "cashier_shift_id" => null,
        ]);

        $cashierShift->delete();

        ActivityLog::create([
            "store_id" => $storeId,
            "branch_id" => $cashierShift->branch_id,
            "user_id" => $request->user()->id,
            "log_name" => "shift",
            "description" => "Admin menghapus shift {$shiftNo}",
            "subject_type" => CashierShift::class,
            "subject_id" => null,
            "properties" => [
                "action" => "delete",
                "shift_no" => $shiftNo,
            ],
        ]);

        return redirect()
            ->route("admin.cashier-shifts.index")
            ->with("success", "Shift {$shiftNo} berhasil dihapus.");
    }

    // ── Admin override: reopen closed shift ───────────────────────────
    public function reopen(Request $request, CashierShift $cashierShift)
    {
        abort_unless($request->user()->isAdmin(), 403);
        [$storeId] = $this->storeScope();
        abort_unless($cashierShift->store_id === $storeId, 404);
        abort_unless(
            $cashierShift->status === "closed",
            422,
            "Hanya shift yang sudah ditutup yang bisa dibuka ulang.",
        );

        // Check if kasir already has an active shift
        $activeShift = $this->activeShift($storeId, $cashierShift->user_id);
        if ($activeShift) {
            return redirect()
                ->route("admin.cashier-shifts.show", $cashierShift)
                ->with(
                    "error",
                    "Kasir masih punya shift aktif (#{$activeShift->shift_no}). Tutup dulu sebelum membuka ulang shift ini.",
                );
        }

        $cashierShift->update([
            "closed_at" => null,
            "actual_cash" => null,
            "cash_difference" => 0,
            "status" => "open",
            "closing_note" => null,
        ]);

        ActivityLog::create([
            "store_id" => $storeId,
            "branch_id" => $cashierShift->branch_id,
            "user_id" => $request->user()->id,
            "log_name" => "shift",
            "description" => "Admin membuka ulang shift {$cashierShift->shift_no}",
            "subject_type" => CashierShift::class,
            "subject_id" => $cashierShift->id,
            "properties" => [
                "action" => "reopen",
            ],
        ]);

        return redirect()
            ->route("admin.cashier-shifts.show", $cashierShift)
            ->with(
                "success",
                "Shift {$cashierShift->shift_no} berhasil dibuka ulang.",
            );
    }

    private function activeShift(int $storeId, int $userId): ?CashierShift
    {
        return CashierShift::where("store_id", $storeId)
            ->where("user_id", $userId)
            ->where("status", "open")
            ->first();
    }

    private function authorizeShift(Request $request, CashierShift $shift): void
    {
        [$storeId] = $this->storeScope();

        if ($shift->store_id !== $storeId) {
            abort(404);
        }
        if (
            $request->user()->isKasir() &&
            $shift->user_id !== $request->user()->id
        ) {
            abort(403);
        }
    }

    private function nextShiftNo(int $storeId): string
    {
        $today = now()->format("Ymd");
        $count = CashierShift::where("store_id", $storeId)
            ->whereDate("created_at", today())
            ->count();

        return "SHF-" .
            $today .
            "-" .
            str_pad((string) ($count + 1), 3, "0", STR_PAD_LEFT);
    }

    private function calculateSummary(CashierShift $shift): array
    {
        $salesQuery = Sale::where("store_id", $shift->store_id)
            ->where("user_id", $shift->user_id)
            ->where("status", "completed")
            ->whereBetween("sale_date", [
                $shift->opened_at,
                $shift->closed_at ?? now(),
            ]);

        if ($shift->branch_id) {
            $salesQuery->where("branch_id", $shift->branch_id);
        }

        $totalSales = (float) $salesQuery->sum("grand_total");
        $totalRefunds = 0;

        $saleIds = $salesQuery->pluck("id");

        $paymentBreakdown = DB::table("sale_payments")
            ->join(
                "payment_methods",
                "sale_payments.payment_method_id",
                "=",
                "payment_methods.id",
            )
            ->whereIn("sale_payments.sale_id", $saleIds)
            ->select(
                "sale_payments.payment_method_id",
                "payment_methods.name as method_name",
                "payment_methods.type as method_type",
                DB::raw("SUM(sale_payments.amount) as total"),
            )
            ->groupBy(
                "sale_payments.payment_method_id",
                "payment_methods.name",
                "payment_methods.type",
            )
            ->orderByDesc("total")
            ->get()
            ->map(
                fn($row) => [
                    "payment_method_id" => $row->payment_method_id,
                    "method_name" => $row->method_name,
                    "method_type" => $row->method_type,
                    "total" => (float) $row->total,
                ],
            )
            ->toArray();

        $cashSales = collect($paymentBreakdown)
            ->where("method_type", "cash")
            ->sum("total");

        $expectedCash =
            (float) $shift->opening_cash + $cashSales - $totalRefunds;

        return [
            "total_sales" => $totalSales,
            "total_refunds" => $totalRefunds,
            "expected_cash" => $expectedCash,
            "cash_sales" => $cashSales,
            "payment_breakdown" => $paymentBreakdown,
        ];
    }
}
