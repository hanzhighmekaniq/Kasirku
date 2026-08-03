import { useEffect, useState } from "react";
import { Head, Link, router, useForm } from "@inertiajs/react";
import { AlertTriangle, ArrowRight } from "lucide-react";

/**
 * Halaman verifikasi OTP registrasi (terpisah dari form registrasi).
 *
 * Halaman ini ditampilkan setelah user submit form registrasi.
 * User memasukkan kode OTP yang dikirim ke email untuk membuat akun.
 */

/** Jeda sebelum tombol "kirim ulang kode" bisa dipakai lagi. */
const RESEND_COOLDOWN_SECONDS = 60;

export default function VerifyRegistration({ email, flash = {} }) {
    const { data, setData, post, processing, errors } = useForm({
        email,
        code: "",
    });

    const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
    const [resending, setResending] = useState(false);
    const [localOtpCode, setLocalOtpCode] = useState(flash.otp_code || null);

    useEffect(() => {
        if (cooldown <= 0) return;
        const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);

        return () => clearTimeout(timer);
    }, [cooldown]);

    // Update local OTP code ketika flash berubah (setelah resend)
    useEffect(() => {
        if (flash.otp_code) {
            setLocalOtpCode(flash.otp_code);
        }
    }, [flash.otp_code]);

    const submit = (e) => {
        e.preventDefault();
        post(route("register.verify"), {
            preserveScroll: true,
        });
    };

    const resend = () => {
        if (cooldown > 0 || resending) return;
        setResending(true);
        router.post(
            route("register.resend"),
            { email },
            {
                preserveScroll: true,
                onFinish: () => {
                    setResending(false);
                    setCooldown(RESEND_COOLDOWN_SECONDS);
                },
            },
        );
    };

    const year = new Date().getFullYear();

    return (
        <>
            <Head title="Verifikasi Email" />

            <div className="dv-auth grid min-h-screen lg:grid-cols-[1.15fr_1fr] xl:grid-cols-[1.35fr_1fr]">
                {/* ── Band gelap ── */}
                <div className="dv-band hidden flex-col justify-between p-10 xl:p-14 lg:flex">
                    <a
                        href="https://devus.id"
                        className="dv-wordmark text-[1.375rem]"
                        aria-label="DEVus.id, beranda"
                    >
                        DEVus<span className="dv-wordmark__dot">.</span>id
                    </a>

                    <div className="max-w-xl space-y-6 py-10">
                        <h1 className="dv-display">
                            Hampir selesai!
                            <br />
                            Verifikasi emailmu.
                        </h1>

                        <p className="dv-lead">
                            Kami telah mengirim kode verifikasi ke email Anda.
                            Masukkan kode tersebut untuk menyelesaikan
                            pendaftaran dan membuat akun.
                        </p>
                    </div>

                    <p className="dv-label">
                        &copy; {year} DEVus.id — Seluruh hak dilindungi
                    </p>
                </div>

                {/* ── Panel form ── */}
                <div className="flex flex-col justify-center px-6 py-12 sm:px-10 lg:px-12">
                    <div className="mx-auto w-full max-w-[30rem]">
                        <a
                            href="https://devus.id"
                            className="dv-wordmark mb-8 text-[1.375rem] lg:hidden"
                            aria-label="DEVus.id, beranda"
                        >
                            DEVus<span className="dv-wordmark__dot">.</span>id
                        </a>

                        <form onSubmit={submit}>
                            <div className="dv-card p-7 sm:p-8">
                                <p className="dv-label">Langkah 2 dari 2</p>
                                <h2 className="dv-title mt-3">
                                    Masukkan kode verifikasi
                                </h2>
                                <p
                                    className="mt-2 text-[0.9375rem] leading-relaxed"
                                    style={{ color: "var(--dv-muted)" }}
                                >
                                    Kami mengirim kode 6 angka ke{" "}
                                    <span
                                        style={{
                                            color: "var(--dv-ink)",
                                            fontWeight: 600,
                                        }}
                                    >
                                        {email}
                                    </span>
                                    . Kode berlaku 10 menit.
                                </p>

                                {/* Tampilkan success message setelah resend */}
                                {flash.success && (
                                    <div
                                        className="mt-4 rounded-lg border p-3 text-[0.875rem]"
                                        style={{
                                            borderColor: "var(--dv-success)",
                                            backgroundColor:
                                                "var(--dv-success-bg)",
                                            color: "var(--dv-success)",
                                        }}
                                    >
                                        {flash.success}
                                    </div>
                                )}

                                {/* Tampilkan kode OTP di local development */}
                                {localOtpCode && (
                                    <div
                                        className="mt-4 rounded-lg border-2 p-4"
                                        style={{
                                            borderColor: "var(--dv-accent)",
                                            backgroundColor: "var(--dv-paper-2)",
                                        }}
                                    >
                                        <p
                                            className="text-[0.8125rem] font-semibold"
                                            style={{ color: "var(--dv-accent)" }}
                                        >
                                            🔑 Development Mode
                                        </p>
                                        <p
                                            className="mt-1 text-[0.875rem]"
                                            style={{ color: "var(--dv-muted)" }}
                                        >
                                            Kode OTP telah dikirim ke email dan
                                            ditampilkan di sini:{" "}
                                            <span
                                                className="font-mono text-[1.25rem] font-bold tracking-widest"
                                                style={{ color: "var(--dv-ink)" }}
                                            >
                                                {localOtpCode}
                                            </span>
                                        </p>
                                    </div>
                                )}

                                <div className="mt-7 space-y-1.5">
                                    <label
                                        htmlFor="code"
                                        className="dv-field-label"
                                    >
                                        Kode verifikasi
                                    </label>
                                    <input
                                        id="code"
                                        type="text"
                                        inputMode="numeric"
                                        autoComplete="one-time-code"
                                        maxLength={6}
                                        autoFocus
                                        value={data.code}
                                        onChange={(e) =>
                                            setData(
                                                "code",
                                                e.target.value
                                                    .replace(/\D/g, "")
                                                    .slice(0, 6),
                                            )
                                        }
                                        aria-invalid={
                                            errors.code ? "true" : undefined
                                        }
                                        aria-describedby={
                                            errors.code
                                                ? "code-error"
                                                : undefined
                                        }
                                        className="dv-input text-center text-[1.5rem] font-semibold tracking-[0.5em]"
                                        placeholder="000000"
                                    />
                                    <FieldError
                                        id="code-error"
                                        message={errors.code}
                                    />
                                </div>

                                <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
                                    <button
                                        type="button"
                                        onClick={resend}
                                        disabled={cooldown > 0 || resending}
                                        className="dv-tlink disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {resending
                                            ? "Mengirim…"
                                            : cooldown > 0
                                              ? `Kirim ulang kode (${cooldown}s)`
                                              : "Kirim ulang kode"}
                                    </button>
                                    <Link
                                        href={route("register")}
                                        className="dv-tlink"
                                    >
                                        Ubah email
                                    </Link>
                                </div>
                            </div>

                            <div className="mt-6 flex items-center justify-between gap-3">
                                <Link
                                    href={route("login")}
                                    className="dv-tlink"
                                >
                                    Sudah punya akun? Masuk
                                </Link>

                                <button
                                    type="submit"
                                    disabled={
                                        processing || data.code.length !== 6
                                    }
                                    className="dv-btn dv-btn--accent"
                                >
                                    {processing
                                        ? "Membuat akun…"
                                        : "Verifikasi & buat akun"}
                                    {!processing && (
                                        <ArrowRight
                                            size={16}
                                            strokeWidth={2.5}
                                        />
                                    )}
                                </button>
                            </div>
                        </form>

                        <p className="dv-label mt-10 lg:hidden">
                            &copy; {year} DEVus.id
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}

function FieldError({ id, message }) {
    if (!message) return null;
    return (
        <p id={id} className="dv-error">
            <AlertTriangle
                size={13}
                strokeWidth={2.5}
                className="mt-0.5 shrink-0"
            />
            <span>{message}</span>
        </p>
    );
}
