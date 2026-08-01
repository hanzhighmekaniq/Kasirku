import { useState } from "react";
import { Head, Link, useForm, usePage } from "@inertiajs/react";
import { AlertTriangle, ArrowRight, Check, Eye, EyeOff } from "lucide-react";

/**
 * Halaman login.
 *
 * Palet & bahasa visualnya PATEN mengikuti landing page DEVus.id
 * (modern-minimal, tema Cobalt, anchor hue 262) dan sengaja TIDAK ikut
 * theme engine user — token warnanya ada di `.dv-auth` pada
 * resources/css/app.css, bukan di `:root`.
 *
 * Karena itu di file ini jangan pakai utility yang terikat tema
 * (`bg-primary`, `text-foreground`, `rounded-lg/md/sm`); pakai kelas `dv-*`
 * atau nilai eksplisit.
 */

const QUICK_LOGIN_ACCOUNTS = {
    retail: {
        label: "Retail — Minimarket Sejahtera",
        accounts: [
            { label: "Owner", email: "owner1@gmail.com", password: "password" },
            { label: "Developer", email: "dev@gmail.com", password: "password" },
        ],
    },
    fnb: {
        label: "F&B — Warung Kopi Senja",
        accounts: [
            { label: "Owner FnB", email: "owner2@gmail.com", password: "password" },
            { label: "Kasir Malioboro", email: "kasir.malioboro@gmail.com", password: "password" },
            { label: "Kasir UGM", email: "kasir.ugm@gmail.com", password: "password" },
            { label: "Barista", email: "barista.malioboro@gmail.com", password: "password" },
            { label: "Gudang Kopi", email: "gudang.kopi@gmail.com", password: "password" },
        ],
    },
};

const SPECS = [
    { label: "Jenis usaha", value: "8 mode" },
    { label: "Kasir gratis", value: "1 selamanya" },
    { label: "Perangkat", value: "HP / laptop" },
];

