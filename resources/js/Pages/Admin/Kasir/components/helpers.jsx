/* ── formatters ──────────────────────────────────────── */
export const fmt = (n) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(n ?? 0);

export const fmtShort = (n) =>
    new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(n ?? 0);

/* ── PG method labels ───────────────────────────────── */
export const PG_METHOD_LABELS = {
    qris: { label: "QRIS", icon: "\u{1F4F1}", badge: "QR" },
    gopay: { label: "GoPay", icon: "\u{1F7E2}", badge: "EP" },
    shopeepay: { label: "ShopeePay", icon: "\u{1F7E0}", badge: "EP" },
    dana: { label: "DANA", icon: "\u{1F535}", badge: "EP" },
    ovo: { label: "OVO", icon: "\u{1F7E3}", badge: "EP" },
    bca_va: { label: "VA BCA", icon: "\u{1F3E6}", badge: "VA" },
    mandiri_va: { label: "VA Mandiri", icon: "\u{1F3E6}", badge: "VA" },
    bri_va: { label: "VA BRI", icon: "\u{1F3E6}", badge: "VA" },
    bni_va: { label: "VA BNI", icon: "\u{1F3E6}", badge: "VA" },
    permata_va: { label: "VA Permata", icon: "\u{1F3E6}", badge: "VA" },
};

/**
 * Ambil harga tier yang berlaku untuk qty tertentu — variant-aware dengan
 * fallback ke product level. Dipakai bareng oleh useKasir (addToCart/changeQty)
 * dan RetailProductModal (preview subtotal real-time) supaya logikanya
 * konsisten satu sumber.
 */
export function getTierPrice(product, qty, variantId = null) {
    if (variantId !== null) {
        const variant = (product.variants ?? []).find((v) => v.id === variantId);
        if (variant?.price_tiers?.length) {
            const tiers = [...variant.price_tiers].sort((a, b) => a.min_qty - b.min_qty);
            let matched = null;
            for (const tier of tiers) {
                if (qty >= tier.min_qty) matched = tier;
                else break;
            }
            if (matched) return Number(matched.price);
        }
    }

    const productTiers = (product.price_tiers ?? []).filter((t) => !t.variant_id);
    if (!productTiers.length) return null;
    const tiers = [...productTiers].sort((a, b) => a.min_qty - b.min_qty);
    let matched = null;
    for (const tier of tiers) {
        if (qty >= tier.min_qty) matched = tier;
        else break;
    }
    return matched ? Number(matched.price) : null;
}

/** Match pg_method to existing payment_methods id by code/name */
export function findPgPaymentMethod(pgMethod, paymentMethods) {
    const code = pgMethod.replace("_va", "").toUpperCase(); // qris→QRIS, gopay→GOPAY, bca_va→BCA
    return paymentMethods.find((m) => {
        const mc = m.code?.toUpperCase();
        const mn = m.name?.toLowerCase();
        return (
            mc === code ||
            mn === pgMethod.replace("_", " ").toLowerCase() ||
            (pgMethod === "qris" && mc === "QRIS") ||
            (pgMethod.includes("va") && mc?.includes(code))
        );
    });
}
