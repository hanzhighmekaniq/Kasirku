<?php

namespace Database\Seeders\DatabaseSeeder;

use App\Models\Branch;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\PurchasePayment;
use App\Models\Store;
use App\Models\User;
use Illuminate\Database\Seeder;

class PurchaseSeeder extends Seeder
{
    public function run(): void
    {
        $owner1 = User::where('email', 'owner1@gmail.com')->value('id');
        $owner2 = User::where('email', 'owner2@gmail.com')->value('id');

        $storeKopiSenja = Store::where('code', 'STORE002')->value('id');
        $storeMinimarket = Store::where('code', 'STORE001')->value('id');
        $branchKopiMalioboro = Branch::where('code', 'BR2A')->value('id');
        $branchMiniPusat = Branch::where('code', 'BR1A')->value('id');
        $branchMiniBabarsari = Branch::where('code', 'BR1B')->value('id');

        // Helper: product_id by SKU
        $pid = fn ($storeId, $sku) => Product::where('store_id', $storeId)->where('sku', $sku)->value('id');

        $purchases = [
            // ═══ Store STORE002 — Kopi Senja ═══
            [
                'purchase_no' => 'PO-20260615-001',
                'purchase_date' => '2026-06-15 09:00:00',
                'store_id' => $storeKopiSenja,
                'branch_id' => $branchKopiMalioboro,
                'supplier_id' => 1,
                'user_id' => $owner1,
                'items' => [
                    ['product_id' => $pid($storeKopiSenja, 'S2-001'), 'quantity' => 10, 'cost_price' => 8000],
                    ['product_id' => $pid($storeKopiSenja, 'S2-002'), 'quantity' => 5, 'cost_price' => 5000],
                ],
                'paid_amount' => 105000,
                'payment_method_id' => 3,
            ],
            [
                'purchase_no' => 'PO-20260612-002',
                'purchase_date' => '2026-06-12 10:30:00',
                'store_id' => $storeKopiSenja,
                'branch_id' => $branchKopiMalioboro,
                'supplier_id' => 2,
                'user_id' => $owner1,
                'items' => [
                    ['product_id' => $pid($storeKopiSenja, 'S2-004'), 'quantity' => 20, 'cost_price' => 9000],
                    ['product_id' => $pid($storeKopiSenja, 'S2-006'), 'quantity' => 10, 'cost_price' => 8000],
                ],
                'paid_amount' => 260000,
                'payment_method_id' => 1,
            ],

            // ═══ Store STORE001 — Minimarket Sejahtera ═══
            [
                'purchase_no' => 'PO-20260608-004',
                'purchase_date' => '2026-06-08 14:00:00',
                'store_id' => $storeMinimarket,
                'branch_id' => $branchMiniPusat,
                'supplier_id' => 5,
                'user_id' => $owner2,
                'items' => [
                    ['product_id' => $pid($storeMinimarket, 'S1-001'), 'quantity' => 100, 'cost_price' => 2800],
                    ['product_id' => $pid($storeMinimarket, 'S1-008'), 'quantity' => 48, 'cost_price' => 3500],
                    ['product_id' => $pid($storeMinimarket, 'S1-006'), 'quantity' => 60, 'cost_price' => 2500],
                    ['product_id' => $pid($storeMinimarket, 'S1-019'), 'quantity' => 60, 'cost_price' => 2000],
                ],
                'paid_amount' => 628000,
                'payment_method_id' => 3,
            ],
            [
                'purchase_no' => 'PO-20260605-005',
                'purchase_date' => '2026-06-05 11:00:00',
                'store_id' => $storeMinimarket,
                'branch_id' => $branchMiniPusat,
                'supplier_id' => 4,
                'user_id' => $owner2,
                'items' => [
                    ['product_id' => $pid($storeMinimarket, 'S1-002'), 'quantity' => 15, 'cost_price' => 60000],
                    ['product_id' => $pid($storeMinimarket, 'S1-003'), 'quantity' => 20, 'cost_price' => 15000],
                    ['product_id' => $pid($storeMinimarket, 'S1-004'), 'quantity' => 25, 'cost_price' => 12000],
                    ['product_id' => $pid($storeMinimarket, 'S1-020'), 'quantity' => 24, 'cost_price' => 8000],
                ],
                'paid_amount' => 1542000,
                'payment_method_id' => 3,
            ],
            [
                'purchase_no' => 'PO-20260618-006',
                'purchase_date' => '2026-06-18 09:00:00',
                'store_id' => $storeMinimarket,
                'branch_id' => $branchMiniBabarsari,
                'supplier_id' => 5,
                'user_id' => $owner2,
                'items' => [
                    ['product_id' => $pid($storeMinimarket, 'S1-001'), 'quantity' => 30, 'cost_price' => 2800],
                    ['product_id' => $pid($storeMinimarket, 'S1-006'), 'quantity' => 24, 'cost_price' => 2500],
                ],
                'paid_amount' => 144000,
                'payment_method_id' => 1,
            ],
        ];

        foreach ($purchases as $data) {
            $items = $data['items'];
            $paymentMethodId = $data['payment_method_id'] ?? 1;
            unset($data['items'], $data['payment_method_id']);

            $subtotal = 0;
            foreach ($items as $item) {
                $subtotal += $item['cost_price'] * $item['quantity'];
            }

            $data['subtotal'] = $subtotal;
            $data['discount_amount'] = 0;
            $data['tax_amount'] = 0;
            $data['shipping_amount'] = 0;
            $data['grand_total'] = $subtotal;
            $data['status'] = 'received';
            $data['payment_status'] = 'paid';

            $purchase = Purchase::create($data);

            foreach ($items as $item) {
                PurchaseItem::create([
                    'purchase_id' => $purchase->id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'cost_price' => $item['cost_price'],
                    'subtotal' => $item['cost_price'] * $item['quantity'],
                ]);
            }

            PurchasePayment::create([
                'purchase_id' => $purchase->id,
                'payment_method_id' => $paymentMethodId,
                'paid_at' => $data['purchase_date'],
                'amount' => $data['paid_amount'],
            ]);
        }
    }
}
