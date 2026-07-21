import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Calendar, Clock, Hash, Layers, Package, Pencil, Percent, ShieldCheck, ShoppingCart, Tag, Users } from 'lucide-react';

const TYPE_LABELS = {
    percentage: 'Persen',
    fixed_amount: 'Nominal',
    buy_x_get_y: 'Beli X Gratis Y',
    bundle: 'Bundle',
    tiered: 'Harga Tiered',
    member_price: 'Harga Member',
    bogo: 'Beli X Gratis Produk',
};

const TYPE_ICONS = {
    percentage: Percent,
    fixed_amount: Tag,
    buy_x_get_y: Package,
    bundle: Layers,
    tiered: Layers,
    member_price: Users,
    bogo: Package,
};

const SCOPE_META = {
    item: { label: 'Per Item', icon: Package },
    cart: { label: 'Keranjang', icon: ShoppingCart },
};

function StatusBadge({ promo }) {
    const now = new Date();
    const start = promo.start_date ? new Date(promo.start_date) : null;
    const end = promo.end_date ? new Date(promo.end_date) : null;

    if (!promo.is_active) {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-muted text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                Nonaktif
            </span>
        );
    }
    if (start && start > now) {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-sky-50 text-sky-700">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse" />
                Terjadwal
            </span>
        );
    }
    if (end && end < now) {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-destructive/10 text-destructive">
                <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                Berakhir
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-success/10 text-success">
            <span className="h-1.5 w-1.5 rounded-full bg-success/100 animate-pulse" />
            Aktif
        </span>
    );
}

function formatDiscount(promo) {
    if (promo.type === 'percentage') return `${Number(promo.discount_value)}%`;
    if (promo.type === 'fixed_amount') return `Rp ${Number(promo.discount_value).toLocaleString('id-ID')}`;
    if (promo.type === 'tiered' || promo.type === 'member_price') return `Rp ${Number(promo.tier_price || 0).toLocaleString('id-ID')}`;
    if (promo.type === 'bogo' || promo.type === 'buy_x_get_y') return `Beli ${promo.discount_value} gratis 1`;
    return promo.discount_value;
}

const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n ?? 0);

function formatDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function InfoRow({ icon: Icon, label, value }) {
    return (
        <div className="flex items-center gap-3 py-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Icon size={15} />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm font-medium text-foreground">{value}</p>
            </div>
        </div>
    );
}

