import { Head, router, usePage } from "@inertiajs/react";
import { Mail, RefreshCw, CheckCircle } from "lucide-react";
import { useState } from "react";

/**
 * Halaman notice verifikasi email.
 * Muncul ketika user mencoba akses route yang butuh verifikasi email.
 */

export default function VerifyEmail() {
    const { flash } = usePage().props;
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    const resend = () => {
        setSending(true);
        router.post(
            route("verification.send"),
            {},
            {
                onFinish: () => {
                    setSending(false);
                    setSent(true);
                },
            },
        );
    };

    return (
        <>
            <Head title="Verifikasi Email" />

            <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
                <div className="w-full max-w-md">
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-8 text-center text-white">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                                <Mail size={28} />
                            </div>
                            <h1 className="mt-4 text-xl font-bold">
                                Verifikasi Email Kamu
                            </h1>
                            <p className="mt-2 text-sm text-white/80">
                                Kami sudah mengirim link verifikasi ke email
                                kamu. Klik link di email untuk mengaktifkan
                                akun.
                            </p>
                        </div>

                        {/* Body */}
                        <div className="p-6">
                            {flash?.success && (
                                <div className="mb-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                                    <CheckCircle size={16} />
                                    {flash.success}
                                </div>
                            )}

                            {flash?.warning && (
                                <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                                    {flash.warning}
                                </div>
                            )}

                            <p className="text-sm leading-relaxed text-slate-600">
                                Belum menerima email? Cek folder spam atau
                                minta kirim ulang link verifikasi di bawah ini.
                            </p>

                            <button
                                onClick={resend}
                                disabled={sending || sent}
                                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {sending ? (
                                    <>
                                        <RefreshCw
                                            size={16}
                                            className="animate-spin"
                                        />
                                        Mengirim…
                                    </>
                                ) : sent ? (
                                    <>
                                        <CheckCircle size={16} />
                                        Link terkirim!
                                    </>
                                ) : (
                                    <>
                                        <Mail size={16} />
                                        Kirim Ulang Link Verifikasi
                                    </>
                                )}
                            </button>

                            <p className="mt-4 text-center text-xs text-slate-400">
                                Setelah verifikasi, kamu akan lanjut ke
                                halaman setup toko.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
