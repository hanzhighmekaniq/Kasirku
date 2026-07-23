/**
 * Sidebar navigation — 2-layer validation per item.
 *
 * Layer 1: Plan   (planAllows)      ──┐
 * Layer 2: Type   (typeSupports)    ──┼── hasFeature / isFeatureLocked
 * Layer 3: Permission (can)         ──┘
 *
 * Aturan visibilitas:
 *  - hasFeature + can   → NORMAL (klikable)
 *  - locked    + can    → LOCKED  (tampil tapi 🔒, ga bisa diklik)
 *  - !can               → HIDDEN  (ga muncul sama sekali)
 */

function r(name, params) {
    try {
        return route(name, params);
    } catch {
        return "#";
    }
}

/**
 * Helper: tambah item ke array jika memenuhi syarat
 *
 * Logic:
 * - typeSupport = false → HIDDEN (tidak ditambahkan ke array)
 * - typeSupport = true && planAllows = false → LOCKED (ditambahkan dengan flag locked)
 * - typeSupport = true && planAllows = true → NORMAL (ditambahkan tanpa flag locked)
 *
 * @param {Array} items - Array untuk menambahkan item
 * @param {boolean} typeSupports - Apakah tipe toko support fitur ini (hasFeature || isFeatureLocked)
 * @param {boolean} planAllows - Apakah plan mengizinkan fitur ini (hasFeature, BUKAN !isFeatureLocked)
 * @param {object} item - Item menu yang akan ditambahkan
 */
function add(items, typeSupports, planAllows, item) {
    // Jika tipe toko tidak support, jangan tampilkan sama sekali (HIDDEN)
    if (!typeSupports) return;

    // Jika tipe support tapi plan tidak allow, tampilkan tapi locked
    if (typeSupports && !planAllows) {
        items.push({ ...item, locked: true });
        return;
    }

    // Jika tipe support dan plan allow, tampilkan normal (NORMAL)
    items.push(item);
}

/**
 * Helper: Sort items agar NORMAL di atas, LOCKED di bawah
 * Ini biar user langsung lihat fitur yang bisa diakses di atas!
 *
 * @param {Array} items - Array items yang sudah diisi
 * @returns {Array} - Array yang sudah di-sort
 */
function sortByLockState(items) {
    return items.sort((a, b) => {
        // Normal (locked=false/undefined) → 0
        // Locked (locked=true) → 1
        const aLock = a.locked ? 1 : 0;
        const bLock = b.locked ? 1 : 0;
        return aLock - bLock; // Normal items naik ke atas
    });
}

/**
 * Helper: Sort groups agar group yang punya item NORMAL di atas,
 * group yang semua itemnya LOCKED di bawah.
 * Ini biar user langsung lihat group yang bisa diakses dulu!
 *
 * @param {Array} groups - Array groups
 * @returns {Array} - Array groups yang sudah di-sort
 */
function sortGroupsByLockState(groups) {
    return groups.sort((a, b) => {
        // Group dianggap "fully locked" kalau semua itemnya locked
        const aAllLocked = a.items.length > 0 && a.items.every((i) => i.locked);
        const bAllLocked = b.items.length > 0 && b.items.every((i) => i.locked);
        const aLock = aAllLocked ? 1 : 0;
        const bLock = bAllLocked ? 1 : 0;
        return aLock - bLock; // Group dengan item aktif naik ke atas
    });
}

