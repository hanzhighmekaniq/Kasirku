import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader";
import { Head, router, usePage } from "@inertiajs/react";
import { useState } from "react";
import Button from "@/Components/ui/Button";

const fmt = (n) =>
    "Rp" +
    Number(n ?? 0).toLocaleString("id-ID", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });

export default function Index({ customers }) {
    const { flash } = usePage().props;
    const [search, setSearch] = useState("");
    const [payModal, setPayModal] = useState(null);
    const [payAmount, setPayAmount] = useState("");
    const [paying, setPaying] = useState(false);

    const filtered = search.trim()
        ? customers.filter(
              (c) =>
                  c.name.toLowerCase().includes(search.toLowerCase()) ||
                  (c.code || "").toLowerCase().includes(search.toLowerCase()) ||
                  (c.phone || "").includes(search),
          )
        : customers;

    const handlePay = () => {
        if (!payModal || !payAmount || Number(payAmount) <= 0) return;
        setPaying(true);
        router.post(
            route("admin.debts.pay", payModal.id),
            { amount: Number(payAmount) },
            { preserveScroll: true, onFinish: () => { setPaying(false); setPayModal(null); setPayAmount(""); } },
        );
    };

    return (
        <AuthenticatedLayout>
            <PageHeader
                title="Hutang / Kasbon"
                breadcrumbs={["Admin", "Kasbon"]}
                heading={
                    <>
                        Kelola{" "}
                        <span className="bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
                            Hutang
                        </span>{" "}
                        Pelanggan
                    </>
                }
                description="Pantau dan catat pembayaran hutang / kasbon pelanggan."
            />

            {flash?.success && (
                <div className="mb-5 rounded-xl border border-success/20 bg-success/10 px-4 py-3 text-sm font-medium text-success">{flash.success}</div>
            )}
            {flash?.error && (
                <div className="mb-5 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">{flash.error}</div>
            )}

            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <div className="border-b border-border bg-muted/50 px-5 py-3.5">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-foreground">Daftar Pelanggan Berhutang</span>
                            <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive">
                                {customers.length}
                            </span>
                        </div>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari pelanggan..."
                            className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-foreground focus:border-ring focus:ring-1 focus:ring-ring/20"
                        />
                    </div>
                </div>

                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-success/10">
                            <svg className="h-8 w-8 text-success" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="mt-4 text-base font-semibold text-foreground">
                            {search ? "Pelanggan tidak ditemukan" : "Tidak ada pelanggan berhutang"}
                        </h3>
                        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                            {search ? "Coba kata kunci lain." : "Semua pelanggan sudah melunasi hutangnya."}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border bg-muted/50 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    <th className="px-4 py-3.5">Pelanggan</th>
                                    <th className="px-4 py-3.5">Telepon</th>
                                    <th className="px-4 py-3.5 text-right">Total Hutang</th>
                                    <th className="px-4 py-3.5 text-right">Limit Kredit</th>
                                    <th className="px-4 py-3.5 text-right">Sisa Limit</th>
                                    <th className="px-4 py-3.5 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filtered.map((c) => (
                                    <tr key={c.id} className="transition hover:bg-muted/50">
                                        <td className="px-4 py-3.5">
                                            <p className="font-medium text-foreground">{c.name}</p>
                                            {c.code && <p className="text-xs text-muted-foreground">{c.code}</p>}
                                        </td>
                                        <td className="px-4 py-3.5 text-muted-foreground">{c.phone || "—"}</td>
                                        <td className="px-4 py-3.5 text-right">
                                            <span className="font-semibold text-destructive">{fmt(c.debt_balance)}</span>
                                        </td>
                                        <td className="px-4 py-3.5 text-right text-muted-foreground">
                                            {(c.credit_limit ?? 0) > 0 ? fmt(c.credit_limit) : "—"}
                                        </td>
                                        <td className="px-4 py-3.5 text-right">
                                            <span className={(c.credit_limit ?? 0) > 0 && (c.credit_limit - c.debt_balance) < 50000 ? "font-semibold text-warning" : "text-muted-foreground"}>
                                                {(c.credit_limit ?? 0) > 0 ? fmt(c.credit_limit - c.debt_balance) : "—"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5 text-right">
                                            <Button
                                                type="button"
                                                variant="success"
                                                size="sm"
                                                onClick={() => { setPayModal(c); setPayAmount(""); }}
                                            >
                                                Lunasi
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pay Modal */}
            {payModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setPayModal(null)} />
                    <div className="relative w-full max-w-sm rounded-2xl bg-popover p-6 shadow-2xl">
                        <h3 className="text-base font-bold text-foreground">Lunasi Hutang</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {payModal.name} — Sisa hutang: <strong>{fmt(payModal.debt_balance)}</strong>
                        </p>
                        <div className="mt-4">
                            <label className="mb-1 block text-xs font-semibold text-muted-foreground">Jumlah Pelunasan</label>
                            <div className="relative">
                                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">Rp</span>
                                <input
                                    type="number"
                                    value={payAmount}
                                    onChange={(e) => setPayAmount(e.target.value)}
                                    min="0"
                                    max={payModal.debt_balance}
                                    placeholder="0"
                                    autoFocus
                                    className="block w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm text-foreground focus:border-ring focus:ring-2 focus:ring-ring/20"
                                />
                            </div>
                        </div>
                        <div className="mt-5 flex justify-end gap-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => setPayModal(null)}>
                                Batal
                            </Button>
                            <Button
                                type="button"
                                variant="success"
                                size="sm"
                                onClick={handlePay}
                                disabled={!payAmount || Number(payAmount) <= 0}
                                loading={paying}
                            >
                                {paying ? "Memproses..." : "Bayar"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
