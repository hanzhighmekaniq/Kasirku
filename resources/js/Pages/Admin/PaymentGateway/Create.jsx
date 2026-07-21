import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, useForm, usePage } from "@inertiajs/react";
import { ArrowLeft, Check } from "lucide-react";
import Button from "@/Components/ui/Button";
import SectionCard from "@/Components/ui/SectionCard";
import Select from "@/Components/ui/Select";
import Field from "@/Components/ui/Field";

const PROVIDER_CONFIG = {
    midtrans: {
        label: "Midtrans",
        gradient: "from-green-500 to-teal-600",
        desc: "QRIS, GoPay, VA Bank, Gerai Retail",
        fields: [
            { key: "server_key", label: "Server Key", type: "password", placeholder: "Midtrans server key..." },
            { key: "client_key", label: "Client Key", type: "text", placeholder: "Midtrans client key..." },
            { key: "merchant_id", label: "Merchant ID", type: "text", placeholder: "G-XXXXX atau Merchant ID..." },
        ],
    },
    xendit: {
        label: "Xendit",
        gradient: "from-purple-500 to-primary-600",
        desc: "QRIS, VA Bank, E-Wallet, Kartu Kredit",
        fields: [
            { key: "server_key", label: "API Key", type: "password", placeholder: "Xendit API key (xnd_...)" },
        ],
    },
    doku: {
        label: "DOKU",
        gradient: "from-blue-500 to-cyan-600",
        desc: "QRIS, VA Bank, E-Wallet, Transfer",
        fields: [
            { key: "client_key", label: "Client ID", type: "text", placeholder: "DOKU Client ID..." },
            { key: "server_key", label: "Shared Key", type: "password", placeholder: "DOKU Shared Key..." },
        ],
    },
    duitku: {
        label: "Duitku",
        gradient: "from-orange-500 to-red-500",
        desc: "QRIS, VA Bank, Gerai Retail, E-Wallet",
        fields: [
            { key: "merchant_id", label: "Merchant Code", type: "text", placeholder: "Kode merchant Duitku..." },
            { key: "server_key", label: "API Key", type: "password", placeholder: "Duitku API key..." },
        ],
    },
};

const ALL_PROVIDERS = Object.entries(PROVIDER_CONFIG).map(([key, cfg]) => ({
    value: key,
    label: `${cfg.label} — ${cfg.desc}`,
}));

const ALL_PG_METHODS = [
    { key: "qris", label: "QRIS", icon: "📱" },
    { key: "gopay", label: "GoPay", icon: "🟢" },
    { key: "shopeepay", label: "ShopeePay", icon: "🟠" },
    { key: "dana", label: "DANA", icon: "🔵" },
    { key: "ovo", label: "OVO", icon: "🟣" },
    { key: "bca_va", label: "VA BCA", icon: "🏦" },
    { key: "mandiri_va", label: "VA Mandiri", icon: "🏦" },
    { key: "bri_va", label: "VA BRI", icon: "🏦" },
    { key: "bni_va", label: "VA BNI", icon: "🏦" },
    { key: "permata_va", label: "VA Permata", icon: "🏦" },
];

export default function Create({ availableProviders = {} }) {
    const { flash } = usePage().props;
    const providerKeys = Object.keys(availableProviders);
    const providerOpts = ALL_PROVIDERS.filter((p) => providerKeys.includes(p.value));

    const { data, setData, post, processing, errors } = useForm({
        provider: providerOpts[0]?.value ?? "",
        is_active: true,
        environment: "sandbox",
        server_key: "",
        client_key: "",
        merchant_id: "",
        enabled_methods: [],
    });

    const providerCfg = PROVIDER_CONFIG[data.provider] ?? PROVIDER_CONFIG.midtrans;
    const allowedMethods = availableProviders[data.provider]?.methods ?? [];

    const toggleMethod = (key) => {
        const next = data.enabled_methods.includes(key)
            ? data.enabled_methods.filter((k) => k !== key)
            : [...data.enabled_methods, key];
        setData("enabled_methods", next);
    };

    const submit = (e) => {
        e.preventDefault();
        post(route("admin.payment-gateway.store"));
    };

    const inputCls =
        "block w-full rounded-xl border bg-card px-3 py-2.5 text-sm shadow-sm transition focus:border-ring focus:ring-2 focus:ring-ring/20";

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <Link
                        href={route("admin.payment-gateway.index")}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
                        aria-label="Kembali"
                    >
                        <ArrowLeft className="h-5 w-5" strokeWidth={1.8} />
                    </Link>
                    <h2 className="text-lg font-semibold text-foreground">Tambah Payment Gateway</h2>
                </div>
            }
        >
            <Head title="Tambah Payment Gateway" />

            {flash?.error && (
                <div className="mb-4 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">{flash.error}</div>
            )}

            <div className="mx-auto max-w-2xl">
                <SectionCard title="Konfigurasi Gateway" subtitle="Hubungkan payment gateway untuk menerima pembayaran online.">
                    <form onSubmit={submit} className="space-y-5">
                        {/* Provider */}
                        <Field label="Provider" required error={errors.provider}>
                            <Select
                                options={providerOpts}
                                value={data.provider}
                                onChange={(v) => {
                                    setData("provider", String(v));
                                    setData("enabled_methods", []);
                                }}
                                placeholder="Pilih provider..."
                            />
                        </Field>

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
                                        {data.is_active ? "Gateway tersedia dan bisa dipilih saat transaksi di kasir." : "Gateway disembunyikan dan tidak muncul di kasir."}
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
                                            ? "Transaksi sungguhan dengan uang asli. Pastikan API key production."
                                            : "Mode uji coba — transaksi simulasi, tidak ada uang sungguhan."}
                                    </p>
                                </div>
                            </div>
                        </Field>

                        {/* Dynamic credential fields */}
                        {providerCfg.fields.map((f) => (
                            <Field key={f.key} label={f.label} error={errors[f.key]}>
                                <input
                                    type={f.type}
                                    value={data[f.key]}
                                    onChange={(e) => setData(f.key, e.target.value)}
                                    placeholder={f.placeholder}
                                    className={`${inputCls} font-mono ${errors[f.key] ? "border-red-300" : ""}`}
                                />
                            </Field>
                        ))}

                        {/* Enabled methods */}
                        <Field label="Metode Pembayaran">
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                                {ALL_PG_METHODS.filter((m) => allowedMethods.includes(m.key)).map((m) => {
                                    const enabled = data.enabled_methods.includes(m.key);
                                    return (
                                        <button
                                            key={m.key}
                                            type="button"
                                            onClick={() => toggleMethod(m.key)}
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

                        {/* Actions */}
                        <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
                            <Link
                                href={route("admin.payment-gateway.index")}
                                className="inline-flex justify-center rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted"
                            >
                                Batal
                            </Link>
                            <Button type="submit" loading={processing} className="w-full">
                                {processing ? "Menyimpan..." : "Simpan Gateway"}
                            </Button>
                        </div>
                    </form>
                </SectionCard>
            </div>
        </AuthenticatedLayout>
    );
}
