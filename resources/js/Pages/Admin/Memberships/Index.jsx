import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router, useForm, usePage } from "@inertiajs/react";
import { useEffect, useMemo, useRef, useState } from "react";
import CurrencyInput from "@/Components/ui/CurrencyInput";
import SearchableSelect from "@/Components/ui/SearchableSelect";
import ConfirmDeleteModal from "@/Pages/Admin/Products/ConfirmDeleteModal";

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
                <div className="flex w-full items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold text-slate-800">
                        Membership
                    </h2>
                    <button
                        onClick={openCreate}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:from-indigo-600 hover:to-violet-700"
                    >
                        <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 4.5v15m7.5-7.5h-15"
                            />
                        </svg>
                        <span className="hidden sm:inline">
                            Tambah Membership
                        </span>
                        <span className="sm:hidden">Tambah</span>
                    </button>
                </div>
            }
        >
            <Head title="Membership" />

            {/* Flash */}
            {flash?.success && (
                <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {flash.success}
                </div>
            )}
            {flash?.error && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {flash.error}
                </div>
            )}

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                {/* Toolbar */}
                <div className=" border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative w-full sm:max-w-xs">
                        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                            <svg
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.8}
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                                />
                            </svg>
                        </span>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari nama, kode..."
                            className="block w-full rounded-xl border border-slate-300 py-2.5 pl-9 pr-3 text-sm shadow-sm transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                        />
                    </div>
                    <p className="pt-4 text-xs text-slate-500">
                        Menampilkan{" "}
                        <span className="font-semibold text-slate-700">
                            {filtered.length}
                        </span>{" "}
                        dari{" "}
                        <span className="font-semibold text-slate-700">
                            {memberships.length}
                        </span>{" "}
                        membership
                    </p>
                </div>

                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                            <svg
                                className="h-8 w-8 text-slate-400"
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
                        <h3 className="mt-4 text-base font-semibold text-slate-800">
                            {search
                                ? "Membership tidak ditemukan"
                                : "Belum ada membership"}
                        </h3>
                        <p className="mt-1 max-w-sm text-sm text-slate-500">
                            {search
                                ? "Coba kata kunci lain."
                                : "Mulai dengan menambahkan membership pertama untuk program loyalitas pelanggan."}
                        </p>
                        {!search && (
                            <button
                                onClick={openCreate}
                                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:from-indigo-600 hover:to-violet-700"
                            >
                                <svg
                                    className="h-4 w-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={2}
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M12 4.5v15m7.5-7.5h-15"
                                    />
                                </svg>
                                Tambah Membership
                            </button>
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
        </AuthenticatedLayout>
    );
}

