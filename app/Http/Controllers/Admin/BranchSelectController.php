<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class BranchSelectController extends Controller
{
    /**
     * Show branch selection page.
     */
    public function selectForm()
    {
        $user = Auth::user();

        $storeId = session('current_store_id');
        $store   = $storeId ? \App\Models\Store::find($storeId) : $user->stores()->first();

        if (!$store) {
            return redirect()->route('admin.store.select');
        }

        $branches = $store->branches()
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'code', 'name', 'phone', 'address']);

        // If only 1 branch, auto-select and redirect
        if ($branches->count() === 1) {
            $branch = $branches->first();
            session([
                'branch_id'         => $branch->id,
                'current_branch_id' => $branch->id,
            ]);
            $intended = session('url.intended', route('admin.dashboard'));
            session()->forget('url.intended');
            return redirect($intended);
        }

        if ($branches->isEmpty()) {
            return redirect()->route('admin.dashboard');
        }

        return Inertia::render('Admin/SelectBranch', [
            'branches'  => $branches,
            'storeName' => $store->name,
            'intended'  => session('url.intended', route('admin.dashboard')),
        ]);
    }

    /**
     * Set selected branch in session.
     */
    public function select(Request $request)
    {
        $validated = $request->validate([
            'branch_id' => 'required|exists:branches,id',
        ]);

        $user    = Auth::user();
        $storeId = session('current_store_id');
        $store   = $storeId ? \App\Models\Store::find($storeId) : $user->stores()->first();

        if (!$store) {
            return redirect()->route('admin.dashboard');
        }

        // Verify branch belongs to current store and is active
        $branch = $store->branches()
            ->where('id', $validated['branch_id'])
            ->where('is_active', true)
            ->first();

        if (!$branch) {
            return back()->withErrors(['branch_id' => 'Cabang tidak valid atau tidak aktif.']);
        }

        session([
            'branch_id'         => $branch->id,
            'current_branch_id' => $branch->id,
        ]);

        $intended = session('url.intended', route('admin.dashboard'));
        session()->forget('url.intended');

        return redirect($intended);
    }

    /**
     * Switch branch (from header dropdown).
     */
    public function switch(Request $request)
    {
        $validated = $request->validate([
            'branch_id' => 'required|exists:branches,id',
        ]);

        $user    = Auth::user();
        $storeId = session('current_store_id');
        $store   = $storeId ? \App\Models\Store::find($storeId) : $user->stores()->first();

        if (!$store) {
            return redirect()->route('admin.dashboard');
        }

        $branch = $store->branches()
            ->where('id', $validated['branch_id'])
            ->where('is_active', true)
            ->first();

        if (!$branch) {
            return back()->with('error', 'Cabang tidak valid.');
        }

        session([
            'branch_id'         => $branch->id,
            'current_branch_id' => $branch->id,
        ]);

        return back()->with('success', "Beralih ke cabang: {$branch->name}");
    }
}
