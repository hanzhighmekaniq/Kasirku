import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, usePage } from "@inertiajs/react";
import { CreditCard, Wallet } from "lucide-react";
import Button from "@/Components/ui/Button";

const PROVIDER_META = {
    midtrans: { gradient: "from-green-500 to-teal-600", logo: "🟢" },
    xendit: { gradient: "from-purple-500 to-primary-600", logo: "🟣" },
    doku: { gradient: "from-blue-500 to-cyan-600", logo: "🔵" },
    duitku: { gradient: "from-orange-500 to-red-500", logo: "🟠" },
};

export default function Index({ providers = [] }) {
    const { flash } = usePage().props;

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h2 className="text-lg font-semibold text-foreground">Payment Gateway</h2>
                    <p className="text-sm text-muted-foreground">Info metode pembayaran online</p>
                </div>
            }
        >
            <Head title="Payment Gateway" />

            {flash?.success && (
                <div className="mb-4 rounded-xl border border-success/20 bg-success/10 px-4 py-3 text-sm text-success">
                    {flash.success}
                </div>
            )}

            <div className="mb-5 flex items-start gap-3 rounded-2xl border border-primary-200 bg-primary-50 p-4">
                <CreditCard className="mt-0.5 h-5 w-5 shrink-0 text-primary-600" strokeWidth={1.8} />
                <div className="text-sm text-primary-800">
                    <p className="font-medium">Payment Gateway dikelola oleh platform</p>
                    <p className="mt-0.5 text-primary-700/80">
                        Kamu tidak perlu mendaftar akun payment gateway sendiri. Semua pembayaran online
                        (QRIS, VA, E-Wallet) memakai akun platform, dan hasil pembayaran otomatis masuk ke
                        saldo <strong>Wallet</strong> toko kamu.
                    </p>
                    <Link
                        href={route("admin.wallet.index")}
                        className="mt-2 inline-flex"
                    >
                        <Button size="sm" icon={Wallet}>
                            Lihat Saldo Wallet
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {providers.map((p) => {
                    const meta = PROVIDER_META[p.provider] ?? PROVIDER_META.midtrans;
                    return (
                        <div
                            key={p.provider}
                            className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm"
                        >
                            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${meta.gradient} text-xl shadow-sm`}>
                                <span className="drop-shadow">{meta.logo}</span>
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="font-semibold text-foreground">{p.label}</p>
                                {p.is_active ? (
                                    <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-medium text-green-700">
                                        Tersedia
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                                        Belum tersedia
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </AuthenticatedLayout>
    );
}
