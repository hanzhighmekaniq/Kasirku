import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader";
import Button from "@/Components/ui/Button";
import { Head, Link } from "@inertiajs/react";
import { CreditCard, Pencil, Users, Zap } from "lucide-react";

const DURATION_LABELS = {
    day: "Hari",
    month: "Bulan",
    year: "Tahun",
    visit: "Kunjungan",
};

/**
 * Kelas warna ditulis lengkap supaya tidak dibuang Tailwind saat build.
 * Kunci mengikuti CustomerTier::COLORS di backend.
 */
const TIER_STYLES = {
    slate: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    yellow: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
    indigo: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    sky: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    rose: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
};

const MEMBER_STATUS = {
    active: { label: "Aktif", cls: "bg-success/10 text-success", dot: "bg-success" },
    expired: {
        label: "Kedaluwarsa",
        cls: "bg-muted text-muted-foreground",
        dot: "bg-muted-foreground",
    },
    cancelled: {
        label: "Dibatalkan",
        cls: "bg-destructive/10 text-destructive",
        dot: "bg-destructive",
    },
    suspended: {
        label: "Ditahan",
        cls: "bg-warning/10 text-warning",
        dot: "bg-warning",
    },
};

const SOURCE_LABELS = {
    manual: "Manual",
    purchase: "Dibeli",
    auto_tier: "Otomatis",
};

function formatIDR(amount) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(parseFloat(amount) || 0);
}

function formatDate(value) {
    return value
        ? new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(
              new Date(value),
          )
        : "-";
}

function formatDuration(type, value) {
    return `${value} ${DURATION_LABELS[type] ?? type}`;
}

