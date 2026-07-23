<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Store;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StoreController extends Controller
{
    /**
     * List all stores (developer can see all).
     */
    public function index()
    {
        $stores = Store::withCount('branches')->withCount('users')->get();

        return Inertia::render('Admin/Stores/Index', [
            'stores' => $stores,
        ]);
    }

    /**
     * Show form to create a new store.
     */
    public function create()
    {
        return Inertia::render('Admin/Stores/Create');
    }

    /**
     * Store a newly created store.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'store_type_id' => 'required|exists:store_types,id',
            'address' => 'nullable|string|max:500',
            'phone' => 'nullable|string|max:20',
        ]);

        $store = Store::create($validated);

        // Auto-seed metode pembayaran wajib (Tunai + Hutang/Kasbon)
        $store->paymentMethods()->create([
            'code' => 'CASH_'.$store->id,
            'name' => 'Tunai',
            'type' => 'cash',
            'is_active' => true,
            'sort_order' => 0,
        ]);
        $store->paymentMethods()->create([
            'code' => 'DEBT_'.$store->id,
            'name' => 'Hutang / Kasbon',
            'type' => 'debt',
            'is_active' => true,
            'sort_order' => 1,
        ]);

        return redirect()
            ->route('admin.stores.index')
            ->with('success', 'Toko berhasil dibuat.');
    }

    /**
     * Edit a store.
     */
    public function edit(Store $store)
    {
        return Inertia::render('Admin/Stores/Edit', [
            'store' => $store,
        ]);
    }

    /**
     * Update a store.
     */
    public function update(Request $request, Store $store)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'store_type_id' => 'required|exists:store_types,id',
            'address' => 'nullable|string|max:500',
            'phone' => 'nullable|string|max:20',
        ]);

        $store->update($validated);

        return redirect()
            ->route('admin.stores.index')
            ->with('success', 'Toko berhasil diupdate.');
    }

    /**
     * Remove a store.
     */
    public function destroy(Store $store)
    {
        $store->delete();

        return redirect()
            ->route('admin.stores.index')
            ->with('success', 'Toko berhasil dihapus.');
    }
}
