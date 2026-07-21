import ApplicationLogo from '@/Components/ApplicationLogo';
import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function SelectBranch({ branches, storeName }) {
    const errors = usePage().props.errors || {};
    const [selectedBranch, setSelectedBranch] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const handleSelect = (branchId) => {
        setSelectedBranch(branchId);
        setSubmitting(true);
        router.post(route('admin.branch.select.post'), { branch_id: branchId }, {
            onFinish: () => setSubmitting(false),
        });
    };

    return (
        <>
            <Head title="Pilih Cabang" />

            <div className="flex min-h-screen bg-muted">
                {/* Brand panel */}
                <div className="relative hidden w-1/2 overflow-hidden bg-gradient-to-br from-slate-900 via-primary-950 to-primary-950 lg:flex lg:flex-col lg:justify-between xl:w-3/5">
                    <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-primary-500/20 blur-3xl" />
                    <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 translate-x-1/3 translate-y-1/3 rounded-full bg-violet-500/20 blur-3xl" />

                    <div className="relative z-10 p-10 xl:p-14">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg shadow-primary/20">
                                <ApplicationLogo className="h-7 w-7 fill-current text-white" />
                            </div>
                            <div className="leading-tight">
                                <span className="block text-lg font-bold tracking-tight text-white">SIM-KASIR</span>
                                <span className="block text-xs font-medium text-muted-foreground">Point of Sale System</span>
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10 p-10 xl:p-14">
                        <h1 className="max-w-md text-4xl font-bold leading-tight text-white xl:text-5xl">
                            Pilih cabang untuk mulai bekerja.
                        </h1>
                        <p className="mt-4 max-w-md text-base text-muted-foreground/50">
                            Setiap cabang memiliki data penjualan, stok, dan meja yang terpisah.
                        </p>
                    </div>

                    <div className="relative z-10 p-10 text-sm text-muted-foreground xl:px-14">
                        &copy; {new Date().getFullYear()} SIM-KASIR. All rights reserved.
                    </div>
                </div>

                {/* Branch selection form */}
                <div className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-2/5 xl:w-2/5">
                    <div className="w-full max-w-md">
                        {/* Logo (mobile only) */}
                        <div className="mb-8 flex items-center justify-center gap-3 lg:hidden">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg shadow-primary/20">
                                <ApplicationLogo className="h-6 w-6 fill-current text-white" />
                            </div>
                            <span className="text-lg font-bold tracking-tight text-foreground">SIM-KASIR</span>
                        </div>

                        <h2 className="text-2xl font-bold text-foreground">Pilih Cabang</h2>
                        <p className="mt-1 text-sm text-muted-foreground">{storeName}</p>

                        {errors.branch_id && (
                            <div className="mt-4 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                                {errors.branch_id}
                            </div>
                        )}

                        <div className="mt-6 space-y-3">
                            {branches.map((branch) => (
                                <button
                                    key={branch.id}
                                    onClick={() => handleSelect(branch.id)}
                                    disabled={submitting}
                                    className={`group flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all duration-200 ${
                                        selectedBranch === branch.id
                                            ? 'border-primary-500 bg-primary-50 shadow-lg shadow-primary-500/10'
                                            : 'border-border bg-card hover:border-primary-300 hover:bg-primary-50/50 hover:shadow-md'
                                    } disabled:opacity-60`}
                                >
                                    {/* Icon */}
                                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg font-bold text-white transition ${
                                        selectedBranch === branch.id
                                            ? 'bg-gradient-to-br from-primary-500 to-primary-600'
                                            : 'bg-gradient-to-br from-slate-400 to-slate-500 group-hover:from-primary-400 group-hover:to-primary-500'
                                    }`}>
                                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.015A3.001 3.001 0 0021 9.349m-18 0V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25v4.099" />
                                        </svg>
                                    </div>

                                    {/* Info */}
                                    <div className="min-w-0 flex-1">
                                        <p className={`text-sm font-semibold transition ${
                                            selectedBranch === branch.id ? 'text-primary-700' : 'text-foreground'
                                        }`}>
                                            {branch.name}
                                        </p>
                                        {branch.code && (
                                            <p className="mt-0.5 text-xs text-muted-foreground">Kode: {branch.code}</p>
                                        )}
                                        {branch.address && (
                                            <p className="mt-0.5 text-xs text-muted-foreground truncate">{branch.address}</p>
                                        )}
                                    </div>

                                    {/* Arrow */}
                                    <svg className={`h-5 w-5 shrink-0 transition ${
                                        selectedBranch === branch.id ? 'text-primary-500' : 'text-muted-foreground/50 group-hover:text-primary-400'
                                    }`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                    </svg>
                                </button>
                            ))}
                        </div>

                        {/* Back link */}
                        <div className="mt-8 text-center">
                            <button
                                onClick={() => router.visit(route('admin.dashboard'))}
                                className="text-sm text-muted-foreground hover:text-muted-foreground transition"
                            >
                                ← Kembali ke Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
