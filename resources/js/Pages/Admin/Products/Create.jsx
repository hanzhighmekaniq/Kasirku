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

const TOGGLE_OPTIONS = [
    {
        key: "track_stock",
        label: "Pantau Stok",
        desc: "Lacak jumlah stok produk ini",
    },
    {
        key: "is_sellable",
        label: "Bisa Dijual",
        desc: "Nonaktifkan untuk bahan baku",
    },
    {
        key: "is_composable",
        label: "Produk Komposisi",
        desc: "Tersusun dari produk lain (combo)",
    },
    {
        key: "is_active",
        label: "Produk Aktif",
        desc: "Tampil di kasir & daftar produk",
    },
];

export default function Create({ categories, suppliers }) {
    const [imagePreview, setImagePreview] = useState(null);
    const [showScanner, setShowScanner] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        name: "",
        sku: "",
        barcode: "",
        type: "finished_goods",
        category_id: "",
        supplier_id: "",
        unit: "pcs",
        sell_price: "",
        cost_price: "",
        initial_stock: "",
        stock_minimum: "",
        track_stock: true,
        is_sellable: true,
        is_composable: false,
        preparation_time: "",
        is_active: true,
        image: null,
    });

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
                                                setData("type", e.target.value)
                                            }
                                            className={inputCls(!!errors.type)}
                                        >
                                            <option value="finished_goods">
                                                Barang Jadi
                                            </option>
                                            <option value="raw_material">
                                                Bahan Baku
                                            </option>
                                            <option value="combo">
                                                Combo / Paket
                                            </option>
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
                                            {UNIT_OPTIONS.map((u) => (
                                                <option key={u} value={u}>
                                                    {u}
                                                </option>
                                            ))}
                                        </select>
                                    </Field>
                                </div>

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
                                                <option key={s.id} value={s.id}>
                                                    {s.name}
                                                </option>
                                            ))}
                                        </select>
                                    </Field>
                                </div>
                            </div>
                        </SectionCard>

                        {/* SECTION: Harga */}
                        <SectionCard
                            title="Harga"
                            subtitle="Harga beli dan jual produk"
                        >
                            <div className="grid grid-cols-2 gap-4">
                                <Field
                                    label="Harga Jual"
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
                            </div>
                            {Number(data.sell_price) > 0 &&
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

                        {/* SECTION: Stok */}
                        <SectionCard
                            title="Stok"
                            subtitle="Pengaturan stok awal dan minimum"
                        >
                            <div className="grid grid-cols-2 gap-4">
                                <Field
                                    label="Stok Awal"
                                    error={errors.initial_stock}
                                >
                                    <input
                                        type="number"
                                        value={data.initial_stock}
                                        onChange={(e) =>
                                            setData(
                                                "initial_stock",
                                                e.target.value,
                                            )
                                        }
                                        min="0"
                                        placeholder="0"
                                        disabled={!data.track_stock}
                                        className={`${inputCls(!!errors.initial_stock)} disabled:bg-slate-100 disabled:text-slate-400`}
                                    />
                                    <p className="mt-1 text-xs text-slate-400">
                                        Jumlah stok saat produk pertama dibuat.
                                    </p>
                                </Field>
                                <Field
                                    label="Stok Minimum"
                                    error={errors.stock_minimum}
                                >
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
                                    <p className="mt-1 text-xs text-slate-400">
                                        Peringatan jika stok di bawah angka ini.
                                    </p>
                                </Field>
                            </div>
                        </SectionCard>

                        {/* SECTION: Pengaturan Tambahan */}
                        <SectionCard
                            title="Pengaturan Tambahan"
                            subtitle="Opsi lanjutan untuk produk"
                        >
                            <div className="space-y-4">
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
                                <div className="grid grid-cols-2 gap-3">
                                    {TOGGLE_OPTIONS.map(
                                        ({ key, label, desc }) => (
                                            <label
                                                key={key}
                                                className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 transition hover:bg-slate-50"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={data[key]}
                                                    onChange={(e) =>
                                                        setData(
                                                            key,
                                                            e.target.checked,
                                                        )
                                                    }
                                                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                />
                                                <div>
                                                    <p className="text-sm font-medium text-slate-700">
                                                        {label}
                                                    </p>
                                                    <p className="text-xs text-slate-400">
                                                        {desc}
                                                    </p>
                                                </div>
                                            </label>
                                        ),
                                    )}
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
                                        onClick={() => {
                                            setImagePreview(null);
                                            setData("image", null);
                                        }}
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
                                    value={
                                        {
                                            finished_goods: "Barang Jadi",
                                            raw_material: "Bahan Baku",
                                            combo: "Combo",
                                        }[data.type]
                                    }
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
                                {processing ? "Menyimpan..." : "Simpan Produk"}
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
