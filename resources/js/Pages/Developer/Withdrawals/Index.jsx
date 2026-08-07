import DeveloperLayout from "@/Layouts/DeveloperLayout";
import { Head, router, usePage } from "@inertiajs/react";
import { useState } from "react";
import {
    AlertTriangle,
    ArrowDownToLine,
    CheckCircle,
    CircleCheck,
    Search,
    XCircle,
    X,
} from "lucide-react";

const fmt = (n) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(n ?? 0);

const fmtDate = (d) =>
    d
        ? new Date(d).toLocaleString("id-ID", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
          })
        : "—";

const STATUS_COLOR = {
    pending: "bg-warning/10 text-warning ring-warning/20",
    completed: "bg-success/10 text-success ring-success/20",
    rejected: "bg-destructive/10 text-destructive ring-destructive/20",
};

const STATUS_LABEL = {
    pending: "Menunggu",
    completed: "Selesai",
    rejected: "Ditolak",
};

export default function WithdrawalsIndex({ withdrawals = [], isSandbox = false }) {
    const { flash } = usePage().props;
    const [processing, setProcessing] = useState(false);
    const [rejectTarget, setRejectTarget] = useState(null);
    const [rejectNotes, setRejectNotes] = useState("");
    const [statusFilter, setStatusFilter] = useState(
        new URLSearchParams(window.location.search).get("status") ?? "",
    );
    const [searchQuery, setSearchQuery] = useState("");

    const filteredWithdrawals = withdrawals.filter((w) => {
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            if (!(w.store?.name ?? "").toLowerCase().includes(q)) return false;
        }
        return true;
    });

    const pendingCount = withdrawals.filter((w) => w.status === "pending").length;

    const handleApprove = (id) => {
        if (processing) return;
        if (!confirm("Setujui penarikan dana ini?")) return;
        setProcessing(true);
        router.post(
            route("developer.withdrawals.approve", id),
            {},
            {
                preserveScroll: true,
                onFinish: () => setProcessing(false),
            },
        );
    };

    const handleReject = () => {
        if (processing || !rejectTarget) return;
        if (!rejectNotes.trim()) return;
        setProcessing(true);
        router.post(
            route("developer.withdrawals.reject", rejectTarget.id),
            { admin_notes: rejectNotes },
            {
                preserveScroll: true,
                onFinish: () => {
                    setProcessing(false);
                    setRejectTarget(null);
                    setRejectNotes("");
                },
            },
        );
    };

    const applyStatusFilter = (value) => {
        setStatusFilter(value);
        router.get(
            route("developer.withdrawals.index"),
            value ? { status: value } : {},
            { preserveState: true, replace: true },
        );
    };

    return (
        <DeveloperLayout
            header={
                <span className="flex items-center gap-2">
                    Penarikan Dana
                    {isSandbox && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-[11px] font-semibold text-warning">
                            <AlertTriangle className="h-3 w-3" />
                            Sandbox
                        </span>
                    )}
                </span>
            }
        >
            <Head title="Penarikan Dana" />

            {flash?.success && (
                <div className="mb-5 flex items-center gap-3 rounded-2xl border border-success/20 bg-success/10 px-4 py-3 text-sm font-medium text-success">
                    <CircleCheck className="h-4 w-4 shrink-0" strokeWidth={2} />
                    {flash.success}
                </div>
            )}
            {flash?.error && (
                <div className="mb-5 flex items-center gap-3 rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
                    <AlertTriangle className="h-4 w-4 shrink-0" strokeWidth={2} />
                    {flash.error}
                </div>
            )}

            {isSandbox && (
                <div className="mb-5 flex items-center gap-3 rounded-2xl border border-warning/20 bg-warning/10 px-4 py-3 text-sm font-medium text-warning">
                    <AlertTriangle className="h-4 w-4 shrink-0" strokeWidth={2} />
                    Mode Sandbox Aktif — Saldo production tidak ada. Penarikan tidak bisa diproses.
                </div>
            )}

            {/* Stat cards */}
            <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                    <p className="text-xs text-muted-foreground">Semua Pengajuan</p>
                    <p className="mt-1 text-lg font-semibold text-foreground">{withdrawals.length}</p>
                </div>
                <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                    <p className="text-xs text-muted-foreground">Menunggu</p>
                    <p className="mt-1 text-lg font-semibold text-warning">{pendingCount}</p>
                </div>
                <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                    <p className="text-xs text-muted-foreground">Selesai</p>
                    <p className="mt-1 text-lg font-semibold text-success">
                        {withdrawals.filter((w) => w.status === "completed").length}
                    </p>
                </div>
                <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                    <p className="text-xs text-muted-foreground">Ditolak</p>
                    <p className="mt-1 text-lg font-semibold text-destructive">
                        {withdrawals.filter((w) => w.status === "rejected").length}
                    </p>
                </div>
            </div>

            {/* Filter */}
            <div className="mb-5 flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div className="flex-1 min-w-[180px]">
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Cari toko</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.8} />
                        <input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full rounded-xl border border-input bg-background pl-9 pr-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
                            placeholder="Nama toko..."
                        />
                    </div>
                </div>
                <div className="min-w-[140px]">
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Status</label>
                    <select
                        value={statusFilter}
                        onChange={(e) => applyStatusFilter(e.target.value)}
                        className="block w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
                    >
                        <option value="">Semua</option>
                        <option value="pending">Menunggu</option>
                        <option value="completed">Selesai</option>
                        <option value="rejected">Ditolak</option>
                    </select>
                </div>
            </div>

            {/* Tabel */}
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-popover text-xs uppercase tracking-wide text-card-foreground">
                            <tr>
                                <th className="px-5 py-3 text-left font-semibold">Tanggal</th>
                                <th className="px-5 py-3 text-left font-semibold">Toko</th>
                                <th className="px-5 py-3 text-right font-semibold">Jumlah</th>
                                <th className="px-5 py-3 text-left font-semibold">Bank</th>
                                <th className="px-5 py-3 text-left font-semibold">Rekening</th>
                                <th className="px-5 py-3 text-left font-semibold">Catatan User</th>
                                <th className="px-5 py-3 text-center font-semibold">Status</th>
                                <th className="px-5 py-3 text-center font-semibold">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border bg-background">
                            {filteredWithdrawals.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-5 py-10 text-center text-muted-foreground">
                                        <ArrowDownToLine className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" strokeWidth={1.5} />
                                        Belum ada pengajuan penarikan.
                                    </td>
                                </tr>
                            ) : (
                                filteredWithdrawals.map((w) => (
                                    <tr key={w.id} className="transition hover:bg-[rgb(var(--color-table-hover))]">
                                        <td className="px-5 py-3 text-muted-foreground whitespace-nowrap">
                                            {fmtDate(w.created_at)}
                                        </td>
                                        <td className="px-5 py-3">
                                            <p className="font-medium text-foreground">{w.store?.name ?? "-"}</p>
                                            <p className="text-xs text-muted-foreground">{w.store?.code ?? ""}</p>
                                        </td>
                                        <td className="px-5 py-3 text-right font-semibold text-foreground">
                                            {fmt(w.amount)}
                                        </td>
                                        <td className="px-5 py-3 text-foreground">{w.bank_name}</td>
                                        <td className="px-5 py-3">
                                            <p className="text-foreground">{w.bank_account_number}</p>
                                            <p className="text-xs text-muted-foreground">{w.bank_account_name}</p>
                                        </td>
                                        <td className="px-5 py-3 text-muted-foreground max-w-[200px] truncate" title={w.notes}>
                                            {w.notes || "-"}
                                        </td>
                                        <td className="px-5 py-3 text-center">
                                            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${STATUS_COLOR[w.status] ?? STATUS_COLOR.pending}`}>
                                                {STATUS_LABEL[w.status] ?? w.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3">
                                            {w.status === "pending" ? (
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <button
                                                        onClick={() => handleApprove(w.id)}
                                                        disabled={processing || isSandbox}
                                                        title={isSandbox ? "Tersedia saat mode production" : undefined}
                                                        className="inline-flex items-center gap-1 rounded-xl bg-success/10 px-3 py-1.5 text-xs font-semibold text-success transition hover:bg-success/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        <CheckCircle className="h-3.5 w-3.5" strokeWidth={2.5} />
                                                        Setuju
                                                    </button>
                                                    <button
                                                        onClick={() => { setRejectTarget(w); setRejectNotes(""); }}
                                                        disabled={processing}
                                                        className="inline-flex items-center gap-1 rounded-xl bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                                                    >
                                                        <XCircle className="h-3.5 w-3.5" strokeWidth={2.5} />
                                                        Tolak
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">—</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Detail modal for rejected/processed */}
            {rejectTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => { setRejectTarget(null); setRejectNotes(""); }} />
                    <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-popover shadow-2xl">
                        <div className="flex items-center justify-between border-b border-border px-6 py-4">
                            <h3 className="text-base font-semibold text-popover-foreground">
                                Tolak Penarikan
                            </h3>
                            <button onClick={() => { setRejectTarget(null); setRejectNotes(""); }} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted">
                                <X className="h-4 w-4" strokeWidth={2} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="rounded-xl bg-muted p-4 text-sm">
                                <p className="font-semibold text-foreground">{rejectTarget.store?.name ?? "-"}</p>
                                <p className="text-muted-foreground mt-0.5">
                                    {rejectTarget.bank_name} · {rejectTarget.bank_account_number} · {fmt(rejectTarget.amount)}
                                </p>
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-foreground">
                                    Alasan penolakan <span className="text-destructive">*</span>
                                </label>
                                <textarea
                                    value={rejectNotes}
                                    onChange={(e) => setRejectNotes(e.target.value)}
                                    rows={3}
                                    className="block w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
                                    placeholder="cth. Data rekening tidak valid, jumlah tidak sesuai, dsb."
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => { setRejectTarget(null); setRejectNotes(""); }} className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted transition">
                                    Batal
                                </button>
                                <button
                                    onClick={handleReject}
                                    disabled={processing || !rejectNotes.trim()}
                                    className="inline-flex items-center gap-2 rounded-xl bg-destructive px-5 py-2.5 text-sm font-semibold text-destructive-foreground transition hover:bg-destructive/90 disabled:opacity-60"
                                >
                                    {processing && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
                                    Tolak
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </DeveloperLayout>
    );
}
