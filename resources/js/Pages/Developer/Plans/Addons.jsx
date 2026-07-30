import DeveloperLayout from "@/Layouts/DeveloperLayout";
import { Head, Link, router, useForm, usePage } from "@inertiajs/react";
import { useState } from "react";
import { ArrowLeft, CircleCheck, Pencil, Plus, Trash2, TriangleAlert, X } from "lucide-react";

const iCls = (err) =>
    `block w-full rounded-xl border px-3.5 py-2.5 text-sm text-foreground transition placeholder:text-muted-foreground focus:outline-none focus:ring-2 ${
        err
            ? "border-destructive bg-destructive/10 focus:ring-destructive/20"
            : "border-input bg-background focus:border-ring focus:ring-ring/20"
    }`;

const fmtRp = (n) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(n) || 0);

const ADDON_CODE_LABELS = {
    branch: "Tambah Cabang",
    user: "Tambah User",
    store: "Tambah Store",
};

function AddonForm({ plan, addonCodes, existingCodes = [], addon = null, onClose }) {
    const isEdit = !!addon;
    const { data, setData, post, put, processing, errors, reset } = useForm({
        code: addon?.code ?? "",
        label: addon?.label ?? (addonCodes ? Object.values(addonCodes)[0] : ""),
        price: addon?.price ?? 0,
        description: addon?.description ?? "",
        sort_order: addon?.sort_order ?? 0,
        is_active: addon?.is_active ?? true,
    });

    const availableCodes = Object.entries(addonCodes ?? {}).filter(
        ([code]) => isEdit ? true : !existingCodes.includes(code),
    );

    const submit = (e) => {
        e.preventDefault();
        if (isEdit) {
            put(route("developer.plans.addons.update", { plan: plan.id, addon: addon.id }), {
                preserveScroll: true,
                onSuccess: onClose,
            });
        } else {
            post(route("developer.plans.addons.store", plan.id), {
                preserveScroll: true,
                onSuccess: () => { reset(); onClose(); },
            });
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-2xl">
                <div className="flex items-center justify-between border-b border-border px-6 py-4">
                    <h3 className="text-base font-semibold text-popover-foreground">
                        {isEdit ? "Edit Add-on" : "Tambah Add-on"}
                    </h3>
                    <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted">
                        <X className="h-4 w-4" strokeWidth={2} />
                    </button>
                </div>

                <form onSubmit={submit} className="space-y-4 p-6">
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-foreground">
                            Jenis Add-on <span className="text-destructive">*</span>
                        </label>
                        <select
                            value={data.code}
                            onChange={(e) => {
                                const code = e.target.value;
                                setData({
                                    ...data,
                                    code,
                                    label: addonCodes[code] ?? "",
                                });
                            }}
                            disabled={isEdit}
                            className={`${iCls(errors.code)} disabled:cursor-not-allowed disabled:opacity-60`}
                        >
                            <option value="">Pilih jenis...</option>
                            {availableCodes.map(([code, label]) => (
                                <option key={code} value={code}>{label} ({code})</option>
                            ))}
                        </select>
                        {errors.code && <p className="mt-1 text-xs text-destructive">{errors.code}</p>}
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-foreground">
                            Label <span className="text-destructive">*</span>
                        </label>
                        <input
                            value={data.label}
                            onChange={(e) => setData("label", e.target.value)}
                            className={iCls(errors.label)}
                            placeholder="cth. Tambah Cabang"
                        />
                        {errors.label && <p className="mt-1 text-xs text-destructive">{errors.label}</p>}
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-foreground">
                            Harga / Bulan <span className="text-destructive">*</span>
                        </label>
                        <div className="relative">
                            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">Rp</span>
                            <input
                                type="number"
                                min="0"
                                step="1000"
                                value={data.price}
                                onChange={(e) => setData("price", Number(e.target.value))}
                                className={`${iCls(errors.price)} pl-9`}
                            />
                        </div>
                        {errors.price && <p className="mt-1 text-xs text-destructive">{errors.price}</p>}
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-foreground">Deskripsi</label>
                        <textarea
                            value={data.description}
                            onChange={(e) => setData("description", e.target.value)}
                            rows={2}
                            className={iCls(errors.description)}
                            placeholder="Keterangan singkat add-on ini..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
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
                        <div className="flex items-end pb-0.5">
                            <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-border px-3.5 py-2.5 transition hover:bg-muted">
                                <div className={`relative h-5 w-9 rounded-full transition-colors ${data.is_active ? "bg-primary" : "bg-muted-foreground/30"}`}>
                                    <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-card shadow transition-transform ${data.is_active ? "translate-x-4" : "translate-x-0.5"}`} />
                                </div>
                                <input type="checkbox" checked={data.is_active} onChange={(e) => setData("is_active", e.target.checked)} className="sr-only" />
                                <span className="text-sm font-medium text-foreground">{data.is_active ? "Aktif" : "Nonaktif"}</span>
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={onClose} className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-muted">
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={processing || !data.code}
                            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
                        >
                            {processing ? (
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            ) : null}
                            {isEdit ? "Simpan" : "Tambah"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function Addons({ plan, addons: initialAddons = [], addonCodes = {} }) {
    const { flash } = usePage().props;
    const [addons, setAddons] = useState(initialAddons);
    const [showForm, setShowForm] = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [deleting, setDeleting] = useState(null);

    const existingCodes = addons.map((a) => a.code);
    const allCodesTaken = Object.keys(addonCodes).every((code) => existingCodes.includes(code));

    const handleDelete = (addon) => {
        if (!confirm(`Hapus add-on "${addon.label}"?`)) return;
        setDeleting(addon.id);
        router.delete(
            route("developer.plans.addons.destroy", { plan: plan.id, addon: addon.id }),
            {
                preserveScroll: true,
                onSuccess: () => {
                    setAddons((prev) => prev.filter((a) => a.id !== addon.id));
                },
                onFinish: () => setDeleting(null),
            },
        );
    };

    return (
        <DeveloperLayout
            header={
                <div className="flex items-center gap-3">
                    <Link
                        href={route("developer.plans.index")}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground shadow-sm transition hover:bg-muted hover:text-foreground"
                    >
                        <ArrowLeft className="h-4 w-4" strokeWidth={2} />
                    </Link>
                    <div>
                        <h2 className="text-lg font-bold text-foreground">
                            Add-on — {plan.label}
                        </h2>
                        <p className="text-xs text-muted-foreground">
                            {addons.length} add-on tersedia
                        </p>
                    </div>
                </div>
            }
        >
            <Head title={`Add-on — ${plan.label}`} />

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
                        <h3 className="text-sm font-bold text-foreground">Katalog Add-on</h3>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            Kode plan: <span className="font-mono font-semibold text-foreground">{plan.code}</span>
                            {" · "}Free & Starter tidak punya add-on.
                        </p>
                    </div>
                    {!allCodesTaken && (
                        <button
                            onClick={() => setShowForm(true)}
                            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
                        >
                            <Plus className="h-4 w-4" strokeWidth={2.5} />
                            Tambah Add-on
                        </button>
                    )}
                </div>

                {addons.length === 0 ? (
                    <div className="flex flex-col items-center py-16 text-center">
                        <p className="text-base font-semibold text-foreground">Belum ada add-on</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Tambah add-on untuk paket {plan.label}.
                        </p>
                        {!allCodesTaken && (
                            <button
                                onClick={() => setShowForm(true)}
                                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                            >
                                <Plus className="h-4 w-4" strokeWidth={2.5} />
                                Tambah Add-on Pertama
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="divide-y divide-border">
                        {addons.map((addon) => (
                            <div key={addon.id} className="flex items-center gap-4 px-6 py-4 transition hover:bg-muted/40">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                                    <span className="text-xs font-bold text-primary uppercase">{addon.code.slice(0, 2)}</span>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-semibold text-foreground">{addon.label}</p>
                                        <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                                            {addon.code}
                                        </span>
                                        {!addon.is_active && (
                                            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                                                Nonaktif
                                            </span>
                                        )}
                                    </div>
                                    {addon.description && (
                                        <p className="mt-0.5 truncate text-xs text-muted-foreground">{addon.description}</p>
                                    )}
                                </div>
                                <div className="shrink-0 text-right">
                                    <p className="text-sm font-bold text-foreground">{fmtRp(addon.price)}</p>
                                    <p className="text-[10px] text-muted-foreground">per bulan</p>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setEditTarget(addon)}
                                        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-warning/10 hover:text-warning"
                                        title="Edit"
                                    >
                                        <Pencil className="h-4 w-4" strokeWidth={1.7} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(addon)}
                                        disabled={deleting === addon.id}
                                        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
                                        title="Hapus"
                                    >
                                        <Trash2 className="h-4 w-4" strokeWidth={1.7} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="border-t border-border bg-muted/40 px-6 py-3">
                    <p className="text-[11px] text-muted-foreground">
                        Add-on yang tersedia: {Object.entries(addonCodes).map(([code, label]) => `${label} (${code})`).join(" · ")}
                    </p>
                </div>
            </div>

            {/* Modal form tambah */}
            {showForm && (
                <AddonForm
                    plan={plan}
                    addonCodes={addonCodes}
                    existingCodes={existingCodes}
                    onClose={() => {
                        setShowForm(false);
                        router.reload({ only: [] });
                    }}
                />
            )}

            {/* Modal form edit */}
            {editTarget && (
                <AddonForm
                    plan={plan}
                    addonCodes={addonCodes}
                    existingCodes={existingCodes}
                    addon={editTarget}
                    onClose={() => {
                        setEditTarget(null);
                        router.reload({ only: [] });
                    }}
                />
            )}
        </DeveloperLayout>
    );
}
