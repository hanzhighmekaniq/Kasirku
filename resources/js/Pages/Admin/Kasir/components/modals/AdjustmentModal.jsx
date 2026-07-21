import { useEffect, useState } from "react";
import { Tag, BadgePercent, ReceiptText } from "lucide-react";
import PosModal from "../ui/PosModal";
import CurrencyInput from "@/Components/ui/CurrencyInput";

/**
 * AdjustmentModal — atur Diskon & Pajak manual dalam satu tempat, dengan
 * preview perhitungan langsung. Menegaskan bahwa kedua nilai diatur manual
 * oleh kasir (bukan otomatis dari sistem).
 */
export default function AdjustmentModal({ show, onClose, k }) {
    const [dType, setDType] = useState("fixed");
    const [dValue, setDValue] = useState("");
    const [dReason, setDReason] = useState("");
    const [tType, setTType] = useState("fixed");
    const [tValue, setTValue] = useState("");
    const [tName, setTName] = useState("");

    useEffect(() => {
        if (!show) return;
        setDType(k.discountType || "fixed");
        setDValue(k.discountValue ? String(k.discountValue) : "");
        setDReason(k.discountReason || "");
        setTType(k.taxType || "fixed");
        setTValue(k.taxValue ? String(k.taxValue) : "");
        setTName(k.taxName || "");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [show]);

    const base = k.manualDiscountBase;
    const dVal = Number(dValue) || 0;
    const previewDiscount =
        dType === "percent" ? Math.round((base * dVal) / 100) : Math.min(dVal, base);
    const taxBase = Math.max(0, base - previewDiscount);
    const tVal = Number(tValue) || 0;
    const previewTax = tType === "percent" ? Math.round((taxBase * tVal) / 100) : tVal;
    const ongkir = k.orderType === "delivery" ? Number(k.deliveryFee || 0) : 0;
    const total = Math.max(0, base - previewDiscount + previewTax + ongkir);

    const apply = () => {
        k.applyDiscount({ type: dType, value: dVal, reason: dReason.trim() });
        k.applyTax({ type: tType, value: tVal, name: tName.trim() });
        onClose();
    };
    const reset = () => {
        k.clearDiscount();
        k.clearTax();
        onClose();
    };

    const seg = (active, label, onClick) => (
        <button
            type="button"
            onClick={onClick}
            className={`rounded-lg py-1.5 text-[12px] font-semibold transition ${active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-card-foreground"}`}
        >
            {label}
        </button>
    );

    const percentInput = (value, setValue) => (
        <div className="relative">
            <input
                type="number"
                min="0"
                max="100"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="0"
                className="block w-full rounded-xl border-border bg-muted/50 py-2.5 pr-9 text-sm shadow-sm transition focus:border-slate-400 focus:bg-card focus:ring-2 focus:ring-slate-100"
            />
            <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground/60">
                %
            </span>
        </div>
    );

    const isActive = k.discountValue > 0 || k.taxValue > 0;

    return (
        <PosModal
            show={show}
            onClose={onClose}
            icon={Tag}
            title="Diskon & Pajak"
            subtitle="Atur potongan & pajak manual"
            maxWidth="lg"
            footer={
                <>
                    {isActive && (
                        <button
                            type="button"
                            onClick={reset}
                            className="mr-auto rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-destructive transition hover:bg-destructive/5"
                        >
                            Reset
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-muted-foreground transition hover:bg-muted"
                    >
                        Batal
                    </button>
                    <button
                        type="button"
                        onClick={apply}
                        className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
                    >
                        Terapkan
                    </button>
                </>
            }
        >
            <div className="grid gap-4 sm:grid-cols-2">
                {/* Diskon */}
                <div className="space-y-2.5 rounded-2xl border border-border p-3.5">
                    <div className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                        <BadgePercent size={16} className="text-success" />
                        Diskon
                    </div>
                    <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
                        {seg(dType === "percent", "Persen (%)", () => setDType("percent"))}
                        {seg(dType === "fixed", "Nominal (Rp)", () => setDType("fixed"))}
                    </div>
                    {dType === "percent" ? (
                        percentInput(dValue, setDValue)
                    ) : (
                        <CurrencyInput value={dValue || "0"} onChange={setDValue} placeholder="0" />
                    )}
                    <input
                        type="text"
                        value={dReason}
                        onChange={(e) => setDReason(e.target.value)}
                        placeholder="Alasan (opsional)"
                        className="block w-full rounded-xl border-border bg-muted/50 py-2 text-sm shadow-sm transition focus:border-slate-400 focus:bg-card focus:ring-2 focus:ring-slate-100"
                    />
                </div>

                {/* Pajak */}
                <div className="space-y-2.5 rounded-2xl border border-border p-3.5">
                    <div className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                        <ReceiptText size={16} className="text-muted-foreground" />
                        Pajak
                    </div>
                    <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
                        {seg(tType === "percent", "Persen (%)", () => setTType("percent"))}
                        {seg(tType === "fixed", "Nominal (Rp)", () => setTType("fixed"))}
                    </div>
                    {tType === "percent" ? (
                        percentInput(tValue, setTValue)
                    ) : (
                        <CurrencyInput value={tValue || "0"} onChange={setTValue} placeholder="0" />
                    )}
                    <input
                        type="text"
                        value={tName}
                        onChange={(e) => setTName(e.target.value)}
                        placeholder="Nama pajak (mis. PPN)"
                        className="block w-full rounded-xl border-border bg-muted/50 py-2 text-sm shadow-sm transition focus:border-slate-400 focus:bg-card focus:ring-2 focus:ring-slate-100"
                    />
                </div>
            </div>

            {/* Preview */}
            <div className="mt-4 space-y-1.5 rounded-2xl border border-border bg-muted/50 p-4 text-sm">
                <div className="flex items-center justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span className="font-medium tabular-nums text-card-foreground">
                        {k.fmt(base)}
                    </span>
                </div>
                <div className="flex items-center justify-between text-success">
                    <span>Diskon{dType === "percent" && dVal > 0 ? ` (${dVal}%)` : ""}</span>
                    <span className="font-semibold tabular-nums">
                        −{k.fmt(previewDiscount)}
                    </span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                    <span>
                        {tName.trim() || "Pajak"}
                        {tType === "percent" && tVal > 0 ? ` ${tVal}%` : ""}
                    </span>
                    <span className="font-semibold tabular-nums">
                        +{k.fmt(previewTax)}
                    </span>
                </div>
                {ongkir > 0 && (
                    <div className="flex items-center justify-between text-muted-foreground">
                        <span>Ongkir</span>
                        <span className="font-medium tabular-nums text-card-foreground">
                            +{k.fmt(ongkir)}
                        </span>
                    </div>
                )}
                <div className="mt-1.5 flex items-baseline justify-between border-t border-dashed border-slate-300 pt-2.5">
                    <span className="font-bold text-card-foreground">Total</span>
                    <span className="text-xl font-bold tabular-nums text-foreground">
                        {k.fmt(total)}
                    </span>
                </div>
            </div>
        </PosModal>
    );
}
