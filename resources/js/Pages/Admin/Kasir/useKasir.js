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

    // backward compat (old sub-types now mapped to final 6 modes)
    const isCafe = isFnb;
    const isBooth = isFnb;
    const orderOpts = modeConfig.orderTypes;
    const hasModeFeature = (feature) => modeHasFeature(activeMode, feature);

    /* ── state ── */
    const [customers, setCustomers] = useState(initialCustomers || []);
    const [search, setSearch] = useState("");
    const [activeCat, setActiveCat] = useState("");
    const [cart, setCart] = useState([]);
    const [cartIdSeq, setCartIdSeq] = useState(0);

    /* ── scanner state ── */
    const [showScanner, setShowScanner] = useState(false);
    const [scanning, setScanning] = useState(false);
    const [discount, setDiscount] = useState(0);
    const [tax, setTax] = useState(0);
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

    /* mode-specific state */
    const [serviceWeight, setServiceWeight] = useState("");
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
    const [showPayment, setShowPayment] = useState(false);
    const [showReceipt, setShowReceipt] = useState(false);
    const [receiptData, setReceiptData] = useState(null);
    const [showHistory, setShowHistory] = useState(false);
    const [historyPrintLoading, setHistoryPrintLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [historyList, setHistoryList] = useState(todaySales);
    const [cartPanelOpen, setCartPanelOpen] = useState(false);
    const [pgModalData, setPgModalData] = useState(null);

    /* ── refs ── */
    const customerDropdownRef = useRef(null);
    const customerInputRef = useRef(null);
    const tableDropdownRef = useRef(null);
    const tableInputRef = useRef(null);
    const barcodeRef = useRef(null);

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
    const addToCart = (
        product,
        variant = null,
        modifiers = [],
        itemNote = "",
    ) => {
        const price = variant
            ? Number(variant.price)
            : Number(product.sell_price);
        const modExtra = modifiers.reduce(
            (s, m) => s + (m.price_addition ?? 0),
            0,
        );
        const effectivePrice = price + modExtra;

        // find existing identical item (same product+variant+modifiers)
        const key = `${product.id}-${variant?.id ?? 0}-${JSON.stringify(modifiers)}`;
        const existing = cart.find((c) => c.key === key && c.note === itemNote);

        if (existing) {
            setCart((prev) =>
                prev.map((c) => {
                    if (c.cartId !== existing.cartId) return c;
                    const updated = { ...c, qty: c.qty + 1 };
                    return recalcPromo(updated);
                }),
            );
        } else {
            const newItem = {
                cartId: cartIdSeq + 1,
                key,
                productId: product.id,
                variantId: variant?.id ?? null,
                name: product.name,
                variantName: variant?.name ?? null,
                price: effectivePrice,
                qty: 1,
                modifiers,
                note: itemNote,
            };
            const withPromo = recalcPromo(newItem);
            setCartIdSeq((s) => s + 1);
            setCart((prev) => [...prev, withPromo]);
        }
    };

    const changeQty = (cartId, delta) => {
        setCart((prev) =>
            prev
                .map((c) =>
                    c.cartId === cartId
                        ? recalcPromo({ ...c, qty: Math.max(1, c.qty + delta) })
                        : c,
                )
                .filter((c) => c.qty > 0),
        );
    };

    const removeItem = (cartId) =>
        setCart((prev) => prev.filter((c) => c.cartId !== cartId));

    const clearCart = () => {
        setCart([]);
        setDiscount(0);
        setTax(0);
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
        setTakeawayCustomerName("");
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
        const hasVariants = (product.variants ?? []).filter(v => v.is_active).length > 0;

        if (hasModifiers) {
            // Produk dengan modifier — buka ModifierModal (behaviour lama)
            setModifierTarget(product);
        } else if (hasVariants) {
            // Produk dengan variant tapi tanpa modifier — buka VariantModal
            setVariantTarget(product);
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
    const grandTotal = Math.max(
        0,
        subtotal -
            totalPromoDisc -
            cartPromoDiscount -
            Number(discount) +
            Number(tax) +
            Number(deliveryFee || 0),
    );

    /* ── submit ── */
    const handleConfirmPayment = async (payments, change) => {
        if (!activeShift) {
            alert(
                "Anda harus membuka shift terlebih dahulu sebelum melakukan transaksi.",
            );
            setSubmitting(false);
            return;
        }
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
            alert('Layanan service wajib memilih customer terlebih dahulu.\n\nTambahkan customer baru dari dropdown pelanggan di atas.');
            return;
        }
        // Customer wajib untuk rental
        if (isRental && !selectedCustomer) {
            alert('Sewa barang wajib memilih customer.\n\nPilih atau tambahkan customer dari dropdown di atas.');
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
            delivery_address: orderType === "delivery" ? deliveryAddress : null,
            customer_name:
                orderType === "delivery"
                    ? deliveryCustomerName.trim() || null
                    : orderType === "takeaway"
                      ? takeawayCustomerName.trim() || null
                      : null,
            notes: note || null,
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
                      room_number: roomNumber || null,
                      guest_count: Number(guestCount) || 1,
                  }
                : {}),
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
                    ? (employees.find(e => String(e.id) === String(selectedEmployee))?.name ?? null)
                    : null,
                rentalInfo: isRental && rentalDuration > 0 ? {
                    duration: rentalDuration,
                    unit: rentalUnit === 'per_hour' ? 'jam' : rentalUnit === 'per_day' ? 'hari' : 'minggu',
                    returnDate: (() => {
                        const now = new Date();
                        const ms = rentalUnit === 'per_hour' ? rentalDuration * 3600000
                            : rentalUnit === 'per_day' ? rentalDuration * 86400000
                            : rentalDuration * 604800000;
                        return new Date(now.getTime() + ms).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
                    })(),
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
                            ? (employees.find(e => String(e.id) === String(selectedEmployee))?.name ?? null)
                            : null,
                        rentalInfo: isRental && rentalDuration > 0 ? {
                            duration: rentalDuration,
                            unit: rentalUnit === 'per_hour' ? 'jam' : rentalUnit === 'per_day' ? 'hari' : 'minggu',
                            returnDate: (() => {
                                const now = new Date();
                                const ms = rentalUnit === 'per_hour' ? rentalDuration * 3600000
                                    : rentalUnit === 'per_day' ? rentalDuration * 86400000
                                    : rentalDuration * 604800000;
                                return new Date(now.getTime() + ms).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
                            })(),
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
                                ? (employees.find(e => String(e.id) === String(selectedEmployee))?.name ?? null)
                                : null,
                            rentalInfo: isRental && rentalDuration > 0 ? {
                                duration: rentalDuration,
                                unit: rentalUnit === 'per_hour' ? 'jam' : rentalUnit === 'per_day' ? 'hari' : 'minggu',
                                returnDate: (() => {
                                    const now = new Date();
                                    const ms = rentalUnit === 'per_hour' ? rentalDuration * 3600000
                                        : rentalUnit === 'per_day' ? rentalDuration * 86400000
                                        : rentalDuration * 604800000;
                                    return new Date(now.getTime() + ms).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
                                })(),
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
                ? (employees.find(e => String(e.id) === String(selectedEmployee))?.name ?? null)
                : null,
            rentalInfo: isRental && rentalDuration > 0 ? {
                duration: rentalDuration,
                unit: rentalUnit === 'per_hour' ? 'jam' : rentalUnit === 'per_day' ? 'hari' : 'minggu',
                returnDate: (() => {
                    const now = new Date();
                    const ms = rentalUnit === 'per_hour' ? rentalDuration * 3600000
                        : rentalUnit === 'per_day' ? rentalDuration * 86400000
                        : rentalDuration * 604800000;
                    return new Date(now.getTime() + ms).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
                })(),
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
        isCafe,
        isBooth,
        orderOpts,

        /* state */
        customers,
        setCustomers,
        search,
        setSearch,
        activeCat,
        setActiveCat,
        cart,
        setCart,
        cartIdSeq,
        setCartIdSeq,
        showScanner,
        setShowScanner,
        scanning,
        setScanning,
        discount,
        setDiscount,
        tax,
        setTax,
        orderType,
        setOrderType,
        selectedCustomer,
        setSelectedCustomer,
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
        serviceWeight,
        setServiceWeight,
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
        pgModalData,
        setPgModalData,

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

        /* handlers */
        addToCart,
        changeQty,
        removeItem,
        clearCart,
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
