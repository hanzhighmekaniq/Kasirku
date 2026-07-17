<?php

namespace Database\Seeders\DatabaseSeeder;

use App\Models\Branch;
use App\Models\PaymentMethod;
use App\Models\Product;
use App\Models\ProductStock;
use App\Models\ProductVariant;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\PurchasePayment;
use App\Models\StockMovement;
use App\Models\Store;
use App\Models\User;
use Illuminate\Database\Seeder;

class PurchaseSeeder extends Seeder
{
    public function run(): void
    {
        $owner = User::where('email', 'owner1@gmail.com')->value('id');
        $store = Store::where('code', 'STORE001')->firstOrFail();
        $branchPusat = Branch::where('store_id', $store->id)->where('code', 'BR1A')->value('id');
        $branchBabarsari = Branch::where('store_id', $store->id)->where('code', 'BR1B')->value('id');

        $pid = fn ($sku) => Product::where('store_id', $store->id)->where('sku', $sku)->value('id');
        $vid = fn ($sku, $name) => ProductVariant::whereHas('product', fn ($q) => $q->where('store_id', $store->id)->where('sku', $sku))->where('name', $name)->value('id');

        $purchases = [
            // Pembelian 1: Indomie variant + Beras + Minyak
            [
                'purchase_no' => 'PO-20260705-001',
                'purchase_date' => '2026-07-05 09:00:00',
                'branch_id' => $branchPusat,
                'supplier_id' => 1,
                'items' => [
                    ['product_id' => $pid('S1-001'), 'variant_id' => $vid('S1-001', 'Original'), 'packaging_unit_id' => null, 'quantity' => 100, 'cost_price' => 2800, 'unit_name' => 'pcs'],
                    ['product_id' => $pid('S1-001'), 'variant_id' => $vid('S1-001', 'Rendang'), 'packaging_unit_id' => null, 'quantity' => 50, 'cost_price' => 3200, 'unit_name' => 'pcs'],
                    ['product_id' => $pid('S1-001'), 'variant_id' => $vid('S1-001', 'Soto'), 'packaging_unit_id' => null, 'quantity' => 40, 'cost_price' => 3000, 'unit_name' => 'pcs'],
                    ['product_id' => $pid('S1-002'), 'variant_id' => null, 'packaging_unit_id' => null, 'quantity' => 15, 'cost_price' => 60000, 'unit_name' => 'pcs'],
                    ['product_id' => $pid('S1-003'), 'variant_id' => null, 'packaging_unit_id' => null, 'quantity' => 20, 'cost_price' => 15000, 'unit_name' => 'pcs'],
                ],
                'paid_amount' => 2100000,
                'payment_method_code' => 'CASH',
            ],
            // Pembelian 2: Aqua + Teh Botol variant + Kopi Torabika
            [
                'purchase_no' => 'PO-20260708-002',
                'purchase_date' => '2026-07-08 10:00:00',
                'branch_id' => $branchPusat,
                'supplier_id' => 2,
                'items' => [
                    ['product_id' => $pid('S1-006'), 'variant_id' => null, 'packaging_unit_id' => null, 'quantity' => 60, 'cost_price' => 2500, 'unit_name' => 'pcs'],
                    ['product_id' => $pid('S1-008'), 'variant_id' => $vid('S1-008', 'Original'), 'packaging_unit_id' => null, 'quantity' => 48, 'cost_price' => 3500, 'unit_name' => 'pcs'],
                    ['product_id' => $pid('S1-008'), 'variant_id' => $vid('S1-008', 'Less Sugar'), 'packaging_unit_id' => null, 'quantity' => 24, 'cost_price' => 3800, 'unit_name' => 'pcs'],
                    ['product_id' => $pid('S1-019'), 'variant_id' => null, 'packaging_unit_id' => null, 'quantity' => 60, 'cost_price' => 2000, 'unit_name' => 'pcs'],
                ],
                'paid_amount' => 541200,
                'payment_method_code' => 'CASH',
            ],
            // Pembelian 3: Susu Ultra variant + Gula + Susu Kental
            [
                'purchase_no' => 'PO-20260710-003',
                'purchase_date' => '2026-07-10 14:00:00',
                'branch_id' => $branchPusat,
                'supplier_id' => 2,
                'items' => [
                    ['product_id' => $pid('S1-007'), 'variant_id' => $vid('S1-007', 'Full Cream'), 'packaging_unit_id' => null, 'quantity' => 30, 'cost_price' => 3800, 'unit_name' => 'pcs'],
                    ['product_id' => $pid('S1-007'), 'variant_id' => $vid('S1-007', 'Coklat'), 'packaging_unit_id' => null, 'quantity' => 24, 'cost_price' => 3800, 'unit_name' => 'pcs'],
                    ['product_id' => $pid('S1-007'), 'variant_id' => $vid('S1-007', 'Strawberry'), 'packaging_unit_id' => null, 'quantity' => 18, 'cost_price' => 3800, 'unit_name' => 'pcs'],
                    ['product_id' => $pid('S1-004'), 'variant_id' => null, 'packaging_unit_id' => null, 'quantity' => 25, 'cost_price' => 12000, 'unit_name' => 'pcs'],
                    ['product_id' => $pid('S1-020'), 'variant_id' => null, 'packaging_unit_id' => null, 'quantity' => 24, 'cost_price' => 8000, 'unit_name' => 'pcs'],
                ],
                'paid_amount' => 1066800,
                'payment_method_code' => 'CASH',
            ],
            // Pembelian 4: Indomie Original ke Babarsari
            [
                'purchase_no' => 'PO-20260712-004',
                'purchase_date' => '2026-07-12 09:00:00',
                'branch_id' => $branchBabarsari,
                'supplier_id' => 1,
                'items' => [
                    ['product_id' => $pid('S1-001'), 'variant_id' => $vid('S1-001', 'Original'), 'packaging_unit_id' => null, 'quantity' => 30, 'cost_price' => 2800, 'unit_name' => 'pcs'],
                    ['product_id' => $pid('S1-006'), 'variant_id' => null, 'packaging_unit_id' => null, 'quantity' => 24, 'cost_price' => 2500, 'unit_name' => 'pcs'],
                ],
                'paid_amount' => 144000,
                'payment_method_code' => 'CASH',
            ],
            // Pembelian 5: Snack + Kebersihan
            [
                'purchase_no' => 'PO-20260714-005',
                'purchase_date' => '2026-07-14 11:00:00',
                'branch_id' => $branchPusat,
                'supplier_id' => 3,
                'items' => [
                    ['product_id' => $pid('S1-010'), 'variant_id' => null, 'packaging_unit_id' => null, 'quantity' => 20, 'cost_price' => 8500, 'unit_name' => 'pcs'],
                    ['product_id' => $pid('S1-011'), 'variant_id' => null, 'packaging_unit_id' => null, 'quantity' => 15, 'cost_price' => 7000, 'unit_name' => 'pcs'],
                    ['product_id' => $pid('S1-012'), 'variant_id' => null, 'packaging_unit_id' => null, 'quantity' => 30, 'cost_price' => 2000, 'unit_name' => 'pcs'],
                    ['product_id' => $pid('S1-013'), 'variant_id' => null, 'packaging_unit_id' => null, 'quantity' => 12, 'cost_price' => 5500, 'unit_name' => 'pcs'],
                    ['product_id' => $pid('S1-014'), 'variant_id' => null, 'packaging_unit_id' => null, 'quantity' => 10, 'cost_price' => 15000, 'unit_name' => 'pcs'],
                    ['product_id' => $pid('S1-015'), 'variant_id' => null, 'packaging_unit_id' => null, 'quantity' => 10, 'cost_price' => 12000, 'unit_name' => 'pcs'],
                    ['product_id' => $pid('S1-016'), 'variant_id' => null, 'packaging_unit_id' => null, 'quantity' => 8, 'cost_price' => 14000, 'unit_name' => 'pcs'],
                ],
                'paid_amount' => 649000,
                'payment_method_code' => 'CASH',
            ],
            // Pembelian 6: Rokok
            [
                'purchase_no' => 'PO-20260715-006',
                'purchase_date' => '2026-07-15 10:00:00',
                'branch_id' => $branchPusat,
                'supplier_id' => 1,
                'items' => [
                    ['product_id' => $pid('S1-017'), 'variant_id' => null, 'packaging_unit_id' => null, 'quantity' => 20, 'cost_price' => 18000, 'unit_name' => 'pcs'],
                    ['product_id' => $pid('S1-018'), 'variant_id' => null, 'packaging_unit_id' => null, 'quantity' => 15, 'cost_price' => 24000, 'unit_name' => 'pcs'],
                    ['product_id' => $pid('S1-009'), 'variant_id' => null, 'packaging_unit_id' => null, 'quantity' => 24, 'cost_price' => 4000, 'unit_name' => 'pcs'],
                    ['product_id' => $pid('S1-005'), 'variant_id' => null, 'packaging_unit_id' => null, 'quantity' => 10, 'cost_price' => 9000, 'unit_name' => 'pcs'],
                ],
                'paid_amount' => 816000,
                'payment_method_code' => 'CASH',
            ],
        ];

        foreach ($purchases as $data) {
            $items = $data['items'];
            $paidAmount = $data['paid_amount'];
            $methodCode = $data['payment_method_code'] ?? 'CASH';
            unset($data['items'], $data['paid_amount'], $data['payment_method_code']);

            $subtotal = 0;
            foreach ($items as $item) {
                $subtotal += $item['cost_price'] * $item['quantity'];
            }

            $data['store_id'] = $store->id;
            $data['user_id'] = $owner;
            $data['subtotal'] = $subtotal;
            $data['discount_amount'] = 0;
            $data['tax_amount'] = 0;
            $data['shipping_amount'] = 0;
            $data['grand_total'] = $subtotal;
            $data['status'] = 'completed';
            $data['payment_status'] = $paidAmount >= $subtotal ? 'paid' : 'partial';
            $data['paid_amount'] = $paidAmount;

            $purchase = Purchase::create($data);

            foreach ($items as $item) {
                PurchaseItem::create([
                    'purchase_id' => $purchase->id,
                    'product_id' => $item['product_id'],
                    'variant_id' => $item['variant_id'] ?? null,
                    'packaging_unit_id' => $item['packaging_unit_id'] ?? null,
                    'unit_name' => $item['unit_name'] ?? null,
                    'quantity' => $item['quantity'],
                    'cost_price' => $item['cost_price'],
                    'subtotal' => $item['cost_price'] * $item['quantity'],
                ]);

                // Update stock — bucket-aware
                $stock = ProductStock::firstOrCreate(
                    [
                        'product_id' => $item['product_id'],
                        'variant_id' => $item['variant_id'] ?? null,
                        'packaging_unit_id' => $item['packaging_unit_id'] ?? null,
                        'store_id' => $store->id,
                        'branch_id' => $data['branch_id'],
                    ],
                    ['quantity' => 0, 'reserved_quantity' => 0, 'average_cost' => 0],
                );

                $oldQty = $stock->quantity;
                $stock->increment('quantity', $item['quantity']);

                // Update average_cost (weighted average)
                if ($oldQty > 0) {
                    $oldCost = $stock->average_cost ?? 0;
                    $newCost = $item['cost_price'];
                    $totalQty = $oldQty + $item['quantity'];
                    $stock->update(['average_cost' => (($oldCost * $oldQty) + ($newCost * $item['quantity'])) / $totalQty]);
                } else {
                    $stock->update(['average_cost' => $item['cost_price']]);
                }

                // StockMovement
                StockMovement::create([
                    'product_id' => $item['product_id'],
                    'variant_id' => $item['variant_id'] ?? null,
                    'packaging_unit_id' => $item['packaging_unit_id'] ?? null,
                    'store_id' => $store->id,
                    'branch_id' => $data['branch_id'],
                    'reference_type' => Purchase::class,
                    'reference_id' => $purchase->id,
                    'movement_type' => 'purchase_in',
                    'quantity' => $item['quantity'],
                    'unit_cost' => $item['cost_price'],
                    'reference_no' => $data['purchase_no'],
                    'notes' => "Pembelian #{$data['purchase_no']}",
                    'moved_at' => $data['purchase_date'],
                ]);
            }

            $methodId = PaymentMethod::where('store_id', $store->id)->where('code', 'like', $methodCode.'%')->value('id');
            PurchasePayment::create([
                'purchase_id' => $purchase->id,
                'payment_method_id' => $methodId,
                'paid_at' => $data['purchase_date'],
                'amount' => $paidAmount,
            ]);
        }
    }
}
