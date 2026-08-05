import { useEffect, useMemo, useRef, useState } from "react";
import { Head, useForm } from "@inertiajs/react";
import {
    AlertTriangle,
    Check,
    ChevronDown,
    PackageOpen,
    Search,
    Sparkles,
} from "lucide-react";

/**
 * Halaman onboarding — buat toko pertama setelah registrasi.
 *
 * Satu layar saja (bukan wizard): pilih template bisnis (atau tipe toko
 * kosong) via combobox searchable + isi nama toko + nama pemilik →
 * submit langsung membuat toko dengan plan Free. Tidak ada langkah
 * pilih plan — upgrade dilakukan belakangan dari Pengaturan > Plan.
 * Verifikasi email juga bukan syarat untuk sampai di sini.
 */

/**
 * Cek apakah nama masih berupa nama auto-generate dari registrasi.
 * Format: {local}_{YYYYMMDD}_{HHmmss} dengan suffix opsional _0001.
 * Nama seperti ini jangan di-prefill ke field "Nama pemilik".
 */
function isGeneratedName(name) {
    return /_\d{8}_\d{6}(_\d{4})?$/.test(name ?? "");
}

/** Badge warna per tipe usaha — soft background, konsisten di seluruh combobox. */
const STORE_TYPE_BADGE_TONES = [
    { bg: "oklch(96% 0.03 258)", text: "oklch(45% 0.15 258)" }, // biru
    { bg: "oklch(96% 0.05 55)", text: "oklch(50% 0.15 55)" }, // oranye
    { bg: "oklch(96% 0.04 305)", text: "oklch(48% 0.16 305)" }, // violet
    { bg: "oklch(96% 0.05 180)", text: "oklch(45% 0.13 180)" }, // teal
    { bg: "oklch(96% 0.05 340)", text: "oklch(50% 0.16 340)" }, // pink
    { bg: "oklch(96% 0.04 75)", text: "oklch(50% 0.14 75)" }, // amber
];

function badgeToneForStoreType(storeTypeId, orderedStoreTypeIds) {
    const index = orderedStoreTypeIds.indexOf(storeTypeId);
    return STORE_TYPE_BADGE_TONES[index % STORE_TYPE_BADGE_TONES.length];
}

