import { useMemo, useState } from "react";
import { Head, router, usePage } from "@inertiajs/react";
import {
    AlertTriangle,
    ArrowRight,
    Check,
    Loader2,
    MapPin,
    Search,
} from "lucide-react";

/**
 * Langkah "Pilih Cabang" setelah login.
 *
 * Tampilannya sengaja memakai bahasa visual yang SAMA dengan halaman login
 * (resources/js/Pages/Auth/Login.jsx): band gelap di kiri, kartu hairline di
 * kanan, palet paten `.dv-auth` dari resources/css/app.css. Jadi di file ini
 * jangan pakai utility yang terikat theme engine user (`bg-primary`,
 * `text-foreground`, `rounded-lg`) — pakai kelas `dv-*`.
 */

/** Di atas jumlah ini daftar cabang dapat kolom pencarian. */
const SEARCH_THRESHOLD = 6;

export default function SelectBranch({ branches = [], storeName }) {
    const { errors = {}, flash } = usePage().props;
    const [selected, setSelected] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [query, setQuery] = useState("");

    const showSearch = branches.length > SEARCH_THRESHOLD;

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return branches;

        return branches.filter(
            (branch) =>
                (branch.name ?? "").toLowerCase().includes(q) ||
                (branch.code ?? "").toLowerCase().includes(q) ||
                (branch.address ?? "").toLowerCase().includes(q),
        );
    }, [branches, query]);

    const handleSelect = (branchId) => {
        if (submitting) return;
        setSelected(branchId);
        setSubmitting(true);
        router.post(
            route("admin.branch.select.post"),
            { branch_id: branchId },
            { onFinish: () => setSubmitting(false) },
        );
    };

    const year = new Date().getFullYear();

    const specs = [
        { label: "Toko", value: storeName },
        { label: "Cabang aktif", value: String(branches.length) },
        { label: "Data per cabang", value: "stok & kas" },
    ];

    return (
        <>
            <Head title="Pilih Cabang" />

            <div className="dv-auth grid min-h-screen lg:grid-cols-[1.15fr_1fr] xl:grid-cols-[1.35fr_1fr]">
                {/* ── Band gelap: satu-satunya area gelap di halaman ── */}
                <div className="dv-band hidden flex-col justify-between p-10 xl:p-14 lg:flex">
                    <a
                        href="https://devus.id"
                        className="dv-wordmark text-[1.375rem]"
                        aria-label="DEVus.id, beranda"
                    >
                        DEVus<span className="dv-wordmark__dot">.</span>id
                    </a>

                    <div className="max-w-xl space-y-6 py-10">
                        <p className="dv-flag">
                            <Check size={13} strokeWidth={2.5} />
                            Langkah terakhir
                        </p>

                        <h1 className="dv-display">
                            Pilih cabang
                            <br />
                            tempat kamu bekerja.
                        </h1>

                        <p className="dv-lead">
                            Penjualan, stok, kas, dan meja dihitung per cabang.
                            Pilih yang sesuai supaya angka di dashboard dan
                            kasir langsung benar. Kamu bisa berpindah cabang
                            kapan saja dari sidebar.
                        </p>

                        <dl className="dv-spec max-w-sm">
                            {specs.map((spec) => (
                                <div key={spec.label} className="dv-spec__row">
                                    <dt className="dv-label">{spec.label}</dt>
                                    <dd className="dv-spec__val">
                                        {spec.value}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </div>

                    <p className="dv-label">
                        &copy; {year} DEVus.id — Seluruh hak dilindungi
                    </p>
                </div>

                {/* ── Panel pilihan ── */}
                <div className="flex flex-col justify-center px-6 py-12 sm:px-10 lg:px-12">
                    <div className="mx-auto w-full max-w-[26rem]">
                        {/* Wordmark versi mobile — band-nya disembunyikan di bawah lg */}
                        <a
                            href="https://devus.id"
                            className="dv-wordmark mb-10 text-[1.375rem] lg:hidden"
                            aria-label="DEVus.id, beranda"
                        >
                            DEVus<span className="dv-wordmark__dot">.</span>id
                        </a>

                        <div className="dv-card p-7 sm:p-8">
                            <p className="dv-label">Pilih cabang</p>
                            <h2 className="dv-title mt-3">{storeName}</h2>
                            <p
                                className="mt-2 text-[0.9375rem] leading-relaxed"
                                style={{ color: "var(--dv-muted)" }}
                            >
                                {branches.length} cabang aktif. Pilih satu untuk
                                melanjutkan.
                            </p>

                            {flash?.error && (
                                <div
                                    className="dv-alert dv-alert--bad mt-6"
                                    role="alert"
                                >
                                    <AlertTriangle
                                        size={15}
                                        strokeWidth={2.5}
                                        className="mt-px shrink-0"
                                    />
                                    <span>{flash.error}</span>
                                </div>
                            )}

                            {errors.branch_id && (
                                <div
                                    className="dv-alert dv-alert--bad mt-6"
                                    role="alert"
                                >
                                    <AlertTriangle
                                        size={15}
                                        strokeWidth={2.5}
                                        className="mt-px shrink-0"
                                    />
                                    <span>{errors.branch_id}</span>
                                </div>
                            )}

                            {showSearch && (
                                <div className="relative mt-7">
                                    <Search
                                        size={16}
                                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
                                        style={{ color: "var(--dv-muted)" }}
                                    />
                                    <input
                                        type="text"
                                        value={query}
                                        onChange={(e) =>
                                            setQuery(e.target.value)
                                        }
                                        className="dv-input pl-9"
                                        placeholder="Cari nama, kode, atau alamat cabang"
                                        aria-label="Cari cabang"
                                    />
                                </div>
                            )}

                            {filtered.length === 0 ? (
                                <div className="dv-empty mt-7">
                                    <p
                                        className="text-[0.9375rem] font-semibold"
                                        style={{ color: "var(--dv-ink)" }}
                                    >
                                        Cabang tidak ditemukan
                                    </p>
                                    <p
                                        className="mt-1 text-[0.8125rem]"
                                        style={{ color: "var(--dv-muted)" }}
                                    >
                                        Coba kata kunci lain.
                                    </p>
                                </div>
                            ) : (
                                <div
                                    className={`mt-7 space-y-2 ${showSearch ? "max-h-[19rem] overflow-y-auto pr-1" : ""}`}
                                >
                                    {filtered.map((branch) => {
                                        const isActive = selected === branch.id;
                                        const meta = [branch.code, branch.address]
                                            .filter(Boolean)
                                            .join(" · ");

                                        return (
                                            <button
                                                key={branch.id}
                                                type="button"
                                                onClick={() =>
                                                    handleSelect(branch.id)
                                                }
                                                disabled={submitting}
                                                aria-busy={
                                                    isActive && submitting
                                                        ? "true"
                                                        : undefined
                                                }
                                                className={`dv-option ${isActive ? "dv-option--active" : ""}`}
                                            >
                                                <span className="dv-option__icon">
                                                    <MapPin
                                                        size={17}
                                                        strokeWidth={2}
                                                    />
                                                </span>
                                                <span className="dv-option__body">
                                                    <span className="dv-option__name">
                                                        {branch.name}
                                                    </span>
                                                    {meta && (
                                                        <span className="dv-option__meta">
                                                            {meta}
                                                        </span>
                                                    )}
                                                </span>
                                                {isActive && submitting ? (
                                                    <Loader2
                                                        size={16}
                                                        className="dv-option__arrow animate-spin"
                                                    />
                                                ) : (
                                                    <ArrowRight
                                                        size={16}
                                                        strokeWidth={2.5}
                                                        className="dv-option__arrow"
                                                    />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="mt-7 flex items-center justify-between gap-3">
                            <button
                                type="button"
                                onClick={() =>
                                    router.visit(route("admin.dashboard"))
                                }
                                className="dv-tlink"
                            >
                                Lewati ke dashboard
                            </button>
                            <button
                                type="button"
                                onClick={() => router.post(route("logout"))}
                                className="dv-tlink"
                            >
                                Keluar
                            </button>
                        </div>

                        <p className="dv-label mt-10 lg:hidden">
                            &copy; {year} DEVus.id
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
