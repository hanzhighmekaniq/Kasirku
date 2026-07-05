<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ActivityLogController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        // Hanya user dengan setting.view yang bisa akses log aktivitas
        abort_unless($user->can('setting.view'), 403);

        $storeId = $user->currentStore()?->id;
        $branchId = $user->currentBranch()?->id;

        $query = ActivityLog::with([
            "user:id,name,role",
            "store:id,name,code",
            "branch:id,name,code",
        ])->latest();

        // Scope to current store
        if ($storeId) {
            $query->where("store_id", $storeId);
        }

        // Filter by log_name
        if ($request->filled("log_name")) {
            $query->where("log_name", $request->log_name);
        }

        // Filter by user_id
        if ($request->filled("user_id")) {
            $query->where("user_id", $request->user_id);
        }

        // Filter by branch_id
        if ($request->filled("branch_id")) {
            $query->where("branch_id", $request->branch_id);
        }

        // Date range filter
        if ($request->filled("date_from")) {
            $query->whereDate("created_at", ">=", $request->date_from);
        }
        if ($request->filled("date_to")) {
            $query->whereDate("created_at", "<=", $request->date_to);
        }

        $logs = $query->paginate(50)->withQueryString();

        // Get unique log names for filter dropdown (scoped to store)
        $logNamesQuery = ActivityLog::distinct();
        if ($storeId) {
            $logNamesQuery->where("store_id", $storeId);
        }
        $logNames = $logNamesQuery->pluck("log_name")->filter()->values();

        // Get users who have activity logs (scoped to store)
        $userIdsQuery = ActivityLog::distinct();
        if ($storeId) {
            $userIdsQuery->where("store_id", $storeId);
        }
        $userIds = $userIdsQuery->pluck("user_id")->filter();
        $users = User::whereIn("id", $userIds)->get(["id", "name"]);

        // Get branches for filter (scoped to store)
        $branches = [];
        if ($storeId) {
            $branches = \App\Models\Branch::where("store_id", $storeId)
                ->orderBy("name")
                ->get(["id", "name"]);
        }

        return Inertia::render("Admin/ActivityLogs/Index", [
            "logs" => $logs,
            "logNames" => $logNames,
            "users" => $users,
            "branches" => $branches,
            "filters" => $request->only([
                "log_name",
                "user_id",
                "branch_id",
                "date_from",
                "date_to",
            ]),
            "currentBranch" => $branchId
                ? \App\Models\Branch::find($branchId)?->only(["id", "name"])
                : null,
        ]);
    }
}
