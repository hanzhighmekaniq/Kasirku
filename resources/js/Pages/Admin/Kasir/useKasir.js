import axios from "axios";
import { useEffect, useMemo, useRef, useState } from "react";
import { router } from "@inertiajs/react";
import { enqueue } from "@/Services/mutationQueue";
import {
    getPosModeConfig,
    modeHasFeature,
    normalizePosMode,
    POS_MODES,
} from "./config/posModes";
import { getTierPrice as sharedGetTierPrice } from "./components/helpers";

/* ── formatters ──────────────────────────────────────── */
const fmt = (n) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(n ?? 0);

const fmtShort = (n) =>
    new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(n ?? 0);

/* ── ORDER TYPE options — 7 adaptive POS modes ─────────── */
const ORDER_TYPES = Object.fromEntries(
    Object.entries(POS_MODES).map(([code, config]) => [
        code,
        config.orderTypes,
    ]),
);

const TIER_COLORS = {
    bronze: "bg-amber-100 text-amber-700",
    silver: "bg-slate-100 text-slate-600",
    gold: "bg-yellow-100 text-yellow-700",
};

/* ── PG method labels ─────────────────────────────── */
const PG_METHOD_LABELS = {
    qris: { label: "QRIS", icon: "📱", badge: "QR" },
    gopay: { label: "GoPay", icon: "🟢", badge: "EP" },
    shopeepay: { label: "ShopeePay", icon: "🟠", badge: "EP" },
    dana: { label: "DANA", icon: "🔵", badge: "EP" },
    ovo: { label: "OVO", icon: "🟣", badge: "EP" },
    bca_va: { label: "VA BCA", icon: "🏦", badge: "VA" },
    mandiri_va: { label: "VA Mandiri", icon: "🏦", badge: "VA" },
    bri_va: { label: "VA BRI", icon: "🏦", badge: "VA" },
    bni_va: { label: "VA BNI", icon: "🏦", badge: "VA" },
    permata_va: { label: "VA Permata", icon: "🏦", badge: "VA" },
};

