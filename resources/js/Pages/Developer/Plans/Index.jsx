import DeveloperLayout from "@/Layouts/DeveloperLayout";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { useState } from "react";

export default function Index({ plans }) {
    const { flash } = usePage().props;
    const [deleting, setDeleting] = useState(null);

    const handleDelete = (plan) => {
        if (!confirm(`Hapus paket "${plan.label}"?`)) return;
        setDeleting(plan.id);
        router.delete(route("developer.plans.destroy", plan), {
            preserveScroll: true,
            onFinish: () => setDeleting(null),
        });
    };

    return (
        <DeveloperLayout
            header={
                <div className="flex w-full items-center justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-800">
                            Paket Langganan
                        </h2>
                        <p className="text-xs text-slate-500">
                            {plans.length} paket tersedia
                        </p>
                    </div>
                    <Link
                        href={route("developer.plans.create")}
                        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                    >
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
                                d="M12 4.5v15m7.5-7.5h-15"
                            />
                        </svg>
                        Tambah Paket
                    </Link>
                </div>
            }
        >
            <Head title="Paket Langganan" />

            {flash?.success && (
                <div className="mb-5 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    <svg
                        className="h-5 w-5 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.8}
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                    {flash.success}
                </div>
            )}
            {flash?.error && (
                <div className="mb-5 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <svg
                        className="h-5 w-5 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.8}
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

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                {plans.length === 0 ? (
                    <div className="flex flex-col items-center py-16 text-center">
                        <span className="text-5xl mb-4">📦</span>
                        <p className="text-base font-semibold text-slate-800">
                            Belum ada paket
                        </p>
                        <p className="text-sm text-slate-500 mt-1">
                            Buat paket langganan pertama.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    <th className="px-5 py-3.5">Paket</th>
                                    <th className="px-5 py-3.5">User</th>
                                    <th className="px-5 py-3.5">Cabang</th>
                                    <th className="px-5 py-3.5">Harga</th>
                                    <th className="px-5 py-3.5">Fitur</th>
                                    <th className="px-5 py-3.5 text-center">
                                        Status
                                    </th>
                                    <th className="px-5 py-3.5 text-right">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {plans.map((plan) => (
                                    <tr
                                        key={plan.id}
                                        className="transition hover:bg-slate-50/70"
                                    >
                                        <td className="px-5 py-4">
                                            <div>
                                                <p className="font-semibold text-slate-800">
                                                    {plan.label}
                                                </p>
                                                <p className="text-xs text-slate-400 font-mono">
                                                    {plan.code}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-slate-700">
                                            {plan.max_users}
                                        </td>
                                        <td className="px-5 py-4 text-slate-700">
                                            {plan.max_branches}
                                        </td>
                                        <td className="px-5 py-4 text-slate-700">
                                            {plan.price > 0
                                                ? new Intl.NumberFormat(
                                                      "id-ID",
                                                      {
                                                          style: "currency",
                                                          currency: "IDR",
                                                          maximumFractionDigits: 0,
                                                      },
                                                  ).format(plan.price)
                                                : "Gratis"}
                                            {plan.trial_days > 0 && (
                                                <span className="ml-1 text-xs text-slate-400">
                                                    /bln
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="text-xs text-slate-500">
                                                {plan.plan_features?.length > 0
                                                    ? plan.plan_features
                                                          .length + " fitur"
                                                    : "-"}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <span
                                                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${plan.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
                                            >
                                                {plan.is_active
                                                    ? "Aktif"
                                                    : "Nonaktif"}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center justify-end gap-1">
                                                <Link
                                                    href={route(
                                                        "developer.plans.edit",
                                                        plan,
                                                    )}
                                                    title="Edit"
                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-indigo-50 hover:text-indigo-600"
                                                >
                                                    <svg
                                                        className="h-5 w-5"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        strokeWidth={1.7}
                                                        stroke="currentColor"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"
                                                        />
                                                    </svg>
                                                </Link>
                                                <button
                                                    onClick={() =>
                                                        handleDelete(plan)
                                                    }
                                                    disabled={
                                                        deleting === plan.id
                                                    }
                                                    title="Hapus"
                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                                                >
                                                    <svg
                                                        className="h-5 w-5"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        strokeWidth={1.7}
                                                        stroke="currentColor"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                                                        />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </DeveloperLayout>
    );
}
