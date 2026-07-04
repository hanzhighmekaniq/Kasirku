<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Concerns\HasStoreScope;
use App\Models\EmployeeCommission;
use App\Models\Employee;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EmployeeCommissionController extends Controller
{
    use HasStoreScope;

    public function index(Request $request)
    {
        [$storeId] = $this->storeScope();

        $query = EmployeeCommission::with([
            'employee:id,name,position',
            'sale:id,sale_no,sale_date',
        ])
        ->where('store_id', $storeId)
        ->latest('commission_date');

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter by employee
        if ($request->filled('employee_id')) {
            $query->where('employee_id', $request->employee_id);
        }

        // Filter by date range
        if ($request->filled('from')) {
            $query->whereDate('commission_date', '>=', $request->from);
        }
        if ($request->filled('to')) {
            $query->whereDate('commission_date', '<=', $request->to);
        }

        // Summary stats
        $stats = EmployeeCommission::where('store_id', $storeId)
            ->selectRaw('
                SUM(commission_amount) as total_all,
                SUM(CASE WHEN status = "pending" THEN commission_amount ELSE 0 END) as total_pending,
                SUM(CASE WHEN status = "approved" THEN commission_amount ELSE 0 END) as total_approved,
                SUM(CASE WHEN status = "paid" THEN commission_amount ELSE 0 END) as total_paid
            ')
            ->first();

        $employees = Employee::where('store_id', $storeId)
            ->where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name', 'position']);

        return Inertia::render('Admin/EmployeeCommissions/Index', [
            'commissions' => $query->paginate(20)->withQueryString(),
            'employees'   => $employees,
            'stats'       => $stats,
            'filters'     => $request->only(['status', 'employee_id', 'from', 'to']),
            'canApprove'  => $request->user()->can('commission.approve'),
        ]);
    }

    public function updateStatus(Request $request, EmployeeCommission $commission)
    {
        abort_unless($request->user()->can('commission.approve'), 403);
        [$storeId] = $this->storeScope();
        abort_if($commission->store_id !== $storeId, 404);

        $validated = $request->validate([
            'status' => ['required', 'in:pending,approved,paid,cancelled'],
        ]);

        $commission->update(['status' => $validated['status']]);

        return back()->with('success', 'Status komisi berhasil diperbarui.');
    }
}
