<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductStock;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\SaleReturn;
use App\Models\SaleReturnItem;
use App\Models\StockMovement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class SaleReturnController extends Controller
{
    public function index()
    {
        $storeId = session('current_store_id');

        $returns = SaleReturn::with([
            'sale:id,sale_no,grand_total',
            'customer:id,name',
            'user:id,name',
        ])
            ->whereHas('sale', fn($q) => $q->where('store_id', $storeId))
            ->latest('return_date')
            ->get()
            ->map(function ($retur) {
                $retur->item_count = $retur->items()->sum('quantity');
                return $retur;
            });

        return Inertia::render('Admin/SaleReturns/Index', [
            'saleReturns' => $returns,
        ]);
    }

    public function create()
    {
        $storeId = session('current_store_id');

        $sales = Sale::where('store_id', $storeId)
            ->where('status', 'completed')
            ->with('customer:id,name')
            ->latest('sale_date')
            ->get(['id', 'sale_no', 'sale_date', 'grand_total', 'customer_id']);

        return Inertia::render('Admin/SaleReturns/Create', [
            'sales' => $sales,
        ]);
    }

    public function store(Request $request)
    {
        $storeId = session('current_store_id');

        $validated = $request->validate([
            'sale_id' => [
                'required',
                'exists:sales,id',
                function ($attr, $val, $fail) use ($storeId) {
                    $sale = Sale::find($val);
                    if (!$sale || $sale->store_id !== $storeId) {
                        $fail('Penjualan tidak ditemukan.');
                    }
                    if ($sale && $sale->status !== 'completed') {
                        $fail('Hanya penjualan selesai yang bisa diretur.');
                    }
                },
            ],
            'return_date' => 'required|date',
            'notes' => 'nullable|string|max:1000',
            'items' => 'required|array|min:1',
            'items.*.sale_item_id' => 'required|exists:sale_items,id',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.reason' => 'nullable|string|max:500',
        ]);

        $sale = Sale::with('items')->findOrFail($validated['sale_id']);

        // Validate return quantities against sale items
        foreach ($validated['items'] as $item) {
            $saleItem = $sale->items->find($item['sale_item_id']);
            if (!$saleItem) {
                return back()->with('error', 'Item penjualan tidak ditemukan.')->withInput();
            }
            $alreadyReturned = SaleReturnItem::where('sale_item_id', $item['sale_item_id'])
                ->whereHas('saleReturn', fn($q) => $q->where('status', 'completed'))
                ->sum('quantity');
            $maxReturnable = $saleItem->quantity - $alreadyReturned;
            if ($item['quantity'] > $maxReturnable) {
                return back()->with(
                    'error',
                    "Quantity retur untuk {$saleItem->product->name} melebihi batas. Maks: {$maxReturnable}"
                )->withInput();
            }
        }

        DB::beginTransaction();
        try {
            // Generate return number
            $prefix = 'SRT-' . now()->format('Ymd') . '-';
            $last = SaleReturn::where('return_no', 'like', $prefix . '%')
                ->orderByDesc('return_no')
                ->first();
            $seq = $last ? (int) substr($last->return_no, -3) + 1 : 1;
            $returnNo = $prefix . str_pad((string) $seq, 3, '0', STR_PAD_LEFT);

            $subtotal = 0;
            foreach ($validated['items'] as $item) {
                $subtotal += $item['quantity'] * $item['unit_price'];
            }

            $return = SaleReturn::create([
                'sale_id' => $sale->id,
                'customer_id' => $sale->customer_id,
                'user_id' => auth()->id(),
                'return_no' => $returnNo,
                'return_date' => $validated['return_date'],
                'subtotal' => $subtotal,
                'total_amount' => $subtotal,
                'notes' => $validated['notes'] ?? null,
                'status' => 'completed',
            ]);

            foreach ($validated['items'] as $item) {
                SaleReturnItem::create([
                    'sale_return_id' => $return->id,
                    'sale_item_id' => $item['sale_item_id'],
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'subtotal' => $item['quantity'] * $item['unit_price'],
                    'reason' => $item['reason'] ?? null,
                ]);

                // Return stock
                $this->adjustStock($item['product_id'], $item['quantity'], $sale, false);
            }

            // Reduce paid_amount on sale (refund)
            $sale->decrement('paid_amount', $subtotal);
            $sale->change_amount = max(0, $sale->paid_amount - $sale->grand_total);
            if ($sale->paid_amount >= $sale->grand_total) {
                $sale->payment_status = 'paid';
            } elseif ($sale->paid_amount <= 0) {
                $sale->payment_status = 'unpaid';
            } else {
                $sale->payment_status = 'partial';
            }
            $sale->save();

            DB::commit();

            return redirect()
                ->route('admin.sale-returns.show', $return)
                ->with('success', 'Retur penjualan berhasil dibuat.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Gagal membuat retur: ' . $e->getMessage())->withInput();
        }
    }

    public function show(SaleReturn $saleReturn)
    {
        $saleReturn->load([
            'sale:id,sale_no,grand_total,paid_amount',
            'customer:id,name',
            'user:id,name',
            'items.product:id,name,sku',
            'items.saleItem:id,sale_id,quantity,price',
        ]);

        return Inertia::render('Admin/SaleReturns/Show', [
            'saleReturn' => $saleReturn,
        ]);
    }

    public function destroy(SaleReturn $saleReturn)
    {
        if ($saleReturn->status === 'completed') {
            return back()->with('error', 'Retur yang sudah selesai tidak bisa dihapus. Batalkan dulu.');
        }

        $saleReturn->items()->delete();
        $saleReturn->delete();

        return redirect()
            ->route('admin.sale-returns.index')
            ->with('success', 'Retur berhasil dihapus.');
    }

    public function updateStatus(Request $request, SaleReturn $saleReturn)
    {
        $validated = $request->validate([
            'status' => 'required|in:cancelled',
        ]);

        if ($saleReturn->status !== 'completed') {
            return back()->with('error', 'Hanya retur selesai yang bisa dibatalkan.');
        }

        DB::beginTransaction();
        try {
            $sale = $saleReturn->sale;

            // Reverse stock: remove returned items from stock
            foreach ($saleReturn->items as $item) {
                $this->adjustStock($item->product_id, $item->quantity, $sale, true);
            }

            // Restore sale payment
            $sale->increment('paid_amount', $saleReturn->total_amount);
            $sale->change_amount = max(0, $sale->paid_amount - $sale->grand_total);
            if ($sale->paid_amount >= $sale->grand_total) {
                $sale->payment_status = 'paid';
            } elseif ($sale->paid_amount <= 0) {
                $sale->payment_status = 'unpaid';
            } else {
                $sale->payment_status = 'partial';
            }
            $sale->save();

            $saleReturn->update(['status' => 'cancelled']);

            DB::commit();

            return redirect()
                ->route('admin.sale-returns.show', $saleReturn)
                ->with('success', 'Retur berhasil dibatalkan.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Gagal membatalkan retur: ' . $e->getMessage());
        }
    }

    /** AJAX: get sale items for return form */
    public function getSaleItems(Sale $sale)
    {
        $storeId = session('current_store_id');
        if ($sale->store_id !== $storeId) {
            abort(404);
        }

        $sale->load('items.product:id,name,sku,track_stock');

        $items = $sale->items->map(function ($item) {
            $alreadyReturned = SaleReturnItem::where('sale_item_id', $item->id)
                ->whereHas('saleReturn', fn($q) => $q->where('status', 'completed'))
                ->sum('quantity');

            return [
                'id' => $item->id,
                'product_id' => $item->product_id,
                'product_name' => $item->product->name ?? 'Unknown',
                'product_sku' => $item->product->sku ?? '',
                'quantity' => (float) $item->quantity,
                'unit_price' => (float) $item->price,
                'returned_qty' => (float) $alreadyReturned,
                'returnable_qty' => (float) ($item->quantity - $alreadyReturned),
            ];
        });

        return response()->json([
            'sale_no' => $sale->sale_no,
            'customer_name' => $sale->customer->name ?? '-',
            'items' => $items,
        ]);
    }

    private function adjustStock(int $productId, float $quantity, Sale $sale, bool $isReversal): void
    {
        $product = Product::find($productId);
        if (!$product || !$product->track_stock) {
            return;
        }

        $stock = ProductStock::firstOrCreate(
            [
                'product_id' => $productId,
                'store_id' => $sale->store_id,
                'branch_id' => $sale->branch_id,
            ],
            ['quantity' => 0, 'reserved_quantity' => 0],
        );

        if ($isReversal) {
            // Cancel return → remove stock that was re-added
            $stock->decrement('quantity', $quantity);
            StockMovement::create([
                'product_id' => $productId,
                'store_id' => $sale->store_id,
                'branch_id' => $sale->branch_id,
                'user_id' => auth()->id(),
                'type' => 'return_cancel',
                'quantity' => -$quantity,
                'before_quantity' => $stock->quantity + $quantity,
                'after_quantity' => $stock->quantity,
                'reference_type' => 'sale_return',
                'reference_id' => null,
                'notes' => 'Pembatalan retur penjualan - stok dikurangi kembali',
            ]);
        } else {
            // Return → add stock back
            $stock->increment('quantity', $quantity);
            StockMovement::create([
                'product_id' => $productId,
                'store_id' => $sale->store_id,
                'branch_id' => $sale->branch_id,
                'user_id' => auth()->id(),
                'type' => 'return_in',
                'quantity' => $quantity,
                'before_quantity' => $stock->quantity - $quantity,
                'after_quantity' => $stock->quantity,
                'reference_type' => 'sale_return',
                'reference_id' => null,
                'notes' => 'Retur penjualan - stok dikembalikan',
            ]);
        }
    }
}
