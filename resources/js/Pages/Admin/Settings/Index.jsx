import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, usePage, router } from "@inertiajs/react";
import { useState } from "react";
import { Upload, X, Store, Receipt, Image, Puzzle } from "lucide-react";

const inp = (err) =>
    `block w-full rounded-xl border px-4 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 ${
        err
            ? "border-red-300 bg-red-50/30 focus:ring-red-200"
            : "border-slate-200 bg-white hover:border-slate-300 focus:border-indigo-400 focus:ring-indigo-100"
    }`;

const labelClass = "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500";
const errorClass = "mt-1 text-xs text-red-500";

function Section({ title, subtitle, icon: Icon, children }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-white px-5 py-3.5">
                {Icon && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                        <Icon className="h-4 w-4" strokeWidth={1.8} />
                    </div>
                )}
                <div>
                    <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
                    {subtitle && (
                        <p className="text-xs text-slate-400">{subtitle}</p>
                    )}
                </div>
            </div>
            <div className="p-5">{children}</div>
        </div>
    );
}

function FeatureToggle({ feature, onToggle }) {
    const [loading, setLoading] = useState(false);
    const [subSettings, setSubSettings] = useState(feature.settings || {});

    const handleToggle = (overrides = {}) => {
        setLoading(true);
        const newEnabled = overrides.is_enabled ?? !feature.is_enabled;
        const settings = newEnabled ? { ...subSettings, ...overrides.settings } : subSettings;

        router.post(
            route("admin.settings.features.update"),
            {
                feature_id: feature.feature_id,
                is_enabled: newEnabled,
                settings: Object.keys(settings).length > 0 ? settings : null,
            },
            {
                preserveScroll: true,
                onFinish: () => {
                    setLoading(false);
                    // Reload untuk sinkronkan sidebar & shared props
                    router.reload({ only: ['storeFeatures', 'storeFeatureOverrides', 'storeFeatureSettings'] });
                },
            },
        );
    };

    const handleSubSettingChange = (key, value) => {
        const newSettings = { ...subSettings, [key]: value };
        setSubSettings(newSettings);
        if (feature.is_enabled) {
            handleToggle({ is_enabled: true, settings: { [key]: value } });
        }
    };

    return (
        <div className="rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3 transition hover:bg-slate-50">
            <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-700">
                        {feature.label}
                    </p>
                    {feature.description && (
                        <p className="mt-0.5 text-xs text-slate-400 truncate">
                            {feature.description}
                        </p>
                    )}
                </div>
                <button
                    type="button"
                    onClick={() => handleToggle()}
                    disabled={loading}
                    className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${
                        feature.is_enabled ? "bg-indigo-500" : "bg-slate-300"
                    } ${loading ? "opacity-50" : ""}`}
                >
                    <span
                        className={`absolute top-0.5 block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
                            feature.is_enabled
                                ? "translate-x-5.5"
                                : "translate-x-0.5"
                        }`}
                    />
                </button>
            </div>

            {/* Sub-settings for cash_rounding */}
            {feature.code === "cash_rounding" && feature.is_enabled && (
                <div className="mt-3 flex items-center gap-3 border-t border-slate-100 pt-3">
                    <label className="text-xs text-slate-500">Bulatkan ke:</label>
                    <select
                        value={subSettings.cash_rounding_nearest ?? 100}
                        onChange={(e) => handleSubSettingChange("cash_rounding_nearest", Number(e.target.value))}
                        disabled={loading}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-100"
                    >
                        <option value={50}>Rp50</option>
                        <option value={100}>Rp100</option>
                        <option value={500}>Rp500</option>
                        <option value={1000}>Rp1.000</option>
                    </select>
                </div>
            )}
        </div>
    );
}

export default function Index({ store, storeTypes, storeUsers, storeFeatures }) {
    const { flash } = usePage().props;
    const [activeTab, setActiveTab] = useState("umum");

    const { data, setData, post, processing, errors } = useForm({
        _method: "POST",
        name: store?.name ?? "",
        code: store?.code ?? "",
        store_type: store?.store_type ?? "retail",
        phone: store?.phone ?? "",
        email: store?.email ?? "",
        address: store?.address ?? "",
        receipt_header: store?.receipt_header ?? "",
        receipt_footer: store?.receipt_footer ?? "",
        tax_inclusive: store?.tax_inclusive ?? false,
        default_tax_rate: store?.default_tax_rate ?? 0,
        logo: null,
        remove_logo: false,
    });

    const [logoPreview, setLogoPreview] = useState(
        store?.logo ? `/storage/${store.logo}` : null,
    );

    const handleLogo = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setData("logo", file);
        setLogoPreview(URL.createObjectURL(file));
    };

    const removeLogo = () => {
        setData((d) => ({ ...d, logo: null, remove_logo: true }));
        setLogoPreview(null);
    };

    const submit = (e) => {
        e.preventDefault();
        post(route("admin.settings.update"), { forceFormData: true });
    };

    const currentType = storeTypes.find((st) => st.code === data.store_type);

    const tabs = [
        { id: "umum", label: "Umum", icon: Store },
        { id: "fitur", label: "Fitur Toko", icon: Puzzle },
    ];

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                        <Store className="h-5 w-5" strokeWidth={1.8} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">
                            Pengaturan Toko
                        </h2>
                        <p className="text-xs text-slate-400">
                            {store?.name} • {currentType?.label ?? data.store_type}
                        </p>
                    </div>
                </div>
            }
        >
            <Head title="Pengaturan Toko" />

            {/* Flash messages */}
            {flash?.success && (
                <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                    {flash.success}
                </div>
            )}
            {flash?.error && (
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {flash.error}
                </div>
            )}

            {/* Tabs */}
            <div className="mb-5 flex gap-1 rounded-xl bg-slate-100 p-1">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                            activeTab === tab.id
                                ? "bg-white text-indigo-600 shadow-sm"
                                : "text-slate-500 hover:text-slate-700"
                        }`}
                    >
                        <tab.icon className="h-4 w-4" strokeWidth={1.8} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab: Umum */}
            {activeTab === "umum" && (
                <form onSubmit={submit}>
                    <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
                        {/* ── Kolom Kiri: Form (3/5) ── */}
                        <div className="space-y-5 xl:col-span-3">
                            {/* Informasi Toko */}
                            <Section
                                title="Informasi Toko"
                                subtitle="Data dasar toko yang tampil di struk dan laporan"
                                icon={Store}
                            >
                                {/* Logo Upload */}
                                <div className="mb-5 flex items-start gap-4">
                                    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 text-3xl">
                                        {logoPreview ? (
                                            <img
                                                src={logoPreview}
                                                alt="logo"
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <span>{currentType?.icon ?? "🏬"}</span>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex gap-2">
                                            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50 hover:text-indigo-600 hover:ring-indigo-300">
                                                <Upload className="h-3.5 w-3.5" strokeWidth={2} />
                                                {logoPreview ? "Ganti" : "Upload Logo"}
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleLogo}
                                                    className="hidden"
                                                />
                                            </label>
                                            {logoPreview && (
                                                <button
                                                    type="button"
                                                    onClick={removeLogo}
                                                    className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold text-red-600 ring-1 ring-red-200 transition hover:bg-red-50"
                                                >
                                                    <X className="h-3.5 w-3.5" strokeWidth={2} />
                                                    Hapus
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-400">
                                            Rasio 1:1, maks 2MB. PNG/JPG
                                        </p>
                                    </div>
                                    {errors.logo && (
                                        <p className={errorClass}>{errors.logo}</p>
                                    )}
                                </div>

                                {/* Form fields */}
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className={labelClass}>Nama Toko *</label>
                                        <input
                                            value={data.name}
                                            onChange={(e) => setData("name", e.target.value)}
                                            className={inp(errors.name)}
                                            placeholder="Nama toko"
                                        />
                                        {errors.name && <p className={errorClass}>{errors.name}</p>}
                                    </div>
                                    <div>
                                        <label className={labelClass}>Kode Toko *</label>
                                        <input
                                            value={data.code}
                                            onChange={(e) => setData("code", e.target.value.toUpperCase())}
                                            className={inp(errors.code)}
                                            placeholder="STORE001"
                                        />
                                        {errors.code && <p className={errorClass}>{errors.code}</p>}
                                    </div>
                                    <div>
                                        <label className={labelClass}>No. Telepon</label>
                                        <input
                                            value={data.phone}
                                            onChange={(e) => setData("phone", e.target.value)}
                                            className={inp(errors.phone)}
                                            placeholder="081234567890"
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Email Toko</label>
                                        <input
                                            type="email"
                                            value={data.email}
                                            onChange={(e) => setData("email", e.target.value)}
                                            className={inp(errors.email)}
                                            placeholder="toko@email.com"
                                        />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className={labelClass}>Alamat</label>
                                        <textarea
                                            value={data.address}
                                            onChange={(e) => setData("address", e.target.value)}
                                            rows={2}
                                            className={inp(errors.address)}
                                            placeholder="Alamat lengkap toko"
                                        />
                                    </div>
                                </div>
                            </Section>

                            {/* Struk & Pajak */}
                            <Section
                                title="Struk & Pajak"
                                subtitle="Konfigurasi nota dan perhitungan pajak"
                                icon={Receipt}
                            >
                                <div className="space-y-4">
                                    <div>
                                        <label className={labelClass}>Header Struk</label>
                                        <textarea
                                            value={data.receipt_header}
                                            onChange={(e) => setData("receipt_header", e.target.value)}
                                            rows={2}
                                            className={inp()}
                                            placeholder="Teks di bagian atas struk..."
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Footer Struk</label>
                                        <textarea
                                            value={data.receipt_footer}
                                            onChange={(e) => setData("receipt_footer", e.target.value)}
                                            rows={2}
                                            className={inp()}
                                            placeholder="Misal: Terima kasih atas kunjungan Anda!"
                                        />
                                    </div>

                                    {/* Pajak Row */}
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div>
                                            <label className={labelClass}>Tarif Pajak (%)</label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    step="0.1"
                                                    value={data.default_tax_rate}
                                                    onChange={(e) => setData("default_tax_rate", e.target.value)}
                                                    className={inp(errors.default_tax_rate)}
                                                    placeholder="0"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                                                    %
                                                </span>
                                            </div>
                                            {Number(data.default_tax_rate) === 0 && (
                                                <p className="mt-1 text-xs text-slate-400">
                                                    Tidak ada pajak
                                                </p>
                                            )}
                                        </div>

                                        {/* Toggle Tax Inclusive */}
                                        <div className="flex items-end pb-0.5">
                                            <label className="flex cursor-pointer select-none items-center gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => setData("tax_inclusive", !data.tax_inclusive)}
                                                    className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${
                                                        data.tax_inclusive ? "bg-indigo-500" : "bg-slate-300"
                                                    }`}
                                                >
                                                    <span
                                                        className={`absolute top-0.5 block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
                                                            data.tax_inclusive ? "translate-x-5.5" : "translate-x-0.5"
                                                        }`}
                                                    />
                                                </button>
                                                <span className="text-sm font-medium text-slate-700">
                                                    Harga sudah termasuk pajak
                                                </span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </Section>

                            {/* Tombol Simpan */}
                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:from-indigo-600 hover:to-violet-700 hover:shadow-indigo-500/40 disabled:opacity-60"
                                >
                                    {processing ? (
                                        "Menyimpan..."
                                    ) : (
                                        <>Simpan Pengaturan</>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* ── Kolom Kanan: Preview Struk (2/5) ── */}
                        <div className="xl:col-span-2">
                            <div className="sticky top-6 space-y-5">
                                <Section
                                    title="Preview Struk"
                                    subtitle="Live preview sesuai pengaturan"
                                    icon={Image}
                                >
                                    <div className="mx-auto max-w-[260px] overflow-hidden rounded-xl border border-slate-100 bg-white shadow-inner">
                                        <div className="px-4 py-5 text-center font-mono text-[10.5px] leading-relaxed text-slate-600">
                                            {/* Logo */}
                                            <div className="mb-2 flex justify-center">
                                                {logoPreview ? (
                                                    <img
                                                        src={logoPreview}
                                                        alt="logo"
                                                        className="h-12 w-12 rounded-lg object-contain"
                                                    />
                                                ) : (
                                                    <span className="text-3xl">
                                                        {currentType?.icon ?? "🏬"}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Nama Toko */}
                                            <p className="text-sm font-extrabold text-slate-800">
                                                {data.name || "Nama Toko"}
                                            </p>

                                            {/* Alamat */}
                                            {data.address && (
                                                <p className="mt-1 leading-relaxed text-slate-500">
                                                    {data.address}
                                                </p>
                                            )}

                                            {/* Telp */}
                                            {data.phone && (
                                                <p className="text-slate-400">
                                                    {data.phone}
                                                </p>
                                            )}

                                            {/* Header */}
                                            {data.receipt_header && (
                                                <p className="mt-2 text-slate-500">
                                                    {data.receipt_header}
                                                </p>
                                            )}

                                            {/* Separator */}
                                            <div className="my-3 border-t border-dashed border-slate-200" />

                                            {/* Items */}
                                            <div className="space-y-1.5 text-left">
                                                <div className="flex items-start justify-between gap-2">
                                                    <span className="flex-1 truncate">Americano</span>
                                                    <span className="shrink-0 text-slate-400">
                                                        1 x 25.000
                                                    </span>
                                                </div>
                                                <div className="flex items-start justify-between gap-2">
                                                    <span className="flex-1 truncate">Cappuccino</span>
                                                    <span className="shrink-0 text-slate-400">
                                                        2 x 30.000
                                                    </span>
                                                </div>
                                                <div className="flex items-start justify-between gap-2">
                                                    <span className="flex-1 truncate">Croissant</span>
                                                    <span className="shrink-0 text-slate-400">
                                                        1 x 25.000
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Separator */}
                                            <div className="my-3 border-t border-dashed border-slate-200" />

                                            {/* Subtotal */}
                                            <div className="flex justify-between text-slate-500">
                                                <span>Subtotal</span>
                                                <span>Rp 85.000</span>
                                            </div>

                                            {/* Tax line */}
                                            {Number(data.default_tax_rate) > 0 && (
                                                <div className="flex justify-between text-slate-500">
                                                    <span>
                                                        PPN {data.default_tax_rate}%
                                                        {data.tax_inclusive ? "*" : ""}
                                                    </span>
                                                    <span>
                                                        {data.tax_inclusive ? "Incl." : "Rp 9.350"}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Separator */}
                                            <div className="my-3 border-t border-dashed border-slate-200" />

                                            {/* Total */}
                                            <div className="flex justify-between text-[13px] font-extrabold text-slate-800">
                                                <span>Total</span>
                                                <span>Rp 85.000</span>
                                            </div>

                                            {/* Tax note */}
                                            {Number(data.default_tax_rate) > 0 && data.tax_inclusive && (
                                                <p className="mt-1 text-slate-400">
                                                    * Harga sudah termasuk PPN
                                                </p>
                                            )}

                                            {/* Footer */}
                                            {data.receipt_footer && (
                                                <>
                                                    <div className="my-3 border-t border-dashed border-slate-200" />
                                                    <p className="italic text-slate-400">
                                                        {data.receipt_footer}
                                                    </p>
                                                </>
                                            )}

                                            {/* Tanggal */}
                                            <p className="mt-3 text-slate-400">
                                                {new Date().toLocaleDateString("id-ID", {
                                                    day: "2-digit",
                                                    month: "long",
                                                    year: "numeric",
                                                })}{" "}
                                                {new Date().toLocaleTimeString("id-ID", {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                </Section>
                            </div>
                        </div>
                    </div>
                </form>
            )}

            {/* Tab: Fitur Toko */}
            {activeTab === "fitur" && (
                <div className="max-w-2xl">
                    <Section
                        title="Fitur Toko"
                        subtitle="Aktifkan atau nonaktifkan fitur untuk toko ini"
                        icon={Puzzle}
                    >
                        {storeFeatures && storeFeatures.length > 0 ? (
                            <div className="space-y-2">
                                {storeFeatures.map((feature) => (
                                    <FeatureToggle
                                        key={feature.feature_id}
                                        feature={feature}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-8 text-center">
                                <Puzzle
                                    className="mx-auto mb-2 h-8 w-8 text-slate-300"
                                    strokeWidth={1.5}
                                />
                                <p className="text-sm text-slate-400">
                                    Tidak ada fitur yang tersedia untuk tipe toko dan paket Anda.
                                </p>
                            </div>
                        )}
                    </Section>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
