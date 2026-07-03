<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Branch;
use App\Models\Customer;
use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class BookingController extends Controller
{
    public function index(Request $request)
    {
        $storeId = session('current_store_id');
        $branchId = session('current_branch_id');

        $query = Booking::with(['customer:id,name', 'employee:id,name', 'branch:id,name'])
            ->where('store_id', $storeId)
            ->latest('booking_start_at');

        if ($branchId) $query->where('branch_id', $branchId);
        if ($request->filled('status')) $query->where('status', $request->status);

        return Inertia::render('Admin/Bookings/Index', [
            'bookings'    => $query->paginate(15)->withQueryString(),
            'filters'     => $request->only('status'),
            'customers'   => Customer::where('store_id', $storeId)->orderBy('name')->get(['id', 'name']),
            'employees'   => Employee::where('store_id', $storeId)->where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'branches'    => Branch::where('store_id', $storeId)->where('is_active', true)->get(['id', 'name']),
        ]);
    }

    public function store(Request $request)
    {
        $storeId = session('current_store_id');
        $validated = $request->validate([
            'customer_id'      => 'nullable|exists:customers,id',
            'employee_id'      => 'nullable|exists:employees,id',
            'resource_type'    => 'nullable|string|max:30',
            'resource_id'      => 'nullable|integer',
            'customer_name'    => 'required|string|max:200',
            'customer_phone'   => 'nullable|string|max:30',
            'booking_start_at' => 'required|date',
            'booking_end_at'   => 'nullable|date|after:booking_start_at',
            'guest_count'      => 'nullable|integer|min:1',
            'deposit_amount'   => 'nullable|numeric|min:0',
            'deposit_paid'     => 'nullable|numeric|min:0',
            'status'           => 'required|in:pending,confirmed,checked_in',
            'notes'            => 'nullable|string|max:500',
        ]);

        $prefix = 'BK-' . now()->format('Ymd') . '-';
        $last = Booking::where('booking_no', 'like', $prefix . '%')->orderByDesc('booking_no')->first();
        $seq = $last ? (int) substr($last->booking_no, -3) + 1 : 1;
        $bookingNo = $prefix . str_pad($seq, 3, '0', STR_PAD_LEFT);

        Booking::create([
            'store_id'         => $storeId,
            'branch_id'        => session('current_branch_id'),
            'customer_id'      => $validated['customer_id'] ?? null,
            'employee_id'      => $validated['employee_id'] ?? null,
            'resource_type'    => $validated['resource_type'] ?? null,
            'resource_id'      => $validated['resource_id'] ?? null,
            'customer_name'    => $validated['customer_name'],
            'customer_phone'   => $validated['customer_phone'] ?? null,
            'booking_start_at' => $validated['booking_start_at'],
            'booking_end_at'   => $validated['booking_end_at'] ?? null,
            'guest_count'      => $validated['guest_count'] ?? null,
            'deposit_amount'   => $validated['deposit_amount'] ?? 0,
            'deposit_paid'     => $validated['deposit_paid'] ?? 0,
            'status'           => $validated['status'],
            'notes'            => $validated['notes'] ?? null,
            'booking_no'       => $bookingNo,
        ]);

        return back()->with('success', "Booking #{$bookingNo} berhasil dibuat.");
    }

    public function update(Request $request, Booking $booking)
    {
        $validated = $request->validate([
            'customer_id'      => 'nullable|exists:customers,id',
            'employee_id'      => 'nullable|exists:employees,id',
            'customer_name'    => 'required|string|max:200',
            'customer_phone'   => 'nullable|string|max:30',
            'booking_start_at' => 'required|date',
            'booking_end_at'   => 'nullable|date|after:booking_start_at',
            'guest_count'      => 'nullable|integer|min:1',
            'deposit_amount'   => 'nullable|numeric|min:0',
            'deposit_paid'     => 'nullable|numeric|min:0',
            'status'           => 'required|in:pending,confirmed,checked_in,completed,cancelled,no_show',
            'notes'            => 'nullable|string|max:500',
        ]);

        $booking->update($validated);
        return back()->with('success', "Booking #{$booking->booking_no} berhasil diperbarui.");
    }

    public function destroy(Booking $booking)
    {
        $booking->delete();
        return back()->with('success', 'Booking berhasil dihapus.');
    }
}
