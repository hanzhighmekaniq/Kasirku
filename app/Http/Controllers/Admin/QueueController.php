<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Queue;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class QueueController extends Controller
{
    public function index(Request $request): Response
    {
        $storeId = session('current_store_id');
        $branchId = session('current_branch_id');

        $queues = Queue::forStore($storeId)
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->today()
            ->with('servedBy:id,name')
            ->orderBy('queue_number')
            ->get();

        $stats = [
            'waiting' => $queues->where('status', 'waiting')->count(),
            'serving' => $queues->where('status', 'serving')->count(),
            'completed' => $queues->where('status', 'completed')->count(),
        ];

        return Inertia::render('Admin/Queue/Index', [
            'queues' => $queues->values(),
            'stats' => $stats,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $storeId = session('current_store_id');
        $branchId = session('current_branch_id');

        $validated = $request->validate([
            'customer_name' => ['nullable', 'string', 'max:100'],
            'customer_phone' => ['nullable', 'string', 'max:20'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        // Auto-increment queue number per store/branch per day
        $lastNumber = Queue::forStore($storeId)
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->today()
            ->max('queue_number') ?? 0;

        Queue::create([
            'store_id' => $storeId,
            'branch_id' => $branchId,
            'customer_name' => $validated['customer_name'] ?? null,
            'customer_phone' => $validated['customer_phone'] ?? null,
            'notes' => $validated['notes'] ?? null,
            'queue_number' => $lastNumber + 1,
            'status' => 'waiting',
        ]);

        return back()->with('success', 'Antrian berhasil ditambahkan.');
    }

    public function updateStatus(Request $request, Queue $queue): RedirectResponse
    {
        $storeId = session('current_store_id');

        if ($queue->store_id !== $storeId) {
            abort(403);
        }

        $validated = $request->validate([
            'status' => ['required', 'string', 'in:waiting,serving,completed,cancelled'],
        ]);

        $data = ['status' => $validated['status']];

        if ($validated['status'] === 'serving') {
            $data['served_by'] = Auth::id();
            $data['served_at'] = now();
        }

        $queue->update($data);

        $statusLabels = [
            'waiting' => 'menunggu',
            'serving' => 'dilayani',
            'completed' => 'selesai',
            'cancelled' => 'dibatalkan',
        ];

        return back()->with(
            'success',
            "Antrian #{$queue->queue_number} status diubah menjadi {$statusLabels[$validated['status']]}.",
        );
    }

    public function destroy(Queue $queue): RedirectResponse
    {
        $storeId = session('current_store_id');

        if ($queue->store_id !== $storeId) {
            abort(403);
        }

        $number = $queue->queue_number;
        $queue->delete();

        return back()->with('success', "Antrian #{$number} berhasil dihapus.");
    }
}