export default function OnboardingIndex({
    businessTemplates = [],
    emptyStoreTypes = [],
    userName = "",
}) {
    const { data, setData, post, processing, errors } = useForm({
        store_type_id: "",
        business_template_code: "",
        store_name: "",
        owner_name: isGeneratedName(userName) ? "" : userName,
    });

    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [emptyMode, setEmptyMode] = useState(false);
    const [highlight, setHighlight] = useState(0);
    const comboRef = useRef(null);
    const searchRef = useRef(null);
    const storeNameRef = useRef(null);

    // Urutan tipe usaha (dari template pertama kali muncul) — dipakai untuk
    // memberi warna badge yang konsisten per tipe.
    const orderedStoreTypeIds = useMemo(() => {
        const seen = [];
        businessTemplates.forEach((tpl) => {
            if (!seen.includes(tpl.store_type_id)) seen.push(tpl.store_type_id);
        });
        emptyStoreTypes.forEach((type) => {
            if (!seen.includes(type.id)) seen.push(type.id);
        });
        return seen;
    }, [businessTemplates, emptyStoreTypes]);

    // Grup template per tipe usaha, difilter oleh query pencarian (nama
    // template ATAU nama tipe usaha keduanya dicocokkan).
    const groupedTemplates = useMemo(() => {
        const q = query.trim().toLowerCase();
        const groups = new Map();

        businessTemplates.forEach((tpl) => {
            const typeLabel = tpl.store_type.label.toLowerCase();
            const matches =
                !q ||
                tpl.label.toLowerCase().includes(q) ||
                typeLabel.includes(q);
            if (!matches) return;

            if (!groups.has(tpl.store_type_id)) {
                groups.set(tpl.store_type_id, {
                    storeType: tpl.store_type,
                    templates: [],
                });
            }
            groups.get(tpl.store_type_id).templates.push(tpl);
        });

        return Array.from(groups.values()).sort(
            (a, b) =>
                orderedStoreTypeIds.indexOf(a.storeType.id) -
                orderedStoreTypeIds.indexOf(b.storeType.id),
        );
    }, [businessTemplates, query, orderedStoreTypeIds]);

    const filteredEmptyStoreTypes = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return emptyStoreTypes;
        return emptyStoreTypes.filter((type) =>
            type.label.toLowerCase().includes(q),
        );
    }, [emptyStoreTypes, query]);

    // Daftar flat semua opsi yang sedang tampil (untuk navigasi keyboard).
    const flatOptions = useMemo(() => {
        if (emptyMode) {
            return filteredEmptyStoreTypes.map((type) => ({
                kind: "empty",
                type,
            }));
        }
        return groupedTemplates.flatMap((group) =>
            group.templates.map((tpl) => ({ kind: "template", tpl })),
        );
    }, [emptyMode, filteredEmptyStoreTypes, groupedTemplates]);

    useEffect(() => {
        setHighlight(0);
    }, [flatOptions.length, emptyMode]);

    useEffect(() => {
        if (!open) return;
        const onClickOutside = (e) => {
            if (comboRef.current && !comboRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("click", onClickOutside);
        return () => document.removeEventListener("click", onClickOutside);
    }, [open]);

    const selectedTemplate = businessTemplates.find(
        (t) => t.code === data.business_template_code,
    );
    const selectedEmptyType = !data.business_template_code
        ? emptyStoreTypes.find((t) => t.id === data.store_type_id)
        : null;

    const openPanel = () => {
        setOpen(true);
        setQuery("");
        setHighlight(0);
        setTimeout(() => searchRef.current?.focus(), 10);
    };

    const selectTemplate = (tpl) => {
        setData("store_type_id", tpl.store_type_id);
        setData("business_template_code", tpl.code);
        setOpen(false);
        storeNameRef.current?.focus();
    };

    const selectEmptyStoreType = (type) => {
        setData("store_type_id", type.id);
        setData("business_template_code", "");
        setOpen(false);
        storeNameRef.current?.focus();
    };

    const onListKeyDown = (e) => {
        if (e.key === "Escape") {
            setOpen(false);
        } else if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlight((h) => Math.min(h + 1, flatOptions.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlight((h) => Math.max(h - 1, 0));
        } else if (e.key === "Enter") {
            e.preventDefault();
            const opt = flatOptions[highlight];
            if (!opt) return;
            if (opt.kind === "template") selectTemplate(opt.tpl);
            else selectEmptyStoreType(opt.type);
        }
    };

    const submit = (e) => {
        e.preventDefault();
        post(route("onboarding.store"));
    };

    const year = new Date().getFullYear();
    const canSubmit = data.store_type_id && data.store_name.trim();

    let flatIndex = -1;

    return (
        <>
            <Head title="Siapkan Toko" />

            <div className="dv-auth grid min-h-screen lg:grid-cols-[1.15fr_1fr] xl:grid-cols-[1.35fr_1fr]">
                {/* ── Band gelap ── */}
                <div className="dv-band hidden flex-col justify-between p-10 xl:p-14 lg:flex">
                    <span className="dv-wordmark text-[1.375rem]">
                        DEVus<span className="dv-wordmark__dot">.</span>id
                    </span>

                    <div className="max-w-xl space-y-6 py-10">
                        <p className="dv-flag">
                            <Check size={13} strokeWidth={2.5} />
                            Akun sudah siap
                        </p>

                        <h1 className="dv-display">
                            Saatnya buat
                            <br />
                            tokomu sendiri.
                        </h1>

                        <p className="dv-lead">
                            Pilih jenis usaha yang paling cocok. Toko kamu
                            langsung aktif dengan plan Gratis — upgrade kapan
                            saja dari dashboard.
                        </p>
                    </div>

                    <p className="dv-label">
                        &copy; {year} DEVus.id — Seluruh hak dilindungi
                    </p>
                </div>

                {/* ── Panel form ── */}
                <div className="flex flex-col justify-center px-6 py-12 sm:px-10 lg:px-12">
                    <div className="mx-auto w-full max-w-[30rem]">
                        <span className="dv-wordmark mb-8 text-[1.375rem] lg:hidden">
                            DEVus
                            <span className="dv-wordmark__dot">.</span>id
                        </span>

                        <form onSubmit={submit}>
                            <div className="dv-card p-7 sm:p-8">
                                <h2 className="dv-title">
                                    Ceritakan tentang tokomu
                                </h2>
                                <p
                                    className="mt-2 text-[0.9375rem] leading-relaxed"
                                    style={{ color: "var(--dv-muted)" }}
                                >
                                    Kami siapkan kategori & produk contoh
                                    sesuai pilihanmu. Bisa diubah kapan saja
                                    nanti.
                                </p>

                                <div className="mt-7 space-y-5">
                                    {/* Combobox jenis usaha */}
                                    <div
                                        className="relative space-y-1.5"
                                        ref={comboRef}
                                    >
                                        <label className="dv-field-label">
                                            Jenis usaha
                                        </label>

                                        <button
                                            type="button"
                                            aria-expanded={open}
                                            aria-haspopup="listbox"
                                            onClick={() =>
                                                open
                                                    ? setOpen(false)
                                                    : openPanel()
                                            }
                                            className="dv-input flex w-full items-center gap-3 text-left"
                                            style={{
                                                minHeight: "3.25rem",
                                                paddingBlock: "0.625rem",
                                            }}
                                        >
                                            <span
                                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg"
                                                style={{
                                                    background:
                                                        "var(--dv-paper-3)",
                                                }}
                                                aria-hidden="true"
                                            >
                                                {selectedTemplate?.icon ??
                                                    (selectedEmptyType ? (
                                                        <PackageOpen
                                                            size={18}
                                                            strokeWidth={1.8}
                                                            style={{
                                                                color: "var(--dv-muted)",
                                                            }}
                                                        />
                                                    ) : (
                                                        "🏬"
                                                    ))}
                                            </span>

                                            <span className="min-w-0 flex-1">
                                                <span className="flex items-center gap-2">
                                                    <span
                                                        className="block truncate text-[0.9375rem] font-medium"
                                                        style={{
                                                            color:
                                                                selectedTemplate ||
                                                                selectedEmptyType
                                                                    ? "var(--dv-ink)"
                                                                    : "var(--dv-muted)",
                                                        }}
                                                    >
                                                        {selectedTemplate
                                                            ? selectedTemplate.label
                                                            : selectedEmptyType
                                                              ? `Mulai kosong — ${selectedEmptyType.label}`
                                                              : "Pilih jenis usaha"}
                                                    </span>
                                                    {(selectedTemplate ||
                                                        selectedEmptyType) && (
                                                        <BadgePill
                                                            label={
                                                                (selectedTemplate
                                                                    ?.store_type
                                                                    .label ??
                                                                selectedEmptyType?.label) ||
                                                                ""
                                                            }
                                                            tone={badgeToneForStoreType(
                                                                data.store_type_id,
                                                                orderedStoreTypeIds,
                                                            )}
                                                        />
                                                    )}
                                                </span>
                                                <span
                                                    className="block text-[0.75rem]"
                                                    style={{
                                                        color: "var(--dv-muted)",
                                                    }}
                                                >
                                                    {selectedTemplate
                                                        ? "Termasuk kategori & produk contoh"
                                                        : selectedEmptyType
                                                          ? "Tanpa produk contoh"
                                                          : "Template kategori & produk contoh"}
                                                </span>
                                            </span>

                                            <ChevronDown
                                                size={16}
                                                strokeWidth={2.5}
                                                className="shrink-0 transition-transform duration-150"
                                                style={{
                                                    color: "var(--dv-muted)",
                                                    transform: open
                                                        ? "rotate(180deg)"
                                                        : "rotate(0deg)",
                                                }}
                                            />
                                        </button>

                                        <FieldError
                                            id="store_type_id-error"
                                            message={errors.store_type_id}
                                        />
                                        <FieldError
                                            message={
                                                errors.business_template_code
                                            }
                                        />

                                        {open && (
                                            <div
                                                className="absolute z-30 mt-1.5 w-full overflow-hidden rounded-2xl border shadow-xl"
                                                style={{
                                                    background:
                                                        "var(--dv-paper)",
                                                    borderColor:
                                                        "var(--dv-rule)",
                                                    boxShadow:
                                                        "var(--dv-shadow-lift)",
                                                }}
                                                role="listbox"
                                                onKeyDown={onListKeyDown}
                                            >
                                                <div
                                                    className="border-b p-2"
                                                    style={{
                                                        borderColor:
                                                            "var(--dv-rule)",
                                                    }}
                                                >
                                                    <div className="relative">
                                                        <Search
                                                            size={15}
                                                            strokeWidth={2}
                                                            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
                                                            style={{
                                                                color: "var(--dv-muted)",
                                                            }}
                                                        />
                                                        <input
                                                            ref={searchRef}
                                                            type="text"
                                                            value={query}
                                                            onChange={(e) =>
                                                                setQuery(
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            placeholder="Cari jenis usaha…"
                                                            className="w-full rounded-lg py-2 pl-9 pr-3 text-sm outline-none"
                                                            style={{
                                                                background:
                                                                    "var(--dv-paper-2)",
                                                            }}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="max-h-96 overflow-y-auto">
                                                    {emptyMode ? (
                                                        <>
                                                            <p
                                                                className="sticky top-0 px-4 py-2 text-[0.6875rem] font-semibold uppercase tracking-wide"
                                                                style={{
                                                                    background:
                                                                        "var(--dv-paper)",
                                                                    color: "var(--dv-muted)",
                                                                }}
                                                            >
                                                                Mulai kosong —
                                                                pilih tipe
                                                                usaha
                                                            </p>
                                                            {filteredEmptyStoreTypes.map(
                                                                (type) => {
                                                                    flatIndex++;
                                                                    const isHighlighted =
                                                                        flatIndex ===
                                                                        highlight;
                                                                    return (
                                                                        <OptionRow
                                                                            key={
                                                                                type.id
                                                                            }
                                                                            dashed
                                                                            icon={
                                                                                <PackageOpen
                                                                                    size={
                                                                                        16
                                                                                    }
                                                                                    strokeWidth={
                                                                                        1.8
                                                                                    }
                                                                                />
                                                                            }
                                                                            label={`Mulai kosong — ${type.label}`}
                                                                            badgeLabel={
                                                                                type.label
                                                                            }
                                                                            tone={badgeToneForStoreType(
                                                                                type.id,
                                                                                orderedStoreTypeIds,
                                                                            )}
                                                                            isSelected={
                                                                                selectedEmptyType?.id ===
                                                                                type.id
                                                                            }
                                                                            isHighlighted={
                                                                                isHighlighted
                                                                            }
                                                                            onClick={() =>
                                                                                selectEmptyStoreType(
                                                                                    type,
                                                                                )
                                                                            }
                                                                        />
                                                                    );
                                                                },
                                                            )}
                                                            {filteredEmptyStoreTypes.length ===
                                                                0 && (
                                                                <EmptyResult
                                                                    query={
                                                                        query
                                                                    }
                                                                />
                                                            )}
                                                        </>
                                                    ) : (
                                                        <>
                                                            {groupedTemplates.map(
                                                                (group) => (
                                                                    <div
                                                                        key={
                                                                            group
                                                                                .storeType
                                                                                .id
                                                                        }
                                                                    >
                                                                        <p
                                                                            className="sticky top-0 flex items-center gap-1.5 px-4 py-2 text-[0.6875rem] font-semibold uppercase tracking-wide"
                                                                            style={{
                                                                                background:
                                                                                    "var(--dv-paper)",
                                                                                color: "var(--dv-muted)",
                                                                            }}
                                                                        >
                                                                            <span aria-hidden="true">
                                                                                {
                                                                                    group
                                                                                        .storeType
                                                                                        .icon
                                                                                }
                                                                            </span>
                                                                            {
                                                                                group
                                                                                    .storeType
                                                                                    .label
                                                                            }
                                                                        </p>
                                                                        {group.templates.map(
                                                                            (
                                                                                tpl,
                                                                            ) => {
                                                                                flatIndex++;
                                                                                const isHighlighted =
                                                                                    flatIndex ===
                                                                                    highlight;
                                                                                return (
                                                                                    <OptionRow
                                                                                        key={
                                                                                            tpl.code
                                                                                        }
                                                                                        icon={
                                                                                            <span aria-hidden="true">
                                                                                                {
                                                                                                    tpl.icon
                                                                                                }
                                                                                            </span>
                                                                                        }
                                                                                        label={
                                                                                            tpl.label
                                                                                        }
                                                                                        badgeLabel={
                                                                                            group
                                                                                                .storeType
                                                                                                .label
                                                                                        }
                                                                                        tone={badgeToneForStoreType(
                                                                                            group
                                                                                                .storeType
                                                                                                .id,
                                                                                            orderedStoreTypeIds,
                                                                                        )}
                                                                                        isSelected={
                                                                                            data.business_template_code ===
                                                                                            tpl.code
                                                                                        }
                                                                                        isHighlighted={
                                                                                            isHighlighted
                                                                                        }
                                                                                        onClick={() =>
                                                                                            selectTemplate(
                                                                                                tpl,
                                                                                            )
                                                                                        }
                                                                                    />
                                                                                );
                                                                            },
                                                                        )}
                                                                    </div>
                                                                ),
                                                            )}
                                                            {groupedTemplates.length ===
                                                                0 && (
                                                                <EmptyResult
                                                                    query={
                                                                        query
                                                                    }
                                                                />
                                                            )}
                                                        </>
                                                    )}
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setEmptyMode(
                                                            (v) => !v,
                                                        );
                                                        setHighlight(0);
                                                        searchRef.current?.focus();
                                                    }}
                                                    className="w-full border-t px-4 py-3 text-left text-[0.75rem]"
                                                    style={{
                                                        borderColor:
                                                            "var(--dv-rule)",
                                                        color: "var(--dv-muted)",
                                                    }}
                                                >
                                                    {emptyMode ? (
                                                        "← Kembali ke daftar template"
                                                    ) : (
                                                        <>
                                                            Tidak ada yang
                                                            cocok?{" "}
                                                            <span
                                                                style={{
                                                                    color: "var(--dv-accent-text)",
                                                                    fontWeight: 600,
                                                                }}
                                                            >
                                                                Mulai kosong
                                                                dari tipe
                                                                usaha
                                                            </span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Nama toko */}
                                    <div className="space-y-1.5">
                                        <label
                                            htmlFor="store_name"
                                            className="dv-field-label"
                                        >
                                            Nama toko
                                        </label>
                                        <input
                                            id="store_name"
                                            ref={storeNameRef}
                                            type="text"
                                            value={data.store_name}
                                            aria-invalid={
                                                errors.store_name
                                                    ? "true"
                                                    : undefined
                                            }
                                            aria-describedby={
                                                errors.store_name
                                                    ? "store_name-error"
                                                    : undefined
                                            }
                                            onChange={(e) =>
                                                setData(
                                                    "store_name",
                                                    e.target.value,
                                                )
                                            }
                                            className="dv-input"
                                            placeholder="Contoh: Laundry Bersih Dinda"
                                        />
                                        <FieldError
                                            id="store_name-error"
                                            message={errors.store_name}
                                        />
                                    </div>

                                    {/* Nama pemilik */}
                                    <div className="space-y-1.5">
                                        <label
                                            htmlFor="owner_name"
                                            className="dv-field-label"
                                        >
                                            Nama pemilik{" "}
                                            <span
                                                style={{
                                                    color: "var(--dv-muted)",
                                                    fontWeight: 400,
                                                }}
                                            >
                                                (opsional)
                                            </span>
                                        </label>
                                        <input
                                            id="owner_name"
                                            type="text"
                                            value={data.owner_name}
                                            onChange={(e) =>
                                                setData(
                                                    "owner_name",
                                                    e.target.value,
                                                )
                                            }
                                            className="dv-input"
                                            placeholder="Nama lengkap pemilik toko"
                                        />
                                    </div>

                                    <p
                                        className="flex items-start gap-1.5 text-[0.75rem]"
                                        style={{ color: "var(--dv-muted)" }}
                                    >
                                        <Sparkles
                                            size={14}
                                            strokeWidth={2}
                                            className="mt-0.5 shrink-0"
                                        />
                                        Toko kamu otomatis mulai dengan plan
                                        Gratis. Upgrade kapan saja dari
                                        Pengaturan &gt; Plan.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-6">
                                <button
                                    type="submit"
                                    disabled={processing || !canSubmit}
                                    className="dv-btn dv-btn--accent dv-btn--block"
                                >
                                    {processing
                                        ? "Membuat toko…"
                                        : "Buat Toko Sekarang"}
                                </button>
                            </div>
                        </form>

                        <p className="dv-label mt-10 lg:hidden">
                            &copy; {year} DEVus.id
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}

function BadgePill({ label, tone }) {
    return (
        <span
            className="rounded-md px-1.5 py-0.5 text-[0.625rem] font-medium"
            style={{ background: tone.bg, color: tone.text }}
        >
            {label}
        </span>
    );
}

function OptionRow({
    icon,
    label,
    badgeLabel,
    tone,
    isSelected,
    isHighlighted,
    dashed,
    onClick,
}) {
    return (
        <button
            type="button"
            role="option"
            aria-selected={isSelected}
            onClick={onClick}
            className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors duration-150 ${
                dashed ? "mx-2 my-1 w-[calc(100%-1rem)] rounded-lg border border-dashed" : ""
            }`}
            style={{
                background: isSelected
                    ? "var(--dv-accent-tint)"
                    : isHighlighted
                      ? "var(--dv-paper-2)"
                      : "transparent",
                borderColor: dashed ? "var(--dv-rule-2)" : undefined,
            }}
        >
            <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm"
                style={{
                    background: "var(--dv-paper-3)",
                    color: "var(--dv-ink-2)",
                }}
            >
                {icon}
            </span>
            <span
                className="flex-1 truncate text-[0.875rem]"
                style={{ color: "var(--dv-ink)" }}
            >
                {label}
            </span>
            <BadgePill label={badgeLabel} tone={tone} />
            {isSelected && (
                <Check
                    size={16}
                    strokeWidth={2.5}
                    style={{ color: "var(--dv-accent-text)" }}
                />
            )}
        </button>
    );
}

function EmptyResult({ query }) {
    return (
        <div
            className="px-4 py-8 text-center text-[0.8125rem]"
            style={{ color: "var(--dv-muted)" }}
        >
            Tidak ada hasil untuk &ldquo;{query}&rdquo;
        </div>
    );
}

function FieldError({ id, message }) {
    if (!message) return null;
    return (
        <p id={id} className="dv-error">
            <AlertTriangle
                size={13}
                strokeWidth={2.5}
                className="mt-0.5 shrink-0"
            />
            <span>{message}</span>
        </p>
    );
}
