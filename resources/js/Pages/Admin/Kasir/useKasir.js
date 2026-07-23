import axios from "axios";
import { useEffect, useMemo, useRef, useState } from "react";
import { router } from "@inertiajs/react";
import { enqueue } from "@/Services/mutationQueue";
import { playAddToCart, playRemoveItem, playQtyUp, playQtyDown, playPaymentSuccess, playError } from "@/Hooks/useSound";
import {
    getPosModeConfig,
    modeHasFeature,
    normalizePosMode,
    POS_MODES,
} from "./config/posModes";
import { getTierPrice as sharedGetTierPrice } from "./components/helpers";

/* â”€â”€ formatters â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const fmt = (n) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(n ?? 0);

const fmtShort = (n) =>
    new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(n ?? 0);

/* â”€â”€ ORDER TYPE options â€” 7 adaptive POS modes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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

/* â”€â”€ PG method labels â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const PG_METHOD_LABELS = {
    qris: { label: "QRIS", icon: "ðŸ“±", badge: "QR" },
    gopay: { label: "GoPay", icon: "ðŸŸ¢", badge: "EP" },
    shopeepay: { label: "ShopeePay", icon: "ðŸŸ ", badge: "EP" },
    dana: { label: "DANA", icon: "ðŸ”µ", badge: "EP" },
    ovo: { label: "OVO", icon: "ðŸŸ£", badge: "EP" },
    bca_va: { label: "VA BCA", icon: "ðŸ¦", badge: "VA" },
    mandiri_va: { label: "VA Mandiri", icon: "ðŸ¦", badge: "VA" },
    bri_va: { label: "VA BRI", icon: "ðŸ¦", badge: "VA" },
    bni_va: { label: "VA BNI", icon: "ðŸ¦", badge: "VA" },
    permata_va: { label: "VA Permata", icon: "ðŸ¦", badge: "VA" },
};

/** Match pg_method to existing payment_methods id by code/name */
function findPgPaymentMethod(pgMethod, paymentMethods) {
    const code = pgMethod.replace("_va", "").toUpperCase(); // qrisâ†’QRIS, gopayâ†’GOPAY, bca_vaâ†’BCA
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

/** Ambil harga tier yang berlaku untuk qty tertentu â€” variant-aware dengan fallback ke product level */
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
    pendingSale = null,
    pendingPgTransaction = null,
}) {
    /* â”€â”€ mode detection â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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

    // Label & order type pemicu pemilih ruang â€” "Meja" untuk fnb (dine_in),
    // "Kamar" untuk hospitality (check_in). Order type-nya BEDA per mode,
    // jangan disamakan jadi "dine_in" untuk semua.
    const tableLabel = isHospitality ? "Kamar" : "Meja";
    const tableTriggerOrderType = isHospitality ? "check_in" : "dine_in";

    /* â”€â”€ state â”€â”€ */
    const [customers, setCustomers] = useState(initialCustomers || []);
    const [search, setSearch] = useState("");
    const [activeCat, setActiveCat] = useState("");
    const [cart, setCart] = useState([]);
    // Ref (bukan state) untuk penomoran cartId â€” dibaca & ditulis secara
    // synchronous di dalam addToCart, jadi aman dari stale closure walau
    // addToCart dipanggil berkali-kali sebelum React sempat re-render.
    const cartIdSeqRef = useRef(0);

    // â”€â”€ Transaksi ditahan (Hold / Park) â€” disimpan di localStorage saja â”€â”€
    const HELD_KEY = `pos:held:${storeName || "default"}`;
    const [heldTransactions, setHeldTransactions] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem(HELD_KEY) || "[]");
        } catch {
            return [];
        }
    });

    /* â”€â”€ scanner state â”€â”€ */
    const [showScanner, setShowScanner] = useState(false);
    const [scanning, setScanning] = useState(false);

    /* â”€â”€ Diskon & pajak manual â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
    // nominal tetap (fixed) â€” dipakai halaman fallback Kasir.jsx.
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

    /* â”€â”€ customer / table / delivery â”€â”€ */
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
    // Info tambahan pickup/delivery â€” dikumpulkan via modal, dilipat ke
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
     * tapi technical debt penamaan â€” hati-hati saat menambah fitur baru):
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

    /* â”€â”€ modal / UI state â”€â”€ */
    const [modifierTarget, setModifierTarget] = useState(null);
    const [variantTarget, setVariantTarget] = useState(null);
    // Non-retail multi-satuan (legacy UnitModal) â€” dipakai mode selain retail
    // yang produknya punya packaging_units tapi tanpa variant/modifier.
    const [unitTarget, setUnitTarget] = useState(null);
    // Retail-only: modal adaptif tunggal (variant â†’ unit â†’ qty â†’ notes)
    // menggantikan VariantModal + UnitModal untuk mode retail.
    const [retailProductTarget, setRetailProductTarget] = useState(null);
    const [showPayment, setShowPayment] = useState(!!pendingSale);
    const [resumeSaleId, setResumeSaleId] = useState(pendingSale?.sale_id || null);
    const [resumeSaleNo, setResumeSaleNo] = useState(pendingSale?.sale_no || null);

    const initialPgTransaction = useMemo(() => {
        if (!pendingPgTransaction) return null;
        return {
            pgTrxId: pendingPgTransaction.pg_trx_id,
            amount: pendingPgTransaction.amount,
            saleId: pendingSale?.sale_id || null,
            saleNo: pendingSale?.sale_no || null,
            change: 0,
            grandTotal: pendingSale?.grand_total || pendingPgTransaction.amount,
            paymentType: pendingPgTransaction.payment_type,
            qrCode: pendingPgTransaction.qr_code,
            qrImageUrl: pendingPgTransaction.qr_image_url,
            vaNumber: pendingPgTransaction.va_number,
            vaBank: pendingPgTransaction.va_bank,
            paymentUrl: pendingPgTransaction.payment_url,
            initialStatus: pendingPgTransaction.status ?? 'pending',
            canRetry: !!pendingPgTransaction.can_retry,
        };
    }, [pendingPgTransaction, pendingSale]);

    // Restore cart from pending sale items on mount
    useEffect(() => {
        if (pendingSale?.items?.length) {
            const restoredCart = pendingSale.items.map((item, i) => ({
                cartId: i + 1,
                key: `${item.productId}-${item.variantId || 0}-0-[]`,
                productId: item.productId,
                variantId: item.variantId || null,
                name: item.name,
                price: item.price,
                qty: item.quantity,
                modifiers: [],
                note: '',
            }));
            setCart(restoredCart);
            cartIdSeqRef.current = restoredCart.length;
        }
    }, [pendingSale]);
    const [showReceipt, setShowReceipt] = useState(false);
    const [receiptData, setReceiptData] = useState(null);
    const [successData, setSuccessData] = useState(null);
    const [showHistory, setShowHistory] = useState(false);
    const [historyPrintLoading, setHistoryPrintLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [historyList, setHistoryList] = useState(todaySales);
    const [cartPanelOpen, setCartPanelOpen] = useState(false);
    const [sidebarWidth, setSidebarWidth] = useState(384);
    const sidebarResizing = useRef(false);
    // PG data handled inline by GatewayPanel inside PaymentView â€” no modal needed.
    // { productName, available, requested } | null â€” dipakai StockAlertModal
    const [stockAlert, setStockAlert] = useState(null);

    /* â”€â”€ refs â”€â”€ */
    const customerDropdownRef = useRef(null);
    const customerInputRef = useRef(null);
    const tableDropdownRef = useRef(null);
    const tableInputRef = useRef(null);
    const barcodeRef = useRef(null);

    /* â”€â”€ sidebar resize â”€â”€ */
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

    /* â”€â”€ filtering â”€â”€ */
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

    /* â”€â”€ customer tier â”€â”€ */
    const customerTier = useMemo(() => {
        if (!selectedCustomer) return null;
        const cust = customers.find(
            (c) => String(c.id) === String(selectedCustomer),
        );
        return cust?.tier ?? null;
    }, [selectedCustomer, customers]);

    /* â”€â”€ promo helpers â”€â”€ */
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
            // Check if product is in this promo (or promo applies to all â€” no products)
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

    /* â”€â”€ scanner helpers â”€â”€ */
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

    /* â”€â”€ cart helpers â”€â”€ */
    /**
     * Tambah produk ke keranjang.
     *
     * PENTING: jangan panggil fungsi ini berkali-kali dalam loop untuk
     * menambah qty > 1 (misal `for (let i=0;i<qty;i++) addToCart(...)`).
     * Karena setCart bersifat asinkron, tiap iterasi loop akan membaca
     * state `cart` yang belum ter-update oleh iterasi sebelumnya (stale
     * closure) â€” akibatnya item yang sama malah tercatat sebagai beberapa
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
        // â”€â”€ Cek stok sebelum masuk keranjang â”€â”€
        // Stok dicek dari bucket yang sesuai (product+variant+packaging_unit),
        // bukan flat product.stock â€” bucket tidak melakukan konversi otomatis,
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

        // Cek tier price untuk qty yang diminta â€” variant-aware
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
                    const newQty = c.qty + qty;

                    // Recalculate tier price for merged item
                    let newPrice = c.price;
                    const hasTiers =
                        product?.price_tiers?.length ||
                        (product?.variants ?? []).some(
                            (v) =>
                                v.id === c.variantId &&
                                v.price_tiers?.length,
                        );
                    if (hasTiers && !c.packagingUnitId) {
                        const tierPrice = getTierPrice(
                            product,
                            newQty,
                            c.variantId ?? null,
                        );
                        if (tierPrice !== null) {
                            const modExtra = (c.modifiers ?? []).reduce(
                                (s, m) => s + (m.price_addition ?? 0),
                                0,
                            );
                            newPrice = tierPrice + modExtra;
                        } else {
                            const v = c.variantId
                                ? (product?.variants ?? []).find(
                                      (v) => v.id === c.variantId,
                                  )
                                : null;
                            const base = v
                                ? Number(v.price)
                                : Number(product?.sell_price ?? c.price);
                            const modExtra = (c.modifiers ?? []).reduce(
                                (s, m) => s + (m.price_addition ?? 0),
                                0,
                            );
                            newPrice = base + modExtra;
                        }
                    }

                    return recalcPromo({
                        ...c,
                        qty: newQty,
                        price: newPrice,
                    });
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
            playAddToCart();
            return [...prev, withPromo];
        });
    };

    const changeQty = (cartId, delta) => {
        setCart((prev) => {
            const item = prev.find((c) => c.cartId === cartId);
            if (!item) return prev;

            // Cek stok bucket jika menambah qty â€” bucket yang sama persis
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
                    // Recalculate tier price â€” variant-aware
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
                            // No tier matches â€” fallback to base price (variant or product)
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
        if (delta > 0) playQtyUp();
        else playQtyDown();
    };

    const removeItem = (cartId) => {
        playRemoveItem();
        setCart((prev) => prev.filter((c) => c.cartId !== cartId));
    };

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

    /* â”€â”€ click product â”€â”€ */
    const handleProductClick = (product) => {
        const hasModifiers = (product.modifier_groups ?? []).length > 0;
        const hasVariants =
            (product.variants ?? []).filter((v) => v.is_active).length > 0;
        const hasUnits = (product.packaging_units ?? []).length > 0;

        if (hasModifiers) {
            // Produk dengan modifier â€” buka ModifierModal (behaviour lama)
            setModifierTarget(product);
            return;
        }

        // Retail: produk dengan variant atau multi-satuan â†’ RetailProductModal
        // Produk simple (tanpa variant & tanpa multi-satuan) â†’ langsung cart
        if (isRetail) {
            if (!hasVariants && !hasUnits) {
                addToCart(product);
                return;
            }
            setRetailProductTarget(product);
            return;
        }

        if (hasVariants) {
            // Produk dengan variant tapi tanpa modifier â€” buka VariantModal
            setVariantTarget(product);
        } else if (hasUnits) {
            // Produk non-retail dengan multi-satuan â€” buka UnitModal (legacy)
            setUnitTarget(product);
        } else {
            // Produk biasa â€” langsung masuk cart
            addToCart(product);
        }
    };

    /* â”€â”€ barcode scan handler â”€â”€ */
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

    /* â”€â”€ search Enter handler (hardware scanner support) â”€â”€ */
    const handleSearchEnter = () => {
        const q = search.trim();
        if (!q) return;

        // 1. Exact barcode match on product
        const byBarcode = products.find((p) => p.barcode === q);
        if (byBarcode) {
            handleProductClick(byBarcode);
            setSearch("");
            return;
        }

        // 2. Variant barcode match
        for (const p of products) {
            const v = (p.variants ?? []).find((v) => v.barcode === q);
            if (v) {
                handleProductClick(p);
                setSearch("");
                return;
            }
        }

        // 3. Packaging unit barcode match
        for (const p of products) {
            const pu = (p.packaging_units ?? []).find((u) => u.barcode === q);
            if (pu) {
                addToCart(p, null, [], "", pu);
                setSearch("");
                return;
            }
        }

        // 4. Fuzzy match by name/SKU â€” if exactly 1 result, use it
        const lower = q.toLowerCase();
        const matches = products.filter(
            (p) =>
                p.name.toLowerCase().includes(lower) ||
                p.sku?.toLowerCase().includes(lower),
        );
        if (matches.length === 1) {
            handleProductClick(matches[0]);
            setSearch("");
        }
    };

    /* â”€â”€ order type change â”€â”€ */
    const handleOrderTypeChange = (v) => {
        setOrderType(v);
        if (v !== "dine_in") setSelectedTable("");
    };

    /* â”€â”€ print history â”€â”€ */
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

    /* â”€â”€ outside click for dropdowns â”€â”€ */
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

    /* â”€â”€ totals â”€â”€ */
    const subtotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
    const totalPromoDisc = cart.reduce((s, c) => s + (c.promoDiscount ?? 0), 0);

    /* â”€â”€ Diskon & pajak manual (Rp) â€” diturunkan dari type + value â”€â”€
     * Alur perhitungan mengikuti preview modal:
     *   Subtotal â†’ âˆ’Diskon Promo â†’ âˆ’Diskon Manual â†’ +Pajak Manual â†’ +Ongkir
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

    /* â”€â”€ cash rounding â”€â”€ */
    const cashRoundingSettings = storeFeatureSettings?.cash_rounding;
    const cashRoundingEnabled = !!cashRoundingSettings;
    const cashRoundingNearest = cashRoundingSettings?.cash_rounding_nearest ?? 100;
    const cashRoundingMode = cashRoundingSettings?.cash_rounding_mode ?? "nearest";

    // Rounding override state (kasir bisa ganti saat transaksi)
    const [roundingOverrideMode, setRoundingOverrideMode] = useState("store_default"); // store_default | down | up | custom
    const [roundingCustomValue, setRoundingCustomValue] = useState("");

    // Reset override saat modal dibuka/ditutup
    useEffect(() => {
        setRoundingOverrideMode("store_default");
        setRoundingCustomValue("");
    }, [showPayment]);

    // Hitung rounded total berdasarkan mode aktif
    const computeRounded = (amount, nearest, mode) => {
        switch (mode) {
            case "up": return Math.ceil(amount / nearest) * nearest;
            case "down": return Math.floor(amount / nearest) * nearest;
            default: return Math.round(amount / nearest) * nearest;
        }
    };

    const activeRoundingMode = roundingOverrideMode === "store_default" ? cashRoundingMode : roundingOverrideMode;

    let roundedGrandTotal = grandTotal;
    let roundingAdjustment = 0;

    if (cashRoundingEnabled) {
        if (activeRoundingMode === "custom" && roundingCustomValue !== "") {
            const custom = Number(roundingCustomValue);
            const cap = cashRoundingNearest;
            if (Math.abs(custom - grandTotal) <= cap) {
                roundedGrandTotal = custom;
            } else {
                roundedGrandTotal = computeRounded(grandTotal, cashRoundingNearest, cashRoundingMode);
            }
        } else {
            roundedGrandTotal = computeRounded(grandTotal, cashRoundingNearest, activeRoundingMode);
        }
        roundingAdjustment = roundedGrandTotal - grandTotal;
    }

    /* â”€â”€ field wajib per mode yang belum terisi â€” dipakai untuk disable
       tombol Bayar & tampilkan pesan kontekstual SEBELUM user klik bayar,
       bukan cuma alert() setelah modal pembayaran terbuka â”€â”€ */
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
        // Delivery â€” penerima + alamat wajib (semua mode)
        if (orderType === "delivery") {
            if (!deliveryCustomerName.trim() && !selectedCustomer) {
                return "Lengkapi info pengiriman";
            }
            if (!deliveryAddress.trim()) {
                return "Lengkapi info pengiriman";
            }
        }
        // Grosir (retail) â€” pelanggan wajib
        if (isRetail && orderType === "wholesale" && !selectedCustomer) {
            return "Pilih pelanggan grosir dulu";
        }
        return null;
    })();

    /* â”€â”€ Hold / Park transaksi (localStorage) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
     * Kasir bisa "menahan" transaksi berjalan (mis. pelanggan lupa ambil
     * barang) lalu melanjutkannya nanti tanpa kehilangan keranjang. Semua
     * disimpan di localStorage â€” tidak menyentuh backend.
     */
    const persistHeld = (list) => {
        setHeldTransactions(list);
        try {
            localStorage.setItem(HELD_KEY, JSON.stringify(list));
        } catch {
            /* storage penuh / tidak tersedia â€” abaikan */
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

    /* â”€â”€ compose notes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
     * Info tambahan pickup/delivery (telepon, kurir, waktu ambil, catatan
     * pengiriman) dilipat ke field `notes` secara non-destruktif â€” catatan
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
        const joined = parts.join(" â€¢ ");
        return joined ? joined.slice(0, 500) : null;
    };

    const handlePgSuccess = (pgTransaction) => {
        const customer = customers.find(c => String(c.id) === String(selectedCustomer));

        setReceiptData({
            saleNo: pgTransaction.saleNo,
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
            grandTotal: pgTransaction.grandTotal,
            change: pgTransaction.change,
            payments: pgTransaction.payments,
            customerName: customer?.name ?? null,
            tableName: tables.find(t => String(t.id) === String(selectedTable))?.table_number ?? null,
            orderType,
            deliveryAddress: orderType === "delivery" ? deliveryAddress : null,
            deliveryFee: orderType === "delivery" ? Number(deliveryFee || 0) : 0,
            deliveryCustomerName: orderType === "delivery" ? (deliveryCustomerName || customer?.name) : null,
            takeawayCustomerName: orderType === "takeaway" ? takeawayCustomerName || null : null,
            employeeName: selectedEmployee ? (employees.find(e => String(e.id) === String(selectedEmployee))?.name ?? null) : null,
            rentalInfo: isRental && rentalDuration > 0 ? {
                duration: rentalDuration,
                unit: rentalUnit === "per_hour" ? "jam" : rentalUnit === "per_day" ? "hari" : "minggu",
                returnDate: (() => {
                    const now = new Date();
                    const ms = rentalUnit === "per_hour" ? rentalDuration * 3600000 : rentalUnit === "per_day" ? rentalDuration * 86400000 : rentalDuration * 604800000;
                    return new Date(now.getTime() + ms).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
                })(),
            } : null,
            hospitalityInfo: isHospitality ? {
                roomNumber: roomNumber || null,
                guestCount: Number(guestCount) || 1,
                duration: rentalDuration || 1,
                unitLabel: rentalUnit === 'per_hour' ? 'jam' : rentalUnit === 'per_week' ? 'minggu' : 'malam',
                checkoutDate: (() => {
                    const now = new Date();
                    const ms = rentalUnit === 'per_hour' ? (rentalDuration || 1) * 3600000 : rentalUnit === 'per_week' ? (rentalDuration || 1) * 604800000 : (rentalDuration || 1) * 86400000;
                    return new Date(now.getTime() + ms).toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
                })(),
            } : null,
            parkingInfo: isParking ? {
                plateNumber: ticketEvent || '-',
                vehicleLabel: ticketSlot === 'motorcycle' ? 'Motor' : ticketSlot === 'car' ? 'Mobil' : ticketSlot === 'truck' ? 'Truk' : 'Motor',
                ticketNo: roomNumber || null,
                entryTime: new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }),
            } : null,
            sessionInfo: isSession ? {
                unitName: roomNumber || null,
                guestCount: guestCount || 1,
                startTime: new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }),
                orderType,
            } : null,
        });
        // Update history
        setHistoryList(prev => [{
            id: pgTransaction.saleId,
            sale_no: pgTransaction.saleNo,
            grand_total: pgTransaction.grandTotal,
            status: 'completed',
            sale_date: new Date().toISOString(),
            customer: customer ?? null,
            payment_status: 'paid',
            order_type: orderType,
        }, ...prev.slice(0, 19)]);
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

    /* â”€â”€ Split Bill handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

    const handleSplitStart = async (params) => {
        try {
            const { data } = await axios.post(route("admin.kasir.split.start"), {
                customer_id: selectedCustomer || null,
                table_id: selectedTable || null,
                order_type: orderType,
                discount_amount: Number(discount),
                tax_amount: Number(tax),
                shipping_amount: orderType === "delivery" ? Number(deliveryFee || 0) : 0,
            rounding_adjustment: roundingAdjustment,
            rounding_mode: cashRoundingEnabled ? (roundingOverrideMode === "store_default" ? cashRoundingMode : roundingOverrideMode) : null,
            rounding_nearest: cashRoundingEnabled ? cashRoundingNearest : null,
            rounding_custom: cashRoundingEnabled && roundingOverrideMode === "custom" && roundingCustomValue !== "" ? Number(roundingCustomValue) : null,
                delivery_address: orderType === "delivery" ? deliveryAddress : null,
                customer_name: orderType === "delivery" ? deliveryCustomerName : null,
                notes: buildComposedNotes(),
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
                split_mode: params.splitMode,
                payers: params.payers,
                idempotency_key: crypto.randomUUID(),
            });

            if (!data.success) throw new Error(data.message);

            return {
                success: true,
                sale_id: data.sale_id,
                sale_no: data.sale_no,
                grand_total: data.grand_total,
                split_payers: data.split_payers,
            };
        } catch (e) {
            alert("Gagal memulai split bill: " + (e.response?.data?.message || e.message));
            return { success: false };
        }
    };

    const handleSplitPayOffline = async (params) => {
        try {
            // If no sale yet, create it first
            let saleId = params.saleId;
            if (!saleId) {
                const startResult = await handleSplitStart({
                    splitMode: params.splitMode,
                    payers: params.payers,
                });
                if (!startResult.success) return { success: false };
                saleId = startResult.sale_id;
            }

            const { data } = await axios.post(route("admin.kasir.split.pay-offline"), {
                sale_id: saleId,
                split_payer_id: params.payerId,
                method_id: params.methodId,
                paid_amount: params.paidAmount,
            });

            if (!data.success) throw new Error(data.message);

            if (data.all_paid && data.receipt) {
                setReceiptData({
                    ...data.receipt,
                    splitReceiptMode: params.splitReceiptMode === "per_payer" ? "per_payer" : "1",
                });
                playPaymentSuccess();
                setShowReceipt(true);
                setShowPayment(false);
                clearCart();
            }

            return {
                success: true,
                all_paid: data.all_paid,
                sale_id: saleId,
            };
        } catch (e) {
            alert("Gagal memproses pembayaran: " + (e.response?.data?.message || e.message));
            return { success: false };
        }
    };

    const handleSplitCreatePg = async (params) => {
        try {
            let saleId = params.saleId;
            if (!saleId) {
                const startResult = await handleSplitStart({
                    splitMode: params.splitMode,
                    payers: params.payers,
                });
                if (!startResult.success) return { success: false };
                saleId = startResult.sale_id;
            }

            const { data } = await axios.post(route("admin.kasir.split.create-pg"), {
                sale_id: saleId,
                split_payer_id: params.payerId,
                provider: params.provider,
                payment_type: params.paymentType,
            });

            if (!data.success) throw new Error(data.message);

            return {
                success: true,
                sale_id: saleId,
                pgTransaction: {
                    pgTrxId: data.pg_trx_id,
                    amount: data.amount,
                    saleId: saleId,
                    saleNo: null,
                    change: 0,
                    grandTotal: data.amount,
                    paymentType: data.payment_type,
                    qrCode: data.qr_code,
                    qrImageUrl: data.qr_image_url,
                    vaNumber: data.va_number,
                    vaBank: data.va_bank,
                    paymentUrl: data.payment_url,
                    isSplitPayer: true,
                    splitPayerId: params.payerId,
                    splitReceiptMode: params.splitReceiptMode,
                    splitPayers: params.payers,
                },
            };
        } catch (e) {
            alert("Gagal membuat pembayaran online: " + (e.response?.data?.message || e.message));
            return { success: false };
        }
    };

    const handleResumeSplit = async (saleId) => {
        try {
            const { data } = await axios.get(route("admin.kasir.split.show", saleId));
            if (!data.success) throw new Error(data.message);

            setShowPayment(true);
            return data;
        } catch (e) {
            alert("Gagal memuat split bill: " + (e.response?.data?.message || e.message));
            return null;
        }
    };

    const handleCancelSplit = async (saleId) => {
        try {
            const { data } = await axios.post(route("admin.kasir.split.cancel", saleId));
            if (!data.success) throw new Error(data.message);
            router.reload({ only: ["todaySales"] });
            return data;
        } catch (e) {
            alert("Gagal membatalkan: " + (e.response?.data?.message || e.message));
            return null;
        }
    };

    /* â”€â”€ New payment flow handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

    const handleStartSale = async () => {
        try {
            const { data } = await axios.post(route('admin.kasir.start'), {
                customer_id: selectedCustomer || null,
                table_id: selectedTable || null,
                order_type: orderType,
                discount_amount: Number(discount),
                tax_amount: Number(tax),
                shipping_amount: orderType === 'delivery' ? Number(deliveryFee || 0) : 0,
                rounding_adjustment: roundingAdjustment,
                rounding_mode: cashRoundingEnabled ? (roundingOverrideMode === 'store_default' ? cashRoundingMode : roundingOverrideMode) : null,
                rounding_nearest: cashRoundingEnabled ? cashRoundingNearest : null,
                rounding_custom: cashRoundingEnabled && roundingOverrideMode === 'custom' && roundingCustomValue !== '' ? Number(roundingCustomValue) : null,
                delivery_address: orderType === 'delivery' ? deliveryAddress : null,
                customer_name: orderType === 'delivery' ? deliveryCustomerName : null,
                notes: buildComposedNotes(),
                items: cart.map(c => ({
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
                idempotency_key: crypto.randomUUID(),
            });
            if (!data.success) throw new Error(data.message);
            return data;
        } catch (e) {
            alert('Gagal memulai transaksi: ' + (e.response?.data?.message || e.message));
            return { success: false };
        }
    };

    const handleFinalizePayment = async (saleId, payments, extras = {}) => {
        try {
            const { data } = await axios.post(route('admin.kasir.finalize'), {
                sale_id: saleId,
                payments,
                customer_id: extras.customer_id || null,
                kasbon_due_date: extras.kasbon_due_date || null,
                kasbon_note: extras.kasbon_note || null,
            });
            if (!data.success) throw new Error(data.message);
            if (data.is_pg && data.pg_info) {
                // Actually create the PG transaction (QR/VA) now that the sale exists.
                const pgResult = await handleStartPg(saleId, data.pg_info.provider, data.pg_info.method);
                console.log('[PG] handleStartPg result:', pgResult);

                // Even when the initial charge errors out (unknown/failed), the
                // backend has already reconciled with the gateway and returns a
                // pg_trx_id + status we can show progress for â€” don't just die here.
                if (!pgResult?.success && !pgResult?.pg_trx_id) {
                    return { success: false, message: pgResult?.message || 'Gagal membuat transaksi pembayaran online.' };
                }

                return {
                    ...data,
                    is_pg: true,
                    pgTransaction: {
                        pgTrxId: pgResult.pg_trx_id,
                        amount: data.pg_info.amount,
                        saleId: saleId,
                        saleNo: data.sale_no,
                        change: data.change,
                        grandTotal: data.grand_total,
                        paymentType: data.pg_info.method,
                        qrCode: pgResult.qr_code,
                        qrImageUrl: pgResult.qr_image_url,
                        vaNumber: pgResult.va_number,
                        vaBank: pgResult.va_bank,
                        paymentUrl: pgResult.payment_url,
                        initialStatus: pgResult.status ?? 'pending',
                        canRetry: !!pgResult.can_retry,
                        payments: payments.map(p => ({
                            methodName: PG_METHOD_LABELS[p.pg_method]?.label || p.pg_method || 'PG',
                            amount: Number(p.amount),
                        })),
                    },
                };
            }
            const buildReceiptData = (saleInfo) => {
                const customer = customers.find(c => String(c.id) === String(selectedCustomer));
                const table = tables.find(t => String(t.id) === String(selectedTable));
                const employee = employees?.find(e => String(e.id) === String(selectedEmployee));
                const methodMap = Object.fromEntries(paymentMethods.map(m => [m.id, m.name]));

                const rawPayments = saleInfo.payments || payments || [];
                const formattedPayments = rawPayments.length > 0
                    ? rawPayments.map(p => ({
                        methodName: methodMap[p.method_id] || p.methodName || '?',
                        amount: Number(p.amount),
                    }))
                    : [{
                        methodName: saleInfo.paymentMethodLabel || 'Pembayaran',
                        amount: Number(saleInfo.grand_total ?? grandTotal),
                    }];

                return {
                    saleNo: saleInfo.sale_no || saleNo || '-',
                    items: cart.map(c => ({
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
                    discount: Number(discount || 0),
                    tax: Number(tax || 0),
                    totalPromoDisc: totalPromoDisc || 0,
                    cartPromoDiscount: cartPromoDiscount || 0,
                    cartPromoName: cartPromoName || null,
                    grandTotal: saleInfo.grand_total ?? grandTotal,
                    change: saleInfo.change ?? 0,
                    payments: formattedPayments,
                    customerName: customer?.name ?? null,
                    customerPhone: customer?.phone ?? null,
                    tableName: table?.table_number ?? null,
                    orderType,
                    rentalInfo: isRental && rentalDuration > 0 ? {
                        duration: rentalDuration,
                        unit: rentalUnit === "per_hour" ? "jam" : rentalUnit === "per_day" ? "hari" : "minggu",
                        returnDate: (() => {
                            const now = new Date();
                            const ms = rentalUnit === "per_hour" ? rentalDuration * 3600000 : rentalUnit === "per_day" ? rentalDuration * 86400000 : rentalDuration * 604800000;
                            return new Date(now.getTime() + ms).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
                        })(),
                    } : null,
                    hospitalityInfo: isHospitality ? {
                        roomNumber: roomNumber || null,
                        guestCount: Number(guestCount) || 1,
                        duration: rentalDuration || 1,
                        unitLabel: rentalUnit === 'per_hour' ? 'jam' : rentalUnit === 'per_week' ? 'minggu' : 'malam',
                        checkoutDate: (() => {
                            const now = new Date();
                            const ms = rentalUnit === 'per_hour' ? (rentalDuration || 1) * 3600000 : rentalUnit === 'per_week' ? (rentalDuration || 1) * 604800000 : (rentalDuration || 1) * 86400000;
                            return new Date(now.getTime() + ms).toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
                        })(),
                    } : null,
                    parkingInfo: isParking ? {
                        plateNumber: ticketEvent || '-',
                        vehicleLabel: ticketSlot === 'motorcycle' ? 'Motor' : ticketSlot === 'car' ? 'Mobil' : ticketSlot === 'truck' ? 'Truk' : 'Motor',
                        ticketNo: roomNumber || null,
                        entryTime: new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }),
                    } : null,
                    sessionInfo: isSession ? {
                        unitName: roomNumber || null,
                        guestCount: guestCount || 1,
                        startTime: new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }),
                    } : null,
                    deliveryAddress: orderType === "delivery" ? deliveryAddress : null,
                    employeeName: employee?.name ?? null,
                };
            };

            // Return data only — UI state (setSuccessData, clearCart, dll)
            // di-handle oleh PaymentView.jsx, bukan di sini.
            const builtReceipt = buildReceiptData({ ...data, payments });
            const customer = customers.find(c => String(c.id) === String(selectedCustomer));
            setHistoryList(prev => [{
                id: saleId, sale_no: data.sale_no, grand_total: data.grand_total,
                status: 'completed', sale_date: new Date().toISOString(),
                customer: customer ?? null, payment_status: 'paid', order_type: orderType,
            }, ...prev.slice(0, 19)]);
            return { ...data, receipt: builtReceipt };
        } catch (e) {
            alert('Gagal memproses pembayaran: ' + (e.response?.data?.message || e.message));
            return { success: false };
        }
    };

    const handleCancelPendingSale = async (saleId) => {
        try {
            await axios.post(route('admin.kasir.cancel-pending', saleId));
            return { success: true };
        } catch (e) {
            console.error('Failed to cancel pending sale:', e);
            return { success: false };
        }
    };

    const buildWhatsAppMessage = (receipt, sName = storeName) => {
        if (!receipt) return '';
        const lines = [
            `*${sName}*`,
            `No. Struk: ${receipt.saleNo || '-'}`,
            `Tanggal: ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`,
        ];

        if (receipt.customerName) lines.push(`Pelanggan: ${receipt.customerName}`);
        if (receipt.tableName) lines.push(`Meja: ${receipt.tableName}`);
        lines.push('--------------------------------');

        (receipt.items || []).forEach(it => {
            const variantStr = it.variantName ? ` (${it.variantName})` : '';
            lines.push(`${it.name}${variantStr}`);
            lines.push(`  ${it.qty}x @ Rp${Number(it.price).toLocaleString('id-ID')} = Rp${Number(it.subtotal).toLocaleString('id-ID')}`);
        });

        lines.push('--------------------------------');
        lines.push(`Subtotal: Rp${Number(receipt.subtotal || 0).toLocaleString('id-ID')}`);
        if (receipt.discount > 0) lines.push(`Diskon: -Rp${Number(receipt.discount).toLocaleString('id-ID')}`);
        if (receipt.tax > 0) lines.push(`Pajak: +Rp${Number(receipt.tax).toLocaleString('id-ID')}`);
        lines.push(`*TOTAL: Rp${Number(receipt.grandTotal || 0).toLocaleString('id-ID')}*`);

        if (receipt.payments && receipt.payments.length > 0) {
            receipt.payments.forEach(p => {
                lines.push(`Bayar (${p.methodName}): Rp${Number(p.amount).toLocaleString('id-ID')}`);
            });
        }
        if (receipt.change > 0) {
            lines.push(`Kembalian: Rp${Number(receipt.change).toLocaleString('id-ID')}`);
        }

        lines.push('--------------------------------');
        lines.push('Terima kasih telah berbelanja!');
        return lines.join('\n');
    };

    const sendWhatsApp = (receipt, sName = storeName) => {
        const msg = buildWhatsAppMessage(receipt, sName);
        const customerObj = customers.find(c => String(c.id) === String(selectedCustomer));
        const rawPhone = receipt?.customerPhone || customerObj?.phone;
        const cleanPhone = rawPhone ? String(rawPhone).replace(/\D/g, '') : '';

        if (cleanPhone) {
            const formattedPhone = cleanPhone.startsWith('0')
                ? '62' + cleanPhone.slice(1)
                : cleanPhone;
            window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(msg)}`, '_blank');
        } else {
            if (navigator.clipboard) {
                navigator.clipboard.writeText(msg);
                alert('Nomor WhatsApp pelanggan tidak tersedia. Teks struk telah disalin ke clipboard!');
            } else {
                alert('Nomor WhatsApp pelanggan tidak tersedia.');
            }
        }
    };

    const handleNewTransaction = () => {
        clearCart();
        setDiscount(0);
        setTax(0);
        setNotes('');
        setSelectedCustomer(null);
        setSelectedTable(null);
        setDeliveryAddress('');
        setSelectedEmployee(null);
        setShowPayment(false);
        setShowReceipt(false);
        setReceiptData(null);
        setSuccessData(null);
    };

    const handleStartPg = async (saleId, provider, paymentType, customAmount = null) => {
        try {
            const { data } = await axios.post(route('admin.payment-gateway.create-transaction'), {
                sale_id: saleId,
                provider,
                payment_type: paymentType,
                amount: customAmount || undefined,
            });
            console.log('[PG] create-transaction response:', data);
            return data;
        } catch (e) {
            // 422 responses from the backend carry status/can_retry/pg_trx_id â€”
            // preserve them so the UI can offer a retry instead of a dead end.
            if (e.response?.data) {
                return { success: false, ...e.response.data };
            }
            const msg = e.message || 'Gagal membuat transaksi pembayaran online.';
            return { success: false, message: msg };
        }
    };

    const handleRetryPg = async (pgTrxId) => {
        try {
            const { data } = await axios.post(route('admin.payment-gateway.retry'), {
                pg_trx_id: pgTrxId,
            });
            return data;
        } catch (e) {
            if (e.response?.data) {
                return { success: false, ...e.response.data };
            }
            return { success: false, message: e.message || 'Gagal mencoba ulang pembayaran.' };
        }
    };

    /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
       Return everything
    â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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
        resumeSaleId,
        resumeSaleNo,
        initialPgTransaction,
        showReceipt,
        setShowReceipt,
        receiptData,
        setReceiptData,
        successData,
        setSuccessData,
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
        cashRoundingNearest,
        cashRoundingMode,
        roundingOverrideMode,
        setRoundingOverrideMode,
        roundingCustomValue,
        setRoundingCustomValue,
        missingRequiredField,
        rentalInfo: isRental && rentalDuration > 0 ? {
            duration: rentalDuration,
            unit: rentalUnit === "per_hour" ? "jam" : rentalUnit === "per_day" ? "hari" : "minggu",
            returnDate: (() => {
                const now = new Date();
                const ms = rentalUnit === "per_hour" ? rentalDuration * 3600000 : rentalUnit === "per_day" ? rentalDuration * 86400000 : rentalDuration * 604800000;
                return new Date(now.getTime() + ms).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
            })(),
        } : null,
        hospitalityInfo: isHospitality ? {
            roomNumber: roomNumber || null,
            guestCount: Number(guestCount) || 1,
            duration: rentalDuration || 1,
            unitLabel: rentalUnit === 'per_hour' ? 'jam' : rentalUnit === 'per_week' ? 'minggu' : 'malam',
            checkoutDate: (() => {
                const now = new Date();
                const ms = rentalUnit === 'per_hour' ? (rentalDuration || 1) * 3600000 : rentalUnit === 'per_week' ? (rentalDuration || 1) * 604800000 : (rentalDuration || 1) * 86400000;
                return new Date(now.getTime() + ms).toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
            })(),
        } : null,
        parkingInfo: isParking ? {
            plateNumber: ticketEvent || '-',
            vehicleLabel: ticketSlot === 'motorcycle' ? 'Motor' : ticketSlot === 'car' ? 'Mobil' : ticketSlot === 'truck' ? 'Truk' : 'Motor',
            ticketNo: roomNumber || null,
            entryTime: new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }),
        } : null,
        sessionInfo: isSession ? {
            unitName: roomNumber || null,
            guestCount: guestCount || 1,
            startTime: new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }),
        } : null,

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
        handleSearchEnter,
        playBeep,
        handleOrderTypeChange,
        handlePrintHistory,
        handlePgSuccess,
        handleFreeTable,
        handleSplitStart,
        handleSplitPayOffline,
        handleSplitCreatePg,
        handleResumeSplit,
        handleCancelSplit,
        handleStartSale,
        handleFinalizePayment,
        handleCancelPendingSale,
        handleStartPg,
        handleRetryPg,
        buildWhatsAppMessage,
        sendWhatsApp,
        handleNewTransaction,
        product_sell_price,
        findBestPromoForItem,
        findBestCartPromo,
        recalcPromo,
    };
}
