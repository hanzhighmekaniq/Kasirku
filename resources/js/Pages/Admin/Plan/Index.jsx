import { useState } from "react";
import { Head, Link, router, useForm, usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {
    AlertTriangle,
    ArrowRight,
    Check,
    ChevronDown,
    Clock,
    Crown,
    Package,
    Sparkles,
    Zap,
} from "lucide-react";

const fmt = (n) =>
    n > 0
        ? new Intl.NumberFormat("id-ID", {
              style: "currency",
              currency: "IDR",
              maximumFractionDigits: 0,
          }).format(n)
        : "Gratis";

const fmtDate = (d) =>
    d
        ? new Date(d).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
          })
        : null;

const PLAN_COLOR = {
    free: "bg-muted text-muted-foreground ring-border",
    starter: "bg-blue-100 text-blue-700 ring-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:ring-blue-800",
    pro: "bg-violet-100 text-violet-700 ring-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:ring-violet-800",
    business: "bg-primary/10 text-primary ring-primary/20",
};

function PlanCard({ plan, currentPlanCode, billingPeriod, onSelect }) {
    const isCurrentPlan = plan.is_active_plan;
    const isFree = plan.code === "free";
    const price = billingPeriod === "yearly" ? plan.price_yearly : plan.price_monthly;
    const colorCls = PLAN_COLOR[plan.code] ?? PLAN_COLOR.starter;
    const yearlyDiscount =
        plan.price_monthly > 0 && plan.price_yearly > 0
            ? Math.round((1 - plan.price_yearly / (plan.price_monthly * 12)) * 100)
            : 0;

    return (
        <div
            className={`relative flex flex-col rounded-2xl border bg-card shadow-sm transition ${
                plan.is_popular
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-border hover:border-primary/30"
            }`}
        >
            {plan.is_popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-0.5 text-[11px] font-bold text-primary-foreground">
                        <Sparkles className="h-3 w-3" strokeWidth={2.5} />
                        Populer
                    </span>
                </div>
            )}

            <div className="p-6">
                <div className="flex items-center justify-between gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${colorCls}`}>
                        {plan.label}
                    </span>
                    {plan.trial_days > 0 && (
                        <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success">
                            Trial {plan.trial_days} hari
                        </span>
                    )}
                </div>

                <div className="mt-4">
                    {isFree ? (
                        <p className="text-3xl font-bold text-foreground">Gratis</p>
                    ) : price > 0 ? (
                        <div>
                            <p className="text-3xl font-bold text-foreground">
                                {fmt(price)}
                                <span className="text-sm font-normal text-muted-foreground ml-1">
                                    /{billingPeriod === "yearly" ? "thn" : "bln"}
                                </span>
                            </p>
                            {billingPeriod === "yearly" && yearlyDiscount > 0 && (
                                <p className="mt-0.5 text-xs text-success font-medium">
                                    Hemat {yearlyDiscount}% vs bulanan
                                </p>
                            )}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">Hubungi kami</p>
                    )}
                </div>

                {plan.description && (
                    <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
                        {plan.description}
                    </p>
                )}

                <ul className="mt-4 space-y-2">
                    {[
                        { label: `${plan.max_users} user`, show: plan.max_users },
                        { label: `${plan.max_branches} cabang`, show: plan.max_branches },
                        { label: plan.max_products ? `${plan.max_products} produk` : "Produk unlimited", show: true },
                        { label: plan.max_transactions_per_month ? `${plan.max_transactions_per_month} transaksi/bln` : "Transaksi unlimited", show: true },
                    ].map((item) => item.show ? (
                        <li key={item.label} className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Check className="h-3.5 w-3.5 shrink-0 text-success" strokeWidth={2.5} />
                            {item.label}
                        </li>
                    ) : null)}
                </ul>
            </div>

            <div className="mt-auto px-6 pb-6">
                {isCurrentPlan ? (
                    <div className="flex items-center justify-center gap-1.5 rounded-xl bg-muted px-4 py-2.5 text-sm font-semibold text-muted-foreground">
                        <Check className="h-4 w-4" strokeWidth={2.5} />
                        Paket Saat Ini
                    </div>
                ) : isFree ? null : (
                    <button
                        onClick={() => onSelect(plan)}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                    >
                        Pilih {plan.label}
                        <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
                    </button>
                )}
            </div>
        </div>
    );
}

