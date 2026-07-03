import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router, useForm, usePage } from "@inertiajs/react";
import { useState } from "react";

const inp = (err) =>
    `block w-full rounded-xl border px-3 py-2.5 text-sm shadow-sm transition focus:outline-none focus:ring-2 ${err ? "border-red-300 focus:ring-red-200" : "border-slate-200 focus:border-indigo-400 focus:ring-indigo-100"}`;

function Section({ title, subtitle, children }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-4">
                <h3 className="text-sm font-semibold text-slate-900">
                    {title}
                </h3>
                {subtitle && (
                    <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
                )}
            </div>
            <div className="p-6">{children}</div>
        </div>
    );
}

export default function Index({ store, storeTypes, storeUsers }) {
    const { flash } = usePage().props;

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

    return (
        <AuthenticatedLayout
            header={
                <h2 className="font-semibold text-slate-800">
                    Pengaturan Toko
                </h2>
            }
        >
            <Head title="Pengaturan Toko" />

            {/* Flash */}
            {flash?.success && (
                <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    ✅ {flash.success}
                </div>
            )}
            {flash?.error && (
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    ❌ {flash.error}
                </div>
            )}

            <form onSubmit={submit} className="space-y-5 max-w-3xl">
                {/* Info Toko */}
                <Section
                    title="Informasi Toko"
                    subtitle="Data dasar toko yang tampil di struk dan laporan"
                >
                    <div className="grid grid-cols-2 gap-4">
                        {/* Logo */}
                        <div className="col-span-2 flex items-center gap-4">
                            <div className="h-16 w-16 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center text-3xl">
                                {logoPreview ? (
                                    <img
                                        src={logoPreview}
                                        alt="logo"
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    (storeTypes.find(
                                        (st) => st.code === data.store_type,
                                    )?.icon ?? "🏬")
                                )}
                            </div>
                            <div className="flex gap-2">
                                <label className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
                                    {logoPreview ? "Ganti Logo" : "Upload Logo"}
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
                                        className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
                                    >
                                        Hapus
                                    </button>
                                )}
                            </div>
                            {errors.logo && (
                                <p className="text-xs text-red-500">
                                    {errors.logo}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                Nama Toko *
                            </label>
                            <input
                                value={data.name}
                                onChange={(e) =>
                                    setData("name", e.target.value)
                                }
                                className={inp(errors.name)}
                                placeholder="Nama toko"
                            />
                            {errors.name && (
                                <p className="mt-1 text-xs text-red-500">
                                    {errors.name}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                Kode Toko *
                            </label>
                            <input
                                value={data.code}
                                onChange={(e) =>
                                    setData(
                                        "code",
                                        e.target.value.toUpperCase(),
                                    )
                                }
                                className={inp(errors.code)}
                                placeholder="STORE001"
                            />
                            {errors.code && (
                                <p className="mt-1 text-xs text-red-500">
                                    {errors.code}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                No. Telepon
                            </label>
                            <input
                                value={data.phone}
                                onChange={(e) =>
                                    setData("phone", e.target.value)
                                }
                                className={inp(errors.phone)}
                                placeholder="081234567890"
                            />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                Email Toko
                            </label>
                            <input
                                type="email"
                                value={data.email}
                                onChange={(e) =>
                                    setData("email", e.target.value)
                                }
                                className={inp(errors.email)}
                                placeholder="toko@email.com"
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                Alamat
                            </label>
                            <textarea
                                value={data.address}
                                onChange={(e) =>
                                    setData("address", e.target.value)
                                }
                                rows={2}
                                className={inp(errors.address)}
                                placeholder="Alamat lengkap toko"
                            />
                        </div>
                    </div>
                </Section>

                {/* Tipe Toko */}
                <Section
                    title="Tipe Toko"
                    subtitle="Menentukan fitur dan tampilan yang aktif"
                >
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {storeTypes.map((st) => (
                            <button
                                type="button"
                                key={st.code}
                                onClick={() => setData("store_type", st.code)}
                                className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 text-center transition ${data.store_type === st.code ? "border-indigo-500 bg-indigo-50" : "border-slate-200 hover:border-slate-300"}`}
                            >
                                <span className="text-2xl">{st.icon}</span>
                                <span
                                    className={`text-xs font-semibold ${data.store_type === st.code ? "text-indigo-700" : "text-slate-700"}`}
                                >
                                    {st.label}
                                </span>
                            </button>
                        ))}
                    </div>
                    {errors.store_type && (
                        <p className="mt-2 text-xs text-red-500">
                            {errors.store_type}
                        </p>
                    )}
                </Section>

                {/* Struk & Pajak */}
                <Section
                    title="Struk & Pajak"
                    subtitle="Konfigurasi nota dan perhitungan pajak"
                >
                    <div className="space-y-4">
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                Header Struk
                            </label>
                            <textarea
                                value={data.receipt_header}
                                onChange={(e) =>
                                    setData("receipt_header", e.target.value)
                                }
                                rows={2}
                                className={inp()}
                                placeholder="Teks di bagian atas struk..."
                            />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                Footer Struk
                            </label>
                            <textarea
                                value={data.receipt_footer}
                                onChange={(e) =>
                                    setData("receipt_footer", e.target.value)
                                }
                                rows={2}
                                className={inp()}
                                placeholder="Misal: Terima kasih atas kunjungan Anda!"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Tarif Pajak (%)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    value={data.default_tax_rate}
                                    onChange={(e) =>
                                        setData(
                                            "default_tax_rate",
                                            e.target.value,
                                        )
                                    }
                                    className={inp(errors.default_tax_rate)}
                                    placeholder="0"
                                />
                                <p className="mt-1 text-xs text-slate-400">
                                    0 = tidak ada pajak
                                </p>
                            </div>
                            <div className="flex items-center gap-3 pt-6">
                                <label className="flex cursor-pointer items-center gap-2.5">
                                    <div
                                        className={`relative h-5 w-9 rounded-full transition ${data.tax_inclusive ? "bg-indigo-500" : "bg-slate-200"}`}
                                        onClick={() =>
                                            setData(
                                                "tax_inclusive",
                                                !data.tax_inclusive,
                                            )
                                        }
                                    >
                                        <div
                                            className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${data.tax_inclusive ? "left-4" : "left-0.5"}`}
                                        />
                                    </div>
                                    <span className="text-sm font-medium text-slate-700">
                                        Harga sudah termasuk pajak
                                    </span>
                                </label>
                            </div>
                        </div>
                    </div>
                </Section>

                {/* Tombol Simpan */}
                <div className="flex justify-end pb-4">
                    <button
                        type="submit"
                        disabled={processing}
                        className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow hover:bg-indigo-700 disabled:opacity-60"
                    >
                        {processing ? "Menyimpan..." : "Simpan Pengaturan"}
                    </button>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
