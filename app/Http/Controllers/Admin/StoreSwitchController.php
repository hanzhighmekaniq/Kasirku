<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Store;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class StoreSwitchController extends Controller
{
    /**
     * Tampilkan halaman pilih toko (admin multi-store).
     */
    public function selectForm()
    {
        /** @var User|null $user */
        $user = Auth::user();
        $stores = $user
            ->stores()
            ->with([
                'branches' => fn ($q) => $q->where('is_active', true),
                'storeType',
            ])
            ->get();

        // Kalau hanya 1 toko, auto-set dan redirect
        if ($stores->count() === 1) {
            $this->setStore($user, $stores->first(), request());

            return redirect()->route('admin.branch.select');
        }

        if ($stores->isEmpty()) {
            Auth::logout();

            return redirect()
                ->route('login')
                ->with('error', 'Akun belum terhubung ke toko manapun.');
        }

        return Inertia::render('Admin/SelectStore', [
            'stores' => $stores->map(
                fn ($s) => [
                    'id' => $s->id,
                    'code' => $s->code,
                    'name' => $s->name,
                    'store_type' => $s->getRelation('storeType')?->code,
                    'branches_count' => $s->branches->count(),
                ],
            ),
        ]);
    }

    /**
     * Set toko aktif ke session.
     */
    public function select(Request $request)
    {
        $validated = $request->validate([
            'store_id' => 'required|exists:stores,id',
        ]);

        $user = Auth::user();
        /** @var User|null $user */
        // Pastikan user punya akses ke store ini
        $store = $user->stores()->find($validated['store_id']);

        if (! $store) {
            return back()->withErrors([
                'store_id' => 'Toko tidak valid atau tidak memiliki akses.',
            ]);
        }

        $this->setStore($user, $store, $request);

        // Cek jumlah cabang aktif
        $branchCount = $store->branches()->where('is_active', true)->count();

        if ($branchCount === 1) {
            // Hanya 1 cabang → auto-pick
            $branch = $store->branches()->where('is_active', true)->first();
            $request->session()->put('current_branch_id', $branch->id);
        } elseif ($branchCount > 1) {
            // Banyak cabang → suruh pilih
            $request->session()->forget(['current_branch_id', 'branch_id']);

            return redirect()
                ->route('admin.branch.select')
                ->with(
                    'success',
                    "Beralih ke toko: {$store->name}. Silakan pilih cabang.",
                );
        } else {
            // Tidak ada cabang
            $request->session()->forget(['current_branch_id', 'branch_id']);
        }

        return redirect()
            ->route('admin.dashboard')
            ->with('success', "Beralih ke toko: {$store->name}");
    }

    /**
     * Switch toko dari sidebar (WorkspaceSwitcher).
     * Hanya owner/manager yang boleh switch toko.
     *
     * Cabang langsung di-auto-pick (cabang pertama yang aktif) tanpa
     * redirect ke halaman "Pilih Cabang" terpisah — user bisa ganti
     * cabang kapan saja lewat seksi Cabang di WorkspaceSwitcher yang sama.
     */
    public function switch(Request $request)
    {
        $user = Auth::user();
        /** @var User|null $user */
        // Karyawan biasa tidak boleh switch toko
        if (! $user->canSwitchBranch()) {
            return back()->with(
                'error',
                'Kamu tidak memiliki akses untuk mengganti toko.',
            );
        }

        $validated = $request->validate([
            'store_id' => 'required|exists:stores,id',
        ]);

        $store = $user->stores()->find($validated['store_id']);

        if (! $store) {
            return back()->with('error', 'Toko tidak valid.');
        }

        $this->setStore($user, $store, $request);

        // Auto-pick cabang aktif pertama (kalau ada) — tidak ada halaman perantara
        $branch = $store
            ->branches()
            ->where('is_active', true)
            ->orderBy('id')
            ->first();

        if ($branch) {
            $request->session()->put('current_branch_id', $branch->id);
            $request->session()->put('branch_id', $branch->id);
        } else {
            $request->session()->forget(['current_branch_id', 'branch_id']);
        }

        return redirect()
            ->route('admin.dashboard')
            ->with('success', "Beralih ke toko: {$store->name}");
    }

    // ── Helper ────────────────────────────────────────

    private function setStore($user, Store $store, $request): void
    {
        $request->session()->put('current_store_id', $store->id);
    }
}
