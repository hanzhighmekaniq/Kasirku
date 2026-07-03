import { usePage } from "@inertiajs/react";

/**
 * Hook untuk cek fitur/mode store yang aktif.
 * Ada 2 layer check:
 *  1. modules.features — fitur yang diaktifkan owner di toko ini
 *  2. storePlan.features — fitur yang diizinkan oleh paket
 *
 * Kedua layer harus lolos agar fitur muncul di sidebar.
 */
export function useStoreModules() {
    const { currentStore, auth, storePlan, storeTypeFeatures } =
        usePage().props;

    const modules = currentStore?.modules ?? {};
    const posModes = modules.pos_modes ?? [
        currentStore?.store_type ?? "retail",
    ];
    const activeFeatures = storeTypeFeatures ?? modules.features ?? [];
    const permissions = auth?.permissions ?? [];

    // Fitur yang diizinkan plan
    const planFeatures = storePlan?.features ?? ["*"];
    const planAllAll = planFeatures.includes("*");

    /** Cek apakah plan mengizinkan fitur ini */
    const planAllows = (feature) => {
        if (planAllAll) return true;
        // Free hanya blokir payment_gateway, sisanya boleh
        if ((storePlan?.plan ?? "free") === "free") {
            const blockedInFree = ["payment_gateway"];
            return !blockedInFree.includes(feature);
        }
        // Basic ke atas izinkan semua
        return true;
    };

    /** Cek apakah store mengaktifkan fitur ini (di modules) */
    const moduleActive = (feature) => activeFeatures.includes(feature);

    /** Fitur aktif = plan izinkan AND store aktifkan */
    const hasFeature = (feature) =>
        planAllows(feature) && moduleActive(feature);

    /** Cek apakah user punya permission */
    const can = (permission) => permissions.includes(permission);

    /** Cek apakah user punya salah satu dari banyak permission */
    const canAny = (...perms) => perms.some((p) => permissions.includes(p));

    const hasMode = (mode) => posModes.includes(mode);

    // ── 6 mode strict ────────────────────────────────────────────────────────
    const isRetail = hasMode("retail");
    const isFnb = hasMode("fnb");
    const isService = hasMode("service");
    const isRental = hasMode("rental");
    const isTicket = hasMode("ticket");
    const isHospitality = hasMode("hospitality");

    // Backward-compat aliases — lama di-merge ke mode baru
    const isLaundry = isService; // laundry → service
    const isSession = isRental; // session (warnet/ps) → rental
    const isParking = false; // parking belum diimplementasi

    // Grouped helpers
    const needsStock = (isRetail || isFnb || isRental) && hasFeature("stock");
    const needsSupplier = (isRetail || isFnb) && hasFeature("purchase");
    const needsRecipe = isFnb && hasFeature("recipe");
    const needsModifier = isFnb && hasFeature("modifier");
    const needsTable = (isFnb || isHospitality) && hasFeature("table");
    const needsKitchen = isFnb && hasFeature("kitchen");
    const needsWaste = isFnb && hasFeature("waste");
    const needsQueue = hasFeature("queue");
    const needsBooking = hasFeature("booking");
    const needsCommission = hasFeature("commission");
    const needsMembership = hasFeature("membership");
    const needsDelivery = hasFeature("delivery");
    const needsReport = hasFeature("report") || planAllAll;
    const needsPaymentGw = hasFeature("payment_gateway") || planAllAll;

    return {
        // Raw
        posModes,
        activeFeatures,
        planFeatures,
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
        moduleActive,
        can,
        canAny,
        // Mode flags — 6 strict
        isRetail,
        isFnb,
        isService,
        isRental,
        isTicket,
        isHospitality,
        // Backward-compat aliases (jangan hapus — masih dipakai navConfig)
        isLaundry,
        isSession,
        isParking,
        // Feature flags
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
        needsDelivery,
        needsReport,
        needsPaymentGw,
    };
}
