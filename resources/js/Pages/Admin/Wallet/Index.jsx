import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";
import { AlertTriangle, ArrowDownToLine, Wallet } from "lucide-react";
import Button from "@/Components/ui/Button";

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

export default function Index({ wallet, transactions, isSandbox = false }) {
    const hasSandboxBalance = wallet.balance > wallet.withdrawable_balance;
    const canWithdraw = wallet.withdrawable_balance >= 50000;

    return (
        <AuthenticatedLayout
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

            <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                    <p className="text-xs text-muted-foreground">Total Saldo</p>
                    <p className="mt-1 text-xl font-semibold text-foreground">{fmt(wallet.balance)}</p>
                    {hasSandboxBalance && (
                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                            Termasuk saldo sandbox
                        </p>
                    )}
                </div>
                <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                    <p className="text-xs text-muted-foreground">Bisa Ditarik</p>
                    <p className="mt-1 text-xl font-semibold text-success">{fmt(wallet.withdrawable_balance)}</p>
                    {hasSandboxBalance && (
                        <p className="mt-0.5 text-[10px] text-success/80">
                            Hanya dari transaksi production
                        </p>
                    )}
                </div>
                <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                    <p className="text-xs text-muted-foreground">Pending</p>
                    <p className="mt-1 text-xl font-semibold text-warning">{fmt(wallet.pending_balance)}</p>
                </div>
                <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                    <p className="text-xs text-muted-foreground">Sudah Ditarik</p>
                    <p className="mt-1 text-xl font-semibold text-muted-foreground">{fmt(wallet.withdrawn)}</p>
                </div>
            </div>

            {isSandbox ? (
                <div className="mb-5 flex items-center gap-3 rounded-2xl border border-warning/20 bg-warning/10 p-4">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" strokeWidth={1.8} />
                    <div className="text-sm text-warning">
                        <p className="font-medium">Mode Sandbox Aktif</p>
                        <p className="mt-0.5 text-warning/80">
                            Payment gateway masih dalam mode sandbox. Semua saldo tidak bisa ditarik.
                            Hubungi developer untuk beralih ke mode production.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-primary/10 p-4">
                    <div className="flex items-start gap-3">
                        <Wallet className="mt-0.5 h-5 w-5 shrink-0 text-primary" strokeWidth={1.8} />
                        <div className="text-sm text-primary">
                            <p className="font-medium">Saldo dari pembayaran online (QRIS/VA/E-Wallet)</p>
                            <p className="mt-0.5 text-primary/80">
                                Setiap pembayaran online otomatis masuk ke saldo di atas.
                                Minimal penarikan Rp 50.000.
                            </p>
                        </div>
                    </div>
                    {canWithdraw && (
                        <Link
                            href={route("admin.withdrawals.index")}
                            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                        >
                            <ArrowDownToLine className="h-4 w-4" strokeWidth={2} />
                            Penarikan Dana
                        </Link>
                    )}
                    {!canWithdraw && hasSandboxBalance && (
                        <span className="shrink-0 rounded-full bg-warning/10 px-3 py-1.5 text-xs font-semibold text-warning">
                            ⚠ Saldo sandbox tidak bisa ditarik
                        </span>
                    )}
                </div>
            )}

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
                            <th className="px-5 py-3 text-center font-semibold">Env</th>
                            <th className="px-5 py-3 text-right font-semibold">Saldo Setelah</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-background">
                        {transactions.data.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">
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
                                    <td className="px-5 py-3 text-center">
                                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                            t.environment === "sandbox"
                                                ? "bg-warning/10 text-warning"
                                                : "bg-success/10 text-success"
                                        }`}>
                                            {t.environment === "sandbox" ? "Sandbox" : "Live"}
                                        </span>
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
