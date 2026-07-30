import DeveloperLayout from "@/Layouts/DeveloperLayout";
import ConfirmDeleteModal from "@/Components/ConfirmDeleteModal";
import Button from "@/Components/ui/Button";
import { Head, router, useForm, usePage } from "@inertiajs/react";
import {
    Banknote,
    Calendar,
    ChefHat,
    ClipboardList,
    Clock,
    Crown,
    CreditCard,
    Eye,
    Factory,
    Gift,
    LayoutDashboard,
    Lock,
    Monitor,
    Package,
    Pencil,
    Plus,
    Settings,
    ShieldCheck,
    ShoppingCart,
    Store,
    Table2,
    Ticket,
    TrendingUp,
    Trash2,
    Truck,
    User,
    Users,
    Wallet,
    X,
} from "lucide-react";
import { useMemo, useState } from "react";

/* ── Ikon yang bisa dipilih untuk template ── */
const ICON_CHOICES = {
    ShieldCheck,
    Crown,
    Eye,
    Monitor,
    Package,
    ChefHat,
    Users,
    User,
    Wallet,
    Settings,
    Truck,
    Store,
};

/* ── Warna badge per template (non-semantik, wajib punya varian dark) ── */
const COLOR_CHOICES = {
    amber: "bg-amber-100 text-amber-700 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:ring-amber-800",
    violet: "bg-violet-100 text-violet-700 ring-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:ring-violet-800",
    blue: "bg-blue-100 text-blue-700 ring-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:ring-blue-800",
    sky: "bg-sky-100 text-sky-700 ring-sky-200 dark:bg-sky-900/30 dark:text-sky-400 dark:ring-sky-800",
    teal: "bg-teal-100 text-teal-700 ring-teal-200 dark:bg-teal-900/30 dark:text-teal-400 dark:ring-teal-800",
    orange: "bg-orange-100 text-orange-700 ring-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:ring-orange-800",
    rose: "bg-rose-100 text-rose-700 ring-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:ring-rose-800",
    muted: "bg-muted text-muted-foreground ring-border",
};

/* ── Metadata grup permission (21 grup, sesuai prefix di DB) ── */
const GROUP_META = {
    dashboard: { label: "Dashboard", Icon: LayoutDashboard },
    sale: { label: "Penjualan / POS", Icon: ShoppingCart },
    product: { label: "Produk", Icon: Package },
    stock: { label: "Stok", Icon: ClipboardList },
    batch: { label: "Batch & Kadaluarsa", Icon: Package },
    purchase: { label: "Pembelian", Icon: Truck },
    supplier: { label: "Supplier", Icon: Factory },
    customer: { label: "Pelanggan", Icon: User },
    membership: { label: "Membership", Icon: CreditCard },
    debt: { label: "Hutang / Kasbon", Icon: Banknote },
    employee: { label: "Karyawan", Icon: Users },
    commission: { label: "Komisi", Icon: Wallet },
    expense: { label: "Pengeluaran", Icon: Banknote },
    promotion: { label: "Promo & Diskon", Icon: Gift },
    table: { label: "Manajemen Meja", Icon: Table2 },
    kitchen: { label: "Kitchen Display", Icon: ChefHat },
    queue: { label: "Antrian", Icon: Ticket },
    booking: { label: "Booking / Reservasi", Icon: Calendar },
    shift: { label: "Shift Kasir", Icon: Clock },
    report: { label: "Laporan", Icon: TrendingUp },
    setting: { label: "Pengaturan", Icon: Settings },
};

const GROUP_ORDER = Object.keys(GROUP_META);

