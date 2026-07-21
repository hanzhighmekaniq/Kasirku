import { useEffect, useState } from 'react';
import { useForm, router } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';
import Button from "@/Components/ui/Button";

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

    const inputCls = 'block w-full rounded-xl border bg-card px-3 py-2.5 text-sm shadow-sm transition focus:border-ring focus:ring-2 focus:ring-ring/20';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                onClick={() => !processing && onClose()}
                className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200 ${
                    show ? 'opacity-100' : 'opacity-0'
                }`}
            />
            <div
                role="dialog"
                aria-modal="true"
                className={`relative w-full max-w-lg transform rounded-2xl bg-card shadow-2xl transition-all duration-200 ${
                    show ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-3 scale-95 opacity-0'
                }`}
            >
                {/* Header */}
                <div className="border-b border-border bg-muted/50 px-6 py-5 rounded-t-2xl">
                    <h3 className="text-base font-semibold text-foreground">
                        {isEdit ? 'Edit Kategori' : 'Tambah Kategori'}
                    </h3>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                        {isEdit ? 'Perbarui informasi kategori pengeluaran.' : 'Buat kategori pengeluaran baru.'}
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={submit} className="p-6 space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-foreground">
                            Nama Kategori <span className="text-destructive">*</span>
                        </label>
                        <input
                            type="text"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            className={`${inputCls} ${errors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : ''}`}
                            placeholder="Contoh: Sewa Tempat"
                            autoFocus
                        />
                        {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground">Deskripsi</label>
                        <textarea
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            rows={3}
                            className={`${inputCls} ${errors.description ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : ''}`}
                            placeholder="Deskripsi singkat tentang kategori ini..."
                        />
                        {errors.description && <p className="mt-1 text-xs text-destructive">{errors.description}</p>}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={() => !processing && onClose()}
                            disabled={processing}
                            className="inline-flex justify-center rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted disabled:opacity-60"
                        >
                            Batal
                        </button>
                        <Button
                            type="submit"
                            loading={processing}
                            disabled={!data.name.trim()}
                        >
                            {isEdit ? 'Simpan Perubahan' : 'Buat Kategori'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
