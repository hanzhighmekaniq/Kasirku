import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader";
import { Head, router, useForm, usePage } from "@inertiajs/react";
import { useEffect, useMemo, useRef, useState } from "react";
import CurrencyInput from "@/Components/ui/CurrencyInput";
import SearchableSelect from "@/Components/ui/SearchableSelect";
import ConfirmDeleteModal from "@/Components/ConfirmDeleteModal";
import Button from "@/Components/ui/Button";
import { Plus, Search, Pencil, Trash2, X } from "lucide-react";

const DURATION_LABELS = {
    day: "Hari",
    month: "Bulan",
    year: "Tahun",
    visit: "Kunjungan",
};

function formatDuration(type, value) {
    const label = DURATION_LABELS[type] ?? type;
    return `${value} ${label}`;
}

function formatIDR(amount) {
    const n = parseFloat(amount) || 0;
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(n);
}

export default function Index({ memberships }) {
    const { flash } = usePage().props;
    const [search, setSearch] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [deleting, setDeleting] = useState(null);
    const [processing, setProcessing] = useState(false);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return memberships;
        return memberships.filter(
            (m) =>
                m.name.toLowerCase().includes(q) ||
                (m.code || "").toLowerCase().includes(q) ||
                (m.description || "").toLowerCase().includes(q),
        );
    }, [memberships, search]);

    const openCreate = () => {
        setEditing(null);
        setModalOpen(true);
    };

    const openEdit = (m) => {
        setEditing(m);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditing(null);
    };

    const confirmDelete = () => {
        if (!deleting) return;
        setProcessing(true);
        router.delete(route("admin.memberships.destroy", deleting.id), {
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
                        Membership
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                        Manajemen
                    </div>
                </div>
            }>
            <Head title="Membership" />
            <PageHeader
                title="Membership"
                breadcrumbs={["Admin", "Membership"]}
                heading={
                    <>
                        Kelola{" "}
                        <span className="text-primary">
                            Membership
                        </span>{" "}
                        pelanggan
                    </>
                }
                description="Kelola level loyalitas dan program membership pelanggan."
            />

            {/* Flash */}
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

            {/* Main Content Area */}
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                {/* Toolbar */}
                <div className="flex flex-col gap-4 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between bg-card">
                    <div className="flex flex-1 flex-col">
                        <div className="relative w-full sm:max-w-md">
                            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
                                <Search className="h-4 w-4" strokeWidth={1.8} />
                            </span>
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari nama, kode..."
                                className="block w-full rounded-xl border border-input bg-background py-2.5 pl-9 pr-3 text-sm text-foreground shadow-sm transition placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20"
                            />
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                            Menampilkan{" "}
                            <span className="font-semibold text-foreground">
                                {filtered.length}
                            </span>{" "}
                            dari{" "}
                            <span className="font-semibold text-foreground">
                                {memberships.length}
                            </span>
                        </p>
                    </div>
                    {/* Di mobile dipindah ke FAB kanan bawah */}
                    <Button onClick={openCreate} icon={Plus} className="hidden sm:inline-flex sm:w-auto">
                        Tambah Membership
                    </Button>
                </div>

                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-muted/30">
                            <svg
                                className="h-8 w-8 text-muted-foreground/50"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026c0 .999.575 1.909 1.46 2.33l6.937 3.298a3.75 3.75 0 001.706 0l6.937-3.298a2.623 2.623 0 001.46-2.33V6.375c0-.621-.504-1.125-1.125-1.125H3.375z"
                                />
                            </svg>
                        </div>
                        <h3 className="mt-4 text-base font-semibold text-foreground">
                            {search
                                ? "Membership tidak ditemukan"
                                : "Belum ada membership"}
                        </h3>
                        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                            {search
                                ? "Coba kata kunci lain."
                                : "Mulai dengan menambahkan membership pertama untuk program loyalitas pelanggan."}
                        </p>
                        {!search && (
                            <Button onClick={openCreate} icon={Plus} className="mt-5">
                                Tambah Membership
                            </Button>
                        )}
                    </div>
                ) : (
                    <MembershipList
                        items={filtered}
                        onEdit={openEdit}
                        onDelete={setDeleting}
                    />
                )}
            </div>

            {/* Create / Edit Modal */}
            <MembershipModal
                open={modalOpen}
                editing={editing}
                onClose={closeModal}
            />

            {/* Delete Confirmation Modal — reusable */}
            <ConfirmDeleteModal
                open={!!deleting}
                title="Hapus membership?"
                description={
                    deleting
                        ? `Membership "${deleting.name}" akan dihapus permanen.`
                        : "Tindakan ini tidak dapat dibatalkan."
                }
                confirmLabel="Hapus"
                processing={processing}
                onConfirm={confirmDelete}
                onClose={() => {
                    if (!processing) setDeleting(null);
                }}
            />

            {/* FAB — mobile only. Disembunyikan saat modal terbuka supaya tidak
                menimpa panelnya. */}
            {!modalOpen && !deleting && (
                <Button
                    onClick={openCreate}
                    icon={Plus}
                    className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-xl sm:hidden"
                    title="Tambah Membership"
                />
            )}
        </AuthenticatedLayout>
    );
}

