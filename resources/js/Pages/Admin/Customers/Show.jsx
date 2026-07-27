import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader";
import Button from "@/Components/ui/Button";
import SearchableSelect from "@/Components/ui/SearchableSelect";
import { formatRupiah } from "@/Utils/currency";
import { Head, Link, router, useForm, usePage } from "@inertiajs/react";
import { ArrowLeft, Pencil, X } from "lucide-react";

const TIER_STYLES = {
    bronze: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    silver: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
    gold: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
    platinum: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
};

function formatDate(value) {
    return value
        ? new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(value))
        : "-";
}

export default function Show({ customer, activeMembership, membershipPlans, recentSales }) {
    const { flash } = usePage().props;
    const { data, setData, post, processing, errors, reset } = useForm({
        membership_id: "",
        notes: "",
    });
    const activePlan = activeMembership?.membership;

    const submitMembership = (e) => {
        e.preventDefault();
        post(route("admin.customers.assign-membership", customer.id), {
            preserveScroll: true,
            onSuccess: () => reset(),
        });
    };

    const revokeMembership = () => {
        if (!activeMembership) return;
        router.delete(route("admin.customer-memberships.revoke", activeMembership.id), {
            preserveScroll: true,
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <Link
                        href={route("admin.customers.index")}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    >
                        <ArrowLeft size={16} />
                    </Link>
                    <div className="leading-tight">
                        <div className="text-sm font-semibold text-foreground">Pelanggan</div>
                        <div className="text-[11px] text-muted-foreground">Detail</div>
                    </div>
                </div>
            }
        >
            <Head title={`Pelanggan - ${customer.name}`} />
            <PageHeader
                title={customer.name}
                breadcrumbs={["Admin", "Pelanggan", customer.name]}
                heading={
                    <div className="flex items-center gap-3">
                        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-lg font-bold text-primary">
                            {customer.name.charAt(0).toUpperCase()}
                        </span>
                        <span>
                            <span className="block">{customer.name}</span>
                            <span className="block text-sm font-normal text-muted-foreground">
                                {customer.code || "Tanpa kode"}
                            </span>
                        </span>
                    </div>
                }
                description="Detail pelanggan, membership aktif, poin, dan riwayat transaksi."
                action={
                    <Button as={Link} href={route("admin.customers.edit", customer.id)} icon={Pencil}>
                        Edit Pelanggan
                    </Button>
                }
            />

            {flash?.success && (
                <div className="mb-4 rounded-xl border border-success/20 bg-success/10 px-4 py-3 text-sm text-success">
                    {flash.success}
                </div>
            )}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-2">
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                        <MiniStat title="Total Belanja" value={formatRupiah(customer.total_spent)} />
                        <MiniStat title="Poin" value={customer.points || 0} />
                        <MiniStat title="Tier" value={customer.tier || "bronze"} />
                        <MiniStat title="Hutang" value={formatRupiah(customer.debt_balance)} danger={(customer.debt_balance ?? 0) > 0} />
                    </div>

                    <Card title="Membership Aktif">
                        {activePlan ? (
                            <div className="space-y-4">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-base font-semibold text-foreground">{activePlan.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            Aktif {formatDate(activeMembership.start_date)} - {formatDate(activeMembership.expired_date)}
                                        </p>
                                        {activeMembership.remaining_visits !== null && (
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                Sisa {activeMembership.remaining_visits} kunjungan
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={revokeMembership}
                                        className="inline-flex items-center gap-1.5 rounded-xl border border-destructive/20 px-3 py-2 text-xs font-semibold text-destructive transition hover:bg-destructive/10"
                                    >
                                        <X className="h-4 w-4" />
                                        Cabut Membership
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <Badge>{activePlan.discount_percent}% diskon</Badge>
                                    <Badge>{activePlan.point_multiplier}x poin</Badge>
                                    {activePlan.maps_to_tier && <TierBadge tier={activePlan.maps_to_tier} />}
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">Pelanggan belum punya membership aktif.</p>
                        )}
                    </Card>

                    <Card title="Riwayat Membership">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-popover text-xs uppercase text-muted-foreground">
                                    <tr>
                                        <th className="px-3 py-2 text-left">Membership</th>
                                        <th className="px-3 py-2 text-left">Periode</th>
                                        <th className="px-3 py-2 text-left">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {(customer.memberships || []).map((item) => (
                                        <tr key={item.id}>
                                            <td className="px-3 py-2 font-medium text-foreground">{item.membership?.name || "-"}</td>
                                            <td className="px-3 py-2 text-muted-foreground">
                                                {formatDate(item.start_date)} - {formatDate(item.expired_date)}
                                            </td>
                                            <td className="px-3 py-2 text-muted-foreground capitalize">{item.status}</td>
                                        </tr>
                                    ))}
                                    {customer.memberships?.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="px-3 py-6 text-center text-muted-foreground">
                                                Belum ada histori membership.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    <Card title="Riwayat Transaksi Terakhir">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-popover text-xs uppercase text-muted-foreground">
                                    <tr>
                                        <th className="px-3 py-2 text-left">No</th>
                                        <th className="px-3 py-2 text-left">Tanggal</th>
                                        <th className="px-3 py-2 text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {recentSales.map((sale) => (
                                        <tr key={sale.id}>
                                            <td className="px-3 py-2 font-medium text-foreground">{sale.sale_no}</td>
                                            <td className="px-3 py-2 text-muted-foreground">{formatDate(sale.sale_date)}</td>
                                            <td className="px-3 py-2 text-right font-medium text-foreground">{formatRupiah(sale.grand_total)}</td>
                                        </tr>
                                    ))}
                                    {recentSales.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="px-3 py-6 text-center text-muted-foreground">
                                                Belum ada transaksi.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>

                <aside className="space-y-6">
                    <Card title="Aktifkan Membership">
                        <form onSubmit={submitMembership} className="space-y-3">
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    Paket Membership
                                </label>
                                <SearchableSelect
                                    options={membershipPlans}
                                    value={data.membership_id}
                                    onChange={(value) => setData("membership_id", value)}
                                    placeholder="Pilih membership..."
                                />
                                {errors.membership_id && (
                                    <p className="mt-1 text-xs text-destructive">{errors.membership_id}</p>
                                )}
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    Catatan
                                </label>
                                <textarea
                                    value={data.notes}
                                    onChange={(e) => setData("notes", e.target.value)}
                                    rows={3}
                                    className="block w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                                    placeholder="Opsional"
                                />
                            </div>
                            <Button type="submit" loading={processing} className="w-full">
                                Aktifkan
                            </Button>
                        </form>
                    </Card>

                    <Card title="Kontak">
                        <InfoRow label="Telepon" value={customer.phone || "-"} />
                        <InfoRow label="Email" value={customer.email || "-"} />
                        <InfoRow label="Alamat" value={customer.address || "-"} />
                        <InfoRow label="Terakhir Visit" value={formatDate(customer.last_visit_at)} />
                    </Card>
                </aside>
            </div>
        </AuthenticatedLayout>
    );
}

function Card({ title, children }) {
    return (
        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="border-b border-border bg-muted/50 px-5 py-3">
                <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            </div>
            <div className="p-5">{children}</div>
        </section>
    );
}

function MiniStat({ title, value, danger = false }) {
    return (
        <div className={`rounded-2xl border p-4 ${danger ? "border-destructive/20 bg-destructive/5" : "border-border bg-card"}`}>
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className={`mt-1 truncate text-lg font-bold ${danger ? "text-destructive" : "text-foreground"}`}>{value}</p>
        </div>
    );
}

function Badge({ children }) {
    return (
        <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            {children}
        </span>
    );
}

function TierBadge({ tier }) {
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${TIER_STYLES[tier] || TIER_STYLES.bronze}`}>
            {tier}
        </span>
    );
}

function InfoRow({ label, value }) {
    return (
        <div className="flex items-start justify-between gap-3 border-b border-border py-2 last:border-0">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="max-w-[65%] text-right text-xs font-semibold text-foreground">{value}</dd>
        </div>
    );
}
