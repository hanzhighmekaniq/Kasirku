import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, useForm, usePage } from "@inertiajs/react";
import { useState } from "react";
import BarcodeScanner from "@/Components/BarcodeScanner";
import TreePicker from "@/Components/TreePicker";
import Select from "@/Components/ui/Select";
import {
    BarChart3,
    ChevronLeft,
    ClipboardList,
    DollarSign,
    ExternalLink,
    FileText,
    Image,
    Package,
    Plus,
    ScanLine,
    Settings,
    Wrench,
    X,
} from "lucide-react";
import CurrencyInput from "@/Components/ui/CurrencyInput";

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

const DEFAULT_TYPE = {
    retail: "finished_goods",
    fnb: "finished_goods",
    service: "service",
    rental: "rental_item",
    ticket: "time_based",
    hospitality: "time_based",
    parking: "time_based",
    session: "time_based",
};

// Tipe yang tidak punya stok fisik
const NO_STOCK_TYPES = ["service", "time_based"];

export default function Create({
    categories,
    suppliers,
    productTypes = {},
    storeType = "retail",
    generatedSku = "",
}) {
    const [imagePreview, setImagePreview] = useState(null);
    const [showScanner, setShowScanner] = useState(false);

    const { storeTypeFeatures = [] } = usePage().props;
    const has = (f) => storeTypeFeatures.includes(f);

    const availableTypes = RELEVANT_TYPES[storeType] ?? ["finished_goods"];
    const defaultType = DEFAULT_TYPE[storeType] ?? "finished_goods";
    const feat = {
        barcode: true, // selalu tampilkan barcode
        costPrice: has("purchase"), // retail, fnb, rental
        prepTime: has("kitchen"), // fnb
        isComposable: has("recipe"), // fnb
        isSellable: true, // selalu tampilkan is_sellable
        trackStock: has("stock"), // retail, fnb, rental
        supplier: has("supplier"), // retail, fnb, rental
        multiUnit: ["retail", "fnb", "rental"].includes(storeType),
    };

    const { data, setData, post, processing, errors } = useForm({
        name: "",
        sku: generatedSku,
        barcode: "",
        type: defaultType,
        category_id: "",
        supplier_id: "",
        unit: "pcs",
        sell_price: "",
        cost_price: "",
        stock_minimum: "",
        track_stock: !NO_STOCK_TYPES.includes(defaultType),
        is_sellable: true,
        is_composable: false,
        preparation_time: "",
        is_active: true,
        image: null,
        description: "",
        price_per_hour: "",
        min_duration_minutes: "",
        capacity: "",
        max_guests: "",
        valid_duration_minutes: "",
        session_duration_minutes: "",
        deposit_amount: "",
        packaging_units: [],
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
        setImagePreview(URL.createObjectURL(file));
    };

    const submit = (e) => {
        e.preventDefault();
        post(route("admin.products.store"), { forceFormData: true });
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
                        <ChevronLeft className="h-5 w-5" strokeWidth={1.8} />
                    </Link>
                    <h2 className="text-lg font-semibold text-slate-800">
                        Tambah Produk
                    </h2>
                </div>
            }
        >
            <Head title="Tambah Produk" />

            <form onSubmit={submit}>
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                    {/* ── Main columns ── */}
                    <div className="space-y-5 lg:col-span-2">
                        {/* SECTION: Informasi Dasar */}
                        <SectionCard
                            title="Informasi Dasar"
                            subtitle="Identitas dan klasifikasi produk"
                            icon={ClipboardList}
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

                                <div className={`grid gap-4 grid-cols-2`}>
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
                                            hint="opsional"
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
                                                    <ScanLine className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </Field>
                                    ) : (
                                        <Field
                                            label="Kode Referensi"
                                            hint="opsional"
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
                                    <Select
                                        label="Tipe Produk"
                                        options={availableTypes.map((t) => ({
                                            value: t,
                                            label: productTypes[t] ?? t,
                                        }))}
                                        value={data.type}
                                        onChange={handleTypeChange}
                                        error={errors.type}
                                    />
                                    <Select
                                        label="Satuan"
                                        options={unitOptionsForType.map(
                                            (u) => ({
                                                value: u,
                                                label: u,
                                            }),
                                        )}
                                        value={data.unit}
                                        onChange={(v) => setData("unit", v)}
                                        error={errors.unit}
                                    />
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

                                <Field
                                    label="Kategori"
                                    hint="opsional"
                                    error={errors.category_id}
                                >
                                    <div className="flex items-start gap-2">
                                        <div className="flex-1">
                                            <TreePicker
                                                categories={categories}
                                                value={data.category_id}
                                                onChange={(v) =>
                                                    setData("category_id", v)
                                                }
                                                onClear={() =>
                                                    setData("category_id", "")
                                                }
                                                placeholder="Kategori produk..."
                                            />
                                        </div>
                                        <Link
                                            href={route("admin.categories.index")}
                                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition hover:border-indigo-300 hover:text-indigo-600"
                                            title="Kelola Kategori"
                                        >
                                            <ExternalLink className="h-4 w-4" strokeWidth={2} />
                                        </Link>
                                    </div>
                                </Field>

                                {feat.supplier && (
                                    <Field
                                        label="Supplier"
                                        hint="opsional"
                                        error={errors.supplier_id}
                                    >
                                        <Select
                                            options={(suppliers ?? []).map(
                                                (s) => ({
                                                    value: s.id,
                                                    label: s.name,
                                                }),
                                            )}
                                            value={data.supplier_id}
                                            onChange={(v) =>
                                                setData("supplier_id", v)
                                            }
                                            placeholder="Pilih supplier..."
                                            error={errors.supplier_id}
                                        />
                                    </Field>
                                )}
                            </div>
                        </SectionCard>

                        {/* SECTION: Deskripsi */}
                        <SectionCard
                            title="Deskripsi"
                            subtitle="Penjelasan produk/layanan untuk customer"
                            icon={FileText}
                            accent="violet"
                        >
                            <Field
                                label="Deskripsi"
                                hint="opsional"
                                error={errors.description}
                            >
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
                            icon={DollarSign}
                            accent="emerald"
                        >
                            <div
                                className={`grid gap-4 ${feat.costPrice ? "grid-cols-2" : "grid-cols-1 max-w-xs"}`}
                            >
                                <Field
                                    label={priceLabel}
                                    required
                                    error={errors.sell_price}
                                >
                                    <CurrencyInput
                                        value={data.sell_price}
                                        onChange={(v) =>
                                            setData("sell_price", v)
                                        }
                                        error={!!errors.sell_price}
                                    />
                                </Field>
                                {feat.costPrice && (
                                    <Field
                                        label="Harga Beli (Modal)"
                                        hint="Harga pokok awal. Akan diperbarui otomatis setiap pembelian dari supplier."
                                        error={errors.cost_price}
                                    >
                                        <CurrencyInput
                                            value={data.cost_price}
                                            onChange={(v) =>
                                                setData("cost_price", v)
                                            }
                                            error={!!errors.cost_price}
                                        />
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

                        {/* SECTION: Multi-Satuan — hanya retail, fnb, rental */}
                        {feat.multiUnit && (
                        <SectionCard
                            title="Multi-Satuan"
                            subtitle="Kemasan grosir seperti dus, box, karton"
                            icon={Package}
                            accent="amber"
                        >
                            <div className="space-y-3">
                                {data.packaging_units.map((pu, i) => (
                                    <div
                                        key={i}
                                        className="relative rounded-xl border border-slate-200 bg-slate-50/50 p-4"
                                    >
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setData(
                                                    "packaging_units",
                                                    data.packaging_units.filter(
                                                        (_, j) => j !== i,
                                                    ),
                                                )
                                            }
                                            className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                                            title="Hapus satuan"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>

                                        <div className="grid grid-cols-2 gap-3">
                                            <Field label="Nama Satuan" required>
                                                <input
                                                    type="text"
                                                    value={pu.name}
                                                    onChange={(e) => {
                                                        const updated = [
                                                            ...data.packaging_units,
                                                        ];
                                                        updated[i].name =
                                                            e.target.value;
                                                        setData(
                                                            "packaging_units",
                                                            updated,
                                                        );
                                                    }}
                                                    placeholder="cth. Dus, Box"
                                                    className={inputCls(false)}
                                                />
                                            </Field>
                                            <Field
                                                label={`1 ${pu.name || "..."} = ? ${data.unit}`}
                                                required
                                            >
                                                <input
                                                    type="number"
                                                    value={pu.conversion_qty}
                                                    onChange={(e) => {
                                                        const updated = [
                                                            ...data.packaging_units,
                                                        ];
                                                        updated[
                                                            i
                                                        ].conversion_qty =
                                                            e.target.value;
                                                        setData(
                                                            "packaging_units",
                                                            updated,
                                                        );
                                                    }}
                                                    min="1"
                                                    placeholder={`Isi per ${pu.name || "satuan"}`}
                                                    className={inputCls(false)}
                                                />
                                            </Field>
                                        </div>
                                        <div className="mt-3 grid grid-cols-2 gap-3">
                                            <Field
                                                label={`Harga per ${pu.name || "Satuan"}`}
                                            >
                                                <div className="relative">
                                                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-slate-400">
                                                        Rp
                                                    </span>
                                                    <input
                                                        type="number"
                                                        value={pu.sell_price}
                                                        onChange={(e) => {
                                                            const updated = [
                                                                ...data.packaging_units,
                                                            ];
                                                            updated[
                                                                i
                                                            ].sell_price =
                                                                e.target.value;
                                                            setData(
                                                                "packaging_units",
                                                                updated,
                                                            );
                                                        }}
                                                        min="0"
                                                        placeholder="0"
                                                        className={`${inputCls(false)} pl-9`}
                                                    />
                                                </div>
                                                {pu.conversion_qty > 0 &&
                                                    pu.sell_price > 0 && (
                                                        <p className="mt-1 text-[11px] text-slate-400">
                                                            ≈ Rp{" "}
                                                            {(
                                                                pu.sell_price /
                                                                pu.conversion_qty
                                                            ).toLocaleString(
                                                                "id-ID",
                                                            )}{" "}
                                                            / {data.unit}
                                                        </p>
                                                    )}
                                            </Field>
                                            <Field label="Barcode (opsional)">
                                                <input
                                                    type="text"
                                                    value={pu.barcode}
                                                    onChange={(e) => {
                                                        const updated = [
                                                            ...data.packaging_units,
                                                        ];
                                                        updated[i].barcode =
                                                            e.target.value;
                                                        setData(
                                                            "packaging_units",
                                                            updated,
                                                        );
                                                    }}
                                                    placeholder="Barcode kemasan"
                                                    className={inputCls(false)}
                                                />
                                            </Field>
                                        </div>
                                    </div>
                                ))}

                                <button
                                    type="button"
                                    onClick={() =>
                                        setData("packaging_units", [
                                            ...data.packaging_units,
                                            {
                                                name: "",
                                                conversion_qty: "",
                                                sell_price: "",
                                                barcode: "",
                                            },
                                        ])
                                    }
                                    className="flex w-full items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-slate-300 py-2.5 text-sm font-medium text-slate-500 transition hover:border-indigo-400 hover:text-indigo-600"
                                >
                                    <Plus className="h-4 w-4" />
                                    Tambah Satuan
                                </button>

                                {data.packaging_units.length === 0 && (
                                    <p className="text-center text-xs text-slate-400">
                                        Tambahkan kemasan grosir seperti dus,
                                        box, atau karton.
                                        <br />
                                        Contoh: 1 Dus = 12 Pcs dengan harga &
                                        barcode sendiri.
                                    </p>
                                )}
                            </div>
                        </SectionCard>
                        )}

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
                                icon={Wrench}
                                accent="amber"
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

                                    {/* capacity — untuk ticket & hospitality */}
                                    {["ticket", "hospitality"].includes(
                                        storeType,
                                    ) && (
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
                                subtitle="Peringatan jika stok menipis"
                                icon={Package}
                            >
                                <Field
                                    label="Stok Minimum"
                                    hint="peringatan stok rendah"
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
                                            placeholder="Contoh: 10"
                                            disabled={!data.track_stock}
                                            className={`${inputCls(!!errors.stock_minimum)} disabled:bg-slate-100 disabled:text-slate-400`}
                                        />
                                    </div>
                                    <p className="mt-1 text-xs text-slate-400">
                                        Sistem akan memberi notifikasi jika stok
                                        di bawah angka ini.
                                    </p>
                                </Field>
                            </SectionCard>
                        ) : (
                            <SectionCard
                                title="Stok"
                                subtitle="Tidak berlaku untuk tipe ini"
                                icon={Package}
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
                            icon={Settings}
                            accent="violet"
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
                                    {/* Pantau Stok — hanya store yang punya stok fisik */}
                                    {feat.trackStock && !isNoStock && (
                                        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 transition hover:bg-slate-50">
                                            <input
                                                type="checkbox"
                                                checked={data.track_stock}
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
                                    {/* Bisa Dijual — hanya untuk non-retail (raw_material dll) */}
                                    {feat.isSellable &&
                                        data.type !== "finished_goods" && (
                                            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 transition hover:bg-slate-50">
                                                <input
                                                    type="checkbox"
                                                    checked={data.is_sellable}
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
                                                        Nonaktifkan untuk bahan
                                                        baku
                                                    </p>
                                                </div>
                                            </label>
                                        )}
                                    {/* Produk Komposisi — hanya FnB */}
                                    {feat.isComposable && (
                                        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 transition hover:bg-slate-50">
                                            <input
                                                type="checkbox"
                                                checked={data.is_composable}
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
                                    {/* Produk Aktif — selalu tampil */}
                                    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 transition hover:bg-slate-50">
                                        <input
                                            type="checkbox"
                                            checked={data.is_active}
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

                    {/* ── Sidebar (sticky) ── */}
                    <div className="space-y-5 self-start lg:sticky lg:top-16">
                        {/* Gambar */}
                        <SectionCard
                            title="Gambar Produk"
                            subtitle="JPG, PNG, WEBP. Maks 2MB."
                            icon={Image}
                            accent="violet"
                        >
                            <div className="space-y-3">
                                <div className="group relative aspect-square w-full overflow-hidden rounded-2xl border-2 border-dashed border-slate-300 bg-gradient-to-br from-slate-50 to-indigo-50/30 transition hover:border-indigo-400 hover:from-indigo-50/20 hover:to-violet-50/20">
                                    {imagePreview ? (
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="aspect-square h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full flex-col items-center justify-center p-4">
                                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
                                                <Image
                                                    className="h-6 w-6 text-indigo-400"
                                                    strokeWidth={1.5}
                                                />
                                            </div>
                                            <p className="mt-3 text-xs font-medium text-slate-500">
                                                Klik untuk upload
                                            </p>
                                            <p className="mt-0.5 text-[10px] text-slate-400">
                                                JPG, PNG, WEBP
                                            </p>
                                        </div>
                                    )}
                                </div>
                                <label className="block cursor-pointer">
                                    <span className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-center text-sm font-medium text-slate-600 shadow-sm transition hover:border-indigo-300 hover:text-indigo-600">
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
                                        onClick={() => {
                                            setImagePreview(null);
                                            setData("image", null);
                                        }}
                                        className="w-full text-center text-xs font-medium text-red-500 transition hover:text-red-700"
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
                        <SectionCard
                            title="Ringkasan"
                            icon={BarChart3}
                            accent="emerald"
                        >
                            <dl className="space-y-2 text-sm">
                                <SummaryRow
                                    label="Tipe"
                                    value={productTypes[data.type] ?? data.type}
                                />
                                <SummaryRow label="Satuan" value={data.unit} />
                                {data.packaging_units.length > 0 && (
                                    <SummaryRow
                                        label="Multi-Satuan"
                                        value={`${data.packaging_units.length} kemasan`}
                                    />
                                )}
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
                        <div className="flex flex-col gap-2.5">
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:from-indigo-600 hover:to-violet-700 hover:shadow-indigo-500/40 disabled:opacity-60"
                            >
                                {processing ? "Menyimpan..." : "Simpan Produk"}
                            </button>
                            <Link
                                href={route("admin.products.index")}
                                className="w-full rounded-xl border border-slate-200 bg-white px-5 py-3 text-center text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-800"
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
function SectionCard({
    title,
    subtitle,
    icon: Icon,
    accent = "indigo",
    children,
}) {
    const accents = {
        indigo: "border-l-indigo-500 bg-indigo-50/30",
        violet: "border-l-violet-500 bg-violet-50/30",
        emerald: "border-l-emerald-500 bg-emerald-50/30",
        amber: "border-l-amber-500 bg-amber-50/30",
    };
    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
            <div
                className={`border-b border-slate-100 bg-gradient-to-r ${accents[accent] ?? accents.indigo} px-5 py-4`}
            >
                <div className="flex items-center gap-2.5">
                    {Icon && (
                        <Icon
                            className="h-5 w-5 text-slate-500"
                            strokeWidth={1.7}
                        />
                    )}
                    <div>
                        <h3 className="text-sm font-semibold text-slate-800">
                            {title}
                        </h3>
                        {subtitle && (
                            <p className="mt-0.5 text-xs text-slate-500">
                                {subtitle}
                            </p>
                        )}
                    </div>
                </div>
            </div>
            <div className="p-5">{children}</div>
        </div>
    );
}

function Field({ label, required, error, hint, children }) {
    return (
        <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                {label} {required && <span className="text-red-400">*</span>}
                {hint && (
                    <span className="ml-1 text-[10px] font-normal normal-case tracking-normal text-slate-400">
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
        <div className="flex items-center justify-between py-1.5">
            <dt className="text-xs text-slate-500">{label}</dt>
            <dd
                className={`text-xs font-semibold ${active === undefined ? "text-slate-700" : active ? "text-emerald-600" : "text-slate-400"}`}
            >
                {value}
            </dd>
        </div>
    );
}

function inputCls(hasError) {
    return `block w-full rounded-xl border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm shadow-sm transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 ${hasError ? "border-red-300 focus:border-red-500 focus:ring-red-200" : ""}`;
}
