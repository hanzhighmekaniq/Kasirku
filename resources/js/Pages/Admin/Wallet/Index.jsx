import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, usePage } from "@inertiajs/react";
import { Wallet } from "lucide-react";

const fmt = (n) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(n ?? 0);

const dt = (iso) =>
    iso
        ? new Date(iso).toLocaleString("id-ID", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
          })
        : "-";

export default function Index({ wallet, transactions }) {
    const { flash } = usePage().props;

    return (
        <AuthenticatedLayout header="Wallet">
            <Head title="Wallet" />

            {flash?.success && (
                <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                    {flash.success}
                </div>
            )}

            <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                    <p className="text-xs text-muted-foreground">Saldo Tersedia</p>
                    <p className="mt-1 text-xl font-semibold text-green-600">{fmt(wallet.balance)}</p>
                </div>
                <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                    <p className="text-xs text-muted-foreground">Saldo Pending</p>
                    <p className="mt-1 text-xl font-semibold text-amber-600">{fmt(wallet.pending_balance)}</p>
                </div>
                <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                    <p className="text-xs text-muted-foreground">Sudah Ditarik</p>
                    <p className="mt-1 text-xl font-semibold text-muted-foreground">{fmt(wallet.withdrawn)}</p>
                </div>
            </div>

            <div className="mb-5 flex items-start gap-3 rounded-2xl border border-primary-200 bg-primary-50 p-4">
                <Wallet className="mt-0.5 h-5 w-5 shrink-0 text-primary-600" strokeWidth={1.8} />
                <div className="text-sm text-primary-800">
                    <p className="font-medium">Saldo dari pembayaran online (QRIS/VA/E-Wallet)</p>
                    <p className="mt-0.5 text-primary-700/80">
                        Setiap pembayaran online otomatis masuk ke saldo di atas. Fitur penarikan dana akan segera hadir —
                        untuk saat ini, hubungi developer/admin platform untuk proses penarikan.
                    </p>
                </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <div className="border-b border-border px-5 py-4">
                    <h3 className="font-semibold text-foreground">Riwayat Transaksi</h3>
                </div>
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-border bg-muted/60 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            <th className="px-5 py-3">Tanggal</th>
                            <th className="px-5 py-3">Tipe</th>
                            <th className="px-5 py-3">Keterangan</th>
                            <th className="px-5 py-3 text-right">Jumlah</th>
                            <th className="px-5 py-3 text-right">Saldo Setelah</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.data.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">
                                    <Wallet className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" strokeWidth={1.5} />
                                    Belum ada transaksi.
                                </td>
                            </tr>
                        ) : (
                            transactions.data.map((t) => (
                                <tr key={t.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                                    <td className="px-5 py-3 text-muted-foreground">{dt(t.created_at)}</td>
                                    <td className="px-5 py-3">{t.type_label}</td>
                                    <td className="px-5 py-3 text-muted-foreground">{t.description ?? "-"}</td>
                                    <td className={`px-5 py-3 text-right font-medium ${t.amount >= 0 ? "text-green-600" : "text-destructive"}`}>
                                        {t.amount >= 0 ? "+" : ""}{fmt(t.amount)}
                                    </td>
                                    <td className="px-5 py-3 text-right text-muted-foreground">{fmt(t.balance_after)}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </AuthenticatedLayout>
    );
}
