/**
 * Konfigurasi sidebar navigation — dinamis per store_type + plan + permission.
 */

// Helper: panggil route() dengan aman — jika tidak terdaftar return '#'
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
        hasMode,
        hasFeature,
        needsStock,
        needsSupplier,
        needsRecipe,
        needsModifier,
        needsTable,
        needsKitchen,
        needsWaste,
        needsQueue,
        needsBooking,
        needsCommission,
        needsMembership,
        needsReport,
        isFnb,
        isService,
        isLaundry,
        isRental,
        isParking,
        isSession,
        isRetail,
        isTicket,
        isHospitality,
    } = modules;

    const groups = [];

    // ── BERANDA ──────────────────────────────────────────────────────────────
    groups.push({
        key: "home",
        label: "Beranda",
        icon: "home",
        items: [
            {
                key: "dashboard",
                name: "Dashboard",
                href: r("admin.dashboard"),
                icon: "dashboard",
                current: "admin.dashboard",
            },
            can("sale.create") && {
                key: "kasir",
                name: "Kasir / POS",
                href: r("admin.kasir.index"),
                icon: "pos",
                current: "admin.kasir.*",
                badge: "POS",
                badgeColor: "indigo",
            },
        ].filter(Boolean),
    });

    // ── OPERASIONAL (mode-specific) ───────────────────────────────────────────
    const opsItems = [];

    if (needsTable && can("table.view")) {
        opsItems.push({
            key: "cafe-tables",
            name: "Manajemen Meja",
            href: r("admin.cafe-tables.index"),
            icon: "table",
            current: "admin.cafe-tables.*",
        });
    }
    if (needsKitchen && can("kitchen.view")) {
        opsItems.push({
            key: "kitchen",
            name: "Kitchen Display",
            href: "#",
            icon: "kitchen",
            current: "admin.kitchen.*",
            badge: "FnB",
            badgeColor: "orange",
        });
    }
    if (needsQueue && can("queue.view")) {
        opsItems.push({
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
        opsItems.push({
            key: "booking",
            name: "Booking / Reservasi",
            href: r("admin.bookings.index"),
            icon: "booking",
            current: "admin.bookings.*",
        });
    }

    if (opsItems.length > 0) {
        groups.push({
            key: "operations",
            label: "Operasional",
            icon: "lightning",
            items: opsItems,
        });
    }

    // ── MASTER DATA ───────────────────────────────────────────────────────────
    const masterItems = [];

    if (can("product.view")) {
        masterItems.push({
            key: "products",
            name: "Produk",
            href: r("admin.products.index"),
            icon: "product",
            current: "admin.products.*",
        });
        masterItems.push({
            key: "categories",
            name: "Kategori",
            href: r("admin.categories.index"),
            icon: "category",
            current: "admin.categories.*",
        });
    }
    if (needsModifier && can("product.edit")) {
        masterItems.push({
            key: "modifier-groups",
            name: "Modifier / Topping",
            href: r("admin.modifier-groups.index"),
            icon: "modifier",
            current: "admin.modifier-groups.*",
            badge: "FnB",
            badgeColor: "orange",
        });
    }
    if (can("customer.view")) {
        masterItems.push({
            key: "customers",
            name: "Pelanggan",
            href: r("admin.customers.index"),
            icon: "customer",
            current: "admin.customers.*",
        });
    }
    if (needsMembership && can("membership.view")) {
        masterItems.push({
            key: "memberships",
            name: "Membership",
            href: r("admin.memberships.index"),
            icon: "membership",
            current: "admin.memberships.*",
        });
    }
    if (needsSupplier && can("supplier.view")) {
        masterItems.push({
            key: "suppliers",
            name: "Supplier",
            href: r("admin.suppliers.index"),
            icon: "supplier",
            current: "admin.suppliers.*",
        });
    }
    if (can("employee.view")) {
        masterItems.push({
            key: "employees",
            name: "Karyawan",
            href: r("admin.employees.index"),
            icon: "employee",
            current: "admin.employees.*",
        });
    }
    if (needsCommission && can("commission.view")) {
        masterItems.push({
            key: "commissions",
            name: "Komisi",
            href: "#",
            icon: "commission",
            current: "admin.commissions.*",
            badge: "Service",
            badgeColor: "violet",
        });
    }

    if (masterItems.length > 0) {
        groups.push({
            key: "master",
            label: "Master Data",
            icon: "database",
            items: masterItems,
        });
    }

    // ── TRANSAKSI ─────────────────────────────────────────────────────────────
    const txItems = [];

    if (can("sale.view")) {
        txItems.push({
            key: "sales",
            name: "Penjualan",
            href: r("admin.sales.index"),
            icon: "sales",
            current: "admin.sales.*",
        });
    }
    if (can("shift.view")) {
        txItems.push({
            key: "cashier-shifts",
            name: "Shift Kasir",
            href: r("admin.cashier-shifts.index"),
            icon: "shift",
            current: "admin.cashier-shifts.*",
        });
    }
    if (can("purchase.view")) {
        txItems.push({
            key: "purchases",
            name: "Pembelian",
            href: r("admin.purchases.index"),
            icon: "purchase",
            current: "admin.purchases.*",
        });
    }
    if (can("purchase.return")) {
        txItems.push({
            key: "purchase-returns",
            name: "Retur Pembelian",
            href: r("admin.purchase-returns.index"),
            icon: "retur",
            current: "admin.purchase-returns.*",
        });
    }
    if (can("sale.return")) {
        txItems.push({
            key: "sale-returns",
            name: "Retur Penjualan",
            href: r("admin.sale-returns.index"),
            icon: "retur",
            current: "admin.sale-returns.*",
        });
    }
    if (can("promotion.view")) {
        txItems.push({
            key: "promotions",
            name: "Promo & Diskon",
            href: r("admin.promotions.index"),
            icon: "promo",
            current: "admin.promotions.*",
        });
    }
    if (can("expense.view")) {
        txItems.push({
            key: "expenses",
            name: "Pengeluaran",
            href: r("admin.expenses.index"),
            icon: "expense",
            current: "admin.expenses.*",
        });
    }

    if (txItems.length > 0) {
        groups.push({
            key: "transaction",
            label: "Transaksi",
            icon: "arrowsRightLeft",
            items: txItems,
        });
    }

    // ── INVENTARIS ────────────────────────────────────────────────────────────
    if (needsStock && can("stock.view")) {
        const invItems = [];

        invItems.push({
            key: "stock",
            name: "Stok",
            href: r("admin.stock.index"),
            icon: "stock",
            current: "admin.stock.*",
        });

        if (isRetail || isFnb) {
            invItems.push({
                key: "product-batches",
                name: "Batch / Expired",
                href: r("admin.product-batches.index"),
                icon: "batch",
                current: "admin.product-batches.*",
            });
        }
        if (can("stock.adjustment")) {
            invItems.push({
                key: "stock-adjustments",
                name: "Penyesuaian Stok",
                href: r("admin.stock-adjustments.index"),
                icon: "adjustment",
                current: "admin.stock-adjustments.*",
            });
        }
        if (can("stock.opname")) {
            invItems.push({
                key: "stock-opnames",
                name: "Opname Stok",
                href: r("admin.stock-opnames.index"),
                icon: "opname",
                current: "admin.stock-opnames.*",
            });
        }
        if (can("stock.transfer")) {
            invItems.push({
                key: "stock-transfers",
                name: "Transfer Stok",
                href: r("admin.stock-transfers.index"),
                icon: "transfer",
                current: "admin.stock-transfers.*",
            });
        }
        if (needsWaste && can("stock.waste")) {
            invItems.push({
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
            invItems.push({
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
            items: invItems,
        });
    }

    // ── SISTEM & PENGATURAN ───────────────────────────────────────────────────
    const sysItems = [];

    if (needsReport && can("report.sales")) {
        sysItems.push({
            key: "reports",
            name: "Laporan",
            href: r("admin.reports.index"),
            icon: "report",
            current: "admin.reports.*",
        });
    }
    if (can("setting.edit")) {
        sysItems.push({
            key: "payment-methods",
            name: "Metode Pembayaran",
            href: r("admin.payment-methods.index"),
            icon: "payment",
            current: "admin.payment-methods.*",
        });
        sysItems.push({
            key: "settings",
            name: "Pengaturan Toko",
            href: r("admin.settings.index"),
            icon: "settings",
            current: "admin.settings.*",
        });
        sysItems.push({
            key: "store-users",
            name: "Pengguna & Akses",
            href: r("admin.store-users.index"),
            icon: "users",
            current: "admin.store-users.*",
        });
        sysItems.push({
            key: "roles",
            name: "Role & Permission",
            href: r("admin.roles.index"),
            icon: "shield",
            current: "admin.roles.*",
        });
    }
    if (can("setting.view")) {
        sysItems.push({
            key: "activity-logs",
            name: "Log Aktivitas",
            href: r("admin.activity-logs.index"),
            icon: "log",
            current: "admin.activity-logs.*",
        });
    }

    if (sysItems.length > 0) {
        groups.push({
            key: "system",
            label: "Sistem",
            icon: "cog",
            items: sysItems,
        });
    }

    return groups;
}
