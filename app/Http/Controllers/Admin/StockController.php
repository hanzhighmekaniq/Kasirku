<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Concerns\HasStoreScope;
use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductStock;
use App\Models\StockMovement;
use App\Models\Store;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StockController extends Controller
{
    use HasStoreScope;

    public function index()
    {
        [$storeId, $branchId] = $this->storeScope();

        $query = ProductStock::with(['product', 'store'])->where(
            'store_id',
            $storeId,
        );
        $stocks = $query->get();

        $totalProducts = $stocks->unique('product_id')->count();
        $lowStock = 0;
        $outOfStock = 0;

        foreach ($stocks as $s) {
            $qty = $s->quantity - $s->reserved_quantity;
            $product = $s->product;
            if ($qty <= 0) {
                $outOfStock++;
            } elseif (
                $product &&
                $product->track_stock &&
                $qty <= $product->stock_minimum
            ) {
                $lowStock++;
            }
        }

        // Gunakan average_cost per bucket, bukan product.cost_price
        $totalValue = 0;
        foreach ($stocks as $s) {
            $avgCost = $s->average_cost ?? $s->product->cost_price ?? 0;
            $totalValue += $s->quantity * $avgCost;
        }

        $stats = [
            'total_products' => $totalProducts,
            'low_stock' => $lowStock,
            'out_of_stock' => $outOfStock,
            'total_items' => $stocks->sum('quantity'),
            'total_value' => $totalValue,
        ];

        return Inertia::render('Admin/Stock/Index', [
            'stocks' => $stocks,
            'stats' => $stats,
            'storeType' => Store::with('storeType')
                ->find($storeId)
                ?->getRelation('storeType')?->code ?? 'retail',
        ]);
    }

    public function movements(Request $request)
    {
        [$storeId, $branchId] = $this->storeScope();

        $query = StockMovement::with(['product', 'branch'])
            ->where('store_id', $storeId)
            ->latest('moved_at');
        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        if ($request->filled('product_id')) {
            $query->where('product_id', $request->product_id);
        }
        if ($request->filled('movement_type')) {
            $query->where('movement_type', $request->movement_type);
        }
        if ($request->filled('from_date')) {
            $query->where('moved_at', '>=', $request->from_date);
        }
        if ($request->filled('to_date')) {
            $query->where('moved_at', '<=', $request->to_date.' 23:59:59');
        }

        $movements = $query->paginate(50)->withQueryString();

        return Inertia::render('Admin/Stock/Movements', [
            'movements' => $movements,
            'products' => Product::forStore($storeId)
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name', 'sku']),
        ]);
    }
}
