<?php

namespace Database\Seeders\DatabaseSeeder;

use App\Models\Branch;
use App\Models\CafeTable;
use App\Models\Customer;
use App\Models\PaymentMethod;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\SalePayment;
use App\Models\Store;
use App\Models\User;
use Illuminate\Database\Seeder;

class FnbSaleSeeder extends Seeder
{
    public function run(): void
    {
        $store = Store::where('code', 'STORE002')->firstOrFail();
        $br2a = Branch::where('store_id', $store->id)->where('code', 'BR2A')->value('id');
        $br2b = Branch::where('store_id', $store->id)->where('code', 'BR2B')->value('id');
        $kasir1 = User::where('email', 'kasir.malioboro@gmail.com')->value('id');
        $kasir2 = User::where('email', 'kasir.ugm@gmail.com')->value('id');

        $pid = fn ($sku) => Product::where('store_id', $store->id)->where('sku', $sku)->value('id');
        $cid = fn ($code) => Customer::where('store_id', $store->id)->where('code', $code)->value('id');
        $tid = fn ($branch, $num) => CafeTable::where('branch_id', $branch)->where('table_number', $num)->value('id');
        $pmid = fn ($code) => PaymentMethod::where('store_id', $store->id)->where('code', 'like', $code.'%')->value('id');

        $sales = [
            // ── BR2A Malioboro — Dine In ──────────────────────────────
            [
                'sale_no' => 'SL-FNB-20260717-001',
                'sale_date' => '2026-07-17 09:00:00',
                'branch_id' => $br2a,
                'user_id' => $kasir1,
                'customer_id' => $cid('CSTF2-002'),
                'pos_mode' => 'fnb',
                'order_type' => 'dine_in',
                'table_id' => $tid($br2a, 'A1'),
                'queue_number' => 'Q001',
                'kitchen_status' => 'served',
                'guest_count' => 2,
                'items' => [
                    ['sku' => 'F2-004', 'qty' => 2, 'price' => 27000, 'modifiers' => [['name' => 'Tingkat Es', 'value' => 'Es Normal'], ['name' => 'Ukuran', 'value' => 'Regular (250ml)']]],
                    ['sku' => 'F2-020', 'qty' => 1, 'price' => 22000, 'modifiers' => []],
                ],
                'method' => 'QRIS', 'paid_amount' => 76000,
            ],
            [
                'sale_no' => 'SL-FNB-20260717-002',
                'sale_date' => '2026-07-17 10:15:00',
                'branch_id' => $br2a,
                'user_id' => $kasir1,
                'customer_id' => null,
                'pos_mode' => 'fnb',
                'order_type' => 'dine_in',
                'table_id' => $tid($br2a, 'B1'),
                'queue_number' => 'Q002',
                'kitchen_status' => 'served',
                'guest_count' => 4,
                'items' => [
                    ['sku' => 'F2-007', 'qty' => 2, 'price' => 28000, 'modifiers' => [['name' => 'Tingkat Gula', 'value' => '75%']]],
                    ['sku' => 'F2-003', 'qty' => 2, 'price' => 25000, 'modifiers' => [['name' => 'Tingkat Es', 'value' => 'Panas']]],
                    ['sku' => 'F2-031', 'qty' => 2, 'price' => 30000, 'modifiers' => []],
                ],
                'method' => 'CASH', 'paid_amount' => 166000,
            ],
            [
                'sale_no' => 'SL-FNB-20260717-003',
                'sale_date' => '2026-07-17 11:30:00',
                'branch_id' => $br2a,
                'user_id' => $kasir1,
                'customer_id' => $cid('CSTF2-001'),
                'pos_mode' => 'fnb',
                'order_type' => 'takeaway',
                'table_id' => null,
                'queue_number' => 'Q003',
                'kitchen_status' => 'served',
                'guest_count' => 0,
                'items' => [
                    ['sku' => 'F2-006', 'qty' => 1, 'price' => 28000, 'modifiers' => [['name' => 'Topping', 'value' => 'Boba Pearl']]],
                    ['sku' => 'F2-011', 'qty' => 1, 'price' => 30000, 'modifiers' => []],
                    ['sku' => 'F2-032', 'qty' => 1, 'price' => 18000, 'modifiers' => []],
                ],
                'method' => 'GOPAY', 'paid_amount' => 76000,
            ],
            // ── BR2A — Delivery ───────────────────────────────────────
            [
                'sale_no' => 'SL-FNB-20260717-004',
                'sale_date' => '2026-07-17 13:00:00',
                'branch_id' => $br2a,
                'user_id' => $kasir1,
                'customer_id' => null,
                'pos_mode' => 'fnb',
                'order_type' => 'delivery',
                'table_id' => null,
                'queue_number' => 'Q004',
                'kitchen_status' => 'served',
                'guest_count' => 0,
                'delivery_address' => 'Jl. Malioboro No. 50, Yogyakarta',
                'delivery_platform' => 'gofood',
                'delivery_order_no' => 'GF-20260717-0012',
                'items' => [
                    ['sku' => 'F2-005', 'qty' => 1, 'price' => 32000, 'modifiers' => [['name' => 'Ukuran', 'value' => 'Large (350ml)']]],
                    ['sku' => 'F2-022', 'qty' => 1, 'price' => 35000, 'modifiers' => []],
                ],
                'method' => 'GOPAY', 'paid_amount' => 67000,
            ],
            [
                'sale_no' => 'SL-FNB-20260718-001',
                'sale_date' => '2026-07-18 08:30:00',
                'branch_id' => $br2a,
                'user_id' => $kasir1,
                'customer_id' => $cid('CSTF2-005'),
                'pos_mode' => 'fnb',
                'order_type' => 'dine_in',
                'table_id' => $tid($br2a, 'A3'),
                'queue_number' => 'Q001',
                'kitchen_status' => 'served',
                'guest_count' => 1,
                'items' => [
                    ['sku' => 'F2-C002', 'qty' => 1, 'price' => 45000, 'modifiers' => []],
                ],
                'method' => 'OVO', 'paid_amount' => 45000,
            ],
            [
                'sale_no' => 'SL-FNB-20260718-002',
                'sale_date' => '2026-07-18 10:00:00',
                'branch_id' => $br2a,
                'user_id' => $kasir1,
                'customer_id' => null,
                'pos_mode' => 'fnb',
                'order_type' => 'dine_in',
                'table_id' => $tid($br2a, 'O1'),
                'queue_number' => 'Q002',
                'kitchen_status' => 'served',
                'guest_count' => 2,
                'items' => [
                    ['sku' => 'F2-002', 'qty' => 2, 'price' => 20000, 'modifiers' => [['name' => 'Tingkat Es', 'value' => 'Extra Es']]],
                    ['sku' => 'F2-030', 'qty' => 2, 'price' => 22000, 'modifiers' => []],
                ],
                'method' => 'CASH', 'paid_amount' => 84000,
            ],
            [
                'sale_no' => 'SL-FNB-20260719-001',
                'sale_date' => '2026-07-19 09:00:00',
                'branch_id' => $br2a,
                'user_id' => $kasir1,
                'customer_id' => $cid('CSTF2-003'),
                'pos_mode' => 'fnb',
                'order_type' => 'takeaway',
                'table_id' => null,
                'queue_number' => 'Q001',
                'kitchen_status' => 'served',
                'guest_count' => 0,
                'items' => [
                    ['sku' => 'F2-008', 'qty' => 1, 'price' => 28000, 'modifiers' => [['name' => 'Topping', 'value' => 'Boba Pearl']]],
                    ['sku' => 'F2-012', 'qty' => 1, 'price' => 22000, 'modifiers' => [['name' => 'Tingkat Gula', 'value' => 'Extra Manis']]],
                ],
                'method' => 'DANA', 'paid_amount' => 52000,
            ],
            [
                'sale_no' => 'SL-FNB-20260720-001',
                'sale_date' => '2026-07-20 14:00:00',
                'branch_id' => $br2a,
                'user_id' => $kasir1,
                'customer_id' => $cid('CSTF2-002'),
                'pos_mode' => 'fnb',
                'order_type' => 'dine_in',
                'table_id' => $tid($br2a, 'B2'),
                'queue_number' => 'Q003',
                'kitchen_status' => 'served',
                'guest_count' => 3,
                'items' => [
                    ['sku' => 'F2-C001', 'qty' => 2, 'price' => 40000, 'modifiers' => []],
                    ['sku' => 'F2-009', 'qty' => 1, 'price' => 35000, 'modifiers' => []],
                ],
                'method' => 'QRIS', 'paid_amount' => 115000,
            ],
            // ── BR2B UGM ─────────────────────────────────────────────
            [
                'sale_no' => 'SL-FNB-20260717-005',
                'sale_date' => '2026-07-17 09:30:00',
                'branch_id' => $br2b,
                'user_id' => $kasir2,
                'customer_id' => $cid('CSTF2-004'),
                'pos_mode' => 'fnb',
                'order_type' => 'dine_in',
                'table_id' => $tid($br2b, 'C1'),
                'queue_number' => 'Q001',
                'kitchen_status' => 'served',
                'guest_count' => 2,
                'items' => [
                    ['sku' => 'F2-004', 'qty' => 1, 'price' => 27000, 'modifiers' => [['name' => 'Tingkat Es', 'value' => 'Panas']]],
                    ['sku' => 'F2-023', 'qty' => 1, 'price' => 20000, 'modifiers' => []],
                ],
                'method' => 'CASH', 'paid_amount' => 47000,
            ],
            [
                'sale_no' => 'SL-FNB-20260718-003',
                'sale_date' => '2026-07-18 11:00:00',
                'branch_id' => $br2b,
                'user_id' => $kasir2,
                'customer_id' => $cid('CSTF2-005'),
                'pos_mode' => 'fnb',
                'order_type' => 'dine_in',
                'table_id' => $tid($br2b, 'C2'),
                'queue_number' => 'Q002',
                'kitchen_status' => 'served',
                'guest_count' => 2,
                'items' => [
                    ['sku' => 'F2-007', 'qty' => 2, 'price' => 28000, 'modifiers' => [['name' => 'Tingkat Gula', 'value' => 'Normal']]],
                    ['sku' => 'F2-024', 'qty' => 2, 'price' => 32000, 'modifiers' => []],
                ],
                'method' => 'QRIS', 'paid_amount' => 120000,
            ],
            [
                'sale_no' => 'SL-FNB-20260719-002',
                'sale_date' => '2026-07-19 12:30:00',
                'branch_id' => $br2b,
                'user_id' => $kasir2,
                'customer_id' => null,
                'pos_mode' => 'fnb',
                'order_type' => 'delivery',
                'table_id' => null,
                'queue_number' => 'Q003',
                'kitchen_status' => 'served',
                'guest_count' => 0,
                'delivery_address' => 'Jl. Kaliurang Km 7, Sleman',
                'delivery_platform' => 'grabfood',
                'delivery_order_no' => 'GB-20260719-0044',
                'items' => [
                    ['sku' => 'F2-003', 'qty' => 2, 'price' => 25000, 'modifiers' => [['name' => 'Ukuran', 'value' => 'Large (350ml)']]],
                    ['sku' => 'F2-021', 'qty' => 2, 'price' => 20000, 'modifiers' => []],
                ],
                'method' => 'GOPAY', 'paid_amount' => 90000,
            ],
            [
                'sale_no' => 'SL-FNB-20260720-002',
                'sale_date' => '2026-07-20 15:00:00',
                'branch_id' => $br2b,
                'user_id' => $kasir2,
                'customer_id' => $cid('CSTF2-001'),
                'pos_mode' => 'fnb',
                'order_type' => 'takeaway',
                'table_id' => null,
                'queue_number' => 'Q004',
                'kitchen_status' => 'served',
                'guest_count' => 0,
                'items' => [
                    ['sku' => 'F2-001', 'qty' => 1, 'price' => 18000, 'modifiers' => []],
                    ['sku' => 'F2-013', 'qty' => 1, 'price' => 16000, 'modifiers' => [['name' => 'Tingkat Es', 'value' => 'Es Sedikit']]],
                    ['sku' => 'F2-031', 'qty' => 1, 'price' => 30000, 'modifiers' => []],
                ],
                'method' => 'CASH', 'paid_amount' => 64000,
            ],
        ];

        foreach ($sales as $data) {
            $items = $data['items'];
            $paidAmount = $data['paid_amount'];
            $method = $data['method'];
            unset($data['items'], $data['paid_amount'], $data['method']);

            $subtotal = 0;
            foreach ($items as $item) {
                $subtotal += $item['price'] * $item['qty'];
            }

            $data['store_id'] = $store->id;
            $data['subtotal'] = $subtotal;
            $data['discount_amount'] = 0;
            $data['tax_amount'] = 0;
            $data['shipping_amount'] = 0;
            $data['grand_total'] = $subtotal;
            $data['paid_amount'] = $paidAmount;
            $data['change_amount'] = max(0, $paidAmount - $subtotal);
            $data['status'] = 'completed';
            $data['payment_status'] = 'paid';

            // Nullify optional FnB fields if not set
            foreach (['table_id', 'delivery_address', 'delivery_platform', 'delivery_order_no'] as $f) {
                if (! isset($data[$f])) {
                    $data[$f] = null;
                }
            }

            $sale = Sale::create($data);

            foreach ($items as $item) {
                $productId = $pid($item['sku']);
                $itemSubtotal = $item['price'] * $item['qty'];

                SaleItem::create([
                    'sale_id' => $sale->id,
                    'product_id' => $productId,
                    'variant_id' => null,
                    'quantity' => $item['qty'],
                    'price' => $item['price'],
                    'discount_amount' => 0,
                    'subtotal' => $itemSubtotal,
                    'modifiers' => ! empty($item['modifiers']) ? $item['modifiers'] : null,
                ]);
            }

            $methodId = $pmid($method);
            if ($methodId) {
                SalePayment::create([
                    'sale_id' => $sale->id,
                    'payment_method_id' => $methodId,
                    'paid_at' => $data['sale_date'],
                    'amount' => $paidAmount,
                ]);
            }
        }
    }
}