/** Match pg_method to existing payment_methods id by code/name */
function findPgPaymentMethod(pgMethod, paymentMethods) {
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

/** Ambil harga tier yang berlaku untuk qty tertentu — variant-aware dengan fallback ke product level */
const getTierPrice = sharedGetTierPrice;

export default function useKasir({
    products,
    categories,
    paymentMethods,
    initialCustomers,
    tables,
    todaySales,
    storeType,
    storeName,
    receiptFooter,
    pgMethods = [],
    promotions = [],
    activeShift = null,
    posMode,
    employees = [],
    storeFeatureSettings = {},
}) {
    /* ── mode detection ─────────────────────────────────── */
    const activeMode = normalizePosMode(posMode || storeType);
    const modeConfig = getPosModeConfig(activeMode);
    const isRetail = activeMode === "retail";
    const isFnb = activeMode === "fnb";
    const isService = activeMode === "service";
    const isRental = activeMode === "rental";
    const isTicket = activeMode === "ticket";
    const isHospitality = activeMode === "hospitality";
    const isParking = activeMode === "parking";
    const isSession = activeMode === "session";

    // backward compat
    const isCafe = isFnb;
    const isBooth = isFnb;
    const orderOpts = modeConfig.orderTypes;
    const hasModeFeature = (feature) => modeHasFeature(activeMode, feature);

    // Label & order type pemicu pemilih ruang — "Meja" untuk fnb (dine_in),
    // "Kamar" untuk hospitality (check_in). Order type-nya BEDA per mode,
    // jangan disamakan jadi "dine_in" untuk semua.
    const tableLabel = isHospitality ? "Kamar" : "Meja";
    const tableTriggerOrderType = isHospitality ? "check_in" : "dine_in";

    /* ── state ── */
    const [customers, setCustomers] = useState(initialCustomers || []);
    const [search, setSearch] = useState("");
    const [activeCat, setActiveCat] = useState("");
    const [cart, setCart] = useState([]);
    // Ref (bukan state) untuk penomoran cartId — dibaca & ditulis secara
    // synchronous di dalam addToCart, jadi aman dari stale closure walau
    // addToCart dipanggil berkali-kali sebelum React sempat re-render.
    const cartIdSeqRef = useRef(0);

    // ── Transaksi ditahan (Hold / Park) — disimpan di localStorage saja ──
    const HELD_KEY = `pos:held:${storeName || "default"}`;
    const [heldTransactions, setHeldTransactions] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem(HELD_KEY) || "[]");
        } catch {
            return [];
        }
    });

    /* ── scanner state ── */
    const [showScanner, setShowScanner] = useState(false);
    const [scanning, setScanning] = useState(false);

    /* ── Diskon & pajak manual ──────────────────────────────────
     * Dimodelkan sebagai { type, value } supaya kasir bisa memilih
     * persentase (%) atau nominal tetap (Rp). Nilai Rupiah `discount`
     * dan `tax` DITURUNKAN dari sini di bagian totals (lihat di bawah),
     * jadi diskon persen otomatis ikut berubah saat isi keranjang berubah.
     */
    const [discountType, setDiscountType] = useState("fixed"); // 'fixed' | 'percent'
    const [discountValue, setDiscountValue] = useState(0);
    const [discountReason, setDiscountReason] = useState("");
    const [taxType, setTaxType] = useState("fixed"); // 'fixed' | 'percent'
    const [taxValue, setTaxValue] = useState(0);
    const [taxName, setTaxName] = useState("");

    // Backward-compat: setDiscount(n)/setTax(n) memperlakukan input sebagai
    // nominal tetap (fixed) — dipakai halaman fallback Kasir.jsx.
    const setDiscount = (v) => {
        setDiscountType("fixed");
        setDiscountValue(Number(v) || 0);
    };
    const setTax = (v) => {
        setTaxType("fixed");
        setTaxValue(Number(v) || 0);
    };

    // API modal Diskon / Pajak Manual
    const applyDiscount = ({ type, value, reason }) => {
        setDiscountType(type === "percent" ? "percent" : "fixed");
        setDiscountValue(Number(value) || 0);
        setDiscountReason(reason ?? "");
    };
    const clearDiscount = () => {
        setDiscountType("fixed");
        setDiscountValue(0);
        setDiscountReason("");
    };
    const applyTax = ({ type, value, name }) => {
        setTaxType(type === "percent" ? "percent" : "fixed");
        setTaxValue(Number(value) || 0);
        setTaxName(name ?? "");
    };
    const clearTax = () => {
        setTaxType("fixed");
        setTaxValue(0);
        setTaxName("");
    };

    const [orderType, setOrderType] = useState(orderOpts[0].v);

    /* ── customer / table / delivery ── */
    const [selectedCustomer, setSelectedCustomer] = useState("");
    const [customerSearch, setCustomerSearch] = useState("");
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    const [customerDropdownPos, setCustomerDropdownPos] = useState({
        top: 0,
        left: 0,
        width: 0,
    });
    const [selectedTable, setSelectedTable] = useState("");
    const [tableSearch, setTableSearch] = useState("");
    const [deliveryAddress, setDeliveryAddress] = useState("");
    const [deliveryFee, setDeliveryFee] = useState("");
    const [deliveryCustomerName, setDeliveryCustomerName] = useState("");
    const [takeawayCustomerName, setTakeawayCustomerName] = useState("");
    // Info tambahan pickup/delivery — dikumpulkan via modal, dilipat ke
    // `notes` saat submit (tanpa mengubah skema backend).
    const [deliveryPhone, setDeliveryPhone] = useState("");
    const [deliveryCourier, setDeliveryCourier] = useState("");
    const [deliveryNote, setDeliveryNote] = useState("");
    const [takeawayPhone, setTakeawayPhone] = useState("");
    const [pickupTime, setPickupTime] = useState("");
    const [deliveryInfoOpen, setDeliveryInfoOpen] = useState(true);
    const [quickAddOpen, setQuickAddOpen] = useState(false);
    const [quickAddName, setQuickAddName] = useState("");
    const [quickAddPhone, setQuickAddPhone] = useState("");
    const [quickAdding, setQuickAdding] = useState(false);
    const [showTableDropdown, setShowTableDropdown] = useState(false);
    const [tableDropdownPos, setTableDropdownPos] = useState({
        top: 0,
        left: 0,
        width: 0,
    });
    const [note, setNote] = useState("");

    /* mode-specific state
     *
     * PERHATIAN: ticketEvent, ticketSlot, dan roomNumber di-reuse lintas
     * mode dengan ARTI BERBEDA tergantung activeMode saat ini (bukan bug,
     * tapi technical debt penamaan — hati-hati saat menambah fitur baru):
     *
     * - ticketEvent : nama event (ticket) | nama petugas fallback (service) | plat nomor kendaraan (parking)
     * - ticketSlot  : no. booking/slot (ticket) | no. booking-antrian (service) | jenis kendaraan (parking)
     * - roomNumber  : no. kamar (hospitality) | nama unit sewa (rental) | no. tiket (parking) | nama unit PC/PS (session)
     */
    const [rentalDuration, setRentalDuration] = useState(1);
    const [rentalUnit, setRentalUnit] = useState("per_hour");
    const [ticketEvent, setTicketEvent] = useState("");
    const [ticketSlot, setTicketSlot] = useState("");
    const [roomNumber, setRoomNumber] = useState("");
    const [guestCount, setGuestCount] = useState(1);
    const [selectedEmployee, setSelectedEmployee] = useState("");

    /* ── modal / UI state ── */
    const [modifierTarget, setModifierTarget] = useState(null);
    const [variantTarget, setVariantTarget] = useState(null);
    // Non-retail multi-satuan (legacy UnitModal) — dipakai mode selain retail
    // yang produknya punya packaging_units tapi tanpa variant/modifier.
    const [unitTarget, setUnitTarget] = useState(null);
    // Retail-only: modal adaptif tunggal (variant → unit → qty → notes)
    // menggantikan VariantModal + UnitModal untuk mode retail.
    const [retailProductTarget, setRetailProductTarget] = useState(null);
    const [showPayment, setShowPayment] = useState(false);
    const [showReceipt, setShowReceipt] = useState(false);
    const [receiptData, setReceiptData] = useState(null);
    const [showHistory, setShowHistory] = useState(false);
    const [historyPrintLoading, setHistoryPrintLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [historyList, setHistoryList] = useState(todaySales);
    const [cartPanelOpen, setCartPanelOpen] = useState(false);
    const [sidebarWidth, setSidebarWidth] = useState(384);
    const sidebarResizing = useRef(false);
    const [pgModalData, setPgModalData] = useState(null);
    // { productName, available, requested } | null — dipakai StockAlertModal
    const [stockAlert, setStockAlert] = useState(null);

    /* ── refs ── */
    const customerDropdownRef = useRef(null);
    const customerInputRef = useRef(null);
    const tableDropdownRef = useRef(null);
    const tableInputRef = useRef(null);
    const barcodeRef = useRef(null);

    /* ── sidebar resize ── */
    useEffect(() => {
        const onMouseMove = (e) => {
            if (!sidebarResizing.current) return;
            const newWidth = window.innerWidth - e.clientX;
            setSidebarWidth(Math.min(Math.max(newWidth, 280), 600));
        };
        const onMouseUp = () => {
            sidebarResizing.current = false;
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
        };
        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
        return () => {
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseup", onMouseUp);
        };
    }, []);

    const startSidebarResize = () => {
        sidebarResizing.current = true;
        document.body.style.cursor = "col-resize";
        document.body.style.userSelect = "none";
    };

    /* ── filtering ── */
    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return products.filter((p) => {
            const matchCat = !activeCat || String(p.category_id) === activeCat;
            const matchQ =
                !q ||
                p.name.toLowerCase().includes(q) ||
                p.sku.toLowerCase().includes(q) ||
                (p.barcode ?? "").toLowerCase().includes(q);
            return matchCat && matchQ;
        });
    }, [products, search, activeCat]);

    /* ── customer tier ── */
    const customerTier = useMemo(() => {
        if (!selectedCustomer) return null;
        const cust = customers.find(
            (c) => String(c.id) === String(selectedCustomer),
        );
        return cust?.tier ?? null;
    }, [selectedCustomer, customers]);

    /* ── promo helpers ── */
    // Mirror backend PromotionService logic for frontend preview
    const findBestPromoForItem = (productId, qty, unitPrice) => {
        if (!promotions.length) return null;
        const itemTotal = qty * unitPrice;
        let best = null;
        let bestDiscount = 0;

        // Filter to per-item promos only
        const itemPromos = promotions.filter(
            (p) => (p.scope || "item") === "item",
        );

        for (const promo of itemPromos) {
            // Check if product is in this promo (or promo applies to all — no products)
            const hasProducts = promo.products && promo.products.length > 0;
            if (hasProducts && !promo.products.some((p) => p.id === productId))
                continue;

            // Check min_purchase
            if (
                promo.min_purchase_amount > 0 &&
                itemTotal < promo.min_purchase_amount
            )
                continue;

            // Check min_quantity
            if (promo.min_quantity > 0 && qty < promo.min_quantity) continue;

            // Check customer tier
            if (promo.customer_tier && promo.customer_tier !== customerTier)
                continue;

            let d = 0;
            if (promo.type === "percentage") {
                d = itemTotal * (Number(promo.discount_value) / 100);
                if (promo.max_discount_amount > 0)
                    d = Math.min(d, Number(promo.max_discount_amount));
            } else if (promo.type === "fixed_amount") {
                d = Number(promo.discount_value);
            } else if (promo.type === "buy_x_get_y") {
                const buyQty = parseInt(promo.discount_value, 10);
                if (buyQty > 0 && qty >= buyQty + 1) {
                    d = Math.floor(qty / (buyQty + 1)) * unitPrice;
                }
            } else if (promo.type === "bundle") {
                d = Number(promo.discount_value) * qty;
            } else if (promo.type === "tiered") {
                const tierPrice = Number(promo.tier_price);
                if (tierPrice > 0 && unitPrice > tierPrice) {
                    d = (unitPrice - tierPrice) * qty;
                }
            } else if (promo.type === "member_price") {
                const tierPrice = Number(promo.tier_price);
                if (tierPrice > 0 && unitPrice > tierPrice) {
                    d = (unitPrice - tierPrice) * qty;
                }
            } else if (promo.type === "bogo") {
                const buyQty = parseInt(promo.discount_value, 10);
                if (buyQty > 0 && promo.free_product_id && qty >= buyQty) {
                    const freeCount = Math.floor(qty / buyQty);
                    const freeProduct = promo.freeProduct;
                    d = freeCount * (freeProduct?.sell_price ?? 0);
                }
            }

            if (d > bestDiscount) {
                bestDiscount = d;
                best = promo;
            }
        }

        return best && bestDiscount > 0
            ? { promo: best, discount: Math.round(bestDiscount) }
            : null;
    };

    // Find best cart-level promo
    const findBestCartPromo = (cartSubtotal) => {
        if (!promotions.length) return null;
        const cartPromos = promotions.filter(
            (p) => (p.scope || "item") === "cart",
        );
        if (!cartPromos.length) return null;

        let bestDiscount = 0;
        let bestPromo = null;

        for (const promo of cartPromos) {
            if (
                promo.min_purchase_amount > 0 &&
                cartSubtotal < promo.min_purchase_amount
            )
                continue;
            if (promo.customer_tier && promo.customer_tier !== customerTier)
                continue;

            let d = 0;
            if (promo.type === "percentage") {
                d = cartSubtotal * (Number(promo.discount_value) / 100);
                if (promo.max_discount_amount > 0)
                    d = Math.min(d, Number(promo.max_discount_amount));
            } else if (promo.type === "fixed_amount") {
                d = Number(promo.discount_value);
            }

            if (d > bestDiscount) {
                bestDiscount = d;
                bestPromo = promo;
            }
        }

        return bestPromo && bestDiscount > 0
            ? { promo: bestPromo, discount: Math.round(bestDiscount) }
            : null;
    };

    // Cart-level promo result (recalculated when cart or customer changes)
    const cartSubtotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
    const cartPromoResult = useMemo(
        () => findBestCartPromo(cartSubtotal),
        [cartSubtotal, customerTier, promotions],
    );
    const cartPromoDiscount = cartPromoResult?.discount ?? 0;
    const cartPromoName = cartPromoResult?.promo?.name ?? null;

    // Recalculate promo for a single cart item (used after qty change)
    const recalcPromo = (item) => {
        const result = findBestPromoForItem(
            item.productId,
            item.qty,
            item.price,
        );
        return {
            ...item,
            promoDiscount: result?.discount ?? 0,
            promoName: result?.promo?.name ?? null,
        };
    };

    // Recalculate all cart promos when customer tier changes (for member_price)
    useEffect(() => {
        if (cart.length === 0) return;
        setCart((prev) =>
            prev.map((c) => {
                const result = findBestPromoForItem(
                    c.productId,
                    c.qty,
                    c.price,
                );
                return {
                    ...c,
                    promoDiscount: result?.discount ?? 0,
                    promoName: result?.promo?.name ?? null,
                };
            }),
        );
    }, [customerTier]);

    /* ── scanner helpers ── */
    const playBeep = () => {
        const audioContext = new (
            window.AudioContext || window.webkitAudioContext
        )();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 1200;
        oscillator.type = "square";

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
            0.01,
            audioContext.currentTime + 0.1,
        );

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    };

    /* ── cart helpers ── */
    /**
     * Tambah produk ke keranjang.
     *
     * PENTING: jangan panggil fungsi ini berkali-kali dalam loop untuk
     * menambah qty > 1 (misal `for (let i=0;i<qty;i++) addToCart(...)`).
     * Karena setCart bersifat asinkron, tiap iterasi loop akan membaca
     * state `cart` yang belum ter-update oleh iterasi sebelumnya (stale
     * closure) — akibatnya item yang sama malah tercatat sebagai beberapa
     * baris terpisah di keranjang alih-alih qty-nya bertambah.
     * Gunakan parameter `qty` di bawah untuk menambah lebih dari 1 sekaligus
     * dalam satu update state.
     */
    const addToCart = (
        product,
        variant = null,
        modifiers = [],
        itemNote = "",
        packagingUnit = null,
        qty = 1,
    ) => {
        // ── Cek stok sebelum masuk keranjang ──
        // Stok dicek dari bucket yang sesuai (product+variant+packaging_unit),
        // bukan flat product.stock — bucket tidak melakukan konversi otomatis,
        // jadi qty yang dicek adalah qty asli dalam satuan bucket itu sendiri.
        if (product.track_stock) {
            const bucketStock = packagingUnit
                ? Number(packagingUnit.stock ?? 0)
                : variant
                  ? Number(variant.stock ?? 0)
                  : Number(product.stock ?? 0);

            // Hitung qty yang sudah ada di keranjang untuk bucket yang sama
            const currentCartQty = cart
                .filter(
                    (c) =>
                        c.productId === product.id &&
                        (c.variantId ?? null) === (variant?.id ?? null) &&
                        (c.packagingUnitId ?? null) === (packagingUnit?.id ?? null),
                )
                .reduce((sum, c) => sum + c.qty, 0);

            const availableStock = bucketStock - currentCartQty;

            if (qty > availableStock) {
                const unitLabel = packagingUnit?.name ?? product.unit ?? "pcs";
                setStockAlert({
                    productName: variant
                        ? `${product.name} (${variant.name}${packagingUnit ? ` - ${packagingUnit.name}` : ""})`
                        : packagingUnit
                          ? `${product.name} (${packagingUnit.name})`
                          : product.name,
                    available: Math.max(0, availableStock),
                    requested: qty,
                    unitLabel,
                });
                return;
            }
        }

        const basePrice = packagingUnit
            ? Number(packagingUnit.sell_price)
            : variant
              ? Number(variant.price)
              : Number(product.sell_price);
        const modExtra = modifiers.reduce(
            (s, m) => s + (m.price_addition ?? 0),
            0,
        );

        // Cek tier price untuk qty yang diminta — variant-aware
        const tierPrice = !packagingUnit
            ? getTierPrice(product, qty, variant?.id ?? null)
            : null;
        const effectivePrice = (tierPrice ?? basePrice) + modExtra;

        // find existing identical item (same product+variant+modifiers+unit)
        const unitId = packagingUnit?.id ?? 0;
        const key = `${product.id}-${variant?.id ?? 0}-${unitId}-${JSON.stringify(modifiers)}`;

        setCart((prev) => {
            const existing = prev.find(
                (c) => c.key === key && c.note === itemNote,
            );

            if (existing) {
                return prev.map((c) => {
                    if (c.cartId !== existing.cartId) return c;
                    const updated = { ...c, qty: c.qty + qty };
                    return recalcPromo(updated);
                });
            }

            cartIdSeqRef.current += 1;
            const newItem = {
                cartId: cartIdSeqRef.current,
                key,
                productId: product.id,
                variantId: variant?.id ?? null,
                packagingUnitId: packagingUnit?.id ?? null,
                packagingUnitName: packagingUnit?.name ?? null,
                conversionQty: packagingUnit?.conversion_qty ?? 1,
                name: product.name,
                variantName: variant?.name ?? null,
                price: effectivePrice,
                qty,
                modifiers,
                note: itemNote,
            };
            const withPromo = recalcPromo(newItem);
            return [...prev, withPromo];
        });
    };

    const changeQty = (cartId, delta) => {
        setCart((prev) => {
            const item = prev.find((c) => c.cartId === cartId);
            if (!item) return prev;

            // Cek stok bucket jika menambah qty — bucket yang sama persis
            // (product + variant + packaging_unit), tanpa konversi otomatis.
            if (delta > 0) {
                const product = products.find((p) => p.id === item.productId);
                if (product?.track_stock) {
                    const variant = item.variantId
                        ? (product.variants ?? []).find((v) => v.id === item.variantId)
                        : null;
                    const packagingUnit = item.packagingUnitId
                        ? (variant?.packaging_units ?? product.packaging_units ?? []).find(
                              (u) => u.id === item.packagingUnitId,
                          )
                        : null;

                    const bucketStock = packagingUnit
                        ? Number(packagingUnit.stock ?? 0)
                        : variant
                          ? Number(variant.stock ?? 0)
                          : Number(product.stock ?? 0);

                    const currentBucketQty = prev
                        .filter(
                            (c) =>
                                c.productId === item.productId &&
                                (c.variantId ?? null) === (item.variantId ?? null) &&
                                (c.packagingUnitId ?? null) === (item.packagingUnitId ?? null),
                        )
                        .reduce((sum, c) => sum + c.qty, 0);

                    const available = bucketStock - currentBucketQty;

                    if (delta > available) {
                        setStockAlert({
                            productName: item.name,
                            available: Math.max(0, available),
                            requested: delta,
                            unitLabel: packagingUnit?.name ?? product.unit ?? "pcs",
                        });
                        return prev;
                    }
                }
            }

            return prev
                .map((c) => {
                    if (c.cartId !== cartId) return c;
                    const newQty = Math.max(1, c.qty + delta);

                    // Recalculate tier price if product has tiers
                    const product = products.find((p) => p.id === c.productId);
                    let newPrice = c.price;
                    // Recalculate tier price — variant-aware
                    const hasTiers = product?.price_tiers?.length ||
                        (product?.variants ?? []).some((v) => v.id === c.variantId && v.price_tiers?.length);
                    if (hasTiers && !c.packagingUnitId) {
                        const tierPrice = getTierPrice(product, newQty, c.variantId ?? null);
                        if (tierPrice !== null) {
                            const modExtra = (c.modifiers ?? []).reduce(
                                (s, m) => s + (m.price_addition ?? 0), 0,
                            );
                            newPrice = tierPrice + modExtra;
                        } else {
                            // No tier matches — fallback to base price (variant or product)
                            const variant = c.variantId
                                ? (product?.variants ?? []).find((v) => v.id === c.variantId)
                                : null;
                            const basePrice = variant ? Number(variant.price) : Number(product?.sell_price ?? c.price);
                            const modExtra = (c.modifiers ?? []).reduce(
                                (s, m) => s + (m.price_addition ?? 0), 0,
                            );
                            newPrice = basePrice + modExtra;
                        }
                    }

                    return recalcPromo({ ...c, qty: newQty, price: newPrice });
                })
                .filter((c) => c.qty > 0);
        });
    };

    const removeItem = (cartId) =>
        setCart((prev) => prev.filter((c) => c.cartId !== cartId));

    const clearCart = () => {
        setCart([]);
        clearDiscount();
        clearTax();
        setNote("");
        setSelectedCustomer("");
        setSelectedTable("");
        setCustomerSearch("");
        setShowCustomerDropdown(false);
        setTableSearch("");
        setShowTableDropdown(false);
        setDeliveryAddress("");
        setDeliveryFee("");
        setDeliveryCustomerName("");
        setDeliveryPhone("");
        setDeliveryCourier("");
        setDeliveryNote("");
        setTakeawayCustomerName("");
        setTakeawayPhone("");
        setPickupTime("");
        setDeliveryInfoOpen(true);
        setQuickAddOpen(false);
        setQuickAddName("");
        setQuickAddPhone("");
        setOrderType(orderOpts[0].v);
        setSelectedEmployee("");
    };

    /* ── click product ── */
    const handleProductClick = (product) => {
        const hasModifiers = (product.modifier_groups ?? []).length > 0;
        const hasVariants =
            (product.variants ?? []).filter((v) => v.is_active).length > 0;
        const hasUnits = (product.packaging_units ?? []).length > 0;

        if (hasModifiers) {
            // Produk dengan modifier — buka ModifierModal (behaviour lama)
            setModifierTarget(product);
            return;
        }

        // Retail: produk dengan variant atau multi-satuan → RetailProductModal
        // Produk simple (tanpa variant & tanpa multi-satuan) → langsung cart
        if (isRetail) {
            if (!hasVariants && !hasUnits) {
                addToCart(product);
                return;
            }
            setRetailProductTarget(product);
            return;
        }

        if (hasVariants) {
            // Produk dengan variant tapi tanpa modifier — buka VariantModal
            setVariantTarget(product);
        } else if (hasUnits) {
            // Produk non-retail dengan multi-satuan — buka UnitModal (legacy)
            setUnitTarget(product);
        } else {
            // Produk biasa — langsung masuk cart
            addToCart(product);
        }
    };

    /* ── barcode scan handler ── */
    const handleBarcodeScan = (barcode) => {
        setScanning(false);

        console.log("[Scan] Barcode:", barcode);

        let found = false;

        // 1. Cari produk regular (barcode di product)
        const product = products.find((p) => p.barcode === barcode);
        if (product) {
            console.log("[Scan] Produk ketemu:", product.name);
            playBeep();
            addToCart(product);
            found = true;
        } else {
            // 2. Cari variant (barcode di variant)
            for (const p of products) {
                const variant = p.variants?.find((v) => v.barcode === barcode);
                if (variant) {
                    console.log(
                        "[Scan] Variant ketemu:",
                        p.name,
                        "-",
                        variant.name,
                    );
                    playBeep();
                    addToCart(p, variant);
                    found = true;
                    break;
                }
            }
        }

        // 3. Cari packaging unit (barcode di packaging unit)
        if (!found) {
            for (const p of products) {
                const pu = p.packaging_units?.find((u) => u.barcode === barcode);
                if (pu) {
                    console.log("[Scan] Packaging unit ketemu:", p.name, "-", pu.name);
                    playBeep();
                    addToCart(p, null, [], "", pu);
                    found = true;
                    break;
                }
            }
        }

        if (!found) {
            console.log("[Scan] Tidak ketemu");
            alert('Produk dengan barcode "' + barcode + '" tidak ditemukan');
        }
    };

    /* ── order type change ── */
    const handleOrderTypeChange = (v) => {
        setOrderType(v);
        if (v !== "dine_in") setSelectedTable("");
    };

    /* ── print history ── */
    const handlePrintHistory = async (saleId) => {
        setHistoryPrintLoading(true);
        try {
            const { data } = await axios.get(
                route("admin.sales.print", saleId),
                { headers: { Accept: "application/json" } },
            );
            const sale = data.sale;
            const formatted = {
                isOffline: false,
                saleNo: sale.sale_no,
                customerName: sale.customer?.name ?? null,
                tableName: sale.table?.table_number ?? null,
                items: (sale.items ?? []).map((item) => ({
                    name: item.product?.name ?? "Produk",
                    variantName: item.variant_name ?? null,
                    qty: item.quantity,
                    price: item.price,
                    subtotal: item.subtotal,
                    promoDiscount: item.promo_discount ?? 0,
                    promoName: null,
                    modifiers: (item.modifiers ?? []).map((m) => ({
                        name: m.name,
                        price_addition: m.price_addition,
                    })),
                })),
                subtotal: sale.subtotal,
                totalPromoDisc: 0,
                cartPromoDiscount: 0,
                cartPromoName: null,
                discount: sale.discount_amount ?? 0,
                tax: sale.tax_amount ?? 0,
                grandTotal: sale.grand_total,
                change: sale.change_amount ?? 0,
                payments: (sale.payments ?? []).map((p) => ({
                    methodName:
                        p.payment_method?.name ??
                        p.paymentMethod?.name ??
                        "Pembayaran",
                    amount: p.amount,
                })),
                orderType: sale.order_type,
                deliveryAddress: sale.delivery_address ?? null,
                deliveryFee: parseFloat(sale.shipping_amount ?? 0),
                deliveryCustomerName: sale.delivery_address
                    ? sale.delivery_address.startsWith("Penerima: ")
                        ? sale.delivery_address
                              .split("\n")[0]
                              .replace("Penerima: ", "")
                        : null
                    : null,
                takeawayCustomerName: sale.customer_name ?? null,
            };
            setReceiptData(formatted);
            setShowHistory(false);
            setShowReceipt(true);
        } catch (e) {
            alert(
                "Gagal memuat data struk: " +
                    (e.response?.data?.message ?? e.message),
            );
        } finally {
            setHistoryPrintLoading(false);
        }
    };

    /* ── outside click for dropdowns ── */
    useEffect(() => {
        const handleClick = (e) => {
            const clickedOutsideCustomer =
                customerDropdownRef.current &&
                !customerDropdownRef.current.contains(e.target) &&
                customerInputRef &&
                !customerInputRef.current?.contains(e.target);
            const clickedOutsideTable =
                tableDropdownRef.current &&
                !tableDropdownRef.current.contains(e.target) &&
                tableInputRef &&
                !tableInputRef.current?.contains(e.target);

            if (clickedOutsideCustomer) setShowCustomerDropdown(false);
            if (clickedOutsideTable) setShowTableDropdown(false);
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    /* ── totals ── */
    const subtotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
    const totalPromoDisc = cart.reduce((s, c) => s + (c.promoDiscount ?? 0), 0);

    /* ── Diskon & pajak manual (Rp) — diturunkan dari type + value ──
     * Alur perhitungan mengikuti preview modal:
     *   Subtotal → −Diskon Promo → −Diskon Manual → +Pajak Manual → +Ongkir
     * Basis diskon manual = subtotal setelah promo.
     * Basis pajak manual  = subtotal setelah diskon (promo + manual).
     */
    const manualDiscountBase = Math.max(
        0,
        subtotal - totalPromoDisc - cartPromoDiscount,
    );
    const discount =
        discountType === "percent"
            ? Math.round(
                  (manualDiscountBase * (Number(discountValue) || 0)) / 100,
              )
            : Math.min(Number(discountValue) || 0, manualDiscountBase);
    const manualTaxBase = Math.max(0, manualDiscountBase - discount);
    const tax =
        taxType === "percent"
            ? Math.round((manualTaxBase * (Number(taxValue) || 0)) / 100)
            : Number(taxValue) || 0;

    const grandTotal = Math.max(
        0,
        subtotal -
            totalPromoDisc -
            cartPromoDiscount -
            discount +
            tax +
            Number(deliveryFee || 0),
    );

    /* ── cash rounding ── */
    const cashRoundingSettings = storeFeatureSettings?.cash_rounding;
    const cashRoundingEnabled = !!cashRoundingSettings;
    const cashRoundingNearest = cashRoundingSettings?.cash_rounding_nearest ?? 100;

    const roundedGrandTotal = cashRoundingEnabled
        ? Math.round(grandTotal / cashRoundingNearest) * cashRoundingNearest
        : grandTotal;
    const roundingAdjustment = cashRoundingEnabled
        ? roundedGrandTotal - grandTotal
        : 0;

    /* ── field wajib per mode yang belum terisi — dipakai untuk disable
       tombol Bayar & tampilkan pesan kontekstual SEBELUM user klik bayar,
       bukan cuma alert() setelah modal pembayaran terbuka ── */
    const missingRequiredField = (() => {
        if ((isService || isRental || isHospitality) && !selectedCustomer) {
            return "Pilih pelanggan dulu";
        }
        if (isParking && !ticketEvent.trim()) {
            return "Isi plat nomor dulu";
        }
        if (isSession && !roomNumber.trim()) {
            return "Isi nama unit dulu";
        }
        // Delivery — penerima + alamat wajib (semua mode)
        if (orderType === "delivery") {
            if (!deliveryCustomerName.trim() && !selectedCustomer) {
                return "Lengkapi info pengiriman";
            }
            if (!deliveryAddress.trim()) {
                return "Lengkapi info pengiriman";
            }
        }
        // Grosir (retail) — pelanggan wajib
        if (isRetail && orderType === "wholesale" && !selectedCustomer) {
            return "Pilih pelanggan grosir dulu";
        }
        return null;
    })();

    /* ── Hold / Park transaksi (localStorage) ────────────────────
     * Kasir bisa "menahan" transaksi berjalan (mis. pelanggan lupa ambil
     * barang) lalu melanjutkannya nanti tanpa kehilangan keranjang. Semua
     * disimpan di localStorage — tidak menyentuh backend.
     */
    const persistHeld = (list) => {
        setHeldTransactions(list);
        try {
            localStorage.setItem(HELD_KEY, JSON.stringify(list));
        } catch {
            /* storage penuh / tidak tersedia — abaikan */
        }
    };

    const holdTransaction = () => {
        if (cart.length === 0) {
            return false;
        }
        const custName =
            customers.find((c) => String(c.id) === String(selectedCustomer))
                ?.name || null;
        const snapshot = {
            id: crypto?.randomUUID?.() ?? `held-${Date.now()}`,
            heldAt: new Date().toISOString(),
            label:
                custName || takeawayCustomerName || deliveryCustomerName || null,
            orderType,
            itemCount: cart.reduce((s, c) => s + c.qty, 0),
            total: grandTotal,
            cart,
            selectedCustomer,
            selectedTable,
            discountType,
            discountValue,
            discountReason,
            taxType,
            taxValue,
            taxName,
            note,
            deliveryAddress,
            deliveryFee,
            deliveryCustomerName,
            deliveryPhone,
            deliveryCourier,
            deliveryNote,
            takeawayCustomerName,
            takeawayPhone,
            pickupTime,
            // mode-specific (agar mode selain retail juga aman)
            rentalDuration,
            rentalUnit,
            ticketEvent,
            ticketSlot,
            roomNumber,
            guestCount,
            selectedEmployee,
        };
        persistHeld([snapshot, ...heldTransactions].slice(0, 50));
        clearCart();
        return true;
    };

    const resumeHeldTransaction = (held) => {
        if (!held) {
            return;
        }
        setCart(held.cart || []);
        const maxId = (held.cart || []).reduce(
            (m, c) => Math.max(m, c.cartId || 0),
            0,
        );
        if (maxId > cartIdSeqRef.current) {
            cartIdSeqRef.current = maxId;
        }
        setOrderType(held.orderType || orderOpts[0].v);
        setSelectedCustomer(held.selectedCustomer || "");
        setSelectedTable(held.selectedTable || "");
        setDiscountType(held.discountType || "fixed");
        setDiscountValue(held.discountValue || 0);
        setDiscountReason(held.discountReason || "");
        setTaxType(held.taxType || "fixed");
        setTaxValue(held.taxValue || 0);
        setTaxName(held.taxName || "");
        setNote(held.note || "");
        setDeliveryAddress(held.deliveryAddress || "");
        setDeliveryFee(held.deliveryFee || "");
        setDeliveryCustomerName(held.deliveryCustomerName || "");
        setDeliveryPhone(held.deliveryPhone || "");
        setDeliveryCourier(held.deliveryCourier || "");
        setDeliveryNote(held.deliveryNote || "");
        setTakeawayCustomerName(held.takeawayCustomerName || "");
        setTakeawayPhone(held.takeawayPhone || "");
        setPickupTime(held.pickupTime || "");
        setRentalDuration(held.rentalDuration ?? 1);
        setRentalUnit(held.rentalUnit || "per_hour");
        setTicketEvent(held.ticketEvent || "");
        setTicketSlot(held.ticketSlot || "");
        setRoomNumber(held.roomNumber || "");
        setGuestCount(held.guestCount ?? 1);
        setSelectedEmployee(held.selectedEmployee || "");
        persistHeld(heldTransactions.filter((h) => h.id !== held.id));
    };

    const deleteHeldTransaction = (id) => {
        persistHeld(heldTransactions.filter((h) => h.id !== id));
    };

    /* ── compose notes ──────────────────────────────────────────
     * Info tambahan pickup/delivery (telepon, kurir, waktu ambil, catatan
     * pengiriman) dilipat ke field `notes` secara non-destruktif — catatan
     * transaksi yang diketik kasir tetap dipertahankan di akhir.
     */
    const buildComposedNotes = () => {
        const parts = [];
        if (orderType === "delivery") {
            if (deliveryPhone.trim()) parts.push(`HP: ${deliveryPhone.trim()}`);
            if (deliveryCourier.trim())
                parts.push(`Kurir: ${deliveryCourier.trim()}`);
            if (deliveryNote.trim()) parts.push(deliveryNote.trim());
        }
        if (orderType === "takeaway") {
            if (takeawayPhone.trim()) parts.push(`HP: ${takeawayPhone.trim()}`);
            if (pickupTime.trim()) parts.push(`Ambil: ${pickupTime.trim()}`);
        }
        if (note.trim()) parts.push(note.trim());
        const joined = parts.join(" • ");
        return joined ? joined.slice(0, 500) : null;
    };

    /* ── submit ── */
    const handleConfirmPayment = async (payments, change) => {
        // Catatan: enforcement shift ditangani di layer lain — tombol Bayar
        // dinonaktifkan oleh KasirLayout saat shift wajib tapi belum dibuka,
        // dan backend (middleware ensure.shift) mengembalikan 422 untuk kasir
        // yang wajib shift. User yang tidak wajib shift (owner/admin/developer)
        // tetap bisa bertransaksi tanpa shift aktif.
        if (orderType === "delivery" && !deliveryAddress.trim()) {
            alert("Alamat pengiriman wajib diisi untuk delivery.");
            setSubmitting(false);
            return;
        }
        if (
            orderType === "delivery" &&
            !deliveryCustomerName.trim() &&
            !selectedCustomer
        ) {
            alert("Nama penerima wajib diisi untuk delivery.");
            setSubmitting(false);
            return;
        }
        // Customer wajib untuk service
        if (isService && !selectedCustomer) {
            alert(
                "Layanan service wajib memilih customer terlebih dahulu.\n\nTambahkan customer baru dari dropdown pelanggan di atas.",
            );
            return;
        }
        // Customer wajib untuk rental
        if (isRental && !selectedCustomer) {
            alert(
                "Sewa barang wajib memilih customer.\n\nPilih atau tambahkan customer dari dropdown di atas.",
            );
            return;
        }
        // Customer wajib untuk hospitality
        if (isHospitality && !selectedCustomer) {
            alert('Menginap wajib memilih customer/tamu.\n\nPilih atau tambahkan tamu dari dropdown di atas.');
            return;
        }
        // Plat nomor wajib untuk parking
        if (isParking && !ticketEvent.trim()) {
            alert('Parkir wajib mengisi plat nomor kendaraan.');
            return;
        }
        // Unit wajib untuk session
        if (isSession && !roomNumber.trim()) {
            alert('Session wajib mengisi nama unit/room (misal: PC-01, PS-03).');
            return;
        }
        setSubmitting(true);
        const idempotencyKey = crypto.randomUUID();
        const payload = {
            customer_id: selectedCustomer || null,
            table_id: selectedTable || null,
            order_type: orderType,
            discount_amount: Number(discount),
            tax_amount: Number(tax),
            shipping_amount:
                orderType === "delivery" ? Number(deliveryFee || 0) : 0,
            rounding_adjustment: roundingAdjustment,
            delivery_address: orderType === "delivery" ? deliveryAddress : null,
            customer_name:
                orderType === "delivery"
                    ? deliveryCustomerName.trim() || null
                    : orderType === "takeaway"
                      ? takeawayCustomerName.trim() || null
                      : null,
            notes: buildComposedNotes(),
            payments: payments.map((p) => ({
                method_id: p.method_id,
                amount: Number(p.amount),
                reference_no: p.reference_no || null,
                is_pg: p.is_pg || false,
                pg_provider: p.pg_provider || null,
                pg_method: p.pg_method || null,
            })),
            items: cart.map((c) => ({
                product_id: c.productId,
                variant_id: c.variantId,
                packaging_unit_id: c.packagingUnitId || null,
                unit_name: c.packagingUnitName || null,
                unit_conversion_qty: c.conversionQty || 1,
                quantity: c.qty,
                price: Number(product_sell_price(c)),
                discount_amount: 0,
                modifiers: c.modifiers,
                notes: c.note || null,
            })),
            idempotency_key: idempotencyKey,
            // ── Mode-specific fields ──────────────────────────────────────
            ...(isRental && rentalDuration
                ? {
                      rental_duration: Number(rentalDuration),
                      rental_unit: rentalUnit,
                      room_number: roomNumber || null,
                  }
                : {}),
            ...(isService
                ? {
                      employee_id: selectedEmployee || null,
                      ticket_slot: ticketSlot || null,
                  }
                : {}),
            ...(isTicket
                ? {
                      ticket_event: ticketEvent || null,
                      ticket_slot: ticketSlot || null,
                      employee_id: selectedEmployee || null,
                  }
                : {}),
            ...(isHospitality
                ? {
                      room_number:      roomNumber || null,
                      guest_count:      Number(guestCount) || 1,
                      rental_duration:  rentalDuration || 1,
                      rental_unit:      rentalUnit || 'per_day',
                  }
                : {}),
            ...(isParking
                ? {
                      ticket_event: ticketEvent || null,   // plat nomor
                      ticket_slot:  ticketSlot || null,    // jenis kendaraan
                      room_number:  roomNumber || null,    // no. tiket
                  }
                : {}),
            ...(isSession ? {
                room_number:  roomNumber || null,
                guest_count:  Number(guestCount) || 1,
            } : {}),
        };

        try {
            const { data } = await axios.post(
                route("admin.kasir.store"),
                payload,
            );
            if (!data.success) throw new Error(data.message ?? "Gagal");

            // ── PG flow: create payment gateway transaction ──
            if (data.is_pg && data.pg_info) {
                try {
                    const pgRes = await axios.post(
                        route("admin.payment-gateway.create"),
                        {
                            sale_id: data.sale_id,
                            provider: data.pg_info.provider,
                            payment_type: data.pg_info.method,
                        },
                    );

                    setShowPayment(false);

                    setPgModalData({
                        pgTrxId: pgRes.data.pg_trx_id,
                        amount: data.grand_total,
                        saleId: data.sale_id,
                        saleNo: data.sale_no,
                        change: data.change,
                        grandTotal: data.grand_total,
                        paymentType: data.pg_info.method,
                        qrCode: pgRes.data.qr_code,
                        qrImageUrl: pgRes.data.qr_image_url,
                        vaNumber: pgRes.data.va_number,
                        vaBank: pgRes.data.va_bank,
                        paymentUrl: pgRes.data.payment_url,
                        payments: payments.map((p) => ({
                            methodName:
                                PG_METHOD_LABELS[p.pg_method]?.label ??
                                p.pg_method ??
                                "PG",
                            amount: Number(p.amount),
                        })),
                        customer:
                            customers.find(
                                (c) =>
                                    String(c.id) === String(selectedCustomer),
                            ) ?? null,
                        table:
                            tables.find(
                                (t) => String(t.id) === String(selectedTable),
                            ) ?? null,
                        orderType,
                    });
                    return; // don't show receipt yet — PGPaymentModal will handle it
                } catch (pgErr) {
                    console.error("PG create transaction error:", pgErr);
                    alert(
                        "Gagal membuat link pembayaran: " +
                            (pgErr.response?.data?.message ?? pgErr.message),
                    );
                    setSubmitting(false);
                    return;
                }
            }

            const customer = customers.find(
                (c) => String(c.id) === String(selectedCustomer),
            );
            const table = tables.find(
                (t) => String(t.id) === String(selectedTable),
            );
            const methodMap = Object.fromEntries(
                paymentMethods.map((m) => [m.id, m.name]),
            );

            setReceiptData({
                saleNo: data.sale_no,
                items: cart.map((c) => ({
                    name: c.name,
                    variantName: c.variantName,
                    qty: c.qty,
                    price: c.price,
                    subtotal: c.price * c.qty,
                    promoDiscount: c.promoDiscount ?? 0,
                    promoName: c.promoName ?? null,
                    modifiers: c.modifiers,
                })),
                subtotal,
                discount: Number(discount),
                tax: Number(tax),
                totalPromoDisc,
                cartPromoDiscount,
                cartPromoName,
                grandTotal: data.grand_total,
                change: data.change,
                payments: payments.map((p) => ({
                    methodName: methodMap[p.method_id] ?? "?",
                    amount: Number(p.amount),
                })),
                customerName: customer?.name ?? null,
                tableName: table?.table_number ?? null,
                orderType,
                deliveryAddress:
                    orderType === "delivery" ? deliveryAddress : null,
                deliveryFee:
                    orderType === "delivery" ? Number(deliveryFee || 0) : 0,
                deliveryCustomerName:
                    orderType === "delivery"
                        ? deliveryCustomerName || customer?.name
                        : null,
                takeawayCustomerName:
                    orderType === "takeaway"
                        ? takeawayCustomerName || null
                        : null,
                employeeName: selectedEmployee
                    ? (employees.find(
                          (e) => String(e.id) === String(selectedEmployee),
                      )?.name ?? null)
                    : null,
                rentalInfo:
                    isRental && rentalDuration > 0
                        ? {
                              duration: rentalDuration,
                              unit:
                                  rentalUnit === "per_hour"
                                      ? "jam"
                                      : rentalUnit === "per_day"
                                        ? "hari"
                                        : "minggu",
                              returnDate: (() => {
                                  const now = new Date();
                                  const ms =
                                      rentalUnit === "per_hour"
                                          ? rentalDuration * 3600000
                                          : rentalUnit === "per_day"
                                            ? rentalDuration * 86400000
                                            : rentalDuration * 604800000;
                                  return new Date(
                                      now.getTime() + ms,
                                  ).toLocaleString("id-ID", {
                                      dateStyle: "medium",
                                      timeStyle: "short",
                                  });
                              })(),
                          }
                        : null,
                hospitalityInfo: isHospitality ? {
                    roomNumber: roomNumber || null,
                    guestCount: Number(guestCount) || 1,
                    duration: rentalDuration || 1,
                    unitLabel: rentalUnit === 'per_hour' ? 'jam' : rentalUnit === 'per_week' ? 'minggu' : 'malam',
                    checkoutDate: (() => {
                        const now = new Date();
                        const ms = rentalUnit === 'per_hour'
                            ? (rentalDuration || 1) * 3600000
                            : rentalUnit === 'per_week'
                            ? (rentalDuration || 1) * 604800000
                            : (rentalDuration || 1) * 86400000;
                        const co = new Date(now.getTime() + ms);
                        return co.toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
                    })(),
                } : null,
                parkingInfo: isParking ? {
                    plateNumber: ticketEvent || '-',
                    vehicleLabel: ticketSlot === 'motorcycle' ? '🏍️ Motor' :
                                  ticketSlot === 'car'        ? '🚗 Mobil' :
                                  ticketSlot === 'truck'      ? '🚛 Truk' : '🏍️ Motor',
                    ticketNo:    roomNumber || null,
                    entryTime:   new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }),
                } : null,
                sessionInfo: isSession ? {
                    unitName:   roomNumber || null,
                    guestCount: guestCount || 1,
                    startTime:  new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }),
                    orderType:  orderType,
                } : null,
            });

            setShowReceipt(true);
            setHistoryList((prev) => [
                {
                    id: data.sale_id,
                    sale_no: data.sale_no,
                    grand_total: data.grand_total,
                    status: "completed",
                    sale_date: new Date().toISOString(),
                    customer: customer ?? null,
                    payment_status: "paid",
                    order_type: orderType,
                },
                ...prev.slice(0, 19),
            ]);
            clearCart();
        } catch (e) {
            // Network error — save to offline queue
            if (!e.response) {
                try {
                    await enqueue({
                        type: "sale",
                        url: route("admin.kasir.store"),
                        method: "POST",
                        headers: {
                            "X-CSRF-TOKEN":
                                document
                                    .querySelector('meta[name="csrf-token"]')
                                    ?.getAttribute("content") ?? "",
                            "X-Inertia": "false",
                            Accept: "application/json",
                        },
                        body: { ...payload, idempotency_key: idempotencyKey },
                        meta: {
                            items: cart.map((c) => ({
                                name: c.name,
                                qty: c.qty,
                                price: c.price,
                            })),
                            grandTotal,
                            customer:
                                customers.find(
                                    (c) =>
                                        String(c.id) ===
                                        String(selectedCustomer),
                                )?.name ?? "Umum",
                        },
                    });
                    setShowPayment(false);

                    const offlineCustomer = customers.find(
                        (c) => String(c.id) === String(selectedCustomer),
                    );
                    const offlineTable = tables.find(
                        (t) => String(t.id) === String(selectedTable),
                    );
                    const methodMap = Object.fromEntries(
                        paymentMethods.map((m) => [m.id, m.name]),
                    );

                    setReceiptData({
                        saleNo: "TMP-" + Date.now(),
                        items: cart.map((c) => ({
                            name: c.name,
                            variantName: c.variantName,
                            qty: c.qty,
                            price: c.price,
                            subtotal: c.price * c.qty,
                            promoDiscount: c.promoDiscount ?? 0,
                            promoName: c.promoName ?? null,
                            modifiers: c.modifiers,
                        })),
                        subtotal,
                        discount: Number(discount),
                        tax: Number(tax),
                        totalPromoDisc,
                        cartPromoDiscount,
                        cartPromoName,
                        grandTotal,
                        change,
                        payments: payments.map((p) => ({
                            methodName: methodMap[p.method_id] ?? "?",
                            amount: Number(p.amount),
                        })),
                        customerName: offlineCustomer?.name ?? null,
                        tableName: offlineTable?.table_number ?? null,
                        orderType,
                        deliveryAddress:
                            orderType === "delivery" ? deliveryAddress : null,
                        deliveryFee:
                            orderType === "delivery"
                                ? Number(deliveryFee || 0)
                                : 0,
                        deliveryCustomerName:
                            orderType === "delivery"
                                ? deliveryCustomerName || offlineCustomer?.name
                                : null,
                        takeawayCustomerName:
                            orderType === "takeaway"
                                ? takeawayCustomerName || null
                                : null,
                        employeeName: selectedEmployee
                            ? (employees.find(
                                  (e) =>
                                      String(e.id) === String(selectedEmployee),
                              )?.name ?? null)
                            : null,
                        rentalInfo:
                            isRental && rentalDuration > 0
                                ? {
                                      duration: rentalDuration,
                                      unit:
                                          rentalUnit === "per_hour"
                                              ? "jam"
                                              : rentalUnit === "per_day"
                                                ? "hari"
                                                : "minggu",
                                      returnDate: (() => {
                                          const now = new Date();
                                          const ms =
                                              rentalUnit === "per_hour"
                                                  ? rentalDuration * 3600000
                                                  : rentalUnit === "per_day"
                                                    ? rentalDuration * 86400000
                                                    : rentalDuration *
                                                      604800000;
                                          return new Date(
                                              now.getTime() + ms,
                                          ).toLocaleString("id-ID", {
                                              dateStyle: "medium",
                                              timeStyle: "short",
                                          });
                                      })(),
                                  }
                                : null,
                        hospitalityInfo: isHospitality ? {
                            roomNumber: roomNumber || null,
                            guestCount: Number(guestCount) || 1,
                            duration: rentalDuration || 1,
                            unitLabel: rentalUnit === 'per_hour' ? 'jam' : rentalUnit === 'per_week' ? 'minggu' : 'malam',
                            checkoutDate: (() => {
                                const now = new Date();
                                const ms = rentalUnit === 'per_hour'
                                    ? (rentalDuration || 1) * 3600000
                                    : rentalUnit === 'per_week'
                                    ? (rentalDuration || 1) * 604800000
                                    : (rentalDuration || 1) * 86400000;
                                const co = new Date(now.getTime() + ms);
                                return co.toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
                            })(),
                        } : null,
                        parkingInfo: isParking ? {
                            plateNumber: ticketEvent || '-',
                            vehicleLabel: ticketSlot === 'motorcycle' ? '🏍️ Motor' :
                                          ticketSlot === 'car'        ? '🚗 Mobil' :
                                          ticketSlot === 'truck'      ? '🚛 Truk' : '🏍️ Motor',
                            ticketNo:    roomNumber || null,
                            entryTime:   new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }),
                        } : null,
                        sessionInfo: isSession ? {
                            unitName:   roomNumber || null,
                            guestCount: guestCount || 1,
                            startTime:  new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }),
                            orderType:  orderType,
                        } : null,
                        isOffline: true,
                    });
                    setShowReceipt(true);
                    clearCart();
                } catch (queueErr) {
                    alert(
                        "Gagal menyimpan transaksi offline: " +
                            queueErr.message,
                    );
                }
            } else {
                // Server error
                const status = e.response?.status;
                const isServerError = status >= 500 && status < 600;

                if (isServerError) {
                    try {
                        await enqueue({
                            type: "sale",
                            url: route("admin.kasir.store"),
                            method: "POST",
                            headers: {
                                "X-CSRF-TOKEN":
                                    document
                                        .querySelector(
                                            'meta[name="csrf-token"]',
                                        )
                                        ?.getAttribute("content") ?? "",
                                "X-Inertia": "false",
                                Accept: "application/json",
                            },
                            body: {
                                ...payload,
                                idempotency_key: idempotencyKey,
                            },
                            meta: {
                                items: cart.map((c) => ({
                                    name: c.name,
                                    qty: c.qty,
                                    price: c.price,
                                })),
                                grandTotal,
                                customer:
                                    customers.find(
                                        (c) =>
                                            String(c.id) ===
                                            String(selectedCustomer),
                                    )?.name ?? "Umum",
                            },
                        });
                        setShowPayment(false);

                        const offlineCustomer = customers.find(
                            (c) => String(c.id) === String(selectedCustomer),
                        );
                        const offlineTable = tables.find(
                            (t) => String(t.id) === String(selectedTable),
                        );
                        const methodMap = Object.fromEntries(
                            paymentMethods.map((m) => [m.id, m.name]),
                        );

                        setReceiptData({
                            saleNo: "TMP-" + Date.now(),
                            items: cart.map((c) => ({
                                name: c.name,
                                variantName: c.variantName,
                                qty: c.qty,
                                price: c.price,
                                subtotal: c.price * c.qty,
                                promoDiscount: c.promoDiscount ?? 0,
                                promoName: c.promoName ?? null,
                                modifiers: c.modifiers,
                            })),
                            subtotal,
                            discount: Number(discount),
                            tax: Number(tax),
                            totalPromoDisc,
                            cartPromoDiscount,
                            cartPromoName,
                            grandTotal,
                            change,
                            payments: payments.map((p) => ({
                                methodName: methodMap[p.method_id] ?? "?",
                                amount: Number(p.amount),
                            })),
                            customerName: offlineCustomer?.name ?? null,
                            tableName: offlineTable?.table_number ?? null,
                            orderType,
                            deliveryAddress:
                                orderType === "delivery"
                                    ? deliveryAddress
                                    : null,
                            deliveryFee:
                                orderType === "delivery"
                                    ? Number(deliveryFee || 0)
                                    : 0,
                            deliveryCustomerName:
                                orderType === "delivery"
                                    ? deliveryCustomerName ||
                                      offlineCustomer?.name
                                    : null,
                            employeeName: selectedEmployee
                                ? (employees.find(
                                      (e) =>
                                          String(e.id) ===
                                          String(selectedEmployee),
                                  )?.name ?? null)
                                : null,
                            rentalInfo:
                                isRental && rentalDuration > 0
                                    ? {
                                          duration: rentalDuration,
                                          unit:
                                              rentalUnit === "per_hour"
                                                  ? "jam"
                                                  : rentalUnit === "per_day"
                                                    ? "hari"
                                                    : "minggu",
                                          returnDate: (() => {
                                              const now = new Date();
                                              const ms =
                                                  rentalUnit === "per_hour"
                                                      ? rentalDuration * 3600000
                                                      : rentalUnit === "per_day"
                                                        ? rentalDuration *
                                                          86400000
                                                        : rentalDuration *
                                                          604800000;
                                              return new Date(
                                                  now.getTime() + ms,
                                              ).toLocaleString("id-ID", {
                                                  dateStyle: "medium",
                                                  timeStyle: "short",
                                              });
                                          })(),
                                      }
                                    : null,
                            hospitalityInfo: isHospitality ? {
                                roomNumber: roomNumber || null,
                                guestCount: Number(guestCount) || 1,
                                duration: rentalDuration || 1,
                                unitLabel: rentalUnit === 'per_hour' ? 'jam' : rentalUnit === 'per_week' ? 'minggu' : 'malam',
                                checkoutDate: (() => {
                                    const now = new Date();
                                    const ms = rentalUnit === 'per_hour'
                                        ? (rentalDuration || 1) * 3600000
                                        : rentalUnit === 'per_week'
                                        ? (rentalDuration || 1) * 604800000
                                        : (rentalDuration || 1) * 86400000;
                                    const co = new Date(now.getTime() + ms);
                                    return co.toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
                                })(),
                            } : null,
                            parkingInfo: isParking ? {
                                plateNumber: ticketEvent || '-',
                                vehicleLabel: ticketSlot === 'motorcycle' ? '🏍️ Motor' :
                                              ticketSlot === 'car'        ? '🚗 Mobil' :
                                              ticketSlot === 'truck'      ? '🚛 Truk' : '🏍️ Motor',
                                ticketNo:    roomNumber || null,
                                entryTime:   new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }),
                            } : null,
                            sessionInfo: isSession ? {
                                unitName:   roomNumber || null,
                                guestCount: guestCount || 1,
                                startTime:  new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }),
                                orderType:  orderType,
                            } : null,
                            isOffline: true,
                        });
                        setShowReceipt(true);
                        clearCart();
                    } catch (queueErr) {
                        alert(
                            "Gagal menyimpan transaksi offline: " +
                                queueErr.message,
                        );
                    }
                } else {
                    // Validation / client error (4xx) — tampilkan pesan error
                    const msg = e.response?.data?.message
                        ? e.response.data.message
                        : e.response?.data?.errors
                          ? Object.values(e.response.data.errors)
                                .flat()
                                .join("\n")
                          : e.message;
                    alert("Gagal memproses transaksi:\n" + msg);
                }
            }
        } finally {
            setSubmitting(false);
        }
    };

    /** Called when PG payment is confirmed by polling */
    const handlePgSuccess = (pgResult) => {
        const customer = pgModalData?.customer;
        const table = pgModalData?.table;

        setReceiptData({
            saleNo: pgModalData.saleNo,
            items: cart.map((c) => ({
                name: c.name,
                variantName: c.variantName,
                qty: c.qty,
                price: c.price,
                subtotal: c.price * c.qty,
                promoDiscount: c.promoDiscount ?? 0,
                promoName: c.promoName ?? null,
                modifiers: c.modifiers,
            })),
            subtotal,
            discount: Number(discount),
            tax: Number(tax),
            totalPromoDisc,
            cartPromoDiscount,
            cartPromoName,
            grandTotal: pgModalData.grandTotal,
            change: pgModalData.change,
            payments: pgModalData.payments,
            customerName: customer?.name ?? null,
            tableName: table?.table_number ?? null,
            orderType: pgModalData.orderType,
            deliveryAddress:
                pgModalData.orderType === "delivery" ? deliveryAddress : null,
            deliveryFee:
                pgModalData.orderType === "delivery"
                    ? Number(deliveryFee || 0)
                    : 0,
            deliveryCustomerName:
                pgModalData.orderType === "delivery"
                    ? deliveryCustomerName || customer?.name
                    : null,
            takeawayCustomerName:
                pgModalData.orderType === "takeaway"
                    ? takeawayCustomerName || null
                    : null,
            employeeName: selectedEmployee
                ? (employees.find(
                      (e) => String(e.id) === String(selectedEmployee),
                  )?.name ?? null)
                : null,
            rentalInfo:
                isRental && rentalDuration > 0
                    ? {
                          duration: rentalDuration,
                          unit:
                              rentalUnit === "per_hour"
                                  ? "jam"
                                  : rentalUnit === "per_day"
                                    ? "hari"
                                    : "minggu",
                          returnDate: (() => {
                              const now = new Date();
                              const ms =
                                  rentalUnit === "per_hour"
                                      ? rentalDuration * 3600000
                                      : rentalUnit === "per_day"
                                        ? rentalDuration * 86400000
                                        : rentalDuration * 604800000;
                              return new Date(
                                  now.getTime() + ms,
                              ).toLocaleString("id-ID", {
                                  dateStyle: "medium",
                                  timeStyle: "short",
                              });
                          })(),
                      }
                    : null,
            hospitalityInfo: isHospitality ? {
                roomNumber: roomNumber || null,
                guestCount: Number(guestCount) || 1,
                duration: rentalDuration || 1,
                unitLabel: rentalUnit === 'per_hour' ? 'jam' : rentalUnit === 'per_week' ? 'minggu' : 'malam',
                checkoutDate: (() => {
                    const now = new Date();
                    const ms = rentalUnit === 'per_hour'
                        ? (rentalDuration || 1) * 3600000
                        : rentalUnit === 'per_week'
                        ? (rentalDuration || 1) * 604800000
                        : (rentalDuration || 1) * 86400000;
                    const co = new Date(now.getTime() + ms);
                    return co.toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
                })(),
            } : null,
            parkingInfo: isParking ? {
                plateNumber: ticketEvent || '-',
                vehicleLabel: ticketSlot === 'motorcycle' ? '🏍️ Motor' :
                              ticketSlot === 'car'        ? '🚗 Mobil' :
                              ticketSlot === 'truck'      ? '🚛 Truk' : '🏍️ Motor',
                ticketNo:    roomNumber || null,
                entryTime:   new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }),
            } : null,
            sessionInfo: isSession ? {
                unitName:   roomNumber || null,
                guestCount: guestCount || 1,
                startTime:  new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }),
                orderType:  pgModalData?.orderType ?? orderType,
            } : null,
        });

        setPgModalData(null);
        setShowReceipt(true);
        setHistoryList((prev) => [
            {
                id: pgModalData.saleId,
                sale_no: pgModalData.saleNo,
                grand_total: pgModalData.grandTotal,
                status: "completed",
                sale_date: new Date().toISOString(),
                customer: customer ?? null,
                payment_status: "paid",
                order_type: pgModalData.orderType,
            },
            ...prev.slice(0, 19),
        ]);
        clearCart();
    };

    // helper: original base price (without modifier)
    function product_sell_price(cartItem) {
        const prod = products.find((p) => p.id === cartItem.productId);
        if (cartItem.packagingUnitId) {
            const pu = prod?.packaging_units?.find((u) => u.id === cartItem.packagingUnitId);
            if (pu) return Number(pu.sell_price);
        }
        const vari = prod?.variants?.find((v) => v.id === cartItem.variantId);
        return vari
            ? Number(vari.price)
            : Number(prod?.sell_price ?? cartItem.price);
    }

    // Kosongkan meja (free table from POS)
    const handleFreeTable = (e, tableId) => {
        e.stopPropagation();
        axios.post(route("admin.cafe-tables.free", tableId)).then(() => {
            router.reload({ only: ["tables"] });
        });
    };

    /* ─────────────────────────────────────────────────────
       Return everything
    ───────────────────────────────────────────────────── */
    return {
        /* constants / formatters */
        fmt,
        fmtShort,
        ORDER_TYPES,
        TIER_COLORS,
        PG_METHOD_LABELS,
        findPgPaymentMethod,

        /* mode detection */
        activeMode,
        modeConfig,
        hasModeFeature,
        isRetail,
        isFnb,
        isService,
        isRental,
        isTicket,
        isHospitality,
        isParking,
        isSession,
        isCafe,
        isBooth,
        orderOpts,
        tableLabel,
        tableTriggerOrderType,

        /* state */
        customers,
        setCustomers,
        search,
        setSearch,
        activeCat,
        setActiveCat,
        cart,
        setCart,
        showScanner,
        setShowScanner,
        scanning,
        setScanning,
        discount,
        setDiscount,
        tax,
        setTax,
        discountType,
        discountValue,
        discountReason,
        taxType,
        taxValue,
        taxName,
        applyDiscount,
        clearDiscount,
        applyTax,
        clearTax,
        manualDiscountBase,
        manualTaxBase,
        orderType,
        setOrderType,
        selectedCustomer,
        setSelectedCustomer,
        customers,
        customerSearch,
        setCustomerSearch,
        showCustomerDropdown,
        setShowCustomerDropdown,
        customerDropdownPos,
        setCustomerDropdownPos,
        selectedTable,
        setSelectedTable,
        tableSearch,
        setTableSearch,
        deliveryAddress,
        setDeliveryAddress,
        deliveryFee,
        setDeliveryFee,
        deliveryCustomerName,
        setDeliveryCustomerName,
        takeawayCustomerName,
        setTakeawayCustomerName,
        deliveryPhone,
        setDeliveryPhone,
        deliveryCourier,
        setDeliveryCourier,
        deliveryNote,
        setDeliveryNote,
        takeawayPhone,
        setTakeawayPhone,
        pickupTime,
        setPickupTime,
        deliveryInfoOpen,
        setDeliveryInfoOpen,
        quickAddOpen,
        setQuickAddOpen,
        quickAddName,
        setQuickAddName,
        quickAddPhone,
        setQuickAddPhone,
        quickAdding,
        setQuickAdding,
        showTableDropdown,
        setShowTableDropdown,
        tableDropdownPos,
        setTableDropdownPos,
        note,
        setNote,

        /* mode-specific state */
        rentalDuration,
        setRentalDuration,
        rentalUnit,
        setRentalUnit,
        ticketEvent,
        setTicketEvent,
        ticketSlot,
        setTicketSlot,
        roomNumber,
        setRoomNumber,
        guestCount,
        setGuestCount,
        selectedEmployee,
        setSelectedEmployee,
        employees,

        /* modal / UI state */
        modifierTarget,
        setModifierTarget,
        variantTarget,
        setVariantTarget,
        unitTarget,
        setUnitTarget,
        retailProductTarget,
        setRetailProductTarget,
        showPayment,
        setShowPayment,
        showReceipt,
        setShowReceipt,
        receiptData,
        setReceiptData,
        showHistory,
        setShowHistory,
        historyPrintLoading,
        setHistoryPrintLoading,
        submitting,
        setSubmitting,
        historyList,
        setHistoryList,
        cartPanelOpen,
        setCartPanelOpen,
        sidebarWidth,
        setSidebarWidth,
        startSidebarResize,
        pgModalData,
        setPgModalData,
        stockAlert,
        setStockAlert,

        /* refs */
        customerDropdownRef,
        customerInputRef,
        tableDropdownRef,
        tableInputRef,
        barcodeRef,

        /* computed */
        filtered,
        customerTier,
        subtotal,
        totalPromoDisc,
        cartPromoDiscount,
        cartPromoName,
        grandTotal,
        roundedGrandTotal,
        roundingAdjustment,
        cashRoundingEnabled,
        missingRequiredField,

        /* handlers */
        addToCart,
        changeQty,
        removeItem,
        clearCart,
        heldTransactions,
        holdTransaction,
        resumeHeldTransaction,
        deleteHeldTransaction,
        handleProductClick,
        handleBarcodeScan,
        playBeep,
        handleOrderTypeChange,
        handlePrintHistory,
        handleConfirmPayment,
        handlePgSuccess,
        handleFreeTable,
        product_sell_price,
        findBestPromoForItem,
        findBestCartPromo,
        recalcPromo,
    };
}
