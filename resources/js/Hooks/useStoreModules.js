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
    const { currentStore, auth, storePlan, storeTypeFeatures } =
        usePage().props;

    const modules        = currentStore?.modules ?? {};
    const posModes       = modules.pos_modes ?? [currentStore?.store_type ?? "retail"];
    const moduleFeatures = modules.features ?? [];
    const permissions    = auth?.permissions ?? [];

    // Layer 1 — applicable_types per tipe toko
    const typeFeatures = storeTypeFeatures ?? [];

    // Layer 3 — plan features
    const planFeatures = storePlan?.features ?? ["*"];
    const planAllAll   = planFeatures.includes("*");

    const planAllows = (feature) => {
        if (planAllAll) return true;
        if ((storePlan?.plan ?? "free") === "free") {
            return !["payment_gateway"].includes(feature);
        }
        return planFeatures.includes(feature);
    };

    const typeSupports = (feature) => {
        if (typeFeatures.length === 0) return true;
        return typeFeatures.includes(feature);
    };

    const moduleActive = (feature) => {
        if (moduleFeatures.length === 0) return true;
        return moduleFeatures.includes(feature);
    };

    /** 2-layer check: type + plan */
    const hasFeature = (feature) =>
        typeSupports(feature) && planAllows(feature);

    const can    = (permission) => permissions.includes(permission);
    const canAny = (...perms)   => perms.some((p) => permissions.includes(p));
    const hasMode = (mode)       => posModes.includes(mode);

    // Mode flags
    const isRetail      = hasMode("retail");
    const isFnb         = hasMode("fnb");
    const isService     = hasMode("service");
    const isRental      = hasMode("rental");
    const isTicket      = hasMode("ticket");
    const isHospitality = hasMode("hospitality");
    const isParking     = hasMode("parking");
    const isSession     = hasMode("session");
    const isLaundry     = isService;

    // ── Computed feature flags ─────────────────────────────────────────────
    // POS & Transaksi
    const hasDashboard   = hasFeature("dashboard");
    const hasPos         = hasFeature("basic_pos");
    const hasShift       = hasFeature("shift");
    const hasSaleReturn  = hasFeature("sale_return");
    const hasPromo       = hasFeature("promo");
    const hasExpense     = hasFeature("expense");

    // Operasional mode-specific
    const needsTable     = (isFnb || isHospitality) && hasFeature("table");
    const needsKitchen   = isFnb && hasFeature("kitchen");
    const needsQueue     = isService && hasFeature("queue");
    const needsBooking   = hasFeature("booking");

    // Master data
    const hasProduct     = hasFeature("product");
    const hasCategory    = hasFeature("category");
    const needsModifier  = isFnb && hasFeature("modifier");
    const hasCustomer    = hasFeature("customer");
    const needsMembership = hasFeature("membership");
    const needsSupplier  = (isRetail || isFnb || isRental) && hasFeature("supplier");
    const hasEmployee    = hasFeature("employee");
    const needsCommission = hasFeature("commission");

    // Transaksi
    const hasPurchase       = (isRetail || isFnb || isRental) && hasFeature("purchase");
    const hasPurchaseReturn = (isRetail || isFnb || isRental) && hasFeature("purchase_return");

    // Inventaris
    const needsStock        = (isRetail || isFnb || isRental) && hasFeature("stock");
    const needsBatchExpired = (isRetail || isFnb) && hasFeature("batch_expired");
    const needsAdjustment   = (isRetail || isFnb || isRental) && hasFeature("stock_adjustment");
    const needsOpname       = (isRetail || isFnb) && hasFeature("stock_opname");
    const needsTransfer     = (isRetail || isFnb || isRental) && hasFeature("stock_transfer");
    const needsWaste        = isFnb && hasFeature("waste");
    const needsRecipe       = isFnb && hasFeature("recipe");

    // Keuangan
    const needsReport    = hasFeature("report");
    const needsPaymentGw = hasFeature("payment_gateway");
    const hasPaymentMethod = hasFeature("payment_method");

    // Sistem
    const hasSettings       = hasFeature("settings");
    const hasUserManagement = hasFeature("user_management");
    const hasRoleManagement = hasFeature("role_management");
    const hasActivityLog    = hasFeature("activity_log");

    // Backward-compat aliases (masih dipakai kode lama)
    const needsStock_compat   = needsStock;
    const needsSupplier_compat = needsSupplier;

    return {
        // Raw
        posModes,
        moduleFeatures,
        typeFeatures,
        planFeatures,
        permissions,
        // Plan info
        plan:         storePlan?.plan       ?? "free",
        planLabel:    storePlan?.label      ?? "Free",
        planExpired:  storePlan?.is_expired ?? false,
        canAddUser:   storePlan?.can_add_user    ?? false,
        canAddBranch: storePlan?.can_add_branch  ?? false,
        // Checkers
        hasMode,
        hasFeature,
        planAllows,
        typeSupports,
        moduleActive,
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
        hasSettings,
        hasUserManagement,
        hasRoleManagement,
        hasActivityLog,
        // Backward-compat
        needsStock: needsStock_compat,
        needsSupplier: needsSupplier_compat,
        activeFeatures: moduleFeatures,
    };
}
