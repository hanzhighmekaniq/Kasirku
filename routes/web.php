<?php

use App\Http\Controllers\Admin\ActivityLogController;
use App\Http\Controllers\Admin\BookingController;
use App\Http\Controllers\Admin\BranchSelectController;
use App\Http\Controllers\Admin\CafeTableController;
use App\Http\Controllers\Admin\CashierShiftController;
use App\Http\Controllers\Admin\CategoryController;
use App\Http\Controllers\Admin\CustomerController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\DebtController;
use App\Http\Controllers\Admin\EmployeeCommissionController;
use App\Http\Controllers\Admin\EmployeeController;
use App\Http\Controllers\Admin\ExpenseCategoryController;
use App\Http\Controllers\Admin\ExpenseController;
use App\Http\Controllers\Admin\KasirController;
use App\Http\Controllers\Admin\KitchenController;
use App\Http\Controllers\Admin\MasterDataController;
use App\Http\Controllers\Admin\MembershipController;
use App\Http\Controllers\Admin\MutationController;
use App\Http\Controllers\Admin\PaymentGatewayController;
use App\Http\Controllers\Admin\PaymentMethodController;
use App\Http\Controllers\Admin\ProductBarcodeController;
use App\Http\Controllers\Admin\ProductBatchController;
use App\Http\Controllers\Admin\ProductController;
use App\Http\Controllers\Admin\ProductModifierGroupController;
use App\Http\Controllers\Admin\ProductRecipeController;
use App\Http\Controllers\Admin\ProductVariantController;
use App\Http\Controllers\Admin\PromotionController;
use App\Http\Controllers\Admin\PurchaseController;
use App\Http\Controllers\Admin\PurchaseReturnController;
use App\Http\Controllers\Admin\ReportAIController;
use App\Http\Controllers\Admin\ReportController;
use App\Http\Controllers\Admin\RoleController;
use App\Http\Controllers\Admin\SaleController;
use App\Http\Controllers\Admin\SaleReturnController;
use App\Http\Controllers\Admin\SettingController;
use App\Http\Controllers\Admin\StockAdjustmentController;
use App\Http\Controllers\Admin\StockController;
use App\Http\Controllers\Admin\StockOpnameController;
use App\Http\Controllers\Admin\StockTransferController;
use App\Http\Controllers\Admin\StoreSwitchController;
use App\Http\Controllers\Admin\SupplierController;
use App\Http\Controllers\Admin\UserManagementController;
use App\Http\Controllers\Admin\WasteController;
use App\Http\Controllers\Developer\BranchController;
use App\Http\Controllers\Developer\DashboardController as DevDashboardController;
use App\Http\Controllers\Developer\PlanController;
use App\Http\Controllers\Developer\StoreController as DevStoreController;
use App\Http\Controllers\Developer\UserController as DevUserController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\WebhookController;
use App\Models\Branch;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;

// ─────────────────────────────────────────────────────────────────────────────
// Root redirect
// ─────────────────────────────────────────────────────────────────────────────
Route::get('/', function () {
    if (Auth::check()) {
        /** @var User $user */
        $user = Auth::user();

        if ($user->hasRole('developer')) {
            return redirect()->route('developer.dashboard');
        }

        return redirect()->route('admin.dashboard');
    }

    return redirect()->route('login');
});

// ─────────────────────────────────────────────────────────────────────────────
// Webhooks (no auth, no CSRF)
// ─────────────────────────────────────────────────────────────────────────────
Route::post('/webhooks/{provider}', [WebhookController::class, 'handle'])
    ->name('webhooks.handle')
    ->withoutMiddleware([VerifyCsrfToken::class]);

