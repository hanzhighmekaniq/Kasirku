/**
 * Source of truth — 6 mode POS.
 * retail | fnb | service | rental | ticket | hospitality
 */
export const POS_MODES = {
    retail: {
        code: "retail",
        label: "Retail",
        icon: "🏪",
        description:
            "Transaksi barang cepat dengan stok, barcode, batch, dan retur.",
        pricingModel: "qty",
        requiredFields: ["items", "payments"],
        features: [
            "products",
            "categories",
            "barcode",
            "stock",
            "batch",
            "variant",
            "promo",
            "return",
            "customer_optional",
        ],
        orderTypes: [
            { v: "takeaway", l: "Ambil" },
            { v: "delivery", l: "Antar" },
            { v: "wholesale", l: "Grosir" },
        ],
        statusFlow: ["draft", "completed", "cancelled", "refunded"],
    },
    fnb: {
        code: "fnb",
        label: "F&B",
        icon: "☕",
        description:
            "Order menu dengan meja, modifier, delivery, dapur, dan resep bahan baku.",
        pricingModel: "qty_modifier",
        requiredFields: ["items", "order_type", "payments"],
        features: [
            "products",
            "categories",
            "tables",
            "order_type",
            "modifiers",
            "kitchen",
            "recipes",
            "delivery",
            "service_charge",
            "promo",
        ],
        orderTypes: [
            { v: "dine_in", l: "Dine-in" },
            { v: "takeaway", l: "Takeaway" },
            { v: "delivery", l: "Delivery" },
        ],
        statusFlow: [
            "ordered",
            "cooking",
            "ready",
            "served",
            "paid",
            "cancelled",
        ],
    },
    service: {
        code: "service",
        label: "Service",
        icon: "✂️",
        description:
            "Transaksi jasa dengan customer, pegawai, booking/antrian, dan komisi.",
        pricingModel: "service_item",
        requiredFields: ["items", "customer", "payments"],
        features: [
            "services",
            "customer_required",
            "employee",
            "booking",
            "queue",
            "commission",
            "service_status",
            "deposit",
            "promo",
        ],
        orderTypes: [
            { v: "walk_in", l: "Langsung" },
            { v: "booking", l: "Booking" },
            { v: "pickup_delivery", l: "Jemput & Antar" },
        ],
        statusFlow: ["waiting", "in_progress", "done", "paid", "cancelled"],
    },
    rental: {
        code: "rental",
        label: "Rental",
        icon: "🔑",
        description:
            "Penyewaan barang/unit dengan durasi, deposit, return, dan denda.",
        pricingModel: "duration",
        requiredFields: ["customer", "items", "duration", "payments"],
        features: [
            "rental_items",
            "availability",
            "duration",
            "start_end_datetime",
            "deposit",
            "condition_check",
            "late_fee",
            "damage_fee",
            "return_flow",
        ],
        orderTypes: [
            { v: "per_hour", l: "Per Jam" },
            { v: "per_day", l: "Per Hari" },
            { v: "per_week", l: "Per Minggu" },
        ],
        statusFlow: [
            "reserved",
            "active",
            "returned",
            "late",
            "damaged",
            "cancelled",
        ],
    },
    ticket: {
        code: "ticket",
        label: "Ticket",
        icon: "🎟️",
        description:
            "Ticketing & booking slot untuk bioskop, futsal, event, dan reservasi terjadwal.",
        pricingModel: "service_item",
        requiredFields: ["items", "customer", "payments"],
        features: [
            "services",
            "customer_required",
            "booking",
            "ticket",
            "seat_schedule",
            "promo",
        ],
        orderTypes: [
            { v: "online", l: "Booking Online" },
            { v: "walk_in", l: "Walk-in" },
            { v: "group", l: "Group" },
        ],
        statusFlow: [
            "booked",
            "checked_in",
            "completed",
            "cancelled",
            "refunded",
        ],
    },
    hospitality: {
        code: "hospitality",
        label: "Hospitality",
        icon: "🏨",
        description:
            "Hotel, villa, penginapan, dan kost dengan check-in/out, deposit, dan tamu.",
        pricingModel: "duration",
        requiredFields: ["customer", "items", "check_in", "payments"],
        features: [
            "customer_required",
            "room",
            "check_in_out",
            "deposit",
            "guest_count",
            "booking",
        ],
        orderTypes: [
            { v: "check_in", l: "Check-in" },
            { v: "reservation", l: "Reservasi" },
            { v: "short_stay", l: "Short Stay" },
        ],
        statusFlow: ["reserved", "checked_in", "checked_out", "cancelled"],
    },
};

export const POS_MODE_CODES = Object.keys(POS_MODES);

export function normalizePosMode(mode) {
    const code = mode || "retail";
    return POS_MODES[code] ? code : "retail";
}

export function getPosModeConfig(mode) {
    return POS_MODES[normalizePosMode(mode)];
}

export function modeHasFeature(mode, feature) {
    return getPosModeConfig(mode).features.includes(feature);
}
