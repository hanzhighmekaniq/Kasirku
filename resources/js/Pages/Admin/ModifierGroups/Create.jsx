import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';

const inputCls = 'block w-full rounded-xl border-slate-300 text-sm shadow-sm transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200';

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        description: '',
        is_required: false,
        selection_type: 'single',
        max_selection: '',
        sort_order: 0,
        is_active: true,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.modifier-groups.store'));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <Link
                        href={route('admin.modifier-groups.index')}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                        aria-label="Kembali"
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                    </Link>
                    <h2 className="text-lg font-semibold text-slate-800">Tambah Grup Modifier</h2>
                </div>
            }
        >
            <Head title="Tambah Grup Modifier" />

            <div className="mx-auto max-w-2xl">
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-5">
                        <h3 className="text-base font-semibold text-slate-900">Detail Grup</h3>
                        <p className="mt-0.5 text-sm text-slate-500">Buat grup modifier baru (contoh: Topping, Level Pedas, Ukuran Tambahan).</p>
                    </div>
                    <form onSubmit={submit} className="p-6">
                        <div className="space-y-5">
                            {/* Nama */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Nama Grup <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className={inputCls}
                                    placeholder="Contoh: Topping, Level Pedas"
                                />
                                {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                            </div>

                            {/* Deskripsi */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">Deskripsi</label>
                                <textarea
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows={2}
                                    className={inputCls}
                                    placeholder="Deskripsi singkat (opsional)"
                                />
                                {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description}</p>}
                            </div>

                            {/* Tipe Pilihan */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Tipe Pilihan <span className="text-red-500">*</span>
                                </label>
                                <div className="flex gap-3">
                                    {[
                                        { value: 'single', label: 'Pilih 1 (Radio)', desc: 'Pelanggan hanya bisa memilih 1 opsi' },
                                        { value: 'multiple', label: 'Pilih Banyak (Checkbox)', desc: 'Pelanggan bisa memilih beberapa opsi' },
                                    ].map((opt) => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => setData('selection_type', opt.value)}
                                            className={`flex-1 rounded-xl border-2 p-3 text-left transition ${
                                                data.selection_type === opt.value
                                                    ? 'border-indigo-500 bg-indigo-50'
                                                    : 'border-slate-200 hover:border-slate-300'
                                            }`}
                                        >
                                            <p className={`text-sm font-medium ${data.selection_type === opt.value ? 'text-indigo-700' : 'text-slate-700'}`}>{opt.label}</p>
                                            <p className="mt-0.5 text-xs text-slate-500">{opt.desc}</p>
                                        </button>
                                    ))}
                                </div>
                                {errors.selection_type && <p className="mt-1 text-xs text-red-500">{errors.selection_type}</p>}
                            </div>

                            {/* Max selection (only for multiple) */}
                            {data.selection_type === 'multiple' && (
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Maksimum Pilihan</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={data.max_selection}
                                        onChange={(e) => setData('max_selection', e.target.value)}
                                        className={inputCls}
                                        placeholder="Kosongkan jika tidak dibatasi"
                                    />
                                    {errors.max_selection && <p className="mt-1 text-xs text-red-500">{errors.max_selection}</p>}
                                </div>
                            )}

                            {/* Toggle row */}
                            <div className="flex flex-wrap items-center gap-6">
                                <div className="flex items-center gap-3">
                                    <button type="button" onClick={() => setData('is_required', !data.is_required)} className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${data.is_required ? 'bg-amber-500' : 'bg-slate-200'}`}>
                                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${data.is_required ? 'translate-x-5' : 'translate-x-0'}`} />
                                    </button>
                                    <span className="text-sm font-medium text-slate-700">Wajib Dipilih</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button type="button" onClick={() => setData('is_active', !data.is_active)} className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${data.is_active ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${data.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
                                    </button>
                                    <span className="text-sm font-medium text-slate-700">Aktif</span>
                                </div>
                            </div>

                            {/* Sort order */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">Urutan Tampil</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={data.sort_order}
                                    onChange={(e) => setData('sort_order', parseInt(e.target.value) || 0)}
                                    className={inputCls}
                                />
                            </div>
                        </div>

                        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <Link
                                href={route('admin.modifier-groups.index')}
                                className="inline-flex justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                            >
                                Batal
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:from-indigo-600 hover:to-violet-700 disabled:opacity-60"
                            >
                                {processing ? 'Menyimpan...' : 'Simpan Grup'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
