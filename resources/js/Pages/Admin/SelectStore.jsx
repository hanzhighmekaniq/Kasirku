import { useMemo, useState } from "react";
import { Head, router, usePage } from "@inertiajs/react";
import {
    AlertTriangle,
    ArrowRight,
    Check,
    CircleParking,
    Coffee,
    Gamepad2,
    Hotel,
    KeyRound,
    Loader2,
    Scissors,
    Search,
    Store as StoreIcon,
    Ticket,
} from "lucide-react";

/**
 * Langkah "Pilih Toko" setelah login (akun dengan lebih dari satu toko).
 *
 * Satu bahasa visual dengan halaman login dan Admin/SelectBranch: band gelap
 * di kiri, kartu hairline di kanan, palet paten `.dv-auth` dari
 * resources/css/app.css. Jangan pakai utility yang terikat theme engine user
 * di file ini — pakai kelas `dv-*`.
 */

/** Ikon & label per kode tipe toko (kolom `store_types.code`). */
const TYPE_ICON = {
    retail: StoreIcon,
    fnb: Coffee,
    service: Scissors,
    rental: KeyRound,
    ticket: Ticket,
    hospitality: Hotel,
    // backward compat dengan kode tipe lama
    laundry: Scissors,
    parking: CircleParking,
    session: Gamepad2,
};

const TYPE_LABEL = {
    retail: "Retail",
    fnb: "FnB",
    service: "Service",
    rental: "Rental",
    ticket: "Tiket",
    hospitality: "Hotel",
    laundry: "Service",
    parking: "Parkir",
    session: "Rental",
};

/** Di atas jumlah ini daftar toko dapat kolom pencarian. */
const SEARCH_THRESHOLD = 6;

export default function SelectStore({ stores = [] }) {
    const { errors = {}, flash } = usePage().props;
    const [selected, setSelected] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [query, setQuery] = useState("");

    const showSearch = stores.length > SEARCH_THRESHOLD;

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return stores;

        return stores.filter(
            (store) =>
                (store.name ?? "").toLowerCase().includes(q) ||
                (store.code ?? "").toLowerCase().includes(q),
        );
    }, [stores, query]);

    const handleSelect = (storeId) => {
        if (submitting) return;
        setSelected(storeId);
        setSubmitting(true);
        router.post(
            route("admin.store.select.post"),
            { store_id: storeId },
            { onFinish: () => setSubmitting(false) },
        );
    };

    const year = new Date().getFullYear();

    const totalBranches = stores.reduce(
        (sum, store) => sum + (store.branches_count ?? 0),
        0,
    );

    const specs = [
        { label: "Toko", value: String(stores.length) },
        { label: "Total cabang", value: String(totalBranches) },
        { label: "Ganti toko", value: "kapan saja" },
    ];

    return (
        <>
            <Head title="Pilih Toko" />

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
                            Akunmu terhubung ke {stores.length} toko
                        </p>

                        <h1 className="dv-display">
                            Pilih toko
                            <br />
                            yang mau dikelola.
                        </h1>

                        <p className="dv-lead">
                            Tiap toko punya produk, stok, karyawan, dan
                            laporannya sendiri. Setelah masuk, kamu bisa
                            berpindah toko maupun cabang kapan saja dari
                            sidebar.
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
                            <p className="dv-label">Pilih toko</p>
                            <h2 className="dv-title mt-3">
                                Mulai dari toko mana?
                            </h2>
                            <p
                                className="mt-2 text-[0.9375rem] leading-relaxed"
                                style={{ color: "var(--dv-muted)" }}
                            >
                                Kamu punya akses ke {stores.length} toko.
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

                            {errors.store_id && (
                                <div
                                    className="dv-alert dv-alert--bad mt-6"
                                    role="alert"
                                >
                                    <AlertTriangle
                                        size={15}
                                        strokeWidth={2.5}
                                        className="mt-px shrink-0"
                                    />
                                    <span>{errors.store_id}</span>
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
                                        placeholder="Cari nama atau kode toko"
                                        aria-label="Cari toko"
                                    />
                                </div>
                            )}

                            {filtered.length === 0 ? (
                                <div className="dv-empty mt-7">
                                    <p
                                        className="text-[0.9375rem] font-semibold"
                                        style={{ color: "var(--dv-ink)" }}
                                    >
                                        Toko tidak ditemukan
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
                                    {filtered.map((store) => {
                                        const isActive = selected === store.id;
                                        const Icon =
                                            TYPE_ICON[store.store_type] ??
                                            StoreIcon;
                                        const meta = [
                                            TYPE_LABEL[store.store_type] ??
                                                store.store_type,
                                            `${store.branches_count ?? 0} cabang`,
                                            store.code,
                                        ]
                                            .filter(Boolean)
                                            .join(" · ");

                                        return (
                                            <button
                                                key={store.id}
                                                type="button"
                                                onClick={() =>
                                                    handleSelect(store.id)
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
                                                    <Icon
                                                        size={17}
                                                        strokeWidth={2}
                                                    />
                                                </span>
                                                <span className="dv-option__body">
                                                    <span className="dv-option__name">
                                                        {store.name}
                                                    </span>
                                                    <span className="dv-option__meta">
                                                        {meta}
                                                    </span>
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

                        <div className="mt-7">
                            <button
                                type="button"
                                onClick={() => router.post(route("logout"))}
                                className="dv-tlink"
                            >
                                Keluar dan masuk dengan akun lain
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
