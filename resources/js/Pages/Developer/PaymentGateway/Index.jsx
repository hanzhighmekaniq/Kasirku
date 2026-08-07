import DeveloperLayout from "@/Layouts/DeveloperLayout";
import { Head, router, useForm, usePage } from "@inertiajs/react";
import { useState } from "react";
import { Check, ChevronDown, CreditCard, Receipt, ArrowRightLeft, Banknote } from "lucide-react";
import Button from "@/Components/ui/Button";
import Field from "@/Components/ui/Field";

const PROVIDER_META = {
    midtrans: {
        gradient: "from-success to-teal-600",
        bg: "bg-success/10",
        text: "text-success",
        logo: <Check className="h-5 w-5 text-success" strokeWidth={2} />,
    },
    xendit: {
        gradient: "from-purple-500 to-primary",
        bg: "bg-purple-100 dark:bg-purple-900/30",
        text: "text-purple-700 dark:text-purple-400",
        logo: <CreditCard className="h-5 w-5 text-purple-700 dark:text-purple-400" strokeWidth={2} />,
    },
    doku: {
        gradient: "from-blue-500 to-cyan-600",
        bg: "bg-blue-100 dark:bg-blue-900/30",
        text: "text-blue-700 dark:text-blue-400",
        logo: <CreditCard className="h-5 w-5 text-blue-700 dark:text-blue-400" strokeWidth={2} />,
    },
    duitku: {
        gradient: "from-orange-500 to-destructive",
        bg: "bg-orange-100 dark:bg-orange-900/30",
        text: "text-orange-700 dark:text-orange-400",
        logo: <CreditCard className="h-5 w-5 text-orange-700 dark:text-orange-400" strokeWidth={2} />,
    },
};

const FIELD_META = {
    server_key: { label: "Server Key", type: "password", placeholder: "Server key..." },
    client_key: { label: "Client Key", type: "text", placeholder: "Client key..." },
    merchant_id: { label: "Merchant ID", type: "text", placeholder: "Merchant ID / Code..." },
};

