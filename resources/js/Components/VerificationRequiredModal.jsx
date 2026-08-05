import { router } from "@inertiajs/react";
import { Mail, AlertTriangle, X } from "lucide-react";

/**
 * Modal yang muncul ketika user mencoba eksekusi aksi tapi belum verifikasi email.
 * Menampilkan pesan dan tombol langsung ke halaman verifikasi di Profile.
 */

export default function VerificationRequiredModal({ show, onClose }) {
    if (!show) return null;

    const goToProfile = () => {
        router.visit(route("admin.profile.edit"), {
            onFinish: () => {
                // Scroll ke section verifikasi email setelah halaman load
                setTimeout(() => {
                    const el = document.getElementById("verifikasi-email");
                    if (el) {
                        el.scrollIntoView({ behavior: "smooth", block: "center" });
                    }
                }, 100);
            },
        });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl">
                {/* Top accent */}
                <div className="bg-amber-500 px-5 py-4 text-white">
                    <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                            <AlertTriangle size={20} />
                        </span>
                        <div>
                            <p className="text-xs font-medium text-white/80 uppercase tracking-wide">
                                Verifikasi Diperlukan
                            </p>
                            <h2 className="text-base font-bold leading-tight">
                                Verifikasi Email Dulu
                            </h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="px-5 py-4">
                    <p className="text-sm leading-relaxed text-slate-600">
                        Kamu belum bisa melakukan aksi ini karena email belum
                        diverifikasi. Verifikasi email dulu untuk membuka semua
                        fitur.
                    </p>

                    <button
                        onClick={goToProfile}
                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-600 transition-colors"
                    >
                        <Mail size={16} />
                        Verifikasi Sekarang
                    </button>

                    <button
                        onClick={onClose}
                        className="mt-2 w-full rounded-lg px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                        Nanti Saja
                    </button>
                </div>
            </div>
        </div>
    );
}