export default function Show({
    membership,
    recentMembers = [],
    stats,
    customerTiers = [],
}) {
    const benefits = Array.isArray(membership.benefits) ? membership.benefits : [];
    const tierBenefit = benefits.find((b) => b.type === "maps_to_tier");
    const tier = tierBenefit
        ? (customerTiers.find((t) => t.id === tierBenefit.tier_id) ?? null)
        : null;
    const otherBenefits = benefits.filter((b) => b.type !== "maps_to_tier");

    const hasAutoTier =
        membership.auto_tier_min_spend !== null &&
        membership.auto_tier_min_spend !== undefined &&
        membership.auto_tier_min_spend !== "";

    return (
        <AuthenticatedLayout
            backUrl={route("admin.memberships.index")}
            header={
                <div className="leading-tight">
                    <div className="text-sm font-semibold text-foreground">
                        {membership.name}
                    </div>
                    <div className="text-[11px] text-muted-foreground">Detail</div>
                </div>
            }
        >
            <Head title={`Membership - ${membership.name}`} />
            <PageHeader
                title={membership.name}
                breadcrumbs={["Admin", "Membership", membership.name]}
                heading={
                    <div className="flex flex-wrap items-center gap-3">
                        <span>
                            Detail{" "}
                            <span className="text-primary">{membership.name}</span>
                        </span>
                        <StatusBadge active={membership.is_active} />
                    </div>
                }
                description="Rincian paket membership, benefit, dan anggotanya."
                backUrl={route("admin.memberships.index")}
                action={
                    <Button
                        as={Link}
                        href={route("admin.memberships.edit", membership.id)}
                        icon={Pencil}
                    >
                        Edit Membership
                    </Button>
                }
            />

            {/* Stats */}
            <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <StatCard label="Harga" value={formatIDR(membership.price)} accent="border-l-primary" />
                <StatCard
                    label="Total Anggota"
                    value={stats?.total_members ?? 0}
                    accent="border-l-muted-foreground/30"
                />
                <StatCard
                    label="Aktif"
                    value={stats?.active_members ?? 0}
                    accent="border-l-success"
                />
                <StatCard
                    label="Kedaluwarsa"
                    value={stats?.expired_members ?? 0}
                    accent="border-l-warning"
                />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-2">
                    <Card title="Informasi Paket">
                        <dl className="divide-y divide-border">
                            <InfoRow label="Kode">
                                <span className="inline-flex items-center rounded-lg bg-muted px-2.5 py-1 font-mono text-xs font-semibold text-foreground">
                                    {membership.code}
                                </span>
                            </InfoRow>
                            <InfoRow label="Nama">{membership.name}</InfoRow>
                            <InfoRow label="Durasi">
                                {formatDuration(
                                    membership.duration_type,
                                    membership.duration_value,
                                )}
                            </InfoRow>
                            <InfoRow label="Harga">{formatIDR(membership.price)}</InfoRow>
                            <InfoRow label="Setara Tier">
                                {tier ? (
                                    <span
                                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TIER_STYLES[tier.color] || TIER_STYLES.slate}`}
                                    >
                                        Lvl {tier.rank} — {tier.name}
                                    </span>
                                ) : (
                                    <span className="text-muted-foreground">
                                        Tidak mengubah tier
                                    </span>
                                )}
                            </InfoRow>
                            <InfoRow label="Dijual di Kasir">
                                {membership.is_sellable_at_pos ? "Ya" : "Tidak"}
                            </InfoRow>
                            {membership.description && (
                                <InfoRow label="Deskripsi">
                                    <span className="text-muted-foreground">
                                        {membership.description}
                                    </span>
                                </InfoRow>
                            )}
                        </dl>
                    </Card>

                    <Card title="Benefit">
                        {otherBenefits.length === 0 ? (
                            <div className="flex flex-col items-center py-8 text-center">
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/30">
                                    <CreditCard
                                        className="h-7 w-7 text-muted-foreground/50"
                                        strokeWidth={1.5}
                                    />
                                </div>
                                <p className="mt-3 text-sm font-medium text-foreground">
                                    Belum ada benefit
                                </p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Tambahkan benefit lewat tombol Edit Membership.
                                </p>
                            </div>
                        ) : (
                            <ul className="space-y-2">
                                {otherBenefits.map((benefit, i) => (
                                    <li
                                        key={i}
                                        className="flex items-start justify-between gap-3 rounded-xl border border-border bg-muted/30 p-3"
                                    >
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-foreground">
                                                {benefit.label}
                                            </p>
                                            <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                                {benefit.value !== null &&
                                                    benefit.value !== undefined &&
                                                    benefit.value !== "" && (
                                                        <span className="inline-flex items-center rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                                                            Nilai: {benefit.value}
                                                        </span>
                                                    )}
                                                {benefit.quantity ? (
                                                    <span className="inline-flex items-center rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                                                        Qty: {benefit.quantity}
                                                    </span>
                                                ) : null}
                                                {benefit.min_purchase ? (
                                                    <span className="inline-flex items-center rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                                                        Min. {formatIDR(benefit.min_purchase)}
                                                    </span>
                                                ) : null}
                                                {benefit.max_amount ? (
                                                    <span className="inline-flex items-center rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                                                        Maks. {formatIDR(benefit.max_amount)}
                                                    </span>
                                                ) : null}
                                            </div>
                                        </div>
                                        {benefit.auto && (
                                            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                                                <Zap className="h-3 w-3" strokeWidth={2} />
                                                Otomatis
                                            </span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Card>

                    <Card title="Anggota Terbaru">
                        {recentMembers.length === 0 ? (
                            <div className="flex flex-col items-center py-8 text-center">
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/30">
                                    <Users
                                        className="h-7 w-7 text-muted-foreground/50"
                                        strokeWidth={1.5}
                                    />
                                </div>
                                <p className="mt-3 text-sm font-medium text-foreground">
                                    Belum ada anggota
                                </p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Pelanggan yang memakai paket ini akan tampil di sini.
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* Desktop table */}
                                <div className="hidden overflow-hidden rounded-xl border border-border md:block">
                                    <table className="w-full text-sm">
                                        <thead className="bg-popover text-xs uppercase tracking-wide text-card-foreground">
                                            <tr>
                                                <th className="px-4 py-3 text-left font-semibold">
                                                    Pelanggan
                                                </th>
                                                <th className="px-4 py-3 text-left font-semibold">
                                                    Periode
                                                </th>
                                                <th className="px-4 py-3 text-left font-semibold">
                                                    Sumber
                                                </th>
                                                <th className="px-4 py-3 text-center font-semibold">
                                                    Status
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border bg-background">
                                            {recentMembers.map((item) => (
                                                <tr
                                                    key={item.id}
                                                    className="transition hover:bg-[rgb(var(--color-table-hover))]"
                                                >
                                                    <td className="px-4 py-3">
                                                        <p className="font-medium text-foreground">
                                                            {item.customer?.name ?? "-"}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {item.customer?.code ||
                                                                item.customer?.phone ||
                                                                "Tanpa kode"}
                                                        </p>
                                                    </td>
                                                    <td className="px-4 py-3 text-muted-foreground">
                                                        {formatDate(item.start_date)} -{" "}
                                                        {formatDate(item.expired_date)}
                                                    </td>
                                                    <td className="px-4 py-3 text-muted-foreground">
                                                        {SOURCE_LABELS[item.source] ??
                                                            item.source ??
                                                            "-"}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <MemberStatusBadge
                                                            status={item.status}
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile cards */}
                                <div className="space-y-3 md:hidden">
                                    {recentMembers.map((item) => (
                                        <div
                                            key={item.id}
                                            className="rounded-xl border border-border bg-background p-3"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-medium text-foreground">
                                                        {item.customer?.name ?? "-"}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {item.customer?.code ||
                                                            item.customer?.phone ||
                                                            "Tanpa kode"}
                                                    </p>
                                                </div>
                                                <MemberStatusBadge status={item.status} />
                                            </div>
                                            <div className="mt-2 flex items-center justify-between border-t border-border pt-2 text-xs">
                                                <span className="text-muted-foreground">
                                                    {formatDate(item.start_date)} -{" "}
                                                    {formatDate(item.expired_date)}
                                                </span>
                                                <span className="font-medium text-foreground">
                                                    {SOURCE_LABELS[item.source] ??
                                                        item.source ??
                                                        "-"}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </Card>
                </div>

                <aside className="space-y-6">
                    <Card title="Auto-Tier">
                        {hasAutoTier ? (
                            <dl className="divide-y divide-border">
                                <InfoRow label="Ambang Belanja">
                                    {formatIDR(membership.auto_tier_min_spend)}
                                </InfoRow>
                                <InfoRow label="Periode">
                                    {membership.auto_tier_window_value
                                        ? formatDuration(
                                              membership.auto_tier_window_type,
                                              membership.auto_tier_window_value,
                                          )
                                        : "Sepanjang waktu"}
                                </InfoRow>
                            </dl>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                Auto-tier tidak aktif. Pelanggan hanya masuk paket ini
                                lewat penetapan manual atau pembelian di kasir.
                            </p>
                        )}
                    </Card>

                    <Card title="Ringkasan">
                        <dl className="divide-y divide-border">
                            <InfoRow label="Status">
                                <StatusBadge active={membership.is_active} />
                            </InfoRow>
                            <InfoRow label="Jumlah Benefit">
                                {otherBenefits.length}
                            </InfoRow>
                            <InfoRow label="Dibuat">
                                {formatDate(membership.created_at)}
                            </InfoRow>
                            <InfoRow label="Diperbarui">
                                {formatDate(membership.updated_at)}
                            </InfoRow>
                        </dl>
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

function StatCard({ label, value, accent }) {
    return (
        <div
            className={`rounded-2xl border border-border border-l-4 bg-card p-4 shadow-sm ${accent}`}
        >
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <p className="mt-1 truncate text-xl font-bold text-foreground">{value}</p>
        </div>
    );
}

function InfoRow({ label, children }) {
    return (
        <div className="flex items-start justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
            <dt className="shrink-0 text-xs text-muted-foreground">{label}</dt>
            <dd className="max-w-[65%] text-right text-sm font-medium text-foreground">
                {children}
            </dd>
        </div>
    );
}

function StatusBadge({ active }) {
    return active ? (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            Aktif
        </span>
    ) : (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
            Nonaktif
        </span>
    );
}

function MemberStatusBadge({ status }) {
    const cfg = MEMBER_STATUS[status] ?? {
        label: status ?? "-",
        cls: "bg-muted text-muted-foreground",
        dot: "bg-muted-foreground",
    };

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.cls}`}
        >
            <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
        </span>
    );
}
