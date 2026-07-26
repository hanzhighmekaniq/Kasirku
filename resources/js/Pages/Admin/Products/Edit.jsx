import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader";
import { Head, Link, useForm, usePage } from "@inertiajs/react";
import { useState } from "react";
import BarcodeScanner from "@/Components/BarcodeScanner";
import TreePicker from "@/Components/TreePicker";
import Select from "@/Components/ui/Select";
import Button from "@/Components/ui/Button";
import CurrencyInput from "@/Components/ui/CurrencyInput";
import { ArrowLeft } from "lucide-react";
import {
    BarChart3,
    ClipboardList,
    Clock,
    DollarSign,
    ExternalLink,
    FileText,
    Image,
    Info,
    Package,
    SlidersHorizontal,
    Plus,
    RefreshCw,
    ScanLine,
    Settings,
    Sparkles,
    Wrench,
    X,
} from "lucide-react";

const UNIT_OPTIONS = [
    "pcs",
    "botol",
    "cup",
    "pack",
    "kg",
    "gram",
    "liter",
    "jam",
    "orang",
];

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

const NO_STOCK_TYPES = ["service", "time_based"];

/* Label khusus FnB — hanya untuk tampilan, value form tetap
   finished_goods / raw_material / combo */
const FNB_TYPE_LABELS = {
    finished_goods: "Menu / Makanan",
    raw_material: "Bahan Baku",
    combo: "Paket",
};

const MODIFIER_TYPES = ["finished_goods", "combo"];

const PAGE_TITLE = {
    retail: "Produk",
    fnb: "Menu & Produk",
    service: "Layanan & Produk",
    rental: "Item Sewa",
    ticket: "Tiket & Paket",
    hospitality: "Kamar & Layanan",
    parking: "Tarif Parkir",
    session: "Paket Sesi",
};

