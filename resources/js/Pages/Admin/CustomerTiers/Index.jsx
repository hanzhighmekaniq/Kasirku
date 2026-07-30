import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import LoyaltyTabs from "@/Components/LoyaltyTabs";
import PageHeader from "@/Components/PageHeader";
import Button from "@/Components/ui/Button";
import Checkbox from "@/Components/ui/Checkbox";
import ConfirmDeleteModal from "@/Components/ConfirmDeleteModal";
import { Head, router, useForm, usePage } from "@inertiajs/react";
import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import {
    ArrowDown,
    ArrowUp,
    Check,
    GripVertical,
    Info,
    Layers,
    Pencil,
    Plus,
    Trash2,
    X,
} from "lucide-react";
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

/**
 * Kelas warna ditulis lengkap (bukan dirakit dari variabel) supaya Tailwind
 * tidak membuangnya saat build. Kunci di sini harus sama dengan
 * CustomerTier::COLORS di backend.
 */
const COLOR_STYLES = {
    slate: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    yellow: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
    indigo: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    sky: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    rose: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
};

const COLOR_DOTS = {
    slate: "bg-slate-500",
    amber: "bg-amber-500",
    yellow: "bg-yellow-500",
    indigo: "bg-indigo-500",
    emerald: "bg-emerald-500",
    sky: "bg-sky-500",
    rose: "bg-rose-500",
    violet: "bg-violet-500",
};

export function tierBadgeClass(color) {
    return COLOR_STYLES[color] ?? COLOR_STYLES.slate;
}

