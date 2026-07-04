import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router } from "@inertiajs/react";
import { useMemo, useState } from "react";

const fmt   = (v) => `Rp ${Number(v || 0).toLocaleString("id-ID")}`;
const fmtDt = (d) => d ? new Date(d).toLocaleString("id-ID", { dateStyle: "long", timeStyle: "medium" }) : "-";

const STATUS_CLS = { open: "bg-emerald-100 text-emerald-700", closed: "bg-slate-100 text-slate-600" };
const STATUS_LBL = { open: "Berjalan", closed: "Tutup" };

function InfoRow({ label, children }) {
    return (
        <div className="flex items-start justify-between gap-4 border-b border-slate-50 py-2 last:border-0">
            <span className="shrink-0 text-sm text-slate-500">{label}</span>
            <span className="text-right text-sm font-medium text-slate-800">{children}</span>
        </div>
    );
}

function SumRow({ label, value, cls = "text-slate-700" }) {
    return (
        <div className="flex items-center justify-between py-1.5">
            <span className="text-sm text-slate-500">{label}</span>
            <span className={`text-sm font-semibold ${cls}`}>{value}</span>
        </div>
    );
}

export default function Show({ shift, summary, typeSummary, storeType, canClose, canManage }) {
    const isOpen = shift.status === "open";

    // ── tutup shift ──
    const [showClose, setShowClose]   = useState(false);
    const [closeData, setCloseData]   = useState({ actual_cash: "", closing_note: "", payment_actuals: {} });
    const [closing, setClosing]       = useState(false);

    // ── admin: edit ──
    const [showEdit, setShowEdit]     = useState(false);
    const [editData, setEditData]     = useState({ opening_cash: shift.opening_cash ?? "", actual_cash: shift.actual_cash ?? "", opening_note: shift.opening_note ?? "", closing_note: shift.closing_note ?? "" });
    const [editing, setEditing]       = useState(false);

    // ── admin: hapus ──
    const [showDelete, setShowDelete] = useState(false);
    const [deleting, setDeleting]     = useState(false);

    // ── admin: buka ulang ──
    const [reopening, setReopening]   = useState(false);

    const initPayActuals = useMemo(() => {
        const m = {};
        (summary?.payment_breakdown ?? []).forEach((p) => { m[p.payment_method_id] = ""; });
        return m;
    }, [summary?.payment_breakdown]);

    const openCloseModal = () => {
        setCloseData({ actual_cash: "", closing_note: "", payment_actuals: { ...initPayActuals } });
        setShowClose(true);
    };

    const handleClose = () => {
        setClosing(true);
        const payload = {
            actual_cash:     closeData.actual_cash,
            closing_note:    closeData.closing_note || null,
            payment_actuals: Object.entries(closeData.payment_actuals)
                .filter(([, v]) => v !== "")
                .map(([id, amt]) => ({ payment_method_id: parseInt(id), actual_amount: parseFloat(amt) })),
        };
        router.post(route("admin.cashier-shifts.close", shift.id), payload, {
            preserveScroll: true,
            onFinish: () => { setClosing(false); setShowClose(false); },
            onError:  () =>   setClosing(false),
        });
    };

    const handleEdit = () => {
        setEditing(true);
        router.patch(route("admin.cashier-shifts.update", shift.id), editData, {
            preserveScroll: true,
            onFinish: () => { setEditing(false); setShowEdit(false); },
            onError:  () =>   setEditing(false),
        });
    };

    const handleDelete = () => {
        setDeleting(true);
        router.delete(route("admin.cashier-shifts.destroy", shift.id), {
            onFinish: () => { setDeleting(false); setShowDelete(false); },
        });
    };

    const handleReopen = () => {
        setReopening(true);
        router.post(route("admin.cashier-shifts.reopen", shift.id), {}, {
            preserveScroll: true,
            onFinish: () => setReopening(false),
        });
    };

    const durasi = (from, to) => {
        if (!to) return "Masih berjalan";
        const ms = Math.abs(new Date(to) - new Date(from));
        const h  = Math.floor(ms / 3600000);
        const m  = Math.floor((ms % 3600000) / 60000);
        return h > 0 ? `${h} jam ${m} menit` : `${m} menit`;
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center gap-3">
                    <Link href={route("admin.cashier-shifts.index")}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                        </svg>
                    </Link>
                    <div className="flex-1">
                        <h2 className="font-mono text-base font-semibold text-slate-800">{shift.shift_no}</h2>
                        <p className="text-xs text-slate-400">Kasir: {shift.user?.name ?? "-"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {canManage && (
                            <>
                                <button onClick={() => { setEditData({ opening_cash: shift.opening_cash ?? "", actual_cash: shift.actual_cash ?? "", opening_note: shift.opening_note ?? "", closing_note: shift.closing_note ?? "" }); setShowEdit(true); }}
                                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
                                    Edit
                                </button>
                                {!isOpen && (
                                    <button onClick={handleReopen} disabled={reopening}
                                        className="rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-50">
                                        {reopening ? "..." : "Buka Ulang"}
                                    </button>
                                )}
                                <button onClick={() => setShowDelete(true)}
                                    className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50">
                                    Hapus
                                </button>
                            </>
                        )}
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${STATUS_CLS[shift.status] ?? "bg-slate-100 text-slate-600"}`}>
                            {STATUS_LBL[shift.status] ?? shift.status}
                        </span>
                    </div>
                </div>
            }
        >
            <Head title={`Shift ${shift.shift_no}`} />
            <div className="space-y-4">

                {/* Banner tutup shift */}
                {isOpen && canClose && (
                    <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
                        <div>
                            <p className="text-sm font-semibold text-emerald-800">Shift Sedang Berjalan</p>
                            <p className="text-xs text-emerald-600">Durasi: {durasi(shift.opened_at, null)}</p>
                        </div>
                        <button onClick={openCloseModal}
                            className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-indigo-700">
                            Tutup Shift
                        </button>
                    </div>
                )}
                {isOpen && !canClose && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3">
                        <p className="text-sm text-amber-800">Shift milik kasir lain. Hanya pemilik shift yang dapat menutupnya.</p>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    {/* Kiri: info + pembayaran */}
                    <div className="space-y-4 lg:col-span-2">
                        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="border-b border-slate-100 bg-slate-50 px-5 py-3">
                                <p className="text-sm font-semibold text-slate-800">Informasi Shift</p>
                            </div>
                            <div className="px-5 py-3">
                                <InfoRow label="No. Shift"><span className="font-mono">{shift.shift_no}</span></InfoRow>
                                <InfoRow label="Kasir">{shift.user?.name ?? "-"}</InfoRow>
                                <InfoRow label="Cabang">{shift.branch?.name ?? "Pusat"}</InfoRow>
                                <InfoRow label="Dibuka">{fmtDt(shift.opened_at)}</InfoRow>
                                <InfoRow label="Ditutup">{fmtDt(shift.closed_at)}</InfoRow>
                                {shift.closed_at && <InfoRow label="Durasi">{durasi(shift.opened_at, shift.closed_at)}</InfoRow>}
                                {shift.opening_note && (
                                    <div className="mt-3 rounded-lg bg-slate-50 px-4 py-3">
                                        <p className="mb-1 text-xs font-medium text-slate-400">Catatan Pembukaan</p>
                                        <p className="text-sm text-slate-700">{shift.opening_note}</p>
                                    </div>
                                )}
                                {shift.closing_note && (
                                    <div className="mt-2 rounded-lg bg-slate-50 px-4 py-3">
                                        <p className="mb-1 text-xs font-medium text-slate-400">Catatan Penutupan</p>
                                        <p className="text-sm text-slate-700">{shift.closing_note}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Rincian pembayaran */}
                        {(summary?.payment_breakdown ?? []).length > 0 && (
                            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                                <div className="border-b border-slate-100 bg-slate-50 px-5 py-3">
                                    <p className="text-sm font-semibold text-slate-800">Rincian Pembayaran</p>
                                </div>
                                <table className="w-full text-left text-sm">
                                    <thead className="border-b border-slate-100 bg-slate-50/60">
                                        <tr>
                                            <th className="px-5 py-2.5 text-xs font-semibold text-slate-500">Metode</th>
                                            <th className="px-5 py-2.5 text-right text-xs font-semibold text-slate-500">Total (Sistem)</th>
                                            {!isOpen && <>
                                                <th className="px-5 py-2.5 text-right text-xs font-semibold text-slate-500">Aktual</th>
                                                <th className="px-5 py-2.5 text-right text-xs font-semibold text-slate-500">Selisih</th>
                                            </>}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {summary.payment_breakdown.map((p) => {
                                            const pm = (shift.payments ?? []).find(sp => sp.payment_method_id === p.payment_method_id);
                                            return (
                                                <tr key={p.payment_method_id} className="hover:bg-slate-50">
                                                    <td className="px-5 py-2.5">
                                                        <span className="font-medium text-slate-800">{p.method_name}</span>
                                                        <span className="ml-2 text-xs text-slate-400">{p.method_type}</span>
                                                    </td>
                                                    <td className="px-5 py-2.5 text-right font-medium text-slate-700">{fmt(p.total)}</td>
                                                    {!isOpen && <>
                                                        <td className="px-5 py-2.5 text-right text-slate-600">
                                                            {pm?.actual_amount != null ? fmt(pm.actual_amount) : "-"}
                                                        </td>
                                                        <td className="px-5 py-2.5 text-right">
                                                            {pm?.difference_amount != null ? (
                                                                <span className={`font-semibold ${pm.difference_amount === 0 ? "text-slate-500" : pm.difference_amount > 0 ? "text-emerald-600" : "text-red-500"}`}>
                                                                    {pm.difference_amount >= 0 ? "+" : ""}{fmt(pm.difference_amount)}
                                                                </span>
                                                            ) : "-"}
                                                        </td>
                                                    </>}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* ── TYPE-SPECIFIC SUMMARY ── */}
                        {/* Komisi Karyawan — service/laundry */}
                        {['service', 'laundry'].includes(storeType) && (typeSummary?.commissions ?? []).length > 0 && (
                            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                                <div className="border-b border-slate-100 bg-slate-50 px-5 py-3 flex items-center justify-between">
                                    <p className="text-sm font-semibold text-slate-800">Komisi Karyawan</p>
                                    <span className="text-sm font-semibold text-indigo-700">{fmt(typeSummary.total_commission)}</span>
                                </div>
                                <table className="w-full text-left text-sm">
                                    <thead className="border-b border-slate-100 bg-slate-50/60">
                                        <tr>
                                            <th className="px-5 py-2.5 text-xs font-semibold text-slate-500">Karyawan</th>
                                            <th className="px-5 py-2.5 text-right text-xs font-semibold text-slate-500">Transaksi</th>
                                            <th className="px-5 py-2.5 text-right text-xs font-semibold text-slate-500">Total Komisi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {typeSummary.commissions.map((c, i) => (
                                            <tr key={i} className="hover:bg-slate-50">
                                                <td className="px-5 py-2.5 font-medium text-slate-800">{c.employee_name}</td>
                                                <td className="px-5 py-2.5 text-right text-slate-600">{c.transaction_count}</td>
                                                <td className="px-5 py-2.5 text-right font-semibold text-indigo-700">{fmt(c.total_commission)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Breakdown Kategori — retail/fnb */}
                        {['retail', 'fnb'].includes(storeType) && (typeSummary?.category_breakdown ?? []).length > 0 && (
                            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                                <div className="border-b border-slate-100 bg-slate-50 px-5 py-3 flex items-center justify-between">
                                    <p className="text-sm font-semibold text-slate-800">Penjualan per Kategori</p>
                                    <span className="text-xs text-slate-400">{typeSummary.total_transactions} transaksi</span>
                                </div>
                                <table className="w-full text-left text-sm">
                                    <thead className="border-b border-slate-100 bg-slate-50/60">
                                        <tr>
                                            <th className="px-5 py-2.5 text-xs font-semibold text-slate-500">Kategori</th>
                                            <th className="px-5 py-2.5 text-right text-xs font-semibold text-slate-500">Qty</th>
                                            <th className="px-5 py-2.5 text-right text-xs font-semibold text-slate-500">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {typeSummary.category_breakdown.map((c, i) => (
                                            <tr key={i} className="hover:bg-slate-50">
                                                <td className="px-5 py-2.5 font-medium text-slate-800">{c.category_name}</td>
                                                <td className="px-5 py-2.5 text-right text-slate-500">{c.qty}</td>
                                                <td className="px-5 py-2.5 text-right font-semibold text-slate-700">{fmt(c.total)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Info booking/sesi — rental/session/dll */}
                        {['rental', 'session', 'parking', 'ticket', 'hospitality'].includes(storeType) && typeSummary?.total_transactions != null && (
                            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm px-5 py-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-slate-500">Total Transaksi Shift</p>
                                    <p className="text-sm font-semibold text-slate-800">{typeSummary.total_transactions}</p>
                                </div>
                                {typeSummary.booking_count != null && (
                                    <div className="flex items-center justify-between mt-2">
                                        <p className="text-sm text-slate-500">Booking Dibayar</p>
                                        <p className="text-sm font-semibold text-indigo-700">{typeSummary.booking_count}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Kanan: ringkasan keuangan */}
                    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm self-start">
                        <div className="border-b border-slate-100 bg-slate-50 px-5 py-3">
                            <p className="text-sm font-semibold text-slate-800">Ringkasan Keuangan</p>
                        </div>
                        <div className="px-5 py-4">
                            <SumRow label="Kas Awal"        value={fmt(shift.opening_cash)} />
                            <SumRow label="Total Penjualan" value={fmt(summary?.total_sales)} />
                            <SumRow label="Penjualan Tunai" value={fmt(summary?.cash_sales)} />
                            <SumRow label="Total Refund"    value={fmt(summary?.total_refunds)} />
                            <div className="my-2 border-t border-slate-100" />
                            <SumRow label="Ekspektasi Kas"  value={fmt(summary?.expected_cash)} cls="text-indigo-700" />
                            {!isOpen && <>
                                <SumRow label="Kas Aktual"  value={fmt(shift.actual_cash)} />
                                <SumRow label="Selisih Kas" value={fmt(shift.cash_difference)}
                                    cls={shift.cash_difference === 0 ? "text-slate-700" : shift.cash_difference > 0 ? "text-emerald-600" : "text-red-500"} />
                            </>}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── MODAL TUTUP SHIFT ── */}
            {showClose && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onMouseDown={() => !closing && setShowClose(false)}>
                    <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
                        <div className="border-b border-slate-100 bg-slate-50 px-6 py-4">
                            <h3 className="text-base font-semibold text-slate-800">Tutup Shift — {shift.shift_no}</h3>
                            <p className="text-xs text-slate-500 mt-0.5">Masukkan kas aktual untuk menutup shift.</p>
                        </div>
                        <div className="max-h-[65vh] space-y-5 overflow-y-auto p-6">
                            <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3">
                                <p className="text-xs font-medium text-indigo-500">Ekspektasi Kas di Laci</p>
                                <p className="text-xl font-bold text-indigo-700">{fmt(summary?.expected_cash)}</p>
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">Kas Aktual (Fisik) <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-slate-400">Rp</span>
                                    <input type="number" min="0" step="1" required
                                        value={closeData.actual_cash}
                                        onChange={(e) => setCloseData((d) => ({ ...d, actual_cash: e.target.value }))}
                                        className="block w-full rounded-xl border-slate-300 pl-9 text-sm focus:border-indigo-500 focus:ring-indigo-200"
                                        placeholder="0" />
                                </div>
                                {closeData.actual_cash !== "" && (
                                    <p className={`mt-1 text-xs font-medium ${parseFloat(closeData.actual_cash) >= (summary?.expected_cash ?? 0) ? "text-emerald-600" : "text-red-500"}`}>
                                        Selisih: {fmt(parseFloat(closeData.actual_cash || 0) - (summary?.expected_cash ?? 0))}
                                    </p>
                                )}
                            </div>
                            {(summary?.payment_breakdown ?? []).length > 0 && (
                                <div>
                                    <p className="mb-2 text-sm font-medium text-slate-700">Aktual per Metode <span className="font-normal text-slate-400">(opsional)</span></p>
                                    <div className="space-y-2">
                                        {summary.payment_breakdown.map((p) => (
                                            <div key={p.payment_method_id} className="flex items-center gap-3">
                                                <div className="w-36 shrink-0">
                                                    <p className="text-sm font-medium text-slate-700">{p.method_name}</p>
                                                    <p className="text-xs text-slate-400">{fmt(p.total)}</p>
                                                </div>
                                                <div className="relative flex-1">
                                                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-slate-400">Rp</span>
                                                    <input type="number" min="0" step="1"
                                                        value={closeData.payment_actuals[p.payment_method_id] ?? ""}
                                                        onChange={(e) => setCloseData((d) => ({ ...d, payment_actuals: { ...d.payment_actuals, [p.payment_method_id]: e.target.value } }))}
                                                        className="block w-full rounded-xl border-slate-300 pl-9 text-sm focus:border-indigo-500 focus:ring-indigo-200"
                                                        placeholder="0" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">Catatan Penutupan</label>
                                <textarea rows={2} maxLength={1000}
                                    value={closeData.closing_note}
                                    onChange={(e) => setCloseData((d) => ({ ...d, closing_note: e.target.value }))}
                                    className="block w-full rounded-xl border-slate-300 text-sm focus:border-indigo-500 focus:ring-indigo-200"
                                    placeholder="Opsional..." />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50 px-6 py-4">
                            <button onClick={() => setShowClose(false)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Batal</button>
                            <button onClick={handleClose} disabled={closing || !closeData.actual_cash}
                                className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700 disabled:opacity-60">
                                {closing ? "Menutup..." : "Tutup Shift"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── MODAL EDIT ── */}
            {showEdit && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onMouseDown={() => !editing && setShowEdit(false)}>
                    <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
                        <div className="border-b border-slate-100 bg-slate-50 px-6 py-4">
                            <h3 className="text-base font-semibold text-slate-800">Edit Shift — {shift.shift_no}</h3>
                        </div>
                        <div className="space-y-4 p-6">
                            {[
                                { key: "opening_cash", label: "Kas Awal", type: "number" },
                                { key: "actual_cash",  label: "Kas Aktual", type: "number" },
                                { key: "opening_note", label: "Catatan Pembukaan", type: "textarea" },
                                { key: "closing_note", label: "Catatan Penutupan", type: "textarea" },
                            ].map(({ key, label, type }) => (
                                <div key={key}>
                                    <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
                                    {type === "textarea"
                                        ? <textarea rows={2} value={editData[key]} onChange={(e) => setEditData((d) => ({ ...d, [key]: e.target.value }))} className="block w-full rounded-xl border-slate-300 text-sm focus:border-indigo-500 focus:ring-indigo-200" />
                                        : <input type="number" min="0" value={editData[key]} onChange={(e) => setEditData((d) => ({ ...d, [key]: e.target.value }))} className="block w-full rounded-xl border-slate-300 text-sm focus:border-indigo-500 focus:ring-indigo-200" />
                                    }
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50 px-6 py-4">
                            <button onClick={() => setShowEdit(false)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Batal</button>
                            <button onClick={handleEdit} disabled={editing} className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
                                {editing ? "Menyimpan..." : "Simpan"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── MODAL HAPUS ── */}
            {showDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onMouseDown={() => !deleting && setShowDelete(false)}>
                    <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white p-6 shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
                        <h3 className="text-base font-semibold text-slate-800">Hapus Shift?</h3>
                        <p className="mt-1 text-sm text-slate-500">Shift <span className="font-mono font-semibold">{shift.shift_no}</span> akan dihapus permanen.</p>
                        <div className="mt-5 flex justify-end gap-2">
                            <button onClick={() => setShowDelete(false)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Batal</button>
                            <button onClick={handleDelete} disabled={deleting} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
                                {deleting ? "Menghapus..." : "Hapus"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
