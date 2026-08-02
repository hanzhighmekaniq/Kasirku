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
 *
 * Smart Item:
 *  Satu item sidebar mewakili beberapa sub-fitur (mis. Manajemen Stok =
 *  Stok + Batch + Opname + dst). `href` induk otomatis mengarah ke sub-fitur
 *  pertama yang tidak terkunci. Jika semua anak terkunci, induk ikut terkunci.
 */

function r(name, params) {
    try {
        return route(name, params);
    } catch {
        return "#";
    }
}

function add(items, typeSupports, planAllows, item) {
    if (!typeSupports) return;
    if (!planAllows) {
        items.push({ ...item, locked: true });
        return;
    }
    items.push(item);
}

function sortByLockState(items) {
    return items.sort((a, b) => (a.locked ? 1 : 0) - (b.locked ? 1 : 0));
}

function sortGroupsByLockState(groups) {
    return groups.sort((a, b) => {
        const aAll = a.items.length > 0 && a.items.every((i) => i.locked);
        const bAll = b.items.length > 0 && b.items.every((i) => i.locked);
        return (aAll ? 1 : 0) - (bAll ? 1 : 0);
    });
}

/**
 * Bangun satu item sidebar "cerdas" dari daftar kandidat sub-fitur.
 *
 * 1. Mencari kandidat pertama yang tidak terkunci → dijadikan `href` induk.
 * 2. Jika semua kandidat terkunci → induk ikut terkunci.
 * 3. Menggabungkan semua pola `current` → halaman manapun aktif, induk ikut highlight.
 */
function smartGroup(item, items, candidates) {
    const active = candidates.filter((c) => !c.locked);
    // Kandidat boleh mengosongkan `current` (null / []) kalau halamannya sudah
    // diklaim item sidebar lain yang lebih spesifik — dia tetap dipakai sebagai
    // fallback href, tapi tidak ikut menyalakan highlight induk.
    const combinedCurrent = candidates
        .flatMap((c) => (Array.isArray(c.current) ? c.current : [c.current]))
        .filter(Boolean);

    add(
        items,
        candidates.length > 0,
        active.length > 0,
        {
            ...item,
            href: active[0]?.href ?? candidates[0]?.href ?? "#",
            current: combinedCurrent,
        },
    );
}

// ─── Kandidat per ekosistem (urutan = prioritas fallback href) ───────────────

function stockCandidates(S, B, A, O, T, W) {
    return [
        { href: r("admin.stock.index"), locked: !S, current: "admin.stock.*" },
        { href: r("admin.product-batches.index"), locked: !B, current: "admin.product-batches.*" },
        { href: r("admin.stock-adjustments.index"), locked: !A, current: "admin.stock-adjustments.*" },
        { href: r("admin.stock-opnames.index"), locked: !O, current: "admin.stock-opnames.*" },
        { href: r("admin.stock-transfers.index"), locked: !T, current: "admin.stock-transfers.*" },
        { href: r("admin.wastes.index"), locked: !W, current: "admin.wastes.*" },
    ];
}

function purchaseCandidates(hasPr, hasPR, hasSup) {
    return [
        { href: r("admin.purchases.index"), locked: !hasPr, current: "admin.purchases.*" },
        { href: r("admin.purchase-returns.index"), locked: !hasPR, current: "admin.purchase-returns.*" },
        { href: r("admin.suppliers.index"), locked: !hasSup, current: "admin.suppliers.*" },
    ];
}

function salesCandidates(hasPos, hasSR) {
    return [
        { href: r("admin.sales.index"), locked: !hasPos, current: "admin.sales.*" },
        { href: r("admin.sale-returns.index"), locked: !hasSR, current: "admin.sale-returns.*" },
    ];
}

function loyaltyCandidates(hasCust, hasMemb) {
    return [
        { href: r("admin.customers.index"), locked: !hasCust, current: "admin.customers.*" },
        { href: r("admin.memberships.index"), locked: !hasMemb, current: "admin.memberships.*" },
        { href: r("admin.customer-tiers.index"), locked: !hasMemb, current: "admin.customer-tiers.*" },
    ];
}