const METHOD_META = {
    qris: { label: "QRIS" },
    gopay: { label: "GoPay" },
    shopeepay: { label: "ShopeePay" },
    dana: { label: "DANA" },
    ovo: { label: "OVO" },
    bca_va: { label: "VA BCA" },
    mandiri_va: { label: "VA Mandiri" },
    bri_va: { label: "VA BRI" },
    bni_va: { label: "VA BNI" },
    permata_va: { label: "VA Permata" },
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
        "block w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground font-mono shadow-sm transition focus:border-ring focus:ring-2 focus:ring-ring/20";

    return (
        <div className="rounded-2xl border border-border bg-card shadow-sm">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="flex w-full items-center gap-4 px-5 py-4 text-left"
            >
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${meta.gradient} text-xl shadow-sm`}>
                    {meta.logo}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground">{provider.label}</h3>
                        {provider.configured && provider.is_active && (
                            <span className="inline-flex items-center rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success">
                                Aktif
                            </span>
                        )}
                        {provider.configured && !provider.is_active && (
                            <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                                Nonaktif
                            </span>
                        )}
                        {!provider.configured && (
                            <span className="inline-flex items-center rounded-full bg-warning/10 px-2 py-0.5 text-[11px] font-medium text-warning">
                                Belum diatur
                            </span>
                        )}
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${provider.environment === "production" ? "bg-primary/10 text-primary" : "bg-warning/10 text-warning"}`}>
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
                                className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-ring/20 focus:ring-offset-2 ${
                                    data.is_active ? "bg-success" : "bg-muted-foreground/40"
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
                                className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-ring/20 focus:ring-offset-2 ${
                                    data.environment === "production" ? "bg-primary" : "bg-warning"
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
                                    className={`${inputCls} ${errors[key] ? "border-destructive" : ""}`}
                                />
                            </Field>
                        );
                    })}

                    {/* Enabled methods */}
                    <Field label="Metode Pembayaran">
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                            {provider.methods.map((key) => {
                                const m = METHOD_META[key] ?? { label: key };
                                const enabled = data.enabled_methods.includes(key);
                                return (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => toggleMethod(key)}
                                        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                                            enabled
                                                ? "border-primary/40 bg-primary/10 text-primary"
                                                : "border-border bg-card text-muted-foreground hover:border-muted-foreground/30 hover:bg-muted"
                                        }`}
                                    >
                                        <CreditCard className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={2} />
                                        {m.label}
                                        {enabled && <Check className="ml-auto h-3.5 w-3.5 text-primary" strokeWidth={2.5} />}
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

export default function Index({ providers = [], planOrderMode = "auto", payoutMode = "manual" }) {
    const { flash } = usePage().props;
    const [processing, setProcessing] = useState(false);

    const togglePlanOrderMode = () => {
        setProcessing(true);
        router.patch(route("developer.payment-gateway.toggle-plan-order-mode"), {}, {
            preserveScroll: true,
            onFinish: () => setProcessing(false),
        });
    };

    const togglePayoutMode = () => {
        setProcessing(true);
        router.patch(route("developer.payment-gateway.toggle-payout-mode"), {}, {
            preserveScroll: true,
            onFinish: () => setProcessing(false),
        });
    };

    const isManualMode = planOrderMode === "manual";
    const isPayoutAuto = payoutMode === "auto";

    return (
        <DeveloperLayout header="Payment Gateway Platform">
            <Head title="Payment Gateway Platform" />

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

            <div className="mb-5 flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/10 p-4">
                <CreditCard className="mt-0.5 h-5 w-5 shrink-0 text-primary" strokeWidth={1.8} />
                <div className="text-sm text-foreground">
                    <p className="font-medium">Payment Gateway dikelola di level platform</p>
                    <p className="mt-0.5 text-primary/80">
                        Semua store memakai akun PG yang sama di bawah ini. Setiap pembayaran online (QRIS/VA/E-Wallet)
                        masuk ke rekening platform, lalu otomatis di-credit ke saldo wallet store terkait. Lihat{" "}
                        <a href={route("developer.wallets.index")} className="underline">
                            halaman Wallet
                        </a>{" "}
                        untuk memantau saldo tiap store.
                    </p>
                </div>
            </div>

            {/* Toggle Mode Pembayaran Plan Order */}
            <div className="mb-5 rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="flex items-center gap-4 px-5 py-4">
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                        isManualMode
                            ? "bg-warning/10 text-warning"
                            : "bg-success/10 text-success"
                    }`}>
                        <Receipt className="h-5 w-5" strokeWidth={1.8} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-foreground">Mode Pembayaran Plan</h3>
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                isManualMode
                                    ? "bg-warning/10 text-warning"
                                    : "bg-success/10 text-success"
                            }`}>
                                {isManualMode ? "Manual" : "Otomatis (PG)"}
                            </span>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            {isManualMode
                                ? "User yang upgrade plan akan mendapat instruksi transfer manual. Developer menyetujui secara manual."
                                : "User yang upgrade plan akan diarahkan ke Payment Gateway untuk pembayaran otomatis."}
                        </p>
                    </div>
                    <button
                        type="button"
                        role="switch"
                        aria-checked={!isManualMode}
                        disabled={processing}
                        onClick={togglePlanOrderMode}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-ring/20 focus:ring-offset-2 disabled:opacity-50 ${
                            !isManualMode ? "bg-success" : "bg-warning"
                        }`}
                    >
                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-card shadow-lg transition duration-200 ${
                            !isManualMode ? "translate-x-5" : "translate-x-0"
                        }`} />
                    </button>
                </div>
                <div className="flex items-center gap-2 border-t border-border bg-muted/40 px-5 py-3 text-[11px] text-muted-foreground">
                    <ArrowRightLeft className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                    <span>
                        {isManualMode
                            ? "Mode ini terpisah dari Payment Gateway transaksi toko. Kamu bisa tetap mengaktifkan PG untuk transaksi POS."
                            : "Memerlukan minimal satu Payment Gateway aktif di bawah ini."}
                    </span>
                </div>
            </div>

            {/* Toggle Mode Payout — manual atau auto */}
            <div className="mb-5 rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="flex items-center gap-4 px-5 py-4">
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                        isPayoutAuto
                            ? "bg-success/10 text-success"
                            : "bg-muted text-muted-foreground"
                    }`}>
                        <Banknote className="h-5 w-5" strokeWidth={1.8} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-foreground">Mode Payout</h3>
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                isPayoutAuto
                                    ? "bg-success/10 text-success"
                                    : "bg-muted text-muted-foreground"
                            }`}>
                                {isPayoutAuto ? "Otomatis" : "Manual"}
                            </span>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            {isPayoutAuto
                                ? "Penarikan dana dari store akan otomatis ditransfer via Payment Gateway Payout API."
                                : "Developer transfer manual ke rekening store, lalu klik 'Sudah Dibayar' di halaman Withdrawal."}
                        </p>
                    </div>
                    <button
                        type="button"
                        role="switch"
                        aria-checked={isPayoutAuto}
                        disabled={processing}
                        onClick={togglePayoutMode}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-ring/20 focus:ring-offset-2 disabled:opacity-50 ${
                            isPayoutAuto ? "bg-success" : "bg-muted-foreground/40"
                        }`}
                    >
                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-card shadow-lg transition duration-200 ${
                            isPayoutAuto ? "translate-x-5" : "translate-x-0"
                        }`} />
                    </button>
                </div>
                <div className="flex items-center gap-2 border-t border-border bg-muted/40 px-5 py-3 text-[11px] text-muted-foreground">
                    <Banknote className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                    <span>
                        {isPayoutAuto
                            ? "Saat ini mode otomatis masih dalam pengembangan. Aktifkan untuk mempersiapkan integrasi PG Payout API."
                            : "Mode default — developer transfer manual dari rekening platform ke rekening store."}
                    </span>
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
