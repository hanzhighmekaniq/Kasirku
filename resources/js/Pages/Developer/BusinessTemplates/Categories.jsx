import DeveloperLayout from "@/Layouts/DeveloperLayout";
import { Head, Link, router, useForm, usePage } from "@inertiajs/react";
import { useState } from "react";
import {
    ArrowLeft,
    ChevronDown,
    ChevronRight,
    CircleCheck,
    Package,
    Pencil,
    Plus,
    Trash2,
    TriangleAlert,
    X,
} from "lucide-react";

const iCls = (err) =>
    `block w-full rounded-xl border px-3.5 py-2.5 text-sm text-foreground transition placeholder:text-muted-foreground focus:outline-none focus:ring-2 ${
        err
            ? "border-destructive bg-destructive/10 focus:ring-destructive/20"
            : "border-input bg-background focus:border-ring focus:ring-ring/20"
    }`;

const fmtRp = (n) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(Number(n) || 0);

// ── Modal: tambah/edit kategori ────────────────────────────────────────────
function CategoryForm({ template, category = null, onClose }) {
    const isEdit = !!category;
    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: category?.name ?? "",
        sort_order: category?.sort_order ?? 0,
    });

    const submit = (e) => {
        e.preventDefault();
        if (isEdit) {
            put(
                route("developer.business-templates.categories.update", {
                    businessTemplate: template.id,
                    category: category.id,
                }),
                { preserveScroll: true, onSuccess: onClose },
            );
        } else {
            post(
                route("developer.business-templates.categories.store", template.id),
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        reset();
                        onClose();
                    },
                },
            );
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-2xl">
                <div className="flex items-center justify-between border-b border-border px-6 py-4">
                    <h3 className="text-base font-semibold text-popover-foreground">
                        {isEdit ? "Edit Kategori" : "Tambah Kategori"}
                    </h3>
                    <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted">
                        <X className="h-4 w-4" strokeWidth={2} />
                    </button>
                </div>
                <form onSubmit={submit} className="space-y-4 p-6">
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-foreground">
                            Nama Kategori <span className="text-destructive">*</span>
                        </label>
                        <input
                            value={data.name}
                            onChange={(e) => setData("name", e.target.value)}
                            className={iCls(errors.name)}
                            placeholder="cth. Minuman Kopi"
                            autoFocus
                        />
                        {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name}</p>}
                    </div>
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-foreground">Urutan</label>
                        <input
                            type="number"
                            min="0"
                            value={data.sort_order}
                            onChange={(e) => setData("sort_order", Number(e.target.value))}
                            className={iCls(errors.sort_order)}
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={onClose} className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-muted">
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={processing || !data.name}
                            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
                        >
                            {processing && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
                            {isEdit ? "Simpan" : "Tambah"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Modal: tambah/edit produk ──────────────────────────────────────────────
function ProductForm({ template, category, product = null, onClose }) {
    const isEdit = !!product;
    const { data, setData, post, put, processing, errors, reset } = useForm({
        sku: product?.sku ?? "",
        name: product?.name ?? "",
        unit: product?.unit ?? "pcs",
        cost_price: product?.cost_price ?? 0,
        sell_price: product?.sell_price ?? 0,
        track_stock: product?.track_stock ?? false,
        stock_minimum: product?.stock_minimum ?? "",
        preparation_time: product?.preparation_time ?? "",
        is_composable: product?.is_composable ?? false,
        sort_order: product?.sort_order ?? 0,
    });

    const submit = (e) => {
        e.preventDefault();
        if (isEdit) {
            put(
                route("developer.business-templates.categories.products.update", {
                    businessTemplate: template.id,
                    category: category.id,
                    product: product.id,
                }),
                { preserveScroll: true, onSuccess: onClose },
            );
        } else {
            post(
                route("developer.business-templates.categories.products.store", {
                    businessTemplate: template.id,
                    category: category.id,
                }),
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        reset();
                        onClose();
                    },
                },
            );
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-2xl">
                <div className="flex items-center justify-between border-b border-border px-6 py-4">
                    <h3 className="text-base font-semibold text-popover-foreground">
                        {isEdit ? "Edit Produk" : "Tambah Produk"} — {category.name}
                    </h3>
                    <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted">
                        <X className="h-4 w-4" strokeWidth={2} />
                    </button>
                </div>
                <form onSubmit={submit} className="max-h-[75vh] space-y-4 overflow-y-auto p-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-foreground">
                                SKU <span className="text-destructive">*</span>
                            </label>
                            <input
                                value={data.sku}
                                onChange={(e) => setData("sku", e.target.value.toUpperCase())}
                                className={iCls(errors.sku)}
                                placeholder="FC-001"
                            />
                            {errors.sku && <p className="mt-1 text-xs text-destructive">{errors.sku}</p>}
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-foreground">
                                Nama <span className="text-destructive">*</span>
                            </label>
                            <input
                                value={data.name}
                                onChange={(e) => setData("name", e.target.value)}
                                className={iCls(errors.name)}
                                placeholder="Espresso"
                            />
                            {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name}</p>}
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-foreground">
                                Satuan <span className="text-destructive">*</span>
                            </label>
                            <input
                                value={data.unit}
                                onChange={(e) => setData("unit", e.target.value)}
                                className={iCls(errors.unit)}
                                placeholder="pcs / cup / porsi"
                            />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-foreground">Urutan</label>
                            <input
                                type="number"
                                min="0"
                                value={data.sort_order}
                                onChange={(e) => setData("sort_order", Number(e.target.value))}
                                className={iCls(errors.sort_order)}
                            />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-foreground">
                                Harga Modal <span className="text-destructive">*</span>
                            </label>
                            <div className="relative">
                                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">Rp</span>
                                <input
                                    type="number"
                                    min="0"
                                    value={data.cost_price}
                                    onChange={(e) => setData("cost_price", Number(e.target.value))}
                                    className={`${iCls(errors.cost_price)} pl-9`}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-foreground">
                                Harga Jual <span className="text-destructive">*</span>
                            </label>
                            <div className="relative">
                                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">Rp</span>
                                <input
                                    type="number"
                                    min="0"
                                    value={data.sell_price}
                                    onChange={(e) => setData("sell_price", Number(e.target.value))}
                                    className={`${iCls(errors.sell_price)} pl-9`}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-foreground">Stok Minimum</label>
                            <input
                                type="number"
                                min="0"
                                value={data.stock_minimum}
                                onChange={(e) => setData("stock_minimum", e.target.value)}
                                className={iCls(errors.stock_minimum)}
                                placeholder="Kosong = tidak dipantau"
                            />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-foreground">Waktu Siap (menit)</label>
                            <input
                                type="number"
                                min="0"
                                value={data.preparation_time}
                                onChange={(e) => setData("preparation_time", e.target.value)}
                                className={iCls(errors.preparation_time)}
                                placeholder="Khusus F&B"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-border px-3.5 py-2.5 transition hover:bg-muted">
                            <div className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${data.track_stock ? "bg-primary" : "bg-muted-foreground/30"}`}>
                                <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-card shadow transition-transform ${data.track_stock ? "translate-x-4" : "translate-x-0.5"}`} />
                            </div>
                            <input type="checkbox" checked={data.track_stock} onChange={(e) => setData("track_stock", e.target.checked)} className="sr-only" />
                            <span className="text-sm font-medium text-foreground">Pantau Stok</span>
                        </label>
                        <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-border px-3.5 py-2.5 transition hover:bg-muted">
                            <div className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${data.is_composable ? "bg-primary" : "bg-muted-foreground/30"}`}>
                                <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-card shadow transition-transform ${data.is_composable ? "translate-x-4" : "translate-x-0.5"}`} />
                            </div>
                            <input type="checkbox" checked={data.is_composable} onChange={(e) => setData("is_composable", e.target.checked)} className="sr-only" />
                            <span className="text-sm font-medium text-foreground">Diracik (F&B)</span>
                        </label>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={onClose} className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-muted">
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={processing || !data.sku || !data.name}
                            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
                        >
                            {processing && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
                            {isEdit ? "Simpan" : "Tambah"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Baris kategori dengan produk expandable ────────────────────────────────
function CategoryRow({ template, category, onEditCategory, onDeleteCategory, onAddProduct, onEditProduct, onDeleteProduct, deletingProduct }) {
    const [expanded, setExpanded] = useState(true);

    return (
        <div className="border-b border-border last:border-0">
            <div className="flex items-center gap-3 px-5 py-3.5">
                <button
                    onClick={() => setExpanded((v) => !v)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted"
                >
                    {expanded ? (
                        <ChevronDown className="h-4 w-4" strokeWidth={2} />
                    ) : (
                        <ChevronRight className="h-4 w-4" strokeWidth={2} />
                    )}
                </button>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">{category.name}</p>
                    <p className="text-xs text-muted-foreground">
                        {category.products.length} produk
                    </p>
                </div>
                <button
                    onClick={() => onAddProduct(category)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-primary/10 hover:text-primary"
                >
                    <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                    Produk
                </button>
                <button
                    onClick={() => onEditCategory(category)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-warning/10 hover:text-warning"
                    title="Edit Kategori"
                >
                    <Pencil className="h-4 w-4" strokeWidth={1.7} />
                </button>
                <button
                    onClick={() => onDeleteCategory(category)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                    title="Hapus Kategori"
                >
                    <Trash2 className="h-4 w-4" strokeWidth={1.7} />
                </button>
            </div>

            {expanded && category.products.length > 0 && (
                <div className="divide-y divide-border bg-muted/20 pl-14">
                    {category.products.map((product) => (
                        <div key={product.id} className="flex items-center gap-4 py-2.5 pr-5">
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium text-foreground">{product.name}</p>
                                    <span className="rounded-full bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                                        {product.sku}
                                    </span>
                                </div>
                                <p className="text-[11px] text-muted-foreground">
                                    {product.unit}
                                    {product.track_stock && " · pantau stok"}
                                    {product.preparation_time ? ` · ${product.preparation_time} menit` : ""}
                                </p>
                            </div>
                            <div className="shrink-0 text-right">
                                <p className="text-sm font-bold text-foreground">{fmtRp(product.sell_price)}</p>
                                <p className="text-[10px] text-muted-foreground">modal {fmtRp(product.cost_price)}</p>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => onEditProduct(category, product)}
                                    className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-warning/10 hover:text-warning"
                                >
                                    <Pencil className="h-3.5 w-3.5" strokeWidth={1.7} />
                                </button>
                                <button
                                    onClick={() => onDeleteProduct(category, product)}
                                    disabled={deletingProduct === product.id}
                                    className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
                                >
                                    <Trash2 className="h-3.5 w-3.5" strokeWidth={1.7} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Main Page ───────────────────────────────────────────────────────────────
export default function Categories({ template, categories: initialCategories = [] }) {
    const { flash } = usePage().props;
    const [categories, setCategories] = useState(initialCategories);
    const [showCategoryForm, setShowCategoryForm] = useState(false);
    const [editCategoryTarget, setEditCategoryTarget] = useState(null);
    const [productModalFor, setProductModalFor] = useState(null); // { category, product? }
    const [deletingProduct, setDeletingProduct] = useState(null);

    const reload = () => router.reload({ only: ["categories", "template"] });

    const handleDeleteCategory = (category) => {
        if (!confirm(`Hapus kategori "${category.name}" beserta semua produknya?`)) return;
        router.delete(
            route("developer.business-templates.categories.destroy", {
                businessTemplate: template.id,
                category: category.id,
            }),
            { preserveScroll: true, onSuccess: reload },
        );
    };

    const handleDeleteProduct = (category, product) => {
        if (!confirm(`Hapus produk "${product.name}"?`)) return;
        setDeletingProduct(product.id);
        router.delete(
            route("developer.business-templates.categories.products.destroy", {
                businessTemplate: template.id,
                category: category.id,
                product: product.id,
            }),
            {
                preserveScroll: true,
                onSuccess: reload,
                onFinish: () => setDeletingProduct(null),
            },
        );
    };

    return (
        <DeveloperLayout
            header={
                <div className="flex items-center gap-3">
                    <Link
                        href={route("developer.business-templates.index")}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground shadow-sm transition hover:bg-muted hover:text-foreground"
                    >
                        <ArrowLeft className="h-4 w-4" strokeWidth={2} />
                    </Link>
                    <div>
                        <h2 className="text-lg font-bold text-foreground">
                            Kategori & Produk — {template.label}
                        </h2>
                        <p className="text-xs text-muted-foreground">
                            {categories.length} kategori ·{" "}
                            {template.is_ready ? "Siap Pakai" : "Belum punya kategori — Segera Hadir"}
                        </p>
                    </div>
                </div>
            }
        >
            <Head title={`Kategori & Produk — ${template.label}`} />

            {flash?.success && (
                <div className="mb-5 flex items-center gap-3 rounded-2xl border border-success/20 bg-success/10 px-4 py-3 text-sm font-medium text-success">
                    <CircleCheck className="h-4 w-4 shrink-0" strokeWidth={2} />
                    {flash.success}
                </div>
            )}
            {flash?.error && (
                <div className="mb-5 flex items-center gap-3 rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
                    <TriangleAlert className="h-4 w-4 shrink-0" strokeWidth={2} />
                    {flash.error}
                </div>
            )}

            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <div className="flex items-center justify-between border-b border-border bg-muted/60 px-6 py-4">
                    <div>
                        <h3 className="text-sm font-bold text-foreground">Kategori</h3>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            Data ini akan otomatis dibuat di toko baru yang memilih template ini
                        </p>
                    </div>
                    <button
                        onClick={() => setShowCategoryForm(true)}
                        className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
                    >
                        <Plus className="h-4 w-4" strokeWidth={2.5} />
                        Tambah Kategori
                    </button>
                </div>

                {categories.length === 0 ? (
                    <div className="flex flex-col items-center py-16 text-center">
                        <Package className="mb-4 h-12 w-12 text-muted-foreground/50" strokeWidth={1.5} />
                        <p className="text-base font-semibold text-foreground">Belum ada kategori</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Tambah kategori pertama untuk template ini.
                        </p>
                        <button
                            onClick={() => setShowCategoryForm(true)}
                            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                        >
                            Tambah Kategori
                        </button>
                    </div>
                ) : (
                    categories.map((category) => (
                        <CategoryRow
                            key={category.id}
                            template={template}
                            category={category}
                            onEditCategory={setEditCategoryTarget}
                            onDeleteCategory={handleDeleteCategory}
                            onAddProduct={(cat) => setProductModalFor({ category: cat })}
                            onEditProduct={(cat, product) => setProductModalFor({ category: cat, product })}
                            onDeleteProduct={handleDeleteProduct}
                            deletingProduct={deletingProduct}
                        />
                    ))
                )}
            </div>

            {showCategoryForm && (
                <CategoryForm
                    template={template}
                    onClose={() => {
                        setShowCategoryForm(false);
                        reload();
                    }}
                />
            )}

            {editCategoryTarget && (
                <CategoryForm
                    template={template}
                    category={editCategoryTarget}
                    onClose={() => {
                        setEditCategoryTarget(null);
                        reload();
                    }}
                />
            )}

            {productModalFor && (
                <ProductForm
                    template={template}
                    category={productModalFor.category}
                    product={productModalFor.product}
                    onClose={() => {
                        setProductModalFor(null);
                        reload();
                    }}
                />
            )}
        </DeveloperLayout>
    );
}
