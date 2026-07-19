import ApplicationLogo from "@/Components/ApplicationLogo";
import Checkbox from "@/Components/Checkbox";
import InputError from "@/Components/InputError";
import { Head, Link, useForm, usePage } from "@inertiajs/react";

const QUICK_LOGIN_ACCOUNTS = [
    { label: "Owner", email: "owner1@gmail.com", password: "password" },
    { label: "Developer", email: "dev@gmail.com", password: "password" },
];

export default function Login({ status, canResetPassword, isLocal }) {
    const { flash } = usePage().props;
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

    return (
        <>
            <Head title="Log in" />

            <div className="flex min-h-screen bg-slate-100">
                {/* Brand panel (hidden on small screens) */}
                <div className="relative hidden w-1/2 overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-violet-950 lg:flex lg:flex-col lg:justify-between xl:w-3/5">
                    {/* Decorative glows */}
                    <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />
                    <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 translate-x-1/3 translate-y-1/3 rounded-full bg-violet-500/20 blur-3xl" />

                    <div className="relative z-10 p-10 xl:p-14">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30">
                                <ApplicationLogo className="h-7 w-7 fill-current text-white" />
                            </div>
                            <div className="leading-tight">
                                <span className="block text-lg font-bold tracking-tight text-white">
                                    SIM-KASIR
                                </span>
                                <span className="block text-xs font-medium text-slate-400">
                                    Point of Sale System
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10 p-10 xl:p-14">
                        <h1 className="max-w-md text-4xl font-bold leading-tight text-white xl:text-5xl">
                            Kelola bisnismu dalam satu sistem.
                        </h1>
                        <p className="mt-4 max-w-md text-base text-slate-300">
                            Solusi kasir serba bisa untuk minimart, cafe, dan
                            coffee shop. Cepat, modern, dan dapat diandalkan.
                        </p>
                        <div className="mt-8 flex flex-wrap gap-3">
                            {["Minimart", "Cafe", "Coffee Shop", "Retail"].map(
                                (tag) => (
                                    <span
                                        key={tag}
                                        className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-medium text-slate-200 backdrop-blur"
                                    >
                                        {tag}
                                    </span>
                                ),
                            )}
                        </div>
                    </div>

                    <div className="relative z-10 p-10 text-sm text-slate-400 xl:px-14">
                        &copy; {new Date().getFullYear()} SIM-KASIR. All rights
                        reserved.
                    </div>
                </div>

                {/* Form panel */}
                <div className="flex w-full flex-col justify-center px-6 py-12 sm:px-10 lg:w-1/2 xl:w-2/5">
                    <div className="mx-auto w-full max-w-md">
                        {/* Mobile brand */}
                        <div className="mb-8 flex items-center gap-3 lg:hidden">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30">
                                <ApplicationLogo className="h-7 w-7 fill-current text-white" />
                            </div>
                            <div className="leading-tight">
                                <span className="block text-lg font-bold tracking-tight text-slate-900">
                                    SIM-KASIR
                                </span>
                                <span className="block text-xs font-medium text-slate-500">
                                    Point of Sale System
                                </span>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/60 sm:p-9">
                            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                                Selamat datang kembali
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Masuk untuk melanjutkan ke dashboard kamu.
                            </p>

                            {status && (
                                <div className="mt-5 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                                    {status}
                                </div>
                            )}

                            {flash?.error && (
                                <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                                    <svg
                                        className="mr-1.5 inline-block h-4 w-4 align-text-bottom"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth={2}
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                                        />
                                    </svg>
                                    {flash.error}
                                </div>
                            )}

                            <form onSubmit={submit} className="mt-6 space-y-5">
                                <div>
                                    <label
                                        htmlFor="email"
                                        className="block text-sm font-medium text-slate-700"
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
                                        onChange={(e) =>
                                            setData("email", e.target.value)
                                        }
                                        className="mt-1.5 block w-full rounded-xl border-slate-300 shadow-sm transition focus:border-indigo-500 focus:ring-indigo-500"
                                        placeholder="nama@email.com"
                                    />
                                    <InputError
                                        message={errors.email}
                                        className="mt-2"
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="password"
                                        className="block text-sm font-medium text-slate-700"
                                    >
                                        Password
                                    </label>
                                    <input
                                        id="password"
                                        type="password"
                                        name="password"
                                        value={data.password}
                                        autoComplete="current-password"
                                        onChange={(e) =>
                                            setData("password", e.target.value)
                                        }
                                        className="mt-1.5 block w-full rounded-xl border-slate-300 shadow-sm transition focus:border-indigo-500 focus:ring-indigo-500"
                                        placeholder="••••••••"
                                    />
                                    <InputError
                                        message={errors.password}
                                        className="mt-2"
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <label className="flex items-center">
                                        <Checkbox
                                            name="remember"
                                            checked={data.remember}
                                            onChange={(e) =>
                                                setData(
                                                    "remember",
                                                    e.target.checked,
                                                )
                                            }
                                        />
                                        <span className="ms-2 text-sm text-slate-600">
                                            Ingat saya
                                        </span>
                                    </label>
                                    {canResetPassword && (
                                        <Link
                                            href={route("password.request")}
                                            className="text-sm font-medium text-indigo-600 transition hover:text-indigo-500"
                                        >
                                            Lupa password?
                                        </Link>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:from-indigo-600 hover:to-violet-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60"
                                >
                                    {processing ? "Memproses..." : "Masuk"}
                                </button>
                            </form>

                            {isLocal && (
                                <div className="mt-6 border-t border-dashed border-slate-200 pt-5">
                                    <p className="mb-2.5 text-center text-xs font-medium uppercase tracking-wide text-slate-400">
                                        Quick login (dev only)
                                    </p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {QUICK_LOGIN_ACCOUNTS.map(
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
                                                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600"
                                                >
                                                    {account.label}
                                                    <span className="mt-0.5 block truncate font-normal text-slate-400">
                                                        {account.email}
                                                    </span>
                                                </button>
                                            ),
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <p className="mt-6 text-center text-xs text-slate-400 lg:hidden">
                            &copy; {new Date().getFullYear()} SIM-KASIR. All
                            rights reserved.
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
