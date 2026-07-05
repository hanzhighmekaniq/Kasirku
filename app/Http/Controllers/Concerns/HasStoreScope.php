<?php

namespace App\Http\Controllers\Concerns;

use Illuminate\Support\Facades\Auth;

/**
 * Provides consistent store + branch scope resolution.
 *
 * Usage in controllers:
 *   use HasStoreScope;
 *
 *   // In a method:
 *   [$storeId, $branchId] = $this->storeScope();
 *   $q->where('store_id', $storeId)->where('branch_id', $branchId);
 */
trait HasStoreScope
{
    /**
     * Resolve current store + branch IDs from session / user.
     *
     * @return array{int, int|null}  [$storeId, $branchId]
     */
    protected function storeScope(): array
    {
        $user     = Auth::user();
        $storeId  = session('current_store_id') ?? $user->stores()->get()->first()?->id;
        // User tanpa sale.void (kasir) selalu terkunci ke branch-nya sendiri
        $branchId = session('current_branch_id')
                    ?? session('branch_id')
                    ?? (!$user->can('sale.void') ? $user->branch_id : null);

        return [(int) $storeId, $branchId ? (int) $branchId : null];
    }

    /**
     * Apply store + optional branch scope to a query.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @param  string  $storeCol
     * @param  string  $branchCol
     */
    protected function applyScope($query, string $storeCol = 'store_id', string $branchCol = 'branch_id'): void
    {
        [$storeId, $branchId] = $this->storeScope();
        $query->where($storeCol, $storeId);
        if ($branchId) {
            $query->where($branchCol, $branchId);
        }
    }
}