/* ── Label aksi (bagian setelah titik pada nama permission) ── */
const ACTION_LABELS = {
    view: "Lihat",
    create: "Buat",
    edit: "Edit",
    delete: "Hapus",
    import: "Import",
    void: "Void",
    discount: "Diskon",
    return: "Retur",
    adjustment: "Penyesuaian",
    opname: "Opname",
    transfer: "Transfer",
    waste: "Waste",
    deposit: "Deposit",
    pay: "Bayar",
    open: "Buka",
    close: "Tutup",
    manage: "Kelola",
    approve: "Approve",
    update: "Update",
    cancel: "Batal",
    sales: "Penjualan",
    purchase: "Pembelian",
    stock: "Stok",
    expense: "Pengeluaran",
    shift: "Shift",
    commission: "Komisi",
    payment_method: "Metode Bayar",
    payment_gateway: "Payment Gateway",
    module: "Modul",
};

function actionLabel(permissionName) {
    const action = permissionName.split(".").slice(1).join(".");
    return ACTION_LABELS[action] ?? action;
}

function groupMeta(group) {
    return GROUP_META[group] ?? { label: group, Icon: ShieldCheck };
}

function templateIcon(iconName) {
    return ICON_CHOICES[iconName] ?? ShieldCheck;
}

function colorClass(color) {
    return COLOR_CHOICES[color] ?? COLOR_CHOICES.muted;
}

/* ── Modal atur permission ── */
function PermissionModal({ template, allPermissions, storeCount, onClose }) {
    const [grantsAll, setGrantsAll] = useState(template.grants_all);
    const [selected, setSelected] = useState(
        () => new Set(template.grants_all ? [] : template.permissions),
    );
    const [saving, setSaving] = useState(false);

    const grouped = useMemo(() => {
        const map = {};
        allPermissions.forEach((p) => {
            if (!map[p.group]) map[p.group] = [];
            map[p.group].push(p);
        });
        return GROUP_ORDER.filter((g) => map[g]?.length).map((g) => ({
            group: g,
            items: map[g],
        }));
    }, [allPermissions]);

    const toggle = (name) => {
        setSelected((prev) => {
            const next = new Set(prev);
            next.has(name) ? next.delete(name) : next.add(name);
            return next;
        });
    };

    const toggleGroup = (items) => {
        const allOn = items.every((p) => selected.has(p.name));
        setSelected((prev) => {
            const next = new Set(prev);
            items.forEach((p) =>
                allOn ? next.delete(p.name) : next.add(p.name),
            );
            return next;
        });
    };

    const save = () => {
        setSaving(true);
        router.put(
            route("developer.role-templates.permissions", template.id),
            {
                grants_all: grantsAll,
                permissions: grantsAll ? [] : [...selected],
            },
            {
                preserveScroll: true,
                onFinish: () => setSaving(false),
                onSuccess: onClose,
            },
        );
    };

    const activeCount = grantsAll ? allPermissions.length : selected.size;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-4">
            <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl border border-border bg-popover text-popover-foreground shadow-2xl">
                <div className="flex items-start justify-between gap-3 border-b border-border px-6 py-4">
                    <div>
                        <h3 className="text-base font-bold text-popover-foreground">
                            Atur Permission —{" "}
                            <span className="text-primary">{template.name}</span>
                        </h3>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            {activeCount} dari {allPermissions.length} permission
                            aktif. Perubahan langsung disinkron ke {storeCount}{" "}
                            toko yang cocok.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    >
                        <X className="h-4 w-4" strokeWidth={2.5} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {/* Akses penuh */}
                    <label
                        className={`mb-4 flex cursor-pointer select-none items-start gap-3 rounded-xl border p-4 transition ${
                            grantsAll
                                ? "border-primary bg-primary/10"
                                : "border-border bg-card hover:bg-muted"
                        }`}
                    >
                        <input
                            type="checkbox"
                            checked={grantsAll}
                            onChange={(e) => setGrantsAll(e.target.checked)}
                            className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-ring/20"
                        />
                        <div>
                            <p className="text-sm font-semibold text-foreground">
                                Akses penuh (semua permission)
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                Role otomatis mendapat seluruh permission,
                                termasuk permission baru yang ditambahkan nanti.
                            </p>
                        </div>
                    </label>

                    <div
                        className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${grantsAll ? "pointer-events-none opacity-40" : ""}`}
                    >
                        {grouped.map(({ group, items }) => {
                            const meta = groupMeta(group);
                            const active = items.filter((p) =>
                                selected.has(p.name),
                            ).length;
                            const allOn = active === items.length;

                            return (
                                <div
                                    key={group}
                                    className="rounded-xl border border-border bg-card p-4 shadow-sm"
                                >
                                    <div className="mb-3 flex items-center justify-between gap-2">
                                        <div className="flex min-w-0 items-center gap-2">
                                            <meta.Icon
                                                className="h-4 w-4 shrink-0 text-muted-foreground"
                                                strokeWidth={1.8}
                                            />
                                            <span className="truncate text-sm font-bold text-foreground">
                                                {meta.label}
                                            </span>
                                            <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                                                {active}/{items.length}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => toggleGroup(items)}
                                            className={`shrink-0 text-[10px] font-bold uppercase tracking-wider transition ${
                                                allOn
                                                    ? "text-primary hover:text-primary/80"
                                                    : "text-muted-foreground hover:text-foreground"
                                            }`}
                                        >
                                            {allOn ? "Kosongkan" : "Pilih semua"}
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {items.map((p) => {
                                            const on = selected.has(p.name);
                                            return (
                                                <button
                                                    key={p.name}
                                                    type="button"
                                                    onClick={() => toggle(p.name)}
                                                    title={p.name}
                                                    className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                                                        on
                                                            ? "bg-primary text-primary-foreground shadow-sm"
                                                            : "border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                                                    }`}
                                                >
                                                    {actionLabel(p.name)}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
                    <button
                        onClick={onClose}
                        className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    >
                        Batal
                    </button>
                    <Button onClick={save} loading={saving} className="px-5">
                        Simpan & Sinkron
                    </Button>
                </div>
            </div>
        </div>
    );
}