// ─────────────────────────────────────────────────────────────────────────────
// DEVELOPER routes — /developer/*
// Dunia terpisah, tidak pakai store/branch middleware
// ─────────────────────────────────────────────────────────────────────────────
Route::middleware(['auth', 'developer', 'single-session'])
    ->prefix('developer')
    ->name('developer.')
    ->group(function () {
        Route::get('/dashboard', [
            DevDashboardController::class,
            'index',
        ])->name('dashboard');

        // Store management
        Route::resource('stores', DevStoreController::class);
        Route::post('stores/{store}/assign-owner', [
            DevStoreController::class,
            'assignOwner',
        ])->name('stores.assign-owner');
        Route::delete('stores/{store}/revoke-owner', [
            DevStoreController::class,
            'revokeOwner',
        ])->name('stores.revoke-owner');

        // ── Branch management ─────────────────────────────────────────
        Route::resource('branches', BranchController::class)->names('branches');

        // ── User management ────────────────────────────────────────────
        Route::resource('users', DevUserController::class);
        Route::get('stores/{store}/branches-json', [
            DevUserController::class,
            'branches',
        ])->name('users.branches-json');

        // Plan / Paket — full CRUD
        Route::resource('plans', PlanController::class)->except(['show']);
        Route::post('plans/reorder', [PlanController::class, 'reorder'])->name(
            'plans.reorder',
        );

        // Fitur per Tipe Toko
        Route::get('/type-features', [
            DevStoreController::class,
            'typeFeatures',
        ])->name('type-features');
        Route::post('/type-features', [
            DevStoreController::class,
            'updateTypeFeatures',
        ])->name('type-features.update');

        // Role & Permission Management
        Route::get('/roles', [
            App\Http\Controllers\Developer\RoleController::class,
            'index',
        ])->name('roles.index');
        Route::post('/roles/update', [
            App\Http\Controllers\Developer\RoleController::class,
            'update',
        ])->name('roles.update');
        Route::post('/roles/reset', [
            App\Http\Controllers\Developer\RoleController::class,
            'reset',
        ])->name('roles.reset');

        // Profile
        Route::get('/profile', [ProfileController::class, 'edit'])->name(
            'profile.edit',
        );
        Route::patch('/profile', [ProfileController::class, 'update'])->name(
            'profile.update',
        );
        Route::delete('/profile', [ProfileController::class, 'destroy'])->name(
            'profile.destroy',
        );
    });

