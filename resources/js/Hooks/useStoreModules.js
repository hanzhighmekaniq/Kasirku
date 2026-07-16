import { usePage } from "@inertiajs/react";

/**
 * Hook untuk cek fitur/mode store yang aktif.
 *
 * 3 layer validasi (konsisten dengan middleware CheckFeatureAccess):
 *  1. storeTypeFeatures — fitur yang didukung store TYPE ini (applicable_types)
 *  2. modules.features  — fitur yang diaktifkan developer untuk toko ini
 *  3. storePlan.features — fitur yang diizinkan plan
 *
 * can() = layer tambahan khusus karyawan (permission Spatie).
 */
export function useStoreModules() {
    const { currentStore, auth, storePlan, storeTypeFeatures, storeFeatureOverrides } =
        usePage().props ?? {};

    const modules = currentStore?.modules ?? {};
    const posModes = modules.pos_modes ?? [
        currentStore?.store_type ?? "retail",
    ];
    const moduleFeatures = modules.features ?? [];
    const permissions = auth?.permissions ?? [];

    // Layer 1 — store_type_feature dari relasi (pivot)
    const typeFeatures = storeTypeFeatures ?? [];
    const typeFeaturesLoaded = typeFeatures.length > 0;

    // Layer 2 — plan features
    const planFeatures = storePlan?.features ?? [];
    const planAllAll = planFeatures.length === 1 && planFeatures[0] === "*";

    // Layer 3 — store feature overrides (disabled by store owner)
    const storeDisabled = storeFeatureOverrides ?? [];

    const planAllows = (feature) => {
        if (planAllAll) return true;
        return planFeatures.includes(feature);
    };

    const typeSupports = (feature) => {
        if (!typeFeaturesLoaded) return false;
        return typeFeatures.includes(feature);
    };

    const moduleActive = (feature) => {
        if (moduleFeatures.length === 0) return true;
        return moduleFeatures.includes(feature);
    };

    const storeDisabledCheck = (feature) => {
        return storeDisabled.includes(feature);
    };

    /**
     * hasFeature = tipe toko support DAN plan mengizinkan DAN tidak dimatikan oleh toko.
     * Muncul normal, bisa diklik.
     */
    const hasFeature = (feature) =>
        typeSupports(feature) && planAllows(feature) && !storeDisabledCheck(feature);

    /**
     * isFeatureLocked = tipe toko support TAPI plan TIDAK mengizinkan.
     * Muncul di sidebar tapi dikunci — user lihat fiturnya ada di tipe toko,
     * tapi perlu upgrade plan untuk mengakses.
     *
     * Kalau tipe toko TIDAK support → HIDDEN total (bahkan URL pun diblok).
     */
    const isFeatureLocked = (feature) =>
        typeSupports(feature) && !planAllows(feature);

    const can = (permission) => permissions.includes(permission);
    const canAny = (...perms) => perms.some((p) => permissions.includes(p));
    const hasMode = (mode) => posModes.includes(mode);

    // Mode flags
    const isRetail = hasMode("retail");
    const isFnb = hasMode("fnb");
    const isService = hasMode("service");
    const isRental = hasMode("rental");
    const isTicket = hasMode("ticket");
    const isHospitality = hasMode("hospitality");
    const isParking = hasMode("parking");
    const isSession = hasMode("session");
    const isLaundry = isService;

    // ── Computed feature flags ─────────────────────────────────────────────
    // POS & Transaksi
    const hasDashboard = hasFeature("dashboard");
    const hasPos = hasFeature("basic_pos");
    const hasShift = hasFeature("shift");
    const hasSaleReturn = hasFeature("sale_return");
    const hasPromo = hasFeature("promo");
    const hasExpense = hasFeature("expense");

    // Locked variants (plan/type fails but feature exists)
    const lockedDashboard = isFeatureLocked("dashboard");
    const lockedPos = isFeatureLocked("basic_pos");
    const lockedShift = isFeatureLocked("shift");
    const lockedSaleReturn = isFeatureLocked("sale_return");
    const lockedPromo = isFeatureLocked("promo");
    const lockedExpense = isFeatureLocked("expense");
    const lockedTable = isFeatureLocked("table");
    const lockedKitchen = isFeatureLocked("kitchen");
    const lockedQueue = isFeatureLocked("queue");
    const lockedBooking = isFeatureLocked("booking");
    const lockedProduct = isFeatureLocked("product");
    const lockedCategory = isFeatureLocked("category");
    const lockedModifier = isFeatureLocked("modifier");
    const lockedCustomer = isFeatureLocked("customer");
    const lockedMembership = isFeatureLocked("membership");
    const lockedSupplier = isFeatureLocked("supplier");
    const lockedEmployee = isFeatureLocked("employee");
    const lockedCommission = isFeatureLocked("commission");
    const lockedPurchase = isFeatureLocked("purchase");
    const lockedPurchaseReturn = isFeatureLocked("purchase_return");
    const lockedStock = isFeatureLocked("stock");
    const lockedBatchExpired = isFeatureLocked("batch_expired");
    const lockedAdjustment = isFeatureLocked("stock_adjustment");
    const lockedOpname = isFeatureLocked("stock_opname");
    const lockedTransfer = isFeatureLocked("stock_transfer");
    const lockedWaste = isFeatureLocked("waste");
    const lockedRecipe = isFeatureLocked("recipe");
    const lockedReport = isFeatureLocked("report");
    const lockedPaymentGw = isFeatureLocked("payment_gateway");
    const lockedPaymentMethod = isFeatureLocked("payment_method");
    const lockedSettings = isFeatureLocked("settings");
    const lockedUserManagement = isFeatureLocked("user_management");
    const lockedRoleManagement = isFeatureLocked("role_management");
    const lockedActivityLog = isFeatureLocked("activity_log");
    const lockedSidebarOrder = isFeatureLocked("sidebar_order");

    // Operasional mode-specific — mode flag hanya untuk badge/cosmetics
    const needsTable = hasFeature("table");
    const needsKitchen = hasFeature("kitchen");
    const needsQueue = hasFeature("queue");
    const needsBooking = hasFeature("booking");

    // Master data — storeTypeFeatures sudah jadi single source of truth
    const hasProduct = hasFeature("product");
    const hasCategory = hasFeature("category");
    const needsModifier = hasFeature("modifier");
    const hasCustomer = hasFeature("customer");
    const needsMembership = hasFeature("membership");
    const needsSupplier = hasFeature("supplier");
    const hasEmployee = hasFeature("employee");
    const needsCommission = hasFeature("commission");

    // Transaksi
    const hasPurchase = hasFeature("purchase");
    const hasPurchaseReturn = hasFeature("purchase_return");

    // Inventaris
    const needsStock = hasFeature("stock");
    const needsBatchExpired = hasFeature("batch_expired");
    const needsAdjustment = hasFeature("stock_adjustment");
    const needsOpname = hasFeature("stock_opname");
    const needsTransfer = hasFeature("stock_transfer");
    const needsWaste = hasFeature("waste");
    const needsRecipe = hasFeature("recipe");

    // Keuangan
    const needsReport = hasFeature("report");
    const needsPaymentGw = hasFeature("payment_gateway");
    const hasPaymentMethod = hasFeature("payment_method");
    const hasDebt = hasFeature("debt");
    const lockedDebt = isFeatureLocked("debt");

    // Sistem
    const hasSettings = hasFeature("settings");
    const hasUserManagement = hasFeature("user_management");
    const hasRoleManagement = hasFeature("role_management");
    const hasActivityLog = hasFeature("activity_log");
    const hasSidebarOrder = hasFeature("sidebar_order");

    // Backward-compat aliases (masih dipakai kode lama)
    const needsStock_compat = needsStock;
    const needsSupplier_compat = needsSupplier;

    return {
        // Raw
        posModes,
        moduleFeatures,
        typeFeatures,
        planFeatures,
        storeDisabled,
        permissions,
        // Plan info
        plan: storePlan?.plan ?? "free",
        planLabel: storePlan?.label ?? "Free",
        planExpired: storePlan?.is_expired ?? false,
        canAddUser: storePlan?.can_add_user ?? false,
        canAddBranch: storePlan?.can_add_branch ?? false,
        // Checkers
        hasMode,
        hasFeature,
        planAllows,
        typeSupports,
        moduleActive,
        isFeatureLocked,
        can,
        canAny,
        // Mode flags
        isRetail,
        isFnb,
        isService,
        isRental,
        isTicket,
        isHospitality,
        isParking,
        isSession,
        isLaundry,
        // Feature flags — baru (34 features)
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
        hasDebt,
        hasSettings,
        hasUserManagement,
        hasRoleManagement,
        hasActivityLog,
        hasSidebarOrder,
        // Locked flags
        lockedDashboard,
        lockedPos,
        lockedShift,
        lockedSaleReturn,
        lockedPromo,
        lockedExpense,
        lockedTable,
        lockedKitchen,
        lockedQueue,
        lockedBooking,
        lockedProduct,
        lockedCategory,
        lockedModifier,
        lockedCustomer,
        lockedMembership,
        lockedSupplier,
        lockedEmployee,
        lockedCommission,
        lockedPurchase,
        lockedPurchaseReturn,
        lockedStock,
        lockedBatchExpired,
        lockedAdjustment,
        lockedOpname,
        lockedTransfer,
        lockedWaste,
        lockedRecipe,
        lockedReport,
        lockedPaymentGw,
        lockedPaymentMethod,
        lockedDebt,
        lockedSettings,
        lockedUserManagement,
        lockedRoleManagement,
        lockedActivityLog,
        lockedSidebarOrder,
        // Backward-compat
        needsStock: needsStock_compat,
        needsSupplier: needsSupplier_compat,
        activeFeatures: moduleFeatures,
    };
}
