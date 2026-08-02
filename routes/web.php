<?php

use App\Http\Controllers\Admin\ActivityLogController;
use App\Http\Controllers\Admin\BarcodeLabelController;
use App\Http\Controllers\Admin\BookingController;
use App\Http\Controllers\Admin\BranchSelectController;
use App\Http\Controllers\Admin\CafeTableController;
use App\Http\Controllers\Admin\CashierShiftController;
use App\Http\Controllers\Admin\CategoryController;
use App\Http\Controllers\Admin\CustomerController;
use App\Http\Controllers\Admin\CustomerTierController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\DebtController;
use App\Http\Controllers\Admin\EmployeeCommissionController;
use App\Http\Controllers\Admin\EmployeeController;
use App\Http\Controllers\Admin\ExpenseCategoryController;
use App\Http\Controllers\Admin\ExpenseController;
use App\Http\Controllers\Admin\KasirController;
use App\Http\Controllers\Admin\KasirPaymentController;
use App\Http\Controllers\Admin\KitchenController;
use App\Http\Controllers\Admin\MasterDataController;
use App\Http\Controllers\Admin\MembershipController;
use App\Http\Controllers\Admin\MutationController;
use App\Http\Controllers\Admin\NotificationController;
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
use App\Http\Controllers\Admin\QueueController;
use App\Http\Controllers\Admin\ReportAIController;
use App\Http\Controllers\Admin\ReportController;
use App\Http\Controllers\Admin\RoleController;
use App\Http\Controllers\Admin\SaleController;
use App\Http\Controllers\Admin\SaleReturnController;
use App\Http\Controllers\Admin\SettingController;
use App\Http\Controllers\Admin\SplitBillController;
use App\Http\Controllers\Admin\StockAdjustmentController;
use App\Http\Controllers\Admin\StockController;
use App\Http\Controllers\Admin\StockOpnameController;
use App\Http\Controllers\Admin\StockTransferController;
use App\Http\Controllers\Admin\StoreController;
use App\Http\Controllers\Admin\StoreSwitchController;
use App\Http\Controllers\Admin\SupplierController;
use App\Http\Controllers\Admin\ThemeController;
use App\Http\Controllers\Admin\UserManagementController;
use App\Http\Controllers\Admin\WalletController as AdminWalletController;
use App\Http\Controllers\Admin\WasteController;
use App\Http\Controllers\Developer\AuditLogController;
use App\Http\Controllers\Developer\BranchController;
use App\Http\Controllers\Developer\BusinessTemplateController;
use App\Http\Controllers\Developer\DashboardController as DevDashboardController;
use App\Http\Controllers\Developer\FeatureController;
use App\Http\Controllers\Developer\PaymentGatewayController as DevPaymentGatewayController;
use App\Http\Controllers\Developer\PlanController;
use App\Http\Controllers\Developer\PlanOrderController;
use App\Http\Controllers\Developer\RoleTemplateController;
use App\Http\Controllers\Developer\StoreController as DevStoreController;
use App\Http\Controllers\Developer\StoreTypeController;
use App\Http\Controllers\Developer\ThemeController as DevThemeController;
use App\Http\Controllers\Developer\UserController as DevUserController;
use App\Http\Controllers\Developer\WalletController as DevWalletController;
use App\Http\Controllers\ImpersonationController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SidebarPreferenceController;
use App\Http\Controllers\ThemePreferenceController;
use App\Http\Controllers\ThemePresetController;
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

        /*
        |--------------------------------------------------------------------
        | Akses semua level developer (Super Admin & Support)
        |--------------------------------------------------------------------
        | Melihat data, impersonate untuk diagnosis, dan menulis catatan
        | internal — inti pekerjaan support. Semua aksi impersonate tercatat
        | di audit log.
        */

        // Daftar (index) — aman didaftarkan lebih dulu, tidak ada wildcard.
        Route::get('stores', [DevStoreController::class, 'index'])->name('stores.index');
        Route::get('branches', [BranchController::class, 'index'])->name('branches.index');
        Route::get('users', [DevUserController::class, 'index'])->name('users.index');

        // ── Impersonation ("login sebagai") ─────────────────────────────
        Route::post('stores/{store}/impersonate/{user}', [
            ImpersonationController::class,
            'start',
        ])->name('stores.impersonate');

        // ── Catatan internal developer per toko ─────────────────────────
        Route::post('stores/{store}/notes', [
            DevStoreController::class,
            'storeNote',
        ])->name('stores.notes.store');
        Route::delete('stores/{store}/notes/{note}', [
            DevStoreController::class,
            'destroyNote',
        ])->name('stores.notes.destroy');

        Route::get('stores/{store}/branches-json', [
            DevUserController::class,
            'branches',
        ])->name('users.branches-json');

        /*
        |--------------------------------------------------------------------
        | Khusus Super Admin
        |--------------------------------------------------------------------
        | Aksi destruktif (hapus toko/cabang/user) dan perubahan konfigurasi
        | platform (plan, jenis usaha, template bisnis, fitur, payment
        | gateway, role) — di luar wewenang support agent.
        */
        Route::middleware('super-admin')->group(function () {
            // Store — buat, ubah (termasuk plan & suspend), hapus
            Route::get('stores/create', [DevStoreController::class, 'create'])->name('stores.create');
            Route::post('stores', [DevStoreController::class, 'store'])->name('stores.store');
            Route::get('stores/{store}/edit', [DevStoreController::class, 'edit'])->name('stores.edit');
            Route::match(['put', 'patch'], 'stores/{store}', [DevStoreController::class, 'update'])->name('stores.update');
            Route::delete('stores/{store}', [DevStoreController::class, 'destroy'])->name('stores.destroy');

            Route::post('stores/{store}/assign-owner', [
                DevStoreController::class,
                'assignOwner',
            ])->name('stores.assign-owner');
            Route::delete('stores/{store}/revoke-owner', [
                DevStoreController::class,
                'revokeOwner',
            ])->name('stores.revoke-owner');

            // Branch — buat, ubah, hapus
            Route::get('branches/create', [BranchController::class, 'create'])->name('branches.create');
            Route::post('branches', [BranchController::class, 'store'])->name('branches.store');
            Route::get('branches/{branch}/edit', [BranchController::class, 'edit'])->name('branches.edit');
            Route::match(['put', 'patch'], 'branches/{branch}', [BranchController::class, 'update'])->name('branches.update');
            Route::delete('branches/{branch}', [BranchController::class, 'destroy'])->name('branches.destroy');

            // User — buat, ubah, hapus
            Route::get('users/create', [DevUserController::class, 'create'])->name('users.create');
            Route::post('users', [DevUserController::class, 'store'])->name('users.store');
            Route::get('users/{user}/edit', [DevUserController::class, 'edit'])->name('users.edit');
            Route::match(['put', 'patch'], 'users/{user}', [DevUserController::class, 'update'])->name('users.update');
            Route::delete('users/{user}', [DevUserController::class, 'destroy'])->name('users.destroy');
        });

        // Detail (show) — WAJIB didaftarkan setelah route `create`/`edit` di
        // atas. Kalau lebih dulu, wildcard {store} akan menangkap URL
        // `stores/create` dan model binding gagal.
        Route::get('stores/{store}', [DevStoreController::class, 'show'])->name('stores.show');
        Route::get('branches/{branch}', [BranchController::class, 'show'])->name('branches.show');
        Route::get('users/{user}', [DevUserController::class, 'show'])->name('users.show');

        /*
        |--------------------------------------------------------------------
        | Konfigurasi platform — Super Admin saja
        |--------------------------------------------------------------------
        | Plan, jenis usaha, template bisnis, fitur sistem, role, payment
        | gateway, dan penyesuaian saldo wallet. Semuanya berdampak ke
        | seluruh toko di platform, jadi di luar wewenang support agent.
        */
        Route::middleware('super-admin')->group(function () {
            // Plan / Paket — full CRUD
            Route::resource('plans', PlanController::class)->except(['show']);
            Route::post('plans/reorder', [PlanController::class, 'reorder'])->name('plans.reorder');

            // Kelola fitur dan add-on per plan (halaman terpisah dari form edit)
            Route::get('plans/{plan}/features', [PlanController::class, 'features'])->name('plans.features');
            Route::put('plans/{plan}/features', [PlanController::class, 'updateFeatures'])->name('plans.update-features');
            Route::get('plans/{plan}/addons', [PlanController::class, 'addons'])->name('plans.addons');
            Route::post('plans/{plan}/addons', [PlanController::class, 'storeAddon'])->name('plans.addons.store');
            Route::put('plans/{plan}/addons/{addon}', [PlanController::class, 'updateAddon'])->name('plans.addons.update');
            Route::delete('plans/{plan}/addons/{addon}', [PlanController::class, 'destroyAddon'])->name('plans.addons.destroy');

            // Jenis Usaha (Store Type) — full CRUD
            Route::resource('store-types', StoreTypeController::class)->except(['show']);
            Route::post('store-types/reorder', [StoreTypeController::class, 'reorder'])->name('store-types.reorder');

            // Template Bisnis — metadata + kategori & produk contoh (nested, data-driven)
            Route::resource('business-templates', BusinessTemplateController::class)->except(['show']);
            Route::get('business-templates/{businessTemplate}/categories', [BusinessTemplateController::class, 'categories'])->name('business-templates.categories');
            Route::post('business-templates/{businessTemplate}/categories', [BusinessTemplateController::class, 'storeCategory'])->name('business-templates.categories.store');
            Route::put('business-templates/{businessTemplate}/categories/{category}', [BusinessTemplateController::class, 'updateCategory'])->name('business-templates.categories.update');
            Route::delete('business-templates/{businessTemplate}/categories/{category}', [BusinessTemplateController::class, 'destroyCategory'])->name('business-templates.categories.destroy');
            Route::post('business-templates/{businessTemplate}/categories/{category}/products', [BusinessTemplateController::class, 'storeProduct'])->name('business-templates.categories.products.store');
            Route::put('business-templates/{businessTemplate}/categories/{category}/products/{product}', [BusinessTemplateController::class, 'updateProduct'])->name('business-templates.categories.products.update');
            Route::delete('business-templates/{businessTemplate}/categories/{category}/products/{product}', [BusinessTemplateController::class, 'destroyProduct'])->name('business-templates.categories.products.destroy');

            // Fitur Sistem (Feature) — full CRUD + detail fitur nested
            Route::resource('features', FeatureController::class)->except(['show']);
            Route::get('features/{feature}/details', [FeatureController::class, 'details'])->name('features.details');
            Route::post('features/{feature}/details', [FeatureController::class, 'storeDetail'])->name('features.details.store');
            Route::put('features/{feature}/details/{detail}', [FeatureController::class, 'updateDetail'])->name('features.details.update');
            Route::delete('features/{feature}/details/{detail}', [FeatureController::class, 'destroyDetail'])->name('features.details.destroy');

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

            // ── Payment Gateway (platform-level, satu akun untuk semua store) ──
            Route::get('/payment-gateway', [
                DevPaymentGatewayController::class,
                'index',
            ])->name('payment-gateway.index');
            Route::post('/payment-gateway', [
                DevPaymentGatewayController::class,
                'store',
            ])->name('payment-gateway.store');
            Route::put('/payment-gateway/{paymentGateway}', [
                DevPaymentGatewayController::class,
                'update',
            ])->name('payment-gateway.update');
            Route::delete('/payment-gateway/{paymentGateway}', [
                DevPaymentGatewayController::class,
                'destroy',
            ])->name('payment-gateway.destroy');
            Route::patch('/payment-gateway/{paymentGateway}/toggle', [
                DevPaymentGatewayController::class,
                'toggle',
            ])->name('payment-gateway.toggle');
            Route::patch('/payment-gateway/{paymentGateway}/env', [
                DevPaymentGatewayController::class,
                'toggleEnv',
            ])->name('payment-gateway.toggle-env');

            // Penyesuaian saldo wallet — menyentuh uang, super admin saja.
            Route::post('/wallets/{store}/adjust', [
                DevWalletController::class,
                'adjust',
            ])->name('wallets.adjust');

            // ── Template Role — role default yang dibuat saat toko baru lahir,
            //    beserta cakupan tipe tokonya. Perubahan langsung disinkron ke
            //    semua toko yang cocok (tambah/update saja, tidak menghapus).
            Route::get('/role-templates', [
                RoleTemplateController::class,
                'index',
            ])->name('role-templates.index');
            Route::post('/role-templates', [
                RoleTemplateController::class,
                'store',
            ])->name('role-templates.store');
            Route::put('/role-templates/{roleTemplate}', [
                RoleTemplateController::class,
                'update',
            ])->name('role-templates.update');
            Route::put('/role-templates/{roleTemplate}/permissions', [
                RoleTemplateController::class,
                'updatePermissions',
            ])->name('role-templates.permissions');
            Route::delete('/role-templates/{roleTemplate}', [
                RoleTemplateController::class,
                'destroy',
            ])->name('role-templates.destroy');
        });

        // ── Wallet — saldo semua store (lihat saja, support boleh) ──────
        Route::get('/wallets', [
            DevWalletController::class,
            'index',
        ])->name('wallets.index');
        Route::get('/wallets/{store}', [
            DevWalletController::class,
            'show',
        ])->name('wallets.show');

        // ── Tema & Warna — personal per-akun developer ─────────────────
        // Preset sistem (is_system=true) hanya bisa dipakai, tidak bisa
        // diubah/hapus dari sini — diblok di controller.
        Route::resource('themes', DevThemeController::class)
            ->parameters(['themes' => 'theme'])
            ->except(['show']);

        // Audit Log — aksi developer terhadap data platform
        Route::get('/audit-log', [AuditLogController::class, 'index'])->name('audit-log.index');

        // Plan Orders — kelola order upgrade plan dari toko
        // Approve (super admin) dipisah karena berdampak ke plan toko
        Route::get('/plan-orders', [PlanOrderController::class, 'index'])->name('plan-orders.index');
        Route::middleware('super-admin')->group(function () {
            Route::post('/plan-orders/{order}/approve', [PlanOrderController::class, 'approve'])->name('plan-orders.approve');
            Route::post('/plan-orders/{order}/reject', [PlanOrderController::class, 'reject'])->name('plan-orders.reject');
        });

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

