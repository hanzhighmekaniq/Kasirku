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
        <AuthenticatedLayout header="Wallet"
            header={
                <div className="leading-tight">
                    <div className="text-sm font-semibold text-foreground">
                        Wallet
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                        Halaman
                    </div>
                </div>
            }>
            <Head title="Wallet" />

            {flash?.success && (
                <div className="mb-4 rounded-xl border border-success/20 bg-success/10 px-4 py-3 text-sm text-success">
                    {flash.success}
                </div>
            )}

            <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                    <p className="text-xs text-muted-foreground">Saldo Tersedia</p>
                    <p className="mt-1 text-xl font-semibold text-success">{fmt(wallet.balance)}</p>
                </div>
                <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                    <p className="text-xs text-muted-foreground">Saldo Pending</p>
                    <p className="mt-1 text-xl font-semibold text-warning">{fmt(wallet.pending_balance)}</p>
                </div>
                <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                    <p className="text-xs text-muted-foreground">Sudah Ditarik</p>
                    <p className="mt-1 text-xl font-semibold text-muted-foreground">{fmt(wallet.withdrawn)}</p>
                </div>
            </div>

            <div className="mb-5 flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/10 p-4">
                <Wallet className="mt-0.5 h-5 w-5 shrink-0 text-primary" strokeWidth={1.8} />
                <div className="text-sm text-primary">
                    <p className="font-medium">Saldo dari pembayaran online (QRIS/VA/E-Wallet)</p>
                    <p className="mt-0.5 text-primary/80">
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
                    <thead className="bg-popover text-xs uppercase tracking-wide text-card-foreground">
                        <tr>
                            <th className="px-5 py-3 text-left font-semibold">Tanggal</th>
                            <th className="px-5 py-3 text-left font-semibold">Tipe</th>
                            <th className="px-5 py-3 text-left font-semibold">Keterangan</th>
                            <th className="px-5 py-3 text-right font-semibold">Jumlah</th>
                            <th className="px-5 py-3 text-right font-semibold">Saldo Setelah</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-background">
                        {transactions.data.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">
                                    <Wallet className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" strokeWidth={1.5} />
                                    Belum ada transaksi.
                                </td>
                            </tr>
                        ) : (
                            transactions.data.map((t) => (
                                <tr key={t.id} className="transition hover:bg-[rgb(var(--color-table-hover))]">
                                    <td className="px-5 py-3 text-muted-foreground">{dt(t.created_at)}</td>
                                    <td className="px-5 py-3">{t.type_label}</td>
                                    <td className="px-5 py-3 text-muted-foreground">{t.description ?? "-"}</td>
                                    <td className={`px-5 py-3 text-right font-medium ${t.amount >= 0 ? "text-success" : "text-destructive"}`}>
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