export default function Show({ promotion }) {
    const promo = promotion;
    const TypeIcon = TYPE_ICONS[promo.type] || Tag;
    const ScopeIcon = SCOPE_META[promo.scope]?.icon || ShoppingCart;

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <Link
                            href={route('admin.promotions.index')}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
                            aria-label="Kembali"
                        >
                            <ArrowLeft className="h-5 w-5" strokeWidth={1.8} />
                        </Link>
                        <div>
                            <h2 className="text-lg font-semibold text-foreground">{promo.name}</h2>
                            <p className="text-xs text-muted-foreground">Kode: {promo.code}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <StatusBadge promo={promo} />
                        <Link
                            href={route('admin.promotions.edit', promo.id)}
                            className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted"
                        >
                            <Pencil size={14} />
                            Edit
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title={`Promo: ${promo.name}`} />

            <div className="grid gap-5 lg:grid-cols-3">
                {/* ── Kolom kiri: Detail ── */}
                <div className="space-y-5 lg:col-span-2">
                    {/* Info Utama */}
                    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                        <h3 className="mb-4 text-sm font-semibold text-foreground">Informasi Promo</h3>
                        <div className="grid gap-1 sm:grid-cols-2">
                            <InfoRow icon={TypeIcon} label="Tipe" value={TYPE_LABELS[promo.type] || promo.type} />
                            <InfoRow icon={ScopeIcon} label="Scope" value={SCOPE_META[promo.scope]?.label || promo.scope} />
                            <InfoRow icon={Tag} label="Diskon" value={formatDiscount(promo)} />
                            <InfoRow icon={Hash} label="Kode" value={promo.code} />
                            {promo.min_purchase_amount > 0 && (
                                <InfoRow icon={ShoppingCart} label="Min. Pembelian" value={fmt(promo.min_purchase_amount)} />
                            )}
                            {promo.max_discount_amount > 0 && (
                                <InfoRow icon={ShieldCheck} label="Maks. Diskon" value={fmt(promo.max_discount_amount)} />
                            )}
                            {promo.min_quantity > 0 && (
                                <InfoRow icon={Package} label="Min. Qty" value={`${promo.min_quantity} item`} />
                            )}
                            {promo.tier_price > 0 && (
                                <InfoRow icon={Layers} label="Harga Tier" value={fmt(promo.tier_price)} />
                            )}
                            {promo.customer_tier && (
                                <InfoRow icon={Users} label="Tier Pelanggan" value={promo.customer_tier} />
                            )}
                        </div>
                    </div>

                    {/* Jadwal */}
                    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                        <h3 className="mb-4 text-sm font-semibold text-foreground">Jadwal</h3>
                        <div className="grid gap-1 sm:grid-cols-2">
                            <InfoRow icon={Calendar} label="Tanggal Mulai" value={formatDate(promo.start_date)} />
                            <InfoRow icon={Calendar} label="Tanggal Berakhir" value={formatDate(promo.end_date)} />
                            <InfoRow icon={Clock} label="Jam Mulai" value={promo.start_hour || '—'} />
                            <InfoRow icon={Clock} label="Jam Berakhir" value={promo.end_hour || '—'} />
                        </div>
                    </div>

                    {/* Produk Terikat */}
                    {promo.products?.length > 0 && (
                        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                            <h3 className="mb-4 text-sm font-semibold text-foreground">
                                Produk Terikat ({promo.products_count ?? promo.products.length})
                            </h3>
                            <div className="overflow-hidden rounded-xl border border-border">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-muted text-left text-xs font-semibold text-muted-foreground">
                                            <th className="px-4 py-2.5">Nama</th>
                                            <th className="px-4 py-2.5">SKU</th>
                                            <th className="px-4 py-2.5 text-right">Harga</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {promo.products.map((p) => (
                                            <tr key={p.id} className="border-t border-border">
                                                <td className="px-4 py-2.5 font-medium text-foreground">{p.name}</td>
                                                <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{p.sku || '—'}</td>
                                                <td className="px-4 py-2.5 text-right">{fmt(p.sell_price)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Free Product (bogo/bundle) */}
                    {promo.free_product && (
                        <div className="rounded-2xl border border-success/20 bg-success/10 p-5">
                            <h3 className="mb-2 text-sm font-semibold text-emerald-800">Produk Gratis</h3>
                            <p className="text-sm text-success">
                                {promo.free_product.name} — {fmt(promo.free_product.sell_price)}
                            </p>
                        </div>
                    )}
                </div>

                {/* ── Kolom kanan: Ringkasan ── */}
                <div className="space-y-5">
                    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                        <h3 className="mb-4 text-sm font-semibold text-foreground">Ringkasan</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">Status</span>
                                <StatusBadge promo={promo} />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">Penggunaan</span>
                                <span className="text-sm font-medium text-foreground">
                                    {promo.used_count ?? 0}
                                    {promo.max_usage ? ` / ${promo.max_usage}` : ''}
                                </span>
                            </div>
                            {promo.max_usage && (
                                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                                    <div
                                        className="h-full rounded-full bg-primary-500 transition-all"
                                        style={{ width: `${Math.min(100, ((promo.used_count ?? 0) / promo.max_usage) * 100)}%` }}
                                    />
                                </div>
                            )}
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">Produk Terikat</span>
                                <span className="text-sm font-medium text-foreground">
                                    {promo.products_count ?? promo.products?.length ?? 0}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
