<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\WebhookController;
use App\Http\Controllers\Admin\ActivityLogController;
use App\Http\Controllers\Admin\BookingController;
use App\Http\Controllers\Admin\BranchSelectController;
use App\Http\Controllers\Admin\CafeTableController;
use App\Http\Controllers\Admin\CashierShiftController;
use App\Http\Controllers\Admin\CategoryController;
use App\Http\Controllers\Admin\CustomerController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\EmployeeController;
use App\Http\Controllers\Admin\ExpenseCategoryController;
use App\Http\Controllers\Admin\ExpenseController;
use App\Http\Controllers\Admin\KasirController;
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
use App\Http\Controllers\Developer\BranchController as DevBranchController;
use App\Http\Controllers\Developer\DashboardController as DevDashboardController;
use App\Http\Controllers\Developer\StoreController as DevStoreController;
use App\Http\Controllers\Developer\UserController as DevUserController;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;

// ─────────────────────────────────────────────────────────────────────────────
// Root redirect
// ─────────────────────────────────────────────────────────────────────────────
Route::get("/", function () {
    if (Auth::check()) {
        /** @var User $user */
        $user = Auth::user();

        if ($user->hasRole("developer")) {
            return redirect()->route("developer.dashboard");
        }

        return redirect()->route("admin.dashboard");
    }

    return redirect()->route("login");
});

// ─────────────────────────────────────────────────────────────────────────────
// Webhooks (no auth, no CSRF)
// ─────────────────────────────────────────────────────────────────────────────
Route::post("/webhooks/{provider}", [WebhookController::class, "handle"])
    ->name("webhooks.handle")
    ->withoutMiddleware([
        \Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class,
    ]);

// ─────────────────────────────────────────────────────────────────────────────
// DEVELOPER routes — /developer/*
// Dunia terpisah, tidak pakai store/branch middleware
// ─────────────────────────────────────────────────────────────────────────────
Route::middleware(["auth", "developer"])
    ->prefix("developer")
    ->name("developer.")
    ->group(function () {
        Route::get("/dashboard", [
            DevDashboardController::class,
            "index",
        ])->name("dashboard");

        // Store management
        Route::resource("stores", DevStoreController::class);
        Route::post("stores/{store}/assign-owner", [
            DevStoreController::class,
            "assignOwner",
        ])->name("stores.assign-owner");
        Route::delete("stores/{store}/revoke-owner", [
            DevStoreController::class,
            "revokeOwner",
        ])->name("stores.revoke-owner");

        // Branch management
        Route::get("/branches", [DevBranchController::class, "allIndex"])->name(
            "branches.index",
        );
        Route::resource("stores.branches", DevBranchController::class)->except([
            "show",
        ]);

        // User management (global)
        Route::resource("users", DevUserController::class);
        Route::get("stores/{store}/branches-json", [
            DevUserController::class,
            "branches",
        ])->name("users.branches-json");

        // Plan / Paket — full CRUD
        Route::resource(
            "plans",
            \App\Http\Controllers\Developer\PlanController::class,
        )->except(["show"]);

        // Fitur per Tipe Toko
        Route::get("/type-features", [
            DevStoreController::class,
            "typeFeatures",
        ])->name("type-features");
        Route::post("/type-features", [
            DevStoreController::class,
            "updateTypeFeatures",
        ])->name("type-features.update");

        // Profile
        Route::get("/profile", [ProfileController::class, "edit"])->name(
            "profile.edit",
        );
        Route::patch("/profile", [ProfileController::class, "update"])->name(
            "profile.update",
        );
        Route::delete("/profile", [ProfileController::class, "destroy"])->name(
            "profile.destroy",
        );
    });

