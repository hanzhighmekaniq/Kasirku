import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, useForm } from "@inertiajs/react";

const inputCls =
    "block w-full rounded-xl border-slate-300 text-sm shadow-sm transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200";

export default function Create({ branchId, suggestedShiftNo }) {
    const { data, setData, post, processing, errors } = useForm({
        opening_cash: "",
        opening_note: "",
    });

    const submit = (e) => {
        e.preventDefault();
        post(route("admin.cashier-shifts.store"));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <Link
                        href={route("admin.cashier-shifts.index")}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                        aria-label="Kembali"
                    >
                        <svg
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.8}
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                            />
                        </svg>
                    </Link>
                    <div>
                        <h2 className="text-lg font-semibold text-slate-800">
                            Buka Shift Kasir
                        </h2>
                        <p className="text-sm text-slate-400">
                            Masukkan jumlah kas awal untuk memulai shift
                        </p>
                    </div>
                </div>
            }
        >
            <Head title="Buka Shift Kasir" />

            <div className="mx-auto max-w-2xl">
                <form
                    onSubmit={submit}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                    {/* Header */}
                    <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-5">
                        <h3 className="text-base font-semibold text-slate-900">
                            Informasi Shift
                        </h3>
                        <p className="mt-0.5 text-sm text-slate-500">
                            Shift akan dicatat dengan nomor:{" "}
                            <span className="font-mono font-medium text-indigo-600">
                                {suggestedShiftNo}
                            </span>
                        </p>
                    </div>

                    {/* Form Body */}
                    <div className="space-y-5 p-6">
                        {/* Opening Cash */}
                        <div>
                            <label
                                htmlFor="opening_cash"
                                className="mb-1.5 block text-sm font-medium text-slate-700"
                            >
                                Kas Awal <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                                    <span className="text-sm font-medium text-slate-400">
                                        Rp
                                    </span>
                                </div>
                                <input
                                    id="opening_cash"
                                    type="number"
                                    min="0"
                                    step="1"
                                    required
                                    value={data.opening_cash}
                                    onChange={(e) =>
                                        setData("opening_cash", e.target.value)
                                    }
                                    className={`${inputCls} pl-10`}
                                    placeholder="0"
                                />
                            </div>
                            {errors.opening_cash && (
                                <p className="mt-1 text-xs text-red-500">
                                    {errors.opening_cash}
                                </p>
                            )}
                            <p className="mt-1 text-xs text-slate-400">
                                Jumlah uang tunai yang ada di laci kasir saat
                                memulai shift.
                            </p>
                        </div>

                        {/* Opening Note */}
                        <div>
                            <label
                                htmlFor="opening_note"
                                className="mb-1.5 block text-sm font-medium text-slate-700"
                            >
                                Catatan Pembukaan
                            </label>
                            <textarea
                                id="opening_note"
                                rows={3}
                                maxLength={1000}
                                value={data.opening_note}
                                onChange={(e) =>
                                    setData("opening_note", e.target.value)
                                }
                                className={inputCls}
                                placeholder="Opsional: catatan saat membuka shift..."
                            />
                            {errors.opening_note && (
                                <p className="mt-1 text-xs text-red-500">
                                    {errors.opening_note}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="border-t border-slate-100 bg-slate-50/30 px-6 py-4">
                        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <Link
                                href={route("admin.cashier-shifts.index")}
                                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                            >
                                Batal
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:from-indigo-600 hover:to-violet-700 disabled:opacity-60"
                            >
                                {processing ? (
                                    <>
                                        <svg
                                            className="h-4 w-4 animate-spin"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                            />
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                            />
                                        </svg>
                                        Membuka...
                                    </>
                                ) : (
                                    <>
                                        <svg
                                            className="h-4 w-4"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            strokeWidth={2}
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                                            />
                                        </svg>
                                        Buka Shift
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
