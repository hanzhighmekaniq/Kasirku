/**
 * Sidebar navigation — semua 34 item dikontrol via feature code.
 *
 * Aturan visibilitas:
 *  - Owner   : hasFeature(x)  → 2 layer (type + plan)
 *  - Karyawan: hasFeature(x) + can(permission) → 3 layer
 *
 * Dashboard selalu muncul (tapi bisa di-gate via hasFeature('dashboard')).
 */

function r(name, params) {
    try {
        return route(name, params);
    } catch {
        return "#";
    }
}

export function buildNavGroups(modules) {
    const {
        can,
        hasFeature,
        // Mode
        isRetail,
        isFnb,
        // Feature flags
        hasDashboard,
        hasPos,
        hasShift,
        hasSaleReturn,
        hasPromo,
        hasExpense,
        needsTable,
        needsKitchen,
        needsQueue,
        needsBooking,
        hasProduct,
        hasCategory,
        needsModifier,
        hasCustomer,
        needsMembership,
        needsSupplier,
        hasEmployee,
        needsCommission,
        hasPurchase,
        hasPurchaseReturn,
        needsStock,
        needsBatchExpired,
        needsAdjustment,
        needsOpname,
        needsTransfer,
        needsWaste,
        needsRecipe,
        needsReport,
        needsPaymentGw,
        hasPaymentMethod,
        hasSettings,
        hasUserManagement,
        hasRoleManagement,
        hasActivityLog,
    } = modules;

    const groups = [];

    // ── BERANDA ───────────────────────────────────────────────────────────────
    {
        const items = [];

        // Dashboard: hasFeature('dashboard') — kalau developer matiin, tidak muncul
        if (hasDashboard) {
            items.push({
                key: "dashboard",
                name: "Dashboard",
                href: r("admin.dashboard"),
                icon: "dashboard",
                current: "admin.dashboard",
            });
        }

        // Kasir/POS: hasFeature('basic_pos') + can('sale.create')
        if (hasPos && can("sale.create")) {
            items.push({
                key: "kasir",
                name: "Kasir / POS",
                href: r("admin.kasir.index"),
                icon: "pos",
                current: "admin.kasir.*",
                badge: "POS",
                badgeColor: "indigo",
            });
        }

        if (items.length > 0) {
            groups.push({ key: "home", label: "Beranda", icon: "home", items });
        }
    }

    // ── OPERASIONAL ───────────────────────────────────────────────────────────
    {
        const items = [];

        if (needsTable && can("table.view")) {
            items.push({
                key: "cafe-tables",
                name: "Manajemen Meja",
                href: r("admin.cafe-tables.index"),
                icon: "table",
                current: "admin.cafe-tables.*",
            });
        }
        if (needsKitchen && can("kitchen.view")) {
            items.push({
                key: "kitchen",
                name: "Kitchen Display",
                href: r("admin.kitchen.index"),
                icon: "kitchen",
                current: "admin.kitchen.*",
                badge: "FnB",
                badgeColor: "orange",
            });
        }
        if (needsQueue && can("queue.view")) {
            items.push({
                key: "queue",
                name: "Antrian",
                href: "#",
                icon: "queue",
                current: "admin.queue.*",
                badge: "Service",
                badgeColor: "violet",
            });
        }
        if (needsBooking && can("booking.view")) {
            items.push({
                key: "booking",
                name: "Booking / Reservasi",
                href: r("admin.bookings.index"),
                icon: "booking",
                current: "admin.bookings.*",
            });
        }

        if (items.length > 0) {
            groups.push({
                key: "operations",
                label: "Operasional",
                icon: "lightning",
                items,
            });
        }
    }

    // ── MASTER DATA ───────────────────────────────────────────────────────────
    {
        const items = [];

        if (hasProduct && can("product.view")) {
            items.push({
                key: "products",
                name: "Produk",
                href: r("admin.products.index"),
                icon: "product",
                current: "admin.products.*",
            });
        }
        if (hasCategory && can("product.view")) {
            items.push({
                key: "categories",
                name: "Kategori",
                href: r("admin.categories.index"),
                icon: "category",
                current: "admin.categories.*",
            });
        }
        if (needsModifier && can("product.edit")) {
            items.push({
                key: "modifier-groups",
                name: "Modifier / Topping",
                href: r("admin.modifier-groups.index"),
                icon: "modifier",
                current: "admin.modifier-groups.*",
                badge: "FnB",
                badgeColor: "orange",
            });
        }
        if (hasCustomer && can("customer.view")) {
            items.push({
                key: "customers",
                name: "Pelanggan",
                href: r("admin.customers.index"),
                icon: "customer",
                current: "admin.customers.*",
            });
        }
        if (needsMembership && can("membership.view")) {
            items.push({
                key: "memberships",
                name: "Membership",
                href: r("admin.memberships.index"),
                icon: "membership",
                current: "admin.memberships.*",
            });
        }
        if (needsSupplier && can("supplier.view")) {
            items.push({
                key: "suppliers",
                name: "Supplier",
                href: r("admin.suppliers.index"),
                icon: "supplier",
                current: "admin.suppliers.*",
            });
        }
        if (hasEmployee && can("employee.view")) {
            items.push({
                key: "employees",
                name: "Karyawan",
                href: r("admin.employees.index"),
                icon: "employee",
                current: "admin.employees.*",
            });
        }
        if (needsCommission && can("commission.view")) {
            items.push({
                key: "employee-commissions",
                name: "Komisi Karyawan",
                href: r("admin.employee-commissions.index"),
                icon: "commission",
                current: "admin.employee-commissions.*",
            });
        }

        if (items.length > 0) {
            groups.push({
                key: "master",
                label: "Master Data",
                icon: "database",
                items,
            });
        }
    }

    // ── TRANSAKSI ─────────────────────────────────────────────────────────────
    {
        const items = [];

        if (hasPos && can("sale.view")) {
            items.push({
                key: "sales",
                name: "Penjualan",
                href: r("admin.sales.index"),
                icon: "sales",
                current: "admin.sales.*",
            });
        }
        if (hasShift && can("shift.view")) {
            items.push({
                key: "shifts",
                name: "Shift Kasir",
                href: r("admin.cashier-shifts.index"),
                icon: "shift",
                current: "admin.cashier-shifts.*",
            });
        }
        if (hasPurchase && can("purchase.view")) {
            items.push({
                key: "purchases",
                name: "Pembelian",
                href: r("admin.purchases.index"),
                icon: "purchase",
                current: "admin.purchases.*",
            });
        }
        if (hasPurchaseReturn && can("purchase.return")) {
            items.push({
                key: "purchase-returns",
                name: "Retur Pembelian",
                href: r("admin.purchase-returns.index"),
                icon: "retur",
                current: "admin.purchase-returns.*",
            });
        }
        if (hasSaleReturn && can("sale.return")) {
            items.push({
                key: "sale-returns",
                name: "Retur Penjualan",
                href: r("admin.sale-returns.index"),
                icon: "retur",
                current: "admin.sale-returns.*",
            });
        }
        if (hasPromo && can("promotion.view")) {
            items.push({
                key: "promotions",
                name: "Promo & Diskon",
                href: r("admin.promotions.index"),
                icon: "promo",
                current: "admin.promotions.*",
            });
        }
        if (hasExpense && can("expense.view")) {
            items.push({
                key: "expense",
                name: "Pengeluaran",
                href: r("admin.expenses.index"),
                icon: "expense",
                current: "admin.expenses.*",
            });
        }

        if (items.length > 0) {
            groups.push({
                key: "transaction",
                label: "Transaksi",
                icon: "arrowsRightLeft",
                items,
            });
        }
    }

    // ── INVENTARIS ────────────────────────────────────────────────────────────
    if (needsStock && can("stock.view")) {
        const items = [];

        items.push({
            key: "stock",
            name: "Stok",
            href: r("admin.stock.index"),
            icon: "stock",
            current: "admin.stock.*",
        });

        if (needsBatchExpired) {
            items.push({
                key: "product-batches",
                name: "Batch / Expired",
                href: r("admin.product-batches.index"),
                icon: "batch",
                current: "admin.product-batches.*",
            });
        }
        if (needsAdjustment && can("stock.adjustment")) {
            items.push({
                key: "stock-adjustments",
                name: "Penyesuaian Stok",
                href: r("admin.stock-adjustments.index"),
                icon: "adjustment",
                current: "admin.stock-adjustments.*",
            });
        }
        if (needsOpname && can("stock.opname")) {
            items.push({
                key: "stock-opnames",
                name: "Opname Stok",
                href: r("admin.stock-opnames.index"),
                icon: "opname",
                current: "admin.stock-opnames.*",
            });
        }
        if (needsTransfer && can("stock.transfer")) {
            items.push({
                key: "stock-transfers",
                name: "Transfer Stok",
                href: r("admin.stock-transfers.index"),
                icon: "transfer",
                current: "admin.stock-transfers.*",
            });
        }
        if (needsWaste && can("stock.waste")) {
            items.push({
                key: "wastes",
                name: "Waste / Pemborosan",
                href: r("admin.wastes.index"),
                icon: "waste",
                current: "admin.wastes.*",
                badge: "FnB",
                badgeColor: "orange",
            });
        }
        if (needsRecipe && can("product.edit")) {
            items.push({
                key: "recipes",
                name: "Resep Bahan Baku",
                href: r("admin.products.index"),
                icon: "recipe",
                current: "admin.products.*",
                badge: "FnB",
                badgeColor: "orange",
            });
        }

        groups.push({
            key: "inventory",
            label: "Inventaris",
            icon: "archiveBox",
            items,
        });
    }

    // ── SISTEM & PENGATURAN ───────────────────────────────────────────────────
    {
        const items = [];

        if (needsReport && can("report.sales")) {
            items.push({
                key: "reports",
                name: "Laporan",
                href: r("admin.reports.index"),
                icon: "report",
                current: "admin.reports.*",
            });
        }
        if (hasPaymentMethod && can("setting.edit")) {
            items.push({
                key: "payment-methods",
                name: "Metode Pembayaran",
                href: r("admin.payment-methods.index"),
                icon: "payment",
                current: "admin.payment-methods.*",
            });
        }
        if (hasSettings && can("setting.edit")) {
            items.push({
                key: "settings",
                name: "Pengaturan Toko",
                href: r("admin.settings.index"),
                icon: "settings",
                current: "admin.settings.*",
            });
        }
        if (hasUserManagement && can("setting.edit")) {
            items.push({
                key: "store-users",
                name: "Pengguna & Akses",
                href: r("admin.store-users.index"),
                icon: "users",
                current: "admin.store-users.*",
            });
        }
        if (hasRoleManagement && can("setting.edit")) {
            items.push({
                key: "roles",
                name: "Role & Permission",
                href: r("admin.roles.index"),
                icon: "shield",
                current: "admin.roles.*",
            });
        }
        if (hasActivityLog && can("setting.view")) {
            items.push({
                key: "activity-logs",
                name: "Log Aktivitas",
                href: r("admin.activity-logs.index"),
                icon: "log",
                current: "admin.activity-logs.*",
            });
        }

        if (items.length > 0) {
            groups.push({ key: "system", label: "Sistem", icon: "cog", items });
        }
    }

    return groups;
}