// ─────────────────────────────────────────────────────────────────────────────
// STORE routes — /app/*
// Semua role non-developer masuk sini.
// Middleware: auth + store (set Spatie team) + branch
// Permission check dilakukan per route group / controller.
// ─────────────────────────────────────────────────────────────────────────────
Route::middleware(['auth', 'single-session', 'store', 'branch'])
    ->prefix('app')
    ->name('admin.')
    ->group(function () {
        // ─────────────────────────────────────────────────────────────────
        // DASHBOARD
        // ─────────────────────────────────────────────────────────────────
        Route::middleware('feature:dashboard')->group(function () {
            Route::get('/dashboard', [
                DashboardController::class,
                'index',
            ])->name('dashboard');
        });

        // ── Store / Branch switcher (semua role yang punya multi-store) ────
        Route::get('/select-store', [
            StoreSwitchController::class,
            'selectForm',
        ])->name('store.select');
        Route::post('/select-store', [
            StoreSwitchController::class,
            'select',
        ])->name('store.select.post');
        Route::post('/switch-store', [
            StoreSwitchController::class,
            'switch',
        ])->name('store.switch');
        Route::get('/select-branch', [
            BranchSelectController::class,
            'selectForm',
        ])->name('branch.select');
        Route::post('/select-branch', [
            BranchSelectController::class,
            'select',
        ])->name('branch.select.post');
        Route::post('/switch-branch', [
            BranchSelectController::class,
            'switch',
        ])->name('branch.switch');

        // ── Profile ────────────────────────────────────────────────────────
        Route::get('/profile', [ProfileController::class, 'edit'])->name(
            'profile.edit',
        );
        Route::patch('/profile', [ProfileController::class, 'update'])->name(
            'profile.update',
        );
        Route::delete('/profile', [ProfileController::class, 'destroy'])->name(
            'profile.destroy',
        );

        // ── Offline sync ───────────────────────────────────────────────────
        Route::post('/mutations/sync', [
            MutationController::class,
            'sync',
        ])->name('mutations.sync');
        Route::get('/master-data', [
            MasterDataController::class,
            'index',
        ])->name('master-data');

        // ─────────────────────────────────────────────────────────────────
        // POS / KASIR — permission: sale.create + wajib shift aktif
        // ─────────────────────────────────────────────────────────────────
        Route::middleware([
            'feature:basic_pos',
            'permission:sale.create',
            'ensure.shift',
        ])->group(function () {
            Route::get('/kasir', [KasirController::class, 'index'])->name(
                'kasir.index',
            );
            Route::post('/kasir/store', [
                KasirController::class,
                'store',
            ])->name('kasir.store');

            // Payment gateway (untuk POS) — perlu fitur payment_gateway
            Route::middleware('feature:payment_gateway')->group(function () {
                Route::post('/payment-gateway/create', [
                    PaymentGatewayController::class,
                    'createTransaction',
                ])->name('payment-gateway.create-transaction');
                Route::get('/payment-gateway/{pgTrxId}/status', [
                    PaymentGatewayController::class,
                    'checkStatus',
                ])->name('payment-gateway.status');
                Route::get('/payment-gateway/pending', [
                    PaymentGatewayController::class,
                    'pendingTransactions',
                ])->name('payment-gateway.pending');
            });
        });

        // ─────────────────────────────────────────────────────────────────
        // SHIFT
        // ─────────────────────────────────────────────────────────────────
        Route::middleware(['feature:shift', 'permission:shift.view'])->group(
            function () {
                Route::get('/cashier-shifts', [
                    CashierShiftController::class,
                    'index',
                ])->name('cashier-shifts.index');
            },
        );
        Route::middleware(['feature:shift', 'permission:shift.open'])->group(
            function () {
                Route::get('/cashier-shifts/create', [
                    CashierShiftController::class,
                    'create',
                ])->name('cashier-shifts.create');
                Route::post('/cashier-shifts', [
                    CashierShiftController::class,
                    'store',
                ])->name('cashier-shifts.store');
            },
        );
        Route::middleware(['feature:shift', 'permission:shift.view'])->group(
            function () {
                Route::get('/cashier-shifts/{cashierShift}', [
                    CashierShiftController::class,
                    'show',
                ])->name('cashier-shifts.show');
            },
        );
        Route::middleware(['feature:shift', 'permission:shift.close'])->group(
            function () {
                Route::post('/cashier-shifts/{cashierShift}/close', [
                    CashierShiftController::class,
                    'close',
                ])->name('cashier-shifts.close');
            },
        );
        Route::middleware(['feature:shift', 'permission:shift.manage'])->group(
            function () {
                Route::patch('/cashier-shifts/{cashierShift}', [
                    CashierShiftController::class,
                    'update',
                ])->name('cashier-shifts.update');
                Route::delete('/cashier-shifts/{cashierShift}', [
                    CashierShiftController::class,
                    'destroy',
                ])->name('cashier-shifts.destroy');
                Route::post('/cashier-shifts/{cashierShift}/reopen', [
                    CashierShiftController::class,
                    'reopen',
                ])->name('cashier-shifts.reopen');
            },
        );

        // ─────────────────────────────────────────────────────────────────
        // PENJUALAN — permission: sale.view / sale.create
        // ─────────────────────────────────────────────────────────────────
        // PENTING: rute statis (/sales/create) HARUS didaftarkan sebelum
        // rute wildcard (/sales/{sale}), agar Laravel tidak salah mencocokkan
        // "create" sebagai parameter {sale}.
        Route::middleware([
            'feature:basic_pos',
            'permission:sale.create',
        ])->group(function () {
            Route::get('/sales/create', [
                SaleController::class,
                'create',
            ])->name('sales.create');
            Route::post('/sales', [SaleController::class, 'store'])->name(
                'sales.store',
            );
            Route::post('/sales/{sale}/switch-payment', [
                SaleController::class,
                'switchPayment',
            ])->name('sales.switchPayment');
        });
        Route::middleware(['feature:basic_pos', 'permission:sale.view'])->group(
            function () {
                Route::get('/sales', [SaleController::class, 'index'])->name(
                    'sales.index',
                );
                Route::get('/sales/{sale}', [
                    SaleController::class,
                    'show',
                ])->name('sales.show');
                Route::get('/sales/{sale}/print', [
                    SaleController::class,
                    'print',
                ])->name('sales.print');
            },
        );
        Route::middleware(['feature:basic_pos', 'permission:sale.void'])->group(
            function () {
                Route::patch('/sales/{sale}/status', [
                    SaleController::class,
                    'updateStatus',
                ])->name('sales.updateStatus');
                Route::delete('/sales/{sale}', [
                    SaleController::class,
                    'destroy',
                ])->name('sales.destroy');
            },
        );
        Route::middleware([
            'feature:basic_pos',
            'permission:sale.create',
        ])->group(function () {
            Route::patch('/sales/{sale}/service-status', [
                SaleController::class,
                'updateServiceStatus',
            ])->name('sales.updateServiceStatus');
            Route::patch('/sales/{sale}/rental-status', [
                SaleController::class,
                'updateRentalStatus',
            ])->name('sales.updateRentalStatus');
            Route::patch('/sales/{sale}/checkout', [
                SaleController::class,
                'checkOutHospitality',
            ])->name('sales.checkOutHospitality');
            Route::patch('/sales/{sale}/parking-exit', [
                SaleController::class,
                'exitParking',
            ])->name('sales.exitParking');
            Route::patch('/sales/{sale}/session-end', [
                SaleController::class,
                'endSession',
            ])->name('sales.endSession');
        });

        // ─────────────────────────────────────────────────────────────────
        // RETUR PENJUALAN — permission: sale.return
        // ─────────────────────────────────────────────────────────────────
        Route::middleware([
            'feature:sale_return',
            'permission:sale.return',
        ])->group(function () {
            Route::resource('sale-returns', SaleReturnController::class)->only([
                'index',
                'create',
                'store',
                'show',
                'destroy',
            ]);
            Route::patch('/sale-returns/{saleReturn}/status', [
                SaleReturnController::class,
                'updateStatus',
            ])->name('sale-returns.updateStatus');
            Route::get('/sale-returns/sale/{sale}/items', [
                SaleReturnController::class,
                'getSaleItems',
            ])->name('sale-returns.getSaleItems');
        });

        // ─────────────────────────────────────────────────────────────────
        // PRODUK — permission: product.*
        // ─────────────────────────────────────────────────────────────────
        // 1. Buat produk (static path — HARUS sebelum wildcard show)
        Route::middleware([
            'feature:product',
            'permission:product.create',
        ])->group(function () {
            Route::get('/products/create', [
                ProductController::class,
                'create',
            ])->name('products.create');
            Route::post('/products', [ProductController::class, 'store'])->name(
                'products.store',
            );
        });

        // 2. Lihat daftar & detail
        Route::middleware([
            'feature:product',
            'permission:product.view',
        ])->group(function () {
            Route::get('/products', [ProductController::class, 'index'])->name(
                'products.index',
            );
            Route::get('/products/by-barcode', [
                ProductBarcodeController::class,
                'findByBarcode',
            ])->name('products.by-barcode');
            Route::get('/products/{product}', [
                ProductController::class,
                'show',
            ])->name('products.show');
        });

        // 3. Edit produk
        Route::middleware(['permission:product.edit'])->group(function () {
            Route::get('/products/{product}/edit', [
                ProductController::class,
                'edit',
            ])->name('products.edit');
            Route::patch('/products/{product}', [
                ProductController::class,
                'update',
            ])->name('products.update');

            // Variant
            Route::resource(
                'products.variants',
                ProductVariantController::class,
            )->only(['index', 'store', 'update', 'destroy']);
        });

        // Recipe — feature:recipe + permission:product.edit
        Route::middleware(['feature:recipe', 'permission:product.edit'])->group(
            function () {
                Route::get('/products/{product}/recipes', [
                    ProductRecipeController::class,
                    'index',
                ])->name('products.recipes.index');
                Route::post('/products/{product}/recipes', [
                    ProductRecipeController::class,
                    'store',
                ])->name('products.recipes.store');
                Route::delete('/products/{product}/recipes/{recipe}', [
                    ProductRecipeController::class,
                    'destroy',
                ])->name('products.recipes.destroy');
            },
        );

        // Modifier — feature:modifier + permission:product.edit
        Route::middleware([
            'feature:modifier',
            'permission:product.edit',
        ])->group(function () {
            Route::resource(
                'modifier-groups',
                ProductModifierGroupController::class,
            );
            Route::post('/modifier-groups/{modifierGroup}/modifiers', [
                ProductModifierGroupController::class,
                'storeModifier',
            ])->name('modifier-groups.storeModifier');
            Route::patch(
                '/modifier-groups/{modifierGroup}/modifiers/{modifier}',
                [ProductModifierGroupController::class, 'updateModifier'],
            )->name('modifier-groups.updateModifier');
            Route::delete(
                '/modifier-groups/{modifierGroup}/modifiers/{modifier}',
                [ProductModifierGroupController::class, 'destroyModifier'],
            )->name('modifier-groups.destroyModifier');
            Route::post('/modifier-groups/{modifierGroup}/products', [
                ProductModifierGroupController::class,
                'attachProduct',
            ])->name('modifier-groups.attachProduct');
            Route::delete(
                '/modifier-groups/{modifierGroup}/products/{product}',
                [ProductModifierGroupController::class, 'detachProduct'],
            )->name('modifier-groups.detachProduct');
        });

        // 4. Hapus produk
        Route::middleware('permission:product.delete')->group(function () {
            Route::delete('/products/{product}', [
                ProductController::class,
                'destroy',
            ])->name('products.destroy');
        });

        // ─────────────────────────────────────────────────────────────────
        // KATEGORI & SUPPLIER
        // ─────────────────────────────────────────────────────────────────
        Route::middleware([
            'feature:category',
            'permission:product.view',
        ])->group(function () {
            Route::resource('categories', CategoryController::class);
        });
        Route::middleware([
            'feature:supplier',
            'permission:supplier.view',
        ])->group(function () {
            Route::resource('suppliers', SupplierController::class);
        });

        // ─────────────────────────────────────────────────────────────────
        // STOK — permission: stock.*
        // ─────────────────────────────────────────────────────────────────
        Route::middleware(['feature:stock', 'permission:stock.view'])->group(
            function () {
                Route::get('/stock', [StockController::class, 'index'])->name(
                    'stock.index',
                );
                Route::get('/stock/movements', [
                    StockController::class,
                    'movements',
                ])->name('stock.movements');
                Route::resource(
                    'product-batches',
                    ProductBatchController::class,
                )->except(['show']);
            },
        );
        Route::middleware([
            'feature:stock',
            'permission:stock.adjustment',
        ])->group(function () {
            Route::resource(
                'stock-adjustments',
                StockAdjustmentController::class,
            )->only(['index', 'create', 'store', 'show', 'destroy']);
            Route::patch('/stock-adjustments/{stockAdjustment}/status', [
                StockAdjustmentController::class,
                'updateStatus',
            ])->name('stock-adjustments.updateStatus');
            Route::post('/stock-adjustments/quick', [
                StockAdjustmentController::class,
                'quickStore',
            ])->name('stock-adjustments.quick');
        });
        Route::middleware([
            'feature:stock_opname',
            'permission:stock.opname',
        ])->group(function () {
            Route::resource(
                'stock-opnames',
                StockOpnameController::class,
            )->only(['index', 'create', 'store', 'show', 'destroy']);
            Route::patch('/stock-opnames/{stockOpname}/status', [
                StockOpnameController::class,
                'updateStatus',
            ])->name('stock-opnames.updateStatus');
        });
        Route::middleware([
            'feature:stock',
            'permission:stock.transfer',
        ])->group(function () {
            Route::resource(
                'stock-transfers',
                StockTransferController::class,
            )->only(['index', 'create', 'store', 'show', 'destroy']);
            Route::patch('/stock-transfers/{stockTransfer}/status', [
                StockTransferController::class,
                'updateStatus',
            ])->name('stock-transfers.updateStatus');
        });
        Route::middleware(['feature:waste', 'permission:stock.waste'])->group(
            function () {
                Route::resource('wastes', WasteController::class)->only([
                    'index',
                    'create',
                    'store',
                    'show',
                    'destroy',
                ]);
                Route::patch('/wastes/{waste}/status', [
                    WasteController::class,
                    'updateStatus',
                ])->name('wastes.updateStatus');
            },
        );

        // ─────────────────────────────────────────────────────────────────
        // PEMBELIAN — permission: purchase.*
        // ─────────────────────────────────────────────────────────────────
        // 1. Buat pembelian (static path — HARUS sebelum wildcard show)
        Route::middleware([
            'feature:purchase',
            'permission:purchase.create',
        ])->group(function () {
            Route::resource('purchases', PurchaseController::class)->only([
                'create',
                'store',
            ]);
            Route::patch('/purchases/{purchase}/status', [
                PurchaseController::class,
                'updateStatus',
            ])->name('purchases.updateStatus');
        });

        // 2. Lihat daftar & detail
        Route::middleware([
            'feature:purchase',
            'permission:purchase.view',
        ])->group(function () {
            Route::resource('purchases', PurchaseController::class)->only([
                'index',
                'show',
            ]);
        });

        // 3. Edit pembelian
        Route::middleware([
            'feature:purchase',
            'permission:purchase.edit',
        ])->group(function () {
            Route::get('/purchases/{purchase}/edit', [
                PurchaseController::class,
                'edit',
            ])->name('purchases.edit');
            Route::patch('/purchases/{purchase}', [
                PurchaseController::class,
                'update',
            ])->name('purchases.update');
        });

        // 4. Hapus pembelian
        Route::middleware([
            'feature:purchase',
            'permission:purchase.delete',
        ])->group(function () {
            Route::delete('/purchases/{purchase}', [
                PurchaseController::class,
                'destroy',
            ])->name('purchases.destroy');
        });
        Route::middleware([
            'feature:purchase',
            'permission:purchase.return',
        ])->group(function () {
            Route::resource(
                'purchase-returns',
                PurchaseReturnController::class,
            )->only(['index', 'create', 'store', 'show', 'destroy']);
            Route::patch('/purchase-returns/{purchaseReturn}/status', [
                PurchaseReturnController::class,
                'updateStatus',
            ])->name('purchase-returns.updateStatus');
            Route::get('/purchase-returns/purchase/{purchase}/items', [
                PurchaseReturnController::class,
                'getPurchaseItems',
            ])->name('purchase-returns.getPurchaseItems');
        });
        // ─────────────────────────────────────────────────────────────────
        // PELANGGAN — permission: customer.*
        // ─────────────────────────────────────────────────────────────────
        Route::middleware([
            'feature:customer',
            'permission:customer.view',
        ])->group(function () {
            Route::resource('customers', CustomerController::class);
            Route::post('/customers/{customer}/pay-debt', [CustomerController::class, 'payDebt'])->name('customers.pay-debt');
        });

        // ─────────────────────────────────────────────────────────────────
        // HUTANG / KASBON — permission: debt.*
        // ─────────────────────────────────────────────────────────────────
        Route::middleware([
            'feature:debt',
            'permission:debt.view',
        ])->group(function () {
            Route::get('/debts', [DebtController::class, 'index'])->name('debts.index');
            Route::post('/debts/{customer}/pay', [DebtController::class, 'pay'])->name('debts.pay');
        });

        // ─────────────────────────────────────────────────────────────────
        // BOOKING — permission: booking.view
        // ─────────────────────────────────────────────────────────────────
        Route::middleware([
            'feature:booking',
            'permission:booking.view',
        ])->group(function () {
            Route::get('/bookings', [BookingController::class, 'index'])->name(
                'bookings.index',
            );
            Route::post('/bookings', [BookingController::class, 'store'])->name(
                'bookings.store',
            );
            Route::patch('/bookings/{booking}', [
                BookingController::class,
                'update',
            ])->name('bookings.update');
            Route::delete('/bookings/{booking}', [
                BookingController::class,
                'destroy',
            ])->name('bookings.destroy');
        });

        // ─────────────────────────────────────────────────────────────────
        // MEMBERSHIP — permission: membership.*
        // ─────────────────────────────────────────────────────────────────
        Route::middleware([
            'feature:membership',
            'permission:membership.view',
        ])->group(function () {
            Route::get('/memberships', [
                MembershipController::class,
                'index',
            ])->name('memberships.index');
            Route::post('/memberships', [
                MembershipController::class,
                'store',
            ])->name('memberships.store');
            Route::patch('/memberships/{membership}', [
                MembershipController::class,
                'update',
            ])->name('memberships.update');
            Route::delete('/memberships/{membership}', [
                MembershipController::class,
                'destroy',
            ])->name('memberships.destroy');
        });

        // ─────────────────────────────────────────────────────────────────
        // KARYAWAN — permission: employee.*
        // ─────────────────────────────────────────────────────────────────
        Route::middleware([
            'feature:employee',
            'permission:employee.view',
        ])->group(function () {
            Route::resource('employees', EmployeeController::class)->except([
                'show',
            ]);
        });

        // ─────────────────────────────────────────────────────────────────
        // KOMISI KARYAWAN — permission: commission.view / commission.approve
        // ─────────────────────────────────────────────────────────────────
        Route::middleware([
            'feature:commission',
            'permission:commission.view',
        ])->group(function () {
            Route::get('/employee-commissions', [
                EmployeeCommissionController::class,
                'index',
            ])->name('employee-commissions.index');
        });
        Route::middleware([
            'feature:commission',
            'permission:commission.approve',
        ])->group(function () {
            Route::patch('/employee-commissions/{commission}/status', [
                EmployeeCommissionController::class,
                'updateStatus',
            ])->name('employee-commissions.update-status');
        });

        // ─────────────────────────────────────────────────────────────────
        // PENGELUARAN — permission: expense.*
        // ─────────────────────────────────────────────────────────────────
        Route::middleware([
            'feature:expense',
            'permission:expense.view',
        ])->group(function () {
            Route::resource('expenses', ExpenseController::class)->only([
                'index',
                'create',
                'store',
                'show',
                'destroy',
            ]);
            Route::patch('/expenses/{expense}/status', [
                ExpenseController::class,
                'updateStatus',
            ])->name('expenses.updateStatus');
            Route::resource(
                'expense-categories',
                ExpenseCategoryController::class,
            )->except(['show']);
        });

        // ─────────────────────────────────────────────────────────────────
        // PROMOSI — permission: promotion.*
        // ─────────────────────────────────────────────────────────────────
        // 1. Buat promo (static path — HARUS sebelum wildcard show)
        Route::middleware([
            'feature:promo',
            'permission:promotion.create',
        ])->group(function () {
            Route::resource('promotions', PromotionController::class)->only([
                'create',
                'store',
            ]);
        });

        // 2. Lihat daftar & detail
        Route::middleware([
            'feature:promo',
            'permission:promotion.view',
        ])->group(function () {
            Route::resource('promotions', PromotionController::class)->only([
                'index',
                'show',
            ]);
        });

        // 3. Edit promo
        Route::middleware([
            'feature:promo',
            'permission:promotion.edit',
        ])->group(function () {
            Route::resource('promotions', PromotionController::class)->only([
                'edit',
                'update',
            ]);
        });

        // 4. Hapus promo
        Route::middleware([
            'feature:promo',
            'permission:promotion.delete',
        ])->group(function () {
            Route::delete('/promotions/{promotion}', [
                PromotionController::class,
                'destroy',
            ])->name('promotions.destroy');
        });

        // ─────────────────────────────────────────────────────────────────
        // MEJA CAFE — permission: table.view / table.manage
        // ─────────────────────────────────────────────────────────────────
        Route::middleware(['feature:table', 'permission:table.view'])->group(
            function () {
                Route::resource(
                    'cafe-tables',
                    CafeTableController::class,
                )->except(['show']);
                Route::post('/cafe-tables/{cafeTable}/free', [
                    CafeTableController::class,
                    'freeTable',
                ])->name('cafe-tables.free');
            },
        );

        // ─────────────────────────────────────────────────────────────────
        // LAPORAN — permission: report.*
        // ─────────────────────────────────────────────────────────────────
        Route::middleware(['feature:report', 'permission:report.sales'])->group(
            function () {
                Route::get('/reports', [
                    ReportController::class,
                    'index',
                ])->name('reports.index');
                Route::post('/reports/ask-ai', [
                    ReportAIController::class,
                    'ask',
                ])->name('reports.ask-ai');
            },
        );

        // ─────────────────────────────────────────────────────────────────
        // ACTIVITY LOG — permission: setting.view
        // ─────────────────────────────────────────────────────────────────
        Route::middleware([
            'feature:activity_log',
            'permission:setting.view',
        ])->group(function () {
            Route::get('/activity-logs', [
                ActivityLogController::class,
                'index',
            ])->name('activity-logs.index');
        });

        // ─────────────────────────────────────────────────────────────────
        // SETTINGS — permission: setting.edit
        // ─────────────────────────────────────────────────────────────────
        Route::middleware([
            'feature:settings',
            'permission:setting.edit',
        ])->group(function () {
            Route::get('/settings', [SettingController::class, 'index'])->name(
                'settings.index',
            );
            Route::post('/settings', [
                SettingController::class,
                'update',
            ])->name('settings.update');
            Route::post('/settings/features', [
                SettingController::class,
                'updateFeatures',
            ])->name('settings.features.update');

        });
        Route::middleware([
            'feature:sidebar_order',
            'permission:setting.edit',
        ])->group(function () {
            Route::get('/sidebar-order', function () {
                return inertia('Admin/Settings/SidebarOrder');
            })->name('sidebar-order');
        });
        Route::middleware([
            'feature:payment_method',
            'permission:setting.edit',
        ])->group(function () {
            Route::resource(
                'payment-methods',
                PaymentMethodController::class,
            )->except(['show']);
            Route::patch('/payment-methods/{payment_method}/toggle', [
                PaymentMethodController::class,
                'toggleActive',
            ])->name('payment-methods.toggle');
            Route::patch('/payment-methods/{payment_method}/sort', [
                PaymentMethodController::class,
                'updateSort',
            ])->name('payment-methods.sort');
            Route::post('/payment-methods/pg/{provider}', [
                PaymentMethodController::class,
                'savePgSettings',
            ])->name('payment-methods.pg.save');
        });

        // ─────────────────────────────────────────────────────────────────
        // PAYMENT GATEWAY — permission: setting.edit
        // ─────────────────────────────────────────────────────────────────
        Route::middleware([
            'feature:payment_gateway',
            'permission:setting.edit',
        ])->group(function () {
            Route::get('/payment-gateway', [
                PaymentGatewayController::class,
                'index',
            ])->name('payment-gateway.index');
            Route::get('/payment-gateway/create', [
                PaymentGatewayController::class,
                'create',
            ])->name('payment-gateway.create');
            Route::post('/payment-gateway', [
                PaymentGatewayController::class,
                'store',
            ])->name('payment-gateway.store');
            Route::get('/payment-gateway/{store_payment_gateway}/edit', [
                PaymentGatewayController::class,
                'edit',
            ])->name('payment-gateway.edit');
            Route::put('/payment-gateway/{store_payment_gateway}', [
                PaymentGatewayController::class,
                'update',
            ])->name('payment-gateway.update');
            Route::delete('/payment-gateway/{store_payment_gateway}', [
                PaymentGatewayController::class,
                'destroy',
            ])->name('payment-gateway.destroy');
            Route::patch('/payment-gateway/{store_payment_gateway}/toggle', [
                PaymentGatewayController::class,
                'toggle',
            ])->name('payment-gateway.toggle');
            Route::patch('/payment-gateway/{store_payment_gateway}/env', [
                PaymentGatewayController::class,
                'toggleEnv',
            ])->name('payment-gateway.toggle-env');
        });

        // ─────────────────────────────────────────────────────────────────
        // KITCHEN DISPLAY — permission: kitchen.view / kitchen.update
        // ─────────────────────────────────────────────────────────────────
        Route::middleware([
            'feature:kitchen',
            'permission:kitchen.view',
        ])->group(function () {
            Route::get('/kitchen', [KitchenController::class, 'index'])->name(
                'kitchen.index',
            );
        });
        Route::middleware([
            'feature:kitchen',
            'permission:kitchen.update',
        ])->group(function () {
            Route::patch('/kitchen/{sale}/status', [
                KitchenController::class,
                'updateStatus',
            ])->name('kitchen.update-status');
        });

        // ─────────────────────────────────────────────────────────────────
        // ROLE & PERMISSION MANAGEMENT — hanya owner/developer
        // ─────────────────────────────────────────────────────────────────
        Route::middleware(['feature:role_management', 'role:owner'])->group(
            function () {
                Route::get('/roles', [RoleController::class, 'index'])->name(
                    'roles.index',
                );
                Route::post('/roles', [RoleController::class, 'store'])->name(
                    'roles.store',
                );
                Route::put('/roles/{role}', [
                    RoleController::class,
                    'update',
                ])->name('roles.update');
                Route::delete('/roles/{role}', [
                    RoleController::class,
                    'destroy',
                ])->name('roles.destroy');
                Route::post('/roles/{role}/duplicate', [
                    RoleController::class,
                    'duplicate',
                ])->name('roles.duplicate');
            },
        );
        Route::middleware(['feature:user_management', 'role:owner'])->group(
            function () {
                Route::get('/store-users', [
                    UserManagementController::class,
                    'index',
                ])->name('store-users.index');
                Route::post('/store-users/invite', [
                    UserManagementController::class,
                    'invite',
                ])->name('store-users.invite');
                Route::patch('/store-users/{user}/role', [
                    UserManagementController::class,
                    'assignRole',
                ])->name('store-users.assign-role');
                Route::delete('/store-users/{user}', [
                    UserManagementController::class,
                    'revoke',
                ])->name('store-users.revoke');
            },
        );
    });

require __DIR__.'/auth.php';
