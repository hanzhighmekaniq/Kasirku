import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router, useForm, usePage } from "@inertiajs/react";
import { useState } from "react";
import {
    CheckCircle,
    ChevronLeft,
    Info,
    Plus,
    Trash2,
    Utensils,
} from "lucide-react";
import Button from "@/Components/ui/Button";

const fmt = (n) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(n ?? 0);
const fmtNum = (n, d = 4) =>
    Number(n)
        .toFixed(d)
        .replace(/\.?0+$/, "");

const UNIT_OPTS = [
    "gram",
    "ml",
    "pcs",
    "kg",
    "liter",
    "sdm",
    "sdt",
    "sachet",
    "lembar",
    "buah",
];

function inputCls(err) {
    return `block w-full rounded-xl border text-sm shadow-sm transition focus:ring-2 ${
        err
            ? "border-destructive focus:border-destructive focus:ring-destructive/20"
            : "border-border focus:border-ring focus:ring-ring/20"
    }`;
}

/* ── Ingredient row ── */
function IngredientRow({ recipe, onDelete, deleting }) {
    const isLowStock =
        recipe.raw_material?.track_stock &&
        (recipe.raw_material?.stocks_sum_quantity ?? 0) <= 0;

    return (
        <div
            className={`flex items-center gap-3 rounded-xl border p-3.5 transition ${isLowStock ? "border-destructive/20 bg-destructive/10/50" : "border-border bg-card"}`}
        >
            {/* Avatar */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warning/10">
                <Utensils
                    className="h-5 w-5 text-warning"
                    strokeWidth={1.7}
                />
            </div>

            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-foreground">
                        {recipe.raw_material?.name ?? "—"}
                    </p>
                    <span className="text-xs text-muted-foreground">
                        {recipe.raw_material?.sku}
                    </span>
                    {recipe.is_nullable && (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                            Opsional
                        </span>
                    )}
                    {isLowStock && (
                        <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                            Stok Habis
                        </span>
                    )}
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-3 text-sm">
                    <span className="font-semibold text-primary">
                        {fmtNum(recipe.quantity)} {recipe.unit}
                    </span>
                    <span className="text-muted-foreground">
                        HPP:{" "}
                        {fmt(
                            Number(recipe.quantity) *
                                Number(recipe.raw_material?.cost_price ?? 0),
                        )}
                    </span>
                    {recipe.notes && (
                        <span className="italic text-muted-foreground">
                            "{recipe.notes}"
                        </span>
                    )}
                </div>
            </div>

            <button
                type="button"
                disabled={deleting === recipe.id}
                onClick={() => onDelete(recipe)}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                title="Hapus bahan"
            >
                <Trash2 className="h-4 w-4" strokeWidth={1.7} />
            </button>
        </div>
    );
}

export default function Recipes({ product, recipes, rawMaterials }) {
    const { flash } = usePage().props;
    const [deleting, setDeleting] = useState(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        raw_material_id: "",
        quantity: "",
        unit: "gram",
        is_nullable: false,
        notes: "",
    });

    // Auto-fill unit from selected raw material's base_unit
    const handleMaterialChange = (id) => {
        setData((d) => {
            const mat = rawMaterials.find((m) => m.id === Number(id));
            return {
                ...d,
                raw_material_id: id,
                unit: mat?.base_unit ?? d.unit,
            };
        });
    };

    const submit = (e) => {
        e.preventDefault();
        post(route("admin.products.recipes.store", product.id), {
            onSuccess: () => reset("raw_material_id", "quantity", "notes"),
        });
    };

    const handleDelete = (recipe) => {
        if (!confirm(`Hapus bahan "${recipe.raw_material?.name}" dari resep?`))
            return;
        setDeleting(recipe.id);
        router.delete(
            route("admin.products.recipes.destroy", [product.id, recipe.id]),
            {
                preserveScroll: true,
                onFinish: () => setDeleting(null),
            },
        );
    };

    // HPP total resep per 1 produk
    const totalHPP = recipes.reduce(
        (sum, r) =>
            sum + Number(r.quantity) * Number(r.raw_material?.cost_price ?? 0),
        0,
    );
    const margin =
        product.sell_price > 0
            ? (
                  ((product.sell_price - totalHPP) / product.sell_price) *
                  100
              ).toFixed(1)
            : 0;

    // Bahan yang belum ada di resep
    const usedIds = new Set(recipes.map((r) => r.raw_material_id));
    const availableMaterials = rawMaterials.filter((m) => !usedIds.has(m.id));

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <Link
                        href={route("admin.products.show", product.id)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted"
                        aria-label="Kembali"
                    >
                        <ChevronLeft className="h-5 w-5" strokeWidth={1.8} />
                    </Link>
                    <div className="min-w-0">
                        <h2 className="text-lg font-semibold text-foreground truncate">
                            Resep — {product.name}
                        </h2>
                        <p className="text-xs text-muted-foreground">
                            SKU: {product.sku}
                        </p>
                    </div>
                </div>
            }
        >
            <Head title={`Resep — ${product.name}`} />

            {/* Flash */}
            {flash?.success && (
                <div className="mb-5 flex items-center gap-3 rounded-2xl border border-success/20 bg-success/10 px-4 py-3 text-sm text-success">
                    <CheckCircle
                        className="h-5 w-5 shrink-0"
                        strokeWidth={1.8}
                    />
                    {flash.success}
                </div>
            )}

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                {/* ── Kiri: Daftar bahan ── */}
                <div className="space-y-4 lg:col-span-2">
                    {/* HPP summary */}
                    {recipes.length > 0 && (
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                {
                                    label: "HPP Resep",
                                    value: fmt(totalHPP),
                                    color: "text-foreground",
                                },
                                {
                                    label: "Harga Jual",
                                    value: fmt(product.sell_price),
                                    color: "text-primary",
                                },
                                {
                                    label: "Margin",
                                    value: `${margin}%`,
                                    color:
                                        Number(margin) >= 30
                                            ? "text-success"
                                            : Number(margin) >= 10
                                              ? "text-warning"
                                              : "text-destructive",
                                },
                            ].map((s) => (
                                <div
                                    key={s.label}
                                    className="rounded-2xl border border-border bg-card p-4 shadow-sm text-center"
                                >
                                    <p className="text-xs text-muted-foreground">
                                        {s.label}
                                    </p>
                                    <p
                                        className={`mt-0.5 text-lg font-bold ${s.color}`}
                                    >
                                        {s.value}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* List */}
                    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                        <div className="border-b border-border bg-muted/50 px-6 py-4">
                            <h3 className="text-sm font-semibold text-foreground">
                                Daftar Bahan Baku
                            </h3>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                {recipes.length === 0
                                    ? "Belum ada bahan. Tambahkan bahan di panel kanan."
                                    : `${recipes.length} bahan — setiap kali "${product.name}" terjual, stok bahan ini yang berkurang.`}
                            </p>
                        </div>

                        {recipes.length === 0 ? (
                            <div className="flex flex-col items-center py-14 text-center">
                                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-warning/5">
                                    <Utensils
                                        className="h-8 w-8 text-warning"
                                        strokeWidth={1.5}
                                    />
                                </div>
                                <p className="mt-3 text-sm font-medium text-muted-foreground">
                                    Resep kosong
                                </p>
                                <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                                    Tambahkan bahan baku. Saat produk ini dijual
                                    di kasir, stok bahan akan berkurang
                                    otomatis.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2 p-4">
                                {recipes.map((r) => (
                                    <IngredientRow
                                        key={r.id}
                                        recipe={r}
                                        onDelete={handleDelete}
                                        deleting={deleting}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Info box */}
                    <div className="flex items-start gap-3 rounded-2xl border border-primary/10 bg-primary/10 px-4 py-3">
                        <Info
                            className="mt-0.5 h-5 w-5 shrink-0 text-primary-400"
                            strokeWidth={1.8}
                        />
                        <p className="text-xs text-primary">
                            <strong>Snapshot otomatis.</strong> Saat produk
                            terjual, resep saat itu di-snapshot ke data
                            transaksi. Perubahan resep di masa depan tidak akan
                            mempengaruhi riwayat transaksi lama.
                        </p>
                    </div>
                </div>

                {/* ── Kanan: Form tambah bahan ── */}
                <div>
                    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                        <div className="border-b border-border bg-muted/50 px-6 py-4">
                            <h3 className="text-sm font-semibold text-foreground">
                                Tambah Bahan
                            </h3>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                Pilih bahan baku dan isi takarannya per 1 porsi.
                            </p>
                        </div>
                        <form onSubmit={submit} className="space-y-4 p-5">
                            {/* Bahan baku */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-foreground">
                                    Bahan Baku{" "}
                                    <span className="text-destructive">*</span>
                                </label>
                                <select
                                    value={data.raw_material_id}
                                    onChange={(e) =>
                                        handleMaterialChange(e.target.value)
                                    }
                                    className={inputCls(
                                        !!errors.raw_material_id,
                                    )}
                                >
                                    <option value="">— Pilih Bahan —</option>
                                    {availableMaterials.map((m) => (
                                        <option key={m.id} value={m.id}>
                                            {m.name} ({m.sku}) —{" "}
                                            {fmt(m.cost_price)}/{m.base_unit}
                                        </option>
                                    ))}
                                </select>
                                {availableMaterials.length === 0 && (
                                    <p className="mt-1.5 text-xs text-warning">
                                        Semua bahan sudah ditambahkan, atau
                                        belum ada produk bertipe{" "}
                                        <strong>Bahan Baku</strong>.
                                    </p>
                                )}
                                {errors.raw_material_id && (
                                    <p className="mt-1 text-xs text-destructive">
                                        {errors.raw_material_id}
                                    </p>
                                )}
                            </div>

                            {/* Jumlah + satuan */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                                        Jumlah{" "}
                                        <span className="text-destructive">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        step="0.001"
                                        min="0.001"
                                        value={data.quantity}
                                        onChange={(e) =>
                                            setData("quantity", e.target.value)
                                        }
                                        placeholder="cth. 200"
                                        className={inputCls(!!errors.quantity)}
                                    />
                                    {errors.quantity && (
                                        <p className="mt-1 text-xs text-destructive">
                                            {errors.quantity}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                                        Satuan{" "}
                                        <span className="text-destructive">*</span>
                                    </label>
                                    <select
                                        value={data.unit}
                                        onChange={(e) =>
                                            setData("unit", e.target.value)
                                        }
                                        className={inputCls(!!errors.unit)}
                                    >
                                        {UNIT_OPTS.map((u) => (
                                            <option key={u} value={u}>
                                                {u}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Preview HPP bahan ini */}
                            {data.raw_material_id && data.quantity && (
                                <div className="rounded-xl bg-warning/5 px-3 py-2 text-xs text-warning">
                                    HPP bahan ini:{" "}
                                    <strong>
                                        {fmt(
                                            Number(data.quantity) *
                                                Number(
                                                    rawMaterials.find(
                                                        (m) =>
                                                            m.id ===
                                                            Number(
                                                                data.raw_material_id,
                                                            ),
                                                    )?.cost_price ?? 0,
                                                ),
                                        )}
                                    </strong>
                                </div>
                            )}

                            {/* Opsional toggle */}
                            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border p-3 hover:bg-muted transition">
                                <input
                                    type="checkbox"
                                    checked={data.is_nullable}
                                    onChange={(e) =>
                                        setData("is_nullable", e.target.checked)
                                    }
                                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                                />
                                <div>
                                    <p className="text-sm font-medium text-foreground">
                                        Bahan Opsional
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Bahan ini boleh tidak ada, transaksi
                                        tetap jalan
                                    </p>
                                </div>
                            </label>

                            {/* Catatan */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-foreground">
                                    Catatan
                                </label>
                                <input
                                    type="text"
                                    value={data.notes}
                                    onChange={(e) =>
                                        setData("notes", e.target.value)
                                    }
                                    placeholder="cth. kopi robusta kualitas premium"
                                    className={inputCls(false)}
                                />
                            </div>

                            <Button
                                type="submit"
                                loading={processing}
                                className="w-full"
                            >
                                Tambah ke Resep
                            </Button>
                        </form>
                    </div>

                    {/* Link ke halaman bahan baku */}
                    <div className="mt-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
                        <p className="text-xs font-medium text-muted-foreground mb-2">
                            Belum ada bahan baku?
                        </p>
                        <Link
                            href={route("admin.products.create")}
                            className="flex items-center gap-2 text-xs text-primary hover:text-primary transition"
                        >
                            <Plus className="h-4 w-4" strokeWidth={2} />
                            Buat produk baru dengan tipe "Bahan Baku"
                        </Link>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