// ─────────────────────────────────────────────────────────────────────────────
// STORE routes — /app/*
// Semua role non-developer masuk sini.
// Middleware: auth + store (set Spatie team) + branch
// Permission check dilakukan per route group / controller.
// ─────────────────────────────────────────────────────────────────────────────
Route::middleware(["auth", "store", "branch"])
    ->prefix("app")
    ->name("admin.")
    ->group(function () {
        // ── Dashboard ──────────────────────────────────────────────────────
        Route::get("/dashboard", [DashboardController::class, "index"])->name(
            "dashboard",
        );

        // ── Store / Branch switcher (semua role yang punya multi-store) ────
        Route::get("/select-store", [
            StoreSwitchController::class,
            "selectForm",
        ])->name("store.select");
        Route::post("/select-store", [
            StoreSwitchController::class,
            "select",
        ])->name("store.select.post");
        Route::post("/switch-store", [
            StoreSwitchController::class,
            "switch",
        ])->name("store.switch");
        Route::get("/select-branch", [
            BranchSelectController::class,
            "selectForm",
        ])->name("branch.select");
        Route::post("/select-branch", [
            BranchSelectController::class,
            "select",
        ])->name("branch.select.post");
        Route::post("/switch-branch", [
            BranchSelectController::class,
            "switch",
        ])->name("branch.switch");

        // ── Profile ────────────────────────────────────────────────────────
        Route::get("/profile", [ProfileController::class, "edit"])->name(
            "profile.edit",
        );
        Route::patch("/profile", [ProfileController::class, "update"])->name(
            "profile.update",
        );
        Route::delete("/profile", [ProfileController::class, "destroy"])->name(
            "profile.destroy",
        );

        // ── Offline sync ───────────────────────────────────────────────────
        Route::post("/mutations/sync", [
            MutationController::class,
            "sync",
        ])->name("mutations.sync");
        Route::get("/master-data", [
            MasterDataController::class,
            "index",
        ])->name("master-data");

        // ─────────────────────────────────────────────────────────────────
        // POS / KASIR — permission: sale.create
        // ─────────────────────────────────────────────────────────────────
        Route::middleware("permission:sale.create")->group(function () {
            Route::get("/kasir", [KasirController::class, "index"])->name(
                "kasir.index",
            );
            Route::post("/kasir/store", [
                KasirController::class,
                "store",
            ])->name("kasir.store");

            // Payment gateway (untuk POS)
            Route::post("/payment-gateway/create", [
                PaymentGatewayController::class,
                "createTransaction",
            ])->name("payment-gateway.create");
            Route::get("/payment-gateway/{pgTrxId}/status", [
                PaymentGatewayController::class,
                "checkStatus",
            ])->name("payment-gateway.status");
            Route::get("/payment-gateway/pending", [
                PaymentGatewayController::class,
                "pendingTransactions",
            ])->name("payment-gateway.pending");
        });

        // ─────────────────────────────────────────────────────────────────
        // SHIFT — permission: shift.open / shift.view
        // ─────────────────────────────────────────────────────────────────
        Route::middleware("permission:shift.view")->group(function () {
            Route::get("/cashier-shifts", [
                CashierShiftController::class,
                "index",
            ])->name("cashier-shifts.index");
            Route::get("/cashier-shifts/{cashierShift}", [
                CashierShiftController::class,
                "show",
            ])->name("cashier-shifts.show");
        });
        Route::middleware("permission:shift.open")->group(function () {
            Route::get("/cashier-shifts/create", [
                CashierShiftController::class,
                "create",
            ])->name("cashier-shifts.create");
            Route::post("/cashier-shifts", [
                CashierShiftController::class,
                "store",
            ])->name("cashier-shifts.store");
            Route::post("/cashier-shifts/{cashierShift}/close", [
                CashierShiftController::class,
                "close",
            ])->name("cashier-shifts.close");
        });
        // Admin override (owner/admin) — edit, hapus, buka ulang shift
        Route::middleware("role:owner,admin")->group(function () {
            Route::patch("/cashier-shifts/{cashierShift}", [
                CashierShiftController::class,
                "update",
            ])->name("cashier-shifts.update");
            Route::delete("/cashier-shifts/{cashierShift}", [
                CashierShiftController::class,
                "destroy",
            ])->name("cashier-shifts.destroy");
            Route::post("/cashier-shifts/{cashierShift}/reopen", [
                CashierShiftController::class,
                "reopen",
            ])->name("cashier-shifts.reopen");
        });

        // ─────────────────────────────────────────────────────────────────
        // PENJUALAN — permission: sale.view / sale.create
        // ─────────────────────────────────────────────────────────────────
        Route::middleware("permission:sale.view")->group(function () {
            Route::get("/sales", [SaleController::class, "index"])->name(
                "sales.index",
            );
            Route::get("/sales/{sale}", [SaleController::class, "show"])->name(
                "sales.show",
            );
            Route::get("/sales/{sale}/print", [
                SaleController::class,
                "print",
            ])->name("sales.print");
        });
        Route::middleware("permission:sale.create")->group(function () {
            Route::get("/sales/create", [
                SaleController::class,
                "create",
            ])->name("sales.create");
            Route::post("/sales", [SaleController::class, "store"])->name(
                "sales.store",
            );
            Route::post("/sales/{sale}/switch-payment", [
                SaleController::class,
                "switchPayment",
            ])->name("sales.switchPayment");
        });
        Route::middleware("permission:sale.void")->group(function () {
            Route::patch("/sales/{sale}/status", [
                SaleController::class,
                "updateStatus",
            ])->name("sales.updateStatus");
            Route::delete("/sales/{sale}", [
                SaleController::class,
                "destroy",
            ])->name("sales.destroy");
        });

        // ─────────────────────────────────────────────────────────────────
        // RETUR PENJUALAN — permission: sale.return
        // ─────────────────────────────────────────────────────────────────
        Route::middleware("permission:sale.return")->group(function () {
            Route::resource("sale-returns", SaleReturnController::class)->only([
                "index",
                "create",
                "store",
                "show",
                "destroy",
            ]);
            Route::patch("/sale-returns/{saleReturn}/status", [
                SaleReturnController::class,
                "updateStatus",
            ])->name("sale-returns.updateStatus");
            Route::get("/sale-returns/sale/{sale}/items", [
                SaleReturnController::class,
                "getSaleItems",
            ])->name("sale-returns.getSaleItems");
        });

        // ─────────────────────────────────────────────────────────────────
        // PRODUK — permission: product.view / product.create / dll
        // ─────────────────────────────────────────────────────────────────
        Route::middleware("permission:product.view")->group(function () {
            Route::get("/products", [ProductController::class, "index"])->name(
                "products.index",
            );
            Route::get("/products/{product}", [
                ProductController::class,
                "show",
            ])->name("products.show");
            Route::get("/products/by-barcode", [
                ProductBarcodeController::class,
                "findByBarcode",
            ])->name("products.by-barcode");
        });
        Route::middleware("permission:product.create")->group(function () {
            Route::get("/products/create", [
                ProductController::class,
                "create",
            ])->name("products.create");
            Route::post("/products", [ProductController::class, "store"])->name(
                "products.store",
            );
        });
        Route::middleware("permission:product.edit")->group(function () {
            Route::get("/products/{product}/edit", [
                ProductController::class,
                "edit",
            ])->name("products.edit");
            Route::patch("/products/{product}", [
                ProductController::class,
                "update",
            ])->name("products.update");

            // Variant
            Route::resource(
                "products.variants",
                ProductVariantController::class,
            )->only(["index", "store", "update", "destroy"]);

            // Recipe
            Route::get("/products/{product}/recipes", [
                ProductRecipeController::class,
                "index",
            ])->name("products.recipes.index");
            Route::post("/products/{product}/recipes", [
                ProductRecipeController::class,
                "store",
            ])->name("products.recipes.store");
            Route::delete("/products/{product}/recipes/{recipe}", [
                ProductRecipeController::class,
                "destroy",
            ])->name("products.recipes.destroy");

            // Modifier groups
            Route::resource(
                "modifier-groups",
                ProductModifierGroupController::class,
            );
            Route::post("/modifier-groups/{modifierGroup}/modifiers", [
                ProductModifierGroupController::class,
                "storeModifier",
            ])->name("modifier-groups.storeModifier");
            Route::patch(
                "/modifier-groups/{modifierGroup}/modifiers/{modifier}",
                [ProductModifierGroupController::class, "updateModifier"],
            )->name("modifier-groups.updateModifier");
            Route::delete(
                "/modifier-groups/{modifierGroup}/modifiers/{modifier}",
                [ProductModifierGroupController::class, "destroyModifier"],
            )->name("modifier-groups.destroyModifier");
            Route::post("/modifier-groups/{modifierGroup}/products", [
                ProductModifierGroupController::class,
                "attachProduct",
            ])->name("modifier-groups.attachProduct");
            Route::delete(
                "/modifier-groups/{modifierGroup}/products/{product}",
                [ProductModifierGroupController::class, "detachProduct"],
            )->name("modifier-groups.detachProduct");
        });
        Route::middleware("permission:product.delete")->group(function () {
            Route::delete("/products/{product}", [
                ProductController::class,
                "destroy",
            ])->name("products.destroy");
        });

        // ─────────────────────────────────────────────────────────────────
        // KATEGORI & SUPPLIER
        // ─────────────────────────────────────────────────────────────────
        Route::middleware("permission:product.view")->group(function () {
            Route::resource("categories", CategoryController::class);
        });
        Route::middleware("permission:supplier.view")->group(function () {
            Route::resource("suppliers", SupplierController::class);
        });

        // ─────────────────────────────────────────────────────────────────
        // STOK — permission: stock.*
        // ─────────────────────────────────────────────────────────────────
        Route::middleware("permission:stock.view")->group(function () {
            Route::get("/stock", [StockController::class, "index"])->name(
                "stock.index",
            );
            Route::get("/stock/movements", [
                StockController::class,
                "movements",
            ])->name("stock.movements");
            Route::resource(
                "product-batches",
                ProductBatchController::class,
            )->except(["show"]);
        });
        Route::middleware("permission:stock.adjustment")->group(function () {
            Route::resource(
                "stock-adjustments",
                StockAdjustmentController::class,
            )->only(["index", "create", "store", "show", "destroy"]);
            Route::patch("/stock-adjustments/{stockAdjustment}/status", [
                StockAdjustmentController::class,
                "updateStatus",
            ])->name("stock-adjustments.updateStatus");
        });
        Route::middleware("permission:stock.opname")->group(function () {
            Route::resource(
                "stock-opnames",
                StockOpnameController::class,
            )->only(["index", "create", "store", "show", "destroy"]);
            Route::patch("/stock-opnames/{stockOpname}/status", [
                StockOpnameController::class,
                "updateStatus",
            ])->name("stock-opnames.updateStatus");
        });
        Route::middleware("permission:stock.transfer")->group(function () {
            Route::resource(
                "stock-transfers",
                StockTransferController::class,
            )->only(["index", "create", "store", "show", "destroy"]);
            Route::patch("/stock-transfers/{stockTransfer}/status", [
                StockTransferController::class,
                "updateStatus",
            ])->name("stock-transfers.updateStatus");
        });
        Route::middleware("permission:stock.waste")->group(function () {
            Route::resource("wastes", WasteController::class)->only([
                "index",
                "create",
                "store",
                "show",
                "destroy",
            ]);
            Route::patch("/wastes/{waste}/status", [
                WasteController::class,
                "updateStatus",
            ])->name("wastes.updateStatus");
        });

        // ─────────────────────────────────────────────────────────────────
        // PEMBELIAN — permission: purchase.*
        // ─────────────────────────────────────────────────────────────────
        Route::middleware("permission:purchase.view")->group(function () {
            Route::resource("purchases", PurchaseController::class)->only([
                "index",
                "show",
            ]);
        });
        Route::middleware("permission:purchase.create")->group(function () {
            Route::resource("purchases", PurchaseController::class)->only([
                "create",
                "store",
            ]);
            Route::patch("/purchases/{purchase}/status", [
                PurchaseController::class,
                "updateStatus",
            ])->name("purchases.updateStatus");
        });
        Route::middleware("permission:purchase.delete")->group(function () {
            Route::delete("/purchases/{purchase}", [
                PurchaseController::class,
                "destroy",
            ])->name("purchases.destroy");
        });
        Route::middleware("permission:purchase.return")->group(function () {
            Route::resource(
                "purchase-returns",
                PurchaseReturnController::class,
            )->only(["index", "create", "store", "show", "destroy"]);
            Route::patch("/purchase-returns/{purchaseReturn}/status", [
                PurchaseReturnController::class,
                "updateStatus",
            ])->name("purchase-returns.updateStatus");
            Route::get("/purchase-returns/purchase/{purchase}/items", [
                PurchaseReturnController::class,
                "getPurchaseItems",
            ])->name("purchase-returns.getPurchaseItems");
        });

        // ─────────────────────────────────────────────────────────────────
        // PELANGGAN — permission: customer.*
        // ─────────────────────────────────────────────────────────────────
        Route::middleware("permission:customer.view")->group(function () {
            Route::resource("customers", CustomerController::class);
        });

        // ─────────────────────────────────────────────────────────────────
        // BOOKING — permission: booking.view
        // ─────────────────────────────────────────────────────────────────
        Route::middleware("permission:booking.view")->group(function () {
            Route::get("/bookings", [BookingController::class, "index"])->name(
                "bookings.index",
            );
            Route::post("/bookings", [BookingController::class, "store"])->name(
                "bookings.store",
            );
            Route::patch("/bookings/{booking}", [
                BookingController::class,
                "update",
            ])->name("bookings.update");
            Route::delete("/bookings/{booking}", [
                BookingController::class,
                "destroy",
            ])->name("bookings.destroy");
        });

        // ─────────────────────────────────────────────────────────────────
        // MEMBERSHIP — permission: membership.*
        // ─────────────────────────────────────────────────────────────────
        Route::middleware("permission:membership.view")->group(function () {
            Route::get("/memberships", [
                MembershipController::class,
                "index",
            ])->name("memberships.index");
            Route::post("/memberships", [
                MembershipController::class,
                "store",
            ])->name("memberships.store");
            Route::patch("/memberships/{membership}", [
                MembershipController::class,
                "update",
            ])->name("memberships.update");
            Route::delete("/memberships/{membership}", [
                MembershipController::class,
                "destroy",
            ])->name("memberships.destroy");
        });

        // ─────────────────────────────────────────────────────────────────
        // KARYAWAN — permission: employee.*
        // ─────────────────────────────────────────────────────────────────
        Route::middleware("permission:employee.view")->group(function () {
            Route::resource("employees", EmployeeController::class)->except([
                "show",
            ]);
        });

        // ─────────────────────────────────────────────────────────────────
        // PENGELUARAN — permission: expense.*
        // ─────────────────────────────────────────────────────────────────
        Route::middleware("permission:expense.view")->group(function () {
            Route::resource("expenses", ExpenseController::class)->only([
                "index",
                "create",
                "store",
                "show",
                "destroy",
            ]);
            Route::patch("/expenses/{expense}/status", [
                ExpenseController::class,
                "updateStatus",
            ])->name("expenses.updateStatus");
            Route::resource(
                "expense-categories",
                ExpenseCategoryController::class,
            )->except(["show"]);
        });

        // ─────────────────────────────────────────────────────────────────
        // PROMOSI — permission: promotion.*
        // ─────────────────────────────────────────────────────────────────
        Route::middleware("permission:promotion.view")->group(function () {
            Route::resource("promotions", PromotionController::class)->only([
                "index",
                "show",
            ]);
        });
        Route::middleware("permission:promotion.create")->group(function () {
            Route::resource("promotions", PromotionController::class)->only([
                "create",
                "store",
            ]);
        });
        Route::middleware("permission:promotion.edit")->group(function () {
            Route::resource("promotions", PromotionController::class)->only([
                "edit",
                "update",
            ]);
        });
        Route::middleware("permission:promotion.delete")->group(function () {
            Route::delete("/promotions/{promotion}", [
                PromotionController::class,
                "destroy",
            ])->name("promotions.destroy");
        });

        // ─────────────────────────────────────────────────────────────────
        // MEJA CAFE — permission: table.view / table.manage
        // ─────────────────────────────────────────────────────────────────
        Route::middleware("permission:table.view")->group(function () {
            Route::resource("cafe-tables", CafeTableController::class)->except([
                "show",
            ]);
            Route::post("/cafe-tables/{cafeTable}/free", [
                CafeTableController::class,
                "freeTable",
            ])->name("cafe-tables.free");
        });

        // ─────────────────────────────────────────────────────────────────
        // LAPORAN — permission: report.*
        // ─────────────────────────────────────────────────────────────────
        Route::middleware("permission:report.sales")->group(function () {
            Route::get("/reports", [ReportController::class, "index"])->name(
                "reports.index",
            );
            Route::post("/reports/ask-ai", [
                ReportAIController::class,
                "ask",
            ])->name("reports.ask-ai");
        });

        // ─────────────────────────────────────────────────────────────────
        // ACTIVITY LOG — permission: setting.view
        // ─────────────────────────────────────────────────────────────────
        Route::middleware("permission:setting.view")->group(function () {
            Route::get("/activity-logs", [
                ActivityLogController::class,
                "index",
            ])->name("activity-logs.index");
        });

        // ─────────────────────────────────────────────────────────────────
        // SETTINGS — permission: setting.edit
        // ─────────────────────────────────────────────────────────────────
        Route::middleware("permission:setting.edit")->group(function () {
            Route::get("/settings", [SettingController::class, "index"])->name(
                "settings.index",
            );
            Route::post("/settings", [
                SettingController::class,
                "update",
            ])->name("settings.update");
            Route::resource(
                "payment-methods",
                PaymentMethodController::class,
            )->except(["show"]);
            Route::patch("/payment-methods/{payment_method}/toggle", [
                PaymentMethodController::class,
                "toggleActive",
            ])->name("payment-methods.toggle");
            Route::patch("/payment-methods/{payment_method}/sort", [
                PaymentMethodController::class,
                "updateSort",
            ])->name("payment-methods.sort");
            Route::post("/payment-methods/pg/{provider}", [
                PaymentMethodController::class,
                "savePgSettings",
            ])->name("payment-methods.pg.save");
        });

        // ─────────────────────────────────────────────────────────────────
        // ROLE & PERMISSION MANAGEMENT — hanya owner/developer
        // ─────────────────────────────────────────────────────────────────
        Route::middleware("role:owner")->group(function () {
            // Role CRUD
            Route::get("/roles", [RoleController::class, "index"])->name(
                "roles.index",
            );
            Route::post("/roles", [RoleController::class, "store"])->name(
                "roles.store",
            );
            Route::put("/roles/{role}", [
                RoleController::class,
                "update",
            ])->name("roles.update");
            Route::delete("/roles/{role}", [
                RoleController::class,
                "destroy",
            ])->name("roles.destroy");

            // User Management (invite, assign role, revoke)
            Route::get("/store-users", [
                UserManagementController::class,
                "index",
            ])->name("store-users.index");
            Route::post("/store-users/invite", [
                UserManagementController::class,
                "invite",
            ])->name("store-users.invite");
            Route::patch("/store-users/{user}/role", [
                UserManagementController::class,
                "assignRole",
            ])->name("store-users.assign-role");
            Route::delete("/store-users/{user}", [
                UserManagementController::class,
                "revoke",
            ])->name("store-users.revoke");
        });
    });

require __DIR__ . "/auth.php";
