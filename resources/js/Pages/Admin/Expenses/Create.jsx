import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Plus, Loader2, AlertCircle, Trash2 } from 'lucide-react';
import { useState } from 'react';
import SectionCard from '@/Components/ui/SectionCard';
import Select from '@/Components/ui/Select';
import CurrencyInput from '@/Components/ui/CurrencyInput';
import Field from '@/Components/ui/Field';
import ConfirmDeleteModal from './ConfirmDeleteModal';

export default function Create({ categories: initialCategories }) {
    const { data, setData, post, processing, errors } = useForm({
        expense_category_id: '',
        expense_date: new Date().toISOString().split('T')[0],
        amount: '',
        notes: '',
    });

    const [categories, setCategories] = useState(initialCategories);
    const [showQuickCat, setShowQuickCat] = useState(false);
    const [quickCatName, setQuickCatName] = useState('');
    const [quickCatSaving, setQuickCatSaving] = useState(false);
    const [quickCatError, setQuickCatError] = useState('');

    // Delete state
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState('');

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.expenses.store'));
    };

    const getCookie = (key) => {
        const match = document.cookie.match(new RegExp('(^| )' + key + '=([^;]+)'));
        return match ? decodeURIComponent(match[2]) : '';
    };

    const quickCreateCategory = async () => {
        const name = quickCatName.trim();
        if (!name) return;
        setQuickCatSaving(true);
        setQuickCatError('');
        const csrf = getCookie('XSRF-TOKEN');

        try {
            const res = await fetch(route('admin.expense-categories.store'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-XSRF-TOKEN': csrf,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({ name }),
            });

            const result = await res.json();

            if (res.ok) {
                setCategories((prev) => [...prev, { id: result.id, name: result.name }]);
                setData('expense_category_id', String(result.id));
 setQuickCatName('');
                setShowQuickCat(false);
            } else {
                setQuickCatError(result.message || result.errors?.name?.[0] || 'Gagal menyimpan kategori.');
            }
        } catch (e) {
            setQuickCatError('Gagal terhubung. Coba lagi.');
        }
        setQuickCatSaving(false);
    };

    const confirmDeleteCategory = async () => {
        if (!deleteTarget) return;
        setDeleteLoading(true);
        setDeleteError('');
        const csrf = getCookie('XSRF-TOKEN');

        try {
            const res = await fetch(
                route('admin.expense-categories.destroy', { expense_category: deleteTarget.id }),
                {
                    method: 'DELETE',
                    headers: {
                        'Accept': 'application/json',
                        'X-XSRF-TOKEN': csrf,
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                },
            );

            if (res.ok) {
                setCategories((prev) => prev.filter((c) => c.id !== deleteTarget.id));
                if (data.expense_category_id === String(deleteTarget.id)) {
                    setData('expense_category_id', '');
                }
                setDeleteTarget(null);
            } else {
                const result = await res.json().catch(() => ({}));
                setDeleteError(result.message || 'Gagal menghapus kategori.');
            }
        } catch (e) {
            setDeleteError('Gagal terhubung. Coba lagi.');
        }
        setDeleteLoading(false);
    };

    const inputCls = 'block w-full rounded-xl border bg-white px-3 py-2.5 text-sm shadow-sm transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200';

    const categoryOptions = categories.map((c) => ({ value: c.id, label: c.name }));
    const noCategories = categories.length === 0;

    const selectedCategoryName = data.expense_category_id
        ? categories.find((c) => String(c.id) === String(data.expense_category_id))?.name || ''
        : '';

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <Link
                        href={route('admin.expenses.index')}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                        aria-label="Kembali"
                    >
                        <ArrowLeft className="h-5 w-5" strokeWidth={1.8} />
                    </Link>
                    <h2 className="text-lg font-semibold text-slate-800">Catat Pengeluaran</h2>
                </div>
            }
        >
            <Head title="Catat Pengeluaran" />

            <div className="mx-auto max-w-2xl">
                <SectionCard title="Detail Pengeluaran" subtitle="Isi informasi pengeluaran yang akan dicatat.">
                    <form onSubmit={submit} className="space-y-5">
                        {/* Kategori */}
                        <div>
                            <Field label="Kategori Pengeluaran" required error={errors.expense_category_id}>
                                {noCategories && !showQuickCat ? (
                                    <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 py-6 text-center">
                                        <p className="text-sm text-slate-500">Belum ada kategori pengeluaran</p>
                                        <button
                                            type="button"
                                            onClick={() => setShowQuickCat(true)}
                                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-primary-500/30 transition hover:from-primary-600 hover:to-primary-700"
                                        >
                                            <Plus className="h-4 w-4" strokeWidth={2} />
                                            Tambah Kategori
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {/* Dropdown + Delete */}
                                        {!noCategories && (
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1">
                                                    <Select
                                                        options={categoryOptions}
                                                        value={data.expense_category_id}
                                                        onChange={(v) => setData('expense_category_id', String(v))}
                                                        placeholder="Pilih kategori..."
                                                    />
                                                </div>
                                                {data.expense_category_id && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const cat = categories.find(
                                                                (c) => String(c.id) === String(data.expense_category_id),
                                                            );
                                                            if (cat) setDeleteTarget(cat);
                                                        }}
                                                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                                                        title={`Hapus kategori "${selectedCategoryName}"`}
                                                    >
                                                        <Trash2 className="h-4 w-4" strokeWidth={1.7} />
                                                    </button>
                                                )}
                                            </div>
                                        )}

                                        {/* Quick-create */}
                                        {!showQuickCat ? (
                                            <button
                                                type="button"
                                                onClick={() => setShowQuickCat(true)}
                                                className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-600 transition hover:text-primary-700"
                                            >
                                                <Plus className="h-3.5 w-3.5" strokeWidth={2} />
                                                Tambah Kategori Baru
                                            </button>
                                        ) : (
                                            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2">
                                                <input
                                                    type="text"
                                                    value={quickCatName}
                                                    onChange={(e) => setQuickCatName(e.target.value)}
                                                    placeholder="Nama kategori..."
                                                    autoFocus
                                                    className="block flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            quickCreateCategory();
                                                        }
                                                        if (e.key === 'Escape') {
                                                            setShowQuickCat(false);
                                                            setQuickCatName('');
                                                            setQuickCatError('');
                                                        }
                                                    }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={quickCreateCategory}
                                                    disabled={quickCatSaving || !quickCatName.trim()}
                                                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-primary-700 disabled:opacity-50"
                                                >
                                                    {quickCatSaving ? (
                                                        <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
                                                    ) : (
                                                        'Simpan'
                                                    )}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setShowQuickCat(false);
                                                        setQuickCatName('');
                                                        setQuickCatError('');
                                                    }}
                                                    className="rounded-lg px-2 py-2 text-xs text-slate-500 transition hover:bg-slate-200"
                                                >
                                                    Batal
                                                </button>
                                            </div>
                                        )}
                                        {quickCatError && (
                                            <p className="flex items-center gap-1.5 text-xs text-red-600">
                                                <AlertCircle className="h-3.5 w-3.5" />
                                                {quickCatError}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </Field>
                        </div>

                        <Field label="Tanggal" required error={errors.expense_date}>
                            <input
                                type="date"
                                value={data.expense_date}
                                onChange={(e) => setData('expense_date', e.target.value)}
                                className={inputCls}
                            />
                        </Field>

                        <Field label="Jumlah (Rp)" required error={errors.amount}>
                            <CurrencyInput
                                value={data.amount}
                                onChange={(v) => setData('amount', v)}
                                placeholder="0"
                                error={!!errors.amount}
                            />
                        </Field>

                        <Field label="Catatan" error={errors.notes}>
                            <textarea
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                                rows={3}
                                className={inputCls}
                                placeholder="Catatan singkat tentang pengeluaran ini..."
                            />
                        </Field>

                        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                            <Link
                                href={route('admin.expenses.index')}
                                className="inline-flex justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                            >
                                Batal
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary-500/30 transition hover:from-primary-600 hover:to-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-60"
                            >
                                {processing ? 'Menyimpan...' : 'Simpan Pengeluaran'}
                            </button>
                        </div>
                    </form>
                </SectionCard>
            </div>

            {/* Delete Confirmation Modal */}
            <ConfirmDeleteModal
                open={!!deleteTarget}
                title={`Hapus kategori "${deleteTarget?.name}"?`}
                description="Data pengeluaran yang sudah tercatat tidak akan terpengaruh."
                confirmLabel="Hapus Kategori"
                processing={deleteLoading}
                onConfirm={confirmDeleteCategory}
                error={deleteError}
                onClose={() => {
                    if (!deleteLoading) {
                        setDeleteTarget(null);
                        setDeleteError('');
                    }
                }}
            />
        </AuthenticatedLayout>
    );
}
