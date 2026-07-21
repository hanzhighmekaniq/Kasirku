import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import Button from "@/Components/ui/Button";

/**
 * ConfirmDeleteModal — modal konfirmasi hapus universal, dipakai di semua
 * halaman Admin. Selalu ikut tema aktif (light/dark + preset warna user)
 * karena semua warna dari CSS variable tema, bukan hardcoded.
 *
 * Props:
 *   open          — boolean, tampilkan/sembunyikan modal
 *   title         — judul modal (default: "Hapus data?")
 *   description   — deskripsi/peringatan (default: teks generik)
 *   confirmLabel  — label tombol konfirmasi (default: "Hapus")
 *   processing    — boolean, nonaktifkan tombol + tampilkan spinner
 *   error         — string opsional, tampilkan banner error di bawah deskripsi
 *   onConfirm     — callback saat tombol konfirmasi diklik
 *   onClose       — callback saat modal ditutup (backdrop/Batal/Escape)
 */
export default function ConfirmDeleteModal({
    open,
    title = "Hapus data?",
    description = "Tindakan ini tidak dapat dibatalkan.",
    confirmLabel = "Hapus",
    processing = false,
    error = "",
    onConfirm,
    onClose,
}) {
    const [render, setRender] = useState(open);
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (open) {
            setRender(true);
            const t = requestAnimationFrame(() => setShow(true));
            return () => cancelAnimationFrame(t);
        }
        setShow(false);
        const t = setTimeout(() => setRender(false), 200);
        return () => clearTimeout(t);
    }, [open]);

    useEffect(() => {
        const onKey = (e) => e.key === "Escape" && onClose();
        if (open) document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    if (!render) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                onClick={onClose}
                className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200 ${
                    show ? "opacity-100" : "opacity-0"
                }`}
            />
            <div
                role="dialog"
                aria-modal="true"
                className={`relative w-full max-w-md transform rounded-2xl bg-popover p-6 text-popover-foreground shadow-2xl transition-all duration-200 sm:p-7 ${
                    show
                        ? "translate-y-0 scale-100 opacity-100"
                        : "translate-y-3 scale-95 opacity-0"
                }`}
            >
                <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                        <AlertTriangle
                            className="h-6 w-6 text-destructive"
                            strokeWidth={1.8}
                        />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-semibold text-foreground">
                            {title}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {description}
                        </p>
                        {error && (
                            <p className="mt-2 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
                                {error}
                            </p>
                        )}
                    </div>
                </div>

                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <Button
                        variant="outline"
                        size="lg"
                        onClick={onClose}
                        disabled={processing}
                    >
                        Batal
                    </Button>
                    <Button
                        variant="danger"
                        size="lg"
                        onClick={onConfirm}
                        loading={processing}
                    >
                        {processing ? "Menghapus..." : confirmLabel}
                    </Button>
                </div>
            </div>
        </div>
    );
}
