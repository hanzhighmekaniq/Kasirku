import { useState } from "react";
import { Head, Link, useForm } from "@inertiajs/react";
import { AlertTriangle, ArrowLeft, ArrowRight, Check } from "lucide-react";
import TurnstileWidget from "@/Components/TurnstileWidget";

/**
 * Halaman lupa password.
 *
 * Palet & bahasa visualnya PATEN mengikuti Login.jsx (tema `.dv-auth`,
 * bukan theme engine user) — jangan pakai utility yang terikat tema di
 * file ini, pakai kelas `dv-*` atau nilai eksplisit.
 */
export default function ForgotPassword({ status, turnstileSiteKey = null }) {
    const { data, setData, post, processing, errors } = useForm({
        email: "",
        cf_turnstile_response: "",
    });
    const [sent, setSent] = useState(false);

    const turnstileOk = !turnstileSiteKey || !!data.cf_turnstile_response;

    const submit = (e) => {
        e.preventDefault();
        post(route("password.email"), {
            preserveScroll: true,
            onSuccess: () => setSent(true),
        });
    };

    const year = new Date().getFullYear();

    return (
        <>
            <Head title="Lupa Password" />

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
                            Lupa password?
                            <br />
                            Tenang, bisa diatur.
                        </h1>

                        <p className="dv-lead">
                            Masukkan email akunmu, kami kirim tautan untuk
                            membuat password baru. Tautannya berlaku sementara
                            dan hanya bisa dipakai sekali.
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
                            <p className="dv-label">Lupa password</p>
                            <h2 className="dv-title mt-3">
                                Kirim tautan reset
                            </h2>
                            <p
                                className="mt-2 text-[0.9375rem] leading-relaxed"
                                style={{ color: "var(--dv-muted)" }}
                            >
                                Kami akan mengirim tautan ke email akunmu.
                            </p>

                            {status && (
                                <div
                                    className="dv-alert dv-alert--ok mt-6"
                                    role="status"
                                >
                                    <Check
                                        size={15}
                                        strokeWidth={2.5}
                                        className="mt-px shrink-0"
                                    />
                                    <span>{status}</span>
                                </div>
                            )}

                            <form onSubmit={submit} className="mt-7 space-y-5">
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
                                        name="email"
                                        value={data.email}
                                        autoComplete="username"
                                        autoFocus
                                        aria-invalid={
                                            errors.email ? "true" : undefined
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
                                    {errors.email && (
                                        <p id="email-error" className="dv-error">
                                            <AlertTriangle
                                                size={13}
                                                strokeWidth={2.5}
                                                className="mt-0.5 shrink-0"
                                            />
                                            <span>{errors.email}</span>
                                        </p>
                                    )}
                                </div>

                                <TurnstileWidget
                                    siteKey={turnstileSiteKey}
                                    onToken={(token) =>
                                        setData("cf_turnstile_response", token)
                                    }
                                    className=""
                                />
                                {errors.cf_turnstile_response && (
                                    <p className="dv-error">
                                        <AlertTriangle
                                            size={13}
                                            strokeWidth={2.5}
                                            className="mt-0.5 shrink-0"
                                        />
                                        <span>
                                            {errors.cf_turnstile_response}
                                        </span>
                                    </p>
                                )}

                                <button
                                    type="submit"
                                    disabled={processing || !data.email || !turnstileOk}
                                    className="dv-btn dv-btn--accent dv-btn--block"
                                >
                                    {processing
                                        ? "Mengirim…"
                                        : sent
                                          ? "Kirim ulang tautan"
                                          : "Kirim tautan reset"}
                                    {!processing && (
                                        <ArrowRight
                                            size={16}
                                            strokeWidth={2.5}
                                        />
                                    )}
                                </button>
                            </form>

                            <div
                                className="mt-6 border-t pt-5 text-center"
                                style={{ borderColor: "var(--dv-rule)" }}
                            >
                                <Link
                                    href={route("login")}
                                    className="dv-tlink inline-flex items-center gap-1.5"
                                >
                                    <ArrowLeft size={14} strokeWidth={2.5} />
                                    Kembali ke halaman masuk
                                </Link>
                            </div>
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