function hrCandidates(hasEmp, hasCom) {
    return [
        { href: r("admin.employees.index"), locked: !hasEmp, current: ["admin.employees.*", "admin.roles.*", "admin.store-users.*"] },
        { href: r("admin.employee-commissions.index"), locked: !hasCom, current: "admin.employee-commissions.*" },
    ];
}

function financeCandidates(can, hasPM, hasDebt, hasPG) {
    return [
        { href: r("admin.payment-methods.index"), locked: !(hasPM && can("setting.edit")), current: "admin.payment-methods.*" },
        // Hutang/Kasbon punya item sidebar sendiri di grup "Pelanggan & Tim".
        // Tetap jadi kandidat href (fallback kalau metode bayar terkunci), tapi
        // `current`-nya dikosongkan supaya di /app/debts tidak ada DUA item yang
        // menyala sekaligus.
        { href: r("admin.debts.index"), locked: !(hasDebt && can("debt.view")), current: null },
        { href: r("admin.payment-gateway.index"), locked: !(hasPG && can("setting.edit")), current: "admin.payment-gateway.*" },
        { href: r("admin.wallet.index"), locked: !(hasPG && can("setting.view")), current: "admin.wallet.*" },
    ];
}

// ─── Builder utama ──────────────────────────────────────────────────────────

