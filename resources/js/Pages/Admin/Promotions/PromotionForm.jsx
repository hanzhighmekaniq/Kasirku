import { useState } from "react";

const TYPES = [
    {
        value: "percentage",
        label: "Persen (%)",
        hint: "Diskon dalam persentase",
    },
    {
        value: "fixed_amount",
        label: "Nominal (Rp)",
        hint: "Diskon dalam nominal tetap",
    },
    {
        value: "buy_x_get_y",
        label: "Beli X Gratis Y",
        hint: "Buy X Get Y Free",
    },
    { value: "bundle", label: "Bundle / Paket", hint: "Paket harga spesial" },
    {
        value: "tiered",
        label: "Harga Tiered",
        hint: "Harga spesial jika beli >= jumlah tertentu",
    },
    {
        value: "member_price",
        label: "Harga Member",
        hint: "Harga khusus untuk tier pelanggan tertentu",
    },
    {
        value: "bogo",
        label: "Beli X Gratis Produk",
        hint: "Beli X gratis 1 produk tertentu",
    },
];

const TIERS = [
    { value: "", label: "-- Pilih Tier --" },
    { value: "bronze", label: "Bronze" },
    { value: "silver", label: "Silver" },
    { value: "gold", label: "Gold" },
    { value: "platinum", label: "Platinum" },
];

const SCOPES = [
    { value: "item", label: "Per Item", desc: "Berlaku untuk item spesifik" },
    { value: "cart", label: "Keranjang", desc: "Berlaku untuk total belanja" },
];

