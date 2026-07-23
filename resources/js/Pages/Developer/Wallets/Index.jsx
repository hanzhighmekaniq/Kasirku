import DeveloperLayout from "@/Layouts/DeveloperLayout";
import { Head, Link, usePage } from "@inertiajs/react";
import { ArrowRight, Wallet } from "lucide-react";

const fmt = (n) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(n ?? 0);

export default function Index({ wallets = [], stats }) {
    const { flash } = usePage().props;

    const statCards = [
        { label: "Total Saldo Store", value: fmt(stats.total_balance), color: "text-green-600" },
        { label: "Saldo Pending", value: fmt(stats.total_pending), color: "text-amber-600" },
        { label: "Total Ditarik", value: fmt(stats.total_withdrawn), color: "text-muted-foreground" },
        { label: "Jumlah Store", value: stats.store_count, color: "text-foreground" },
    ];

    return (
        <DeveloperLayout header="Wallet Store">
            <Head title="Wallet Store" />

            {flash?.success && (
                <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                    {flash.success}
                </div>
            )}

            <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {statCards.map((s) => (
                    <div key={s.label} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                        <p className="text-xs text-muted-foreground">{s.label}</p>
                        <p className={`mt-1 text-lg font-semibold ${s.color}`}>{s.value}</p>
                    </div>
                ))}
            </div>

            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-border bg-muted/60 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            <th className="px-5 py-3">Store</th>
                            <th className="px-5 py-3 text-right">Saldo Tersedia</th>
                            <th className="px-5 py-3 text-right">Pending</th>
                            <th className="px-5 py-3 text-right">Sudah Ditarik</th>
                            <th className="px-5 py-3" />
                        </tr>
                    </thead>
                    <tbody>
                        {wallets.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">
                                    <Wallet className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" strokeWidth={1.5} />
                                    Belum ada wallet store.
                                </td>
                            </tr>
                        ) : (
                            wallets.map((w) => (
                                <tr key={w.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                                    <td className="px-5 py-3">
                                        <p className="font-medium text-foreground">{w.store_name}</p>
                                        <p className="text-xs text-muted-foreground">{w.store_code}</p>
                                    </td>
                                    <td className="px-5 py-3 text-right font-semibold text-green-600">{fmt(w.balance)}</td>
                                    <td className="px-5 py-3 text-right text-amber-600">{fmt(w.pending_balance)}</td>
                                    <td className="px-5 py-3 text-right text-muted-foreground">{fmt(w.withdrawn)}</td>
                                    <td className="px-5 py-3 text-right">
                                        <Link
                                            href={route("developer.wallets.show", { store: w.store_id })}
                                            className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:underline"
                                        >
                                            Detail <ArrowRight className="h-3.5 w-3.5" />
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </DeveloperLayout>
    );
}
