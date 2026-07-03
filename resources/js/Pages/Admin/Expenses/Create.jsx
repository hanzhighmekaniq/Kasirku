import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';

const inputCls = 'block w-full rounded-xl border-slate-300 text-sm shadow-sm transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200';

export default function Create({ categories }) {
    const { data, setData, post, processing, errors } = useForm({
        expense_category_id: '',
        expense_date: new Date().toISOString().split('T')[0],
        amount: '',
        notes: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.expenses.store'));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <Link
                        href={route('admin.expenses.index')}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                        aria-label="Kembali"
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                    </Link>
                    <h2 className="text-lg font-semibold text-slate-800">Catat Pengeluaran</h2>
                </div>
            }
        >
            <Head title="Catat Pengeluaran" />

            <div className="mx-auto max-w-2xl">
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-5">
                        <h3 className="text-base font-semibold text-slate-900">Detail Pengeluaran</h3>
                        <p className="mt-0.5 text-sm text-slate-500">Isi informasi pengeluaran yang akan dicatat.</p>
                    </div>
                    <form onSubmit={submit} className="p-6">
                        <div className="space-y-5">
                            {/* Kategori */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">Kategori Pengeluaran</label>
                                <select
                                    value={data.expense_category_id}
                                    onChange={(e) => setData('expense_category_id', e.target.value)}
                                    className={inputCls}
                                >
                                    <option value="">— Pilih Kategori —</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                                {errors.expense_category_id && <p className="mt-1 text-xs text-red-500">{errors.expense_category_id}</p>}
                            </div>

                            {/* Tanggal */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Tanggal <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={data.expense_date}
                                    onChange={(e) => setData('expense_date', e.target.value)}
                                    className={inputCls}
                                />
                                {errors.expense_date && <p className="mt-1 text-xs text-red-500">{errors.expense_date}</p>}
                            </div>

                            {/* Jumlah */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Jumlah (Rp) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="100"
                                    value={data.amount}
                                    onChange={(e) => setData('amount', e.target.value)}
                                    className={inputCls}
                                    placeholder="0"
                                />
                                {errors.amount && <p className="mt-1 text-xs text-red-500">{errors.amount}</p>}
                            </div>

                            {/* Catatan */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">Catatan</label>
                                <textarea
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    rows={3}
                                    className={inputCls}
                                    placeholder="Catatan singkat tentang pengeluaran ini..."
                                />
                                {errors.notes && <p className="mt-1 text-xs text-red-500">{errors.notes}</p>}
                            </div>
                        </div>

                        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <Link
                                href={route('admin.expenses.index')}
                                className="inline-flex justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
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
                                        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        Menyimpan...
                                    </>
                                ) : (
                                    'Simpan Pengeluaran'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