export default function PromotionForm({
    data,
    setData,
    errors,
    processing,
    onSubmit,
    submitLabel = "Simpan",
    cancelHref,
    products = [],
}) {
    const [productSearch, setProductSearch] = useState("");
    const [showProductPicker, setShowProductPicker] = useState(false);

    const selectedIds = data.product_ids || [];
    const selectedProducts = products.filter((p) => selectedIds.includes(p.id));

    const filteredProducts = products.filter((p) => {
        if (selectedIds.includes(p.id)) return false;
        const q = productSearch.trim().toLowerCase();
        if (!q) return true;
        return (
            p.name.toLowerCase().includes(q) ||
            (p.sku || "").toLowerCase().includes(q)
        );
    });

    const addProduct = (id) => {
        setData("product_ids", [...selectedIds, id]);
        setProductSearch("");
    };

    const removeProduct = (id) => {
        setData(
            "product_ids",
            selectedIds.filter((i) => i !== id),
        );
    };

    const inputCls = (field) =>
        `block w-full rounded-xl border bg-white px-3 py-2.5 text-sm shadow-sm transition focus:ring-2 ${
            errors[field]
                ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                : "border-slate-300 focus:border-indigo-500 focus:ring-indigo-200"
        }`;

    const showTierPrice =
        data.type === "tiered" || data.type === "member_price";
    const showMinQuantity = data.type === "tiered";
    const showCustomerTier = data.type === "member_price";
    const showFreeProduct = data.type === "bogo";
    const showBuyQty = data.type === "buy_x_get_y" || data.type === "bogo";
    const showMaxDiscount = data.type === "percentage";
    const showBundlePrice = data.type === "bundle";
    const showProductPickerSection = data.scope === "item";

    return (
        <form onSubmit={onSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700">
                        Nama Promo <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={data.name}
                        autoFocus
                        onChange={(e) => setData("name", e.target.value)}
                        placeholder="cth. Diskon 10% Minuman, Happy Hour"
                        className={`mt-1.5 ${inputCls("name")}`}
                    />
                    {errors.name && (
                        <p className="mt-1.5 text-sm text-red-600">
                            {errors.name}
                        </p>
                    )}
                </div>

                {/* Scope */}
                <div>
                    <label className="block text-sm font-medium text-slate-700">
                        Cakupan Promo <span className="text-red-500">*</span>
                    </label>
                    <p className="mt-1 text-xs text-slate-400">
                        Per Item = berlaku per item | Keranjang = berlaku untuk
                        total belanja
                    </p>
                    <div className="mt-2 grid grid-cols-2 gap-3">
                        {SCOPES.map((s) => (
                            <button
                                key={s.value}
                                type="button"
                                onClick={() => setData("scope", s.value)}
                                className={`rounded-xl border-2 px-4 py-3 text-left transition ${
                                    data.scope === s.value
                                        ? "border-indigo-500 bg-indigo-50 ring-1 ring-indigo-200"
                                        : "border-slate-200 bg-white hover:border-slate-300"
                                }`}
                            >
                                <p
                                    className={`text-sm font-semibold ${data.scope === s.value ? "text-indigo-700" : "text-slate-700"}`}
                                >
                                    {s.label}
                                </p>
                                <p className="mt-0.5 text-xs text-slate-400">
                                    {s.desc}
                                </p>
                            </button>
                        ))}
                    </div>
                    {errors.scope && (
                        <p className="mt-1.5 text-sm text-red-600">
                            {errors.scope}
                        </p>
                    )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <label className="block text-sm font-medium text-slate-700">
                            Tipe Promo <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={data.type}
                            onChange={(e) => setData("type", e.target.value)}
                            className={`mt-1.5 ${inputCls("type")}`}
                        >
                            {TYPES.map((t) => (
                                <option key={t.value} value={t.value}>
                                    {t.label}
                                </option>
                            ))}
                        </select>
                        {errors.type && (
                            <p className="mt-1.5 text-sm text-red-600">
                                {errors.type}
                            </p>
                        )}
                        <p className="mt-1 text-xs text-slate-400">
                            {TYPES.find((t) => t.value === data.type)?.hint}
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700">
                            {showBuyQty
                                ? "Beli Sebanyak"
                                : showBundlePrice
                                  ? "Harga per Item"
                                  : showTierPrice
                                    ? "Harga Spesial"
                                    : "Nilai Diskon"}{" "}
                            <span className="text-red-500">*</span>
                        </label>
                        <div className="relative mt-1.5">
                            {data.type === "percentage" ? (
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    value={data.discount_value}
                                    onChange={(e) =>
                                        setData(
                                            "discount_value",
                                            e.target.value,
                                        )
                                    }
                                    placeholder="10"
                                    className={`${inputCls("discount_value")} pr-10`}
                                />
                            ) : showTierPrice ? (
                                <input
                                    type="number"
                                    min="0"
                                    step="100"
                                    value={data.tier_price}
                                    onChange={(e) =>
                                        setData("tier_price", e.target.value)
                                    }
                                    placeholder="Harga spesial"
                                    className={`${inputCls("tier_price")} pl-10`}
                                />
                            ) : (
                                <input
                                    type="number"
                                    min="0"
                                    step={showBuyQty ? "1" : "100"}
                                    value={
                                        showBuyQty
                                            ? data.discount_value
                                            : data.discount_value
                                    }
                                    onChange={(e) =>
                                        setData(
                                            "discount_value",
                                            e.target.value,
                                        )
                                    }
                                    placeholder={showBuyQty ? "3" : "5000"}
                                    className={`${inputCls("discount_value")} pl-10`}
                                />
                            )}
                            <span
                                className="pointer-events-none absolute inset-y-0 flex items-center text-sm text-slate-400"
                                style={{
                                    [data.type === "percentage"
                                        ? "right"
                                        : "left"]: "0.75rem",
                                }}
                            >
                                {data.type === "percentage"
                                    ? "%"
                                    : showTierPrice
                                      ? "Rp"
                                      : showBuyQty
                                        ? "x"
                                        : "Rp"}
                            </span>
                        </div>
                        {showTierPrice && errors.tier_price && (
                            <p className="mt-1.5 text-sm text-red-600">
                                {errors.tier_price}
                            </p>
                        )}
                        {!showTierPrice && errors.discount_value && (
                            <p className="mt-1.5 text-sm text-red-600">
                                {errors.discount_value}
                            </p>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <label className="block text-sm font-medium text-slate-700">
                            Min. Pembelian{" "}
                            <span className="text-xs font-normal text-slate-400">
                                (opsional)
                            </span>
                        </label>
                        <div className="relative mt-1.5">
                            <input
                                type="number"
                                min="0"
                                step="1000"
                                value={data.min_purchase_amount}
                                onChange={(e) =>
                                    setData(
                                        "min_purchase_amount",
                                        e.target.value,
                                    )
                                }
                                placeholder="0"
                                className={`${inputCls("min_purchase_amount")} pl-10`}
                            />
                            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-slate-400">
                                Rp
                            </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-400">
                            {data.scope === "cart"
                                ? "Minimum total belanja"
                                : "Minimum belanja per item"}
                        </p>
                    </div>

                    {showMaxDiscount && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700">
                                Maks. Diskon{" "}
                                <span className="text-xs font-normal text-slate-400">
                                    (opsional)
                                </span>
                            </label>
                            <div className="relative mt-1.5">
                                <input
                                    type="number"
                                    min="0"
                                    step="1000"
                                    value={data.max_discount_amount}
                                    onChange={(e) =>
                                        setData(
                                            "max_discount_amount",
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Tanpa batas"
                                    className={`${inputCls("max_discount_amount")} pl-10`}
                                />
                                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-slate-400">
                                    Rp
                                </span>
                            </div>
                            <p className="mt-1 text-xs text-slate-400">
                                Batas maksimal diskon
                            </p>
                        </div>
                    )}

                    {showMinQuantity && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700">
                                Min. Qty <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                min="1"
                                step="1"
                                value={data.min_quantity}
                                onChange={(e) =>
                                    setData("min_quantity", e.target.value)
                                }
                                placeholder="cth. 3"
                                className={`mt-1.5 ${inputCls("min_quantity")}`}
                            />
                            <p className="mt-1 text-xs text-slate-400">
                                Jumlah minimum agar harga tier berlaku
                            </p>
                            {errors.min_quantity && (
                                <p className="mt-1.5 text-sm text-red-600">
                                    {errors.min_quantity}
                                </p>
                            )}
                        </div>
                    )}

                    {showCustomerTier && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700">
                                Tier Pelanggan{" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={data.customer_tier}
                                onChange={(e) =>
                                    setData("customer_tier", e.target.value)
                                }
                                className={`mt-1.5 ${inputCls("customer_tier")}`}
                            >
                                {TIERS.map((t) => (
                                    <option key={t.value} value={t.value}>
                                        {t.label}
                                    </option>
                                ))}
                            </select>
                            <p className="mt-1 text-xs text-slate-400">
                                Hanya berlaku untuk pelanggan tier ini
                            </p>
                            {errors.customer_tier && (
                                <p className="mt-1.5 text-sm text-red-600">
                                    {errors.customer_tier}
                                </p>
                            )}
                        </div>
                    )}

                    {showFreeProduct && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700">
                                Produk Gratis{" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={data.free_product_id}
                                onChange={(e) =>
                                    setData("free_product_id", e.target.value)
                                }
                                className={`mt-1.5 ${inputCls("free_product_id")}`}
                            >
                                <option value="">-- Pilih Produk --</option>
                                {products.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name} (Rp{" "}
                                        {Number(p.sell_price).toLocaleString(
                                            "id-ID",
                                        )}
                                        )
                                    </option>
                                ))}
                            </select>
                            <p className="mt-1 text-xs text-slate-400">
                                Produk yang diberikan gratis
                            </p>
                            {errors.free_product_id && (
                                <p className="mt-1.5 text-sm text-red-600">
                                    {errors.free_product_id}
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Flash Sale Time Window */}
                <div>
                    <p className="block text-sm font-medium text-slate-700">
                        Jam Berlaku{" "}
                        <span className="text-xs font-normal text-slate-400">
                            (opsional — untuk flash sale)
                        </span>
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                        Kosongkan jika promo berlaku sepanjang hari
                    </p>
                    <div className="mt-2 grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-slate-500">
                                Jam Mulai
                            </label>
                            <input
                                type="time"
                                value={data.start_hour}
                                onChange={(e) =>
                                    setData("start_hour", e.target.value)
                                }
                                className={`mt-1.5 ${inputCls("start_hour")}`}
                            />
                            {errors.start_hour && (
                                <p className="mt-1 text-sm text-red-600">
                                    {errors.start_hour}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500">
                                Jam Selesai
                            </label>
                            <input
                                type="time"
                                value={data.end_hour}
                                onChange={(e) =>
                                    setData("end_hour", e.target.value)
                                }
                                className={`mt-1.5 ${inputCls("end_hour")}`}
                            />
                            {errors.end_hour && (
                                <p className="mt-1 text-sm text-red-600">
                                    {errors.end_hour}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <label className="block text-sm font-medium text-slate-700">
                            Tanggal Mulai{" "}
                            <span className="text-xs font-normal text-slate-400">
                                (opsional)
                            </span>
                        </label>
                        <input
                            type="date"
                            value={data.start_date}
                            onChange={(e) =>
                                setData("start_date", e.target.value)
                            }
                            className={`mt-1.5 ${inputCls("start_date")}`}
                        />
                        {errors.start_date && (
                            <p className="mt-1.5 text-sm text-red-600">
                                {errors.start_date}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700">
                            Tanggal Berakhir{" "}
                            <span className="text-xs font-normal text-slate-400">
                                (opsional)
                            </span>
                        </label>
                        <input
                            type="date"
                            value={data.end_date}
                            onChange={(e) =>
                                setData("end_date", e.target.value)
                            }
                            className={`mt-1.5 ${inputCls("end_date")}`}
                        />
                        {errors.end_date && (
                            <p className="mt-1.5 text-sm text-red-600">
                                {errors.end_date}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => setData("is_active", !data.is_active)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                            data.is_active ? "bg-indigo-600" : "bg-slate-200"
                        }`}
                    >
                        <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                                data.is_active
                                    ? "translate-x-5"
                                    : "translate-x-0"
                            }`}
                        />
                    </button>
                    <div>
                        <p className="text-sm font-medium text-slate-700">
                            Aktif
                        </p>
                        <p className="text-xs text-slate-400">
                            Promo akan tampil di POS jika aktif
                        </p>
                    </div>
                </div>
            </div>

            {/* Product Selection — only for scope=item */}
            {showProductPickerSection && (
                <div>
                    <label className="block text-sm font-medium text-slate-700">
                        Produk{" "}
                        <span className="text-xs font-normal text-slate-400">
                            (opsional — kosongkan untuk berlaku umum)
                        </span>
                    </label>
                    <p className="mt-1 text-xs text-slate-400">
                        Pilih produk spesifik, atau kosongkan jika promo berlaku
                        untuk semua produk.
                    </p>

                    {selectedProducts.length > 0 && (
                        <div className="mt-3">
                            <p className="mb-2 text-xs font-medium text-slate-500">
                                {selectedProducts.length} produk dipilih
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {selectedProducts.map((p) => (
                                    <span
                                        key={p.id}
                                        className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 border border-indigo-100 px-2.5 py-1 text-xs font-medium text-indigo-700"
                                    >
                                        <span className="max-w-[120px] truncate">
                                            {p.name}
                                        </span>
                                        <span className="text-indigo-400">
                                            Rp{" "}
                                            {Number(
                                                p.sell_price,
                                            ).toLocaleString("id-ID")}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => removeProduct(p.id)}
                                            className="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-indigo-200 hover:text-indigo-800"
                                        >
                                            <svg
                                                className="h-3 w-3"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth={2}
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M6 18L18 6M6 6l12 12"
                                                />
                                            </svg>
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="mt-3">
                        <button
                            type="button"
                            onClick={() =>
                                setShowProductPicker(!showProductPicker)
                            }
                            className="inline-flex items-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-indigo-400 hover:text-indigo-600"
                        >
                            <svg
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M12 4.5v15m7.5-7.5h-15"
                                />
                            </svg>
                            {selectedProducts.length > 0
                                ? "Tambah Produk Lain"
                                : "Pilih Produk"}
                        </button>

                        {showProductPicker && (
                            <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
                                <div className="border-b border-slate-100 bg-slate-50/60 p-3">
                                    <input
                                        type="text"
                                        value={productSearch}
                                        onChange={(e) =>
                                            setProductSearch(e.target.value)
                                        }
                                        placeholder="Cari produk..."
                                        className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                        autoFocus
                                    />
                                </div>
                                <div className="max-h-60 overflow-y-auto">
                                    {filteredProducts.length === 0 ? (
                                        <div className="px-4 py-6 text-center text-sm text-slate-500">
                                            {products.length === 0
                                                ? "Tidak ada produk aktif"
                                                : "Produk tidak ditemukan"}
                                        </div>
                                    ) : (
                                        filteredProducts.map((p) => (
                                            <button
                                                key={p.id}
                                                type="button"
                                                onClick={() => addProduct(p.id)}
                                                className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition hover:bg-indigo-50"
                                            >
                                                <div>
                                                    <p className="font-medium text-slate-800">
                                                        {p.name}
                                                    </p>
                                                    <p className="text-xs text-slate-400">
                                                        {p.sku} • Rp{" "}
                                                        {Number(
                                                            p.sell_price,
                                                        ).toLocaleString(
                                                            "id-ID",
                                                        )}
                                                    </p>
                                                </div>
                                                <svg
                                                    className="h-4 w-4 text-slate-400"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    strokeWidth={2}
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        d="M12 4.5v15m7.5-7.5h-15"
                                                    />
                                                </svg>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <a
                    href={cancelHref}
                    className="inline-flex justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                    Batal
                </a>
                <button
                    type="submit"
                    disabled={processing}
                    className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:from-indigo-600 hover:to-violet-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60"
                >
                    {processing ? "Menyimpan..." : submitLabel}
                </button>
            </div>
        </form>
    );
}
