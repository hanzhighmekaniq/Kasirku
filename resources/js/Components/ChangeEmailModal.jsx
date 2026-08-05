import { useState } from "react";
import { router } from "@inertiajs/react";
import { AlertTriangle, Mail, X } from "lucide-react";

/**
 * Modal "Ubah Email" — dipicu dari banner verifikasi di AuthenticatedLayout.
 *
 * Reuse endpoint `profile.update` (bukan endpoint baru): ProfileController
 * sudah otomatis mereset `email_verified_at` dan mengirim ulang link
 * verifikasi begitu field email berubah, jadi modal ini cukup kirim
 * `name` (dipertahankan) + `email` baru.
 */
export default function ChangeEmailModal({ open, currentEmail, userName, onClose, onSaved }) {
    const [email, setEmail] = useState(currentEmail ?? "");
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState(null);

    if (!open) return null;

    const submit = (e) => {
        e.preventDefault();
        setProcessing(true);
        setError(null);

        router.patch(
            route("admin.profile.update"),
            { name: userName, email },
            {
                onSuccess: () => {
                    onSaved?.(email);
                    onClose();
                },
                onError: (errors) => {
                    setError(errors.email ?? "Gagal menyimpan email.");
                },
                onFinish: () => setProcessing(false),
            },
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />

            <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-popover text-popover-foreground shadow-xl">
                <div className="flex items-center justify-between border-b border-border px-5 py-4">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning/10 text-warning">
                            <Mail size={16} />
                        </span>
                        <h3 className="text-sm font-semibold">Ubah Email</h3>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="Tutup"
                        className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted"
                    >
                        <X size={16} />
                    </button>
                </div>

                <form onSubmit={submit} className="px-5 py-4">
                    <p className="text-sm text-muted-foreground">
                        Kami akan mengirim link verifikasi baru ke email ini.
                    </p>

                    <label htmlFor="new_email" className="mt-4 block text-xs font-semibold text-foreground">
                        Email baru
                    </label>
                    <input
                        id="new_email"
                        type="email"
                        autoFocus
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="mt-1.5 w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                        placeholder="nama@email.com"
                    />
                    {error && (
                        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-destructive">
                            <AlertTriangle size={12} />
                            {error}
                        </p>
                    )}

                    <div className="mt-6 flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={processing || !email.trim()}
                            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                        >
                            {processing ? "Menyimpan…" : "Simpan & Kirim Ulang Verifikasi"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