export function buildNavGroups(modules) {
    const {
        can,
        hasFeature,
        isFeatureLocked,
        // Feature flags — semua dari hasFeature() yang sudah cek typeSupports + planAllows
        hasDashboard,
        lockedDashboard,
        hasPos,
        lockedPos,
        hasShift,
        lockedShift,
        hasSaleReturn,
        lockedSaleReturn,
        hasPromo,
        lockedPromo,
        hasExpense,
        lockedExpense,
        needsTable,
        lockedTable,
        needsKitchen,
        lockedKitchen,
        needsQueue,
        lockedQueue,
        needsBooking,
        lockedBooking,
        hasProduct,
        lockedProduct,
        hasCategory,
        lockedCategory,
        needsModifier,
        lockedModifier,
        hasCustomer,
        lockedCustomer,
        needsMembership,
        lockedMembership,
        needsSupplier,
        lockedSupplier,
        hasEmployee,
        lockedEmployee,
        needsCommission,
        lockedCommission,
        hasPurchase,
        lockedPurchase,
        hasPurchaseReturn,
        lockedPurchaseReturn,
        needsStock,
        lockedStock,
        needsBatchExpired,
        lockedBatchExpired,
        needsAdjustment,
        lockedAdjustment,
        needsOpname,
        lockedOpname,
        needsTransfer,
        lockedTransfer,
        needsWaste,
        lockedWaste,
        needsRecipe,
        lockedRecipe,
        needsReport,
        lockedReport,
        needsPaymentGw,
        lockedPaymentGw,
        hasPaymentMethod,
        lockedPaymentMethod,
        hasDebt,
        lockedDebt,
        hasSettings,
        lockedSettings,
        hasUserManagement,
        lockedUserManagement,
        hasRoleManagement,
        lockedRoleManagement,
        hasActivityLog,
        lockedActivityLog,
        hasSidebarOrder,
        lockedSidebarOrder,
    } = modules;

    /* Normalize ke bentuk sederhana — semua fitur gated murni oleh hasFeature (type + plan) */
    const Table = { val: needsTable, lock: lockedTable };
    const Kitchen = { val: needsKitchen, lock: lockedKitchen };
    const Queue = { val: needsQueue, lock: lockedQueue };
    const Booking = { val: needsBooking, lock: lockedBooking };
    const Modifier = { val: needsModifier, lock: lockedModifier };
    const Membership = { val: needsMembership, lock: lockedMembership };
    const Supplier = { val: needsSupplier, lock: lockedSupplier };
    const Commission = { val: needsCommission, lock: lockedCommission };
    const Purchase = { val: hasPurchase, lock: lockedPurchase };
    const PurchReturn = { val: hasPurchaseReturn, lock: lockedPurchaseReturn };
    const Stock = { val: needsStock, lock: lockedStock };
    const Batch = { val: needsBatchExpired, lock: lockedBatchExpired };
    const Adjust = { val: needsAdjustment, lock: lockedAdjustment };
    const Opname = { val: needsOpname, lock: lockedOpname };
    const Transfer = { val: needsTransfer, lock: lockedTransfer };
    const Waste = { val: needsWaste, lock: lockedWaste };
    const Recipe = { val: needsRecipe, lock: lockedRecipe };
    const Report = { val: needsReport, lock: lockedReport };
    const PaymentGw = { val: needsPaymentGw, lock: lockedPaymentGw };

    const groups = [];

    // ── BERANDA ──────────────────────────────────────────────────────────────────
    {
        const items = [];
        add(
            items,
            hasDashboard || lockedDashboard, // typeSupports: apakah dashboard tersedia untuk tipe toko ini
            hasDashboard, // planAllows: true jika plan mengizinkan
            {
                key: "dashboard",
                name: "Dashboard",
                href: r("admin.dashboard"),
                icon: "dashboard",
                current: "admin.dashboard",
            },
        );
        add(
            items,
            hasPos || lockedPos, // typeSupports
            hasPos, // planAllows
            {
                key: "kasir",
                name: "Kasir / POS",
                href: r("admin.kasir.index"),
                icon: "pos",
                current: "admin.kasir.*",
                badge: "POS",
                badgeColor: "indigo",
            },
        );
        if (items.length > 0)
            groups.push({
                key: "home",
                label: "Beranda",
                icon: "home",
                items: sortByLockState(items), // Sort: NORMAL di atas, LOCKED di bawah
            });
    }

    // ── OPERASIONAL ───────────────────────────────────────────────────────────
    {
        const items = [];
        add(items, Table?.val || Table?.lock, Table?.val, {
            key: "cafe-tables",
            name: "Manajemen Meja",
            href: r("admin.cafe-tables.index"),
            icon: "table",
            current: "admin.cafe-tables.*",
        });
        add(items, Kitchen?.val || Kitchen?.lock, Kitchen?.val, {
            key: "kitchen",
            name: "Kitchen Display",
            href: r("admin.kitchen.index"),
            icon: "kitchen",
            current: "admin.kitchen.*",
            badge: "FnB",
            badgeColor: "orange",
        });
        add(items, Queue?.val || Queue?.lock, Queue?.val, {
            key: "queue",
            name: "Antrian",
            href: r("admin.queue.index"),
            icon: "queue",
            current: "admin.queue.*",
            badge: "Service",
            badgeColor: "violet",
        });
        add(items, Booking?.val || Booking?.lock, Booking?.val, {
            key: "booking",
            name: "Booking / Reservasi",
            href: r("admin.bookings.index"),
            icon: "booking",
            current: "admin.bookings.*",
        });
        if (items.length > 0)
            groups.push({
                key: "operations",
                label: "Operasional",
                icon: "lightning",
                items: sortByLockState(items), // Sort: NORMAL di atas, LOCKED di bawah
            });
    }

    // ── MASTER DATA ───────────────────────────────────────────────────────────
    {
        const items = [];
        add(items, hasProduct || lockedProduct, hasProduct, {
            key: "products",
            name: "Produk",
            href: r("admin.products.index"),
            icon: "product",
            current: "admin.products.*",
        });
        add(items, hasCategory || lockedCategory, hasCategory, {
            key: "categories",
            name: "Kategori",
            href: r("admin.categories.index"),
            icon: "category",
            current: "admin.categories.*",
        });
        add(items, Modifier?.val || Modifier?.lock, Modifier?.val, {
            key: "modifier-groups",
            name: "Modifier / Topping",
            href: r("admin.modifier-groups.index"),
            icon: "modifier",
            current: "admin.modifier-groups.*",
            badge: "FnB",
            badgeColor: "orange",
        });
        add(items, hasCustomer || lockedCustomer, hasCustomer, {
            key: "customers",
            name: "Pelanggan",
            href: r("admin.customers.index"),
            icon: "customer",
            current: "admin.customers.*",
        });
        add(items, Membership?.val || Membership?.lock, Membership?.val, {
            key: "memberships",
            name: "Membership",
            href: r("admin.memberships.index"),
            icon: "membership",
            current: "admin.memberships.*",
        });
        add(items, Supplier?.val || Supplier?.lock, Supplier?.val, {
            key: "suppliers",
            name: "Supplier",
            href: r("admin.suppliers.index"),
            icon: "supplier",
            current: "admin.suppliers.*",
        });
        add(items, hasEmployee || lockedEmployee, hasEmployee, {
            key: "employees",
            name: "Karyawan",
            href: r("admin.employees.index"),
            icon: "employee",
            current: "admin.employees.*",
        });
        add(items, Commission?.val || Commission?.lock, Commission?.val, {
            key: "employee-commissions",
            name: "Komisi Karyawan",
            href: r("admin.employee-commissions.index"),
            icon: "commission",
            current: "admin.employee-commissions.*",
        });
        if (items.length > 0)
            groups.push({
                key: "master",
                label: "Master Data",
                icon: "database",
                items: sortByLockState(items), // Sort: NORMAL di atas, LOCKED di bawah
            });
    }

    // ── TRANSAKSI ─────────────────────────────────────────────────────────────
    {
        const items = [];
        add(items, hasPos || lockedPos, hasPos, {
            key: "sales",
            name: "Penjualan",
            href: r("admin.sales.index"),
            icon: "sales",
            current: "admin.sales.*",
        });
        add(items, hasShift || lockedShift, hasShift, {
            key: "shifts",
            name: "Shift Kasir",
            href: r("admin.cashier-shifts.index"),
            icon: "shift",
            current: "admin.cashier-shifts.*",
        });
        add(items, Purchase?.val || Purchase?.lock, Purchase?.val, {
            key: "purchases",
            name: "Pembelian",
            href: r("admin.purchases.index"),
            icon: "purchase",
            current: "admin.purchases.*",
        });
        add(items, PurchReturn?.val || PurchReturn?.lock, PurchReturn?.val, {
            key: "purchase-returns",
            name: "Retur Pembelian",
            href: r("admin.purchase-returns.index"),
            icon: "retur",
            current: "admin.purchase-returns.*",
        });
        add(items, hasSaleReturn || lockedSaleReturn, hasSaleReturn, {
            key: "sale-returns",
            name: "Retur Penjualan",
            href: r("admin.sale-returns.index"),
            icon: "retur",
            current: "admin.sale-returns.*",
        });
        add(items, hasPromo || lockedPromo, hasPromo, {
            key: "promotions",
            name: "Promo & Diskon",
            href: r("admin.promotions.index"),
            icon: "promo",
            current: "admin.promotions.*",
        });
        add(items, hasExpense || lockedExpense, hasExpense, {
            key: "expense",
            name: "Pengeluaran",
            href: r("admin.expenses.index"),
            icon: "expense",
            current: "admin.expenses.*",
        });
        if (items.length > 0)
            groups.push({
                key: "transaction",
                label: "Transaksi",
                icon: "arrowsRightLeft",
                items: sortByLockState(items), // Sort: NORMAL di atas, LOCKED di bawah
            });
    }

    // ── INVENTARIS ────────────────────────────────────────────────────────────
    if (Stock?.val || Stock?.lock) {
        const items = [];
        add(items, Stock?.val || Stock?.lock, Stock?.val, {
            key: "stock",
            name: "Stok",
            href: r("admin.stock.index"),
            icon: "stock",
            current: "admin.stock.*",
        });
        add(items, Batch?.val || Batch?.lock, Batch?.val, {
            key: "product-batches",
            name: "Batch / Expired",
            href: r("admin.product-batches.index"),
            icon: "batch",
            current: "admin.product-batches.*",
        });
        add(
            items,
            (Adjust?.val || Adjust?.lock) && can("stock.adjustment"),
            Adjust?.val && can("stock.adjustment"),
            {
                key: "stock-adjustments",
                name: "Penyesuaian Stok",
                href: r("admin.stock-adjustments.index"),
                icon: "adjustment",
                current: "admin.stock-adjustments.*",
            },
        );
        add(
            items,
            (Opname?.val || Opname?.lock) && can("stock.opname"),
            Opname?.val && can("stock.opname"),
            {
                key: "stock-opnames",
                name: "Opname Stok",
                href: r("admin.stock-opnames.index"),
                icon: "opname",
                current: "admin.stock-opnames.*",
            },
        );
        add(
            items,
            (Transfer?.val || Transfer?.lock) && can("stock.transfer"),
            Transfer?.val && can("stock.transfer"),
            {
                key: "stock-transfers",
                name: "Transfer Stok",
                href: r("admin.stock-transfers.index"),
                icon: "transfer",
                current: "admin.stock-transfers.*",
            },
        );
        add(
            items,
            (Waste?.val || Waste?.lock) && can("stock.waste"),
            Waste?.val && can("stock.waste"),
            {
                key: "wastes",
                name: "Waste / Pemborosan",
                href: r("admin.wastes.index"),
                icon: "waste",
                current: "admin.wastes.*",
                badge: "FnB",
                badgeColor: "orange",
            },
        );
        add(
            items,
            (Recipe?.val || Recipe?.lock) && can("product.edit"),
            Recipe?.val && can("product.edit"),
            {
                key: "recipes",
                name: "Resep Bahan Baku",
                href: r("admin.products.index"),
                icon: "recipe",
                current: "admin.products.*",
                badge: "FnB",
                badgeColor: "orange",
            },
        );
        groups.push({
            key: "inventory",
            label: "Inventaris",
            icon: "archiveBox",
            items: sortByLockState(items), // Sort: NORMAL di atas, LOCKED di bawah
        });
    }

    // ── KEUANGAN ──────────────────────────────────────────────────────────────
    {
        const items = [];
        add(
            items,
            (Report?.val || Report?.lock) && can("report.sales"),
            Report?.val && can("report.sales"),
            {
                key: "reports",
                name: "Laporan",
                href: r("admin.reports.index"),
                icon: "report",
                current: "admin.reports",
            },
        );
        add(
            items,
            (Report?.val || Report?.lock) && can("report.purchase"),
            Report?.val && can("report.purchase"),
            {
                key: "report-purchases",
                name: "Laporan Pembelian",
                href: r("admin.reports.purchases"),
                icon: "report",
                current: "admin.reports.purchases",
            },
        );
        add(
            items,
            (Report?.val || Report?.lock) && can("report.stock"),
            Report?.val && can("report.stock"),
            {
                key: "report-stock",
                name: "Laporan Stok",
                href: r("admin.reports.stock"),
                icon: "report",
                current: "admin.reports.stock",
            },
        );
        add(
            items,
            (Report?.val || Report?.lock) && can("report.expense"),
            Report?.val && can("report.expense"),
            {
                key: "report-expenses",
                name: "Laporan Pengeluaran",
                href: r("admin.reports.expenses"),
                icon: "report",
                current: "admin.reports.expenses",
            },
        );
        add(
            items,
            (Report?.val || Report?.lock) && can("report.shift"),
            Report?.val && can("report.shift"),
            {
                key: "report-shifts",
                name: "Laporan Shift",
                href: r("admin.reports.shifts"),
                icon: "report",
                current: "admin.reports.shifts",
            },
        );
        add(
            items,
            (Report?.val || Report?.lock) && can("report.commission"),
            Report?.val && can("report.commission"),
            {
                key: "report-commissions",
                name: "Laporan Komisi",
                href: r("admin.reports.commissions"),
                icon: "report",
                current: "admin.reports.commissions",
            },
        );
        add(
            items,
            (PaymentGw?.val || PaymentGw?.lock) && can("setting.edit"),
            PaymentGw?.val && can("setting.edit"),
            {
                key: "payment-gateways",
                name: "Payment Gateway",
                href: r("admin.payment-gateway.index"),
                icon: "paymentGw",
                current: "admin.payment-gateway.*",
            },
        );
        add(
            items,
            (PaymentGw?.val || PaymentGw?.lock) && can("setting.view"),
            PaymentGw?.val && can("setting.view"),
            {
                key: "wallet",
                name: "Wallet",
                href: r("admin.wallet.index"),
                icon: "wallet",
                current: "admin.wallet.*",
            },
        );
        add(
            items,
            (hasPaymentMethod || lockedPaymentMethod) && can("setting.edit"),
            hasPaymentMethod && can("setting.edit"),
            {
                key: "payment-methods",
                name: "Metode Pembayaran",
                href: r("admin.payment-methods.index"),
                icon: "payment",
                current: "admin.payment-methods.*",
            },
        );
        add(
            items,
            (hasDebt || lockedDebt) && can("debt.view"),
            hasDebt && can("debt.view"),
            {
                key: "debts",
                name: "Hutang / Kasbon",
                href: r("admin.debts.index"),
                icon: "debt",
                current: "admin.debts.*",
            },
        );
        if (items.length > 0)
            groups.push({
                key: "finance",
                label: "Keuangan",
                icon: "currencyDollar",
                items: sortByLockState(items), // Sort: NORMAL di atas, LOCKED di bawah
            });
    }

    // ── SISTEM ─────────────────────────────────────────────────────────────────
    {
        const items = [];
        add(
            items,
            (hasSettings || lockedSettings) && can("setting.edit"),
            hasSettings && can("setting.edit"),
            {
                key: "settings",
                name: "Pengaturan Toko",
                href: r("admin.settings.index"),
                icon: "settings",
                current: "admin.settings.*",
            },
        );
        add(
            items,
            (hasUserManagement || lockedUserManagement) && can("setting.edit"),
            hasUserManagement && can("setting.edit"),
            {
                key: "store-users",
                name: "Pengguna & Akses",
                href: r("admin.store-users.index"),
                icon: "users",
                current: "admin.store-users.*",
            },
        );
        add(
            items,
            (hasRoleManagement || lockedRoleManagement) && can("setting.edit"),
            hasRoleManagement && can("setting.edit"),
            {
                key: "roles",
                name: "Role & Permission",
                href: r("admin.roles.index"),
                icon: "shield",
                current: "admin.roles.*",
            },
        );
        add(
            items,
            (hasActivityLog || lockedActivityLog) && can("setting.view"),
            hasActivityLog && can("setting.view"),
            {
                key: "activity-logs",
                name: "Log Aktivitas",
                href: r("admin.activity-logs.index"),
                icon: "log",
                current: "admin.activity-logs.*",
            },
        );
        add(
            items,
            (hasSidebarOrder || lockedSidebarOrder) && can("setting.edit"),
            hasSidebarOrder && can("setting.edit"),
            {
                key: "sidebar-order",
                name: "Urutan Sidebar",
                href: r("admin.sidebar-order"),
                icon: "list",
                current: "admin.sidebar-order",
            },
        );
        // Tema — personal per-akun, tidak digate oleh permission/plan toko.
        items.push({
            key: "themes",
            name: "Tema",
            href: r("admin.themes.index"),
            icon: "theme",
            current: "admin.themes",
        });
        if (items.length > 0)
            groups.push({
                key: "system",
                label: "Sistem",
                icon: "cog",
                items: sortByLockState(items), // Sort: NORMAL di atas, LOCKED di bawah
            });
    }

    return sortGroupsByLockState(groups);
}
