import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Link, router } from "@inertiajs/react";
import { useMemo, useState } from "react";
import axios from "axios";
import {
    Banknote,
    Check,
    CreditCard,
    FileClock,
    GripVertical,
    Inbox,
    Info,
    Lock,
    Pencil,
    Plus,
    Search,
    Smartphone,
    Trash2,
} from "lucide-react";
import Button from "@/Components/ui/Button";
import PageHeader from "@/Components/PageHeader";
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
} from "@dnd-kit/core";
import {
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
    arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import ConfirmDeleteModal from "@/Components/ConfirmDeleteModal";

/* ── constants ───────────────────────────────────────── */
const TYPE_META = {
    cash: { label: "Tunai", icon: Banknote, color: "bg-success/10 text-success", dot: "bg-success" },
    digital: { label: "Digital / QRIS", icon: Smartphone, color: "bg-primary/10 text-primary", dot: "bg-primary" },
    card: { label: "Kartu", icon: CreditCard, color: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400", dot: "bg-violet-500" },
    credit: { label: "Kredit / Tempo", icon: FileClock, color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", dot: "bg-amber-500" },
};

function TypeBadge({ type }) {
    const meta = TYPE_META[type] ?? { label: type, icon: CreditCard, color: "bg-muted text-muted-foreground", dot: "bg-muted-foreground" };
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.color}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
            {meta.label}
        </span>
    );
}

/* ── Drag handle ─────────────────────────────────────── */
function DragHandle({ listeners, attributes }) {
    return (
        <button
            {...listeners}
            {...attributes}
            className="flex h-8 w-8 cursor-grab items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground active:cursor-grabbing transition-colors"
            title="Drag untuk mengubah urutan"
            tabIndex={-1}
        >
            <GripVertical className="h-4 w-4" strokeWidth={1.8} />
        </button>
    );
}

/* ── Status badge ────────────────────────────────────── */
function StatusBadge({ active }) {
    return active ? (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />Aktif
        </span>
    ) : (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />Nonaktif
        </span>
    );
}

/* ── Sortable row ────────────────────────────────────── */
function PaymentMethodRow({ method, idx, toggling, onToggle, onDelete, isDragOverlay = false }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: method.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
    };

    return (
        <div
            ref={isDragOverlay ? undefined : setNodeRef}
            style={isDragOverlay ? undefined : style}
            className={`flex items-center gap-2 sm:gap-3 border-b border-border bg-background px-3 sm:px-4 py-3 last:border-0 transition-colors ${
                isDragging ? "bg-primary/10" : "hover:bg-[rgb(var(--color-table-hover))]"
            } ${isDragOverlay ? "rounded-2xl shadow-xl ring-1 ring-border" : ""} ${!method.is_active ? "opacity-60" : ""}`}
        >
            {/* Drag handle */}
            <DragHandle listeners={listeners} attributes={attributes} />

            {/* Position */}
            <span className="hidden sm:inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                {idx + 1}
            </span>

            {/* Info */}
            <div className="min-w-0 flex-1 flex items-center gap-2">
                {method.image ? (
                    <img
                        src={`/storage/${method.image}`}
                        alt={method.name}
                        className="h-8 w-8 shrink-0 rounded-lg object-cover border border-border"
                    />
                ) : (
                    (() => {
                        const Icon = (TYPE_META[method.type] ?? TYPE_META.card).icon;
                        return (
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                                <Icon className="h-4 w-4" strokeWidth={1.8} />
                            </span>
                        );
                    })()
                )}
                <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{method.name}</p>
                    <p className="truncate font-mono text-xs text-muted-foreground">{method.code}</p>
                </div>
            </div>

            {/* Type + Provider (desktop) */}
            <div className="hidden sm:flex items-center gap-2">
                <TypeBadge type={method.type} />
            </div>
            <span className="hidden sm:inline-block text-xs text-muted-foreground w-24 truncate text-right">{method.provider || "—"}</span>

            {/* Status toggle */}
            <button onClick={() => onToggle(method)} disabled={toggling === method.id} className="shrink-0 disabled:opacity-50">
                <StatusBadge active={method.is_active} />
            </button>

            {/* Actions */}
            <div className="flex items-center gap-1">
                <Link
                    href={route("admin.payment-methods.edit", method.id)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-primary/10 hover:text-primary"
                    title="Edit"
                >
                    <Pencil className="h-4 w-4" strokeWidth={1.8} />
                </Link>
                {method.type === "cash" || method.type === "debt" ? (
                    <span
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/40"
                        title={`${method.type === "cash" ? "Tunai" : "Hutang/Kasbon"} wajib, tidak bisa dihapus`}
                    >
                        <Lock className="h-3.5 w-3.5" strokeWidth={1.8} />
                    </span>
                ) : (
                    <button
                        onClick={() => onDelete(method)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                        title="Hapus"
                    >
                        <Trash2 className="h-4 w-4" strokeWidth={1.8} />
                    </button>
                )}
            </div>
        </div>
    );
}

/* ── Main component ─────────────────────────────────── */
export default function Index({ paymentMethods: initialMethods }) {
    const [search, setSearch] = useState("");
    const [target, setTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [toggling, setToggling] = useState(null);
    const [methods, setMethods] = useState(initialMethods);
    const [activeId, setActiveId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    );

    const filtered = useMemo(() => {
        if (!search.trim()) return methods;
        const q = search.toLowerCase().trim();
        return methods.filter((m) => m.name?.toLowerCase().includes(q) || m.code?.toLowerCase().includes(q));
    }, [methods, search]);

    const sorted = useMemo(() => {
        return [...filtered].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    }, [filtered]);

    const activeMethod = activeId ? methods.find((m) => m.id === activeId) : null;

    const handleToggle = (method) => {
        setToggling(method.id);
        router.patch(route("admin.payment-methods.toggle", method.id), {}, {
            preserveScroll: true,
            onFinish: () => setToggling(null),
        });
    };

    const handleDelete = () => {
        if (!target) return;
        setDeleting(true);
        router.delete(route("admin.payment-methods.destroy", target.id), {
            preserveScroll: true,
            onFinish: () => { setDeleting(false); setTarget(null); },
        });
    };

    /* ── Drag & drop handlers ── */
    const handleDragStart = ({ active }) => {
        setActiveId(active.id);
        setSaved(false);
    };

    const handleDragEnd = ({ active, over }) => {
        setActiveId(null);
        if (!over || active.id === over.id) return;

        const oldIdx = sorted.findIndex((m) => m.id === active.id);
        const newIdx = sorted.findIndex((m) => m.id === over.id);
        const reordered = arrayMove(sorted, oldIdx, newIdx).map((m, i) => ({
            ...m,
            sort_order: i,
        }));
        setMethods(reordered);

        // Simpan ke server per item
        setSaving(true);
        const csrf = document.querySelector('meta[name="csrf-token"]')?.content;
        const promises = reordered.map((m) =>
            axios.patch(
                route("admin.payment-methods.sort", m.id),
                { sort_order: m.sort_order },
                { headers: { "X-CSRF-TOKEN": csrf } },
            ),
        );

        Promise.all(promises)
            .then(() => {
                setSaved(true);
                setTimeout(() => setSaved(false), 2000);
            })
            .catch(() => setMethods(initialMethods))
            .finally(() => setSaving(false));
    };

    const stats = useMemo(() => ({
        total: methods.length,
        active: methods.filter((m) => m.is_active).length,
        inactive: methods.filter((m) => !m.is_active).length,
        types: new Set(methods.map((m) => m.type)).size,
    }), [methods]);

    return (
        <AuthenticatedLayout
            header={
                <div className="leading-tight">
                    <div className="text-sm font-semibold text-foreground">Metode Pembayaran</div>
                    <div className="text-[11px] text-muted-foreground">Atur urutan &amp; metode bayar di kasir</div>
                </div>
            }
        >
            <PageHeader
                title="Metode Pembayaran"
                breadcrumbs={["Admin", "Pengaturan", "Metode Pembayaran"]}
                heading="Metode Pembayaran"
                description="Atur metode pembayaran yang bisa dipilih kasir saat transaksi, beserta urutan tampilnya."
                action={
                    <div className="flex items-center gap-2">
                        {saving && (
                            <span className="flex items-center gap-1.5 rounded-xl bg-muted px-3 py-2 text-xs font-medium text-muted-foreground">
                                <span className="h-3 w-3 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                                Menyimpan...
                            </span>
                        )}
                        {saved && !saving && (
                            <span className="flex items-center gap-1.5 rounded-xl bg-success/10 px-3 py-2 text-xs font-medium text-success">
                                <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                                Tersimpan
                            </span>
                        )}
                    </div>
                }
            />

            {/* Stats */}
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-border border-l-4 border-l-muted-foreground/30 bg-card p-4 shadow-sm">
                    <p className="text-xs font-medium text-muted-foreground">Total Metode</p>
                    <p className="mt-1 text-xl font-bold text-foreground">{stats.total}</p>
                </div>
                <div className="rounded-2xl border border-border border-l-4 border-l-success bg-card p-4 shadow-sm">
                    <p className="text-xs font-medium text-muted-foreground">Aktif</p>
                    <p className="mt-1 text-xl font-bold text-foreground">{stats.active}</p>
                </div>
                <div className="rounded-2xl border border-border border-l-4 border-l-muted-foreground/30 bg-card p-4 shadow-sm">
                    <p className="text-xs font-medium text-muted-foreground">Nonaktif</p>
                    <p className="mt-1 text-xl font-bold text-foreground">{stats.inactive}</p>
                </div>
                <div className="rounded-2xl border border-border border-l-4 border-l-primary bg-card p-4 shadow-sm">
                    <p className="text-xs font-medium text-muted-foreground">Tipe</p>
                    <p className="mt-1 text-xl font-bold text-foreground">{stats.types}</p>
                </div>
            </div>

            {/* Table card */}
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                {/* Toolbar */}
                <div className="border-b border-border p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="relative flex-1">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.8} />
                            <input
                                type="text"
                                placeholder="Cari metode..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="block w-full rounded-xl border border-input bg-background text-foreground py-2.5 pl-10 pr-4 text-sm shadow-sm transition outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                            />
                        </div>
                        {/* Desktop & tablet: tombol menyatu dengan toolbar tabel.
                            Di mobile disembunyikan, digantikan FAB di pojok kanan bawah. */}
                        <Button
                            as={Link}
                            href={route("admin.payment-methods.create")}
                            icon={Plus}
                            size="lg"
                            className="hidden shrink-0 sm:inline-flex"
                        >
                            Tambah Metode
                        </Button>
                    </div>
                    <div className="flex items-center justify-between pt-4">
                        <p className="text-xs text-muted-foreground">
                            Menampilkan{' '}
                            <span className="font-semibold text-foreground">{sorted.length}</span>{' '}
                            dari{' '}
                            <span className="font-semibold text-foreground">{methods.length}</span>{' '}
                            metode
                        </p>
                    </div>
                </div>

                {sorted.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                            <Inbox className="h-7 w-7 text-muted-foreground/50" strokeWidth={1.6} />
                        </div>
                        <p className="mt-4 text-sm font-medium text-muted-foreground">
                            {search ? "Metode tidak ditemukan" : "Belum ada metode pembayaran"}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            {search ? "Coba kata kunci lain" : 'Klik "Tambah Metode" untuk menambahkan'}
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Column header */}
                        <div className="flex items-center gap-2 sm:gap-3 border-b border-border bg-popover px-3 sm:px-4 py-2.5 text-xs uppercase tracking-wide text-card-foreground">
                            <div className="w-8" />
                            <div className="hidden sm:block w-7" />
                            <div className="flex-1 font-semibold">Metode</div>
                            <div className="hidden sm:block font-semibold">Tipe</div>
                            <div className="hidden sm:block w-24 text-right font-semibold">Provider</div>
                            <div className="font-semibold">Status</div>
                            <div className="w-18" />
                        </div>

                        {/* Drag & drop list */}
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                            <SortableContext items={sorted.map((m) => m.id)} strategy={verticalListSortingStrategy}>
                                {sorted.map((m, idx) => (
                                    <PaymentMethodRow
                                        key={m.id}
                                        method={m}
                                        idx={idx}
                                        toggling={toggling}
                                        onToggle={handleToggle}
                                        onDelete={setTarget}
                                    />
                                ))}
                            </SortableContext>

                            <DragOverlay dropAnimation={{ duration: 150, easing: "cubic-bezier(0.18,0.67,0.6,1.22)" }}>
                                {activeMethod && (
                                    <PaymentMethodRow
                                        method={activeMethod}
                                        idx={sorted.findIndex((m) => m.id === activeMethod.id)}
                                        toggling={null}
                                        onToggle={() => {}}
                                        onDelete={() => {}}
                                        isDragOverlay
                                    />
                                )}
                            </DragOverlay>
                        </DndContext>

                        {/* Footer hint */}
                        <div className="flex items-center gap-2 border-t border-border bg-muted px-5 py-3">
                            <Info className="h-3.5 w-3.5 shrink-0 text-muted-foreground" strokeWidth={1.8} />
                            <p className="text-[11px] text-muted-foreground">
                                Tarik baris untuk mengubah urutan tampilan metode. Perubahan disimpan otomatis.
                            </p>
                        </div>
                    </>
                )}
            </div>

            {/* FAB — hanya mobile. Di sm ke atas tombol Tambah sudah ada di toolbar tabel. */}
            <Link
                href={route("admin.payment-methods.create")}
                className="fixed bottom-6 right-6 z-30 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:hidden"
                aria-label="Tambah metode pembayaran"
            >
                <Plus className="h-6 w-6" strokeWidth={2.2} />
            </Link>

            <ConfirmDeleteModal
                open={!!target}
                title="Hapus metode pembayaran?"
                description={target ? `"${target.name}" akan dihapus permanen. Jika sudah pernah dipakai dalam transaksi, hapus tidak bisa dilakukan — nonaktifkan saja.` : ""}
                processing={deleting}
                onConfirm={handleDelete}
                onClose={() => !deleting && setTarget(null)}
            />
        </AuthenticatedLayout>
    );
}
