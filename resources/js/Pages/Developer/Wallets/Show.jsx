import DeveloperLayout from "@/Layouts/DeveloperLayout";
import { Head, Link, useForm, usePage } from "@inertiajs/react";
import { useState } from "react";
import { ArrowLeft, Plus, Wallet } from "lucide-react";
import Button from "@/Components/ui/Button";
import Field from "@/Components/ui/Field";

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

export default function Show({ store, wallet, transactions }) {
    const { flash } = usePage().props;
    const [showAdjust, setShowAdjust] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        amount: "",
        description: "",
    });

    const submitAdjust = (e) => {
        e.preventDefault();
        post(route("developer.wallets.adjust", { store: store.id }), {
            onSuccess: () => {
                reset();
                setShowAdjust(false);
            },
        });
    };

    return (
        <DeveloperLayout
            header={
                <div className="flex items-center gap-3">
                    <Link
                        href={route("developer.wallets.index")}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
                        aria-label="Kembali"
                    >
                        <ArrowLeft className="h-5 w-5" strokeWidth={1.8} />
                    </Link>
                    <h2 className="text-lg font-semibold text-foreground">Wallet — {store.name}</h2>
                </div>
            }
        >
            <Head title={`Wallet — ${store.name}`} />

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

            <div className="mb-5 rounded-2xl border border-border bg-card shadow-sm">
                <div className="flex items-center justify-between border-b border-border px-5 py-4">
                    <h3 className="font-semibold text-foreground">Penyesuaian Saldo Manual</h3>
                    <Button size="sm" variant="outline" icon={Plus} onClick={() => setShowAdjust((v) => !v)}>
                        {showAdjust ? "Batal" : "Sesuaikan Saldo"}
                    </Button>
                </div>
                {showAdjust && (
                    <form onSubmit={submitAdjust} className="space-y-4 px-5 py-5">
                        <Field label="Jumlah (gunakan minus untuk mengurangi saldo)" required error={errors.amount}>
                            <input
                                type="number"
                                step="0.01"
                                value={data.amount}
                                onChange={(e) => setData("amount", e.target.value)}
                                placeholder="Contoh: 50000 atau -50000"
                                className="block w-full rounded-xl border bg-card px-3 py-2.5 text-sm shadow-sm transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                            />
                        </Field>
                        <Field label="Keterangan" required error={errors.description}>
                            <input
                                type="text"
                                value={data.description}
                                onChange={(e) => setData("description", e.target.value)}
                                placeholder="Alasan penyesuaian (refund, koreksi, dll)"
                                className="block w-full rounded-xl border bg-card px-3 py-2.5 text-sm shadow-sm transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                            />
                        </Field>
                        <div className="flex justify-end">
                            <Button type="submit" loading={processing}>
                                {processing ? "Menyimpan..." : "Simpan Penyesuaian"}
                            </Button>
                        </div>
                    </form>
                )}
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
        </DeveloperLayout>
    );
}
