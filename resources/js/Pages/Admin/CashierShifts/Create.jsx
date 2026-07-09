import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, useForm } from "@inertiajs/react";

export default function Create({ branchName, suggestedShiftNo }) {
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
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
                    >
                        <svg
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
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
                        <h2 className="text-base font-semibold text-slate-800">
                            Buka Shift Kasir
                        </h2>
                        {branchName && (
                            <p className="text-xs text-slate-400">
                                {branchName}
                            </p>
                        )}
                    </div>
                </div>
            }
        >
            <Head title="Buka Shift" />

            <div className="mx-auto max-w-lg">
                <form
                    onSubmit={submit}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                    {/* Header kartu */}
                    <div className="border-b border-slate-100 bg-slate-50 px-6 py-4">
                        <p className="text-sm font-semibold text-slate-800">
                            Informasi Shift
                        </p>
                        {suggestedShiftNo && (
                            <p className="mt-0.5 text-xs text-slate-500">
                                Nomor shift:{" "}
                                <span className="font-mono font-semibold text-indigo-600">
                                    {suggestedShiftNo}
                                </span>
                            </p>
                        )}
                    </div>

                    {/* Body */}
                    <div className="space-y-5 p-6">
                        {/* Kas Awal */}
                        <div>
                            <label
                                htmlFor="opening_cash"
                                className="mb-1.5 block text-sm font-medium text-slate-700"
                            >
                                Kas Awal <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-slate-400">
                                    Rp
                                </span>
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
                                    className="block w-full rounded-xl border-slate-300 pl-9 text-sm shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                    placeholder="0"
                                />
                            </div>
                            {errors.opening_cash && (
                                <p className="mt-1 text-xs text-red-500">
                                    {errors.opening_cash}
                                </p>
                            )}
                            <p className="mt-1 text-xs text-slate-400">
                                Jumlah uang tunai di laci kasir saat memulai
                                shift.
                            </p>
                        </div>

                        {/* Catatan Pembukaan */}
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
                                className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                placeholder="Opsional..."
                            />
                            {errors.opening_note && (
                                <p className="mt-1 text-xs text-red-500">
                                    {errors.opening_note}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50 px-6 py-4">
                        <Link
                            href={route("admin.cashier-shifts.index")}
                            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                            Batal
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700 disabled:opacity-60"
                        >
                            {processing ? "Membuka..." : "Buka Shift"}
                        </button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
