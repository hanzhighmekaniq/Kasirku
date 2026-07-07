import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, useForm, usePage } from "@inertiajs/react";
import { useState } from "react";
import BarcodeScanner from "@/Components/BarcodeScanner";

const UNIT_OPTIONS = [
    "pcs",
    "kg",
    "gram",
    "liter",
    "ml",
    "box",
    "pack",
    "lusin",
    "karton",
];

// UI field visibility — derived from storeTypeFeatures (database)
// Mapping: supplier→supplier, purchase→costPrice, kitchen→prepTime,
//          recipe→isComposable, stock→trackStock, product→barcode/isSellable

// Tipe produk yang relevan per store type
const RELEVANT_TYPES = {
    retail: ["finished_goods", "raw_material", "combo"],
    fnb: ["finished_goods", "raw_material", "combo"],
    service: ["service", "finished_goods"],
    rental: ["rental_item", "finished_goods"],
    ticket: ["time_based", "finished_goods"],
    hospitality: ["time_based", "service", "finished_goods"],
    parking: ["time_based"],
    session: ["time_based", "finished_goods"],
};

// Tipe yang tidak punya stok fisik
const NO_STOCK_TYPES = ["service", "time_based"];

export default function Edit({
    product,
    categories,
    suppliers,
    productTypes = {},
    storeType = "retail",
}) {
    const [imagePreview, setImagePreview] = useState(
        product.image ? `/storage/${product.image}` : null,
    );
    const [showScanner, setShowScanner] = useState(false);

    const { storeTypeFeatures = [] } = usePage().props;
    const has = (f) => storeTypeFeatures.includes(f);

    const availableTypes = RELEVANT_TYPES[storeType] ?? ["finished_goods"];
    const feat = {
        barcode: true, // selalu tampilkan barcode
        supplier: has("supplier"), // retail, fnb, rental
        costPrice: has("purchase"), // retail, fnb, rental
        prepTime: has("kitchen"), // fnb
        isComposable: has("recipe"), // fnb
        isSellable: true, // selalu tampilkan is_sellable
        trackStock: has("stock"), // retail, fnb, rental
    };

    const { data, setData, post, processing, errors } = useForm({
        _method: "PUT",
        name: product.name ?? "",
        sku: product.sku ?? "",
        barcode: product.barcode ?? "",
        type: product.type ?? "finished_goods",
        category_id: product.category_id ?? "",
        supplier_id: product.supplier_id ?? "",
        unit: product.unit ?? "pcs",
        sell_price: product.sell_price ?? "",
        cost_price: product.cost_price ?? "",
        stock_minimum: product.stock_minimum ?? 0,
        track_stock: product.track_stock ?? true,
        is_sellable: product.is_sellable ?? true,
        is_composable: product.is_composable ?? false,
        preparation_time: product.preparation_time ?? "",
        is_active: product.is_active ?? true,
        image: null,
        remove_image: false,
        description: product.description ?? "",
        price_per_hour: product.price_per_hour ?? "",
        min_duration_minutes: product.min_duration_minutes ?? "",
        capacity: product.capacity ?? "",
        max_guests: product.max_guests ?? "",
        valid_duration_minutes: product.valid_duration_minutes ?? "",
        session_duration_minutes: product.session_duration_minutes ?? "",
        deposit_amount: product.deposit_amount ?? "",
    });

    // Apakah tipe yang dipilih tidak punya stok fisik
    const isNoStock = NO_STOCK_TYPES.includes(data.type);

    // Label harga dinamis berdasarkan tipe
    const priceLabel =
        data.type === "time_based"
            ? "Tarif / Harga"
            : data.type === "service"
              ? "Tarif Jasa"
              : data.type === "rental_item"
                ? "Tarif Sewa"
                : "Harga Jual";

    // Satuan dinamis berdasarkan tipe
    const unitOptionsForType =
        data.type === "time_based"
            ? ["jam", "menit", "hari", "malam", "sesi"]
            : data.type === "service"
              ? ["kunjungan", "sesi", "pcs", "item"]
              : data.type === "rental_item"
                ? ["unit", "pcs", "set", "hari"]
                : UNIT_OPTIONS;

    // Handler perubahan tipe: auto-update track_stock
    const handleTypeChange = (newType) => {
        setData("type", newType);
        if (NO_STOCK_TYPES.includes(newType)) {
            setData("track_stock", false);
        } else {
            setData("track_stock", true);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setData("image", file);
        setData("remove_image", false);
        setImagePreview(URL.createObjectURL(file));
    };

    const handleRemoveImage = () => {
        setImagePreview(null);
        setData("image", null);
        setData("remove_image", true);
    };

    const submit = (e) => {
        e.preventDefault();
        post(route("admin.products.update", product.id), {
            forceFormData: true,
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <Link
                        href={route("admin.products.index")}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                        aria-label="Kembali"
                    >
                        <svg
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.8}
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15.75 19.5L8.25 12l7.5-7.5"
                            />
                        </svg>
                    </Link>
                    <div className="min-w-0">
                        <h2 className="text-lg font-semibold text-slate-800 truncate">
                            Edit Produk
                        </h2>
                        <p className="text-sm text-slate-500 truncate">
                            {product.name}{" "}
                            <span className="text-xs text-slate-400 ml-2">
                                SKU: {product.sku}
                            </span>
                        </p>
                    </div>
                </div>
            }
        >
            <Head title={`Edit: ${product.name}`} />

            <form onSubmit={submit}>
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                    {/* ── Main columns ── */}
                    <div className="space-y-5 lg:col-span-2">
                        {/* SECTION: Informasi Dasar */}
                        <SectionCard
                            title="Informasi Dasar"
                            subtitle="Identitas dan klasifikasi produk"
                        >
                            <div className="space-y-4">
                                <Field
                                    label="Nama Produk"
                                    required
                                    error={errors.name}
                                >
                                    <input
                                        type="text"
                                        value={data.name}
                                        onChange={(e) =>
                                            setData("name", e.target.value)
                                        }
                                        placeholder="Contoh: Kopi Susu Gula Aren"
                                        className={inputCls(!!errors.name)}
                                    />
                                </Field>

                                <div className="grid grid-cols-2 gap-4">
                                    <Field
                                        label="SKU"
                                        required
                                        error={errors.sku}
                                    >
                                        <input
                                            type="text"
                                            value={data.sku}
                                            onChange={(e) =>
                                                setData("sku", e.target.value)
                                            }
                                            placeholder="PRD-001"
                                            className={inputCls(!!errors.sku)}
                                        />
                                    </Field>
                                    {feat.barcode ? (
                                        <Field
                                            label="Barcode"
                                            error={errors.barcode}
                                        >
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={data.barcode}
                                                    onChange={(e) =>
                                                        setData(
                                                            "barcode",
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="EAN-13 (opsional)"
                                                    className={`${inputCls(!!errors.barcode)} flex-1`}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setShowScanner(true)
                                                    }
                                                    className="shrink-0 inline-flex items-center justify-center px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                                                    title="Scan Barcode dari Label"
                                                >
                                                    <svg
                                                        className="w-5 h-5"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                        />
                                                    </svg>
                                                </button>
                                            </div>
                                        </Field>
                                    ) : (
                                        <Field
                                            label="Kode Referensi"
                                            error={errors.barcode}
                                        >
                                            <input
                                                type="text"
                                                value={data.barcode}
                                                onChange={(e) =>
                                                    setData(
                                                        "barcode",
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="Kode internal (opsional)"
                                                className={inputCls(
                                                    !!errors.barcode,
                                                )}
                                            />
                                        </Field>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <Field
                                        label="Tipe Produk"
                                        required
                                        error={errors.type}
                                    >
                                        <select
                                            value={data.type}
                                            onChange={(e) =>
                                                handleTypeChange(e.target.value)
                                            }
                                            className={inputCls(!!errors.type)}
                                        >
                                            {availableTypes.map((typeKey) => (
                                                <option
                                                    key={typeKey}
                                                    value={typeKey}
                                                >
                                                    {productTypes[typeKey] ??
                                                        typeKey}
                                                </option>
                                            ))}
                                        </select>
                                    </Field>
                                    <Field label="Satuan" error={errors.unit}>
                                        <select
                                            value={data.unit}
                                            onChange={(e) =>
                                                setData("unit", e.target.value)
                                            }
                                            className={inputCls(!!errors.unit)}
                                        >
                                            {unitOptionsForType.map((u) => (
                                                <option key={u} value={u}>
                                                    {u}
                                                </option>
                                            ))}
                                        </select>
                                    </Field>
                                </div>
                                {data.type !== "finished_goods" &&
                                    data.type !== "raw_material" && (
                                        <div className="rounded-xl bg-indigo-50 border border-indigo-100 px-3 py-2.5 text-xs text-indigo-700">
                                            {data.type === "service" &&
                                                "✂️ Produk jasa: tidak ada stok fisik, harga adalah tarif layanan"}
                                            {data.type === "rental_item" &&
                                                "🔑 Item rental: stok = jumlah unit yang bisa disewakan"}
                                            {data.type === "time_based" &&
                                                "⏱️ Berbasis waktu: tarif per durasi (jam/malam/sesi)"}
                                            {data.type === "combo" &&
                                                "📦 Combo: gabungan beberapa produk dalam 1 paket"}
                                        </div>
                                    )}

                                <div className="grid grid-cols-2 gap-4">
                                    <Field
                                        label="Kategori"
                                        error={errors.category_id}
                                    >
                                        <select
                                            value={data.category_id}
                                            onChange={(e) =>
                                                setData(
                                                    "category_id",
                                                    e.target.value,
                                                )
                                            }
                                            className={inputCls(
                                                !!errors.category_id,
                                            )}
                                        >
                                            <option value="">
                                                Pilih Kategori
                                            </option>
                                            {categories.map((c) => (
                                                <option key={c.id} value={c.id}>
                                                    {c.name}
                                                </option>
                                            ))}
                                        </select>
                                    </Field>
                                    {feat.supplier && (
                                        <Field
                                            label="Supplier"
                                            error={errors.supplier_id}
                                        >
                                            <select
                                                value={data.supplier_id}
                                                onChange={(e) =>
                                                    setData(
                                                        "supplier_id",
                                                        e.target.value,
                                                    )
                                                }
                                                className={inputCls(
                                                    !!errors.supplier_id,
                                                )}
                                            >
                                                <option value="">
                                                    Pilih Supplier
                                                </option>
                                                {suppliers.map((s) => (
                                                    <option
                                                        key={s.id}
                                                        value={s.id}
                                                    >
                                                        {s.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </Field>
                                    )}
                                </div>
                            </div>
                        </SectionCard>

                        {/* SECTION: Deskripsi */}
                        <SectionCard
                            title="Deskripsi"
                            subtitle="Penjelasan produk/layanan untuk customer"
                        >
                            <Field label="Deskripsi" error={errors.description}>
                                <textarea
                                    value={data.description}
                                    onChange={(e) =>
                                        setData("description", e.target.value)
                                    }
                                    rows={3}
                                    placeholder={
                                        data.type === "service"
                                            ? "Contoh: Potong rambut + keramas + blow dry"
                                            : data.type === "rental_item"
                                              ? "Contoh: Motor matic 125cc, bensin full, helm tersedia"
                                              : data.type === "time_based"
                                                ? "Contoh: Akses internet unlimited, PC gaming spec tinggi"
                                                : data.type === "hospitality"
                                                  ? "Contoh: Kamar AC, 2 kasur single, sarapan termasuk"
                                                  : "Deskripsi produk (opsional)"
                                    }
                                    className={`${inputCls(!!errors.description)} resize-none`}
                                    maxLength={2000}
                                />
                                <p className="mt-1 text-xs text-slate-400">
                                    {(data.description || "").length}/2000
                                    karakter
                                </p>
                            </Field>
                        </SectionCard>

                        {/* SECTION: Harga */}
                        <SectionCard
                            title="Harga"
                            subtitle="Harga beli dan jual produk"
                        >
                            <div
                                className={`grid gap-4 ${feat.costPrice ? "grid-cols-2" : "grid-cols-1 max-w-xs"}`}
                            >
                                <Field
                                    label={priceLabel}
                                    required
                                    error={errors.sell_price}
                                >
                                    <div className="relative">
                                        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-slate-400">
                                            Rp
                                        </span>
                                        <input
                                            type="number"
                                            value={data.sell_price}
                                            onChange={(e) =>
                                                setData(
                                                    "sell_price",
                                                    e.target.value,
                                                )
                                            }
                                            min="0"
                                            placeholder="0"
                                            className={`${inputCls(!!errors.sell_price)} pl-9`}
                                        />
                                    </div>
                                </Field>
                                {feat.costPrice && (
                                    <Field
                                        label="Harga Beli (Modal)"
                                        error={errors.cost_price}
                                    >
                                        <div className="relative">
                                            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-slate-400">
                                                Rp
                                            </span>
                                            <input
                                                type="number"
                                                value={data.cost_price}
                                                onChange={(e) =>
                                                    setData(
                                                        "cost_price",
                                                        e.target.value,
                                                    )
                                                }
                                                min="0"
                                                placeholder="0"
                                                className={`${inputCls(!!errors.cost_price)} pl-9`}
                                            />
                                        </div>
                                    </Field>
                                )}
                            </div>
                            {feat.costPrice &&
                                Number(data.sell_price) > 0 &&
                                Number(data.cost_price) > 0 && (
                                    <div className="mt-3 rounded-xl bg-slate-50 px-4 py-2.5 text-xs text-slate-500">
                                        Margin:{" "}
                                        <strong className="text-slate-700">
                                            Rp{" "}
                                            {(
                                                Number(data.sell_price) -
                                                Number(data.cost_price)
                                            ).toLocaleString("id-ID")}
                                        </strong>
                                        <span className="ml-1">
                                            (
                                            {(
                                                ((Number(data.sell_price) -
                                                    Number(data.cost_price)) /
                                                    Number(data.sell_price)) *
                                                100
                                            ).toFixed(1)}
                                            %)
                                        </span>
                                    </div>
                                )}
                        </SectionCard>

                        {/* SECTION: Detail spesifik per tipe */}
                        {(data.type === "time_based" ||
                            data.type === "rental_item" ||
                            [
                                "ticket",
                                "hospitality",
                                "session",
                                "parking",
                                "rental",
                            ].includes(storeType)) && (
                            <SectionCard
                                title="Detail Spesifik"
                                subtitle="Informasi tambahan sesuai tipe produk"
                            >
                                <div className="space-y-4">
                                    {/* price_per_hour — untuk time_based dan rental */}
                                    {(data.type === "time_based" ||
                                        data.type === "rental_item") && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <Field
                                                label="Tarif Per Jam"
                                                error={errors.price_per_hour}
                                            >
                                                <div className="relative">
                                                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-slate-400">
                                                        Rp
                                                    </span>
                                                    <input
                                                        type="number"
                                                        value={
                                                            data.price_per_hour
                                                        }
                                                        onChange={(e) =>
                                                            setData(
                                                                "price_per_hour",
                                                                e.target.value,
                                                            )
                                                        }
                                                        min="0"
                                                        placeholder="0"
                                                        className={`${inputCls(!!errors.price_per_hour)} pl-9`}
                                                    />
                                                </div>
                                                <p className="mt-1 text-xs text-slate-400">
                                                    Tarif per jam (opsional,
                                                    selain harga dasar)
                                                </p>
                                            </Field>
                                            <Field
                                                label="Durasi Minimum (menit)"
                                                error={
                                                    errors.min_duration_minutes
                                                }
                                            >
                                                <input
                                                    type="number"
                                                    value={
                                                        data.min_duration_minutes
                                                    }
                                                    onChange={(e) =>
                                                        setData(
                                                            "min_duration_minutes",
                                                            e.target.value,
                                                        )
                                                    }
                                                    min="0"
                                                    placeholder="Contoh: 60"
                                                    className={inputCls(
                                                        !!errors.min_duration_minutes,
                                                    )}
                                                />
                                                <p className="mt-1 text-xs text-slate-400">
                                                    Minimal durasi pemakaian
                                                </p>
                                            </Field>
                                        </div>
                                    )}

                                    {/* session_duration_minutes — untuk session/time_based di store session */}
                                    {(storeType === "session" ||
                                        storeType === "parking") &&
                                        data.type === "time_based" && (
                                            <Field
                                                label="Durasi Paket (menit)"
                                                error={
                                                    errors.session_duration_minutes
                                                }
                                            >
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="number"
                                                        value={
                                                            data.session_duration_minutes
                                                        }
                                                        onChange={(e) =>
                                                            setData(
                                                                "session_duration_minutes",
                                                                e.target.value,
                                                            )
                                                        }
                                                        min="0"
                                                        placeholder="60 = 1 jam, 0 = unlimited"
                                                        className={`${inputCls(!!errors.session_duration_minutes)} max-w-xs`}
                                                    />
                                                </div>
                                                <p className="mt-1 text-xs text-slate-400">
                                                    0 = unlimited. Misal: 60 (1
                                                    jam), 120 (2 jam), 180 (3
                                                    jam)
                                                </p>
                                            </Field>
                                        )}

                                    {/* capacity — untuk ticket */}
                                    {storeType === "ticket" && (
                                        <Field
                                            label="Kapasitas (orang/slot)"
                                            error={errors.capacity}
                                        >
                                            <input
                                                type="number"
                                                value={data.capacity}
                                                onChange={(e) =>
                                                    setData(
                                                        "capacity",
                                                        e.target.value,
                                                    )
                                                }
                                                min="1"
                                                placeholder="Contoh: 10"
                                                className={`${inputCls(!!errors.capacity)} max-w-xs`}
                                            />
                                            <p className="mt-1 text-xs text-slate-400">
                                                Berapa orang yang bisa pakai
                                                slot/tiket ini
                                            </p>
                                        </Field>
                                    )}

                                    {/* valid_duration_minutes — untuk ticket */}
                                    {storeType === "ticket" && (
                                        <Field
                                            label="Berlaku (menit)"
                                            error={
                                                errors.valid_duration_minutes
                                            }
                                        >
                                            <input
                                                type="number"
                                                value={
                                                    data.valid_duration_minutes
                                                }
                                                onChange={(e) =>
                                                    setData(
                                                        "valid_duration_minutes",
                                                        e.target.value,
                                                    )
                                                }
                                                min="0"
                                                placeholder="Contoh: 90 = 1,5 jam. Kosongkan jika tidak terbatas"
                                                className={`${inputCls(!!errors.valid_duration_minutes)} max-w-xs`}
                                            />
                                            <p className="mt-1 text-xs text-slate-400">
                                                Tiket berlaku berapa menit
                                                setelah check-in
                                            </p>
                                        </Field>
                                    )}

                                    {/* max_guests — untuk hospitality */}
                                    {storeType === "hospitality" && (
                                        <Field
                                            label="Kapasitas Tamu"
                                            error={errors.max_guests}
                                        >
                                            <input
                                                type="number"
                                                value={data.max_guests}
                                                onChange={(e) =>
                                                    setData(
                                                        "max_guests",
                                                        e.target.value,
                                                    )
                                                }
                                                min="1"
                                                placeholder="Contoh: 2"
                                                className={`${inputCls(!!errors.max_guests)} max-w-xs`}
                                            />
                                            <p className="mt-1 text-xs text-slate-400">
                                                Maksimal tamu yang bisa menginap
                                            </p>
                                        </Field>
                                    )}

                                    {/* deposit_amount — untuk rental */}
                                    {(storeType === "rental" ||
                                        data.type === "rental_item") && (
                                        <Field
                                            label="Deposit"
                                            error={errors.deposit_amount}
                                        >
                                            <div className="relative max-w-xs">
                                                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-slate-400">
                                                    Rp
                                                </span>
                                                <input
                                                    type="number"
                                                    value={data.deposit_amount}
                                                    onChange={(e) =>
                                                        setData(
                                                            "deposit_amount",
                                                            e.target.value,
                                                        )
                                                    }
                                                    min="0"
                                                    placeholder="0"
                                                    className={`${inputCls(!!errors.deposit_amount)} pl-9`}
                                                />
                                            </div>
                                            <p className="mt-1 text-xs text-slate-400">
                                                Deposit yang perlu dibayar
                                                penyewa (dikembalikan saat
                                                return)
                                            </p>
                                        </Field>
                                    )}
                                </div>
                            </SectionCard>
                        )}

                        {/* SECTION: Stok */}
                        {!isNoStock ? (
                            <SectionCard
                                title="Stok"
                                subtitle="Pengaturan stok minimum"
                            >
                                <div className="space-y-3">
                                    <Field
                                        label="Stok Minimum"
                                        error={errors.stock_minimum}
                                    >
                                        <div className="max-w-xs">
                                            <input
                                                type="number"
                                                value={data.stock_minimum}
                                                onChange={(e) =>
                                                    setData(
                                                        "stock_minimum",
                                                        e.target.value,
                                                    )
                                                }
                                                min="0"
                                                placeholder="0"
                                                disabled={!data.track_stock}
                                                className={`${inputCls(!!errors.stock_minimum)} disabled:bg-slate-100 disabled:text-slate-400`}
                                            />
                                        </div>
                                        <p className="mt-1 text-xs text-slate-400">
                                            Peringatan jika stok di bawah angka
                                            ini.
                                        </p>
                                    </Field>
                                    <div className="flex items-start gap-2 rounded-xl bg-indigo-50 px-4 py-3 text-xs text-indigo-700">
                                        <svg
                                            className="mt-0.5 h-4 w-4 flex-shrink-0"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            strokeWidth={1.8}
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
                                            />
                                        </svg>
                                        Untuk menambah atau mengurangi stok,
                                        gunakan fitur{" "}
                                        <strong className="ml-0.5">
                                            Penyesuaian Stok
                                        </strong>{" "}
                                        atau{" "}
                                        <strong className="ml-0.5">
                                            Pembelian
                                        </strong>
                                        .
                                    </div>
                                </div>
                            </SectionCard>
                        ) : (
                            <SectionCard
                                title="Stok"
                                subtitle="Tidak berlaku untuk tipe ini"
                            >
                                <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-sm text-slate-500 flex items-center gap-2">
                                    <span>ℹ️</span>
                                    <span>
                                        {data.type === "service"
                                            ? "Layanan jasa tidak memiliki stok fisik."
                                            : data.type === "time_based"
                                              ? "Produk berbasis waktu tidak memiliki stok."
                                              : "Tipe ini tidak memiliki stok."}
                                    </span>
                                </div>
                            </SectionCard>
                        )}

                        {/* SECTION: Pengaturan Tambahan */}
                        <SectionCard
                            title="Pengaturan Tambahan"
                            subtitle="Opsi lanjutan untuk produk"
                        >
                            <div className="space-y-4">
                                {/* Waktu persiapan — hanya FnB */}
                                {feat.prepTime && (
                                    <Field
                                        label="Waktu Persiapan"
                                        hint="menit"
                                        error={errors.preparation_time}
                                    >
                                        <div className="relative max-w-xs">
                                            <input
                                                type="number"
                                                value={data.preparation_time}
                                                onChange={(e) =>
                                                    setData(
                                                        "preparation_time",
                                                        e.target.value,
                                                    )
                                                }
                                                min="0"
                                                placeholder="Kosongkan jika tidak perlu"
                                                className={inputCls(
                                                    !!errors.preparation_time,
                                                )}
                                            />
                                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-xs text-slate-400">
                                                menit
                                            </span>
                                        </div>
                                    </Field>
                                )}
                                <div className="grid grid-cols-2 gap-3">
                                    {feat.trackStock && !isNoStock && (
                                        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 transition hover:bg-slate-50">
                                            <input
                                                type="checkbox"
                                                checked={!!data.track_stock}
                                                onChange={(e) =>
                                                    setData(
                                                        "track_stock",
                                                        e.target.checked,
                                                    )
                                                }
                                                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <div>
                                                <p className="text-sm font-medium text-slate-700">
                                                    Pantau Stok
                                                </p>
                                                <p className="text-xs text-slate-400">
                                                    Lacak jumlah stok produk ini
                                                </p>
                                            </div>
                                        </label>
                                    )}
                                    {feat.isSellable && (
                                        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 transition hover:bg-slate-50">
                                            <input
                                                type="checkbox"
                                                checked={!!data.is_sellable}
                                                onChange={(e) =>
                                                    setData(
                                                        "is_sellable",
                                                        e.target.checked,
                                                    )
                                                }
                                                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <div>
                                                <p className="text-sm font-medium text-slate-700">
                                                    Bisa Dijual
                                                </p>
                                                <p className="text-xs text-slate-400">
                                                    Nonaktifkan untuk bahan baku
                                                </p>
                                            </div>
                                        </label>
                                    )}
                                    {feat.isComposable && (
                                        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 transition hover:bg-slate-50">
                                            <input
                                                type="checkbox"
                                                checked={!!data.is_composable}
                                                onChange={(e) =>
                                                    setData(
                                                        "is_composable",
                                                        e.target.checked,
                                                    )
                                                }
                                                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <div>
                                                <p className="text-sm font-medium text-slate-700">
                                                    Produk Komposisi
                                                </p>
                                                <p className="text-xs text-slate-400">
                                                    Tersusun dari produk lain
                                                    (combo)
                                                </p>
                                            </div>
                                        </label>
                                    )}
                                    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 transition hover:bg-slate-50">
                                        <input
                                            type="checkbox"
                                            checked={!!data.is_active}
                                            onChange={(e) =>
                                                setData(
                                                    "is_active",
                                                    e.target.checked,
                                                )
                                            }
                                            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <div>
                                            <p className="text-sm font-medium text-slate-700">
                                                Produk Aktif
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                Tampil di kasir & daftar produk
                                            </p>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </SectionCard>
                    </div>

                    {/* ── Sidebar ── */}
                    <div className="space-y-5">
                        {/* Gambar */}
                        <SectionCard
                            title="Gambar Produk"
                            subtitle="JPG, PNG, WEBP. Maks 2MB."
                        >
                            <div className="space-y-3">
                                <div className="aspect-square w-full overflow-hidden rounded-xl border-2 border-dashed border-slate-200 bg-slate-50">
                                    {imagePreview ? (
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full flex-col items-center justify-center p-4">
                                            <svg
                                                className="mb-2 h-10 w-10 text-slate-300"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth={1.5}
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                />
                                            </svg>
                                            <p className="text-xs text-slate-400">
                                                Belum ada gambar
                                            </p>
                                        </div>
                                    )}
                                </div>
                                <label className="block cursor-pointer">
                                    <span className="block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-center text-sm text-slate-600 transition hover:bg-slate-50">
                                        {imagePreview
                                            ? "Ganti Gambar"
                                            : "Pilih Gambar"}
                                    </span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="hidden"
                                    />
                                </label>
                                {imagePreview && (
                                    <button
                                        type="button"
                                        onClick={handleRemoveImage}
                                        className="w-full text-center text-xs text-red-500 hover:text-red-700"
                                    >
                                        Hapus Gambar
                                    </button>
                                )}
                                {errors.image && (
                                    <p className="text-xs text-red-500">
                                        {errors.image}
                                    </p>
                                )}
                            </div>
                        </SectionCard>

                        {/* Ringkasan */}
                        <SectionCard title="Ringkasan">
                            <dl className="space-y-2 text-sm">
                                <SummaryRow
                                    label="Tipe"
                                    value={productTypes[data.type] ?? data.type}
                                />
                                <SummaryRow label="Satuan" value={data.unit} />
                                <SummaryRow
                                    label="Dipantau"
                                    value={data.track_stock ? "Ya" : "Tidak"}
                                    active={data.track_stock}
                                />
                                <SummaryRow
                                    label="Bisa Dijual"
                                    value={data.is_sellable ? "Ya" : "Tidak"}
                                    active={data.is_sellable}
                                />
                                <SummaryRow
                                    label="Status"
                                    value={
                                        data.is_active ? "Aktif" : "Nonaktif"
                                    }
                                    active={data.is_active}
                                />
                            </dl>
                        </SectionCard>

                        {/* Actions */}
                        <div className="flex flex-col gap-2">
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:from-indigo-600 hover:to-violet-700 disabled:opacity-60"
                            >
                                {processing
                                    ? "Menyimpan..."
                                    : "Simpan Perubahan"}
                            </button>
                            <Link
                                href={route("admin.products.index")}
                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                            >
                                Batal
                            </Link>
                        </div>
                    </div>
                </div>
            </form>

            {/* Barcode Scanner Modal */}
            <BarcodeScanner
                isOpen={showScanner}
                onClose={() => setShowScanner(false)}
                onScan={(barcode) => {
                    setData("barcode", barcode);
                    setShowScanner(false);
                }}
            />
        </AuthenticatedLayout>
    );
}

/* ── Reusable components ── */
function SectionCard({ title, subtitle, children }) {
    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-5">
                <h3 className="text-base font-semibold text-slate-900">
                    {title}
                </h3>
                {subtitle && (
                    <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>
                )}
            </div>
            <div className="p-6">{children}</div>
        </div>
    );
}

function Field({ label, required, error, hint, children }) {
    return (
        <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
                {label} {required && <span className="text-red-500">*</span>}
                {hint && (
                    <span className="ml-1 text-xs font-normal text-slate-400">
                        ({hint})
                    </span>
                )}
            </label>
            {children}
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
    );
}

function SummaryRow({ label, value, active }) {
    return (
        <div className="flex justify-between">
            <dt className="text-slate-500">{label}</dt>
            <dd
                className={`font-medium ${active === undefined ? "text-slate-700" : active ? "text-emerald-600" : "text-slate-400"}`}
            >
                {value}
            </dd>
        </div>
    );
}

function inputCls(hasError) {
    return `block w-full rounded-xl border-slate-300 text-sm shadow-sm transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 ${hasError ? "border-red-300 focus:border-red-500 focus:ring-red-200" : ""}`;
}
