<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Concerns\HasStoreScope;
use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Product;
use App\Models\ProductBatch;
use App\Models\SaleItem;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ProductBatchController extends Controller
{
    use HasStoreScope;

    public function index(Request $request)
    {
        [$storeId, $branchId] = $this->storeScope();

        $batches = ProductBatch::with(['product:id,name,sku', 'branch:id,name', 'variant:id,name', 'packagingUnit:id,name'])
            ->where('store_id', $storeId)
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->when(
                $request->product_id,
                fn ($q) => $q->where('product_id', $request->product_id),
            )
            ->when($request->status, function ($q) use ($request) {
                $today = Carbon::today();
                match ($request->status) {
                    'expired' => $q
                        ->whereNotNull('expiry_date')
                        ->where('expiry_date', '<', $today),
                    'expiring_soon' => $q
                        ->whereNotNull('expiry_date')
                        ->where('expiry_date', '>=', $today)
                        ->where(
                            'expiry_date',
                            '<=',
                            $today->copy()->addDays(30),
                        ),
                    'active' => $q->where(
                        fn ($s) => $s
                            ->whereNull('expiry_date')
                            ->orWhere(
                                'expiry_date',
                                '>',
                                $today->copy()->addDays(30),
                            ),
                    ),
                    default => null,
                };
            })
            ->orderByRaw('expiry_date IS NULL ASC, expiry_date ASC')
            ->orderByDesc('purchase_date')
            ->get()
            ->map(
                fn ($b) => array_merge($b->toArray(), [
                    'expiry_status' => $b->expiry_status,
                    'days_until_expiry' => $b->days_until_expiry,
                ]),
            );

        $products = Product::forStore($storeId)
            ->where('is_active', true)
            ->with(['variants:id,product_id,name', 'packagingUnits:id,product_id,variant_id,name'])
            ->select('id', 'name', 'sku', 'is_variant')
            ->orderBy('name')
            ->get();

        return Inertia::render('Admin/ProductBatches/Index', [
            'batches' => $batches,
            'products' => $products,
            'filters' => $request->only('product_id', 'status'),
        ]);
    }

    public function create()
    {
        [$storeId, $branchId] = $this->storeScope();

        return Inertia::render('Admin/ProductBatches/Create', [
            'products' => Product::forStore($storeId)
                ->with(['variants:id,product_id,name', 'packagingUnits:id,product_id,variant_id,name'])
                ->where('is_active', true)
                ->select('id', 'name', 'sku', 'cost_price', 'is_variant')
                ->orderBy('name')
                ->get(),
            'branches' => Branch::where('store_id', $storeId)
                ->where('is_active', true)
                ->when($branchId, fn ($q) => $q->where('id', $branchId))
                ->select('id', 'name')
                ->get(),
        ]);
    }

    public function store(Request $request)
    {
        [$storeId, $branchId] = $this->storeScope();

        $validated = $request->validate(
            [
                'product_id' => 'required|exists:products,id',
                'variant_id' => 'nullable|exists:product_variants,id',
                'packaging_unit_id' => 'nullable|exists:product_packaging_units,id',
                'branch_id' => 'nullable|exists:branches,id',
                'batch_no' => [
                    'required',
                    'string',
                    'max:100',
                    Rule::unique('product_batches')->where(
                        fn ($q) => $q->where('product_id', $request->product_id)
                            ->where('variant_id', $request->variant_id)
                            ->where('packaging_unit_id', $request->packaging_unit_id),
                    ),
                ],
                'purchase_date' => 'nullable|date',
                'expiry_date' => 'nullable|date|after_or_equal:purchase_date',
                'quantity' => 'required|integer|min:0',
                'cost_price' => 'required|numeric|min:0',
            ],
            [
                'batch_no.unique' => 'Nomor batch ini sudah digunakan untuk produk tersebut.',
                'expiry_date.after_or_equal' => 'Tanggal kadaluarsa harus setelah atau sama dengan tanggal pembelian.',
            ],
        );

        $validated['store_id'] = $storeId;
        if ($branchId) {
            $validated['branch_id'] = $branchId;
        }

        ProductBatch::create($validated);

        return redirect()
            ->route('admin.product-batches.index')
            ->with('success', 'Batch produk berhasil ditambahkan.');
    }

    public function edit(ProductBatch $productBatch)
    {
        [$storeId, $branchId] = $this->storeScope();

        return Inertia::render('Admin/ProductBatches/Edit', [
            'batch' => $productBatch->load('product:id,name,sku,cost_price'),
            'products' => Product::forStore($storeId)
                ->with(['variants:id,product_id,name', 'packagingUnits:id,product_id,variant_id,name'])
                ->where('is_active', true)
                ->select('id', 'name', 'sku', 'cost_price', 'is_variant')
                ->orderBy('name')
                ->get(),
            'branches' => Branch::where('store_id', $storeId)
                ->where('is_active', true)
                ->when($branchId, fn ($q) => $q->where('id', $branchId))
                ->select('id', 'name')
                ->get(),
        ]);
    }

    public function update(Request $request, ProductBatch $productBatch)
    {
        [$storeId, $branchId] = $this->storeScope();

        $validated = $request->validate(
            [
                'product_id' => 'required|exists:products,id',
                'variant_id' => 'nullable|exists:product_variants,id',
                'packaging_unit_id' => 'nullable|exists:product_packaging_units,id',
                'branch_id' => 'nullable|exists:branches,id',
                'batch_no' => [
                    'required',
                    'string',
                    'max:100',
                    Rule::unique('product_batches')
                        ->where(
                            fn ($q) => $q->where('product_id', $request->product_id)
                                ->where('variant_id', $request->variant_id)
                                ->where('packaging_unit_id', $request->packaging_unit_id),
                        )
                        ->ignore($productBatch->id),
                ],
                'purchase_date' => 'nullable|date',
                'expiry_date' => 'nullable|date|after_or_equal:purchase_date',
                'quantity' => 'required|integer|min:0',
                'cost_price' => 'required|numeric|min:0',
            ],
            [
                'batch_no.unique' => 'Nomor batch ini sudah digunakan untuk produk tersebut.',
                'expiry_date.after_or_equal' => 'Tanggal kadaluarsa harus setelah atau sama dengan tanggal pembelian.',
            ],
        );

        if ($branchId) {
            $validated['branch_id'] = $branchId;
        }

        $productBatch->update($validated);

        return redirect()
            ->route('admin.product-batches.index')
            ->with('success', 'Batch produk berhasil diperbarui.');
    }

    public function destroy(ProductBatch $productBatch)
    {
        $productBatch->delete();

        return redirect()
            ->route('admin.product-batches.index')
            ->with('success', 'Batch produk berhasil dihapus.');
    }

    /**
     * Task 7 — Laporan penjualan tanpa batch.
     *
     * Menampilkan sale_items dimana produk track_batch = true
     * namun product_batch_id = NULL, artinya stok dipotong di luar batch
     * (terjadi sebelum FEFO aktif, atau batch habis).
     */
    public function unbatchedSales()
    {
        [$storeId, $branchId] = $this->storeScope();

        $items = SaleItem::with([
            'sale:id,sale_no,sale_date,store_id',
            'product:id,name,sku',
            'variant:id,name',
            'packagingUnit:id,name',
        ])
            ->whereNull('product_batch_id')
            ->whereHas('product', fn ($q) => $q->where('track_batch', true))
            ->whereHas('sale', fn ($q) => $q->where('store_id', $storeId)->when($branchId, fn ($sq) => $sq->where('branch_id', $branchId))->where('status', 'completed'))
            ->orderByDesc('created_at')
            ->limit(500)
            ->get()
            ->map(fn ($si) => [
                'id' => $si->id,
                'sale_no' => $si->sale?->sale_no,
                'sale_date' => $si->sale?->sale_date,
                'product_name' => $si->product?->name,
                'product_sku' => $si->product?->sku,
                'variant_name' => $si->variant?->name,
                'packaging_unit' => $si->packagingUnit?->name,
                'quantity' => (float) $si->quantity,
            ]);

        return Inertia::render('Admin/ProductBatches/UnbatchedSales', [
            'items' => $items,
        ]);
    }
}
