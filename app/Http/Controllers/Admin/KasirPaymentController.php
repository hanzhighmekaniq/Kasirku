<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Concerns\HasStoreScope;
use App\Http\Controllers\Controller as BaseController;
use App\Models\CafeTable;
use App\Models\Category;
use App\Models\Customer;
use App\Models\Employee;
use App\Models\PaymentGatewayTransaction;
use App\Models\PaymentMethod;
use App\Models\PlatformPaymentGateway;
use App\Models\Product;
use App\Models\Promotion;
use App\Models\Sale;
use App\Models\Store;
use App\Models\User;
use App\Services\MembershipBenefitService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class KasirPaymentController extends BaseController
{
    use HasStoreScope;

    public function show(Request $request, string $saleNo)
    {
        /** @var User $user */
        $user = Auth::user();
        [$storeId, $branchId] = $this->storeScope();

        // Ambil pending sale berdasarkan sale_no (bukan ID)
        $sale = Sale::with([
            'items.product:id,store_id,name,sku,sell_price,cost_price',
            'items.product.variants:id,product_id,name,sku,price,cost_price,is_active',
            'items.product.modifierGroups.id,name',
            'items.product.packagingUnits',
            'items.product.priceTiers',
            'customer:id,name,phone,tier,points',
            'table:id,table_number,capacity,status',
        ])
            ->where('store_id', $storeId)
            ->whereIn('status', ['pending', 'completed'])
            ->where('sale_no', $saleNo)
            ->first();

        if (! $sale) {
            return redirect()->route('admin.kasir.index');
        }

        // Jika transaksi sudah selesai → redirect ke kasir biasa (refresh aman)
        if ($sale->status === 'completed') {
            return redirect()->route('admin.kasir.index');
        }

        // Ambil store type dari sale (jika ada) atau fallback ke user's default store
        $defaultStore = $user->stores()->with('storeType')->first();
        $storeTypeCode = $sale->pos_mode ?? ($defaultStore?->getRelation('storeType')?->code ?? 'retail');

        $store = Store::with('storeType')->find($storeId);
        $storeTypeFromStore = $store?->getRelation('storeType')?->code ?? $storeTypeCode;
        $storeTypeCode = $storeTypeFromStore;

        // Load relations needed for hasFeature() gate check
        $store?->load(['planModel.features', 'storeFeatures.feature']);

        // --- Load products (sama seperti KasirController@index) ---
        $products = Product::forStore($storeId)
            ->where('is_active', true)
            ->where('is_sellable', true)
            ->with([
                'category:id,name',
                'variants:id,product_id,name,sku,price,cost_price,is_active',
                'variants.priceTiers',
                'variants.packagingUnits',
                'modifierGroups.modifiers',
                'recipes.rawMaterial:id,name,unit,base_unit,cost_price',
                'stocks' => fn ($q) => $q->where('store_id', $storeId),
                'packagingUnits' => fn ($q) => $q->where('sell_price', '>', 0),
                'priceTiers',
            ])
            ->get()
            ->map(function ($p) use ($storeId) {
                $baseStocks = $p->stocks->filter(
                    fn ($s) => $s->variant_id === null && $s->packaging_unit_id === null,
                );
                $p->stock = $baseStocks->sum('quantity') - $baseStocks->sum('reserved_quantity');

                $p->variants->each(function ($v) use ($p) {
                    $variantStocks = $p->stocks->filter(
                        fn ($s) => $s->variant_id === $v->id && $s->packaging_unit_id === null,
                    );
                    $v->stock = $variantStocks->sum('quantity') - $variantStocks->sum('reserved_quantity');

                    $v->packagingUnits->each(function ($u) use ($p) {
                        $unitStocks = $p->stocks->filter(
                            fn ($s) => $s->packaging_unit_id === $u->id,
                        );
                        $u->stock = $unitStocks->sum('quantity') - $unitStocks->sum('reserved_quantity');
                    });
                });

                $p->packagingUnits->each(function ($u) use ($p) {
                    $unitStocks = $p->stocks->filter(
                        fn ($s) => $s->packaging_unit_id === $u->id,
                    );
                    $u->stock = $unitStocks->sum('quantity') - $unitStocks->sum('reserved_quantity');
                });

                $p->recipes->each(function ($r) use ($storeId) {
                    if ($r->rawMaterial) {
                        $r->rawMaterial->current_stock = $r->rawMaterial
                            ->stocks()
                            ->where('store_id', $storeId)
                            ->sum('quantity');
                    }
                });
                unset($p->stocks);

                return $p;
            });

        // --- Categories ---
        $categories = Category::forStore($storeId)
            ->withCount([
                'products' => fn ($q) => $q
                    ->where('is_active', true)
                    ->where('is_sellable', true),
            ])
            ->get(['id', 'name', 'products_count']);

        // --- Payment methods ---
        $paymentMethods = PaymentMethod::forStore($storeId)
            ->active()
            ->when(! $store->hasFeature('debt'), fn ($q) => $q->where('type', '!=', 'debt'))
            ->orderBy('sort_order')
            ->orderBy('type')
            ->get(['id', 'code', 'name', 'type', 'provider', 'image', 'account_number', 'account_name']);

        // --- Promotions ---
        $promotions = $store->hasFeature('promo')
            ? Promotion::forStore($storeId)
                ->where('is_active', true)
                ->where(function ($q) {
                    $q->whereNull('start_date')->orWhere('start_date', '<=', now());
                })
                ->where(function ($q) {
                    $q->whereNull('end_date')->orWhere('end_date', '>=', now());
                })
                ->where(function ($q) {
                    $q->whereNull('start_hour')->orWhere(
                        'start_hour',
                        '<=',
                        now()->format('H:i'),
                    );
                })
                ->where(function ($q) {
                    $q->whereNull('end_hour')->orWhere(
                        'end_hour',
                        '>=',
                        now()->format('H:i'),
                    );
                })
                ->with(['products:id', 'freeProduct:id,sell_price'])
                ->get([
                    'id',
                    'code',
                    'name',
                    'type',
                    'scope',
                    'discount_value',
                    'min_purchase_amount',
                    'max_discount_amount',
                    'min_quantity',
                    'tier_price',
                    'customer_tier',
                    'start_hour',
                    'end_hour',
                    'free_product_id',
                ])
            : collect();

        // --- Customers ---
        $customers = Customer::where('store_id', $storeId)
            ->orderBy('name')
            ->get([
                'id',
                'code',
                'name',
                'phone',
                'tier',
                'points',
                'total_spent',
                'debt_balance',
                'credit_limit',
            ]);

        // --- Tables (FnB & Hospitality only) ---
        $tables = [];
        if (in_array($storeTypeCode, ['fnb', 'hospitality'])) {
            $tables = CafeTable::where('store_id', $storeId)
                ->where('branch_id', $branchId)
                ->where('is_active', true)
                ->orderBy('table_number')
                ->get(['id', 'table_number', 'capacity', 'status']);
        }

        // --- Employees (Service & Ticket only) ---
        $employees = [];
        if (in_array($storeTypeCode, ['service', 'ticket'])) {
            $employees = Employee::where('store_id', $storeId)
                ->where('status', 'active')
                ->orderBy('name')
                ->get([
                    'id',
                    'name',
                    'position',
                    'commission_type',
                    'commission_value',
                ]);
        }

        // --- Today's sales ---
        $todaySales = Sale::where('store_id', $storeId)
            ->where('branch_id', $branchId)
            ->whereDate('sale_date', Carbon::today())
            ->with(['customer:id,name', 'payments.paymentMethod:id,name', 'splitPayers:id,sale_id,status'])
            ->orderByDesc('sale_date')
            ->limit(20)
            ->get([
                'id',
                'sale_no',
                'grand_total',
                'paid_amount',
                'payment_status',
                'order_type',
                'sale_date',
                'customer_id',
                'status',
                'split_status',
                'is_split_stale',
            ]);

        // --- Active shift ---
        $activeShift = DB::table('cashier_shifts')
            ->where('store_id', $storeId)
            ->where('user_id', $user->id)
            ->where('status', 'open')
            ->first();

        // --- Build pendingSale from the found sale ---
        $pendingSale = [
            'sale_id' => $sale->id,
            'sale_no' => $sale->sale_no,
            'grand_total' => (float) $sale->grand_total,
            'items' => $sale->items->map(fn ($i) => [
                'productId' => $i->product_id,
                'variantId' => $i->variant_id,
                'quantity' => (float) $i->quantity,
                'price' => (float) $i->price,
                'name' => $i->product?->name ?? 'Item',
            ])->toArray(),
        ];

        // --- Pending PG transaction ---
        $pendingPgTransaction = null;
        $initialPgTransaction = null;

        $pendingPg = PaymentGatewayTransaction::where('sale_id', $sale->id)
            ->whereNull('sale_split_payer_id')
            ->whereIn('status', ['initiating', 'pending', 'unknown', 'checking'])
            ->latest('id')
            ->first();

        if ($pendingPg) {
            $pendingPgTransaction = [
                'pg_trx_id' => $pendingPg->id,
                'payment_type' => $pendingPg->payment_type,
                'status' => $pendingPg->status,
                'amount' => (float) $pendingPg->amount,
                'can_retry' => $pendingPg->isRetryable(),
                'qr_code' => $pendingPg->raw_response['qr_code']
                    ?? $pendingPg->raw_response['qr_string']
                    ?? null,
                'qr_image_url' => $pendingPg->raw_response['qr_image_url']
                    ?? $pendingPg->raw_response['qr_url']
                    ?? null,
                'va_number' => $pendingPg->raw_response['va_numbers'][0]['va_number']
                    ?? $pendingPg->raw_response['permata_va_number']
                    ?? $pendingPg->raw_response['va_number']
                    ?? null,
                'va_bank' => $pendingPg->raw_response['va_numbers'][0]['bank']
                    ?? $pendingPg->raw_response['bank']
                    ?? null,
                'payment_url' => $pendingPg->raw_response['actions'][0]['url']
                    ?? null,
            ];

            $initialPgTransaction = [
                'pgTrxId' => $pendingPg->id,
                'amount' => (float) $pendingPg->amount,
                'saleId' => $sale->id,
                'saleNo' => $sale->sale_no,
                'change' => 0,
                'grandTotal' => (float) $sale->grand_total,
                'paymentType' => $pendingPg->payment_type,
                'qrCode' => $pendingPg->raw_response['qr_code']
                    ?? $pendingPg->raw_response['qr_string']
                    ?? null,
                'qrImageUrl' => $pendingPg->raw_response['qr_image_url']
                    ?? $pendingPg->raw_response['qr_url']
                    ?? null,
                'vaNumber' => $pendingPg->raw_response['va_numbers'][0]['va_number']
                    ?? $pendingPg->raw_response['permata_va_number']
                    ?? $pendingPg->raw_response['va_number']
                    ?? null,
                'vaBank' => $pendingPg->raw_response['va_numbers'][0]['bank']
                    ?? $pendingPg->raw_response['bank']
                    ?? null,
                'paymentUrl' => $pendingPg->raw_response['actions'][0]['url']
                    ?? null,
                'initialStatus' => $pendingPg->status ?? 'pending',
                'canRetry' => $pendingPg->isRetryable(),
            ];
        }

        // --- Map to page component ---
        $modePages = [
            'retail' => 'Admin/Kasir/modes/RetailKasir',
            'fnb' => 'Admin/Kasir/modes/FnBKasir',
            'service' => 'Admin/Kasir/modes/ServiceKasir',
            'rental' => 'Admin/Kasir/modes/RentalKasir',
            'ticket' => 'Admin/Kasir/modes/TicketKasir',
            'hospitality' => 'Admin/Kasir/modes/HospitalityKasir',
            'parking' => 'Admin/Kasir/modes/ParkingKasir',
            'session' => 'Admin/Kasir/modes/SessionKasir',
        ];

        $page = $modePages[$storeTypeCode] ?? 'Admin/Kasir/modes/RetailKasir';

        return Inertia::render($page, [
            'products' => $products,
            'categories' => $categories,
            'paymentMethods' => $paymentMethods,
            'promotions' => $promotions,
            'initialCustomers' => $customers,
            'tables' => $tables,
            'todaySales' => $todaySales,
            'storeType' => $storeTypeCode,
            'posMode' => $storeTypeCode,
            'storeName' => $store?->name ?? '',
            'receiptFooter' => $store?->receipt_footer ?? '',
            'receiptHeader' => $store?->receipt_header ?? '',
            'storeAddress' => $store?->address ?? '',
            'storePhone' => $store?->phone ?? '',
            'storeLogo' => $store?->logo ? "/storage/{$store->logo}" : null,
            'defaultTaxRate' => (float) ($store?->default_tax_rate ?? 0),
            'taxInclusive' => (bool) ($store?->tax_inclusive ?? false),
            'currency' => $store?->currency ?? 'IDR',
            'decimalPlaces' => (int) ($store?->decimal_places ?? 0),
            'pgMethods' => $this->getActivePgMethods($storeId),
            'activeShift' => $activeShift,
            'employees' => $employees,
            // Sama seperti halaman kasir utama: preview total di layar harus
            // memakai aturan benefit yang sama dengan hitungan server.
            'membershipBenefits' => $store->hasFeature('membership')
                ? app(MembershipBenefitService::class)
                    ->summaryForCustomers($customers->pluck('id')->all())
                : [],
            'pendingSale' => $pendingSale,
            'pendingPgTransaction' => $pendingPgTransaction,
            'initialPgTransaction' => $initialPgTransaction,
        ]);
    }

    /**
     * Ambil daftar metode PG aktif dari config platform.
     */
    private function getActivePgMethods(int $storeId): array
    {
        $gateways = PlatformPaymentGateway::where('is_active', true)->get();

        $methods = [];
        foreach ($gateways as $gw) {
            foreach ($gw->enabled_methods ?? [] as $method) {
                $methods[] = [
                    'provider' => $gw->provider,
                    'payment_type' => $method,
                ];
            }
        }

        return $methods;
    }
}
