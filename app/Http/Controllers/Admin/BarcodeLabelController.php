<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BarcodeLabelController extends Controller
{
    public function index(Request $request)
    {
        $storeId = session('current_store_id');

        $products = Product::where('store_id', $storeId)
            ->where('is_active', true)
            ->with('category:id,name')
            ->orderBy('name')
            ->get(['id', 'name', 'sku', 'barcode', 'sell_price', 'category_id']);

        return Inertia::render('Admin/BarcodeLabels/Index', [
            'products' => $products,
        ]);
    }
}
