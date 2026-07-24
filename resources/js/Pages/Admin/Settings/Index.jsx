import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader";
import { Head, Link, useForm, usePage, router } from "@inertiajs/react";
import { useState } from "react";
import { Upload, X, Store, Receipt, Image, Puzzle, MapPin, Settings } from "lucide-react";
import Button from "@/Components/ui/Button";

const inp = (err) =>
    `block w-full rounded-xl border px-4 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 ${err
        ? "border-red-300 bg-destructive/10/30 focus:ring-red-200"
        : "border-border bg-card hover:border-border focus:border-ring focus:ring-ring/20"
    }`;

const labelClass = "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground";
const errorClass = "mt-1 text-xs text-destructive";

function Section({ title, subtitle, icon: Icon, children }) {
    return (
        <div className="rounded-2xl border border-border bg-background shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 border-b border-border bg-muted px-5 py-3.5">
                {Icon && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                        <Icon className="h-4 w-4" strokeWidth={1.8} />
                    </div>
                )}
                <div>
                    <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                    {subtitle && (
                        <p className="text-xs text-muted-foreground">{subtitle}</p>
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
                    router.reload({ only: ['storeFeatures', 'storeFeatureOverrides', 'storeFeatureSettings'], preserveScroll: true });
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
        <div className="rounded-xl border border-border bg-muted/50 px-4 py-3 transition hover:bg-muted">
            <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">
                        {feature.label}
                    </p>
                    {feature.description && (
                        <p className="mt-0.5 text-xs text-muted-foreground truncate">
                            {feature.description}
                        </p>
                    )}
                </div>
                <button
                    type="button"
                    onClick={() => handleToggle()}
                    disabled={loading}
                    className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 focus:outline-none ${feature.is_enabled ? "bg-primary" : "bg-muted-foreground/30"
                        } ${loading ? "opacity-50" : ""}`}
                >
                    <span
                        className={`absolute top-0.5 block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${feature.is_enabled
                            ? "translate-x-[22px]"
                            : "translate-x-0.5"
                            }`}
                    />
                </button>
            </div>

            {/* Sub-settings for cash_rounding */}
            {feature.code === "cash_rounding" && feature.is_enabled && (
                <div className="mt-3 space-y-3 border-t border-border pt-3">
                    <div className="flex items-center gap-3">
                        <label className="text-xs text-muted-foreground">Bulatkan ke:</label>
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs text-muted-foreground">Rp</span>
                            <input
                                type="number"
                                min={1}
                                value={subSettings.cash_rounding_nearest ?? 100}
                                onChange={(e) => handleSubSettingChange("cash_rounding_nearest", Math.max(1, Number(e.target.value) || 1))}
                                disabled={loading}
                                className="w-20 rounded-lg border border-border bg-card px-2.5 py-1 text-xs text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring/20"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <label className="text-xs text-muted-foreground">Mode:</label>
                        <div className="inline-flex rounded-lg bg-muted p-0.5">
                            {[
                                { v: "nearest", l: "Terdekat" },
                                { v: "down", l: "Ke Bawah" },
                                { v: "up", l: "Ke Atas" },
                            ].map((opt) => (
                                <button
                                    key={opt.v}
                                    type="button"
                                    onClick={() => handleSubSettingChange("cash_rounding_mode", opt.v)}
                                    disabled={loading}
                                    className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition ${(subSettings.cash_rounding_mode ?? "nearest") === opt.v
                                        ? "bg-card text-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                        }`}
                                >
                                    {opt.l}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ── BranchEditRow ───────────────────────────────────── */
function BranchEditRow({ branch, isCurrent }) {
    const [editing, setEditing] = useState(false);
    const { data, setData, put, processing, errors, reset } = useForm({
        name: branch.name,
        phone: branch.phone ?? "",
        address: branch.address ?? "",
        is_active: branch.is_active,
    });

    const submit = (e) => {
        e.preventDefault();
        put(route("admin.settings.branch.update", branch.id), {
            preserveScroll: true,
            onSuccess: () => setEditing(false),
        });
    };

    if (!editing) {
        return (
            <div className={`flex items-center justify-between gap-4 rounded-xl border px-4 py-3 transition ${isCurrent ? 'border-primary/30 bg-primary/5' : 'border-border bg-muted/50 hover:bg-muted'}`}>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">{branch.name}</span>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-mono text-muted-foreground">{branch.code}</span>
                        {isCurrent && (
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">Cabang Saat Ini</span>
                        )}
                        {!branch.is_active && (
                            <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-medium text-destructive">Nonaktif</span>
                        )}
                    </div>
                    {(branch.phone || branch.address) && (
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {branch.phone && <span className="mr-2">{branch.phone}</span>}
                            {branch.address}
                        </p>
                    )}
                </div>
                <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
                >
                    Edit
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={submit} className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-4 space-y-3">
            <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-primary">{branch.code}</span>
                <button type="button" onClick={() => { reset(); setEditing(false); }} className="text-xs text-muted-foreground hover:text-foreground">
                    Batal
                </button>
            </div>
            <div>
                <label className={labelClass}>Nama Cabang *</label>
                <input value={data.name} onChange={(e) => setData("name", e.target.value)} className={inp(errors.name)} placeholder="Nama cabang" />
                {errors.name && <p className={errorClass}>{errors.name}</p>}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                    <label className={labelClass}>No. Telepon</label>
                    <input value={data.phone} onChange={(e) => setData("phone", e.target.value)} className={inp()} placeholder="08xxx" />
                </div>
                <div className="flex items-end gap-2">
                    <div>
                        <label className={labelClass}>Status</label>
                        <div className="mt-1 flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setData("is_active", !data.is_active)}
                                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 focus:outline-none ${data.is_active ? "bg-primary" : "bg-muted-foreground/30"
                                    }`}
                            >
                                <span className={`absolute top-0.5 block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${data.is_active ? "translate-x-[22px]" : "translate-x-0.5"
                                    }`} />
                            </button>
                            <span className="text-xs text-muted-foreground">{data.is_active ? "Aktif" : "Nonaktif"}</span>
                        </div>
                    </div>
                </div>
            </div>
            <div>
                <label className={labelClass}>Alamat</label>
                <textarea value={data.address} onChange={(e) => setData("address", e.target.value)} rows={2} className={inp()} placeholder="Alamat cabang" />
            </div>
            <div className="flex justify-end">
                <Button type="submit" loading={processing}>Simpan Cabang</Button>
            </div>
        </form>
    );
}

export default function Index({ store, storeTypes, storeUsers, storeFeatures, branches = [], currentBranch = null }) {
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
        { id: "umum", label: "Umum", icon: Settings },
        { id: "fitur", label: "Fitur Toko", icon: Puzzle },
    ];

    return (
        <AuthenticatedLayout
            header={
                <div className="leading-tight">
                    <div className="text-sm font-semibold text-foreground">
                        Pengaturan Toko
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                        Atur informasi toko dan pengaturan umum
                    </div>
                </div>
            }
        >
            <PageHeader
                title="Pengaturan Toko"
                breadcrumbs={["Admin", "Sistem", "Pengaturan Toko"]}
                heading={
                    <>
                        <span className="bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
                            Pengaturan Toko
                        </span>
                    </>
                }
                description="Atur informasi toko dan pengaturan umum"
            />
            {/* Flash messages */}
            {flash?.success && (
                <div className="mb-5 rounded-xl border border-success/20 bg-success/10 px-4 py-3 text-sm font-medium text-success">
                    {flash.success}
                </div>
            )}
            {flash?.error && (
                <div className="mb-5 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
                    {flash.error}
                </div>
            )}

            {/* Tabs */}
            <div className="mb-4 inline-flex gap-1 rounded-xl bg-background border border-border">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-all ${activeTab === tab.id
                            ? "bg-secondary text-secondary-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
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
                    <div className="grid grid-cols-1 gap-5 xl:grid-cols-5 ">
                        {/* ── Kolom Kiri: Form (3/5) ── */}
                        <div className="space-y-5 xl:col-span-3">
                            {/* Informasi Toko */}
                            <Section
                                title="Informasi Toko"
                                subtitle="Data dasar toko yang tampil di struk dan laporan"
                                icon={Store}
                            >
                                {/* Logo Upload */}
                                <div className="mb-5 flex items-start gap-4 ">
                                    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-border bg-backgroundtext-3xl">
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
                                            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-card px-3.5 py-2 text-xs font-semibold text-muted-foreground shadow-sm ring-1 ring-border transition hover:ring-foreground hover:text-foreground">
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
                                                    className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold text-destructive ring-1 ring-red-200 transition hover:bg-destructive/10"
                                                >
                                                    <X className="h-3.5 w-3.5" strokeWidth={2} />
                                                    Hapus
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
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
                                            className={`${inp(errors.code)} cursor-not-allowed bg-muted text-muted-foreground opacity-60`}
                                            placeholder="STORE001"
                                            disabled
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
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                                    %
                                                </span>
                                            </div>
                                            {Number(data.default_tax_rate) === 0 && (
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    Tidak ada pajak
                                                </p>
                                            )}
                                        </div>

                                        {/* Toggle Tax Inclusive */}
                                        <div>
                                            <label className={labelClass}>Harga Sudah Termasuk Pajak</label>
                                            <div className="mt-3 flex items-center gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => setData("tax_inclusive", !data.tax_inclusive)}
                                                    className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 focus:outline-none ${data.tax_inclusive ? "bg-primary" : "bg-muted-foreground/30"
                                                        }`}
                                                >
                                                    <span
                                                        className={`absolute top-0.5 block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${data.tax_inclusive ? "translate-x-[22px]" : "translate-x-0.5"
                                                            }`}
                                                    />
                                                </button>
                                                <span className="text-sm text-foreground">
                                                    {data.tax_inclusive ? "Ya, harga sudah termasuk pajak" : "Tidak, pajak ditambahkan terpisah"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Section>

                            {/* Cabang */}
                            {branches.length > 0 && (
                                <Section
                                    title="Cabang Toko"
                                    subtitle="Kelola nama, telepon, alamat, dan status cabang"
                                    icon={MapPin}
                                >
                                    <div className="space-y-3">
                                        {branches.map((branch) => (
                                            <BranchEditRow
                                                key={branch.id}
                                                branch={branch}
                                                isCurrent={currentBranch?.id === branch.id}
                                            />
                                        ))}
                                        <p className="text-xs text-muted-foreground">
                                            Untuk menambah atau menghapus cabang, silakan hubungi tim developer/support.
                                        </p>
                                    </div>
                                </Section>
                            )}

                            {/* Tombol Simpan */}
                            <div className="flex justify-end">
                                <Button
                                    type="submit"
                                    loading={processing}
                                >
                                    Simpan Pengaturan
                                </Button>
                            </div>
                        </div>

                        {/* ── Kolom Kanan: Preview Struk (2/5) ── */}
                        <div className="xl:col-span-2">
                            <div className="sticky top-16 space-y-5">
                                <Section
                                    title="Preview Struk"
                                    subtitle="Live preview sesuai pengaturan"
                                    icon={Image}
                                >
                                    <div className="mx-auto max-w-[260px] overflow-hidden rounded-xl border border-border bg-card shadow-inner">
                                        <div className="px-4 py-5 text-center font-mono text-[10.5px] leading-relaxed text-muted-foreground">
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
                                            <p className="text-sm font-extrabold text-foreground">
                                                {data.name || "Nama Toko"}
                                            </p>

                                            {/* Alamat */}
                                            {data.address && (
                                                <p className="mt-1 leading-relaxed text-muted-foreground">
                                                    {data.address}
                                                </p>
                                            )}

                                            {/* Telp */}
                                            {data.phone && (
                                                <p className="text-muted-foreground">
                                                    {data.phone}
                                                </p>
                                            )}

                                            {/* Header */}
                                            {data.receipt_header && (
                                                <p className="mt-2 text-muted-foreground">
                                                    {data.receipt_header}
                                                </p>
                                            )}

                                            {/* Separator */}
                                            <div className="my-3 border-t border-dashed border-border" />

                                            {/* Items */}
                                            <div className="space-y-1.5 text-left">
                                                <div className="flex items-start justify-between gap-2">
                                                    <span className="flex-1 truncate">Americano</span>
                                                    <span className="shrink-0 text-muted-foreground">
                                                        1 x 25.000
                                                    </span>
                                                </div>
                                                <div className="flex items-start justify-between gap-2">
                                                    <span className="flex-1 truncate">Cappuccino</span>
                                                    <span className="shrink-0 text-muted-foreground">
                                                        2 x 30.000
                                                    </span>
                                                </div>
                                                <div className="flex items-start justify-between gap-2">
                                                    <span className="flex-1 truncate">Croissant</span>
                                                    <span className="shrink-0 text-muted-foreground">
                                                        1 x 25.000
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Separator */}
                                            <div className="my-3 border-t border-dashed border-border" />

                                            {/* Subtotal */}
                                            <div className="flex justify-between text-muted-foreground">
                                                <span>Subtotal</span>
                                                <span>Rp 85.000</span>
                                            </div>

                                            {/* Tax line */}
                                            {Number(data.default_tax_rate) > 0 && (
                                                <div className="flex justify-between text-muted-foreground">
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
                                            <div className="my-3 border-t border-dashed border-border" />

                                            {/* Total */}
                                            <div className="flex justify-between text-[13px] font-extrabold text-foreground">
                                                <span>Total</span>
                                                <span>Rp 85.000</span>
                                            </div>

                                            {/* Tax note */}
                                            {Number(data.default_tax_rate) > 0 && data.tax_inclusive && (
                                                <p className="mt-1 text-muted-foreground">
                                                    * Harga sudah termasuk PPN
                                                </p>
                                            )}

                                            {/* Footer */}
                                            {data.receipt_footer && (
                                                <>
                                                    <div className="my-3 border-t border-dashed border-border" />
                                                    <p className="italic text-muted-foreground">
                                                        {data.receipt_footer}
                                                    </p>
                                                </>
                                            )}

                                            {/* Tanggal */}
                                            <p className="mt-3 text-muted-foreground">
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
                <div>
                    <Section
                        title="Fitur Toko"
                        subtitle="Aktifkan atau nonaktifkan fitur untuk toko ini"
                        icon={Puzzle}
                    >
                        {storeFeatures && storeFeatures.length > 0 ? (
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {storeFeatures.map((feature) => (
                                    <FeatureToggle
                                        key={feature.feature_id}
                                        feature={feature}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-xl border border-dashed border-border bg-muted px-6 py-8 text-center">
                                <Puzzle
                                    className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50"
                                    strokeWidth={1.5}
                                />
                                <p className="text-sm text-muted-foreground">
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
