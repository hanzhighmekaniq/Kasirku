<?php

namespace App\Http\Middleware;

use App\Models\Branch;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Pastikan user punya branch aktif di session.
 * Developer di-skip.
 * Kasir: branch dari employee record (wajib ada).
 * Owner/role lain:
 *   - Single branch → auto-set
 *   - Multi branch → auto-set branch PERTAMA (bisa ganti dari topbar)
 *   - Tanpa branch → biarkan (store tanpa cabang)
 */
class BranchMiddleware
{
    /** Route names yang boleh diakses tanpa branch dipilih */
    private const BRANCH_EXEMPT_ROUTES = [
        'admin.branch.select',
        'admin.branch.select.post',
        'admin.branch.switch',
        'admin.store.select',
        'admin.store.select.post',
        'admin.store.switch',
        'admin.dashboard',
        'admin.profile.edit',
        'admin.profile.update',
        'admin.profile.destroy',
        'admin.activity-logs.index',
        'sidebar-order',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return redirect()->route('login');
        }

        // Developer skip
        if ($user->isDeveloper()) {
            return $next($request);
        }

        $storeId  = $request->session()->get('current_store_id');
        $branchId = $request->session()->get('current_branch_id')
                 ?? $request->session()->get('branch_id');

        // ── Kasir (tanpa sale.void): branch dari employee record ──
        if (!$user->can('sale.void') && !$branchId) {
            $empBranch = $user->employee?->branch_id;
            if (!$empBranch) {
                return redirect()
                    ->route('admin.dashboard')
                    ->with('error', 'Akun kamu belum ditugaskan ke cabang.');
            }
            $branchId = $empBranch;
            $request->session()->put('current_branch_id', $branchId);
            $request->session()->put('branch_id', $branchId);
            return $next($request);
        }

        // ── Validasi branch masih milik store aktif ───────────────────
        if ($branchId && $storeId) {
            $valid = Branch::where('id', $branchId)
                ->where('store_id', $storeId)
                ->where('is_active', true)
                ->exists();

            if (!$valid) {
                $request->session()->forget(['current_branch_id', 'branch_id']);
                $branchId = null;
            }
        }

        // ── Auto-set branch ──────────────────────────────────────────
        if ($storeId && !$branchId) {
            $branches = Branch::where('store_id', $storeId)
                ->where('is_active', true)
                ->orderBy('id')
                ->get(['id']);

            if ($branches->count() >= 1) {
                // Auto-set branch pertama — user bisa ganti dari topbar
                $branchId = $branches->first()->id;
                $request->session()->put('current_branch_id', $branchId);
                $request->session()->put('branch_id', $branchId);
            }
            // count = 0 → store tanpa cabang, biarkan null
        }

        return $next($request);
    }
}
