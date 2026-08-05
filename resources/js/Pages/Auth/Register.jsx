import { useState } from "react";
import { Head, Link, useForm } from "@inertiajs/react";
import { AlertTriangle, ArrowRight, Eye, EyeOff } from "lucide-react";
import PasswordStrengthMeter, {
    isPasswordValid,
} from "@/Components/PasswordStrengthMeter";

/**
 * Halaman registrasi mandiri — super mudah.
 * Hanya email + password. Nama di-generate otomatis oleh server.
 * Password wajib huruf besar, huruf kecil, dan angka (simbol opsional).
 * Akun langsung dibuat, user langsung login → redirect ke Welcome,
 * lalu wajib verifikasi email sebelum lanjut ke onboarding toko.
 */

export default function Register() {
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        email: "",
        password: "",
        password_confirmation: "",
    });

    const canSubmit =
        data.email.trim() &&
        isPasswordValid(data.password) &&
        data.password_confirmation === data.password;

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
                            Buat akun dalam hitungan detik. Pilih jenis usaha
                            dan plan di dalam aplikasi setelah login.
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
                                <h2 className="dv-title">Buat akunmu</h2>
                                <p
                                    className="mt-2 text-[0.9375rem] leading-relaxed"
                                    style={{ color: "var(--dv-muted)" }}
                                >
                                    Cukup email dan password. Nama akan
                                    di-generate otomatis, bisa diubah nanti.
                                </p>

                                <div className="mt-7 space-y-5">
                                    <div className="space-y-1.5">
                                        <label
                                            htmlFor="email"
                                            className="dv-field-label"
                                        >
                                            Email
                                        </label>
                                        <input
                                            id="email"
                                            type="email"
                                            value={data.email}
                                            autoComplete="username"
                                            autoFocus
                                            aria-invalid={
                                                errors.email
                                                    ? "true"
                                                    : undefined
                                            }
                                            aria-describedby={
                                                errors.email
                                                    ? "email-error"
                                                    : undefined
                                            }
                                            onChange={(e) =>
                                                setData("email", e.target.value)
                                            }
                                            className="dv-input"
                                            placeholder="nama@email.com"
                                        />
                                        <FieldError
                                            id="email-error"
                                            message={errors.email}
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label
                                            htmlFor="password"
                                            className="dv-field-label"
                                        >
                                            Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                id="password"
                                                type={
                                                    showPassword
                                                        ? "text"
                                                        : "password"
                                                }
                                                value={data.password}
                                                autoComplete="new-password"
                                                aria-invalid={
                                                    errors.password
                                                        ? "true"
                                                        : undefined
                                                }
                                                aria-describedby={
                                                    errors.password
                                                        ? "password-error"
                                                        : undefined
                                                }
                                                onChange={(e) =>
                                                    setData(
                                                        "password",
                                                        e.target.value,
                                                    )
                                                }
                                                className="dv-input dv-input--action"
                                                placeholder="Min. 8 karakter"
                                            />
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setShowPassword((v) => !v)
                                                }
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
                                        <FieldError
                                            id="password-error"
                                            message={errors.password}
                                        />
                                        <PasswordStrengthMeter
                                            password={data.password}
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
                                                    showPassword
                                                        ? "text"
                                                        : "password"
                                                }
                                                value={
                                                    data.password_confirmation
                                                }
                                                autoComplete="new-password"
                                                aria-invalid={
                                                    data.password_confirmation &&
                                                    data.password_confirmation !==
                                                        data.password
                                                        ? "true"
                                                        : undefined
                                                }
                                                onChange={(e) =>
                                                    setData(
                                                        "password_confirmation",
                                                        e.target.value,
                                                    )
                                                }
                                                className="dv-input dv-input--action"
                                                placeholder="Ulangi password"
                                            />
                                        </div>
                                        {data.password_confirmation &&
                                            data.password_confirmation !==
                                                data.password && (
                                                <FieldError message="Password tidak cocok." />
                                            )}
                                    </div>
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
                                    disabled={processing || !canSubmit}
                                    className="dv-btn dv-btn--accent"
                                >
                                    {processing
                                        ? "Membuat akun…"
                                        : "Daftar"}
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
