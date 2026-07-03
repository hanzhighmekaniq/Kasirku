<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class SupplierController extends Controller
{
    public function index(Request $request)
    {
        $storeId = session('current_store_id');
        abort_unless($storeId, 403);

        $suppliers = Supplier::where('store_id', $storeId)
            ->withCount(['products', 'purchases'])
            ->withSum('purchases', 'grand_total')
            ->orderBy('name')
            ->get();

        $stats = [
            'total' => $suppliers->count(),
            'total_products' => $suppliers->sum('products_count'),
            'total_purchases' => $suppliers->sum('purchases_count'),
            'total_purchase_value' => (float) $suppliers->sum('purchases_sum_grand_total'),
        ];

        return Inertia::render('Admin/Suppliers/Index', [
            'suppliers' => $suppliers,
            'stats' => $stats,
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Suppliers/Create');
    }

    public function store(Request $request)
    {
        $storeId = session('current_store_id');
        abort_unless($storeId, 403);

        $validated = $request->validate([
            'name'           => 'required|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'phone'          => 'nullable|string|max:30',
            'email'          => ['nullable', 'email', Rule::unique('suppliers', 'email')->where('store_id', $storeId)],
            'address'        => 'nullable|string',
        ]);

        $validated['store_id'] = $storeId;
        $validated['code']     = $this->nextCode($storeId);

        Supplier::create($validated);

        return redirect()->route('admin.suppliers.index')->with('success', 'Supplier berhasil ditambahkan.');
    }

    public function show(Supplier $supplier)
    {
        $this->ensureSameStore($supplier);

        $supplier->loadCount(['products', 'purchases']);
        $supplier->loadSum('purchases', 'grand_total');
        $supplier->loadSum('purchases', 'paid_amount');

        $recentPurchases = $supplier->purchases()
            ->with('user:id,name')
            ->latest('purchase_date')
            ->limit(20)
            ->get();

        $products = $supplier->products()
            ->select('id', 'name', 'sku', 'cost_price', 'sell_price', 'track_stock', 'unit')
            ->withCount('stocks')
            ->withSum('stocks', 'quantity')
            ->orderBy('name')
            ->get();

        // Purchase stats by status
        $purchaseStats = $supplier->purchases()
            ->select('status', DB::raw('count(*) as total'), DB::raw('sum(grand_total) as total_value'))
            ->groupBy('status')
            ->get()
            ->keyBy('status');

        return Inertia::render('Admin/Suppliers/Show', [
            'supplier' => $supplier,
            'recentPurchases' => $recentPurchases,
            'products' => $products,
            'purchaseStats' => $purchaseStats,
        ]);
    }

    public function edit(Supplier $supplier)
    {
        $this->ensureSameStore($supplier);

        return Inertia::render('Admin/Suppliers/Edit', ['supplier' => $supplier]);
    }

    public function update(Request $request, Supplier $supplier)
    {
        $this->ensureSameStore($supplier);

        $storeId = session('current_store_id');

        $validated = $request->validate([
            'name'           => 'required|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'phone'          => 'nullable|string|max:30',
            'email'          => ['nullable', 'email', Rule::unique('suppliers', 'email')->ignore($supplier->id)->where('store_id', $storeId)],
            'address'        => 'nullable|string',
        ]);

        $supplier->update($validated);

        return redirect()->route('admin.suppliers.index')->with('success', 'Supplier berhasil diupdate.');
    }

    public function destroy(Supplier $supplier)
    {
        $this->ensureSameStore($supplier);

        // Check if supplier has purchases
        if ($supplier->purchases()->exists()) {
            return back()->withErrors(['supplier' => 'Supplier tidak dapat dihapus karena masih memiliki data pembelian.']);
        }

        $supplier->delete();
        return redirect()->route('admin.suppliers.index')->with('success', 'Supplier berhasil dihapus.');
    }

    // ── Helpers ──────────────────────────────────────────

    private function ensureSameStore(Supplier $supplier): void
    {
        abort_if($supplier->store_id !== (int) session('current_store_id'), 403);
    }

    private function nextCode(int $storeId): string
    {
        $last = Supplier::where('store_id', $storeId)
            ->orderByDesc('id')
            ->value('code');

        if ($last && preg_match('/(\d+)$/', $last, $m)) {
            return 'SUP' . str_pad((int) $m[1] + 1, 4, '0', STR_PAD_LEFT);
        }

        return 'SUP0001';
    }
}
