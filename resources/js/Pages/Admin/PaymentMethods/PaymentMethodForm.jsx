import { Link } from '@inertiajs/react';

const TYPE_LABELS = {
    cash:    { label: 'Tunai',          icon: '💵', desc: 'Pembayaran fisik menggunakan uang tunai' },
    digital: { label: 'Digital / QRIS', icon: '📱', desc: 'Dompet digital, QRIS, transfer bank' },
    card:    { label: 'Kartu',          icon: '💳', desc: 'Kartu debit atau kredit' },
    credit:  { label: 'Kredit / Tempo', icon: '📋', desc: 'Pembayaran tertunda atau piutang' },
};

export default function PaymentMethodForm({ data, setData, errors, processing, onSubmit, submitLabel = 'Simpan', cancelHref, types }) {
    return (
        <form onSubmit={onSubmit} className="space-y-6">
            {/* Kode & Nama */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                    <label htmlFor="code" className="block text-sm font-medium text-slate-700">
                        Kode <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="code"
                        type="text"
                        value={data.code}
                        onChange={(e) => setData('code', e.target.value.toUpperCase())}
                        placeholder="cth. CASH, QRIS, CARD"
                        maxLength={50}
                        className={`mt-1.5 block w-full rounded-xl font-mono shadow-sm transition focus:ring-2 ${
                            errors.code
                                ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                                : 'border-slate-300 focus:border-primary-500 focus:ring-primary-200'
                        }`}
                    />
                    <p className="mt-1.5 text-xs text-slate-400">Huruf kapital, tanpa spasi. Digunakan sebagai ID unik.</p>
                    {errors.code && <p className="mt-1 text-sm text-red-600">{errors.code}</p>}
                </div>

                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700">
                        Nama <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="name"
                        type="text"
                        value={data.name}
                        autoFocus
                        onChange={(e) => setData('name', e.target.value)}
                        placeholder="cth. Tunai, QRIS GoPay"
                        className={`mt-1.5 block w-full rounded-xl shadow-sm transition focus:ring-2 ${
                            errors.name
                                ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                                : 'border-slate-300 focus:border-primary-500 focus:ring-primary-200'
                        }`}
                    />
                    {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>
            </div>

            {/* Tipe */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                    Tipe <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {types.map((t) => {
                        const meta = TYPE_LABELS[t] ?? { label: t, icon: '💳', desc: '' };
                        const selected = data.type === t;
                        return (
                            <button
                                key={t}
                                type="button"
                                onClick={() => setData('type', t)}
                                className={`relative flex flex-col items-start rounded-xl border-2 p-3 text-left transition-all ${
                                    selected
                                        ? 'border-primary-500 bg-primary-50 shadow-md shadow-primary-100'
                                        : 'border-slate-200 bg-white hover:border-primary-300 hover:bg-slate-50'
                                }`}
                            >
                                {selected && (
                                    <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 text-white">
                                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                        </svg>
                                    </span>
                                )}
                                <span className="text-xl mb-1">{meta.icon}</span>
                                <span className={`text-sm font-semibold ${selected ? 'text-primary-700' : 'text-slate-700'}`}>{meta.label}</span>
                                <span className="mt-0.5 text-xs text-slate-400 leading-snug">{meta.desc}</span>
                            </button>
                        );
                    })}
                </div>
                {errors.type && <p className="mt-2 text-sm text-red-600">{errors.type}</p>}
            </div>

            {/* Provider */}
            <div>
                <label htmlFor="provider" className="block text-sm font-medium text-slate-700">Provider</label>
                <input
                    id="provider"
                    type="text"
                    value={data.provider}
                    onChange={(e) => setData('provider', e.target.value)}
                    placeholder="cth. GoPay, OVO, BCA, Mandiri (opsional)"
                    className="mt-1.5 block w-full rounded-xl border-slate-300 shadow-sm transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                />
                <p className="mt-1.5 text-xs text-slate-400">Nama bank atau platform pembayaran (jika relevan).</p>
            </div>

            {/* Status aktif */}
            <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <button
                    type="button"
                    role="switch"
                    aria-checked={data.is_active}
                    onClick={() => setData('is_active', !data.is_active)}
                    className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                        data.is_active ? 'bg-primary-500' : 'bg-slate-300'
                    }`}
                >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition duration-200 ${data.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
                <div>
                    <p className="text-sm font-medium text-slate-700">
                        {data.is_active ? 'Aktif' : 'Nonaktif'}
                    </p>
                    <p className="text-xs text-slate-500">
                        {data.is_active
                            ? 'Metode ini tampil dan bisa dipilih kasir saat transaksi.'
                            : 'Metode ini disembunyikan dari kasir dan tidak bisa dipilih.'}
                    </p>
                </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <Link
                    href={cancelHref}
                    className="inline-flex justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                    Batal
                </Link>
                <button
                    type="submit"
                    disabled={processing}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary-500/30 transition hover:from-primary-600 hover:to-primary-700 disabled:opacity-60"
                >
                    {processing ? 'Menyimpan...' : submitLabel}
                </button>
            </div>
        </form>
    );
}
