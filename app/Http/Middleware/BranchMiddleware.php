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
 *   - Multi branch → redirect ke select-branch jika belum pilih
 *     (kecuali sudah di halaman select-branch itu sendiri)
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

        // ── Kasir: branch wajib dari employee record ──────────────────
        if ($user->isKasir() && !$branchId) {
            $empBranch = $user->employee?->branch_id;
            if (!$empBranch) {
                return redirect()
                    ->route('admin.dashboard')
                    ->with('error', 'Akun kasir belum ditugaskan ke cabang.');
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

        // ── Owner/role lain: resolve branch ───────────────────────────
        if ($storeId && !$branchId) {
            $branches = Branch::where('store_id', $storeId)
                ->where('is_active', true)
                ->get(['id']);

            if ($branches->count() === 1) {
                // Satu cabang → auto-set
                $branchId = $branches->first()->id;
                $request->session()->put('current_branch_id', $branchId);
                $request->session()->put('branch_id', $branchId);
            } elseif ($branches->count() > 1) {
                // Multi-branch & belum pilih — redirect ke select-branch
                // kecuali sedang di route yang exempt
                $currentRoute = $request->route()?->getName() ?? '';
                $isExempt     = in_array($currentRoute, self::BRANCH_EXEMPT_ROUTES, true)
                    || str_starts_with($currentRoute, 'admin.branch.')
                    || str_starts_with($currentRoute, 'admin.store.');

                if (!$isExempt) {
                    // Simpan intended URL supaya balik ke sini setelah pilih cabang
                    $request->session()->put('url.intended', $request->url());

                    return redirect()->route('admin.branch.select');
                }
                // Kalau exempt → biarkan branchId null, halaman tersebut
                // tidak butuh branch spesifik
            }
            // count = 0 → store tanpa cabang, biarkan null
        }

        return $next($request);
    }
}