// ── Kembali dari impersonation — diakses saat login sebagai user toko,
//    jadi harus di luar group middleware 'developer' (guard saat itu bukan
//    developer). Cukup 'auth' karena impersonation sudah login sebagai user.
Route::post('/stop-impersonating', [ImpersonationController::class, 'stop'])
    ->middleware(['auth'])
    ->name('stop-impersonating');

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

        // ── Theme preference (Theme Engine) ─────────────────────────────────
        Route::patch(
            '/theme-preference',
            [ThemePreferenceController::class, 'update'],
        )->name('theme-preference.update');

        // ── Sidebar preference (custom layout: urutan grup, urutan item,
        //    pemindahan item antar grup) ───────────────────────────────────
        Route::patch(
            '/sidebar-preference',
            [SidebarPreferenceController::class, 'update'],
        )->name('sidebar-preference.update');

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

            // New payment flow (phase-split)
            Route::post('/kasir/start', [KasirController::class, 'start'])->name('kasir.start');
            Route::post('/kasir/finalize', [KasirController::class, 'finalize'])->name('kasir.finalize');
            Route::post('/kasir/cancel-pending/{sale}', [KasirController::class, 'cancelPending'])->name('kasir.cancel-pending');

            // History actions
            Route::post('/kasir/sales/{sale}/void', [KasirController::class, 'voidSale'])->name('kasir.void-sale');
            Route::put('/kasir/sales/{sale}/payment', [KasirController::class, 'updatePayment'])->name('kasir.update-payment');

            // Split bill
            Route::post('/kasir/split/start', [SplitBillController::class, 'start'])->name('kasir.split.start');
            Route::post('/kasir/split/pay-offline', [SplitBillController::class, 'payOffline'])->name('kasir.split.pay-offline');
            Route::post('/kasir/split/create-pg', [SplitBillController::class, 'createPg'])->name('kasir.split.create-pg');
            Route::get('/kasir/split/{sale}', [SplitBillController::class, 'show'])->name('kasir.split.show');
            Route::post('/kasir/split/{sale}/cancel', [SplitBillController::class, 'cancel'])->name('kasir.split.cancel');

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
                Route::post('/payment-gateway/retry', [
                    PaymentGatewayController::class,
                    'retryTransaction',
                ])->name('payment-gateway.retry');
            });
        });

        // ─────────────────────────────────────────────────────────────────
        // PAYMENT URL ROUTE — deep link untuk pending sale payment
        // ─────────────────────────────────────────────────────────────────
        Route::get('/kasir/payment/{saleNo}', [
            KasirPaymentController::class,
            'show',
        ])->name('kasir.payment.show');

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
        // ─────────────────────────────────────────────────────────────────
        // PENJUALAN — riwayat read-only (create/store via Kasir POS saja)
        // ─────────────────────────────────────────────────────────────────
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
        // destroy: owner-only (sale.delete)
        Route::middleware(['feature:basic_pos', 'permission:sale.delete'])->group(
            function () {
                Route::delete('/sales/{sale}', [
                    SaleController::class,
                    'destroy',
                ])->name('sales.destroy');
            },
        );
        // Lifecycle endpoints untuk tipe toko non-retail (service/rental/hospitality/parking/session)
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
            Route::get('/products/export/template', [ProductController::class, 'exportTemplate'])->name('products.export-template');
            Route::get('/barcode-labels', [BarcodeLabelController::class, 'index'])->name('barcode-labels.index');
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
            Route::post('/products/import', [ProductController::class, 'import'])->name('products.import');

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
            },
        );

        // ─────────────────────────────────────────────────────────────────
        // BATCH & KADALUARSA — feature:batch_expired + permission:batch.*
        // Dipisah dari feature:stock supaya bisa dinyalakan/matikan sendiri.
        // ─────────────────────────────────────────────────────────────────
        Route::middleware(['feature:batch_expired', 'permission:batch.view'])->group(
            function () {
                Route::resource(
                    'product-batches',
                    ProductBatchController::class,
                )->except(['show']);
                Route::get('product-batches-unbatched', [
                    ProductBatchController::class,
                    'unbatchedSales',
                ])->name('product-batches.unbatched');
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
            Route::post('/customers/{customer}/assign-membership', [CustomerController::class, 'assignMembership'])
                ->middleware(['feature:membership', 'permission:customer.edit'])
                ->name('customers.assign-membership');
            Route::delete('/customer-memberships/{customerMembership}', [CustomerController::class, 'revokeMembership'])
                ->middleware(['feature:membership', 'permission:customer.edit'])
                ->name('customer-memberships.revoke');
            Route::post('/customers/{customer}/pay-debt', [CustomerController::class, 'payDebt'])->name('customers.pay-debt');
            Route::get('/customers/{customer}/points', [CustomerController::class, 'pointHistory'])->name('customers.points');
            Route::post('/customers/{customer}/points/adjust', [CustomerController::class, 'adjustPoints'])->name('customers.points.adjust')->middleware('permission:customer.edit');
        });

        // ─────────────────────────────────────────────────────────────────
        // HUTANG / KASBON — permission: debt.*
        // ─────────────────────────────────────────────────────────────────
        Route::middleware([
            'feature:debt',
            'permission:debt.view',
        ])->group(function () {
            Route::get('/debts', [DebtController::class, 'index'])->name('debts.index');
            Route::get('/debts/aging', [DebtController::class, 'aging'])->name('debts.aging');
            Route::post('/debts/{customer}/pay', [DebtController::class, 'pay'])->name('debts.pay');
        });

        // ─────────────────────────────────────────────────────────────────
        // BOOKING — permission: booking.view / create / edit / cancel
        //
        // Dulu keempat route ini sama-sama hanya butuh booking.view, jadi
        // user yang cuma boleh melihat tetap bisa membuat dan menghapus
        // booking. Nama permission mengikuti PermissionSeeder — penghapusan
        // memakai booking.cancel, bukan booking.delete.
        // ─────────────────────────────────────────────────────────────────
        Route::middleware(['feature:booking'])->group(function () {
            Route::get('/bookings', [BookingController::class, 'index'])
                ->middleware('permission:booking.view')
                ->name('bookings.index');
            // Harus di atas /bookings/{booking}, kalau tidak "create"
            // ditangkap sebagai ID booking.
            Route::get('/bookings/create', [BookingController::class, 'create'])
                ->middleware('permission:booking.create')
                ->name('bookings.create');
            Route::post('/bookings', [BookingController::class, 'store'])
                ->middleware('permission:booking.create')
                ->name('bookings.store');
            Route::get('/bookings/{booking}', [BookingController::class, 'show'])
                ->middleware('permission:booking.view')
                ->name('bookings.show');
            Route::get('/bookings/{booking}/edit', [BookingController::class, 'edit'])
                ->middleware('permission:booking.edit')
                ->name('bookings.edit');
            Route::patch('/bookings/{booking}', [
                BookingController::class,
                'update',
            ])->middleware('permission:booking.edit')->name('bookings.update');
            Route::delete('/bookings/{booking}', [
                BookingController::class,
                'destroy',
            ])->middleware('permission:booking.cancel')->name('bookings.destroy');
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
            // Form create/edit dipindah dari modal ke halaman sendiri karena
            // field-nya banyak (durasi, harga, auto-tier, builder benefit).
            Route::get('/memberships/create', [
                MembershipController::class,
                'create',
            ])->name('memberships.create');
            Route::post('/memberships', [
                MembershipController::class,
                'store',
            ])->name('memberships.store');
            Route::get('/memberships/{membership}', [
                MembershipController::class,
                'show',
            ])->name('memberships.show');
            Route::get('/memberships/{membership}/edit', [
                MembershipController::class,
                'edit',
            ])->name('memberships.edit');
            Route::patch('/memberships/{membership}', [
                MembershipController::class,
                'update',
            ])->name('memberships.update');
            Route::delete('/memberships/{membership}', [
                MembershipController::class,
                'destroy',
            ])->name('memberships.destroy');

            // Level tier pelanggan — hierarki yang dipakai membership & promo.
            // Ikut gate membership karena tier hanya berarti bersama fitur ini.
            Route::get('/customer-tiers', [
                CustomerTierController::class,
                'index',
            ])->name('customer-tiers.index');
            Route::post('/customer-tiers', [
                CustomerTierController::class,
                'store',
            ])->name('customer-tiers.store');
            Route::post('/customer-tiers/reorder', [
                CustomerTierController::class,
                'reorder',
            ])->name('customer-tiers.reorder');
            Route::patch('/customer-tiers/{customerTier}', [
                CustomerTierController::class,
                'update',
            ])->name('customer-tiers.update');
            Route::delete('/customer-tiers/{customerTier}', [
                CustomerTierController::class,
                'destroy',
            ])->name('customer-tiers.destroy');
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

        // Modal "Set Komisi" di index — dipisah dari form edit lengkap
        // supaya owner bisa ganti rate komisi tanpa membuka semua field lain.
        Route::middleware([
            'feature:employee',
            'permission:employee.edit',
        ])->group(function () {
            Route::patch('/employees/{employee}/commission', [
                EmployeeController::class,
                'updateCommission',
            ])->name('employees.update-commission');
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
        Route::middleware(['feature:report', 'permission:report.purchase'])->group(function () {
            Route::get('/reports/profit-loss', [ReportController::class, 'profitLoss'])->name('reports.profit-loss');
            Route::get('/reports/sales-by-employee', [ReportController::class, 'salesByEmployee'])->name('reports.sales-by-employee');
            Route::get('/reports/purchases', [ReportController::class, 'purchases'])->name('reports.purchases');
        });
        Route::middleware(['feature:report', 'permission:report.stock'])->group(function () {
            Route::get('/reports/stock', [ReportController::class, 'stock'])->name('reports.stock');
        });
        Route::middleware(['feature:report', 'permission:report.expense'])->group(function () {
            Route::get('/reports/expenses', [ReportController::class, 'expenses'])->name('reports.expenses');
        });
        Route::middleware(['feature:report', 'permission:report.shift'])->group(function () {
            Route::get('/reports/shifts', [ReportController::class, 'shifts'])->name('reports.shifts');
        });
        Route::middleware(['feature:report', 'permission:report.commission'])->group(function () {
            Route::get('/reports/commissions', [ReportController::class, 'commissions'])->name('reports.commissions');
        });

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
        // PLAN — pilih & upgrade paket (semua role yang punya akses toko)
        // ─────────────────────────────────────────────────────────────────
        Route::get('/plan', [App\Http\Controllers\Admin\PlanController::class, 'index'])->name('plan.index');
        Route::post('/plan/order', [App\Http\Controllers\Admin\PlanController::class, 'store'])->name('plan.order');
        Route::get('/plan/confirm/{orderRef}', [App\Http\Controllers\Admin\PlanController::class, 'confirm'])->name('plan.confirm');

        // ─────────────────────────────────────────────────────────────────
        // STORES — tambah toko baru (self-service, cek max_stores dari plan)
        // ─────────────────────────────────────────────────────────────────
        Route::get('/stores/create', [StoreController::class, 'create'])->name('stores.create');
        Route::post('/stores', [StoreController::class, 'store'])->name('stores.store');

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
            Route::put('/settings/branches/{branch}', [
                SettingController::class,
                'updateBranch',
            ])->name('settings.branch.update');

        });

        // Notifications
        Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
        Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead'])->name('notifications.read');
        Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead'])->name('notifications.read-all');
        Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount'])->name('notifications.unread-count');

        Route::middleware([
            'feature:sidebar_order',
            'permission:setting.edit',
        ])->group(function () {
            Route::get('/sidebar-order', function () {
                return inertia('Admin/Settings/SidebarOrder');
            })->name('sidebar-order');
        });

        // Theme Picker lama — redirect ke halaman CRUD tema baru.
        Route::get('/theme', function () {
            return redirect()->route('admin.themes.index');
        })->name('theme.picker');

        Route::post('/theme-presets', [ThemePresetController::class, 'store'])
            ->name('theme-presets.store');
        Route::delete('/theme-presets/{preset}', [ThemePresetController::class, 'destroy'])
            ->name('theme-presets.destroy');

        // CRUD tema custom (theme presets) — personal per-akun. Preset
        // is_system=true (tema built-in) diblok edit/hapus di controller.
        Route::resource('themes', ThemeController::class)
            ->parameters(['themes' => 'theme'])
            ->except(['show']);
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
        });

        // ─────────────────────────────────────────────────────────────────
        // PAYMENT GATEWAY — info page (dikelola platform, bukan per-store)
        // permission: setting.edit
        // ─────────────────────────────────────────────────────────────────
        Route::middleware([
            'feature:payment_gateway',
            'permission:setting.edit',
        ])->group(function () {
            Route::get('/payment-gateway', [
                PaymentGatewayController::class,
                'index',
            ])->name('payment-gateway.index');
        });

        // ─────────────────────────────────────────────────────────────────
        // WALLET — saldo dari pembayaran PG, permission: setting.view
        // ─────────────────────────────────────────────────────────────────
        Route::middleware([
            'feature:payment_gateway',
            'permission:setting.view',
        ])->group(function () {
            Route::get('/wallet', [
                AdminWalletController::class,
                'index',
            ])->name('wallet.index');
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
        // QUEUE / ANTRIAN
        // ─────────────────────────────────────────────────────────────────
        Route::middleware(['permission:queue.view'])->group(function () {
            Route::get('/queue', [QueueController::class, 'index'])->name('queue.index');
        });
        Route::middleware(['permission:queue.create'])->group(function () {
            Route::post('/queue', [QueueController::class, 'store'])->name('queue.store');
        });
        Route::middleware(['permission:queue.update'])->group(function () {
            Route::patch('/queue/{queue}/status', [QueueController::class, 'updateStatus'])->name('queue.update-status');
            Route::delete('/queue/{queue}', [QueueController::class, 'destroy'])->name('queue.destroy');
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
