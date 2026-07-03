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