/* ── Modal buat / edit template ── */
function TemplateFormModal({ template, storeTypes, onClose }) {
    const isEdit = !!template;

    const form = useForm({
        name: template?.name ?? "",
        key: template?.key ?? "",
        description: template?.description ?? "",
        icon: template?.icon ?? "ShieldCheck",
        color: template?.color ?? "muted",
        store_type_codes: template?.store_type_codes ?? ["*"],
        permissions: [],
    });

    const allTypes = form.data.store_type_codes.includes("*");

    const toggleType = (code) => {
        const current = form.data.store_type_codes.filter((c) => c !== "*");
        const next = current.includes(code)
            ? current.filter((c) => c !== code)
            : [...current, code];
        form.setData("store_type_codes", next.length ? next : []);
    };

    const submit = (e) => {
        e.preventDefault();
        if (isEdit) {
            form.put(route("developer.role-templates.update", template.id), {
                onSuccess: onClose,
            });
        } else {
            form.post(route("developer.role-templates.store"), {
                onSuccess: onClose,
            });
        }
    };

    const SelectedIcon = templateIcon(form.data.icon);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-4">
            <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl border border-border bg-popover text-popover-foreground shadow-2xl">
                <div className="border-b border-border px-6 py-4">
                    <h3 className="text-base font-bold text-popover-foreground">
                        {isEdit
                            ? `Edit Template — ${template.name}`
                            : "Buat Template Role"}
                    </h3>
                    {isEdit && template.is_core && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            Template inti — kode{" "}
                            <span className="font-mono">{template.key}</span>{" "}
                            dikunci karena dipakai sistem otorisasi.
                        </p>
                    )}
                </div>

                <form
                    onSubmit={submit}
                    className="flex-1 space-y-4 overflow-y-auto p-6"
                >
                    <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                            Nama <span className="text-destructive">*</span>
                        </label>
                        <input
                            value={form.data.name}
                            onChange={(e) => form.setData("name", e.target.value)}
                            required
                            autoFocus
                            placeholder="cth: Supervisor Gudang"
                            className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                        />
                        {form.errors.name && (
                            <p className="mt-1.5 text-xs text-destructive">
                                {form.errors.name}
                            </p>
                        )}
                    </div>

                    {!isEdit && (
                        <div>
                            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                                Kode
                                <span className="ml-1.5 font-normal normal-case tracking-normal text-muted-foreground/70">
                                    (opsional, dibuat otomatis dari nama)
                                </span>
                            </label>
                            <input
                                value={form.data.key}
                                onChange={(e) =>
                                    form.setData("key", e.target.value)
                                }
                                placeholder="cth: supervisor_gudang"
                                className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 font-mono text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                            />
                            <p className="mt-1.5 text-[11px] text-muted-foreground">
                                Dipakai sebagai nama role di setiap toko. Huruf
                                kecil, tanpa spasi.
                            </p>
                            {form.errors.key && (
                                <p className="mt-1.5 text-xs text-destructive">
                                    {form.errors.key}
                                </p>
                            )}
                        </div>
                    )}

                    <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                            Deskripsi
                        </label>
                        <input
                            value={form.data.description}
                            onChange={(e) =>
                                form.setData("description", e.target.value)
                            }
                            placeholder="Fungsi singkat role ini"
                            className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                        />
                    </div>

                    {/* Ikon & warna */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                                Ikon
                            </label>
                            <div className="flex flex-wrap gap-1.5">
                                {Object.entries(ICON_CHOICES).map(
                                    ([name, Icon]) => (
                                        <button
                                            key={name}
                                            type="button"
                                            onClick={() =>
                                                form.setData("icon", name)
                                            }
                                            title={name}
                                            className={`flex h-8 w-8 items-center justify-center rounded-lg border transition ${
                                                form.data.icon === name
                                                    ? "border-primary bg-primary/10 text-primary"
                                                    : "border-border text-muted-foreground hover:bg-muted"
                                            }`}
                                        >
                                            <Icon
                                                className="h-4 w-4"
                                                strokeWidth={1.8}
                                            />
                                        </button>
                                    ),
                                )}
                            </div>
                        </div>
                        <div>
                            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                                Warna
                            </label>
                            <div className="flex flex-wrap gap-1.5">
                                {Object.keys(COLOR_CHOICES).map((color) => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() =>
                                            form.setData("color", color)
                                        }
                                        title={color}
                                        className={`rounded-lg px-2 py-1 text-[10px] font-bold ring-1 transition ${colorClass(color)} ${
                                            form.data.color === color
                                                ? "outline outline-2 outline-offset-1 outline-primary"
                                                : ""
                                        }`}
                                    >
                                        Aa
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Preview badge */}
                    <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-3.5 py-3">
                        <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                            Tampilan
                        </span>
                        <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${colorClass(form.data.color)}`}
                        >
                            <SelectedIcon className="h-3 w-3" strokeWidth={2} />
                            {form.data.name || "Nama Role"}
                        </span>
                    </div>

                    {/* Cakupan tipe toko */}
                    <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                            Muncul di tipe toko{" "}
                            <span className="text-destructive">*</span>
                        </label>
                        <label
                            className={`mb-2 flex cursor-pointer select-none items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm transition ${
                                allTypes
                                    ? "border-primary bg-primary/10 text-primary"
                                    : "border-border bg-card text-foreground hover:bg-muted"
                            }`}
                        >
                            <input
                                type="checkbox"
                                checked={allTypes}
                                onChange={(e) =>
                                    form.setData(
                                        "store_type_codes",
                                        e.target.checked ? ["*"] : [],
                                    )
                                }
                                className="h-4 w-4 rounded border-border text-primary focus:ring-ring/20"
                            />
                            <span className="font-medium">Semua tipe toko</span>
                        </label>

                        {!allTypes && (
                            <div className="grid grid-cols-2 gap-1.5">
                                {storeTypes.map((type) => {
                                    const on =
                                        form.data.store_type_codes.includes(
                                            type.code,
                                        );
                                    return (
                                        <label
                                            key={type.code}
                                            className={`flex cursor-pointer select-none items-center gap-2 rounded-lg border px-3 py-2 text-xs transition ${
                                                on
                                                    ? "border-primary bg-primary/10 text-primary"
                                                    : "border-border bg-card text-foreground hover:bg-muted"
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={on}
                                                onChange={() =>
                                                    toggleType(type.code)
                                                }
                                                className="h-3.5 w-3.5 rounded border-border text-primary focus:ring-ring/20"
                                            />
                                            <span className="font-medium">
                                                {type.label}
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                        )}
                        {form.errors.store_type_codes && (
                            <p className="mt-1.5 text-xs text-destructive">
                                {form.errors.store_type_codes}
                            </p>
                        )}
                    </div>

                    {!isEdit && (
                        <div className="flex gap-2.5 rounded-xl border border-primary/20 bg-primary/5 px-3.5 py-3">
                            <ShieldCheck
                                className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                                strokeWidth={2}
                            />
                            <div className="text-xs leading-relaxed text-foreground/80">
                                <p className="font-semibold text-foreground">
                                    Langkah berikutnya: atur permission
                                </p>
                                <p className="mt-0.5">
                                    Template dibuat tanpa permission. Setelah
                                    tersimpan, klik{" "}
                                    <span className="font-semibold text-primary">
                                        Atur Permission
                                    </span>{" "}
                                    pada kartunya.
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
                        >
                            Batal
                        </button>
                        <Button
                            type="submit"
                            loading={form.processing}
                            className="px-5"
                        >
                            {isEdit ? "Simpan & Sinkron" : "Buat Template"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ── Kartu template ── */
function TemplateCard({
    template,
    storeTypes,
    totalPermissions,
    onEditPermissions,
    onEdit,
    onDelete,
}) {
    const Icon = templateIcon(template.icon);
    const allTypes = template.store_type_codes.includes("*");
    const typeLabels = allTypes
        ? ["Semua tipe toko"]
        : storeTypes
              .filter((t) => template.store_type_codes.includes(t.code))
              .map((t) => t.label);

    const permCount = template.grants_all
        ? totalPermissions
        : template.permissions.length;

    return (
        <div className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:shadow-md">
            <div className="flex items-start gap-3">
                <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${colorClass(template.color)}`}
                >
                    <Icon className="h-5 w-5" strokeWidth={1.8} />
                </span>
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                        <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${colorClass(template.color)}`}
                        >
                            {template.name}
                        </span>
                        {template.is_core && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                                <Lock className="h-2.5 w-2.5" strokeWidth={2.5} />
                                Inti
                            </span>
                        )}
                    </div>
                    <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                        {template.key}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        {template.description || "Tanpa deskripsi"}
                    </p>
                </div>
            </div>

            {/* Cakupan tipe toko */}
            <div className="mt-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Muncul di
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1">
                    {typeLabels.length === 0 ? (
                        <span className="rounded-md bg-warning/10 px-2 py-0.5 text-[10px] font-medium text-warning">
                            Belum diatur
                        </span>
                    ) : (
                        typeLabels.map((label) => (
                            <span
                                key={label}
                                className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                            >
                                {label}
                            </span>
                        ))
                    )}
                </div>
            </div>

            {/* Permission */}
            <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                <span className="text-xs text-muted-foreground">
                    {template.grants_all ? (
                        <span className="font-semibold text-primary">
                            Akses penuh
                        </span>
                    ) : (
                        <>
                            {permCount} / {totalPermissions} permission
                        </>
                    )}
                </span>
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={onEditPermissions}
                        className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    >
                        Atur Permission
                    </button>
                    <button
                        onClick={onEdit}
                        title="Edit template"
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    >
                        <Pencil className="h-3.5 w-3.5" />
                    </button>
                    {!template.is_core && (
                        <button
                            onClick={onDelete}
                            title="Hapus template"
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-destructive/20 text-destructive transition hover:bg-destructive/10"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ── Halaman ── */
export default function Index({
    templates = [],
    storeTypes = [],
    allPermissions = [],
}) {
    const { errors } = usePage().props;

    const [permTarget, setPermTarget] = useState(null);
    const [formTarget, setFormTarget] = useState(null); // template object = edit
    const [creating, setCreating] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const confirmDelete = () => {
        if (!deleteTarget) return;
        setDeleting(true);
        router.delete(
            route("developer.role-templates.destroy", deleteTarget.id),
            {
                preserveScroll: true,
                onFinish: () => {
                    setDeleting(false);
                    setDeleteTarget(null);
                },
            },
        );
    };

    return (
        <DeveloperLayout header="Template Role">
            <Head title="Template Role" />

            {errors?.template && (
                <div className="mb-5 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {errors.template}
                </div>
            )}

            {/* Penjelasan */}
            <div className="mb-5 flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                        <ShieldCheck
                            className="h-5 w-5 text-primary"
                            strokeWidth={1.8}
                        />
                    </div>
                    <div className="max-w-xl">
                        <h3 className="text-sm font-bold text-foreground">
                            Role default untuk semua toko
                        </h3>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            Template menentukan role apa saja yang otomatis
                            dibuat saat toko baru lahir, dan di tipe toko mana
                            role itu muncul. Perubahan langsung disinkron ke
                            toko yang cocok — role yang sudah ada tidak pernah
                            dihapus, hanya ditambah atau diperbarui.
                        </p>
                    </div>
                </div>
                <Button onClick={() => setCreating(true)}>
                    <Plus className="mr-1.5 h-4 w-4" strokeWidth={2.5} />
                    Buat Template
                </Button>
            </div>

            {/* Ringkasan */}
            <div className="mb-6 flex flex-wrap items-center gap-4 border-y border-border py-3 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">
                    {templates.length} template
                </span>
                <span className="text-muted-foreground/40">·</span>
                <span>{allPermissions.length} permission tersedia</span>
                <span>{storeTypes.length} tipe toko</span>
            </div>

            {/* Grid template */}
            {templates.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
                    <p className="text-sm font-medium text-muted-foreground">
                        Belum ada template role
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Toko baru tidak akan punya role sampai template dibuat.
                    </p>
                    <Button onClick={() => setCreating(true)} className="mt-4">
                        <Plus className="mr-1.5 h-4 w-4" strokeWidth={2.5} />
                        Buat Template
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {templates.map((template) => (
                        <TemplateCard
                            key={template.id}
                            template={template}
                            storeTypes={storeTypes}
                            totalPermissions={allPermissions.length}
                            onEditPermissions={() => setPermTarget(template)}
                            onEdit={() => setFormTarget(template)}
                            onDelete={() => setDeleteTarget(template)}
                        />
                    ))}
                </div>
            )}

            {/* Modals */}
            {permTarget && (
                <PermissionModal
                    template={permTarget}
                    allPermissions={allPermissions}
                    storeCount={permTarget.store_count ?? 0}
                    onClose={() => setPermTarget(null)}
                />
            )}
            {(creating || formTarget) && (
                <TemplateFormModal
                    template={formTarget}
                    storeTypes={storeTypes}
                    onClose={() => {
                        setCreating(false);
                        setFormTarget(null);
                    }}
                />
            )}

            <ConfirmDeleteModal
                open={!!deleteTarget}
                title={`Hapus template "${deleteTarget?.name}"?`}
                description="Template berhenti dipakai untuk toko baru. Role yang sudah terbuat di toko tidak dihapus dan user tetap punya aksesnya."
                processing={deleting}
                onConfirm={confirmDelete}
                onClose={() => !deleting && setDeleteTarget(null)}
            />
        </DeveloperLayout>
    );
}