/* ------------------------------------------------------------------ */
/*  Modal – Create / Edit                                              */
/* ------------------------------------------------------------------ */
const inp = (err) =>
    `mt-1 block w-full rounded-xl border py-2.5 px-3.5 text-sm bg-background border-input text-foreground placeholder:text-muted-foreground outline-none shadow-sm transition focus:ring-2 ${
        err
            ? "border-destructive focus:border-destructive focus:ring-destructive/20"
            : "focus:border-ring focus:ring-ring/20"
    }`;

function MembershipModal({ open, editing, onClose }) {
    const { data, setData, post, patch, processing, errors, reset, transform } = useForm({
        code: "",
        name: "",
        description: "",
        duration_type: "month",
        duration_value: 1,
        price: "",
        discount_percent: "",
        point_multiplier: 1,
        benefits: "",
        is_active: true,
    });

    const firstInput = useRef(null);
    const [render, setRender] = useState(open);
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (editing) {
            setData({
                code: editing.code || "",
                name: editing.name || "",
                description: editing.description || "",
                duration_type: editing.duration_type || "month",
                duration_value: editing.duration_value || 1,
                price: editing.price ?? "",
                discount_percent: editing.discount_percent ?? "",
                point_multiplier: editing.point_multiplier || 1,
                benefits: Array.isArray(editing.benefits)
                    ? editing.benefits.join("\n")
                    : editing.benefits || "",
                is_active: editing.is_active ?? true,
            });
        } else {
            reset();
        }
        firstInput.current?.focus();
    }, [editing, open]);

    // Animasi
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

        // Dipetakan lewat transform(), bukan opsi `data` pada post()/patch() —
        // useForm mengabaikan opsi itu, sehingga sebelumnya payload mentah yang
        // terkirim: `benefits` masih berupa string padahal backend memvalidasi
        // `nullable|array`, dan field kosong terkirim sebagai "" bukan angka.
        transform((form) => ({
            ...form,
            price: form.price === "" ? 0 : form.price,
            discount_percent:
                form.discount_percent === "" ? 0 : form.discount_percent,
            point_multiplier:
                form.point_multiplier === ""
                    ? 1
                    : Number(form.point_multiplier),
            duration_value:
                form.duration_value === "" ? 1 : Number(form.duration_value),
            benefits: form.benefits
                ? form.benefits
                      .split("\n")
                      .map((b) => b.trim())
                      .filter(Boolean)
                : [],
        }));

        const options = {
            preserveScroll: true,
            onSuccess: () => onClose(),
        };

        if (editing) {
            patch(route("admin.memberships.update", editing.id), options);
        } else {
            post(route("admin.memberships.store"), options);
        }
    };

    if (!render) return null;

    const previewBenefits = data.benefits
        ? data.benefits
              .split("\n")
              .map((b) => b.trim())
              .filter(Boolean)
        : [];

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto pt-10 pb-10">
            {/* Backdrop — tanpa backdrop-blur. Blur pada elemen full-screen
                memaksa compositor merender ulang seluruh viewport tiap frame,
                dan itu yang membuat modal terasa berat saat dibuka/ditutup. */}
            <div
                onClick={() => !processing && onClose()}
                className={`fixed inset-0 bg-background/70 transition-opacity duration-200 ${
                    show ? "opacity-100" : "opacity-0"
                }`}
            />

            {/* Modal */}
            <div
                role="dialog"
                aria-modal="true"
                className={`relative z-10 w-full max-w-lg transform rounded-2xl border border-border bg-popover text-popover-foreground shadow-2xl transition-all duration-200 ${
                    show
                        ? "translate-y-0 scale-100 opacity-100"
                        : "translate-y-3 scale-95 opacity-0"
                }`}
            >
                <div className="flex items-center justify-between border-b border-border px-6 py-4">
                    <h3 className="text-base font-semibold text-popover-foreground">
                        {editing ? "Edit Membership" : "Tambah Membership"}
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
                    {/* Code */}
                    <div>
                        <label className="block text-sm font-medium text-foreground">
                            Kode <span className="text-destructive">*</span>
                        </label>
                        <input
                            ref={firstInput}
                            type="text"
                            value={data.code}
                            required
                            onChange={(e) => setData("code", e.target.value)}
                            maxLength={50}
                            className={inp(errors.code)}
                            placeholder="Contoh: GOLD01"
                        />
                        {errors.code && (
                            <p className="mt-1 text-xs text-destructive">
                                {errors.code}
                            </p>
                        )}
                    </div>

                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-foreground">
                            Nama <span className="text-destructive">*</span>
                        </label>
                        <input
                            type="text"
                            value={data.name}
                            required
                            onChange={(e) => setData("name", e.target.value)}
                            maxLength={255}
                            className={inp(errors.name)}
                            placeholder="Contoh: Gold Member"
                        />
                        {errors.name && (
                            <p className="mt-1 text-xs text-destructive">
                                {errors.name}
                            </p>
                        )}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-foreground">
                            Deskripsi
                        </label>
                        <textarea
                            value={data.description}
                            onChange={(e) =>
                                setData("description", e.target.value)
                            }
                            maxLength={500}
                            rows={2}
                            className={inp(errors.description)}
                            placeholder="Deskripsi singkat membership..."
                        />
                        {errors.description && (
                            <p className="mt-1 text-xs text-destructive">
                                {errors.description}
                            </p>
                        )}
                    </div>

                    {/* Duration */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label
                                className="block text-sm font-medium text-foreground"
                                title="Satuan waktu keanggotaan (hari/bulan/tahun/kunjungan)"
                            >
                                Tipe Durasi{" "}
                                <span className="text-destructive">*</span>
                                <span className="ml-1 cursor-help text-muted-foreground">
                                    ⓘ
                                </span>
                            </label>
                            <SearchableSelect
                                options={[
                                    { id: "day", name: "Hari" },
                                    { id: "month", name: "Bulan" },
                                    { id: "year", name: "Tahun" },
                                    { id: "visit", name: "Kunjungan" },
                                ]}
                                value={data.duration_type}
                                onChange={(v) => setData("duration_type", v)}
                                placeholder="Pilih..."
                            />
                            {errors.duration_type && (
                                <p className="mt-1 text-xs text-destructive">
                                    {errors.duration_type}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground">
                                Nilai <span className="text-destructive">*</span>
                            </label>
                            <input
                                type="number"
                                min={1}
                                required
                                value={data.duration_value}
                                onChange={(e) =>
                                    setData("duration_value", e.target.value)
                                }
                                className={inp(errors.duration_value)}
                                placeholder="1"
                            />
                            {errors.duration_value && (
                                <p className="mt-1 text-xs text-destructive">
                                    {errors.duration_value}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Price */}
                    <div>
                        <label
                            className="block text-sm font-medium text-foreground"
                            title="Harga untuk bergabung ke membership ini. Isi 0 jika gratis."
                        >
                            Harga
                            <span className="ml-1.5 font-normal text-muted-foreground">
                                (kosongkan jika gratis)
                            </span>
                            <span className="ml-1 cursor-help text-muted-foreground">
                                ⓘ
                            </span>
                        </label>
                        <CurrencyInput
                            value={data.price}
                            onChange={(v) => setData("price", v)}
                            placeholder="0"
                            error={!!errors.price}
                        />
                        {errors.price && (
                            <p className="mt-1 text-xs text-destructive">
                                {errors.price}
                            </p>
                        )}
                    </div>

                    {/* Discount & Point Multiplier */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label
                                className="block text-sm font-medium text-foreground"
                                title="Persentase diskon otomatis saat transaksi. Kosongkan jika tidak ada."
                            >
                                Diskon (%) <span className="text-destructive">*</span>
                                <span className="ml-1 cursor-help text-muted-foreground">
                                    ⓘ
                                </span>
                            </label>
                            <input
                                type="number"
                                min={0}
                                max={100}
                                step={0.01}
                                required
                                value={data.discount_percent}
                                onChange={(e) =>
                                    setData("discount_percent", e.target.value)
                                }
                                className={inp(errors.discount_percent)}
                                placeholder="0"
                            />
                            {errors.discount_percent && (
                                <p className="mt-1 text-xs text-destructive">
                                    {errors.discount_percent}
                                </p>
                            )}
                        </div>
                        <div>
                            <label
                                className="block text-sm font-medium text-foreground"
                                title="Berapa kali lipat poin didapat. 1 = normal, 2 = 2x lipat."
                            >
                                Multiplier Poin <span className="text-destructive">*</span>
                                <span className="ml-1 cursor-help text-muted-foreground">
                                    ⓘ
                                </span>
                            </label>
                            <input
                                type="number"
                                min={1}
                                step={1}
                                required
                                value={data.point_multiplier}
                                onChange={(e) =>
                                    setData("point_multiplier", e.target.value)
                                }
                                className={inp(errors.point_multiplier)}
                                placeholder="1"
                            />
                            {errors.point_multiplier && (
                                <p className="mt-1 text-xs text-destructive">
                                    {errors.point_multiplier}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Benefits */}
                    <div>
                        <label
                            className="block text-sm font-medium text-foreground"
                            title="Benefit yang didapat member. Tulis satu per baris. Contoh: Gratis ongkir, Diskon 10%"
                        >
                            Benefit{" "}
                            <span className="font-normal text-muted-foreground">
                                (tulis satu per baris)
                            </span>
                        </label>
                        <textarea
                            value={data.benefits}
                            onChange={(e) =>
                                setData("benefits", e.target.value)
                            }
                            rows={3}
                            className={inp(errors.benefits)}
                            placeholder="Gratis ongkir&#10;Diskon 10%&#10;Priority support"
                        />
                        {errors.benefits && (
                            <p className="mt-1 text-xs text-destructive">
                                {errors.benefits}
                            </p>
                        )}
                        {previewBenefits.length > 0 && (
                            <div className="mt-2 space-y-1">
                                <p className="text-xs font-medium text-muted-foreground">
                                    Preview:
                                </p>
                                <ul className="list-inside list-disc space-y-0.5 rounded-lg bg-muted px-3 py-2">
                                    {previewBenefits.map((b, i) => (
                                        <li
                                            key={i}
                                            className="text-xs text-muted-foreground"
                                        >
                                            {b}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Active */}
                    <label className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            checked={data.is_active}
                            onChange={(e) =>
                                setData("is_active", e.target.checked)
                            }
                            className="h-4 w-4 rounded border-input text-primary bg-background shadow-sm focus:ring-ring/20 focus:ring-2 focus:ring-offset-0"
                        />
                        <span className="text-sm text-foreground">Aktif</span>
                    </label>

                    {/* Footer — bg-muted/50 sesuai standar modal di TOKEN_MAPPING */}
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

/* ------------------------------------------------------------------ */
/*  Table / List                                                         */
/* ------------------------------------------------------------------ */
/**
 * Penanda status aktif/nonaktif.
 *
 * Mengikuti standar Badge / Status Pill di TOKEN_MAPPING.md: status universal
 * wajib memakai token tema (`success` / `muted`), bukan warna hardcoded, supaya
 * ikut berubah mengikuti tema aktif. Titik warna ditambahkan sebagai penanda
 * visual — kontras latar `/10` sendiri memang tipis, tapi menaikkan opacity
 * akan menyimpang dari standar; titik solid menyelesaikannya tanpa itu.
 */
function StatusBadge({ active }) {
    return active ? (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            Aktif
        </span>
    ) : (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
            Nonaktif
        </span>
    );
}

function MemberBadge({ count }) {
    if (!count && count !== 0) return null;
    return (
        <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
            {count} member
        </span>
    );
}

function RowActions({ item, onEdit, onDelete }) {
    return (
        <div className="flex items-center justify-end gap-1">
            <button
                onClick={() => onEdit(item)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-primary/10 hover:text-primary"
                title="Edit"
            >
                <Pencil className="h-4 w-4" strokeWidth={1.7} />
            </button>
            <button
                onClick={() => onDelete(item)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-destructive transition hover:bg-destructive/10"
                title="Hapus"
            >
                <Trash2 className="h-4 w-4" strokeWidth={1.7} />
            </button>
        </div>
    );
}

function MembershipList({ items, onEdit, onDelete }) {
    return (
        <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-sm">
                    <thead className="bg-popover text-xs uppercase tracking-wide text-card-foreground">
                        <tr>
                            <th className="px-4 py-3 text-left font-semibold">Kode</th>
                            <th className="px-4 py-3 text-left font-semibold">Nama</th>
                            <th className="px-4 py-3 text-left font-semibold">Durasi</th>
                            <th className="px-4 py-3 text-right font-semibold">Harga</th>
                            <th className="px-4 py-3 text-center font-semibold">Diskon</th>
                            <th className="px-4 py-3 text-center font-semibold">Member</th>
                            <th className="px-4 py-3 text-center font-semibold">Status</th>
                            <th className="px-4 py-3 text-right font-semibold">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-background">
                        {items.map((m) => (
                            <tr
                                key={m.id}
                                className="transition hover:bg-[rgb(var(--color-table-hover))]"
                            >
                                <td className="px-4 py-3">
                                    <span className="inline-flex items-center rounded-lg bg-muted px-2.5 py-1 font-mono text-xs font-semibold text-foreground">
                                        {m.code}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="min-w-0">
                                        <p className="font-medium text-foreground">
                                            {m.name}
                                        </p>
                                        {m.description && (
                                            <p className="mt-0.5 max-w-[200px] truncate text-xs text-muted-foreground">
                                                {m.description}
                                            </p>
                                        )}
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-muted-foreground">
                                    {formatDuration(
                                        m.duration_type,
                                        m.duration_value,
                                    )}
                                </td>
                                <td className="px-4 py-3 text-right font-medium text-foreground">
                                    {formatIDR(m.price)}
                                </td>
                                <td className="px-4 py-3 text-center">
                                    {m.discount_percent ? (
                                        <span className="inline-flex items-center rounded-full bg-warning/10 px-2.5 py-0.5 text-xs font-medium text-warning">
                                            {m.discount_percent}%
                                        </span>
                                    ) : (
                                        <span className="text-muted-foreground">
                                            —
                                        </span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <MemberBadge
                                        count={m.customer_memberships_count}
                                    />
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <StatusBadge active={m.is_active} />
                                </td>
                                <td className="px-4 py-3">
                                    <RowActions
                                        item={m}
                                        onEdit={onEdit}
                                        onDelete={onDelete}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile cards */}
            <div className="divide-y divide-border md:hidden">
                {items.map((m) => (
                    <div key={m.id} className="p-4">
                        <div className="flex items-start justify-between">
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center rounded-lg bg-muted px-2 py-0.5 text-xs font-mono font-semibold text-foreground">
                                        {m.code}
                                    </span>
                                    <StatusBadge active={m.is_active} />
                                </div>
                                <p className="mt-1 font-medium text-foreground">
                                    {m.name}
                                </p>
                                {m.description && (
                                    <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">
                                        {m.description}
                                    </p>
                                )}
                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                    <span className="text-sm text-muted-foreground">
                                        {formatDuration(
                                            m.duration_type,
                                            m.duration_value,
                                        )}
                                    </span>
                                    <span className="text-sm font-medium text-foreground">
                                        {formatIDR(m.price)}
                                    </span>
                                    {m.discount_percent ? (
                                        <span className="inline-flex items-center rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">
                                            Diskon {m.discount_percent}%
                                        </span>
                                    ) : null}
                                    <MemberBadge
                                        count={m.customer_memberships_count}
                                    />
                                </div>
                            </div>
                            <div className="ml-3 flex shrink-0 items-center gap-1">
                                <button
                                    onClick={() => onEdit(m)}
                                    className="inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-medium text-primary transition hover:bg-primary/10"
                                >
                                    <Pencil className="h-3.5 w-3.5" strokeWidth={1.7} />
                                    Edit
                                </button>
                                <button
                                    onClick={() => onDelete(m)}
                                    className="inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-medium text-destructive transition hover:bg-destructive/10"
                                >
                                    <Trash2 className="h-3.5 w-3.5" strokeWidth={1.7} />
                                    Hapus
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}
