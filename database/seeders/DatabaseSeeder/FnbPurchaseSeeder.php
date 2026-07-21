<?php

namespace Database\Seeders\DatabaseSeeder;

use App\Models\Branch;
use App\Models\PaymentMethod;
use App\Models\Product;
use App\Models\ProductStock;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\PurchasePayment;
use App\Models\StockMovement;
use App\Models\Store;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Database\Seeder;

class FnbPurchaseSeeder extends Seeder
{
    public function run(): void
    {
        $store = Store::where('code', 'STORE002')->firstOrFail();
        $owner = User::where('email', 'owner1@gmail.com')->value('id');
        $br2a = Branch::where('store_id', $store->id)->where('code', 'BR2A')->value('id');
        $br2b = Branch::where('store_id', $store->id)->where('code', 'BR2B')->value('id');

        $pid = fn ($sku) => Product::where('store_id', $store->id)->where('sku', $sku)->value('id');
        $sup = fn ($code) => Supplier::where('store_id', $store->id)->where('code', $code)->value('id');

        $purchases = [
            // PO 1 — Biji kopi + susu ke BR2A
            [
                'purchase_no' => 'PO-FNB-20260710-001',
                'purchase_date' => '2026-07-10 08:00:00',
                'branch_id' => $br2a,
                'supplier_id' => $sup('SUP-F2-01'),
                'items' => [
                    ['sku' => 'F2-RM-001', 'qty' => 5000,  'cost' => 0.35,  'unit' => 'gram'],
                    ['sku' => 'F2-RM-002', 'qty' => 3000,  'cost' => 0.20,  'unit' => 'gram'],
                ],
                'paid_amount' => 2350,
                'method' => 'CASH',
            ],
            // PO 2 — Susu segar + oat + krim ke BR2A
            [
                'purchase_no' => 'PO-FNB-20260711-002',
                'purchase_date' => '2026-07-11 09:00:00',
                'branch_id' => $br2a,
                'supplier_id' => $sup('SUP-F2-03'),
                'items' => [
                    ['sku' => 'F2-RM-004', 'qty' => 10000, 'cost' => 0.015, 'unit' => 'ml'],
                    ['sku' => 'F2-RM-005', 'qty' => 5000,  'cost' => 0.025, 'unit' => 'ml'],
                    ['sku' => 'F2-RM-006', 'qty' => 2000,  'cost' => 0.030, 'unit' => 'ml'],
                ],
                'paid_amount' => 335,
                'method' => 'TRANSFER',
            ],
            // PO 3 — Sirup + bubuk + bahan ke BR2A
            [
                'purchase_no' => 'PO-FNB-20260712-003',
                'purchase_date' => '2026-07-12 10:00:00',
                'branch_id' => $br2a,
                'supplier_id' => $sup('SUP-F2-02'),
                'items' => [
                    ['sku' => 'F2-RM-007', 'qty' => 1000,  'cost' => 0.040, 'unit' => 'ml'],
                    ['sku' => 'F2-RM-008', 'qty' => 1000,  'cost' => 0.040, 'unit' => 'ml'],
                    ['sku' => 'F2-RM-009', 'qty' => 1000,  'cost' => 0.12,  'unit' => 'gram'],
                    ['sku' => 'F2-RM-010', 'qty' => 800,   'cost' => 0.18,  'unit' => 'gram'],
                    ['sku' => 'F2-RM-017', 'qty' => 3000,  'cost' => 0.05,  'unit' => 'gram'],
                    ['sku' => 'F2-RM-018', 'qty' => 2000,  'cost' => 0.03,  'unit' => 'gram'],
                    ['sku' => 'F2-RM-019', 'qty' => 5000,  'cost' => 0.014, 'unit' => 'gram'],
                    ['sku' => 'F2-RM-020', 'qty' => 500,   'cost' => 800,   'unit' => 'pcs'],
                ],
                'paid_amount' => 441884,
                'method' => 'CASH',
            ],
            // PO 4 — Bahan makanan ke BR2A
            [
                'purchase_no' => 'PO-FNB-20260713-004',
                'purchase_date' => '2026-07-13 08:30:00',
                'branch_id' => $br2a,
                'supplier_id' => $sup('SUP-F2-02'),
                'items' => [
                    ['sku' => 'F2-RM-013', 'qty' => 100,   'cost' => 1500,  'unit' => 'lembar'],
                    ['sku' => 'F2-RM-014', 'qty' => 100,   'cost' => 2000,  'unit' => 'butir'],
                    ['sku' => 'F2-RM-015', 'qty' => 60,    'cost' => 3500,  'unit' => 'lembar'],
                    ['sku' => 'F2-RM-016', 'qty' => 2000,  'cost' => 0.035, 'unit' => 'gram'],
                ],
                'paid_amount' => 710070,
                'method' => 'CASH',
            ],
            // PO 5 — Biji kopi + susu ke BR2B
            [
                'purchase_no' => 'PO-FNB-20260714-005',
                'purchase_date' => '2026-07-14 09:00:00',
                'branch_id' => $br2b,
                'supplier_id' => $sup('SUP-F2-01'),
                'items' => [
                    ['sku' => 'F2-RM-001', 'qty' => 2000,  'cost' => 0.35,  'unit' => 'gram'],
                    ['sku' => 'F2-RM-002', 'qty' => 1500,  'cost' => 0.20,  'unit' => 'gram'],
                ],
                'paid_amount' => 1000,
                'method' => 'CASH',
            ],
            // PO 6 — Susu + sirup ke BR2B
            [
                'purchase_no' => 'PO-FNB-20260715-006',
                'purchase_date' => '2026-07-15 10:00:00',
                'branch_id' => $br2b,
                'supplier_id' => $sup('SUP-F2-03'),
                'items' => [
                    ['sku' => 'F2-RM-004', 'qty' => 5000,  'cost' => 0.015, 'unit' => 'ml'],
                    ['sku' => 'F2-RM-005', 'qty' => 2000,  'cost' => 0.025, 'unit' => 'ml'],
                    ['sku' => 'F2-RM-019', 'qty' => 2000,  'cost' => 0.014, 'unit' => 'gram'],
                    ['sku' => 'F2-RM-020', 'qty' => 200,   'cost' => 800,   'unit' => 'pcs'],
                ],
                'paid_amount' => 235078,
                'method' => 'TRANSFER',
            ],
        ];

        foreach ($purchases as $data) {
            $items = $data['items'];
            $paidAmount = $data['paid_amount'];
            $method = $data['method'];
            unset($data['items'], $data['paid_amount'], $data['method']);

            $subtotal = 0;
            foreach ($items as $item) {
                $subtotal += $item['cost'] * $item['qty'];
            }

            $data['store_id'] = $store->id;
            $data['user_id'] = $owner;
            $data['subtotal'] = $subtotal;
            $data['discount_amount'] = 0;
            $data['tax_amount'] = 0;
            $data['shipping_amount'] = 0;
            $data['grand_total'] = $subtotal;
            $data['paid_amount'] = $paidAmount;
            $data['status'] = 'completed';
            $data['payment_status'] = $paidAmount >= $subtotal ? 'paid' : 'partial';

            $purchase = Purchase::create($data);

            foreach ($items as $item) {
                $productId = $pid($item['sku']);
                if (! $productId) {
                    continue;
                }

                PurchaseItem::create([
                    'purchase_id' => $purchase->id,
                    'product_id' => $productId,
                    'variant_id' => null,
                    'unit_name' => $item['unit'],
                    'quantity' => $item['qty'],
                    'cost_price' => $item['cost'],
                    'subtotal' => $item['cost'] * $item['qty'],
                ]);

                $stock = ProductStock::firstOrCreate(
                    [
                        'product_id' => $productId,
                        'variant_id' => null,
                        'packaging_unit_id' => null,
                        'store_id' => $store->id,
                        'branch_id' => $data['branch_id'],
                    ],
                    ['quantity' => 0, 'reserved_quantity' => 0, 'average_cost' => 0],
                );

                $oldQty = $stock->quantity;
                $stock->increment('quantity', $item['qty']);

                if ($oldQty > 0) {
                    $oldCost = $stock->average_cost ?? 0;
                    $totalQty = $oldQty + $item['qty'];
                    $stock->update(['average_cost' => (($oldCost * $oldQty) + ($item['cost'] * $item['qty'])) / $totalQty]);
                } else {
                    $stock->update(['average_cost' => $item['cost']]);
                }

                StockMovement::create([
                    'product_id' => $productId,
                    'variant_id' => null,
                    'store_id' => $store->id,
                    'branch_id' => $data['branch_id'],
                    'reference_type' => Purchase::class,
                    'reference_id' => $purchase->id,
                    'movement_type' => 'purchase_in',
                    'quantity' => $item['qty'],
                    'unit_cost' => $item['cost'],
                    'reference_no' => $data['purchase_no'],
                    'notes' => "Pembelian #{$data['purchase_no']}",
                    'moved_at' => $data['purchase_date'],
                ]);
            }

            $methodId = PaymentMethod::where('store_id', $store->id)
                ->where('code', 'like', $method.'%')
                ->value('id');

            if ($methodId) {
                PurchasePayment::create([
                    'purchase_id' => $purchase->id,
                    'payment_method_id' => $methodId,
                    'paid_at' => $data['purchase_date'],
                    'amount' => $paidAmount,
                ]);
            }
        }
    }
}
