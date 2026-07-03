import ApplicationLogo from '@/Components/ApplicationLogo';
import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

const STORE_TYPE_ICON = {
    minimarket:   '🏪',
    cafe:         '☕',
    booth_coffee: '🧋',
};

const STORE_TYPE_LABEL = {
    minimarket:   'Minimarket',
    cafe:         'Cafe / Resto',
    booth_coffee: 'Booth Kopi',
};

export default function SelectStore({ stores }) {
    const { errors } = usePage().props;
    const [selected, setSelected] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const handleSelect = (storeId) => {
        setSelected(storeId);
        setSubmitting(true);
        router.post(route('admin.store.select.post'), { store_id: storeId }, {
            onFinish: () => setSubmitting(false),
        });
    };

    return (
        <>
            <Head title="Pilih Toko" />

            <div className="flex min-h-screen bg-slate-100">
                {/* Brand panel */}
                <div className="relative hidden w-1/2 overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-violet-950 lg:flex lg:flex-col lg:justify-between xl:w-3/5">
                    <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />
                    <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 translate-x-1/3 translate-y-1/3 rounded-full bg-violet-500/20 blur-3xl" />

                    <div className="relative z-10 p-10 xl:p-14">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30">
                                <ApplicationLogo className="h-7 w-7 fill-current text-white" />
                            </div>
                            <div className="leading-tight">
                                <span className="block text-lg font-bold tracking-tight text-white">SIM-KASIR</span>
                                <span className="block text-xs font-medium text-slate-400">Point of Sale System</span>
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10 p-10 xl:p-14">
                        <h1 className="max-w-md text-4xl font-bold leading-tight text-white xl:text-5xl">
                            Kamu punya banyak toko.
                        </h1>
                        <p className="mt-4 max-w-md text-base text-slate-300">
                            Pilih toko yang ingin kamu kelola. Kamu bisa berpindah toko kapan saja dari header.
                        </p>
                    </div>

                    <div className="relative z-10 p-10 text-sm text-slate-400 xl:px-14">
                        &copy; {new Date().getFullYear()} SIM-KASIR. All rights reserved.
                    </div>
                </div>

                {/* Store selection */}
                <div className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-2/5">
                    <div className="w-full max-w-md">
                        {/* Logo mobile */}
                        <div className="mb-8 flex items-center justify-center gap-3 lg:hidden">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30">
                                <ApplicationLogo className="h-6 w-6 fill-current text-white" />
                            </div>
                            <span className="text-lg font-bold tracking-tight text-slate-800">SIM-KASIR</span>
                        </div>

                        <h2 className="text-2xl font-bold text-slate-800">Pilih Toko</h2>
                        <p className="mt-1 text-sm text-slate-500">Kamu memiliki akses ke {stores.length} toko.</p>

                        {errors?.store_id && (
                            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                                {errors.store_id}
                            </div>
                        )}

                        <div className="mt-6 space-y-3">
                            {stores.map((store) => (
                                <button
                                    key={store.id}
                                    onClick={() => handleSelect(store.id)}
                                    disabled={submitting}
                                    className={`group flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all duration-200 ${
                                        selected === store.id
                                            ? 'border-indigo-500 bg-indigo-50 shadow-lg shadow-indigo-500/10'
                                            : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/50 hover:shadow-md'
                                    } disabled:opacity-60`}
                                >
                                    {/* Icon */}
                                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl transition ${
                                        selected === store.id ? 'bg-indigo-100' : 'bg-slate-100 group-hover:bg-indigo-50'
                                    }`}>
                                        {STORE_TYPE_ICON[store.store_type] ?? '🏬'}
                                    </div>

                                    {/* Info */}
                                    <div className="min-w-0 flex-1">
                                        <p className={`text-sm font-semibold transition ${
                                            selected === store.id ? 'text-indigo-700' : 'text-slate-800'
                                        }`}>
                                            {store.name}
                                        </p>
                                        <div className="mt-0.5 flex items-center gap-2">
                                            <span className="text-xs text-slate-400">{STORE_TYPE_LABEL[store.store_type] ?? store.store_type}</span>
                                            <span className="text-slate-300">·</span>
                                            <span className="text-xs text-slate-400">{store.branches_count} cabang</span>
                                            <span className="text-slate-300">·</span>
                                            <span className="font-mono text-xs text-slate-400">{store.code}</span>
                                        </div>
                                    </div>

                                    {/* Arrow */}
                                    <svg className={`h-5 w-5 shrink-0 transition ${
                                        selected === store.id ? 'text-indigo-500' : 'text-slate-300 group-hover:text-indigo-400'
                                    }`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                    </svg>
                                </button>
                            ))}
                        </div>

                        <div className="mt-8 text-center">
                            <button
                                onClick={() => router.post(route('logout'))}
                                className="text-sm text-slate-400 transition hover:text-slate-600"
                            >
                                ← Kembali ke login
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
