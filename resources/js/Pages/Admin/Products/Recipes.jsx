import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';

const fmt     = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n ?? 0);
const fmtNum  = (n, d = 4) => Number(n).toFixed(d).replace(/\.?0+$/, '');

const UNIT_OPTS = ['gram', 'ml', 'pcs', 'kg', 'liter', 'sdm', 'sdt', 'sachet', 'lembar', 'buah'];

function inputCls(err) {
    return `block w-full rounded-xl border text-sm shadow-sm transition focus:ring-2 ${
        err ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-200'
    }`;
}

/* ── Ingredient row ── */
function IngredientRow({ recipe, onDelete, deleting }) {
    const isLowStock = recipe.raw_material?.track_stock &&
        (recipe.raw_material?.stocks_sum_quantity ?? 0) <= 0;

    return (
        <div className={`flex items-center gap-3 rounded-xl border p-3.5 transition ${isLowStock ? 'border-red-200 bg-red-50/50' : 'border-slate-200 bg-white'}`}>
            {/* Avatar */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400/20 to-orange-400/20">
                <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15M14.25 3.104c.251.023.501.05.75.082M19.8 15l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.607L5 14.5m14.8.5l.43 2.146a2.25 2.25 0 01-2.19 2.754H6.01a2.25 2.25 0 01-2.19-2.754l.43-2.146M5 14.5l-.43.107" />
                </svg>
            </div>

            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-slate-800">{recipe.raw_material?.name ?? '—'}</p>
                    <span className="text-xs text-slate-400">{recipe.raw_material?.sku}</span>
                    {recipe.is_nullable && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">Opsional</span>
                    )}
                    {isLowStock && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600">Stok Habis</span>
                    )}
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-3 text-sm">
                    <span className="font-semibold text-indigo-700">{fmtNum(recipe.quantity)} {recipe.unit}</span>
                    <span className="text-slate-400">HPP: {fmt(Number(recipe.quantity) * Number(recipe.raw_material?.cost_price ?? 0))}</span>
                    {recipe.notes && <span className="italic text-slate-400">"{recipe.notes}"</span>}
                </div>
            </div>

            <button
                type="button"
                disabled={deleting === recipe.id}
                onClick={() => onDelete(recipe)}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                title="Hapus bahan"
            >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
            </button>
        </div>
    );
}

