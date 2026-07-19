import { useEffect, useState } from "react";
import { MessageSquareText } from "lucide-react";
import PosModal from "../ui/PosModal";

/**
 * NoteModal — catatan transaksi lewat modal (menggantikan input inline di
 * keranjang) supaya layout tetap stabil. Draft di-commit saat "Simpan".
 */
export default function NoteModal({ show, onClose, k }) {
    const [draft, setDraft] = useState("");

    useEffect(() => {
        if (show) {
            setDraft(k.note || "");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [show]);

    const save = () => {
        k.setNote(draft.trim());
        onClose();
    };

    return (
        <PosModal
            show={show}
            onClose={onClose}
            icon={MessageSquareText}
            title="Catatan Transaksi"
            subtitle="Catatan ini tampil di struk & riwayat"
            maxWidth="md"
            footer={
                <>
                    {draft.trim() && (
                        <button
                            type="button"
                            onClick={() => {
                                k.setNote("");
                                onClose();
                            }}
                            className="mr-auto rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                        >
                            Hapus
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                    >
                        Batal
                    </button>
                    <button
                        type="button"
                        onClick={save}
                        className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
                    >
                        Simpan
                    </button>
                </>
            }
        >
            <textarea
                autoFocus
                rows={4}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Contoh: minta bungkus terpisah, kembalian dititip..."
                className="block w-full rounded-xl border-slate-200 bg-slate-50 text-sm shadow-sm transition focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100"
            />
        </PosModal>
    );
}
