import InputLabel from '@/Components/InputLabel';
import Button from '@/Components/ui/Button';
import { Link } from '@inertiajs/react';

const inputCls = 'block w-full rounded-xl border-border text-sm shadow-sm transition focus:border-ring focus:ring-2 focus:ring-ring/20';

export default function CafeTableForm({ data, setData, errors, processing, onSubmit, submitLabel, cancelHref, branches }) {
    return (
        <form onSubmit={onSubmit} className="space-y-5">
            {/* Branch */}
            <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Cabang <span className="text-destructive">*</span></label>
                <select
                    value={data.branch_id}
                    onChange={(e) => setData('branch_id', e.target.value)}
                    className={inputCls}
                >
                    <option value="">Pilih Cabang</option>
                    {branches.map((b) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                </select>
                {errors.branch_id && <p className="mt-1 text-xs text-destructive">{errors.branch_id}</p>}
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {/* Table Number */}
                <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">Nomor Meja <span className="text-destructive">*</span></label>
                    <input
                        type="text"
                        value={data.table_number}
                        onChange={(e) => setData('table_number', e.target.value)}
                        className={inputCls}
                        placeholder="Contoh: T-01"
                    />
                    {errors.table_number && <p className="mt-1 text-xs text-destructive">{errors.table_number}</p>}
                </div>

                {/* Capacity */}
                <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">Kapasitas <span className="text-destructive">*</span></label>
                    <input
                        type="number"
                        min="1"
                        value={data.capacity}
                        onChange={(e) => setData('capacity', e.target.value)}
                        className={inputCls}
                        placeholder="4"
                    />
                    {errors.capacity && <p className="mt-1 text-xs text-destructive">{errors.capacity}</p>}
                </div>
            </div>

            {/* Status */}
            <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Status</label>
                <select
                    value={data.status}
                    onChange={(e) => setData('status', e.target.value)}
                    className={inputCls}
                >
                    <option value="available">Tersedia</option>
                    <option value="occupied">Terisi</option>
                    <option value="reserved">Direservasi</option>
                </select>
                {errors.status && <p className="mt-1 text-xs text-destructive">{errors.status}</p>}
            </div>

            {/* Active */}
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={() => setData('is_active', !data.is_active)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                        data.is_active ? 'bg-primary-600' : 'bg-slate-300'
                    }`}
                >
                    <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-card shadow ring-0 transition duration-200 ease-in-out ${
                            data.is_active ? 'translate-x-5' : 'translate-x-0'
                        }`}
                    />
                </button>
                <InputLabel value="Aktif" className="!mb-0 cursor-pointer" onClick={() => setData('is_active', !data.is_active)} />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 border-t border-border pt-5">
                <Link
                    href={cancelHref}
                    className="inline-flex items-center justify-center rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted"
                >
                    Batal
                </Link>
                <Button type="submit" loading={processing}>
                    {processing ? 'Menyimpan...' : submitLabel}
                </Button>
            </div>
        </form>
    );
}
