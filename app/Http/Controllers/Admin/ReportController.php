<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\SalePayment;
use App\Models\Purchase;
use App\Models\Expense;
use App\Models\Store;
use App\Models\Branch;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\User;
class ReportController extends Controller
{
    public function index(Request $request)
    {
        /** @var User|null $user */
        $user = Auth::user();

        if (!$user) {
            abort(401, "Unauthenticated.");
        }

        $storeId = session("current_store_id") ?? $user->stores()->first()?->id;

        // ── Date range ──────────────────────────────────────
        $from = $request->start_date
            ? Carbon::parse($request->start_date)->startOfDay()
            : Carbon::now()->startOfMonth();

        $to = $request->end_date
            ? Carbon::parse($request->end_date)->endOfDay()
            : Carbon::now()->endOfDay();

        // ── Branch filter ───────────────────────────────────
        $canViewAll = $user->can("sale.void");

        $branchIds = null;

        if (!$canViewAll) {
            $branchIds = [$user->branch_id];
        } elseif ($request->filled("branch_ids")) {
            $branchIds = (array) $request->input("branch_ids");
        }

        // lanjutkan kode yang sudah ada...
    }
}
