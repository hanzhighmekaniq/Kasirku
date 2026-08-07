import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader";
import { Head, Link, useForm, usePage } from "@inertiajs/react";
import { useState } from "react";
import Button from "@/Components/ui/Button";
import Field from "@/Components/ui/Field";
import CurrencyInput from "@/Components/ui/CurrencyInput";
import Modal from "@/Components/Modal";
import { Plus, X, ArrowLeft, ArrowDownToLine, AlertTriangle, Clock, CheckCircle, XCircle } from "lucide-react";

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

const STATUS_CONFIG = {
    pending: {
        label: "Menunggu",
        icon: Clock,
        className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    },
    approved: {
        label: "Disetujui",
        icon: Clock,
        className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    },
    completed: {
        label: "Selesai",
        icon: CheckCircle,
        className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    },
    rejected: {
        label: "Ditolak",
        icon: XCircle,
        className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    },
};

function statusBadge(status) {
    const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
    const Icon = cfg.icon;
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${cfg.className}`}>
            <Icon className="h-3.5 w-3.5" strokeWidth={2} />
            {cfg.label}
        </span>
    );
}

export default function Withdrawals({ withdrawals, isSandbox = false, withdrawableBalance = 0, wallet = { balance: 0 } }) {
    const { flash } = usePage().props;
    const [showCreate, setShowCreate] = useState(false);
    const canWithdraw = withdrawableBalance >= 50000;
    const hasSandboxBalance = wallet.balance > withdrawableBalance;

    const { data, setData, post, processing, errors, reset } = useForm({
        amount: "",
        bank_name: "",
        bank_account_name: "",
        bank_account_number: "",
        notes: "",
    });

    const handleCreate = (e) => {
        e.preventDefault();
        post(route("admin.withdrawals.store"), {
            onSuccess: () => {
                setShowCreate(false);
                reset();
            },
        });
    };

    const handleCancel = (id) => {
        if (!confirm("Yakin ingin membatalkan pengajuan penarikan ini?")) return;
        post(route("admin.withdrawals.cancel", id));
    };

    const inputCls =
        "block w-full rounded-xl border bg-card px-3 py-2.5 text-sm shadow-sm transition focus:border-ring focus:ring-2 focus:ring-ring/20";

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <Link
                        href={route("admin.wallet.index")}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground shadow-sm transition hover:bg-muted hover:text-foreground"
                    >
                        <ArrowLeft className="h-4 w-4" strokeWidth={2} />
                    </Link>
                    <div>
                        <div className="text-sm font-semibold text-foreground">Penarikan Dana</div>
                        <div className="text-[11px] text-muted-foreground">Wallet</div>
                    </div>
                </div>
            }>
            <PageHeader
                title="Penarikan Dana"
                breadcrumbs={["Admin", "Wallet", "Penarikan"]}
                heading={
                    <>
                        Penarikan{" "}
                        <span className="bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
                            Dana
                        </span>
                    </>
                }
                description="Kelola pengajuan penarikan dana dari saldo wallet."
                action={
                    canWithdraw && (
                        <Button icon={Plus} onClick={() => setShowCreate(true)}>
                            Ajukan Penarikan
                        </Button>
                    )
                }
            />

            {isSandbox && (
                <div className="mb-4 flex items-center gap-3 rounded-2xl border border-warning/20 bg-warning/10 p-4 text-sm text-warning">
                    <AlertTriangle className="h-4 w-4 shrink-0" strokeWidth={2} />
                    <p>
                        <span className="font-semibold">Mode Sandbox Aktif</span> —
                        Seluruh saldo berasal dari transaksi sandbox dan tidak dapat ditarik.
                    </p>
                </div>
            )}

            {!isSandbox && hasSandboxBalance && (
                <div className="mb-4 flex items-center gap-3 rounded-2xl border border-warning/20 bg-warning/10 p-4 text-sm text-warning">
                    <AlertTriangle className="h-4 w-4 shrink-0" strokeWidth={2} />
                    <p>
                        <span className="font-semibold">Saldo sandbox terdeteksi</span> —
                        Rp {fmt(wallet.balance - wallet.withdrawable_balance)} dari transaksi sandbox tidak dapat ditarik.
                    </p>
                </div>
            )}

            {!isSandbox && !hasSandboxBalance && withdrawableBalance < 50000 && (
                <div className="mb-4 flex items-center gap-3 rounded-2xl border border-warning/20 bg-warning/10 p-4 text-sm text-warning">
                    <AlertTriangle className="h-4 w-4 shrink-0" strokeWidth={2} />
                    <p>
                        Saldo production belum mencukupi untuk penarikan (minimal Rp 50.000).
                    </p>
                </div>
            )}

            {flash?.success && (
                <div className="mb-4 rounded-xl border border-success/20 bg-success/10 p-4 text-sm text-success">
                    {flash.success}
                </div>
            )}

            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <table className="w-full text-sm">
                    <thead className="bg-popover text-xs uppercase tracking-wide text-card-foreground">
                        <tr>
                            <th className="px-5 py-3 text-left font-semibold">Tanggal</th>
                            <th className="px-5 py-3 text-left font-semibold">Jumlah</th>
                            <th className="px-5 py-3 text-left font-semibold">Bank</th>
                            <th className="px-5 py-3 text-left font-semibold">Rekening</th>
                            <th className="px-5 py-3 text-left font-semibold">Status</th>
                            <th className="px-5 py-3 text-right font-semibold">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-background">
                        {withdrawals.data.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">
                                    <ArrowDownToLine className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" strokeWidth={1.5} />
                                    Belum ada pengajuan penarikan.
                                </td>
                            </tr>
                        ) : (
                            withdrawals.data.map((w) => (
                                <tr key={w.id} className="transition hover:bg-[rgb(var(--color-table-hover))]">
                                    <td className="px-5 py-3 text-muted-foreground">{dt(w.created_at)}</td>
                                    <td className="px-5 py-3 font-medium text-foreground">{fmt(w.amount)}</td>
                                    <td className="px-5 py-3 text-muted-foreground">{w.bank_name}</td>
                                    <td className="px-5 py-3 text-muted-foreground">
                                        <div>{w.bank_account_name}</div>
                                        <div className="text-xs">{w.bank_account_number}</div>
                                    </td>
                                    <td className="px-5 py-3">{statusBadge(w.status)}</td>
                                    <td className="px-5 py-3 text-right">
                                        {w.status === "pending" && (
                                            <Button
                                                variant="danger"
                                                size="sm"
                                                onClick={() => handleCancel(w.id)}
                                            >
                                                Batal
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {withdrawals.data.length > 0 && withdrawals.links && (
                <div className="mt-4 flex justify-center gap-2">
                    {withdrawals.links.map((link, i) =>
                        link.url ? (
                            <Link
                                key={i}
                                href={link.url}
                                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                                    link.active
                                        ? "bg-primary text-primary-foreground"
                                        : "text-muted-foreground hover:bg-muted"
                                }`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ) : (
                            <span
                                key={i}
                                className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground/40"
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        )
                    )}
                </div>
            )}

            <Modal show={showCreate} onClose={() => setShowCreate(false)} maxWidth="lg">
                <div className="p-6">
                    <div className="mb-5 flex items-center justify-between">
                        <h2 className="text-lg font-bold text-foreground">Ajukan Penarikan</h2>
                        <button
                            onClick={() => setShowCreate(false)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
                        >
                            <X className="h-4 w-4" strokeWidth={2} />
                        </button>
                    </div>

                    <form onSubmit={handleCreate} className="space-y-4">
                        <Field label="Jumlah Penarikan" required error={errors.amount}>
                            <CurrencyInput
                                value={data.amount}
                                onChange={(v) => setData("amount", v)}
                                placeholder="0"
                                error={!!errors.amount}
                                required
                            />
                        </Field>

                        <Field label="Nama Bank" required error={errors.bank_name}>
                            <input
                                type="text"
                                value={data.bank_name}
                                onChange={(e) => setData("bank_name", e.target.value)}
                                className={inputCls}
                                placeholder="Contoh: BCA, Mandiri, BRI..."
                                required
                            />
                        </Field>

                        <Field label="Nama Pemilik Rekening" required error={errors.bank_account_name}>
                            <input
                                type="text"
                                value={data.bank_account_name}
                                onChange={(e) => setData("bank_account_name", e.target.value)}
                                className={inputCls}
                                placeholder="Nama sesuai rekening"
                                required
                            />
                        </Field>

                        <Field label="Nomor Rekening" required error={errors.bank_account_number}>
                            <input
                                type="text"
                                value={data.bank_account_number}
                                onChange={(e) => setData("bank_account_number", e.target.value)}
                                className={inputCls}
                                placeholder="Nomor rekening"
                                required
                            />
                        </Field>

                        <Field label="Catatan" error={errors.notes}>
                            <textarea
                                value={data.notes}
                                onChange={(e) => setData("notes", e.target.value)}
                                rows={3}
                                className={inputCls}
                                placeholder="Catatan tambahan (opsional)"
                            />
                        </Field>

                        <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
                            <Button
                                variant="outline"
                                onClick={() => setShowCreate(false)}
                                type="button"
                            >
                                Batal
                            </Button>
                            <Button type="submit" loading={processing}>
                                Kirim Pengajuan
                            </Button>
                        </div>
                    </form>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
