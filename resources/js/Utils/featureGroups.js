import {
    ArrowLeftRight,
    Boxes,
    ClipboardList,
    Cog,
    Home,
    Ticket,
    Users,
    Wallet,
} from "lucide-react";

/**
 * Taksonomi kategori fitur — satu sumber dipakai di semua halaman Developer
 * yang menampilkan fitur terkelompok (Fitur per Tipe Toko, Form Paket, Detail
 * User, Detail Store).
 *
 * Sengaja TIDAK memakai kolom `features.category` dari database
 * (`pos/inventory/crm/finance/system`) karena taksonomi itu lebih flat dan
 * tidak cocok dengan cara owner benar-benar melihat menu mereka. Contoh nyata:
 * "Manajemen Meja" & "Kitchen Display" dikategorikan `pos` di database, padahal
 * di sidebar admin (`resources/js/Config/navConfig.js`) keduanya masuk grup
 * "Operasional" bersama, terpisah dari kasir.
 *
 * Mapping code → group key di bawah ini mencerminkan grup admin yang
 * sebenarnya, supaya developer melihat fitur dikelompokkan sama seperti owner
 * melihat menu di sidebar mereka. Kalau `navConfig.js` menambah/mengubah grup,
 * sesuaikan juga di sini.
 */
export const FEATURE_GROUPS = {
    home: { label: "Beranda", Icon: Home },
    transaction: { label: "Penjualan", Icon: ArrowLeftRight },
    operations: { label: "Operasional", Icon: Ticket },
    catalog: { label: "Katalog & Stok", Icon: Boxes },
    people: { label: "Pelanggan & Tim", Icon: Users },
    finance: { label: "Keuangan & Laporan", Icon: Wallet },
    system: { label: "Sistem", Icon: Cog },
    other: { label: "Lainnya", Icon: ClipboardList },
};

/**
 * feature_code → group key, mengikuti persis pengelompokan `navConfig.js`.
 * Kode yang tidak terdaftar di sini jatuh ke "other".
 */
export const FEATURE_CODE_TO_GROUP = {
    // Beranda
    dashboard: "home",
    basic_pos: "home",
    // Penjualan
    shift: "transaction",
    sale_return: "transaction",
    promo: "transaction",
    expense: "transaction",
    // Operasional (mode-specific: meja, dapur, antrian, booking)
    table: "operations",
    kitchen: "operations",
    queue: "operations",
    booking: "operations",
    // Katalog & Stok
    product: "catalog",
    category: "catalog",
    modifier: "catalog",
    stock: "catalog",
    batch_expired: "catalog",
    stock_adjustment: "catalog",
    stock_opname: "catalog",
    stock_transfer: "catalog",
    waste: "catalog",
    recipe: "catalog",
    purchase: "catalog",
    purchase_return: "catalog",
    supplier: "catalog",
    // Pelanggan & Tim
    customer: "people",
    membership: "people",
    employee: "people",
    commission: "people",
    debt: "people",
    // Keuangan & Laporan
    report: "finance",
    payment_gateway: "finance",
    payment_method: "finance",
    cash_rounding: "finance",
    deposit: "finance",
    // Sistem
    settings: "system",
    user_management: "system",
    role_management: "system",
    activity_log: "system",
    sidebar_order: "system",
};

/** Urutan tampil grup — sama seperti urutan sidebar Admin. */
export const FEATURE_GROUP_ORDER = [
    "home",
    "transaction",
    "operations",
    "catalog",
    "people",
    "finance",
    "system",
    "other",
];

/** Group key milik satu fitur, berdasarkan `feature.code`. */
export function featureGroupOf(feature) {
    return FEATURE_CODE_TO_GROUP[feature?.code] ?? "other";
}