export default function Edit({
    product,
    categories,
    suppliers,
    productTypes = {},
    storeType = "retail",
    modifierGroups = [],
    attachedModifierGroupIds = [],
}) {
    const [imagePreview, setImagePreview] = useState(
        product.image ? `/storage/${product.image}` : null,
    );
    const [showScanner, setShowScanner] = useState(false);

    const { storeTypeFeatures = [] } = usePage().props;
    const has = (f) => storeTypeFeatures.includes(f);

    const pageTitle = PAGE_TITLE[storeType] ?? "Produk";
    const isFnb = storeType === "fnb";

    /* Label tipe produk — FnB pakai istilah dapur, lainnya pakai label existing */
    const typeLabel = (t) =>
        (isFnb ? FNB_TYPE_LABELS[t] : null) ?? productTypes[t] ?? t;

    const availableTypes = RELEVANT_TYPES[storeType] ?? ["finished_goods"];
    const feat = {
        barcode: true,
        costPrice: has("purchase"),
        prepTime: has("kitchen"),
        isSellable: true,
        trackStock: has("stock"),
        supplier: has("supplier"),
        multiUnit: ["retail", "fnb", "rental"].includes(storeType),
    };

    const { data, setData, post, processing, errors, transform } = useForm({
        _method: "PATCH",
        name: product.name ?? "",
        sku: product.sku ?? "",
        barcode: product.barcode ?? "",
        type: product.type ?? "finished_goods",
        category_id: product.category_id ?? "",
        supplier_id: product.supplier_id ?? "",
        unit: product.unit ?? "pcs",
        base_unit: product.base_unit ?? "",
        base_unit_conversion: product.base_unit_conversion ?? "",
        sell_price: product.sell_price ?? "",
        cost_price: product.cost_price ?? "",
        stock_minimum: product.stock_minimum ?? 0,
        track_stock: product.track_stock ?? true,
        is_sellable: product.is_sellable ?? true,
        preparation_time: product.preparation_time ?? "",
        is_active: product.is_active ?? true,
        sell_base: product.sell_base ?? true,
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
        packaging_units: (product.packaging_units || [])
            .filter((pu) => !pu.variant_id)
            .map((pu) => ({
                id: pu.id,
                name: pu.name,
                conversion_qty: pu.conversion_qty,
                sell_price: pu.sell_price,
                barcode: pu.barcode ?? "",
            })),
        price_tiers: (product.price_tiers || [])
            .filter((t) => !t.variant_id)
            .map((t) => ({
                id: t.id,
                min_qty: t.min_qty,
                price: t.price,
            })),
        modifier_group_ids: attachedModifierGroupIds ?? [],
    });

    const isNoStock = NO_STOCK_TYPES.includes(data.type);

    /* Gating FnB */
    const showBaseUnit = isFnb && data.type === "raw_material";
    const showModifierSection = isFnb && MODIFIER_TYPES.includes(data.type);

    /* Matriks wajib/opsional bahan baku FnB (lihat Planing/PLANNING_create_fnb.md).
       Attribute `required` di HTML sengaja dibuat mengikuti aturan ini supaya
       validasi native browser dan validasi backend tidak pernah beda pendapat. */
    const isFnbRawMaterial = isFnb && data.type === "raw_material";
    // Bahan baku umumnya tidak dijual langsung — harga jual jadi opsional.
    const requireSellPrice = !isFnbRawMaterial;
    // Harga modal dibutuhkan untuk menghitung HPP resep.
    const requireCostPrice = isFnbRawMaterial;

    const toggleModifierGroup = (id) => {
        setData(
            "modifier_group_ids",
            data.modifier_group_ids.includes(id)
                ? data.modifier_group_ids.filter((x) => x !== id)
                : [...data.modifier_group_ids, id],
        );
    };

    const priceLabel =
        data.type === "time_based"
            ? "Tarif / Harga"
            : data.type === "service"
                ? "Tarif Jasa"
                : data.type === "rental_item"
                    ? "Tarif Sewa"
                    : "Harga Jual";

    const unitOptionsForType =
        data.type === "time_based"
            ? ["jam", "menit", "hari", "malam", "sesi"]
            : data.type === "service"
                ? ["kunjungan", "sesi", "pcs", "item"]
                : data.type === "rental_item"
                    ? ["unit", "pcs", "set", "hari"]
                    : UNIT_OPTIONS;

    const handleTypeChange = (newType) => {
        setData("type", newType);
        if (NO_STOCK_TYPES.includes(newType)) {
            setData("track_stock", false);
        } else {
            setData("track_stock", true);
        }
        /* base_unit hanya relevan untuk bahan baku */
        if (newType !== "raw_material") {
            setData("base_unit", "");
            setData("base_unit_conversion", "");
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

    const marginRp =
        (Number(data.sell_price) || 0) - (Number(data.cost_price) || 0);
    const marginPct =
        Number(data.cost_price) > 0
            ? (marginRp / Number(data.cost_price)) * 100
            : Number(data.sell_price) > 0
                ? 100
                : 0;

    /* Lapis kedua setelah attribute `required`. Kalau validasi native
       ter-bypass (browser lama, atau form disubmit lewat JS), field wajib
       bahan baku FnB tetap ditahan di sini sebelum request dikirim. */
    const blockIfMissingFnbField = () => {
        const missing = [
            isFnbRawMaterial && !String(data.base_unit ?? "").trim()
                ? "base_unit_input"
                : null,
            requireCostPrice && feat.costPrice && !Number(data.cost_price)
                ? "cost_price_input"
                : null,
        ].find(Boolean);

        if (!missing) {
            return false;
        }

        const el = document.getElementById(missing);
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
        el?.reportValidity?.();

        return true;
    };

    const submit = (e) => {
        e.preventDefault();

        if (blockIfMissingFnbField()) {
            return;
        }

        /* Backend hanya menyentuh relasi modifier kalau sync_modifier_groups true.
           Flag ini wajib dikirim setiap kali section Modifier dirender. */
        transform((payload) => ({
            ...payload,
            sync_modifier_groups: showModifierSection,
            modifier_group_ids: showModifierSection
                ? payload.modifier_group_ids
                : [],
        }));
        post(route("admin.products.update", product.id), {
            forceFormData: true,
        });
    };

    return (
        <AuthenticatedLayout

            header={
                <div className="flex items-center gap-3">
                    {/* Tombol Kembali */}
                    <Link
                        href={route("admin.products.index")}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    >
                        <ArrowLeft size={16} />
                    </Link>

                    {/* Judul */}
                    <div className="leading-tight">
                        <div className="text-sm font-semibold text-foreground">
                            Manajemen {pageTitle}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                            Edit
                        </div>
                    </div>
                </div>
            }
        >
            <PageHeader
                title={`Edit: ${product.name}`}
                breadcrumbs={[
                    `Edit ${pageTitle.toLowerCase()}`,
                    typeLabel(data.type),
                    ...(product.sku ? [`SKU: ${product.sku}`] : [])
                ]}
                heading={
                    <>
                        Perbarui{" "}
                        <span className="bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
                            {product.name}
                        </span>
                    </>
                }
                description="Ubah identitas, harga, kemasan, stok, dan pengaturan. Ringkasan di kanan mengikuti perubahan yang kamu buat."

            />

            <form id="productForm" onSubmit={submit}>
                <div className="grid grid-cols-1 gap-6 pb-16 lg:grid-cols-12">
                    {/* ── Main columns ── */}
                    <div className="space-y-6 lg:col-span-8">
                        {/* SECTION: Informasi Dasar */}
                        <SectionCard
                            step={1}
                            title="Informasi Dasar"
                            subtitle="Identitas produk yang akan tampil di kasir & katalog"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                                <div className="md:col-span-4">
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
                                            placeholder="cth. Kopi Susu Gula Aren 250ml"
                                            className={inputCls(!!errors.name)}
                                            required
                                        />
                                    </Field>
                                </div>
                                <div className="md:col-span-2">
                                    <Field
                                        label="Tipe Produk"
                                        required
                                        error={errors.type}
                                    >
                                        <Select
                                            options={availableTypes.map((t) => ({
                                                value: t,
                                                label: typeLabel(t),
                                            }))}
                                            value={data.type}
                                            onChange={handleTypeChange}
                                            error={errors.type}
                                        />
                                    </Field>
                                </div>

                                <div className="md:col-span-3">
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
                                            placeholder="cth. KPS-GA-250"
                                            className={inputCls(!!errors.sku)}
                                            required
                                        />
                                    </Field>
                                </div>
                                <div className="md:col-span-3">
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
                                                placeholder="cth. 8991234567890"
                                                className={`${inputCls(!!errors.barcode)} flex-1`}
                                            />
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setShowScanner(true)
                                                }
                                                className="shrink-0 inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2.5 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90"
                                            >
                                                <ScanLine className="h-4 w-4" />
                                                Scan
                                            </button>
                                        </div>
                                    </Field>
                                </div>

                                <div className="md:col-span-2">
                                    <Field
                                        label="Satuan Dasar"
                                        required
                                        error={errors.unit}
                                    >
                                        <Select
                                            options={unitOptionsForType.map(
                                                (u) => ({
                                                    value: u,
                                                    label: u,
                                                }),
                                            )}
                                            value={data.unit}
                                            onChange={(v) =>
                                                setData("unit", v)
                                            }
                                            error={errors.unit}
                                        />
                                    </Field>
                                </div>
                                <div className="md:col-span-2">
                                    <Field
                                        label="Kategori"
                                        hint="opsional"
                                        error={errors.category_id}
                                    >
                                        <TreePicker
                                            categories={categories}
                                            value={data.category_id}
                                            onChange={(v) =>
                                                setData("category_id", v)
                                            }
                                            onClear={() =>
                                                setData("category_id", "")
                                            }
                                            placeholder="Pilih kategori…"
                                        />
                                    </Field>
                                </div>
                                <div className="md:col-span-2">
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
                                </div>
                            </div>

                            {/* SATUAN PAKAI — bahan baku FnB */}
                            {showBaseUnit && (
                                <div className="mt-5 rounded-xl border border-warning/20 bg-warning/5 p-4">
                                    <div className="mb-3 flex items-center gap-2">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning/10">
                                            <Package className="h-4 w-4 text-warning" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-semibold text-foreground">
                                                Satuan Pakai di Resep
                                            </div>
                                            <div className="text-[11px] text-muted-foreground">
                                                Satuan beli ({data.unit || "?"}) dikonversi ke
                                                satuan terkecil saat dipakai di resep
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Field
                                            label="Satuan Pakai"
                                            required
                                            hint="cth. gram, ml, butir"
                                            error={errors.base_unit}
                                        >
                                            <input
                                                id="base_unit_input"
                                                type="text"
                                                value={data.base_unit}
                                                onChange={(e) =>
                                                    setData("base_unit", e.target.value)
                                                }
                                                placeholder="cth. gram"
                                                required
                                                className={inputCls(!!errors.base_unit)}
                                            />
                                        </Field>
                                        <Field
                                            label="Konversi"
                                            hint="1 satuan beli = berapa satuan pakai"
                                            error={errors.base_unit_conversion}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="shrink-0 text-sm text-muted-foreground">
                                                    1 {data.unit || "?"} =
                                                </span>
                                                <input
                                                    type="number"
                                                    step="any"
                                                    min="0"
                                                    value={data.base_unit_conversion}
                                                    onChange={(e) =>
                                                        setData(
                                                            "base_unit_conversion",
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="1000"
                                                    className={`${inputCls(!!errors.base_unit_conversion)} flex-1`}
                                                />
                                                <span className="shrink-0 text-sm text-muted-foreground">
                                                    {data.base_unit || "?"}
                                                </span>
                                            </div>
                                        </Field>
                                    </div>
                                </div>
                            )}

                            {/* Deskripsi */}
                            <div className="mt-5">
                                <Field
                                    label="Deskripsi"
                                    hint="opsional"
                                    error={errors.description}
                                >
                                    <textarea
                                        value={data.description}
                                        onChange={(e) =>
                                            setData(
                                                "description",
                                                e.target.value,
                                            )
                                        }
                                        maxLength={2000}
                                        rows={3}
                                        placeholder="Tulis deskripsi singkat produk (opsional)…"
                                        className={`${inputCls(!!errors.description)} resize-y`}
                                    />
                                    <div className="flex justify-end mt-1 text-[11px] text-muted-foreground">
                                        {(data.description || "").length}/2000
                                    </div>
                                </Field>
                            </div>
                        </SectionCard>

                        {/* SECTION: Harga */}
                        <SectionCard
                            step={2}
                            title="Harga"
                            subtitle="Atur harga jual, modal, grosir bertingkat, dan kemasan"
                        >
                            {product.is_variant && (
                                <div className="mb-4 flex items-center justify-between rounded-xl border border-primary/10 bg-primary/5 p-4">
                                    <div>
                                        <p className="text-sm font-semibold text-foreground">Jual Produk Dasar</p>
                                        <p className="text-[11px] text-muted-foreground mt-0.5">
                                            Aktifkan jika produk dasar juga dijual di kasir bersama variant.
                                            Nonaktifkan jika hanya variant yang dijual (cth: Kaos Size X, XL, XXL).
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setData("sell_base", !data.sell_base)}
                                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${data.sell_base ? "bg-primary" : "bg-muted"}`}
                                    >
                                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-card shadow ring-0 transition duration-200 ${data.sell_base ? "translate-x-5" : "translate-x-0"}`} />
                                    </button>
                                </div>
                            )}
                            <div className="space-y-5">
                                <div
                                    className={`grid gap-4 ${feat.costPrice ? "grid-cols-1 md:grid-cols-3" : "grid-cols-1 md:grid-cols-2"}`}
                                >
                                    <Field
                                        label={priceLabel}
                                        required={requireSellPrice}
                                        error={errors.sell_price}
                                    >
                                        <CurrencyInput
                                            value={data.sell_price}
                                            onChange={(v) =>
                                                setData("sell_price", v)
                                            }
                                            error={!!errors.sell_price}
                                            required={requireSellPrice}
                                        />
                                    </Field>
                                    {feat.costPrice && (
                                        <Field
                                            label="Harga Beli / Modal"
                                            required={requireCostPrice}
                                            error={errors.cost_price}
                                        >
                                            <CurrencyInput
                                                id="cost_price_input"
                                                value={data.cost_price}
                                                onChange={(v) =>
                                                    setData("cost_price", v)
                                                }
                                                error={!!errors.cost_price}
                                                required={requireCostPrice}
                                            />
                                        </Field>
                                    )}
                                    {feat.costPrice && (
                                        <Field label="Margin">
                                            <div className="flex gap-2">
                                                <div
                                                    className={`flex-1 rounded-xl border px-3 py-2.5 ${marginRp < 0 ? "border-destructive/20 bg-destructive/5" : "border-success/20 bg-success/10"}`}
                                                >
                                                    <div
                                                        className={`text-[10px] font-semibold uppercase tracking-wider ${marginRp < 0 ? "text-destructive" : "text-success"}`}
                                                    >
                                                        Rupiah
                                                    </div>
                                                    <div
                                                        className={`text-sm font-bold tracking-tight ${marginRp < 0 ? "text-destructive" : "text-success"}`}
                                                    >
                                                        Rp{" "}
                                                        {marginRp.toLocaleString(
                                                            "id-ID",
                                                        )}
                                                    </div>
                                                </div>
                                                <div
                                                    className={`flex-1 rounded-xl border px-3 py-2.5 ${marginRp < 0 ? "border-destructive/20 bg-destructive/5" : "border-success/20 bg-success/10"}`}
                                                >
                                                    <div
                                                        className={`text-[10px] font-semibold uppercase tracking-wider ${marginRp < 0 ? "text-destructive" : "text-success"}`}
                                                    >
                                                        Persen
                                                    </div>
                                                    <div
                                                        className={`text-sm font-bold tracking-tight ${marginRp < 0 ? "text-destructive" : "text-success"}`}
                                                    >
                                                        {marginPct.toFixed(1)}
                                                        %
                                                    </div>
                                                </div>
                                            </div>
                                        </Field>
                                    )}
                                </div>

                                {/* MULTI SATUAN */}
                                {feat.multiUnit && (
                                    <div className="rounded-xl border border-warning/20 bg-warning/5 p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning/10">
                                                    <Package className="h-4 w-4 text-warning" />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-semibold text-foreground">
                                                        Multi Satuan (Kemasan)
                                                    </div>
                                                    <div className="text-[11px] text-muted-foreground">
                                                        cth. Dus berisi 12{" "}
                                                        {data.unit}
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setData(
                                                        "packaging_units",
                                                        [
                                                            ...data.packaging_units,
                                                            {
                                                                name: "",
                                                                conversion_qty:
                                                                    "",
                                                                sell_price: "",
                                                                barcode: "",
                                                            },
                                                        ],
                                                    )
                                                }
                                                className="inline-flex items-center gap-1.5 rounded-xl bg-primary/10 px-3 py-2 text-xs font-semibold text-primary transition hover:bg-primary/10"
                                            >
                                                <Plus className="h-4 w-4" />
                                                Tambah kemasan
                                            </button>
                                        </div>
                                        <div className="space-y-2">
                                            {data.packaging_units.map(
                                                (pu, i) => (
                                                    <div
                                                        key={i}
                                                        className="grid grid-cols-12 gap-2 items-center rounded-xl bg-card p-2.5 border border-warning/10"
                                                    >
                                                        <div className="col-span-12 sm:col-span-3">
                                                            <input
                                                                type="text"
                                                                value={
                                                                    pu.name
                                                                }
                                                                onChange={(
                                                                    e,
                                                                ) => {
                                                                    const updated =
                                                                        [
                                                                            ...data.packaging_units,
                                                                        ];
                                                                    updated[
                                                                        i
                                                                    ].name =
                                                                        e.target.value;
                                                                    setData(
                                                                        "packaging_units",
                                                                        updated,
                                                                    );
                                                                }}
                                                                placeholder="Nama (Dus, Box…)"
                                                                className="block w-full rounded-lg border border-border px-3 py-2 text-xs"
                                                            />
                                                        </div>
                                                        <div className="col-span-6 sm:col-span-2">
                                                            <div className="relative">
                                                                <input
                                                                    type="number"
                                                                    value={
                                                                        pu.conversion_qty
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) => {
                                                                        const updated =
                                                                            [
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
                                                                    placeholder="12"
                                                                    className="block w-full rounded-lg border border-border px-3 py-2 pr-8 text-xs"
                                                                />
                                                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                                                                    {
                                                                        data.unit
                                                                    }
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="col-span-6 sm:col-span-3">
                                                            <div className="relative">
                                                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                                                                    Rp
                                                                </span>
                                                                <input
                                                                    type="number"
                                                                    value={
                                                                        pu.sell_price
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) => {
                                                                        const updated =
                                                                            [
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
                                                                    placeholder="Harga"
                                                                    className="block w-full rounded-lg border border-border py-2 pl-7 pr-3 text-xs"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="col-span-10 sm:col-span-3">
                                                            <input
                                                                type="text"
                                                                value={
                                                                    pu.barcode
                                                                }
                                                                onChange={(
                                                                    e,
                                                                ) => {
                                                                    const updated =
                                                                        [
                                                                            ...data.packaging_units,
                                                                        ];
                                                                    updated[
                                                                        i
                                                                    ].barcode =
                                                                        e.target.value;
                                                                    setData(
                                                                        "packaging_units",
                                                                        updated,
                                                                    );
                                                                }}
                                                                placeholder="Barcode (opsional)"
                                                                className="block w-full rounded-lg border border-border px-3 py-2 text-xs"
                                                            />
                                                        </div>
                                                        <div className="col-span-2 sm:col-span-1 flex items-center justify-end">
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setData(
                                                                        "packaging_units",
                                                                        data.packaging_units.filter(
                                                                            (
                                                                                _,
                                                                                j,
                                                                            ) =>
                                                                                j !==
                                                                                i,
                                                                        ),
                                                                    )
                                                                }
                                                                className="rounded-lg p-1.5 text-destructive transition hover:bg-destructive/10"
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                        {pu.conversion_qty >
                                                            0 &&
                                                            pu.sell_price >
                                                            0 && (
                                                                <div className="col-span-12 text-[11px] text-muted-foreground pl-1">
                                                                    ≈{" "}
                                                                    <span className="font-semibold text-success">
                                                                        Rp{" "}
                                                                        {Math.round(
                                                                            pu.sell_price /
                                                                            pu.conversion_qty,
                                                                        ).toLocaleString(
                                                                            "id-ID",
                                                                        )}{" "}
                                                                        /{" "}
                                                                        {
                                                                            data.unit
                                                                        }
                                                                    </span>
                                                                </div>
                                                            )}
                                                    </div>
                                                ),
                                            )}
                                            {data.packaging_units.length ===
                                                0 && (
                                                    <p className="text-xs text-muted-foreground italic text-center py-4">
                                                        Belum ada kemasan
                                                        tambahan.
                                                    </p>
                                                )}
                                        </div>
                                    </div>
                                )}

                                {/* GROSIR TIERS */}
                                <div className="rounded-xl border border-border bg-card/50 p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                                                <BarChart3 className="h-4 w-4 text-primary" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-semibold text-foreground">
                                                    Harga Grosir Bertingkat
                                                </div>
                                                <div className="text-[11px] text-muted-foreground">
                                                    Maks 5 tier · beli lebih
                                                    banyak, harga lebih murah
                                                </div>
                                            </div>
                                        </div>
                                        {data.price_tiers.length < 5 && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setData("price_tiers", [
                                                        ...data.price_tiers,
                                                        {
                                                            min_qty: "",
                                                            price: "",
                                                        },
                                                    ])
                                                }
                                                className="inline-flex items-center gap-1.5 rounded-xl bg-primary/10 px-3 py-2 text-xs font-semibold text-primary transition hover:bg-primary/10"
                                            >
                                                <Plus className="h-4 w-4" />
                                                Tambah tier
                                            </button>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        {data.price_tiers.map(
                                            (tier, i) => (
                                                <div
                                                    key={i}
                                                    className="grid grid-cols-12 gap-2 items-center rounded-xl bg-card p-2.5 border border-border"
                                                >
                                                    <div className="col-span-2 flex items-center justify-center">
                                                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary border border-primary/10">
                                                            Tier {i + 1}
                                                        </span>
                                                    </div>
                                                    <div className="col-span-5 sm:col-span-4">
                                                        <label className="text-[10px] font-semibold text-muted-foreground">
                                                            Min. Qty
                                                        </label>
                                                        <div className="relative">
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                value={
                                                                    tier.min_qty
                                                                }
                                                                onChange={(
                                                                    e,
                                                                ) => {
                                                                    const updated =
                                                                        [
                                                                            ...data.price_tiers,
                                                                        ];
                                                                    updated[
                                                                        i
                                                                    ].min_qty =
                                                                        Number(
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        );
                                                                    setData(
                                                                        "price_tiers",
                                                                        updated,
                                                                    );
                                                                }}
                                                                placeholder="0"
                                                                className="block w-full rounded-lg border border-border px-3 py-2 pr-10 text-xs"
                                                            />
                                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                                                                {data.unit}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="col-span-4 sm:col-span-5">
                                                        <label className="text-[10px] font-semibold text-muted-foreground">
                                                            Harga per Unit
                                                        </label>
                                                        <div className="relative">
                                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                                                                Rp
                                                            </span>
                                                            <input
                                                                type="number"
                                                                value={
                                                                    tier.price
                                                                }
                                                                onChange={(
                                                                    e,
                                                                ) => {
                                                                    const updated =
                                                                        [
                                                                            ...data.price_tiers,
                                                                        ];
                                                                    updated[
                                                                        i
                                                                    ].price =
                                                                        e.target.value;
                                                                    setData(
                                                                        "price_tiers",
                                                                        updated,
                                                                    );
                                                                }}
                                                                placeholder="0"
                                                                className="block w-full rounded-lg border border-border py-2 pl-7 pr-3 text-xs"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="col-span-1 flex items-end justify-end">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setData(
                                                                    "price_tiers",
                                                                    data.price_tiers.filter(
                                                                        (
                                                                            _,
                                                                            j,
                                                                        ) =>
                                                                            j !==
                                                                            i,
                                                                    ),
                                                                )
                                                            }
                                                            className="rounded-lg p-1.5 text-destructive transition hover:bg-destructive/10"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ),
                                        )}
                                        {data.price_tiers.length === 0 && (
                                            <p className="text-xs text-muted-foreground italic text-center py-4">
                                                Belum ada tier grosir.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </SectionCard>

                        {/* SECTION: Stok & Pengaturan */}
                        <SectionCard
                            step={3}
                            title="Stok & Pengaturan"
                            subtitle="Kelola inventori dan opsi operasional produk"
                        >
                            {/* WAKTU SAJI — gate: fitur kitchen */}
                            {feat.prepTime && (
                                <div className="mb-5 rounded-xl border border-primary/20 bg-primary/5 p-4">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                                                <Clock className="h-4 w-4 text-primary" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-semibold text-foreground">
                                                    Waktu Saji (menit)
                                                </div>
                                                <div className="text-[11px] text-muted-foreground">
                                                    Estimasi waktu persiapan menu ini di dapur
                                                </div>
                                            </div>
                                        </div>
                                        <div className="sm:w-44">
                                            <div className="relative">
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
                                                    placeholder="0"
                                                    className={`${inputCls(!!errors.preparation_time)} pr-16`}
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                                                    menit
                                                </span>
                                            </div>
                                            {errors.preparation_time && (
                                                <p className="mt-1 text-xs text-destructive">
                                                    {errors.preparation_time}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div
                                className={`grid grid-cols-1 md:grid-cols-2 gap-4 mb-5 ${isNoStock ? "opacity-50 pointer-events-none" : ""}`}
                            >
                                <Field
                                    label="Stok Minimum"
                                    error={errors.stock_minimum}
                                >
                                    <div className="relative">
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
                                            disabled={isNoStock}
                                            className={`${inputCls(!!errors.stock_minimum)} pr-16`}
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                                            {data.unit}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground mt-1">
                                        Kasir akan diingatkan ketika stok
                                        mencapai angka ini.
                                    </p>
                                </Field>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {feat.trackStock && !isNoStock && (
                                    <SettingToggle
                                        label="Pantau Stok"
                                        description="Kurangi stok otomatis setiap penjualan"
                                        checked={data.track_stock}
                                        onChange={(v) =>
                                            setData("track_stock", v)
                                        }
                                    />
                                )}
                                <SettingToggle
                                    label="Bisa Dijual"
                                    description="Tampilkan produk di layar kasir"
                                    checked={data.is_sellable}
                                    onChange={(v) =>
                                        setData("is_sellable", v)
                                    }
                                />
                                {/* Toggle "Produk Komposisi" dihapus: is_composable
                                    sekarang dikelola otomatis oleh backend
                                    (Product::syncIsComposable) berdasarkan ada
                                    tidaknya resep. */}
                                <SettingToggle
                                    label="Produk Aktif"
                                    description="Nonaktifkan untuk menyembunyikan sementara"
                                    checked={data.is_active}
                                    onChange={(v) =>
                                        setData("is_active", v)
                                    }
                                />
                            </div>
                        </SectionCard>

                        {/* SECTION: Detail Spesifik */}
                        {(data.type === "time_based" ||
                            data.type === "rental_item") && (
                                <SectionCard
                                    step={4}
                                    title="Detail Spesifik Tipe Produk"
                                    subtitle="Field ini muncul menyesuaikan tipe produk yang kamu pilih"
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {(data.type === "time_based" ||
                                            data.type === "rental_item") && (
                                                <>
                                                    <Field
                                                        label="Tarif Per Jam"
                                                        error={errors.price_per_hour}
                                                    >
                                                        <div className="relative">
                                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
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
                                                    </Field>
                                                    <Field
                                                        label="Durasi Minimum"
                                                        error={
                                                            errors.min_duration_minutes
                                                        }
                                                    >
                                                        <div className="relative">
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
                                                                placeholder="0"
                                                                className={`${inputCls(!!errors.min_duration_minutes)} pr-16`}
                                                            />
                                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                                                                menit
                                                            </span>
                                                        </div>
                                                    </Field>
                                                </>
                                            )}
                                        {(storeType === "session" ||
                                            storeType === "parking") &&
                                            data.type === "time_based" && (
                                                <Field
                                                    label="Durasi Paket"
                                                    error={
                                                        errors.session_duration_minutes
                                                    }
                                                >
                                                    <div className="relative">
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
                                                            placeholder="60"
                                                            className={`${inputCls(!!errors.session_duration_minutes)} pr-16`}
                                                        />
                                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                                                            menit
                                                        </span>
                                                    </div>
                                                </Field>
                                            )}
                                        {["ticket", "hospitality"].includes(
                                            storeType,
                                        ) && (
                                                <Field
                                                    label="Kapasitas"
                                                    error={errors.capacity}
                                                >
                                                    <div className="relative">
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
                                                            placeholder="0"
                                                            className={`${inputCls(!!errors.capacity)} pr-16`}
                                                        />
                                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                                                            orang
                                                        </span>
                                                    </div>
                                                </Field>
                                            )}
                                        {storeType === "ticket" && (
                                            <Field
                                                label="Berlaku Selama"
                                                error={
                                                    errors.valid_duration_minutes
                                                }
                                            >
                                                <div className="relative">
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
                                                        placeholder="0"
                                                        className={`${inputCls(!!errors.valid_duration_minutes)} pr-16`}
                                                    />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                                                        menit
                                                    </span>
                                                </div>
                                            </Field>
                                        )}
                                        {storeType === "hospitality" && (
                                            <Field
                                                label="Kapasitas Tamu"
                                                error={errors.max_guests}
                                            >
                                                <div className="relative">
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
                                                        placeholder="0"
                                                        className={`${inputCls(!!errors.max_guests)} pr-16`}
                                                    />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                                                        orang
                                                    </span>
                                                </div>
                                            </Field>
                                        )}
                                        {(storeType === "rental" ||
                                            data.type === "rental_item") && (
                                                <Field
                                                    label="Jumlah Deposit"
                                                    error={errors.deposit_amount}
                                                >
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
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
                                                </Field>
                                            )}
                                    </div>
                                </SectionCard>
                            )}

                        {/* SECTION: Modifier / Topping — FnB, menu & paket saja */}
                        {showModifierSection && (
                            <SectionCard
                                step={4}
                                title="Modifier / Topping"
                                subtitle="Pilihan tambahan untuk menu ini (level gula, ukuran, topping, dll)"
                                accent="violet"
                                headerRight={
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-semibold text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
                                        <SlidersHorizontal className="h-3.5 w-3.5" />
                                        {data.modifier_group_ids.length} dipilih
                                    </span>
                                }
                            >
                                {modifierGroups.length === 0 ? (
                                    <p className="py-4 text-center text-xs italic text-muted-foreground">
                                        Belum ada modifier group di toko ini.
                                    </p>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {modifierGroups.map((mg) => (
                                            <CheckboxTile
                                                key={mg.id}
                                                checked={data.modifier_group_ids.includes(
                                                    mg.id,
                                                )}
                                                onChange={() =>
                                                    toggleModifierGroup(mg.id)
                                                }
                                                label={mg.name}
                                                description={`${mg.modifiers_count ?? 0} pilihan · ${mg.is_required ? "Wajib" : "Opsional"}`}
                                            />
                                        ))}
                                    </div>
                                )}
                                {errors.modifier_group_ids && (
                                    <p className="mt-2 text-xs text-destructive">
                                        {errors.modifier_group_ids}
                                    </p>
                                )}
                            </SectionCard>
                        )}
                    </div>

                    {/* ── Sidebar (sticky) ── */}
                    <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-20 self-start">
                        {/* Gambar */}
                        <SectionCard title="Gambar Produk" accent="violet">
                            <div className="space-y-3">
                                <div
                                    className="group relative aspect-square w-full overflow-hidden rounded-xl border-2 border-dashed border-border bg-gradient-to-br from-primary/5 to-primary/[0.03] transition hover:border-primary/40 hover:bg-primary/5 cursor-pointer"
                                    onClick={() =>
                                        document
                                            .getElementById("imageInput")
                                            .click()
                                    }
                                >
                                    {imagePreview ? (
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="aspect-square h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full flex-col items-center justify-center p-6">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary shadow-lg shadow-primary/20 mb-2">
                                                <Image
                                                    className="h-6 w-6 text-white"
                                                    strokeWidth={1.5}
                                                />
                                            </div>
                                            <p className="text-sm font-semibold text-foreground">
                                                Drag & drop gambar
                                            </p>
                                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                                atau klik untuk pilih file ·
                                                PNG, JPG (maks 2MB)
                                            </p>
                                        </div>
                                    )}
                                </div>
                                <input
                                    id="imageInput"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="hidden"
                                />
                                {imagePreview && (
                                    <button
                                        type="button"
                                        onClick={handleRemoveImage}
                                        className="w-full text-center text-xs font-medium text-destructive transition hover:text-destructive"
                                    >
                                        Hapus Gambar
                                    </button>
                                )}
                                {errors.image && (
                                    <p className="text-xs text-destructive">
                                        {errors.image}
                                    </p>
                                )}
                            </div>
                        </SectionCard>

                        {/* Ringkasan */}
                        <SectionCard
                            title="Ringkasan Konfigurasi"
                            accent="emerald"
                        >
                            <dl className="space-y-3 text-sm">
                                <SummaryRow
                                    label="Nama"
                                    value={data.name || product.name || "—"}
                                />
                                <SummaryRow
                                    label="Tipe"
                                    value={typeLabel(data.type)}
                                />
                                <SummaryRow
                                    label="Satuan Dasar"
                                    value={data.unit}
                                />
                                {showBaseUnit && (
                                    <SummaryRow
                                        label="Satuan Pakai"
                                        value={
                                            data.base_unit
                                                ? `1 ${data.unit} = ${data.base_unit_conversion || "?"} ${data.base_unit}`
                                                : "—"
                                        }
                                    />
                                )}
                                {feat.multiUnit && (
                                    <SummaryRow
                                        label="Kemasan Tambahan"
                                        value={`${data.packaging_units.length} kemasan`}
                                    />
                                )}
                                {showModifierSection && (
                                    <SummaryRow
                                        label="Modifier"
                                        value={`${data.modifier_group_ids.length} grup`}
                                    />
                                )}
                            </dl>
                            <div className="mt-3 flex flex-wrap gap-1.5 border-t border-dashed border-border pt-3">
                                {feat.trackStock && !isNoStock && (
                                    <SummaryChip
                                        active={data.track_stock}
                                        label="Dipantau"
                                    />
                                )}
                                <SummaryChip
                                    active={data.is_sellable}
                                    label="Bisa dijual"
                                />
                                <SummaryChip
                                    active={data.is_active}
                                    label="Aktif"
                                />
                            </div>
                        </SectionCard>

                        {/* Actions — desktop only */}
                        <div className="hidden lg:flex flex-col gap-2.5">
                            <Button
                                type="submit"
                                form="productForm"
                                loading={processing}
                                className="w-full"
                            >
                                Simpan Perubahan
                            </Button>
                            <Link
                                href={route("admin.products.index")}
                                className="w-full rounded-xl border border-border bg-card px-5 py-3 text-center text-sm font-medium text-muted-foreground shadow-sm transition hover:bg-muted hover:text-foreground"
                            >
                                Batal
                            </Link>
                        </div>
                    </aside>
                </div>
            </form>

            {/* Floating Action Buttons — mobile/tablet only */}
            <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 lg:hidden">
                <Link
                    href={route("admin.products.index")}
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-card text-muted-foreground shadow-lg ring-1 ring-border transition hover:bg-destructive/10 hover:text-destructive hover:ring-destructive/20"
                    title="Batal"
                >
                    <X className="h-5 w-5" strokeWidth={2} />
                </Link>
                <button
                    type="submit"
                    form="productForm"
                    disabled={processing}
                    className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary text-white shadow-xl shadow-primary/40 transition hover:shadow-2xl hover:shadow-primary/50 disabled:opacity-60"
                    title="Simpan Perubahan"
                >
                    {processing ? (
                        <svg
                            className="h-6 w-6 animate-spin"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            />
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                            />
                        </svg>
                    ) : (
                        <svg
                            className="h-6 w-6"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2.5}
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                            />
                        </svg>
                    )}
                </button>
            </div>

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
    step,
    title,
    subtitle,
    accent = "indigo",
    headerRight,
    children,
}) {
    const accents = {
        indigo: "from-primary/5 to-primary/3",
        violet: "from-primary/5 to-primary/3",
        emerald: "from-success/5 to-success/3",
        amber: "from-warning/5 to-warning/3",
    };

    return (
        <section className="rounded-2xl border border-border bg-card shadow-sm">
            <div
                className={`flex items-start justify-between gap-3 border-b border-border bg-gradient-to-r ${accents[accent] ?? accents.indigo} px-5 py-4 sm:px-6 rounded-t-2xl`}
            >
                <div className="flex items-start gap-3">
                    {step && (
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-primary/10 bg-gradient-to-br from-primary/10 to-primary/5 text-sm font-bold text-primary">
                            {String(step).padStart(2, "0")}
                        </span>
                    )}
                    <div className="min-w-0">
                        <h3 className="text-base font-semibold text-foreground tracking-tight">
                            {title}
                        </h3>
                        {subtitle && (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                {subtitle}
                            </p>
                        )}
                    </div>
                </div>
                {headerRight}
            </div>
            <div className="p-5 sm:p-6">{children}</div>
        </section>
    );
}

function ToggleSwitch({ checked, onChange, disabled = false }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ${checked
                    ? "bg-gradient-to-r from-primary to-primary"
                    : "bg-muted"
                } ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
        >
            <span
                className={`inline-block h-5 w-5 transform rounded-full bg-card shadow transition duration-200 ${checked ? "translate-x-5" : "translate-x-0.5"
                    }`}
            />
        </button>
    );
}

function SettingToggle({
    label,
    description,
    checked,
    onChange,
    show = true,
}) {
    if (!show) return null;
    return (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3.5 transition hover:border-primary/20 cursor-pointer">
            <div>
                <p className="text-sm font-semibold text-foreground">{label}</p>
                <p className="text-[11px] text-muted-foreground">{description}</p>
            </div>
            <ToggleSwitch checked={checked} onChange={onChange} />
        </div>
    );
}

function CheckboxTile({ checked, onChange, label, description }) {
    return (
        <label
            className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition ${checked
                    ? "border-violet-300 bg-violet-100/50 dark:border-violet-700 dark:bg-violet-900/20"
                    : "border-border bg-card hover:border-primary/20"
                }`}
        >
            <input
                type="checkbox"
                checked={checked}
                onChange={onChange}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-border text-primary focus:ring-primary/30"
            />
            <span className="min-w-0">
                <span className="block text-sm font-semibold text-foreground">
                    {label}
                </span>
                <span className="block text-[11px] text-muted-foreground">
                    {description}
                </span>
            </span>
        </label>
    );
}

function SummaryChip({ label, active, show = true }) {
    if (!show) return null;
    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${active
                    ? "border border-success/10 bg-success/10 text-success"
                    : "border border-border bg-muted text-muted-foreground"
                }`}
        >
            <span
                className={`h-1.5 w-1.5 rounded-full ${active ? "bg-success" : "bg-muted"}`}
            />
            {label}
        </span>
    );
}

function Field({ label, required, error, hint, children }) {
    return (
        <div>
            <label className="mb-1.5 block text-[0.8rem] font-semibold tracking-wide text-muted-foreground">
                {label} {required && <span className="text-destructive">*</span>}
                {hint && (
                    <span className="ml-1 text-[11px] font-normal text-muted-foreground">
                        ({hint})
                    </span>
                )}
            </label>
            {children}
            {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
        </div>
    );
}

function SummaryRow({ label, value }) {
    return (
        <div className="flex items-start justify-between gap-3">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="text-xs font-semibold text-foreground text-right max-w-[65%] truncate">
                {value}
            </dd>
        </div>
    );
}

function inputCls(hasError) {
    return `block w-full rounded-xl border border-border bg-card py-2.5 px-3.5 text-sm transition outline-none focus:border-ring focus:ring-4 focus:ring-ring/10 ${hasError ? "border-destructive focus:border-destructive focus:ring-destructive/20" : ""
        }`;
}
