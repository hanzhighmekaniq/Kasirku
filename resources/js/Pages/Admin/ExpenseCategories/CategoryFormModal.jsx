import { useEffect, useState } from 'react';
import { useForm, router } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';

export default function CategoryFormModal({ open, category = null, onClose }) {
    const isEdit = !!category;
    const { data, setData, processing, errors, reset } = useForm({
        name: category?.name || '',
        description: category?.description || '',
    });

    const [render, setRender] = useState(open);
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (open) {
            reset();
            setData({
                name: category?.name || '',
                description: category?.description || '',
            });
            setRender(true);
            const t = requestAnimationFrame(() => setShow(true));
            return () => cancelAnimationFrame(t);
        }
        setShow(false);
        const t = setTimeout(() => setRender(false), 200);
        return () => clearTimeout(t);
    }, [open, category]);

    useEffect(() => {
        const onKey = (e) => e.key === 'Escape' && onClose();
        if (open) document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    if (!render) return null;

    const submit = (e) => {
        e.preventDefault();
        if (isEdit) {
            router.put(
                route('admin.expense-categories.update', category.id),
                data,
                {
                    preserveScroll: true,
                    onSuccess: () => onClose(),
                },
            );
        } else {
            router.post(
                route('admin.expense-categories.store'),
                data,
                {
                    preserveScroll: true,
                    onSuccess: () => onClose(),
                },
            );
        }
    };

    const inputCls = 'block w-full rounded-xl border bg-white px-3 py-2.5 text-sm shadow-sm transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                onClick={() => !processing && onClose()}
                className={`absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-200 ${
                    show ? 'opacity-100' : 'opacity-0'
                }`}
            />
            <div
                role="dialog"
                aria-modal="true"
                className={`relative w-full max-w-lg transform rounded-2xl bg-white shadow-2xl transition-all duration-200 ${
                    show ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-3 scale-95 opacity-0'
                }`}
            >
                {/* Header */}
                <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-5 rounded-t-2xl">
                    <h3 className="text-base font-semibold text-slate-900">
                        {isEdit ? 'Edit Kategori' : 'Tambah Kategori'}
                    </h3>
                    <p className="mt-0.5 text-sm text-slate-500">
                        {isEdit ? 'Perbarui informasi kategori pengeluaran.' : 'Buat kategori pengeluaran baru.'}
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={submit} className="p-6 space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-slate-700">
                            Nama Kategori <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            className={`${inputCls} ${errors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : ''}`}
                            placeholder="Contoh: Sewa Tempat"
                            autoFocus
                        />
                        {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700">Deskripsi</label>
                        <textarea
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            rows={3}
                            className={`${inputCls} ${errors.description ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : ''}`}
                            placeholder="Deskripsi singkat tentang kategori ini..."
                        />
                        {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description}</p>}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={() => !processing && onClose()}
                            disabled={processing}
                            className="inline-flex justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={processing || !data.name.trim()}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary-500/30 transition hover:from-primary-600 hover:to-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-60"
                        >
                            {processing ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                                    {isEdit ? 'Menyimpan...' : 'Membuat...'}
                                </>
                            ) : (
                                isEdit ? 'Simpan Perubahan' : 'Buat Kategori'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
