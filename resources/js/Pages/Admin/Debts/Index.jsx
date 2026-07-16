import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router, usePage } from "@inertiajs/react";
import { useState } from "react";

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
        <AuthenticatedLayout
            header={
                <h2 className="text-lg font-semibold text-slate-800">Hutang / Kasbon</h2>
            }
        >
            <Head title="Hutang / Kasbon" />

            {flash?.success && (
                <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{flash.success}</div>
            )}
            {flash?.error && (
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{flash.error}</div>
            )}

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-3.5">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-700">Daftar Pelanggan Berhutang</span>
                            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600">
                                {customers.length}
                            </span>
                        </div>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari pelanggan..."
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100"
                        />
                    </div>
                </div>

                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
                            <svg className="h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="mt-4 text-base font-semibold text-slate-800">
                            {search ? "Pelanggan tidak ditemukan" : "Tidak ada pelanggan berhutang"}
                        </h3>
                        <p className="mt-1 max-w-sm text-sm text-slate-500">
                            {search ? "Coba kata kunci lain." : "Semua pelanggan sudah melunasi hutangnya."}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    <th className="px-4 py-3.5">Pelanggan</th>
                                    <th className="px-4 py-3.5">Telepon</th>
                                    <th className="px-4 py-3.5 text-right">Total Hutang</th>
                                    <th className="px-4 py-3.5 text-right">Limit Kredit</th>
                                    <th className="px-4 py-3.5 text-right">Sisa Limit</th>
                                    <th className="px-4 py-3.5 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filtered.map((c) => (
                                    <tr key={c.id} className="transition hover:bg-slate-50/70">
                                        <td className="px-4 py-3.5">
                                            <p className="font-medium text-slate-800">{c.name}</p>
                                            {c.code && <p className="text-xs text-slate-400">{c.code}</p>}
                                        </td>
                                        <td className="px-4 py-3.5 text-slate-600">{c.phone || "—"}</td>
                                        <td className="px-4 py-3.5 text-right">
                                            <span className="font-semibold text-red-600">{fmt(c.debt_balance)}</span>
                                        </td>
                                        <td className="px-4 py-3.5 text-right text-slate-600">
                                            {(c.credit_limit ?? 0) > 0 ? fmt(c.credit_limit) : "—"}
                                        </td>
                                        <td className="px-4 py-3.5 text-right">
                                            <span className={(c.credit_limit ?? 0) > 0 && (c.credit_limit - c.debt_balance) < 50000 ? "font-semibold text-amber-600" : "text-slate-600"}>
                                                {(c.credit_limit ?? 0) > 0 ? fmt(c.credit_limit - c.debt_balance) : "—"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5 text-right">
                                            <button
                                                type="button"
                                                onClick={() => { setPayModal(c); setPayAmount(""); }}
                                                className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition"
                                            >
                                                Lunasi
                                            </button>
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
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setPayModal(null)} />
                    <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
                        <h3 className="text-base font-bold text-slate-800">Lunasi Hutang</h3>
                        <p className="mt-1 text-sm text-slate-500">
                            {payModal.name} — Sisa hutang: <strong>{fmt(payModal.debt_balance)}</strong>
                        </p>
                        <div className="mt-4">
                            <label className="mb-1 block text-xs font-semibold text-slate-500">Jumlah Pelunasan</label>
                            <div className="relative">
                                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-slate-400">Rp</span>
                                <input
                                    type="number"
                                    value={payAmount}
                                    onChange={(e) => setPayAmount(e.target.value)}
                                    min="0"
                                    max={payModal.debt_balance}
                                    placeholder="0"
                                    autoFocus
                                    className="block w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                />
                            </div>
                        </div>
                        <div className="mt-5 flex justify-end gap-2">
                            <button type="button" onClick={() => setPayModal(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50">Batal</button>
                            <button type="button" onClick={handlePay} disabled={paying || !payAmount || Number(payAmount) <= 0} className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
                                {paying ? "Memproses..." : "Bayar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
