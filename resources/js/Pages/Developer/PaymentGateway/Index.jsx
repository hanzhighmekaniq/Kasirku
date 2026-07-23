import DeveloperLayout from "@/Layouts/DeveloperLayout";
import { Head, useForm, usePage } from "@inertiajs/react";
import { useState } from "react";
import { Check, ChevronDown, CreditCard } from "lucide-react";
import Button from "@/Components/ui/Button";
import Field from "@/Components/ui/Field";

const PROVIDER_META = {
    midtrans: {
        gradient: "from-green-500 to-teal-600",
        bg: "bg-green-50",
        text: "text-green-700",
        logo: "🟢",
    },
    xendit: {
        gradient: "from-purple-500 to-primary-600",
        bg: "bg-purple-50",
        text: "text-purple-700",
        logo: "🟣",
    },
    doku: {
        gradient: "from-blue-500 to-cyan-600",
        bg: "bg-blue-50",
        text: "text-blue-700",
        logo: "🔵",
    },
    duitku: {
        gradient: "from-orange-500 to-red-500",
        bg: "bg-orange-50",
        text: "text-orange-700",
        logo: "🟠",
    },
};

const FIELD_META = {
    server_key: { label: "Server Key", type: "password", placeholder: "Server key..." },
    client_key: { label: "Client Key", type: "text", placeholder: "Client key..." },
    merchant_id: { label: "Merchant ID", type: "text", placeholder: "Merchant ID / Code..." },
};

const METHOD_META = {
    qris: { label: "QRIS", icon: "📱" },
    gopay: { label: "GoPay", icon: "🟢" },
    shopeepay: { label: "ShopeePay", icon: "🟠" },
    dana: { label: "DANA", icon: "🔵" },
    ovo: { label: "OVO", icon: "🟣" },
    bca_va: { label: "VA BCA", icon: "🏦" },
    mandiri_va: { label: "VA Mandiri", icon: "🏦" },
    bri_va: { label: "VA BRI", icon: "🏦" },
    bni_va: { label: "VA BNI", icon: "🏦" },
    permata_va: { label: "VA Permata", icon: "🏦" },
};

