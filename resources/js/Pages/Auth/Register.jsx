import { useState } from "react";
import { Head, Link, useForm } from "@inertiajs/react";
import TurnstileWidget from "@/Components/TurnstileWidget";
import { AlertTriangle, ArrowRight, Eye, EyeOff } from "lucide-react";

/**
 * Halaman registrasi mandiri (self-service), langkah 1:
 *   - Data akun (nama, email, password) + Turnstile captcha
 *   - Setelah submit, redirect ke halaman verifikasi OTP terpisah
 *
 * Palet & bahasa visualnya PATEN mengikuti Login.jsx (tema `.dv-auth`,
 * bukan theme engine user) — jangan pakai utility yang terikat tema di
 * file ini, pakai kelas `dv-*` atau nilai eksplisit.
 */

export default function Register({
    turnstileSiteKey = null,
}) {
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirmation, setShowPasswordConfirmation] =
        useState(false);

    const { data, setData, post, processing, errors } = useForm({
        name: "",
        email: "",
        password: "",
        password_confirmation: "",
        cf_turnstile_response: "",
    });

    // Token Turnstile wajib ada kalau siteKey dikonfigurasi.
    const turnstileOk = !turnstileSiteKey || !!data.cf_turnstile_response;

    const canSubmit =
        data.name.trim() &&
        data.email.trim() &&
        data.password &&
        data.password_confirmation &&
        turnstileOk;

    // Kirim kode OTP ke email, redirect ke halaman verifikasi.
    // Akun belum dibuat di sini.
    const submit = (e) => {
        e.preventDefault();
        post(route("register"));
    };

    const year = new Date().getFullYear();

    return (
        <>
            <Head title="Daftar" />

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
                            Daftar sekarang,
                            <br />
                            buat tokomu setelahnya.
                        </h1>

                        <p className="dv-lead">
                            Buat akun terlebih dahulu, lalu pilih jenis usaha
                            dan plan di dalam aplikasi. Kamu bisa mulai dengan
                            plan Gratis kapan saja.
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

                        {/* Step indicator - hanya 1 step karena verifikasi di halaman terpisah */}
                        <div className="mb-6 flex items-center gap-2">
                            <span
                                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[0.6875rem] font-semibold"
                                style={{
                                    background: "var(--dv-accent)",
                                    color: "var(--dv-accent-ink)",
                                }}
                            >
                                1
                            </span>
                            <span
                                className="text-[0.8125rem] font-medium"
                                style={{ color: "var(--dv-ink)" }}
                            >
                                Buat Akun
                            </span>
                            <span
                                className="h-px flex-1"
                                style={{ background: "var(--dv-rule)" }}
                            />
                            <span
                                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[0.6875rem] font-semibold"
                                style={{
                                    background: "var(--dv-paper-3)",
                                    color: "var(--dv-muted)",
                                }}
                            >
                                2
                            </span>
                            <span
                                className="text-[0.8125rem] font-medium"
                                style={{ color: "var(--dv-muted)" }}
                            >
                                Verifikasi
                            </span>
                        </div>

                        <form onSubmit={submit}>
                            <div className="dv-card p-7 sm:p-8">
                                <AccountStep
                                    data={data}
                                    setData={setData}
                                    errors={errors}
                                    showPassword={showPassword}
                                    setShowPassword={setShowPassword}
                                    showPasswordConfirmation={
                                        showPasswordConfirmation
                                    }
                                    setShowPasswordConfirmation={
                                        setShowPasswordConfirmation
                                    }
                                />

                                <TurnstileWidget
                                    siteKey={turnstileSiteKey}
                                    onToken={(token) =>
                                        setData(
                                            "cf_turnstile_response",
                                            token,
                                        )
                                    }
                                    className="mt-6"
                                />
                                <FieldError
                                    message={errors.cf_turnstile_response}
                                />
                                {turnstileSiteKey && !turnstileOk && (
                                    <p
                                        className="mt-2 text-[0.75rem]"
                                        style={{ color: "var(--dv-muted)" }}
                                    >
                                        Selesaikan verifikasi anti-bot untuk
                                        melanjutkan.
                                    </p>
                                )}
                            </div>

                            <div className="mt-6 flex items-center justify-between gap-3">
                                <Link href={route("login")} className="dv-tlink">
                                    Sudah punya akun? Masuk
                                </Link>

                                <button
                                    type="submit"
                                    disabled={processing || !canSubmit}
                                    className="dv-btn dv-btn--accent"
                                >
                                    {processing
                                        ? "Mengirim kode…"
                                        : "Kirim kode verifikasi"}
                                    {!processing && (
                                        <ArrowRight
                                            size={16}
                                            strokeWidth={2.5}
                                        />
                                    )}
                                </button>
                            </div>

                            <FieldError message={errors.email} />
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

function AccountStep({
    data,
    setData,
    errors,
    showPassword,
    setShowPassword,
    showPasswordConfirmation,
    setShowPasswordConfirmation,
}) {
    return (
        <div>
            <p className="dv-label">Langkah 1 dari 2</p>
            <h2 className="dv-title mt-3">Buat akunmu</h2>
            <p
                className="mt-2 text-[0.9375rem] leading-relaxed"
                style={{ color: "var(--dv-muted)" }}
            >
                Ini akun yang akan jadi pemilik (owner) toko barumu.
            </p>

            <div className="mt-7 space-y-5">
                <div className="space-y-1.5">
                    <label htmlFor="name" className="dv-field-label">
                        Nama
                    </label>
                    <input
                        id="name"
                        type="text"
                        value={data.name}
                        autoComplete="name"
                        autoFocus
                        aria-invalid={errors.name ? "true" : undefined}
                        aria-describedby={
                            errors.name ? "name-error" : undefined
                        }
                        onChange={(e) => setData("name", e.target.value)}
                        className="dv-input"
                        placeholder="Nama lengkap"
                    />
                    <FieldError id="name-error" message={errors.name} />
                </div>

                <div className="space-y-1.5">
                    <label htmlFor="email" className="dv-field-label">
                        Email
                    </label>
                    <input
                        id="email"
                        type="email"
                        value={data.email}
                        autoComplete="username"
                        aria-invalid={errors.email ? "true" : undefined}
                        aria-describedby={
                            errors.email ? "email-error" : undefined
                        }
                        onChange={(e) => setData("email", e.target.value)}
                        className="dv-input"
                        placeholder="nama@email.com"
                    />
                    <FieldError id="email-error" message={errors.email} />
                </div>

                <div className="space-y-1.5">
                    <label htmlFor="password" className="dv-field-label">
                        Password
                    </label>
                    <div className="relative">
                        <input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            value={data.password}
                            autoComplete="new-password"
                            aria-invalid={
                                errors.password ? "true" : undefined
                            }
                            aria-describedby={
                                errors.password
                                    ? "password-error"
                                    : undefined
                            }
                            onChange={(e) =>
                                setData("password", e.target.value)
                            }
                            className="dv-input dv-input--action"
                            placeholder="Min. 8 karakter, huruf besar-kecil & angka"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            className="dv-input-action"
                            aria-label={
                                showPassword
                                    ? "Sembunyikan password"
                                    : "Tampilkan password"
                            }
                            aria-pressed={showPassword}
                        >
                            {showPassword ? (
                                <EyeOff size={16} />
                            ) : (
                                <Eye size={16} />
                            )}
                        </button>
                    </div>
                    <p
                        className="text-[0.75rem]"
                        style={{ color: "var(--dv-muted)" }}
                    >
                        Minimal 8 karakter, mengandung huruf besar, huruf
                        kecil, dan angka.
                    </p>
                    <FieldError
                        id="password-error"
                        message={errors.password}
                    />
                </div>

                <div className="space-y-1.5">
                    <label
                        htmlFor="password_confirmation"
                        className="dv-field-label"
                    >
                        Konfirmasi password
                    </label>
                    <div className="relative">
                        <input
                            id="password_confirmation"
                            type={
                                showPasswordConfirmation
                                    ? "text"
                                    : "password"
                            }
                            value={data.password_confirmation}
                            autoComplete="new-password"
                            onChange={(e) =>
                                setData(
                                    "password_confirmation",
                                    e.target.value,
                                )
                            }
                            className="dv-input dv-input--action"
                            placeholder="Ulangi password"
                        />
                        <button
                            type="button"
                            onClick={() =>
                                setShowPasswordConfirmation((v) => !v)
                            }
                            className="dv-input-action"
                            aria-label={
                                showPasswordConfirmation
                                    ? "Sembunyikan password"
                                    : "Tampilkan password"
                            }
                            aria-pressed={showPasswordConfirmation}
                        >
                            {showPasswordConfirmation ? (
                                <EyeOff size={16} />
                            ) : (
                                <Eye size={16} />
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
