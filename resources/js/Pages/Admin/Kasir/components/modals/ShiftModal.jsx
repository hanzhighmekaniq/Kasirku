import { useState } from "react";
import axios from "axios";
import { router } from "@inertiajs/react";
import { Clock, TriangleAlert } from "lucide-react";
import PosModal from "../ui/PosModal";
import CurrencyInput from "@/Components/ui/CurrencyInput";

/**
 * ShiftModal — buka shift kasir langsung dari halaman POS (tanpa pindah
 * halaman). POST JSON ke admin.cashier-shifts.store lalu reload prop
 * activeShift sehingga status shift di POS langsung diperbarui.
 */
export default function ShiftModal({ show, onClose, suggestedShiftNo }) {
    const [openingCash, setOpeningCash] = useState("0");
    const [note, setNote] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const reset = () => {
        setOpeningCash("0");
        setNote("");
        setError("");
        setSubmitting(false);
    };

    const handleClose = () => {
        if (submitting) return;
        reset();
        onClose();
    };

    const submit = async () => {
        setSubmitting(true);
        setError("");
        try {
            const { data } = await axios.post(
                route("admin.cashier-shifts.store"),
                {
                    opening_cash: Number(openingCash) || 0,
                    opening_note: note.trim() || null,
                },
                { headers: { "X-Inertia": "false", Accept: "application/json" } },
            );
            if (data?.success === false) {
                throw new Error(data.message || "Gagal membuka shift.");
            }
            router.reload({ only: ["activeShift"] });
            reset();
            onClose();
        } catch (e) {
            const msg =
                e.response?.data?.message ||
                (e.response?.data?.errors
                    ? Object.values(e.response.data.errors).flat().join(" ")
                    : null) ||
                e.message;
            setError(msg || "Gagal membuka shift.");
            setSubmitting(false);
        }
    };

    return (
        <PosModal
            show={show}
            onClose={handleClose}
            icon={Clock}
            title="Buka Shift Kasir"
            subtitle={
                suggestedShiftNo
                    ? `No. shift ${suggestedShiftNo}`
                    : "Mulai sesi kasir sebelum bertransaksi"
            }
            footer={
                <>
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={submitting}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                    >
                        Batal
                    </button>
                    <button
                        type="button"
                        onClick={submit}
                        disabled={submitting}
                        className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {submitting ? "Membuka..." : "Buka Shift"}
                    </button>
                </>
            }
        >
            <div className="space-y-4">
                <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Modal Awal / Kas Awal{" "}
                        <span className="text-rose-500">*</span>
                    </label>
                    <CurrencyInput
                        value={openingCash}
                        onChange={setOpeningCash}
                        placeholder="0"
                    />
                    <p className="mt-1.5 text-[11px] text-slate-400">
                        Jumlah uang tunai di laci saat mulai shift.
                    </p>
                </div>

                <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Catatan{" "}
                        <span className="font-normal text-slate-400">
                            (opsional)
                        </span>
                    </label>
                    <textarea
                        rows={2}
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Contoh: shift pagi, kasir A..."
                        className="block w-full rounded-xl border-slate-200 bg-slate-50 text-sm shadow-sm transition focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100"
                    />
                </div>

                {error && (
                    <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-medium text-rose-700">
                        <TriangleAlert size={15} className="mt-0.5 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}
            </div>
        </PosModal>
    );
}