function ProviderCard({ provider }) {
    const meta = PROVIDER_META[provider.provider] ?? PROVIDER_META.midtrans;
    const [open, setOpen] = useState(false);

    const { data, setData, post, put, processing, errors } = useForm({
        provider: provider.provider,
        is_active: provider.is_active,
        environment: provider.environment,
        server_key: provider.has_server_key ? "••••••••" : "",
        client_key: provider.has_client_key ? "••••••••" : "",
        merchant_id: provider.merchant_id ?? "",
        enabled_methods: provider.enabled_methods ?? [],
    });

    const toggleMethod = (key) => {
        const next = data.enabled_methods.includes(key)
            ? data.enabled_methods.filter((k) => k !== key)
            : [...data.enabled_methods, key];
        setData("enabled_methods", next);
    };

    const submit = (e) => {
        e.preventDefault();
        if (provider.configured) {
            put(route("developer.payment-gateway.update", { paymentGateway: provider.id }));
        } else {
            post(route("developer.payment-gateway.store"));
        }
    };

    const inputCls =
        "block w-full rounded-xl border bg-card px-3 py-2.5 text-sm shadow-sm transition focus:border-ring focus:ring-2 focus:ring-ring/20 font-mono";

    return (
        <div className="rounded-2xl border border-border bg-card shadow-sm">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="flex w-full items-center gap-4 px-5 py-4 text-left"
            >
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${meta.gradient} text-xl shadow-sm`}>
                    <span className="drop-shadow">{meta.logo}</span>
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground">{provider.label}</h3>
                        {provider.configured && provider.is_active && (
                            <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-medium text-green-700">
                                Aktif
                            </span>
                        )}
                        {provider.configured && !provider.is_active && (
                            <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                                Nonaktif
                            </span>
                        )}
                        {!provider.configured && (
                            <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                                Belum diatur
                            </span>
                        )}
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${provider.environment === "production" ? "bg-primary-100 text-primary-700" : "bg-amber-50 text-amber-600"}`}>
                            {provider.environment === "production" ? "Production" : "Sandbox"}
                        </span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                        {provider.methods.length} metode tersedia · {(provider.enabled_methods ?? []).length} aktif
                    </p>
                </div>
                <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
            </button>

            {open && (
                <form onSubmit={submit} className="space-y-5 border-t border-border px-5 py-5">
                    {/* Status */}
                    <Field label="Status">
                        <div className="flex items-start gap-3 rounded-xl border border-border bg-muted p-4">
                            <button
                                type="button"
                                role="switch"
                                aria-checked={data.is_active}
                                onClick={() => setData("is_active", !data.is_active)}
                                className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                                    data.is_active ? "bg-green-500" : "bg-slate-300"
                                }`}
                            >
                                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-card shadow-lg transition duration-200 ${
                                    data.is_active ? "translate-x-5" : "translate-x-0"
                                }`} />
                            </button>
                            <div>
                                <p className="text-sm font-medium text-foreground">{data.is_active ? "Aktif" : "Nonaktif"}</p>
                                <p className="text-xs text-muted-foreground">
                                    {data.is_active
                                        ? "Gateway ini akan muncul di semua store yang mengaktifkan Payment Gateway."
                                        : "Gateway disembunyikan dari semua store."}
                                </p>
                            </div>
                        </div>
                    </Field>

                    {/* Environment */}
                    <Field label="Environment">
                        <div className="flex items-start gap-3 rounded-xl border border-border bg-muted p-4">
                            <button
                                type="button"
                                role="switch"
                                aria-checked={data.environment === "production"}
                                onClick={() => setData("environment", data.environment === "production" ? "sandbox" : "production")}
                                className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                                    data.environment === "production" ? "bg-primary-500" : "bg-amber-400"
                                }`}
                            >
                                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-card shadow-lg transition duration-200 ${
                                    data.environment === "production" ? "translate-x-5" : "translate-x-0"
                                }`} />
                            </button>
                            <div>
                                <p className="text-sm font-medium text-foreground">
                                    {data.environment === "production" ? "Production (Live)" : "Sandbox (Testing)"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {data.environment === "production"
                                        ? "Transaksi sungguhan — semua pembayaran masuk ke rekening platform."
                                        : "Mode uji coba — transaksi simulasi, tidak ada uang sungguhan."}
                                </p>
                            </div>
                        </div>
                    </Field>

                    {/* Dynamic credential fields */}
                    {provider.fields.map((key) => {
                        const f = FIELD_META[key];
                        return (
                            <Field key={key} label={f.label} error={errors[key]}>
                                <input
                                    type={f.type}
                                    value={data[key]}
                                    onChange={(e) => setData(key, e.target.value)}
                                    placeholder={
                                        provider[`has_${key}`] ? "•••••••• (tersimpan)" : f.placeholder
                                    }
                                    className={`${inputCls} ${errors[key] ? "border-red-300" : ""}`}
                                />
                            </Field>
                        );
                    })}

                    {/* Enabled methods */}
                    <Field label="Metode Pembayaran">
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                            {provider.methods.map((key) => {
                                const m = METHOD_META[key] ?? { label: key, icon: "💳" };
                                const enabled = data.enabled_methods.includes(key);
                                return (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => toggleMethod(key)}
                                        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                                            enabled
                                                ? "border-primary-300 bg-primary-50 text-primary-700"
                                                : "border-border bg-card text-muted-foreground hover:border-border hover:bg-muted"
                                        }`}
                                    >
                                        <span>{m.icon}</span>
                                        {m.label}
                                        {enabled && <Check className="ml-auto h-3.5 w-3.5 text-primary-500" strokeWidth={2.5} />}
                                    </button>
                                );
                            })}
                        </div>
                    </Field>

                    <div className="flex justify-end border-t border-border pt-4">
                        <Button type="submit" loading={processing}>
                            {processing ? "Menyimpan..." : "Simpan Konfigurasi"}
                        </Button>
                    </div>
                </form>
            )}
        </div>
    );
}

export default function Index({ providers = [] }) {
    const { flash } = usePage().props;

    return (
        <DeveloperLayout header="Payment Gateway Platform">
            <Head title="Payment Gateway Platform" />

            {flash?.success && (
                <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                    {flash.success}
                </div>
            )}
            {flash?.error && (
                <div className="mb-4 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {flash.error}
                </div>
            )}

            <div className="mb-5 flex items-start gap-3 rounded-2xl border border-primary-200 bg-primary-50 p-4">
                <CreditCard className="mt-0.5 h-5 w-5 shrink-0 text-primary-600" strokeWidth={1.8} />
                <div className="text-sm text-primary-800">
                    <p className="font-medium">Payment Gateway dikelola di level platform</p>
                    <p className="mt-0.5 text-primary-700/80">
                        Semua store memakai akun PG yang sama di bawah ini. Setiap pembayaran online (QRIS/VA/E-Wallet)
                        masuk ke rekening platform, lalu otomatis di-credit ke saldo wallet store terkait. Lihat{" "}
                        <a href={route("developer.wallets.index")} className="underline">
                            halaman Wallet
                        </a>{" "}
                        untuk memantau saldo tiap store.
                    </p>
                </div>
            </div>

            <div className="space-y-3">
                {providers.map((p) => (
                    <ProviderCard key={p.provider} provider={p} />
                ))}
            </div>
        </DeveloperLayout>
    );
}
