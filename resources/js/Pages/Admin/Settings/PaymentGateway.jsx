import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';

const METHOD_LABELS = {
    qris:        { label: 'QRIS',           icon: '📱' },
    gopay:       { label: 'GoPay',          icon: '🟢' },
    shopeepay:   { label: 'ShopeePay',      icon: '🟠' },
    dana:        { label: 'DANA',           icon: '🔵' },
    ovo:         { label: 'OVO',            icon: '🟣' },
    bca_va:      { label: 'VA BCA',         icon: '🏦' },
    mandiri_va:  { label: 'VA Mandiri',     icon: '🏦' },
    bri_va:      { label: 'VA BRI',         icon: '🏦' },
    bni_va:      { label: 'VA BNI',         icon: '🏦' },
    permata_va:  { label: 'VA Permata',     icon: '🏦' },
};

function inputCls(err = false) {
    return `block w-full rounded-xl border text-sm shadow-sm transition focus:ring-2 ${
        err ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
            : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-200'}`;
}

function ProviderCard({ provider, config, onSave }) {
    const meta  = {
        midtrans: { label: 'Midtrans', color: 'from-green-500 to-teal-600', desc: 'QRIS, GoPay, ShopeePay, DANA, OVO, VA Bank' },
    }[provider] ?? { label: provider, color: 'from-slate-500 to-slate-600', desc: '' };

    const { data, setData, post, processing, errors } = useForm({
        is_active:       config?.is_active       ?? false,
        environment:     config?.environment     ?? 'sandbox',
        server_key:      '',
        client_key:      '',
        merchant_id:     config?.merchant_id     ?? '',
        enabled_methods: config?.enabled_methods ?? [],
    });

    const allMethods = Object.keys(METHOD_LABELS);

    const toggleMethod = (m) => {
        setData('enabled_methods',
            data.enabled_methods.includes(m)
                ? data.enabled_methods.filter((x) => x !== m)
                : [...data.enabled_methods, m]
        );
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.payment-gateway.save', provider));
    };

    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className={`flex items-center justify-between bg-gradient-to-r ${meta.color} px-6 py-4`}>
                <div>
                    <h3 className="text-base font-bold text-white">{meta.label}</h3>
                    <p className="text-xs text-white/70">{meta.desc}</p>
                </div>
                <button
                    type="button"
                    onClick={() => setData('is_active', !data.is_active)}
                    className={`relative h-7 w-12 rounded-full transition-colors ${data.is_active ? 'bg-white/30' : 'bg-black/20'}`}
                >
                    <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${data.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
            </div>

            <form onSubmit={submit} className="space-y-4 p-5">
                {/* Environment */}
                <div className="flex gap-2">
                    {['sandbox', 'production'].map((env) => (
                        <button
                            key={env}
                            type="button"
                            onClick={() => setData('environment', env)}
                            className={`flex-1 rounded-xl border py-2 text-xs font-semibold capitalize transition ${
                                data.environment === env
                                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            {env === 'sandbox' ? '🧪 Sandbox' : '🚀 Production'}
                        </button>
                    ))}
                </div>

                {/* API Keys */}
                <div className="space-y-3">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                            Server Key
                            {config?.has_server_key && <span className="ml-2 text-xs text-emerald-600">✓ Sudah diset</span>}
                        </label>
                        <input
                            type="password"
                            value={data.server_key}
                            onChange={(e) => setData('server_key', e.target.value)}
                            placeholder={config?.has_server_key ? '••••••••' : 'SB-Mid-server-xxxxx'}
                            className={inputCls(!!errors.server_key)}
                        />
                        <p className="mt-1 text-xs text-slate-400">Kosongkan jika tidak ingin mengubah key yang sudah ada.</p>
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                            Client Key
                            {config?.has_client_key && <span className="ml-2 text-xs text-emerald-600">✓ Sudah diset</span>}
                        </label>
                        <input
                            type="password"
                            value={data.client_key}
                            onChange={(e) => setData('client_key', e.target.value)}
                            placeholder={config?.has_client_key ? '••••••••' : 'SB-Mid-client-xxxxx'}
                            className={inputCls(!!errors.client_key)}
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Merchant ID</label>
                        <input
                            type="text"
                            value={data.merchant_id}
                            onChange={(e) => setData('merchant_id', e.target.value)}
                            placeholder="G123456789"
                            className={inputCls(!!errors.merchant_id)}
                        />
                    </div>
                </div>

                {/* Enabled methods */}
                <div>
                    <p className="mb-2 text-sm font-medium text-slate-700">Metode yang Diaktifkan</p>
                    <div className="flex flex-wrap gap-2">
                        {allMethods.map((m) => {
                            const active = data.enabled_methods.includes(m);
                            const meta   = METHOD_LABELS[m];
                            return (
                                <button
                                    key={m}
                                    type="button"
                                    onClick={() => toggleMethod(m)}
                                    className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition ${
                                        active ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                    }`}
                                >
                                    {meta.icon} {meta.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={processing}
                    className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:from-indigo-600 hover:to-violet-700 disabled:opacity-60"
                >
                    {processing ? 'Menyimpan...' : 'Simpan Konfigurasi'}
                </button>
            </form>
        </div>
    );
}

export default function PaymentGatewaySettings({ providers, configs }) {
    const { flash } = usePage().props;

    return (
        <AuthenticatedLayout
            header={<h2 className="text-lg font-semibold text-slate-800">Payment Gateway</h2>}
        >
            <Head title="Payment Gateway" />

            {flash?.success && (
                <div className="mb-5 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {flash.success}
                </div>
            )}

            <div className="mb-5 flex items-start gap-3 rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3">
                <svg className="mt-0.5 h-5 w-5 shrink-0 text-indigo-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                </svg>
                <p className="text-xs text-indigo-700">
                    API keys dienkripsi sebelum disimpan. Webhook URL kamu: <code className="font-mono bg-indigo-100 px-1 rounded">/webhooks/midtrans</code>
                </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {Object.keys({midtrans: true}).map((provider) => (
                    <ProviderCard
                        key={provider}
                        provider={provider}
                        config={configs[provider] ?? null}
                    />
                ))}
            </div>
        </AuthenticatedLayout>
    );
}
