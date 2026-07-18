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
            ->with([
                'category',
                'supplier',
                'stocks',
                'variants.stocks',
                'variants.packagingUnits',
                'variants.priceTiers',
                'packagingUnits' => fn ($q) => $q->whereNull('variant_id'),
                'priceTiers' => fn ($q) => $q->whereNull('variant_id'),
            ]);

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
            'variants.priceTiers',
            'variants.packagingUnits',
            'packagingUnits' => fn ($q) => $q->whereNull('variant_id'),
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
            'bucketMargins' => $this->buildBucketMargins($product),
        ]);
    }

    /**
     * Breakdown margin per stock bucket (product + variant + packaging_unit)
     * memakai average_cost bucket masing-masing sebagai modal — bukan lagi
     * Product::cost_price global, supaya margin Pcs vs Dus atau antar
     * variant tidak saling mencampur.
     *
     * @return array<int, array{
     *     label: string,
     *     variant_id: int|null,
     *     packaging_unit_id: int|null,
     *     sell_price: float,
     *     average_cost: float,
     *     margin_rp: float,
     *     margin_percent: float,
     *     quantity: float,
     * }>
     */
    private function buildBucketMargins(Product $product): array
    {
        $bucketSellPrice = function (?int $variantId, ?int $packagingUnitId) use ($product) {
            if ($packagingUnitId) {
                $unit = $variantId
                    ? $product->variants
                        ->firstWhere('id', $variantId)
                        ?->packagingUnits
                        ->firstWhere('id', $packagingUnitId)
                    : $product->packagingUnits->firstWhere('id', $packagingUnitId);

                return (float) ($unit?->sell_price ?? 0);
            }

            if ($variantId) {
                return (float) ($product->variants->firstWhere('id', $variantId)?->price ?? 0);
            }

            return (float) $product->sell_price;
        };

        $bucketLabel = function (?int $variantId, ?int $packagingUnitId) use ($product) {
            $variant = $variantId ? $product->variants->firstWhere('id', $variantId) : null;
            $unit = null;
            if ($packagingUnitId) {
                $unit = $variant
                    ? $variant->packagingUnits->firstWhere('id', $packagingUnitId)
                    : $product->packagingUnits->firstWhere('id', $packagingUnitId);
            }

            $parts = array_filter([$variant?->name, $unit?->name]);

            return $parts ? implode(' - ', $parts) : ($product->unit ?: 'Pcs');
        };

        return $product->stocks
            ->groupBy(fn ($s) => ($s->variant_id ?? 0).'-'.($s->packaging_unit_id ?? 0))
            ->map(function ($group) use ($bucketSellPrice, $bucketLabel) {
                $first = $group->first();
                $variantId = $first->variant_id;
                $packagingUnitId = $first->packaging_unit_id;

                $sellPrice = $bucketSellPrice($variantId, $packagingUnitId);
                $averageCost = (float) $group->avg('average_cost');
                $quantity = (float) $group->sum('quantity');
                $marginRp = $sellPrice - $averageCost;
                $marginPercent = $sellPrice > 0
                    ? round(($marginRp / $sellPrice) * 100, 1)
                    : 0;

                return [
                    'label' => $bucketLabel($variantId, $packagingUnitId),
                    'variant_id' => $variantId,
                    'packaging_unit_id' => $packagingUnitId,
                    'sell_price' => $sellPrice,
                    'average_cost' => $averageCost,
                    'margin_rp' => $marginRp,
                    'margin_percent' => $marginPercent,
                    'quantity' => $quantity,
                ];
            })
            ->values()
            ->toArray();
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
            'capacity' => 'nullable|integer|min:1',
            'max_guests' => 'nullable|integer|min:1',
            'valid_duration_minutes' => 'nullable|integer|min:0',
            'session_duration_minutes' => 'nullable|integer|min:0',
            'deposit_amount' => 'nullable|numeric|min:0',
            'packaging_units' => 'nullable|array',
            'packaging_units.*.name' => 'required|string|max:50',
            'packaging_units.*.conversion_qty' => 'required|integer|min:1',
            'packaging_units.*.sell_price' => 'nullable|numeric|min:0',
            'packaging_units.*.barcode' => 'nullable|string|max:100',
            'price_tiers' => 'nullable|array',
            'price_tiers.*.min_qty' => 'required|integer|min:1',
            'price_tiers.*.price' => 'required|numeric|min:0',
        ]);

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('products', 'public');
        }

        DB::transaction(function () use ($validated, $imagePath) {
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
                'is_variant' => false,
                'sell_price' => $validated['sell_price'] ?? 0,
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
            'capacity' => 'nullable|integer|min:1',
            'max_guests' => 'nullable|integer|min:1',
            'valid_duration_minutes' => 'nullable|integer|min:0',
            'session_duration_minutes' => 'nullable|integer|min:0',
            'deposit_amount' => 'nullable|numeric|min:0',
            'packaging_units' => 'nullable|array',
            'packaging_units.*.name' => 'required|string|max:50',
            'packaging_units.*.conversion_qty' => 'required|integer|min:1',
            'packaging_units.*.sell_price' => 'nullable|numeric|min:0',
            'packaging_units.*.barcode' => 'nullable|string|max:100',
            'price_tiers' => 'nullable|array',
            'price_tiers.*.min_qty' => 'required|integer|min:1',
            'price_tiers.*.price' => 'required|numeric|min:0',
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

        DB::transaction(function () use ($validated, $imagePath, $product) {
            $product->update([
                'name' => $validated['name'],
                'description' => $validated['description'] ?? null,
                'sku' => $validated['sku'],
                'barcode' => $validated['barcode'] ?? null,
                'type' => $validated['type'],
                'category_id' => $validated['category_id'] ?? null,
                'supplier_id' => $validated['supplier_id'] ?? null,
                'unit' => $validated['unit'] ?? 'pcs',
                'sell_price' => $validated['sell_price'] ?? 0,
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

            // Rebuild product-level packaging_units & price_tiers
            $product->packagingUnits()->whereNull('variant_id')->delete();
            $product->priceTiers()->whereNull('variant_id')->delete();

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
