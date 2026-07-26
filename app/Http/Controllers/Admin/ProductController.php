<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductModifierGroup;
use App\Models\StockMovement;
use App\Models\Store;
use App\Models\Supplier;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
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
        $branchId = session('current_branch_id');
        $store = Store::with('storeType')->find($storeId);

        $query = Product::forStore($storeId)
            ->with([
                'category',
                'supplier',
                'stocks' => fn ($q) => $branchId
                    ? $q->where('branch_id', $branchId)
                    : $q,
                'variants.stocks' => fn ($q) => $branchId
                    ? $q->where('branch_id', $branchId)
                    : $q,
                'variants.packagingUnits',
                'variants.priceTiers',
                'packagingUnits' => fn ($q) => $q->whereNull('variant_id'),
                'priceTiers' => fn ($q) => $q->whereNull('variant_id'),
            ])
            // Untuk badge FnB "Resep" & "Modifier" di Index
            ->withCount(['recipes', 'modifierGroups']);

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

        // Sorting
        $sort = $request->get('sort', 'name');
        $direction = $request->get('direction', 'asc');
        $allowed = ['name', 'sku', 'sell_price', 'created_at', 'is_active'];
        if ($sort === 'stock') {
            $branchClause = $branchId ? 'AND product_stocks.branch_id = '.(int) $branchId : '';
            $query->orderByRaw(
                "(SELECT COALESCE(SUM(quantity) - SUM(reserved_quantity), 0)
                    FROM product_stocks
                    WHERE product_stocks.product_id = products.id
                        AND product_stocks.variant_id IS NULL
                        {$branchClause})
                    ".($direction === 'asc' ? 'ASC' : 'DESC'),
            );
        } elseif (in_array($sort, $allowed)) {
            $query->orderBy($sort, $direction === 'asc' ? 'asc' : 'desc');
        } else {
            $query->orderBy('name', 'asc');
        }

        $paginated = $query->paginate(20)->withQueryString();

        // Map stock ke collection yang sudah dipaginate
        // Hanya hitung base product stock (variant_id IS NULL) agar tidak double-count
        $paginated->getCollection()->transform(function ($product) {
            $product->stock =
                $product->stocks->whereNull('variant_id')->sum('quantity') -
                $product->stocks->whereNull('variant_id')->sum('reserved_quantity');

            return $product;
        });

        // Stats (full count, bukan dari paginated)
        $stats = [
            'total' => Product::forStore($storeId)->count(),
            'active' => Product::forStore($storeId)->where('is_active', true)->count(),
            'inactive' => Product::forStore($storeId)->where('is_active', false)->count(),
        ];

        // Low stock — filter branch jika ada
        $branchFilter = $branchId
            ? 'AND product_stocks.branch_id = '.(int) $branchId
            : '';
        $stats['lowStock'] = Product::forStore($storeId)
            ->where('track_stock', true)
            ->whereRaw(
                "products.id IN (
                    SELECT product_id FROM product_stocks
                    WHERE variant_id IS NULL
                        AND quantity - reserved_quantity <= products.stock_minimum
                        {$branchFilter}
                )",
            )
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
            'filters' => (object) $request->only(['search', 'type', 'category', 'status', 'sort', 'direction']),
            'currentBranch' => $branchId
                ? Branch::find($branchId, ['id', 'name'])
                : null,
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
            // --- FnB ---
            // Tab "Resep" (finished_goods / combo)
            'recipes.rawMaterial:id,name,sku,unit,base_unit,base_unit_conversion,cost_price',
            // Tab "Modifier" (finished_goods / combo)
            'modifierGroups' => fn ($q) => $q->orderBy('sort_order'),
            'modifierGroups.modifiers',
            // Tab "Dipakai di Resep" (raw_material)
            'usedInRecipes.product:id,name,sku,type',
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

        $storeId = session('current_store_id');
        $store = Store::with('storeType')->find($storeId);

        return Inertia::render('Admin/Products/Show', [
            'product' => $product,
            'totalStock' => $totalStock,
            'reserved' => $totalReserved,
            'batchStats' => $batchStats,
            'margin' => $margin,
            'profitRp' => $profitRp,
            'stockMovements' => $stockMovements,
            'bucketMargins' => $this->buildBucketMargins($product),
            'storeType' => $store?->getRelation('storeType')?->code ?? 'retail',
            // FnB: total HPP dari resep, dihitung dengan konversi satuan
            'recipeHpp' => $this->calculateRecipeHpp($product),
        ]);
    }

    /**
     * Total HPP satu produk jadi berdasarkan resepnya.
     * Modal tiap bahan dihitung per satuan pakai (base_unit) supaya
     * qty resep (mis. 150 gram) dikalikan modal yang benar.
     */
    private function calculateRecipeHpp(Product $product): float
    {
        if (! $product->relationLoaded('recipes')) {
            return 0.0;
        }

        return (float) $product->recipes->reduce(function ($carry, $recipe) {
            $material = $recipe->rawMaterial;

            if (! $material) {
                return $carry;
            }

            return $carry + $material->costPerBaseUnit() * (float) $recipe->quantity;
        }, 0.0);
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
            'modifierGroups' => $this->modifierGroupOptions($storeId),
        ]);
    }

    /**
     * Pilihan modifier group untuk form produk (FnB).
     */
    /**
     * Kode store type toko yang sedang aktif (retail, fnb, service, …).
     * Dipakai untuk aturan validasi yang hanya berlaku di mode tertentu.
     */
    private function currentStoreTypeCode(): string
    {
        return Store::with('storeType')
            ->find(session('current_store_id'))
            ?->getRelation('storeType')
            ?->code ?? 'retail';
    }

    /**
     * Aturan wajib yang hanya berlaku untuk kombinasi store type + tipe
     * produk tertentu, jadi tidak bisa ditaruh di rule array biasa.
     *
     * Bahan baku FnB wajib punya Satuan Pakai: tanpa itu konversi HPP resep
     * jatuh ke cost_price mentah tanpa konversi satuan, dan hasilnya salah.
     * Di store type lain field ini memang tidak dirender, jadi tidak dipaksa.
     *
     * @throws ValidationException
     */
    private function validateFnbProductRules(array $validated): void
    {
        if ($this->currentStoreTypeCode() !== 'fnb') {
            return;
        }

        if (($validated['type'] ?? null) !== 'raw_material') {
            return;
        }

        if (trim((string) ($validated['base_unit'] ?? '')) === '') {
            throw ValidationException::withMessages([
                'base_unit' => 'Satuan Pakai wajib diisi untuk Bahan Baku.',
            ]);
        }
    }

    private function modifierGroupOptions(?int $storeId)
    {
        if (! $storeId) {
            return collect();
        }

        return ProductModifierGroup::forStore($storeId)
            ->where('is_active', true)
            ->withCount('modifiers')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'name', 'is_required', 'selection_type']);
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
            'base_unit' => 'nullable|string|max:30',
            'base_unit_conversion' => 'nullable|numeric|min:0.0001',
            'sell_price' => 'nullable|numeric|min:0',
            'cost_price' => 'nullable|numeric|min:0',
            'price_per_hour' => 'nullable|numeric|min:0',
            'min_duration_minutes' => 'nullable|integer|min:0',
            'stock_minimum' => 'nullable|integer|min:0',
            'track_stock' => 'boolean',
            'is_sellable' => 'boolean',
            'preparation_time' => 'nullable|integer|min:0',
            'is_active' => 'boolean',
            'sell_base' => 'boolean',
            'image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
            'modifier_group_ids' => 'nullable|array',
            'modifier_group_ids.*' => 'exists:product_modifier_groups,id',
            'sync_modifier_groups' => 'boolean',
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

        $this->validateFnbProductRules($validated);

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('products', 'public');
        }

        $syncModifiers = $request->boolean('sync_modifier_groups');

        DB::transaction(function () use ($validated, $imagePath, $syncModifiers) {
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
                // Kolom NOT NULL DEFAULT 'pcs'. Default kolom tidak menolong
                // saat null dikirim eksplisit — MySQL tetap menolak — jadi
                // fallback-nya di sini, sama seperti pola field 'unit' di atas.
                'base_unit' => $validated['base_unit'] ?? 'pcs',
                'base_unit_conversion' => $validated['base_unit_conversion'] ?? null,
                'is_variant' => false,
                'sell_price' => $validated['sell_price'] ?? 0,
                'cost_price' => $validated['cost_price'] ?? 0,
                'price_per_hour' => $validated['price_per_hour'] ?? null,
                'min_duration_minutes' => $validated['min_duration_minutes'] ?? null,
                'stock_minimum' => $validated['stock_minimum'] ?? 0,
                'track_stock' => $validated['track_stock'] ?? true,
                'is_sellable' => $validated['is_sellable'] ?? true,
                // is_composable TIDAK diset dari request — dikelola otomatis
                // oleh Product::syncIsComposable() berdasarkan ada tidaknya resep.
                'preparation_time' => $validated['preparation_time'] ?? null,
                'is_active' => $validated['is_active'] ?? true,
                'sell_base' => $validated['sell_base'] ?? true,
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

            // FnB: modifier / topping groups.
            // Hanya disentuh kalau form memang merender section Modifier
            // (flag sync_modifier_groups). Tanpa guard ini, update produk
            // dari store non-FnB akan melepas semua group yang sudah attached,
            // karena array kosong hilang saat request dikirim sebagai multipart.
            if ($syncModifiers) {
                $product->modifierGroups()->sync($validated['modifier_group_ids'] ?? []);
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
            'modifierGroups' => $this->modifierGroupOptions($storeId),
            // ID modifier group yang sudah attached — untuk prefill checkbox
            'attachedModifierGroupIds' => $product
                ->modifierGroups()
                ->pluck('product_modifier_groups.id'),
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
            'base_unit' => 'nullable|string|max:30',
            'base_unit_conversion' => 'nullable|numeric|min:0.0001',
            'sell_price' => 'nullable|numeric|min:0',
            'cost_price' => 'nullable|numeric|min:0',
            'price_per_hour' => 'nullable|numeric|min:0',
            'min_duration_minutes' => 'nullable|integer|min:0',
            'stock_minimum' => 'nullable|integer|min:0',
            'track_stock' => 'boolean',
            'is_sellable' => 'boolean',
            'preparation_time' => 'nullable|integer|min:0',
            'is_active' => 'boolean',
            'sell_base' => 'boolean',
            'image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
            'remove_image' => 'boolean',
            'modifier_group_ids' => 'nullable|array',
            'modifier_group_ids.*' => 'exists:product_modifier_groups,id',
            'sync_modifier_groups' => 'boolean',
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

        $this->validateFnbProductRules($validated);

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

        $syncModifiers = $request->boolean('sync_modifier_groups');

        DB::transaction(function () use ($validated, $imagePath, $product, $syncModifiers) {
            $product->update([
                'name' => $validated['name'],
                'description' => $validated['description'] ?? null,
                'sku' => $validated['sku'],
                'barcode' => $validated['barcode'] ?? null,
                'type' => $validated['type'],
                'category_id' => $validated['category_id'] ?? null,
                'supplier_id' => $validated['supplier_id'] ?? null,
                'unit' => $validated['unit'] ?? 'pcs',
                // Kolom NOT NULL DEFAULT 'pcs'. Default kolom tidak menolong
                // saat null dikirim eksplisit — MySQL tetap menolak — jadi
                // fallback-nya di sini, sama seperti pola field 'unit' di atas.
                'base_unit' => $validated['base_unit'] ?? 'pcs',
                'base_unit_conversion' => $validated['base_unit_conversion'] ?? null,
                'sell_price' => $validated['sell_price'] ?? 0,
                'cost_price' => $validated['cost_price'] ?? 0,
                'price_per_hour' => $validated['price_per_hour'] ?? null,
                'min_duration_minutes' => $validated['min_duration_minutes'] ?? null,
                'stock_minimum' => $validated['stock_minimum'] ?? 0,
                'track_stock' => $validated['track_stock'] ?? true,
                'is_sellable' => $validated['is_sellable'] ?? true,
                // is_composable TIDAK diset dari request — dikelola otomatis
                // oleh Product::syncIsComposable() berdasarkan ada tidaknya resep.
                'preparation_time' => $validated['preparation_time'] ?? null,
                'is_active' => $validated['is_active'] ?? true,
                'sell_base' => $validated['sell_base'] ?? true,
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

            // FnB: modifier / topping groups.
            // Hanya disentuh kalau form memang merender section Modifier
            // (flag sync_modifier_groups). Tanpa guard ini, update produk
            // dari store non-FnB akan melepas semua group yang sudah attached,
            // karena array kosong hilang saat request dikirim sebagai multipart.
            if ($syncModifiers) {
                $product->modifierGroups()->sync($validated['modifier_group_ids'] ?? []);
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