export default function Login({ status, canResetPassword, isLocal }) {
    const { flash } = usePage().props;
    const [showPassword, setShowPassword] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        email: "",
        password: "",
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route("login"), {
            onFinish: () => reset("password"),
        });
    };

    const fillQuickLogin = (email, password) => {
        setData({ ...data, email, password });
    };

    const year = new Date().getFullYear();

    return (
        <>
            <Head title="Masuk" />

            <div className="dv-auth grid min-h-screen lg:grid-cols-[1.15fr_1fr] xl:grid-cols-[1.35fr_1fr]">
                {/* ── Band gelap: satu-satunya area gelap di halaman ── */}
                <div className="dv-band hidden flex-col justify-between p-10 xl:p-14 lg:flex">
                    <a
                        href="https://devus.id"
                        className="dv-wordmark text-[1.375rem]"
                        aria-label="DEVus.id, beranda"
                    >
                        DEVus<span className="dv-wordmark__dot">.</span>id
                    </a>

                    <div className="max-w-xl space-y-6 py-10">
                        <p className="dv-flag">
                            <Check size={13} strokeWidth={2.5} />
                            Gratis untuk 1 kasir, selamanya
                        </p>

                        <h1 className="dv-display">
                            Satu sistem kasir.
                            <br />
                            Delapan jenis usaha.
                        </h1>

                        <p className="dv-lead">
                            Retail, kafe, bengkel, laundry, rental, parkir,
                            warnet, sampai hotel — semuanya jalan di satu
                            aplikasi. Kamu pilih jenis usaha, tampilan dan
                            fiturnya menyesuaikan sendiri.
                        </p>

                        <dl className="dv-spec max-w-sm">
                            {SPECS.map((spec) => (
                                <div key={spec.label} className="dv-spec__row">
                                    <dt className="dv-label">{spec.label}</dt>
                                    <dd className="dv-spec__val">
                                        {spec.value}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </div>

                    <p className="dv-label">
                        &copy; {year} DEVus.id — Seluruh hak dilindungi
                    </p>
                </div>

                {/* ── Panel form ── */}
                <div className="flex flex-col justify-center px-6 py-12 sm:px-10 lg:px-12">
                    <div className="mx-auto w-full max-w-[26rem]">
                        {/* Wordmark versi mobile — band-nya disembunyikan di bawah lg */}
                        <a
                            href="https://devus.id"
                            className="dv-wordmark mb-10 text-[1.375rem] lg:hidden"
                            aria-label="DEVus.id, beranda"
                        >
                            DEVus<span className="dv-wordmark__dot">.</span>id
                        </a>

                        <div className="dv-card p-7 sm:p-8">
                            <p className="dv-label">Masuk</p>
                            <h2 className="dv-title mt-3">
                                Lanjutkan ke dashboard
                            </h2>
                            <p
                                className="mt-2 text-[0.9375rem] leading-relaxed"
                                style={{ color: "var(--dv-muted)" }}
                            >
                                Pakai email dan password akun kasirmu.
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

                            {flash?.error && (
                                <div
                                    className="dv-alert dv-alert--bad mt-6"
                                    role="alert"
                                >
                                    <AlertTriangle
                                        size={15}
                                        strokeWidth={2.5}
                                        className="mt-px shrink-0"
                                    />
                                    <span>{flash.error}</span>
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
                                        <p
                                            id="email-error"
                                            className="dv-error"
                                        >
                                            <AlertTriangle
                                                size={13}
                                                strokeWidth={2.5}
                                                className="mt-0.5 shrink-0"
                                            />
                                            <span>{errors.email}</span>
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex items-baseline justify-between gap-3">
                                        <label
                                            htmlFor="password"
                                            className="dv-field-label"
                                        >
                                            Password
                                        </label>
                                        {canResetPassword && (
                                            <Link
                                                href={route("password.request")}
                                                className="dv-tlink"
                                            >
                                                Lupa password?
                                            </Link>
                                        )}
                                    </div>
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
                                            autoComplete="current-password"
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
                                            placeholder="Password akun"
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

                                <label className="flex w-fit items-center gap-2">
                                    <input
                                        type="checkbox"
                                        name="remember"
                                        checked={data.remember}
                                        onChange={(e) =>
                                            setData(
                                                "remember",
                                                e.target.checked,
                                            )
                                        }
                                        className="dv-check"
                                    />
                                    <span
                                        className="text-[0.8125rem] font-medium"
                                        style={{ color: "var(--dv-ink-2)" }}
                                    >
                                        Ingat saya di perangkat ini
                                    </span>
                                </label>

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="dv-btn dv-btn--accent dv-btn--block"
                                >
                                    {processing ? "Memproses…" : "Masuk"}
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
                                <p
                                    className="text-[0.875rem]"
                                    style={{ color: "var(--dv-muted)" }}
                                >
                                    Belum punya akun?{" "}
                                    <Link
                                        href={route("register")}
                                        className="dv-tlink"
                                    >
                                        Daftar toko baru
                                    </Link>
                                </p>
                            </div>
                        </div>

                        {isLocal && (
                            <div className="mt-6 space-y-5">
                                <p className="dv-label">Quick login · dev</p>

                                {Object.entries(QUICK_LOGIN_ACCOUNTS).map(
                                    ([key, group]) => (
                                        <div key={key} className="space-y-2">
                                            <p
                                                className="text-[0.8125rem] font-semibold"
                                                style={{
                                                    color: "var(--dv-ink-2)",
                                                }}
                                            >
                                                {group.label}
                                            </p>
                                            <div className="grid gap-2 sm:grid-cols-2">
                                                {group.accounts.map(
                                                    (account) => (
                                                        <button
                                                            key={account.email}
                                                            type="button"
                                                            onClick={() =>
                                                                fillQuickLogin(
                                                                    account.email,
                                                                    account.password,
                                                                )
                                                            }
                                                            className="dv-quick"
                                                        >
                                                            <span className="dv-quick__name">
                                                                {account.label}
                                                            </span>
                                                            <span className="dv-quick__mail">
                                                                {account.email}
                                                            </span>
                                                        </button>
                                                    ),
                                                )}
                                            </div>
                                        </div>
                                    ),
                                )}
                            </div>
                        )}

                        <p className="dv-label mt-10 lg:hidden">
                            &copy; {year} DEVus.id
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
