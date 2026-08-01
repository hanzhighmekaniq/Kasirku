import { useState } from "react";
import { Head, useForm } from "@inertiajs/react";
import { AlertTriangle, ArrowRight, Eye, EyeOff } from "lucide-react";

/**
 * Halaman buat password baru (dari tautan reset di email).
 *
 * Palet & bahasa visualnya PATEN mengikuti Login.jsx (tema `.dv-auth`,
 * bukan theme engine user) — jangan pakai utility yang terikat tema di
 * file ini, pakai kelas `dv-*` atau nilai eksplisit.
 */
export default function ResetPassword({ token, email }) {
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirmation, setShowPasswordConfirmation] =
        useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        token,
        email,
        password: "",
        password_confirmation: "",
    });

    const submit = (e) => {
        e.preventDefault();
        post(route("password.store"), {
            onFinish: () => reset("password", "password_confirmation"),
        });
    };

    const year = new Date().getFullYear();

    return (
        <>
            <Head title="Buat Password Baru" />

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
                            Buat password baru
                            <br />
                            untuk akunmu.
                        </h1>

                        <p className="dv-lead">
                            Pilih password yang kuat dan belum pernah kamu
                            pakai di layanan lain. Setelah tersimpan, kamu bisa
                            langsung masuk dengan password baru itu.
                        </p>
                    </div>

                    <p className="dv-label">
                        &copy; {year} DEVus.id — Seluruh hak dilindungi
                    </p>
                </div>

                {/* ── Panel form ── */}
                <div className="flex flex-col justify-center px-6 py-12 sm:px-10 lg:px-12">
                    <div className="mx-auto w-full max-w-[26rem]">
                        <a
                            href="https://devus.id"
                            className="dv-wordmark mb-10 text-[1.375rem] lg:hidden"
                            aria-label="DEVus.id, beranda"
                        >
                            DEVus<span className="dv-wordmark__dot">.</span>id
                        </a>

                        <div className="dv-card p-7 sm:p-8">
                            <p className="dv-label">Reset password</p>
                            <h2 className="dv-title mt-3">
                                Buat password baru
                            </h2>
                            <p
                                className="mt-2 text-[0.9375rem] leading-relaxed"
                                style={{ color: "var(--dv-muted)" }}
                            >
                                Untuk akun{" "}
                                <span
                                    style={{
                                        color: "var(--dv-ink)",
                                        fontWeight: 600,
                                    }}
                                >
                                    {data.email}
                                </span>
                            </p>

                            <form onSubmit={submit} className="mt-7 space-y-5">
                                <div className="space-y-1.5">
                                    <label
                                        htmlFor="password"
                                        className="dv-field-label"
                                    >
                                        Password baru
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="password"
                                            type={
                                                showPassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            name="password"
                                            value={data.password}
                                            autoComplete="new-password"
                                            autoFocus
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
                                            placeholder="Min. 8 karakter, huruf besar-kecil & angka"
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
                                    <p
                                        className="text-[0.75rem]"
                                        style={{ color: "var(--dv-muted)" }}
                                    >
                                        Minimal 8 karakter, mengandung huruf
                                        besar, huruf kecil, dan angka.
                                    </p>
                                    {errors.password && (
                                        <p
                                            id="password-error"
                                            className="dv-error"
                                        >
                                            <AlertTriangle
                                                size={13}
                                                strokeWidth={2.5}
                                                className="mt-0.5 shrink-0"
                                            />
                                            <span>{errors.password}</span>
                                        </p>
                                    )}
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
                                            name="password_confirmation"
                                            value={data.password_confirmation}
                                            autoComplete="new-password"
                                            onChange={(e) =>
                                                setData(
                                                    "password_confirmation",
                                                    e.target.value,
                                                )
                                            }
                                            className="dv-input dv-input--action"
                                            placeholder="Ulangi password baru"
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowPasswordConfirmation(
                                                    (v) => !v,
                                                )
                                            }
                                            className="dv-input-action"
                                            aria-label={
                                                showPasswordConfirmation
                                                    ? "Sembunyikan password"
                                                    : "Tampilkan password"
                                            }
                                            aria-pressed={
                                                showPasswordConfirmation
                                            }
                                        >
                                            {showPasswordConfirmation ? (
                                                <EyeOff size={16} />
                                            ) : (
                                                <Eye size={16} />
                                            )}
                                        </button>
                                    </div>
                                    {errors.password_confirmation && (
                                        <p className="dv-error">
                                            <AlertTriangle
                                                size={13}
                                                strokeWidth={2.5}
                                                className="mt-0.5 shrink-0"
                                            />
                                            <span>
                                                {errors.password_confirmation}
                                            </span>
                                        </p>
                                    )}
                                </div>

                                {errors.email && (
                                    <p className="dv-error">
                                        <AlertTriangle
                                            size={13}
                                            strokeWidth={2.5}
                                            className="mt-0.5 shrink-0"
                                        />
                                        <span>{errors.email}</span>
                                    </p>
                                )}

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="dv-btn dv-btn--accent dv-btn--block"
                                >
                                    {processing
                                        ? "Menyimpan…"
                                        : "Simpan password baru"}
                                    {!processing && (
                                        <ArrowRight
                                            size={16}
                                            strokeWidth={2.5}
                                        />
                                    )}
                                </button>
                            </form>
                        </div>

                        <p className="dv-label mt-10 lg:hidden">
                            &copy; {year} DEVus.id
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
