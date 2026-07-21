import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Button from '@/Components/ui/Button';
import { Head, Link, useForm } from '@inertiajs/react';

const inputCls = 'block w-full rounded-xl border-border text-sm shadow-sm transition focus:border-ring focus:ring-2 focus:ring-ring/20';

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
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
                        aria-label="Kembali"
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                    </Link>
                    <h2 className="text-lg font-semibold text-foreground">Tambah Grup Modifier</h2>
                </div>
            }
        >
            <Head title="Tambah Grup Modifier" />

            <div className="mx-auto max-w-2xl">
                <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                    <div className="border-b border-border bg-muted/50 px-6 py-5">
                        <h3 className="text-base font-semibold text-foreground">Detail Grup</h3>
                        <p className="mt-0.5 text-sm text-muted-foreground">Buat grup modifier baru (contoh: Topping, Level Pedas, Ukuran Tambahan).</p>
                    </div>
                    <form onSubmit={submit} className="p-6">
                        <div className="space-y-5">
                            {/* Nama */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-foreground">
                                    Nama Grup <span className="text-destructive">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className={inputCls}
                                    placeholder="Contoh: Topping, Level Pedas"
                                />
                                {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name}</p>}
                            </div>

                            {/* Deskripsi */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-foreground">Deskripsi</label>
                                <textarea
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows={2}
                                    className={inputCls}
                                    placeholder="Deskripsi singkat (opsional)"
                                />
                                {errors.description && <p className="mt-1 text-xs text-destructive">{errors.description}</p>}
                            </div>

                            {/* Tipe Pilihan */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-foreground">
                                    Tipe Pilihan <span className="text-destructive">*</span>
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
                                                    ? 'border-primary-500 bg-primary-50'
                                                    : 'border-border hover:border-border'
                                            }`}
                                        >
                                            <p className={`text-sm font-medium ${data.selection_type === opt.value ? 'text-primary-700' : 'text-foreground'}`}>{opt.label}</p>
                                            <p className="mt-0.5 text-xs text-muted-foreground">{opt.desc}</p>
                                        </button>
                                    ))}
                                </div>
                                {errors.selection_type && <p className="mt-1 text-xs text-destructive">{errors.selection_type}</p>}
                            </div>

                            {/* Max selection (only for multiple) */}
                            {data.selection_type === 'multiple' && (
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-foreground">Maksimum Pilihan</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={data.max_selection}
                                        onChange={(e) => setData('max_selection', e.target.value)}
                                        className={inputCls}
                                        placeholder="Kosongkan jika tidak dibatasi"
                                    />
                                    {errors.max_selection && <p className="mt-1 text-xs text-destructive">{errors.max_selection}</p>}
                                </div>
                            )}

                            {/* Toggle row */}
                            <div className="flex flex-wrap items-center gap-6">
                                <div className="flex items-center gap-3">
                                    <button type="button" onClick={() => setData('is_required', !data.is_required)} className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${data.is_required ? 'bg-amber-500' : 'bg-slate-200'}`}>
                                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-card shadow ring-0 transition duration-200 ease-in-out ${data.is_required ? 'translate-x-5' : 'translate-x-0'}`} />
                                    </button>
                                    <span className="text-sm font-medium text-foreground">Wajib Dipilih</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button type="button" onClick={() => setData('is_active', !data.is_active)} className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${data.is_active ? 'bg-primary-600' : 'bg-slate-200'}`}>
                                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-card shadow ring-0 transition duration-200 ease-in-out ${data.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
                                    </button>
                                    <span className="text-sm font-medium text-foreground">Aktif</span>
                                </div>
                            </div>

                            {/* Sort order */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-foreground">Urutan Tampil</label>
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
                                className="inline-flex justify-center rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted"
                            >
                                Batal
                            </Link>
                            <Button type="submit" loading={processing}>
                                {processing ? 'Menyimpan...' : 'Simpan Grup'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
