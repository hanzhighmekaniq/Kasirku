<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use App\Models\StockMovement;
use App\Models\Store;
use App\Models\Supplier;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ProductController extends Controller
{
    const PRODUCT_TYPES = [
        'finished_goods' => 'Barang Jadi',
        'raw_material' => 'Bahan Baku',
        'combo' => 'Combo / Paket',
        'service' => 'Jasa / Layanan',
        'rental_item' => 'Item Rental',
        'time_based' => 'Berbasis Waktu',
    ];

    public function index(Request $request)
    {
        $storeId = session('current_store_id');
        $store = Store::with('storeType')->find($storeId);

        $query = Product::forStore($storeId)
            ->with(['category', 'supplier', 'stocks']);

        // Server-side search
        if ($request->filled('search')) {
            $q = $request->search;
            $query->where(function ($sq) use ($q) {
                $sq->where('name', 'like', "%{$q}%")
                    ->orWhere('sku', 'like', "%{$q}%")
                    ->orWhere('barcode', 'like', "%{$q}%");
            });
        }

        // Filter by type
        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        // Filter by category
        if ($request->filled('category')) {
            $query->where('category_id', $request->category);
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('is_active', $request->status === '1');
        }

        $paginated = $query->paginate(20)->withQueryString();

        // Map stock ke collection yang sudah dipaginate
        $paginated->getCollection()->transform(function ($product) {
            $product->stock =
                $product->stocks->sum('quantity') -
                $product->stocks->sum('reserved_quantity');

            return $product;
        });

        // Stats (full count, bukan dari paginated)
        $stats = [
            'total' => Product::forStore($storeId)->count(),
            'active' => Product::forStore($storeId)->where('is_active', true)->count(),
            'inactive' => Product::forStore($storeId)->where('is_active', false)->count(),
        ];
        $stats['lowStock'] = Product::forStore($storeId)
            ->where('track_stock', true)
            ->whereRaw('products.id IN (SELECT product_id FROM product_stocks WHERE quantity - reserved_quantity <= products.stock_minimum)')
            ->count();

        // Build category hierarchy for filter
        $allCategories = Category::forStore($storeId)
            ->orderBy('name')
            ->get(['id', 'name', 'description', 'parent_id']);
        $catMap = $allCategories->keyBy('id');
        $allCategories = $allCategories
            ->map(function ($cat) use ($catMap) {
                $depth = 0;
                $currentId = $cat->parent_id;
                while ($currentId && isset($catMap[$currentId])) {
                    $depth++;
                    $currentId = $catMap[$currentId]->parent_id;
                }
                $cat->depth = $depth;
                $parts = [$cat->name];
                $currentId = $cat->parent_id;
                while ($currentId && isset($catMap[$currentId])) {
                    array_unshift($parts, $catMap[$currentId]->name);
                    $currentId = $catMap[$currentId]->parent_id;
                }
                $cat->display_path = implode(' > ', $parts);

                return $cat;
            })
            ->sortBy('display_path')
            ->values();

        return Inertia::render('Admin/Products/Index', [
            'products' => $paginated,
            'allCategories' => $allCategories,
            'storeType' => $store?->getRelation('storeType')?->code ?? 'retail',
            'stats' => $stats,
            'filters' => $request->only(['search', 'type', 'category', 'status']),
        ]);
    }

    public function show(Product $product)
    {
        $product->load([
            'category',
            'supplier',
            'variants',
            'stocks.branch',
            'batches' => fn ($q) => $q
                ->orderBy('expiry_date')
                ->orderByDesc('purchase_date')
                ->limit(10),
        ]);

        $totalStock =
            $product->stocks->sum('quantity') -
            $product->stocks->sum('reserved_quantity');
        $totalReserved = $product->stocks->sum('reserved_quantity');

        // Expiry stats dari batch
        $today = Carbon::today();
        $batchStats = [
            'total' => $product->batches->count(),
            'expired' => $product->batches
                ->filter(
                    fn ($b) => $b->expiry_date && $b->expiry_date->lt($today),
                )
                ->count(),
            'expiring_soon' => $product->batches
                ->filter(
                    fn ($b) => $b->expiry_date &&
                        $b->expiry_date->gte($today) &&
                        $b->expiry_date->lte($today->copy()->addDays(30)),
                )
                ->count(),
        ];

        // Recent stock movements (last 10)
        $stockMovements = StockMovement::where(
            'product_id',
            $product->id,
        )
            ->orderByDesc('moved_at')
            ->limit(10)
            ->get();

        // Margin
        $margin =
            $product->sell_price > 0
                ? round(
                    (($product->sell_price - $product->cost_price) /
                        $product->sell_price) *
                        100,
                    1,
                )
                : 0;
        $profitRp = $product->sell_price - $product->cost_price;

        return Inertia::render('Admin/Products/Show', [
            'product' => $product,
            'totalStock' => $totalStock,
            'reserved' => $totalReserved,
            'batchStats' => $batchStats,
            'margin' => $margin,
            'profitRp' => $profitRp,
            'stockMovements' => $stockMovements,
        ]);
    }

    public function create()
    {
        $storeId = session('current_store_id');
        $store = Store::with('storeType')->find($storeId);

        // Build category hierarchy
        $allCategories = Category::forStore($storeId)
            ->orderBy('name')
            ->get(['id', 'name', 'description', 'parent_id']);
        $catMap = $allCategories->keyBy('id');
        $categories = $allCategories
            ->map(function ($cat) use ($catMap) {
                $depth = 0;
                $currentId = $cat->parent_id;
                while ($currentId && isset($catMap[$currentId])) {
                    $depth++;
                    $currentId = $catMap[$currentId]->parent_id;
                }
                $cat->depth = $depth;
                $parts = [$cat->name];
                $currentId = $cat->parent_id;
                while ($currentId && isset($catMap[$currentId])) {
                    array_unshift($parts, $catMap[$currentId]->name);
                    $currentId = $catMap[$currentId]->parent_id;
                }
                $cat->display_path = implode(' > ', $parts);

                return $cat;
            })
            ->sortBy('display_path')
            ->values();

        return Inertia::render('Admin/Products/Create', [
            'categories' => $categories,
            'suppliers' => Supplier::where('store_id', $storeId)
                ->orderBy('name')
                ->get(),
            'productTypes' => self::PRODUCT_TYPES,
            'storeType' => $store?->getRelation('storeType')?->code ?? 'retail',
            'generatedSku' => Product::generateSku($storeId),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:2000',
            'sku' => 'required|string|max:100|unique:products,sku',
            'barcode' => 'nullable|string|max:100|unique:products,barcode',
            'type' => 'required|in:finished_goods,raw_material,combo,service,rental_item,time_based',
            'category_id' => 'nullable|exists:categories,id',
            'supplier_id' => 'nullable|exists:suppliers,id',
            'unit' => 'nullable|string|max:30',
            'is_variant' => 'boolean',
            'sell_price' => 'nullable|numeric|min:0',
            'cost_price' => 'nullable|numeric|min:0',
            'price_per_hour' => 'nullable|numeric|min:0',
            'min_duration_minutes' => 'nullable|integer|min:0',
            'stock_minimum' => 'nullable|integer|min:0',
            'track_stock' => 'boolean',
            'is_sellable' => 'boolean',
            'is_composable' => 'boolean',
            'preparation_time' => 'nullable|integer|min:0',
            'is_active' => 'boolean',
            'image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
            // per-type fields
            'capacity' => 'nullable|integer|min:1',
            'max_guests' => 'nullable|integer|min:1',
            'valid_duration_minutes' => 'nullable|integer|min:0',
            'session_duration_minutes' => 'nullable|integer|min:0',
            'deposit_amount' => 'nullable|numeric|min:0',
            // product-level packaging units (is_variant = false)
            'packaging_units' => 'nullable|array',
            'packaging_units.*.name' => 'required|string|max:50',
            'packaging_units.*.conversion_qty' => 'required|integer|min:1',
            'packaging_units.*.sell_price' => 'nullable|numeric|min:0',
            'packaging_units.*.barcode' => 'nullable|string|max:100',
            // product-level price tiers (is_variant = false)
            'price_tiers' => 'nullable|array',
            'price_tiers.*.min_qty' => 'required|integer|min:1',
            'price_tiers.*.price' => 'required|numeric|min:0',
            // variants (is_variant = true)
            'variants' => 'nullable|array',
            'variants.*.name' => 'required|string|max:100',
            'variants.*.sku' => 'required|string|max:100|unique:product_variants,sku',
            'variants.*.price' => 'required|numeric|min:0',
            'variants.*.cost_price' => 'nullable|numeric|min:0',
            'variants.*.barcode' => 'nullable|string|max:100',
            'variants.*.price_tiers' => 'nullable|array',
            'variants.*.price_tiers.*.min_qty' => 'required|integer|min:1',
            'variants.*.price_tiers.*.price' => 'required|numeric|min:0',
            'variants.*.packaging_units' => 'nullable|array',
            'variants.*.packaging_units.*.name' => 'required|string|max:50',
            'variants.*.packaging_units.*.conversion_qty' => 'required|integer|min:1',
            'variants.*.packaging_units.*.sell_price' => 'nullable|numeric|min:0',
            'variants.*.packaging_units.*.barcode' => 'nullable|string|max:100',
        ]);

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('products', 'public');
        }

        $isVariant = (bool) ($validated['is_variant'] ?? false);

        DB::transaction(function () use ($validated, $imagePath, $isVariant) {
            $product = Product::create([
                'store_id' => session('current_store_id'),
                'name' => $validated['name'],
                'description' => $validated['description'] ?? null,
                'sku' => $validated['sku'],
                'barcode' => $validated['barcode'] ?? null,
                'type' => $validated['type'],
                'category_id' => $validated['category_id'] ?? null,
                'supplier_id' => $validated['supplier_id'] ?? null,
                'unit' => $validated['unit'] ?? 'pcs',
                'is_variant' => $isVariant,
                'sell_price' => $isVariant ? 0 : ($validated['sell_price'] ?? 0),
                'cost_price' => $validated['cost_price'] ?? 0,
                'price_per_hour' => $validated['price_per_hour'] ?? null,
                'min_duration_minutes' => $validated['min_duration_minutes'] ?? null,
                'stock_minimum' => $validated['stock_minimum'] ?? 0,
                'track_stock' => $validated['track_stock'] ?? true,
                'is_sellable' => $validated['is_sellable'] ?? true,
                'is_composable' => $validated['is_composable'] ?? false,
                'preparation_time' => $validated['preparation_time'] ?? null,
                'is_active' => $validated['is_active'] ?? true,
                'image' => $imagePath,
                'capacity' => $validated['capacity'] ?? null,
                'max_guests' => $validated['max_guests'] ?? null,
                'valid_duration_minutes' => $validated['valid_duration_minutes'] ?? null,
                'session_duration_minutes' => $validated['session_duration_minutes'] ?? null,
                'deposit_amount' => $validated['deposit_amount'] ?? null,
            ]);

            if ($isVariant && ! empty($validated['variants'])) {
                // Produk variant: simpan per-variant data
                foreach ($validated['variants'] as $vData) {
                    $variant = $product->variants()->create([
                        'name' => $vData['name'],
                        'sku' => $vData['sku'],
                        'price' => $vData['price'],
                        'cost_price' => $vData['cost_price'] ?? 0,
                        'barcode' => $vData['barcode'] ?? null,
                        'is_active' => true,
                    ]);

                    foreach ($vData['price_tiers'] ?? [] as $tier) {
                        $product->priceTiers()->create([
                            'variant_id' => $variant->id,
                            'min_qty' => $tier['min_qty'],
                            'price' => $tier['price'],
                        ]);
                    }

                    foreach ($vData['packaging_units'] ?? [] as $pu) {
                        $product->packagingUnits()->create([
                            'variant_id' => $variant->id,
                            'name' => $pu['name'],
                            'conversion_qty' => $pu['conversion_qty'],
                            'sell_price' => $pu['sell_price'] ?? 0,
                            'barcode' => $pu['barcode'] ?? null,
                        ]);
                    }
                }
            } else {
                // Produk non-variant: simpan product-level data
                foreach ($validated['packaging_units'] ?? [] as $pu) {
                    $product->packagingUnits()->create([
                        'name' => $pu['name'],
                        'conversion_qty' => $pu['conversion_qty'],
                        'sell_price' => $pu['sell_price'] ?? 0,
                        'barcode' => $pu['barcode'] ?? null,
                    ]);
                }

                foreach ($validated['price_tiers'] ?? [] as $tier) {
                    $product->priceTiers()->create([
                        'min_qty' => $tier['min_qty'],
                        'price' => $tier['price'],
                    ]);
                }
            }
        });

        return redirect()
            ->route('admin.products.index')
            ->with('success', 'Produk berhasil ditambahkan.');
    }

    public function edit(Product $product)
    {
        $storeId = session('current_store_id');
        $store = Store::with('storeType')->find($storeId);

        // Build category hierarchy
        $allCategories = Category::forStore($storeId)
            ->orderBy('name')
            ->get(['id', 'name', 'description', 'parent_id']);
        $catMap = $allCategories->keyBy('id');
        $categories = $allCategories
            ->map(function ($cat) use ($catMap) {
                $depth = 0;
                $currentId = $cat->parent_id;
                while ($currentId && isset($catMap[$currentId])) {
                    $depth++;
                    $currentId = $catMap[$currentId]->parent_id;
                }
                $cat->depth = $depth;
                $parts = [$cat->name];
                $currentId = $cat->parent_id;
                while ($currentId && isset($catMap[$currentId])) {
                    array_unshift($parts, $catMap[$currentId]->name);
                    $currentId = $catMap[$currentId]->parent_id;
                }
                $cat->display_path = implode(' > ', $parts);

                return $cat;
            })
            ->sortBy('display_path')
            ->values();

        $product->load('packagingUnits', 'priceTiers', 'variants.priceTiers', 'variants.packagingUnits');

        return Inertia::render('Admin/Products/Edit', [
            'product' => $product,
            'categories' => $categories,
            'suppliers' => Supplier::where('store_id', $storeId)
                ->orderBy('name')
                ->get(),
            'productTypes' => self::PRODUCT_TYPES,
            'storeType' => $store?->getRelation('storeType')?->code ?? 'retail',
        ]);
    }

    public function update(Request $request, Product $product)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:2000',
            'sku' => 'required|string|max:100|unique:products,sku,'.$product->id,
            'barcode' => 'nullable|string|max:100|unique:products,barcode,'.
                $product->id,
            'type' => 'required|in:finished_goods,raw_material,combo,service,rental_item,time_based',
            'category_id' => 'nullable|exists:categories,id',
            'supplier_id' => 'nullable|exists:suppliers,id',
            'unit' => 'nullable|string|max:30',
            'is_variant' => 'boolean',
            'sell_price' => 'nullable|numeric|min:0',
            'cost_price' => 'nullable|numeric|min:0',
            'price_per_hour' => 'nullable|numeric|min:0',
            'min_duration_minutes' => 'nullable|integer|min:0',
            'stock_minimum' => 'nullable|integer|min:0',
            'track_stock' => 'boolean',
            'is_sellable' => 'boolean',
            'is_composable' => 'boolean',
            'preparation_time' => 'nullable|integer|min:0',
            'is_active' => 'boolean',
            'image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
            'remove_image' => 'boolean',
            // per-type fields
            'capacity' => 'nullable|integer|min:1',
            'max_guests' => 'nullable|integer|min:1',
            'valid_duration_minutes' => 'nullable|integer|min:0',
            'session_duration_minutes' => 'nullable|integer|min:0',
            'deposit_amount' => 'nullable|numeric|min:0',
            // product-level packaging units (is_variant = false)
            'packaging_units' => 'nullable|array',
            'packaging_units.*.name' => 'required|string|max:50',
            'packaging_units.*.conversion_qty' => 'required|integer|min:1',
            'packaging_units.*.sell_price' => 'nullable|numeric|min:0',
            'packaging_units.*.barcode' => 'nullable|string|max:100',
            // product-level price tiers (is_variant = false)
            'price_tiers' => 'nullable|array',
            'price_tiers.*.min_qty' => 'required|integer|min:1',
            'price_tiers.*.price' => 'required|numeric|min:0',
            // variants (is_variant = true)
            'variants' => 'nullable|array',
            'variants.*.name' => 'required|string|max:100',
            'variants.*.sku' => 'required|string|max:100',
            'variants.*.price' => 'required|numeric|min:0',
            'variants.*.cost_price' => 'nullable|numeric|min:0',
            'variants.*.barcode' => 'nullable|string|max:100',
            'variants.*.price_tiers' => 'nullable|array',
            'variants.*.price_tiers.*.min_qty' => 'required|integer|min:1',
            'variants.*.price_tiers.*.price' => 'required|numeric|min:0',
            'variants.*.packaging_units' => 'nullable|array',
            'variants.*.packaging_units.*.name' => 'required|string|max:50',
            'variants.*.packaging_units.*.conversion_qty' => 'required|integer|min:1',
            'variants.*.packaging_units.*.sell_price' => 'nullable|numeric|min:0',
            'variants.*.packaging_units.*.barcode' => 'nullable|string|max:100',
        ]);

        // Handle gambar
        $imagePath = $product->image;

        if ($request->boolean('remove_image')) {
            if ($product->image) {
                Storage::disk('public')->delete($product->image);
            }
            $imagePath = null;
        }

        if ($request->hasFile('image')) {
            if ($product->image) {
                Storage::disk('public')->delete($product->image);
            }
            $imagePath = $request->file('image')->store('products', 'public');
        }

        $isVariant = (bool) ($validated['is_variant'] ?? false);

        DB::transaction(function () use ($validated, $imagePath, $product, $isVariant) {
            $product->update([
                'name' => $validated['name'],
                'description' => $validated['description'] ?? null,
                'sku' => $validated['sku'],
                'barcode' => $validated['barcode'] ?? null,
                'type' => $validated['type'],
                'category_id' => $validated['category_id'] ?? null,
                'supplier_id' => $validated['supplier_id'] ?? null,
                'unit' => $validated['unit'] ?? 'pcs',
                'is_variant' => $isVariant,
                'sell_price' => $isVariant ? 0 : ($validated['sell_price'] ?? 0),
                'cost_price' => $validated['cost_price'] ?? 0,
                'price_per_hour' => $validated['price_per_hour'] ?? null,
                'min_duration_minutes' => $validated['min_duration_minutes'] ?? null,
                'stock_minimum' => $validated['stock_minimum'] ?? 0,
                'track_stock' => $validated['track_stock'] ?? true,
                'is_sellable' => $validated['is_sellable'] ?? true,
                'is_composable' => $validated['is_composable'] ?? false,
                'preparation_time' => $validated['preparation_time'] ?? null,
                'is_active' => $validated['is_active'] ?? true,
                'image' => $imagePath,
                'capacity' => $validated['capacity'] ?? null,
                'max_guests' => $validated['max_guests'] ?? null,
                'valid_duration_minutes' => $validated['valid_duration_minutes'] ?? null,
                'session_duration_minutes' => $validated['session_duration_minutes'] ?? null,
                'deposit_amount' => $validated['deposit_amount'] ?? null,
            ]);

            if ($isVariant) {
                // Hapus semua data product-level, rebuild dari variants input
                $product->packagingUnits()->whereNull('variant_id')->delete();
                $product->priceTiers()->whereNull('variant_id')->delete();
                $product->variants()->delete(); // cascade deletes variant-scoped tiers+units

                foreach ($validated['variants'] ?? [] as $vData) {
                    $variant = $product->variants()->create([
                        'name' => $vData['name'],
                        'sku' => $vData['sku'],
                        'price' => $vData['price'],
                        'cost_price' => $vData['cost_price'] ?? 0,
                        'barcode' => $vData['barcode'] ?? null,
                        'is_active' => true,
                    ]);

                    foreach ($vData['price_tiers'] ?? [] as $tier) {
                        $product->priceTiers()->create([
                            'variant_id' => $variant->id,
                            'min_qty' => $tier['min_qty'],
                            'price' => $tier['price'],
                        ]);
                    }

                    foreach ($vData['packaging_units'] ?? [] as $pu) {
                        $product->packagingUnits()->create([
                            'variant_id' => $variant->id,
                            'name' => $pu['name'],
                            'conversion_qty' => $pu['conversion_qty'],
                            'sell_price' => $pu['sell_price'] ?? 0,
                            'barcode' => $pu['barcode'] ?? null,
                        ]);
                    }
                }
            } else {
                // Non-variant: hapus semua variant data, rebuild product-level
                $product->variants()->delete();
                $product->packagingUnits()->delete();
                $product->priceTiers()->delete();

                foreach ($validated['packaging_units'] ?? [] as $pu) {
                    $product->packagingUnits()->create([
                        'name' => $pu['name'],
                        'conversion_qty' => $pu['conversion_qty'],
                        'sell_price' => $pu['sell_price'] ?? 0,
                        'barcode' => $pu['barcode'] ?? null,
                    ]);
                }

                foreach ($validated['price_tiers'] ?? [] as $tier) {
                    $product->priceTiers()->create([
                        'min_qty' => $tier['min_qty'],
                        'price' => $tier['price'],
                    ]);
                }
            }
        });

        return redirect()
            ->route('admin.products.index')
            ->with('success', 'Produk berhasil diperbarui.');
    }

    public function destroy(Product $product)
    {
        $product->delete();

        return redirect()
            ->route('admin.products.index')
            ->with('success', 'Produk berhasil dihapus.');
    }
}