export default function PlanIndex({
    plans = [],
    currentPlan,
    isAutoMode = false,
    billingConfig = {},
    pendingOrder = null,
}) {
    const { flash } = usePage().props;
    const [billingPeriod, setBillingPeriod] = useState("monthly");
    const { data, setData, post, processing, errors } = useForm({
        plan_id: "",
        billing_period: "monthly",
    });

    const handleSelectPlan = (plan) => {
        setData({ plan_id: plan.id, billing_period: billingPeriod });
    };

    const handleOrder = (e) => {
        e.preventDefault();
        post(route("admin.plan.order"));
    };

    const selectedPlan = data.plan_id
        ? plans.find((p) => String(p.id) === String(data.plan_id))
        : null;

    const selectedPrice =
        selectedPlan
            ? billingPeriod === "yearly"
                ? selectedPlan.price_yearly
                : selectedPlan.price_monthly
            : 0;

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h2 className="text-lg font-bold text-foreground">Paket & Billing</h2>
                    <p className="text-xs text-muted-foreground">
                        Pilih paket yang sesuai untuk bisnis kamu
                    </p>
                </div>
            }
        >
            <Head title="Paket & Billing" />

            {flash?.success && (
                <div className="mb-5 rounded-2xl border border-success/20 bg-success/10 px-4 py-3 text-sm text-success flex items-center gap-2">
                    <Check className="h-4 w-4 shrink-0" strokeWidth={2} />
                    {flash.success}
                </div>
            )}
            {flash?.error && (
                <div className="mb-5 rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0" strokeWidth={2} />
                    {flash.error}
                </div>
            )}

            {/* Info paket saat ini */}
            {currentPlan && (
                <div className="mb-5 rounded-2xl border border-border bg-card p-5 shadow-sm">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <p className="text-xs font-medium text-muted-foreground">Paket aktif</p>
                            <p className="mt-0.5 text-lg font-bold text-foreground">{currentPlan.label}</p>
                            {currentPlan.expires_at && (
                                <p className={`mt-0.5 text-xs ${currentPlan.is_expired ? "text-destructive" : "text-muted-foreground"}`}>
                                    {currentPlan.is_expired
                                        ? "⚠ Trial/paket sudah berakhir"
                                        : `Aktif sampai ${fmtDate(currentPlan.expires_at)}`}
                                </p>
                            )}
                        </div>
                        <Crown className="h-8 w-8 text-warning opacity-70" strokeWidth={1.5} />
                    </div>
                </div>
            )}

            {/* Order pending yang belum diselesaikan */}
            {pendingOrder && (
                <div className="mb-5 rounded-2xl border border-warning/20 bg-warning/10 p-4 text-sm text-warning">
                    <div className="flex items-start gap-3">
                        <Clock className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
                        <div className="flex-1">
                            <p className="font-semibold">Ada order yang belum selesai</p>
                            <p className="mt-0.5 text-xs opacity-80">
                                Order {pendingOrder.idempotency_key} untuk paket {pendingOrder.plan_label} ({pendingOrder.period_label}) — {fmt(pendingOrder.amount)}
                            </p>
                        </div>
                        <Link
                            href={route("admin.plan.confirm", pendingOrder.idempotency_key)}
                            className="shrink-0 rounded-lg bg-warning/20 px-3 py-1.5 text-xs font-semibold hover:bg-warning/30 transition"
                        >
                            Lanjutkan →
                        </Link>
                    </div>
                </div>
            )}

            {/* Toggle bulanan/tahunan */}
            <div className="mb-6 flex items-center justify-center gap-2">
                <button
                    onClick={() => {
                        setBillingPeriod("monthly");
                        setData("billing_period", "monthly");
                    }}
                    className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                        billingPeriod === "monthly"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                >
                    Bulanan
                </button>
                <button
                    onClick={() => {
                        setBillingPeriod("yearly");
                        setData("billing_period", "yearly");
                    }}
                    className={`rounded-full px-4 py-1.5 text-sm font-semibold transition flex items-center gap-1.5 ${
                        billingPeriod === "yearly"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                >
                    Tahunan
                    <span className="rounded-full bg-success/20 px-1.5 py-0.5 text-[10px] font-bold text-success">
                        Hemat
                    </span>
                </button>
            </div>

            {/* Grid plan */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                {plans.map((plan) => (
                    <PlanCard
                        key={plan.id}
                        plan={plan}
                        currentPlanCode={currentPlan?.code}
                        billingPeriod={billingPeriod}
                        onSelect={handleSelectPlan}
                    />
                ))}
            </div>

            {/* Panel konfirmasi pilihan */}
            {selectedPlan && (
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 shadow-sm">
                    <h3 className="text-base font-bold text-foreground mb-1">
                        Upgrade ke paket {selectedPlan.label}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        {fmt(selectedPrice)} / {billingPeriod === "yearly" ? "tahun" : "bulan"}
                        {!isAutoMode && (
                            <span className="ml-2 text-xs text-warning font-medium">
                                (Mode Manual — konfirmasi via admin)
                            </span>
                        )}
                    </p>

                    {errors.plan_id && (
                        <p className="mb-3 text-sm text-destructive">{errors.plan_id}</p>
                    )}

                    <form onSubmit={handleOrder}>
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:opacity-60"
                        >
                            {processing ? (
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            ) : (
                                <Zap className="h-4 w-4" strokeWidth={2.5} />
                            )}
                            {isAutoMode ? "Lanjut ke Pembayaran" : "Buat Order"}
                        </button>
                    </form>
                </div>
            )}

            {/* Info mode manual */}
            {!isAutoMode && (
                <div className="mt-6 rounded-2xl border border-border bg-muted/40 p-5 text-sm text-muted-foreground">
                    <p className="font-semibold text-foreground mb-1">💳 Mode Pembayaran Manual</p>
                    <p>
                        Setelah buat order, kamu akan mendapat instruksi transfer. Setelah pembayaran dikonfirmasi oleh admin, paket kamu langsung aktif.
                        {billingConfig.whatsapp && (
                            <>
                                {" "}Atau langsung hubungi admin via{" "}
                                <a
                                    href={`https://wa.me/${billingConfig.whatsapp}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary underline"
                                >
                                    WhatsApp
                                </a>.
                            </>
                        )}
                    </p>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
