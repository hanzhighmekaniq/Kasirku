/**
 * Single source for payment method icons — no emojis, all lucide-react.
 * Used by PaymentView panels and method grids.
 */
import {
    Banknote,
    CreditCard,
    Landmark,
    QrCode,
    Smartphone,
    Store,
    Wallet,
} from 'lucide-react';

/**
 * Map method code (lowercase) → { icon: LucideIcon, label: string }
 * Falls back to CreditCard for unknown codes.
 */
export const METHOD_ICONS = {
    cash:      { icon: Banknote,    label: 'Tunai' },
    qris:      { icon: QrCode,      label: 'QRIS' },
    gopay:     { icon: Smartphone,  label: 'GoPay' },
    shopeepay: { icon: Smartphone,  label: 'ShopeePay' },
    dana:      { icon: Smartphone,  label: 'DANA' },
    ovo:       { icon: Smartphone,  label: 'OVO' },
    bca_va:    { icon: Landmark,    label: 'VA BCA' },
    mandiri_va:{ icon: Landmark,    label: 'VA Mandiri' },
    bri_va:    { icon: Landmark,    label: 'VA BRI' },
    bni_va:    { icon: Landmark,    label: 'VA BNI' },
    permata_va:{ icon: Landmark,    label: 'VA Permata' },
    alfamart:  { icon: Store,       label: 'Alfamart' },
    // Generic
    debt:      { icon: CreditCard,  label: 'Kasbon' },
    digital:   { icon: Wallet,      label: 'Digital' },
    card:      { icon: CreditCard,  label: 'Kartu' },
};

/**
 * Get icon by method code (matches payment_methods.code lowercased).
 * Falls back to generic based on type.
 */
export function getMethodIcon(code, type) {
    const key = code?.toLowerCase();
    if (key && METHOD_ICONS[key]) return METHOD_ICONS[key].icon;

    // Fallback by type
    if (type === 'cash') return Banknote;
    if (type === 'debt') return CreditCard;
    if (type === 'digital') return Wallet;
    if (type === 'card') return CreditCard;

    return CreditCard;
}

/**
 * Get label by method code.
 */
export function getMethodLabel(code, type = '') {
    const key = code?.toLowerCase();
    if (key && METHOD_ICONS[key]) return METHOD_ICONS[key].label;

    if (type === 'cash') return 'Tunai';
    if (type === 'debt') return 'Kasbon';
    if (type === 'digital') return 'Digital';
    if (type === 'card') return 'Kartu';

    return code ?? type ?? '?';
}