/* ------------------------------------------------------------------ */
/*  Modal – Create / Edit                                              */
/* ------------------------------------------------------------------ */
function MembershipModal({ open, editing, onClose }) {
    const { data, setData, post, patch, processing, errors, reset } = useForm({
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
        const payload = {
            ...data,
            price: data.price === "" ? 0 : data.price,
            discount_percent:
                data.discount_percent === "" ? 0 : data.discount_percent,
            point_multiplier:
                data.point_multiplier === ""
                    ? 1
                    : Number(data.point_multiplier),
            benefits: data.benefits
                ? data.benefits
                      .split("\n")
                      .map((b) => b.trim())
                      .filter(Boolean)
                : [],
        };

        if (editing) {
            patch(route("admin.memberships.update", editing.id), {
                data: payload,
                preserveScroll: true,
                onSuccess: () => onClose(),
            });
        } else {
            post(route("admin.memberships.store"), {
                data: payload,
                preserveScroll: true,
                onSuccess: () => onClose(),
            });
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
            {/* Backdrop */}
            <div
                onClick={() => !processing && onClose()}
                className={`fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-200 ${
                    show ? "opacity-100" : "opacity-0"
                }`}
            />

            {/* Modal */}
            <div
                role="dialog"
                aria-modal="true"
                className={`relative z-10 w-full max-w-lg transform rounded-2xl bg-white shadow-2xl transition-all duration-200 ${
                    show
                        ? "translate-y-0 scale-100 opacity-100"
                        : "translate-y-3 scale-95 opacity-0"
                }`}
            >
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
                    <h3 className="text-base font-semibold text-slate-800">
                        {editing ? "Edit Membership" : "Tambah Membership"}
                    </h3>
                    <button
                        onClick={onClose}
                        disabled={processing}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-60"
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
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 p-6">
                    {/* Code */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700">
                            Kode <span className="text-red-500">*</span>
                        </label>
                        <input
                            ref={firstInput}
                            type="text"
                            value={data.code}
                            onChange={(e) => setData("code", e.target.value)}
                            maxLength={50}
                            className="mt-1 block w-full rounded-xl border-slate-300 text-sm shadow-sm transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                            placeholder="Contoh: GOLD01"
                        />
                        {errors.code && (
                            <p className="mt-1 text-xs text-red-500">
                                {errors.code}
                            </p>
                        )}
                    </div>

                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700">
                            Nama <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={data.name}
                            onChange={(e) => setData("name", e.target.value)}
                            maxLength={255}
                            className="mt-1 block w-full rounded-xl border-slate-300 text-sm shadow-sm transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                            placeholder="Contoh: Gold Member"
                        />
                        {errors.name && (
                            <p className="mt-1 text-xs text-red-500">
                                {errors.name}
                            </p>
                        )}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700">
                            Deskripsi
                        </label>
                        <textarea
                            value={data.description}
                            onChange={(e) =>
                                setData("description", e.target.value)
                            }
                            maxLength={500}
                            rows={2}
                            className="mt-1 block w-full rounded-xl border-slate-300 text-sm shadow-sm transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                            placeholder="Deskripsi singkat membership..."
                        />
                        {errors.description && (
                            <p className="mt-1 text-xs text-red-500">
                                {errors.description}
                            </p>
                        )}
                    </div>

                    {/* Duration */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label
                                className="block text-sm font-medium text-slate-700"
                                title="Satuan waktu keanggotaan (hari/bulan/tahun/kunjungan)"
                            >
                                Tipe Durasi{" "}
                                <span className="text-red-500">*</span>
                                <span className="ml-1 cursor-help text-slate-400">
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
                                <p className="mt-1 text-xs text-red-500">
                                    {errors.duration_type}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">
                                Nilai <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                min={1}
                                value={data.duration_value}
                                onChange={(e) =>
                                    setData("duration_value", e.target.value)
                                }
                                className="mt-1 block w-full rounded-xl border-slate-300 text-sm shadow-sm transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                placeholder="1"
                            />
                            {errors.duration_value && (
                                <p className="mt-1 text-xs text-red-500">
                                    {errors.duration_value}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Price */}
                    <div>
                        <label
                            className="block text-sm font-medium text-slate-700"
                            title="Harga untuk bergabung ke membership ini. Isi 0 jika gratis."
                        >
                            Harga <span className="text-red-500">*</span>
                            <span className="ml-1 cursor-help text-slate-400">
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
                            <p className="mt-1 text-xs text-red-500">
                                {errors.price}
                            </p>
                        )}
                    </div>

                    {/* Discount & Point Multiplier */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label
                                className="block text-sm font-medium text-slate-700"
                                title="Persentase diskon otomatis saat transaksi. Kosongkan jika tidak ada."
                            >
                                Diskon (%)
                                <span className="ml-1 cursor-help text-slate-400">
                                    ⓘ
                                </span>
                            </label>
                            <input
                                type="number"
                                min={0}
                                max={100}
                                step={0.01}
                                value={data.discount_percent}
                                onChange={(e) =>
                                    setData("discount_percent", e.target.value)
                                }
                                className="mt-1 block w-full rounded-xl border-slate-300 text-sm shadow-sm transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                placeholder="0"
                            />
                            {errors.discount_percent && (
                                <p className="mt-1 text-xs text-red-500">
                                    {errors.discount_percent}
                                </p>
                            )}
                        </div>
                        <div>
                            <label
                                className="block text-sm font-medium text-slate-700"
                                title="Berapa kali lipat poin didapat. 1 = normal, 2 = 2x lipat."
                            >
                                Multiplier Poin
                                <span className="ml-1 cursor-help text-slate-400">
                                    ⓘ
                                </span>
                            </label>
                            <input
                                type="number"
                                min={1}
                                step={1}
                                value={data.point_multiplier}
                                onChange={(e) =>
                                    setData("point_multiplier", e.target.value)
                                }
                                className="mt-1 block w-full rounded-xl border-slate-300 text-sm shadow-sm transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                placeholder="1"
                            />
                            {errors.point_multiplier && (
                                <p className="mt-1 text-xs text-red-500">
                                    {errors.point_multiplier}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Benefits */}
                    <div>
                        <label
                            className="block text-sm font-medium text-slate-700"
                            title="Benefit yang didapat member. Tulis satu per baris. Contoh: Gratis ongkir, Diskon 10%"
                        >
                            Benefit{" "}
                            <span className="font-normal text-slate-400">
                                (tulis satu per baris)
                            </span>
                        </label>
                        <textarea
                            value={data.benefits}
                            onChange={(e) =>
                                setData("benefits", e.target.value)
                            }
                            rows={3}
                            className="mt-1 block w-full rounded-xl border-slate-300 text-sm shadow-sm transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                            placeholder="Gratis ongkir&#10;Diskon 10%&#10;Priority support"
                        />
                        {errors.benefits && (
                            <p className="mt-1 text-xs text-red-500">
                                {errors.benefits}
                            </p>
                        )}
                        {previewBenefits.length > 0 && (
                            <div className="mt-2 space-y-1">
                                <p className="text-xs font-medium text-slate-500">
                                    Preview:
                                </p>
                                <ul className="list-inside list-disc space-y-0.5 rounded-lg bg-slate-50 px-3 py-2">
                                    {previewBenefits.map((b, i) => (
                                        <li
                                            key={i}
                                            className="text-xs text-slate-600"
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
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 transition focus:ring-2 focus:ring-indigo-200"
                        />
                        <span className="text-sm text-slate-700">Aktif</span>
                    </label>

                    {/* Buttons */}
                    <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={processing}
                            className="inline-flex items-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:from-indigo-600 hover:to-violet-700 disabled:opacity-60"
                        >
                            {processing && (
                                <svg
                                    className="h-4 w-4 animate-spin"
                                    viewBox="0 0 24 24"
                                    fill="none"
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
                            )}
                            {editing ? "Simpan" : "Buat"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Table / List                                                         */
/* ------------------------------------------------------------------ */
function StatusBadge({ active }) {
    return active ? (
        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
            Aktif
        </span>
    ) : (
        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
            Nonaktif
        </span>
    );
}

function MemberBadge({ count }) {
    if (!count && count !== 0) return null;
    return (
        <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-600">
            {count} member
        </span>
    );
}

function RowActions({ item, onEdit, onDelete }) {
    return (
        <div className="flex items-center justify-end gap-1">
            <button
                onClick={() => onEdit(item)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-indigo-50 hover:text-indigo-600"
                title="Edit"
            >
                <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.7}
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"
                    />
                </svg>
            </button>
            <button
                onClick={() => onDelete(item)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                title="Hapus"
            >
                <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.7}
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                    />
                </svg>
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
                    <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            <th className="px-4 py-3.5">Kode</th>
                            <th className="px-4 py-3.5">Nama</th>
                            <th className="px-4 py-3.5">Durasi</th>
                            <th className="px-4 py-3.5 text-right">Harga</th>
                            <th className="px-4 py-3.5 text-center">Diskon</th>
                            <th className="px-4 py-3.5 text-center">Member</th>
                            <th className="px-4 py-3.5 text-center">Status</th>
                            <th className="px-4 py-3.5 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {items.map((m) => (
                            <tr
                                key={m.id}
                                className="transition hover:bg-slate-50/70"
                            >
                                <td className="px-4 py-4">
                                    <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-mono font-semibold text-slate-700">
                                        {m.code}
                                    </span>
                                </td>
                                <td className="px-4 py-4">
                                    <div className="min-w-0">
                                        <p className="font-medium text-slate-800">
                                            {m.name}
                                        </p>
                                        {m.description && (
                                            <p className="mt-0.5 max-w-[200px] truncate text-xs text-slate-400">
                                                {m.description}
                                            </p>
                                        )}
                                    </div>
                                </td>
                                <td className="px-4 py-4 text-slate-600">
                                    {formatDuration(
                                        m.duration_type,
                                        m.duration_value,
                                    )}
                                </td>
                                <td className="px-4 py-4 text-right font-medium text-slate-800">
                                    {formatIDR(m.price)}
                                </td>
                                <td className="px-4 py-4 text-center">
                                    {m.discount_percent ? (
                                        <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                                            {m.discount_percent}%
                                        </span>
                                    ) : (
                                        <span className="text-slate-400">
                                            —
                                        </span>
                                    )}
                                </td>
                                <td className="px-4 py-4 text-center">
                                    <MemberBadge
                                        count={m.customer_memberships_count}
                                    />
                                </td>
                                <td className="px-4 py-4 text-center">
                                    <StatusBadge active={m.is_active} />
                                </td>
                                <td className="px-4 py-4">
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
            <div className="divide-y divide-slate-100 md:hidden">
                {items.map((m) => (
                    <div key={m.id} className="p-4">
                        <div className="flex items-start justify-between">
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-mono font-semibold text-slate-700">
                                        {m.code}
                                    </span>
                                    <StatusBadge active={m.is_active} />
                                </div>
                                <p className="mt-1 font-medium text-slate-800">
                                    {m.name}
                                </p>
                                {m.description && (
                                    <p className="mt-0.5 text-sm text-slate-400 line-clamp-2">
                                        {m.description}
                                    </p>
                                )}
                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                    <span className="text-sm text-slate-600">
                                        {formatDuration(
                                            m.duration_type,
                                            m.duration_value,
                                        )}
                                    </span>
                                    <span className="text-sm font-medium text-slate-800">
                                        {formatIDR(m.price)}
                                    </span>
                                    {m.discount_percent ? (
                                        <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
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
                                    className="inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-medium text-indigo-600 transition hover:bg-indigo-50"
                                >
                                    <svg
                                        className="h-3.5 w-3.5"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth={1.7}
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"
                                        />
                                    </svg>
                                    Edit
                                </button>
                                <button
                                    onClick={() => onDelete(m)}
                                    className="inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
                                >
                                    <svg
                                        className="h-3.5 w-3.5"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth={1.7}
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                                        />
                                    </svg>
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
