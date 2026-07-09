/**
 * Currency utilities — satu sumber untuk semua format uang.
 */
const LOCALE = "id-ID";

/**
 * Format angka jadi string rupiah.
 *   formatRupiah(1500000) → "Rp 1.500.000"
 *   formatRupiah(0, { showZero: false }) → "—"
 */
export function formatRupiah(value, opts = {}) {
    const { compact = false, showZero = true, noPrefix = false } = opts;
    const num = Number(value ?? 0);

    if (!showZero && num === 0) return "—";

    const formatted = compact
        ? new Intl.NumberFormat(LOCALE, {
              notation: "compact",
              compactDisplay: "short",
          }).format(num)
        : new Intl.NumberFormat(LOCALE).format(num);

    return noPrefix ? formatted : `Rp ${formatted}`;
}

/**
 * Format angka tanpa prefix — untuk inline text.
 *   formatNumber(5000) → "5.000"
 */
export function formatNumber(value) {
    return new Intl.NumberFormat(LOCALE).format(Number(value ?? 0));
}

/**
 * Parse string rupiah ke number.
 *   parseRupiah("Rp 1.500.000") → 1500000
 */
export function parseRupiah(str) {
    if (!str) return 0;
    return parseInt(String(str).replace(/[^0-9-]/g, ""), 10) || 0;
}