export function buildNavGroups(modules) {
    const {
        can,
        hasFeature,
        isFeatureLocked,
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
        hasActivityLog,
        lockedActivityLog,
        hasSidebarOrder,
        lockedSidebarOrder,
    } = modules;

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
    const Report = { val: needsReport, lock: lockedReport };
    const PaymentGw = { val: needsPaymentGw, lock: lockedPaymentGw };

    const groups = [];

    // ═══════════════════════════════════════════════════════════════════════
    //  [1] BERANDA — 2 item
    // ═══════════════════════════════════════════════════════════════════════
    {
        const items = [];
        add(items, hasDashboard || lockedDashboard, hasDashboard, {
            key: "dashboard",
            name: "Dashboard",
            href: r("admin.dashboard"),
            icon: "dashboard",
            current: "admin.dashboard",
        });
        add(items, hasPos || lockedPos, hasPos, {
            key: "kasir",
            name: "Kasir / POS",
            href: r("admin.kasir.index"),
            icon: "pos",
            current: "admin.kasir.*",
            badge: "POS",
            badgeColor: "indigo",
        });
        if (items.length > 0)
            groups.push({
                key: "home",
                label: "Beranda",
                icon: "home",
                items: sortByLockState(items),
            });
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  [2] PENJUALAN — 4 item
    // ═══════════════════════════════════════════════════════════════════════
    {
        const items = [];
        smartGroup(
            { key: "sales", name: "Penjualan", icon: "sales" },
            items,
            salesCandidates(hasPos, hasSaleReturn),
        );
        add(items, hasShift || lockedShift, hasShift, {
            key: "shifts",
            name: "Shift Kasir",
            href: r("admin.cashier-shifts.index"),
            icon: "shift",
            current: "admin.cashier-shifts.*",
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
            // Kategori Pengeluaran adalah sub-halaman Pengeluaran, bukan item
            // sidebar sendiri — ikut menyalakan item ini.
            current: ["admin.expenses.*", "admin.expense-categories.*"],
        });
        if (items.length > 0)
            groups.push({
                key: "transaction",
                label: "Penjualan",
                icon: "arrowsRightLeft",
                items: sortByLockState(items),
            });
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  [3] OPERASIONAL — 2-4 item (FnB / Service / Ticket / Hospitality)
    // ═══════════════════════════════════════════════════════════════════════
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
                items: sortByLockState(items),
            });
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  [4] KATALOG & STOK — 5 item
    //  Produk, Kategori, Modifier, Manajemen Stok, Pembelian (termasuk Supplier)
    // ═══════════════════════════════════════════════════════════════════════
    {
        const items = [];
        add(items, hasProduct || lockedProduct, hasProduct, {
            key: "products",
            name: "Produk",
            href: r("admin.products.index"),
            icon: "product",
            current: "admin.products.*",
        });
        add(items, hasProduct || lockedProduct, hasProduct, {
            key: "barcode-labels",
            name: "Label Barcode",
            href: r("admin.barcode-labels.index"),
            icon: "tag",
            current: "admin.barcode-labels.*",
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
        smartGroup(
            { key: "stock", name: "Manajemen Stok", icon: "stock" },
            items,
            stockCandidates(Stock?.val, Batch?.val, Adjust?.val, Opname?.val, Transfer?.val, Waste?.val),
        );
        // Pembelian — smart item: PO → Retur Beli → Supplier
        smartGroup(
            { key: "purchases", name: "Pembelian", icon: "purchase" },
            items,
            purchaseCandidates(Purchase?.val, PurchReturn?.val, Supplier?.val),
        );
        if (items.length > 0)
            groups.push({
                key: "catalog",
                label: "Katalog & Stok",
                icon: "product",
                items: sortByLockState(items),
            });
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  [5] PELANGGAN & TIM — 3 item
    // ═══════════════════════════════════════════════════════════════════════
    {
        const items = [];
        smartGroup(
            { key: "loyalty", name: "Pelanggan & Loyalitas", icon: "customer" },
            items,
            loyaltyCandidates(hasCustomer, Membership?.val),
        );
        smartGroup(
            { key: "hr", name: "Karyawan", icon: "users" },
            items,
            hrCandidates(hasEmployee, Commission?.val),
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
                key: "people",
                label: "Pelanggan & Tim",
                icon: "customer",
                items: sortByLockState(items),
            });
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  [6] LAPORAN — 2 item
    //  Log Aktivitas ikut di sini: isinya riwayat/audit, satu jenis kerja
    //  dengan laporan — bukan pengaturan.
    // ═══════════════════════════════════════════════════════════════════════
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
                icon: "reportSales",
                current: "admin.reports.*",
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
        if (items.length > 0)
            groups.push({
                key: "finance",
                label: "Laporan",
                icon: "reportSales",
                items: sortByLockState(items),
            });
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  [7] PENGATURAN — selalu tampil, dikunci (pinned), tidak bisa diatur
    //  Tidak ikut sortGroupsByLockState, selalu di posisi paling bawah sidebar.
    // ═══════════════════════════════════════════════════════════════════════
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
        // Metode Pembayaran — smart item: metode bayar → hutang → gateway →
        // wallet. Dulu bernama "Keuangan" dan tinggal di grup Laporan, padahal
        // isinya konfigurasi cara bayar, jadi tempatnya di Pengaturan.
        // Key-nya ikut diganti supaya tidak mewarisi urutan/penempatan lama.
        smartGroup(
            {
                key: "payment-methods",
                name: "Metode Pembayaran",
                icon: "currencyDollar",
            },
            items,
            financeCandidates(can, hasPaymentMethod, hasDebt, PaymentGw?.val),
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
        items.push({
            key: "themes",
            name: "Tema",
            href: r("admin.themes.index"),
            icon: "theme",
            // Route-nya admin.themes.index / .create / .edit — pola tanpa `.*`
            // tidak cocok dengan satu pun, jadi item ini dulu tidak pernah aktif.
            current: "admin.themes.*",
        });
        if (items.length > 0)
            groups.push({
                key: "system",
                label: "Pengaturan",
                icon: "cog",
                // pinned: true → grup ini selalu di posisi paling bawah sidebar,
                // tidak bisa dipindah atau diatur oleh user. Ditangani di
                // AuthenticatedLayout.jsx dan applyCustomLayout().
                pinned: true,
                items: sortByLockState(items),
            });
    }

    // Grup pinned (system) dikeluarkan dari sorting — selalu di bawah.
    const pinnedGroups = groups.filter((g) => g.pinned);
    const sortableGroups = groups.filter((g) => !g.pinned);

    return [...sortGroupsByLockState(sortableGroups), ...pinnedGroups];
}
