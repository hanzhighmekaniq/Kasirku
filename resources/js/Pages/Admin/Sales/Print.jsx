import { Head } from "@inertiajs/react";
import { useEffect } from "react";

const fmt = (n) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(n ?? 0);

const fmtShort = (n) =>
    new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(n ?? 0);

export default function Print({ sale, storeName }) {
    useEffect(() => {
        const timer = setTimeout(() => window.print(), 500);
        return () => clearTimeout(timer);
    }, []);

    const date = sale.sale_date
        ? new Date(sale.sale_date).toLocaleString("id-ID")
        : "-";

    const receiptContent = (
        <>
            <p className="text-center text-sm font-bold text-slate-900">
                {storeName}
            </p>
            <p className="mt-0.5 text-center text-slate-500">{sale.sale_no}</p>
            <p className="text-center text-slate-400">{date}</p>
            {sale.table && (
                <p className="text-center font-medium text-slate-600">
                    Meja {sale.table.table_number}
                </p>
            )}
            {sale.customer && (
                <p className="text-center text-slate-500">
                    Pelanggan: {sale.customer.name}
                </p>
            )}
            <div className="my-3 border-t border-dashed border-slate-300" />

            {sale.items.map((item, i) => (
                <div key={i} className="mb-1">
                    <div className="flex justify-between">
                        <span className="text-slate-700">
                            {item.product?.name ?? "Produk"}
                            {item.variant_id && item.variant_name
                                ? ` (${item.variant_name})`
                                : ""}
                        </span>
                        <span className="text-slate-800">
                            {fmt(item.subtotal)}
                        </span>
                    </div>
                    <span className="text-slate-400">
                        {item.quantity} × {fmt(item.price)}
                    </span>
                    {item.modifiers?.map((m, j) => (
                        <div key={j} className="pl-2 text-slate-400">
                            {m.name}{" "}
                            {(m.price_addition ?? 0) > 0 &&
                                `+${fmtShort(m.price_addition)}`}
                        </div>
                    ))}
                    {(item.promo_discount ?? 0) > 0 && (
                        <div className="pl-2 text-xs text-emerald-600">
                            Promo: -{fmt(item.promo_discount)}
                        </div>
                    )}
                </div>
            ))}

            <div className="my-3 border-t border-dashed border-slate-300" />

            <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{fmt(sale.subtotal)}</span>
            </div>
            {(sale.discount_amount ?? 0) > 0 && (
                <div className="flex justify-between text-red-600">
                    <span>Diskon</span>
                    <span>-{fmt(sale.discount_amount)}</span>
                </div>
            )}
            {(sale.tax_amount ?? 0) > 0 && (
                <div className="flex justify-between">
                    <span>Pajak</span>
                    <span>{fmt(sale.tax_amount)}</span>
                </div>
            )}

            <div className="mt-1 flex justify-between text-sm font-bold text-slate-900">
                <span>Total</span>
                <span>{fmt(sale.grand_total)}</span>
            </div>

            {sale.payments?.map((p, i) => (
                <div key={i} className="flex justify-between text-slate-600">
                    <span>{p.paymentMethod?.name ?? "Pembayaran"}</span>
                    <span>{fmt(p.amount)}</span>
                </div>
            ))}
            {(sale.change_amount ?? 0) > 0 && (
                <div className="flex justify-between text-emerald-600">
                    <span>Kembalian</span>
                    <span>{fmt(sale.change_amount)}</span>
                </div>
            )}

            {sale.notes && (
                <>
                    <div className="my-3 border-t border-dashed border-slate-300" />
                    <p className="whitespace-pre-wrap text-center text-slate-500">
                        {sale.notes}
                    </p>
                </>
            )}

            <div className="my-3 border-t border-dashed border-slate-300" />
            <p className="text-center text-slate-400">
                Terima kasih atas kunjungan Anda
            </p>
            <p className="text-center text-[9px] text-slate-300">
                Dicetak: {new Date().toLocaleString("id-ID")}
            </p>
        </>
    );

    return (
        <>
            <Head title={`Struk - ${sale.sale_no}`} />

            {/* CSS untuk layar vs print */}
            <style>{`
                @media screen {
                    .print-only { display: none !important; }
                }
                @media print {
                    body > *:not(.print-only) {
                        display: none !important;
                    }
                    body {
                        margin: 0 !important;
                        padding: 0 !important;
                        background: white !important;
                    }
                    .print-only {
                        display: block !important;
                        width: 80mm !important;
                        margin: 0 auto !important;
                        padding: 15px 10px !important;
                        font-family: monospace !important;
                        font-size: 12px !important;
                        color: #1e293b !important;
                        background: white !important;
                    }
                    @page { margin: 0; size: 80mm auto; }
                }
            `}</style>

            {/* ─── Tampilan layar — modal persis kaya Kasir ─── */}
            <div className="screen-only fixed inset-0 z-50 flex items-center justify-center p-4">
                <div
                    onClick={() => window.close()}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                />
                <div className="relative w-full max-w-xs rounded-2xl bg-white shadow-2xl">
                    <div className="px-6 py-5 font-mono text-xs max-h-[70vh] overflow-y-auto">
                        {receiptContent}
                    </div>

                    <div className="flex gap-2 border-t border-slate-100 px-5 py-4">
                        <button
                            type="button"
                            onClick={() => window.print()}
                            className="flex-1 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:from-indigo-600 hover:to-violet-700"
                        >
                            Cetak Ulang
                        </button>
                        <button
                            type="button"
                            onClick={() => window.print()}
                            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                        >
                            🖨️ Print
                        </button>
                        <button
                            type="button"
                            onClick={() => window.close()}
                            className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-slate-50"
                        >
                            Tutup
                        </button>
                    </div>
                </div>
            </div>

            {/* ─── Tampilan print — struk bersih ─── */}
            <div className="print-only">{receiptContent}</div>
        </>
    );
}
