import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import ConfirmDeleteModal from './ConfirmDeleteModal';

const inputCls = 'block w-full rounded-xl border-slate-300 text-sm shadow-sm transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200';

const SELECTION_LABEL = {
    single: { label: 'Pilih 1', bg: 'bg-blue-100', text: 'text-blue-700' },
    multiple: { label: 'Pilih Banyak', bg: 'bg-violet-100', text: 'text-violet-700' },
};

/* ─── Modifier Form Modal ─── */
function ModifierForm({ group, modifier, onClose, onSaved }) {
    const isEdit = !!modifier;
    const { data, setData, post, put, processing, errors } = useForm({
        name: modifier?.name || '',
        price_addition: modifier?.price_addition ?? 0,
        is_active: modifier?.is_active ?? true,
        sort_order: modifier?.sort_order ?? 0,
    });

    const submit = (e) => {
        e.preventDefault();
        if (isEdit) {
            put(route('admin.modifier-groups.updateModifier', [group.id, modifier.id]), {
                onSuccess: () => onSaved?.(),
            });
        } else {
            post(route('admin.modifier-groups.storeModifier', group.id), {
                onSuccess: () => onSaved?.(),
            });
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl sm:p-7">
                <h3 className="text-base font-semibold text-slate-900">{isEdit ? 'Edit Modifier' : 'Tambah Modifier'}</h3>
                <p className="mt-0.5 text-sm text-slate-500">Grup: {group.name}</p>

                <form onSubmit={submit} className="mt-5 space-y-4">
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                            Nama Modifier <span className="text-red-500">*</span>
                        </label>
                        <input type="text" value={data.name} onChange={(e) => setData('name', e.target.value)} className={inputCls} placeholder="Contoh: Extra Keju, Pedas Level 3" />
                        {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                Harga Tambahan <span className="text-red-500">*</span>
                            </label>
                            <input type="number" step="0.01" min="0" value={data.price_addition} onChange={(e) => setData('price_addition', e.target.value)} className={inputCls} />
                            <p className="mt-0.5 text-xs text-slate-400">0 = Gratis</p>
                            {errors.price_addition && <p className="mt-1 text-xs text-red-500">{errors.price_addition}</p>}
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-700">Urutan</label>
                            <input type="number" min="0" value={data.sort_order} onChange={(e) => setData('sort_order', parseInt(e.target.value) || 0)} className={inputCls} />
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button type="button" onClick={() => setData('is_active', !data.is_active)} className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${data.is_active ? 'bg-primary-600' : 'bg-slate-200'}`}>
                            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${data.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                        <span className="text-sm font-medium text-slate-700">Aktif</span>
                    </div>

                    <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                        <button type="button" onClick={onClose} disabled={processing} className="inline-flex justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60">
                            Batal
                        </button>
                        <button type="submit" disabled={processing} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary-500/30 transition hover:from-primary-600 hover:to-primary-700 disabled:opacity-60">
                            {processing ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Tambah Modifier'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ─── Attach Product Modal ─── */
function AttachProductModal({ group, products, onClose }) {
    const { data, setData, post, processing, errors } = useForm({ product_id: '' });
    const assignedIds = (group.products || []).map((p) => p.id);
    const available = products.filter((p) => !assignedIds.includes(p.id));

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.modifier-groups.attachProduct', group.id), {
            onSuccess: () => onClose(),
        });
    };

    if (available.length === 0) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
                <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl text-center">
                    <p className="text-sm text-slate-500">Semua produk aktif sudah ditambahkan ke grup ini.</p>
                    <button onClick={onClose} className="mt-4 inline-flex justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                        Tutup
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                <h3 className="text-base font-semibold text-slate-900">Tambah Produk</h3>
                <p className="mt-0.5 text-sm text-slate-500">Hubungkan produk ke grup modifier "{group.name}".</p>
                <form onSubmit={submit} className="mt-5 space-y-4">
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">Pilih Produk <span className="text-red-500">*</span></label>
                        <select value={data.product_id} onChange={(e) => setData('product_id', e.target.value)} className={inputCls}>
                            <option value="">-- Pilih Produk --</option>
                            {available.map((p) => (
                                <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                            ))}
                        </select>
                        {errors.product_id && <p className="mt-1 text-xs text-red-500">{errors.product_id}</p>}
                    </div>
                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <button type="button" onClick={onClose} disabled={processing} className="inline-flex justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60">
                            Batal
                        </button>
                        <button type="submit" disabled={processing || !data.product_id} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary-500/30 transition hover:from-primary-600 hover:to-primary-700 disabled:opacity-60">
                            {processing ? 'Menambahkan...' : 'Tambahkan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ─── Main Show Page ─── */
export default function Show({ group, allProducts }) {
    const { flash } = usePage().props;
    const [showModForm, setShowModForm] = useState(false);
    const [editModifier, setEditModifier] = useState(null);
    const [showAttach, setShowAttach] = useState(false);
    const [target, setTarget] = useState(null);
    const [targetType, setTargetType] = useState(null); // 'modifier' | 'product'
    const [deleting, setDeleting] = useState(false);

    const modifiers = group.modifiers || [];
    const products = group.products || [];
    const sel = SELECTION_LABEL[group.selection_type] || SELECTION_LABEL.single;

    const confirmDelete = () => {
        if (!target) return;
        setDeleting(true);
        if (targetType === 'modifier') {
            router.delete(route('admin.modifier-groups.destroyModifier', [group.id, target.id]), {
                preserveScroll: true,
                onFinish: () => { setDeleting(false); setTarget(null); setTargetType(null); },
            });
        } else if (targetType === 'product') {
            router.delete(route('admin.modifier-groups.detachProduct', [group.id, target.id]), {
                preserveScroll: true,
                onFinish: () => { setDeleting(false); setTarget(null); setTargetType(null); },
            });
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex w-full items-center justify-between gap-3">
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
                        <div>
                            <h2 className="text-lg font-semibold text-slate-800">{group.name}</h2>
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${sel.bg} ${sel.text}`}>{sel.label}</span>
                                {group.is_required && <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">Wajib</span>}
                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${group.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                    {group.is_active ? 'Aktif' : 'Nonaktif'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <Link
                        href={route('admin.modifier-groups.edit', group.id)}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                        </svg>
                        Edit
                    </Link>
                </div>
            }
        >
            <Head title={`${group.name} - Grup Modifier`} />

            {flash?.success && (
                <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{flash.success}</div>
            )}
            {flash?.error && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{flash.error}</div>
            )}

            <div className="grid gap-6 lg:grid-cols-3">
                {/* ─── Modifiers Panel ─── */}
                <div className="lg:col-span-2">
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-6 py-4">
                            <div>
                                <h3 className="text-sm font-semibold text-slate-800">Modifier Items</h3>
                                <p className="text-xs text-slate-500">{modifiers.length} modifier dalam grup ini</p>
                            </div>
                            <button
                                onClick={() => { setEditModifier(null); setShowModForm(true); }}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-primary-500/20 transition hover:from-primary-600 hover:to-primary-700"
                            >
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                                Tambah
                            </button>
                        </div>

                        {modifiers.length === 0 ? (
                            <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                                    <svg className="h-7 w-7 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33" />
                                    </svg>
                                </div>
                                <p className="mt-3 text-sm font-medium text-slate-600">Belum ada modifier</p>
                                <p className="mt-0.5 text-xs text-slate-400">Tambahkan item modifier (contoh: Extra Keju, Pedas Level 3)</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {modifiers.map((mod) => (
                                    <div key={mod.id} className="flex items-center justify-between px-6 py-3.5 transition hover:bg-slate-50/70">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-medium text-slate-800">{mod.name}</p>
                                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${mod.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                                    {mod.is_active ? 'Aktif' : 'Nonaktif'}
                                                </span>
                                            </div>
                                            <p className="mt-0.5 text-xs text-slate-500">
                                                {Number(mod.price_addition || 0) > 0
                                                    ? `+Rp ${Number(mod.price_addition).toLocaleString('id-ID')}`
                                                    : 'Gratis'}
                                                {mod.sort_order > 0 && <span className="ml-2 text-slate-400">Urutan: {mod.sort_order}</span>}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => { setEditModifier(mod); setShowModForm(true); }} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-primary-50 hover:text-primary-600" title="Edit">
                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                                                </svg>
                                            </button>
                                            <button onClick={() => { setTarget(mod); setTargetType('modifier'); }} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-red-50 hover:text-red-600" title="Hapus">
                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ─── Products Panel ─── */}
                <div>
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-5 py-4">
                            <div>
                                <h3 className="text-sm font-semibold text-slate-800">Produk Terhubung</h3>
                                <p className="text-xs text-slate-500">{products.length} produk</p>
                            </div>
                            <button
                                onClick={() => setShowAttach(true)}
                                className="inline-flex items-center gap-1 rounded-xl bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700 transition hover:bg-primary-100"
                            >
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                                Tambah
                            </button>
                        </div>

                        {products.length === 0 ? (
                            <div className="px-5 py-8 text-center">
                                <p className="text-xs text-slate-400">Belum ada produk yang terhubung.</p>
                                <p className="mt-0.5 text-xs text-slate-400">Klik "Tambah" untuk menghubungkan produk.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {products.map((p) => (
                                    <div key={p.id} className="flex items-center justify-between px-5 py-3 transition hover:bg-slate-50/70">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-slate-800 truncate">{p.name}</p>
                                            <p className="text-xs text-slate-400">SKU: {p.sku}</p>
                                        </div>
                                        <button onClick={() => { setTarget(p); setTargetType('product'); }} className="ml-2 inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-500" title="Lepas">
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modals */}
            {showModForm && (
                <ModifierForm
                    group={group}
                    modifier={editModifier}
                    onClose={() => { setShowModForm(false); setEditModifier(null); }}
                    onSaved={() => { setShowModForm(false); setEditModifier(null); }}
                />
            )}

            {showAttach && (
                <AttachProductModal
                    group={group}
                    products={allProducts}
                    onClose={() => setShowAttach(false)}
                />
            )}

            <ConfirmDeleteModal
                open={!!target}
                title={targetType === 'modifier' ? 'Hapus modifier?' : 'Lepas produk?'}
                description={
                    targetType === 'modifier'
                        ? `Modifier "${target?.name}" akan dihapus permanen dari grup ini.`
                        : `Produk "${target?.name}" akan dilepas dari grup modifier ini.`
                }
                processing={deleting}
                onConfirm={confirmDelete}
                onClose={() => { if (!deleting) { setTarget(null); setTargetType(null); } }}
            />
        </AuthenticatedLayout>
    );
}