function TierRow({
    tier,
    position,
    total,
    onEdit,
    onDelete,
    onMove,
    isDragOverlay = false,
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
        useSortable({ id: tier.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
    };

    const usage =
        (tier.customers_count ?? 0) +
        (tier.memberships_count ?? 0) +
        (tier.promotions_count ?? 0);

    return (
        <div
            ref={isDragOverlay ? undefined : setNodeRef}
            style={isDragOverlay ? undefined : style}
            className={`flex items-center gap-2 border-b border-border bg-background px-3 py-3 last:border-0 transition-colors sm:gap-3 sm:px-4 ${
                isDragging ? "bg-primary/5" : "hover:bg-muted/50"
            } ${isDragOverlay ? "rounded-2xl shadow-xl ring-1 ring-border" : ""} ${
                !tier.is_active ? "opacity-60" : ""
            }`}
        >
            <button
                {...listeners}
                {...attributes}
                className="flex h-8 w-8 shrink-0 cursor-grab items-center justify-center rounded-lg text-muted-foreground/50 transition-colors hover:bg-muted hover:text-muted-foreground active:cursor-grabbing"
                title="Tarik untuk mengubah urutan"
                tabIndex={-1}
            >
                <GripVertical className="h-4 w-4" strokeWidth={1.8} />
            </button>

            {/* Level — angka inilah yang dipakai sistem untuk menentukan
                tier mana lebih tinggi, bukan urutan baris di database. */}
            <span className="inline-flex h-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 px-2 text-xs font-bold text-primary">
                Lvl {position}
            </span>

            <div className="min-w-0 flex-1">
                <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${tierBadgeClass(tier.color)}`}
                >
                    <span className={`h-1.5 w-1.5 rounded-full ${COLOR_DOTS[tier.color] ?? COLOR_DOTS.slate}`} />
                    {tier.name}
                </span>
                <p className="mt-1 truncate text-[11px] text-muted-foreground">
                    {usage > 0
                        ? `Dipakai ${tier.customers_count ?? 0} pelanggan · ${tier.memberships_count ?? 0} membership · ${tier.promotions_count ?? 0} promo`
                        : "Belum dipakai"}
                    {!tier.is_active && " · nonaktif"}
                </p>
            </div>

            {/* Tombol panah — alternatif drag untuk layar sentuh & keyboard */}
            <div className="hidden items-center gap-0.5 sm:flex">
                <button
                    onClick={() => onMove(tier.id, -1)}
                    disabled={position === total}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-30"
                    title="Naikkan tier"
                >
                    <ArrowUp className="h-4 w-4" strokeWidth={1.8} />
                </button>
                <button
                    onClick={() => onMove(tier.id, 1)}
                    disabled={position === 1}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-30"
                    title="Turunkan tier"
                >
                    <ArrowDown className="h-4 w-4" strokeWidth={1.8} />
                </button>
            </div>

            <div className="flex shrink-0 items-center gap-1">
                <button
                    onClick={() => onEdit(tier)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-primary/10 hover:text-primary"
                    title="Edit"
                >
                    <Pencil className="h-4 w-4" strokeWidth={1.8} />
                </button>
                <button
                    onClick={() => onDelete(tier)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                    title="Hapus"
                >
                    <Trash2 className="h-4 w-4" strokeWidth={1.8} />
                </button>
            </div>
        </div>
    );
}

export default function Index({ tiers: initialTiers, colors }) {
    const { flash } = usePage().props;
    const [tiers, setTiers] = useState(initialTiers);
    const [activeId, setActiveId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [deleting, setDeleting] = useState(null);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        setTiers(initialTiers);
    }, [initialTiers]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    );

    // Tampil dari tertinggi ke terendah supaya hierarkinya terbaca alami.
    const ordered = useMemo(
        () => [...tiers].sort((a, b) => (b.rank ?? 0) - (a.rank ?? 0)),
        [tiers],
    );

    const activeTier = activeId ? tiers.find((t) => t.id === activeId) : null;

    /**
     * Simpan urutan baru. `ids` dikirim dari rank terendah ke tertinggi, sesuai
     * yang diharapkan backend (index 0 = rank 1).
     */
    const persistOrder = (topDownList) => {
        const ids = [...topDownList].reverse().map((t) => t.id);

        setSaving(true);
        setSaved(false);

        axios
            .post(route("admin.customer-tiers.reorder"), { ids })
            .then(() => {
                setSaved(true);
                setTimeout(() => setSaved(false), 2000);
            })
            .catch(() => setTiers(initialTiers))
            .finally(() => setSaving(false));
    };

    const applyOrder = (topDownList) => {
        const total = topDownList.length;
        setTiers(
            topDownList.map((tier, index) => ({ ...tier, rank: total - index })),
        );
        persistOrder(topDownList);
    };

    const handleDragEnd = ({ active, over }) => {
        setActiveId(null);
        if (!over || active.id === over.id) return;

        const from = ordered.findIndex((t) => t.id === active.id);
        const to = ordered.findIndex((t) => t.id === over.id);

        applyOrder(arrayMove(ordered, from, to));
    };

    /** Geser satu langkah. `direction` -1 = naik tier, +1 = turun tier. */
    const handleMove = (id, direction) => {
        const from = ordered.findIndex((t) => t.id === id);
        const to = from + direction;

        if (to < 0 || to >= ordered.length) return;

        applyOrder(arrayMove(ordered, from, to));
    };

    const confirmDelete = () => {
        if (!deleting) return;
        setProcessing(true);
        router.delete(route("admin.customer-tiers.destroy", deleting.id), {
            preserveScroll: true,
            onFinish: () => {
                setProcessing(false);
                setDeleting(null);
            },
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="leading-tight">
                    <div className="text-sm font-semibold text-foreground">
                        Level Tier
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                        Membership
                    </div>
                </div>
            }
        >
            <Head title="Level Tier Pelanggan" />
            <PageHeader
                title="Level Tier"
                breadcrumbs={["Admin", "Membership", "Level Tier"]}
                heading={
                    <>
                        Atur <span className="text-primary">Level Tier</span>{" "}
                        pelanggan
                    </>
                }
                description="Tier menentukan hierarki pelanggan. Urutan di sini yang dipakai sistem untuk menilai upgrade atau downgrade."
            />

            <LoyaltyTabs />

            {flash?.success && (
                <div className="mb-4 rounded-xl border border-success/20 bg-success/10 px-4 py-3 text-sm text-success">
                    {flash.success}
                </div>
            )}
            {flash?.error && (
                <div className="mb-4 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {flash.error}
                </div>
            )}

            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                {/* Toolbar — tombol tambah dipindah ke sini dari PageHeader.
                    Di mobile digantikan FAB kanan bawah. */}
                <div className="flex flex-col gap-3 border-b border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Tertinggi di atas
                        </span>
                        {saving && (
                            <span className="flex items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                                <span className="h-3 w-3 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                                Menyimpan...
                            </span>
                        )}
                        {saved && !saving && (
                            <span className="flex items-center gap-1.5 rounded-lg bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
                                <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                                Tersimpan
                            </span>
                        )}
                    </div>
                    <Button
                        onClick={() => {
                            setEditing(null);
                            setModalOpen(true);
                        }}
                        icon={Plus}
                        className="hidden sm:inline-flex sm:w-auto"
                    >
                        Tambah Tier
                    </Button>
                </div>

                {ordered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-muted/30">
                            <Layers
                                className="h-7 w-7 text-muted-foreground/50"
                                strokeWidth={1.6}
                            />
                        </div>
                        <h3 className="mt-4 text-base font-semibold text-foreground">
                            Belum ada tier
                        </h3>
                        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                            Tambahkan minimal satu tier agar membership bisa
                            memetakan levelnya.
                        </p>
                        <Button
                            onClick={() => {
                                setEditing(null);
                                setModalOpen(true);
                            }}
                            icon={Plus}
                            className="mt-5"
                        >
                            Tambah Tier
                        </Button>
                    </div>
                ) : (
                    <>
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragStart={({ active }) => setActiveId(active.id)}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={ordered.map((t) => t.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                {ordered.map((tier) => (
                                    <TierRow
                                        key={tier.id}
                                        tier={tier}
                                        position={tier.rank}
                                        total={ordered.length}
                                        onEdit={(t) => {
                                            setEditing(t);
                                            setModalOpen(true);
                                        }}
                                        onDelete={setDeleting}
                                        onMove={handleMove}
                                    />
                                ))}
                            </SortableContext>

                            <DragOverlay>
                                {activeTier && (
                                    <TierRow
                                        tier={activeTier}
                                        position={activeTier.rank}
                                        total={ordered.length}
                                        onEdit={() => {}}
                                        onDelete={() => {}}
                                        onMove={() => {}}
                                        isDragOverlay
                                    />
                                )}
                            </DragOverlay>
                        </DndContext>

                        <div className="flex items-start gap-2 border-t border-border bg-muted/50 px-5 py-3">
                            <Info
                                className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground"
                                strokeWidth={1.8}
                            />
                            <p className="text-[11px] text-muted-foreground">
                                Tarik baris atau pakai tombol panah untuk mengubah
                                hierarki. Untuk menyisipkan level di tengah,
                                tambahkan tier baru lalu geser ke posisinya.
                                Perubahan disimpan otomatis.
                            </p>
                        </div>
                    </>
                )}
            </div>

            {/* FAB — mobile only. Disembunyikan saat modal terbuka supaya tidak
                menimpa panelnya. */}
            {!modalOpen && !deleting && (
                <button
                    type="button"
                    onClick={() => {
                        setEditing(null);
                        setModalOpen(true);
                    }}
                    className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95 sm:hidden"
                    aria-label="Tambah tier"
                    title="Tambah Tier"
                >
                    <Plus className="h-6 w-6" strokeWidth={2} />
                </button>
            )}

            <TierModal
                open={modalOpen}
                editing={editing}
                colors={colors}
                onClose={() => {
                    setModalOpen(false);
                    setEditing(null);
                }}
            />

            <ConfirmDeleteModal
                open={!!deleting}
                title="Hapus tier?"
                description={
                    deleting
                        ? `Tier "${deleting.name}" akan dihapus permanen. Tier yang masih dipakai pelanggan, membership, atau promo tidak bisa dihapus.`
                        : "Tindakan ini tidak dapat dibatalkan."
                }
                confirmLabel="Hapus"
                processing={processing}
                onConfirm={confirmDelete}
                onClose={() => !processing && setDeleting(null)}
            />
        </AuthenticatedLayout>
    );
}

function TierModal({ open, editing, colors, onClose }) {
    const { data, setData, post, patch, processing, errors, reset } = useForm({
        name: "",
        color: "slate",
        is_active: true,
    });

    const firstInput = useRef(null);
    const [render, setRender] = useState(open);
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (editing) {
            setData({
                name: editing.name || "",
                color: editing.color || "slate",
                is_active: editing.is_active ?? true,
            });
        } else {
            reset();
        }
        firstInput.current?.focus();
    }, [editing, open]);

    useEffect(() => {
        if (open) {
            setRender(true);
            const t = requestAnimationFrame(() => setShow(true));
            return () => cancelAnimationFrame(t);
        }
        setShow(false);
        const t = setTimeout(() => setRender(false), 200);
        return () => clearTimeout(t);
    }, [open]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const options = { preserveScroll: true, onSuccess: () => onClose() };

        if (editing) {
            patch(route("admin.customer-tiers.update", editing.id), options);
        } else {
            post(route("admin.customer-tiers.store"), options);
        }
    };

    if (!render) return null;

    return (
        /* Modal dipusatkan vertikal & horizontal. `my-auto` pada panel membuat
           modal tetap terpusat saat isinya pendek, tapi ikut scroll (bukan
           terpotong) saat isinya lebih tinggi dari viewport. */
        <div className="fixed inset-0 z-50 flex min-h-full items-center justify-center overflow-y-auto p-4">
            <div
                onClick={() => !processing && onClose()}
                className={`fixed inset-0 bg-background/70 transition-opacity duration-200 ${
                    show ? "opacity-100" : "opacity-0"
                }`}
            />

            <div
                role="dialog"
                aria-modal="true"
                className={`relative z-10 my-auto w-full max-w-md transform rounded-2xl border border-border bg-popover text-popover-foreground shadow-2xl transition-all duration-200 ${
                    show
                        ? "translate-y-0 scale-100 opacity-100"
                        : "translate-y-3 scale-95 opacity-0"
                }`}
            >
                <div className="flex items-center justify-between border-b border-border px-6 py-4">
                    <h3 className="text-base font-semibold text-popover-foreground">
                        {editing ? "Edit Tier" : "Tambah Tier"}
                    </h3>
                    <button
                        onClick={onClose}
                        disabled={processing}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-60"
                    >
                        <X className="h-5 w-5" strokeWidth={1.8} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 p-6">
                    <div>
                        <label className="block text-sm font-medium text-foreground">
                            Nama Tier <span className="text-destructive">*</span>
                        </label>
                        <input
                            ref={firstInput}
                            type="text"
                            value={data.name}
                            required
                            maxLength={50}
                            onChange={(e) => setData("name", e.target.value)}
                            className={`mt-1 block w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm text-foreground shadow-sm outline-none transition placeholder:text-muted-foreground focus:ring-2 ${
                                errors.name
                                    ? "border-destructive focus:border-destructive focus:ring-destructive/20"
                                    : "border-input focus:border-ring focus:ring-ring/20"
                            }`}
                            placeholder="cth. Sultan, VIP, Barista"
                        />
                        {errors.name && (
                            <p className="mt-1 text-xs text-destructive">
                                {errors.name}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground">
                            Warna Badge
                        </label>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {colors.map((color) => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => setData("color", color)}
                                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium capitalize transition ${tierBadgeClass(color)} ${
                                        data.color === color
                                            ? "ring-2 ring-ring ring-offset-1 ring-offset-background"
                                            : ""
                                    }`}
                                >
                                    <span
                                        className={`h-1.5 w-1.5 rounded-full ${COLOR_DOTS[color] ?? COLOR_DOTS.slate}`}
                                    />
                                    {color}
                                </button>
                            ))}
                        </div>
                        {errors.color && (
                            <p className="mt-1 text-xs text-destructive">
                                {errors.color}
                            </p>
                        )}
                    </div>

                    <Checkbox
                        checked={data.is_active}
                        onChange={(e) => setData("is_active", e.target.checked)}
                        label="Aktif"
                    />

                    <p className="text-[11px] text-muted-foreground">
                        Posisi tier diatur dengan menggeser barisnya di daftar,
                        bukan di form ini.
                    </p>

                    <div className="-mx-6 -mb-6 mt-6 flex items-center justify-end gap-3 border-t border-border bg-muted/50 px-6 py-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={processing}
                        >
                            Batal
                        </Button>
                        <Button type="submit" loading={processing}>
                            {editing ? "Simpan" : "Buat"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
