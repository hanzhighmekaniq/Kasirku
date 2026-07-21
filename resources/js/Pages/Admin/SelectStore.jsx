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
                            Kamu punya banyak toko.
                        </h1>
                        <p className="mt-4 max-w-md text-base text-muted-foreground/50">
                            Pilih toko yang ingin kamu kelola. Kamu bisa berpindah toko kapan saja dari header.
                        </p>
                    </div>

                    <div className="relative z-10 p-10 text-sm text-muted-foreground xl:px-14">
                        &copy; {new Date().getFullYear()} SIM-KASIR. All rights reserved.
                    </div>
                </div>

                {/* Store selection */}
                <div className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-2/5">
                    <div className="w-full max-w-md">
                        {/* Logo mobile */}
                        <div className="mb-8 flex items-center justify-center gap-3 lg:hidden">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg shadow-primary/20">
                                <ApplicationLogo className="h-6 w-6 fill-current text-white" />
                            </div>
                            <span className="text-lg font-bold tracking-tight text-foreground">SIM-KASIR</span>
                        </div>

                        <h2 className="text-2xl font-bold text-foreground">Pilih Toko</h2>
                        <p className="mt-1 text-sm text-muted-foreground">Kamu memiliki akses ke {stores.length} toko.</p>

                        {errors?.store_id && (
                            <div className="mt-4 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
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
                                            ? 'border-primary-500 bg-primary-50 shadow-lg shadow-primary-500/10'
                                            : 'border-border bg-card hover:border-primary-300 hover:bg-primary-50/50 hover:shadow-md'
                                    } disabled:opacity-60`}
                                >
                                    {/* Icon */}
                                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl transition ${
                                        selected === store.id ? 'bg-primary-100' : 'bg-muted group-hover:bg-primary-50'
                                    }`}>
                                        {STORE_TYPE_ICON[store.store_type] ?? '🏬'}
                                    </div>

                                    {/* Info */}
                                    <div className="min-w-0 flex-1">
                                        <p className={`text-sm font-semibold transition ${
                                            selected === store.id ? 'text-primary-700' : 'text-foreground'
                                        }`}>
                                            {store.name}
                                        </p>
                                        <div className="mt-0.5 flex items-center gap-2">
                                            <span className="text-xs text-muted-foreground">{STORE_TYPE_LABEL[store.store_type] ?? store.store_type}</span>
                                            <span className="text-muted-foreground/50">·</span>
                                            <span className="text-xs text-muted-foreground">{store.branches_count} cabang</span>
                                            <span className="text-muted-foreground/50">·</span>
                                            <span className="font-mono text-xs text-muted-foreground">{store.code}</span>
                                        </div>
                                    </div>

                                    {/* Arrow */}
                                    <svg className={`h-5 w-5 shrink-0 transition ${
                                        selected === store.id ? 'text-primary-500' : 'text-muted-foreground/50 group-hover:text-primary-400'
                                    }`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                    </svg>
                                </button>
                            ))}
                        </div>

                        <div className="mt-8 text-center">
                            <button
                                onClick={() => router.post(route('logout'))}
                                className="text-sm text-muted-foreground transition hover:text-muted-foreground"
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