export default function Recipes({ product, recipes, rawMaterials }) {
    const { flash } = usePage().props;
    const [deleting, setDeleting] = useState(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        raw_material_id: '',
        quantity:        '',
        unit:            'gram',
        is_nullable:     false,
        notes:           '',
    });

    // Auto-fill unit from selected raw material's base_unit
    const handleMaterialChange = (id) => {
        setData((d) => {
            const mat = rawMaterials.find((m) => m.id === Number(id));
            return { ...d, raw_material_id: id, unit: mat?.base_unit ?? d.unit };
        });
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.products.recipes.store', product.id), {
            onSuccess: () => reset('raw_material_id', 'quantity', 'notes'),
        });
    };

    const handleDelete = (recipe) => {
        if (!confirm(`Hapus bahan "${recipe.raw_material?.name}" dari resep?`)) return;
        setDeleting(recipe.id);
        router.delete(route('admin.products.recipes.destroy', [product.id, recipe.id]), {
            preserveScroll: true,
            onFinish: () => setDeleting(null),
        });
    };

    // HPP total resep per 1 produk
    const totalHPP = recipes.reduce((sum, r) =>
        sum + Number(r.quantity) * Number(r.raw_material?.cost_price ?? 0), 0
    );
    const margin = product.sell_price > 0
        ? (((product.sell_price - totalHPP) / product.sell_price) * 100).toFixed(1)
        : 0;

    // Bahan yang belum ada di resep
    const usedIds = new Set(recipes.map((r) => r.raw_material_id));
    const availableMaterials = rawMaterials.filter((m) => !usedIds.has(m.id));

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <Link
                        href={route('admin.products.show', product.id)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100"
                        aria-label="Kembali"
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                    </Link>
                    <div className="min-w-0">
                        <h2 className="text-lg font-semibold text-slate-800 truncate">Resep — {product.name}</h2>
                        <p className="text-xs text-slate-400">SKU: {product.sku}</p>
                    </div>
                </div>
            }
        >
            <Head title={`Resep — ${product.name}`} />

            {/* Flash */}
            {flash?.success && (
                <div className="mb-5 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {flash.success}
                </div>
            )}

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">

                {/* ── Kiri: Daftar bahan ── */}
                <div className="space-y-4 lg:col-span-2">

                    {/* HPP summary */}
                    {recipes.length > 0 && (
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { label: 'HPP Resep', value: fmt(totalHPP), color: 'text-slate-800' },
                                { label: 'Harga Jual', value: fmt(product.sell_price), color: 'text-indigo-700' },
                                { label: 'Margin', value: `${margin}%`, color: Number(margin) >= 30 ? 'text-emerald-600' : Number(margin) >= 10 ? 'text-amber-600' : 'text-red-600' },
                            ].map((s) => (
                                <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm text-center">
                                    <p className="text-xs text-slate-500">{s.label}</p>
                                    <p className={`mt-0.5 text-lg font-bold ${s.color}`}>{s.value}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* List */}
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-4">
                            <h3 className="text-sm font-semibold text-slate-900">Daftar Bahan Baku</h3>
                            <p className="mt-0.5 text-xs text-slate-500">
                                {recipes.length === 0
                                    ? 'Belum ada bahan. Tambahkan bahan di panel kanan.'
                                    : `${recipes.length} bahan — setiap kali "${product.name}" terjual, stok bahan ini yang berkurang.`}
                            </p>
                        </div>

                        {recipes.length === 0 ? (
                            <div className="flex flex-col items-center py-14 text-center">
                                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50">
                                    <svg className="h-8 w-8 text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15M14.25 3.104c.251.023.501.05.75.082M19.8 15l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.607L5 14.5m14.8.5l.43 2.146a2.25 2.25 0 01-2.19 2.754H6.01a2.25 2.25 0 01-2.19-2.754l.43-2.146M5 14.5l-.43.107" />
                                    </svg>
                                </div>
                                <p className="mt-3 text-sm font-medium text-slate-600">Resep kosong</p>
                                <p className="mt-1 max-w-xs text-xs text-slate-400">
                                    Tambahkan bahan baku. Saat produk ini dijual di kasir, stok bahan akan berkurang otomatis.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2 p-4">
                                {recipes.map((r) => (
                                    <IngredientRow key={r.id} recipe={r} onDelete={handleDelete} deleting={deleting} />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Info box */}
                    <div className="flex items-start gap-3 rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3">
                        <svg className="mt-0.5 h-5 w-5 shrink-0 text-indigo-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                        </svg>
                        <p className="text-xs text-indigo-700">
                            <strong>Snapshot otomatis.</strong> Saat produk terjual, resep saat itu di-snapshot ke data transaksi.
                            Perubahan resep di masa depan tidak akan mempengaruhi riwayat transaksi lama.
                        </p>
                    </div>
                </div>

                {/* ── Kanan: Form tambah bahan ── */}
                <div>
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-4">
                            <h3 className="text-sm font-semibold text-slate-900">Tambah Bahan</h3>
                            <p className="mt-0.5 text-xs text-slate-500">Pilih bahan baku dan isi takarannya per 1 porsi.</p>
                        </div>
                        <form onSubmit={submit} className="space-y-4 p-5">

                            {/* Bahan baku */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Bahan Baku <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={data.raw_material_id}
                                    onChange={(e) => handleMaterialChange(e.target.value)}
                                    className={inputCls(!!errors.raw_material_id)}
                                >
                                    <option value="">— Pilih Bahan —</option>
                                    {availableMaterials.map((m) => (
                                        <option key={m.id} value={m.id}>
                                            {m.name} ({m.sku}) — {fmt(m.cost_price)}/{m.base_unit}
                                        </option>
                                    ))}
                                </select>
                                {availableMaterials.length === 0 && (
                                    <p className="mt-1.5 text-xs text-amber-600">
                                        Semua bahan sudah ditambahkan, atau belum ada produk bertipe <strong>Bahan Baku</strong>.
                                    </p>
                                )}
                                {errors.raw_material_id && <p className="mt-1 text-xs text-red-500">{errors.raw_material_id}</p>}
                            </div>

                            {/* Jumlah + satuan */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Jumlah <span className="text-red-500">*</span></label>
                                    <input
                                        type="number"
                                        step="0.001"
                                        min="0.001"
                                        value={data.quantity}
                                        onChange={(e) => setData('quantity', e.target.value)}
                                        placeholder="cth. 200"
                                        className={inputCls(!!errors.quantity)}
                                    />
                                    {errors.quantity && <p className="mt-1 text-xs text-red-500">{errors.quantity}</p>}
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Satuan <span className="text-red-500">*</span></label>
                                    <select
                                        value={data.unit}
                                        onChange={(e) => setData('unit', e.target.value)}
                                        className={inputCls(!!errors.unit)}
                                    >
                                        {UNIT_OPTS.map((u) => <option key={u} value={u}>{u}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Preview HPP bahan ini */}
                            {data.raw_material_id && data.quantity && (
                                <div className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700">
                                    HPP bahan ini: <strong>{fmt(Number(data.quantity) * Number(rawMaterials.find((m) => m.id === Number(data.raw_material_id))?.cost_price ?? 0))}</strong>
                                </div>
                            )}

                            {/* Opsional toggle */}
                            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-3 hover:bg-slate-50 transition">
                                <input
                                    type="checkbox"
                                    checked={data.is_nullable}
                                    onChange={(e) => setData('is_nullable', e.target.checked)}
                                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <div>
                                    <p className="text-sm font-medium text-slate-700">Bahan Opsional</p>
                                    <p className="text-xs text-slate-400">Bahan ini boleh tidak ada, transaksi tetap jalan</p>
                                </div>
                            </label>

                            {/* Catatan */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">Catatan</label>
                                <input
                                    type="text"
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    placeholder="cth. kopi robusta kualitas premium"
                                    className={inputCls(false)}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={processing || !data.raw_material_id || !data.quantity}
                                className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:from-indigo-600 hover:to-violet-700 disabled:opacity-50"
                            >
                                {processing ? 'Menyimpan...' : 'Tambah ke Resep'}
                            </button>
                        </form>
                    </div>

                    {/* Link ke halaman bahan baku */}
                    <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <p className="text-xs font-medium text-slate-600 mb-2">Belum ada bahan baku?</p>
                        <Link
                            href={route('admin.products.create')}
                            className="flex items-center gap-2 text-xs text-indigo-600 hover:text-indigo-700 transition"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            Buat produk baru dengan tipe "Bahan Baku"
                        </Link>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
