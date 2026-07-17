<?php

namespace Database\Seeders\DatabaseSeeder;

use App\Models\Branch;
use App\Models\Customer;
use App\Models\PaymentMethod;
use App\Models\Product;
use App\Models\ProductStock;
use App\Models\ProductVariant;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\SalePayment;
use App\Models\Store;
use App\Models\User;
use Illuminate\Database\Seeder;

class SaleSeeder extends Seeder
{
    public function run(): void
    {
        $store = Store::where('code', 'STORE001')->firstOrFail();
        $branchPusat = Branch::where('store_id', $store->id)->where('code', 'BR1A')->value('id');
        $kasir = User::where('email', 'kasir.pusat@gmail.com')->value('id');

        $pid = fn ($sku) => Product::where('store_id', $store->id)->where('sku', $sku)->value('id');
        $vid = fn ($sku, $name) => ProductVariant::whereHas('product', fn ($q) => $q->where('store_id', $store->id)->where('sku', $sku))->where('name', $name)->value('id');
        $cid = fn ($code) => Customer::where('store_id', $store->id)->where('code', $code)->value('id');

        $sales = [
            // Hari ini
            [
                'sale_no' => 'SL-20260717-001', 'sale_date' => '2026-07-17 08:30:00',
                'user_id' => $kasir, 'customer_id' => null, 'order_type' => 'takeaway',
                'items' => [
                    ['product_id' => $pid('S1-001'), 'variant_id' => $vid('S1-001', 'Original'), 'quantity' => 5, 'price' => 4000],
                    ['product_id' => $pid('S1-006'), 'variant_id' => null, 'quantity' => 2, 'price' => 4000],
                ],
                'payment_method_code' => 'CASH', 'paid_amount' => 28000,
            ],
            [
                'sale_no' => 'SL-20260717-002', 'sale_date' => '2026-07-17 09:15:00',
                'user_id' => $kasir, 'customer_id' => $cid('CST001'), 'order_type' => 'takeaway',
                'items' => [
                    ['product_id' => $pid('S1-001'), 'variant_id' => $vid('S1-001', 'Rendang'), 'quantity' => 3, 'price' => 4500],
                    ['product_id' => $pid('S1-007'), 'variant_id' => $vid('S1-007', 'Full Cream'), 'quantity' => 2, 'price' => 5500],
                    ['product_id' => $pid('S1-010'), 'variant_id' => null, 'quantity' => 1, 'price' => 12000],
                ],
                'payment_method_code' => 'QRIS', 'paid_amount' => 36500,
            ],
            [
                'sale_no' => 'SL-20260717-003', 'sale_date' => '2026-07-17 10:00:00',
                'user_id' => $kasir, 'customer_id' => null, 'order_type' => 'takeaway',
                'items' => [
                    ['product_id' => $pid('S1-008'), 'variant_id' => $vid('S1-008', 'Original'), 'quantity' => 4, 'price' => 5000],
                    ['product_id' => $pid('S1-019'), 'variant_id' => null, 'quantity' => 10, 'price' => 3500],
                ],
                'payment_method_code' => 'CASH', 'paid_amount' => 55000,
            ],
            // Kemarin
            [
                'sale_no' => 'SL-20260716-001', 'sale_date' => '2026-07-16 08:00:00',
                'user_id' => $kasir, 'customer_id' => null, 'order_type' => 'takeaway',
                'items' => [
                    ['product_id' => $pid('S1-001'), 'variant_id' => $vid('S1-001', 'Original'), 'quantity' => 10, 'price' => 4000],
                    ['product_id' => $pid('S1-006'), 'variant_id' => null, 'quantity' => 5, 'price' => 4000],
                ],
                'payment_method_code' => 'CASH', 'paid_amount' => 60000,
            ],
            [
                'sale_no' => 'SL-20260716-002', 'sale_date' => '2026-07-16 10:30:00',
                'user_id' => $kasir, 'customer_id' => $cid('CST003'), 'order_type' => 'takeaway',
                'items' => [
                    ['product_id' => $pid('S1-002'), 'variant_id' => null, 'quantity' => 1, 'price' => 72000],
                    ['product_id' => $pid('S1-003'), 'variant_id' => null, 'quantity' => 2, 'price' => 21000],
                    ['product_id' => $pid('S1-004'), 'variant_id' => null, 'quantity' => 2, 'price' => 16000],
                ],
                'payment_method_code' => 'QRIS', 'paid_amount' => 146000,
            ],
            [
                'sale_no' => 'SL-20260716-003', 'sale_date' => '2026-07-16 14:00:00',
                'user_id' => $kasir, 'customer_id' => null, 'order_type' => 'takeaway',
                'items' => [
                    ['product_id' => $pid('S1-007'), 'variant_id' => $vid('S1-007', 'Coklat'), 'quantity' => 3, 'price' => 5500],
                    ['product_id' => $pid('S1-011'), 'variant_id' => null, 'quantity' => 2, 'price' => 10500],
                ],
                'payment_method_code' => 'CASH', 'paid_amount' => 37500,
            ],
            // 2 hari lalu
            [
                'sale_no' => 'SL-20260715-001', 'sale_date' => '2026-07-15 09:00:00',
                'user_id' => $kasir, 'customer_id' => $cid('CST001'), 'order_type' => 'takeaway',
                'items' => [
                    ['product_id' => $pid('S1-001'), 'variant_id' => $vid('S1-001', 'Original'), 'quantity' => 20, 'price' => 4000],
                    ['product_id' => $pid('S1-001'), 'variant_id' => $vid('S1-001', 'Rendang'), 'quantity' => 10, 'price' => 4500],
                ],
                'payment_method_code' => 'CASH', 'paid_amount' => 125000,
            ],
            [
                'sale_no' => 'SL-20260715-002', 'sale_date' => '2026-07-15 12:00:00',
                'user_id' => $kasir, 'customer_id' => null, 'order_type' => 'takeaway',
                'items' => [
                    ['product_id' => $pid('S1-017'), 'variant_id' => null, 'quantity' => 2, 'price' => 22000],
                    ['product_id' => $pid('S1-018'), 'variant_id' => null, 'quantity' => 1, 'price' => 28000],
                    ['product_id' => $pid('S1-009'), 'variant_id' => null, 'quantity' => 3, 'price' => 6500],
                ],
                'payment_method_code' => 'CASH', 'paid_amount' => 91500,
            ],
            [
                'sale_no' => 'SL-20260715-003', 'sale_date' => '2026-07-15 15:30:00',
                'user_id' => $kasir, 'customer_id' => $cid('CST002'), 'order_type' => 'takeaway',
                'items' => [
                    ['product_id' => $pid('S1-013'), 'variant_id' => null, 'quantity' => 2, 'price' => 8500],
                    ['product_id' => $pid('S1-014'), 'variant_id' => null, 'quantity' => 1, 'price' => 22000],
                    ['product_id' => $pid('S1-015'), 'variant_id' => null, 'quantity' => 1, 'price' => 18000],
                ],
                'payment_method_code' => 'CASH', 'paid_amount' => 57000,
            ],
        ];

        foreach ($sales as $data) {
            $items = $data['items'];
            $paidAmount = $data['paid_amount'];
            $methodCode = $data['payment_method_code'] ?? 'CASH';
            unset($data['items'], $data['paid_amount'], $data['payment_method_code']);

            $subtotal = 0;
            foreach ($items as $item) {
                $subtotal += $item['price'] * $item['quantity'];
            }

            $data['store_id'] = $store->id;
            $data['branch_id'] = $branchPusat;
            $data['subtotal'] = $subtotal;
            $data['discount_amount'] = 0;
            $data['tax_amount'] = 0;
            $data['shipping_amount'] = 0;
            $data['grand_total'] = $subtotal;
            $data['change_amount'] = $paidAmount - $subtotal;
            $data['paid_amount'] = $paidAmount;
            $data['pos_mode'] = 'retail';
            $data['status'] = 'completed';
            $data['payment_status'] = 'paid';

            $sale = Sale::create($data);

            foreach ($items as $item) {
                $itemSubtotal = $item['price'] * $item['quantity'];
                SaleItem::create([
                    'sale_id' => $sale->id,
                    'product_id' => $item['product_id'],
                    'variant_id' => $item['variant_id'] ?? null,
                    'quantity' => $item['quantity'],
                    'price' => $item['price'],
                    'discount_amount' => 0,
                    'subtotal' => $itemSubtotal,
                ]);

                // Kurangi stok — bucket-aware
                $stock = ProductStock::where('product_id', $item['product_id'])
                    ->where('variant_id', $item['variant_id'] ?? null)
                    ->where('packaging_unit_id', null)
                    ->where('store_id', $store->id)
                    ->where('branch_id', $branchPusat)
                    ->first();

                if ($stock) {
                    $stock->decrement('quantity', $item['quantity']);
                }
            }

            $methodId = PaymentMethod::where('store_id', $store->id)->where('code', 'like', $methodCode.'%')->value('id');
            SalePayment::create([
                'sale_id' => $sale->id,
                'payment_method_id' => $methodId,
                'paid_at' => $data['sale_date'],
                'amount' => $paidAmount,
            ]);
        }
    }
}
