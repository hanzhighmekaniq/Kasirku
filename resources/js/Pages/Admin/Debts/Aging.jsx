import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader";
import { Head, Link } from "@inertiajs/react";
import SummaryCards from "../Reports/components/SummaryCards";
import SectionCard from "@/Components/ui/SectionCard";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from "recharts";
import { useTheme } from "@/Theme/ThemeProvider";

const fmt = (n) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(n ?? 0);

export default function Aging({
    summary,
    agingBuckets,
    customers,
}) {
    const { themeTokens } = useTheme();

    return (
        <AuthenticatedLayout>
            <Head title="Aging Hutang Pelanggan" />

            <PageHeader
                title="Laporan Aging Hutang"
                breadcrumbs={[
                    { label: "Hutang", href: route("admin.debts.index") },
                    { label: "Aging Report" },
                ]}
                heading="Aging Piutang Pelanggan"
                description="Analisis umur hutang pelanggan berdasarkan jatuh tempo."
            />

            <div className="mb-6 flex gap-2">
                <Link
                    href={route("admin.debts.index")}
                    className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
                >
                    Daftar Hutang
                </Link>
                <Link
                    href={route("admin.debts.aging")}
                    className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                >
                    Aging Report
                </Link>
            </div>

            <SummaryCards
                items={[
                    { label: "Total Piutang", value: summary.total_piutang, currency: true },
                    { label: "Jumlah Pelanggan", value: summary.jumlah_pelanggan, currency: false },
                    { label: "Rata-rata Hutang", value: summary.rata_rata_hutang, currency: true },
                ]}
            />

            <div className="mt-6 grid gap-5 lg:grid-cols-3">
                <div className="lg:col-span-1 space-y-5">
                    <SectionCard title="Distribusi Umur Piutang">
                        <div className="h-[300px] w-full pt-4">
                            {agingBuckets.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={agingBuckets} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                                        <XAxis 
                                            type="number" 
                                            tickFormatter={(val) => new Intl.NumberFormat("id-ID", { notation: "compact" }).format(val)}
                                            tick={{ fill: themeTokens.mutedForeground, fontSize: 12 }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <YAxis 
                                            dataKey="label" 
                                            type="category" 
                                            tick={{ fill: themeTokens.mutedForeground, fontSize: 12 }}
                                            axisLine={false}
                                            tickLine={false}
                                            width={100}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: themeTokens.popover,
                                                borderColor: themeTokens.border,
                                                borderRadius: "12px",
                                                color: themeTokens.popoverForeground,
                                            }}
                                            formatter={(val) => [fmt(val), 'Total']}
                                            cursor={{fill: themeTokens.muted}}
                                        />
                                        <Bar dataKey="total" radius={[0, 4, 4, 0]} barSize={32}>
                                            {agingBuckets.map((entry, index) => (
                                                <Cell 
                                                    key={`cell-${index}`} 
                                                    fill={
                                                        entry.key === 'none' ? themeTokens.mutedForeground :
                                                        entry.key === '30' ? themeTokens.success :
                                                        entry.key === '60' ? themeTokens.warning :
                                                        themeTokens.destructive
                                                    } 
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex h-full items-center justify-center text-muted-foreground">Belum ada data</div>
                            )}
                        </div>
                    </SectionCard>
                </div>

                <div className="lg:col-span-2 space-y-5">
                    <SectionCard title="Detail Piutang Pelanggan">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="border-b border-border text-xs uppercase text-muted-foreground">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">Pelanggan</th>
                                        <th className="px-4 py-3 font-medium text-right">Saldo Hutang</th>
                                        <th className="px-4 py-3 font-medium">Jatuh Tempo Tertua</th>
                                        <th className="px-4 py-3 font-medium">Umur (Bucket)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y border-border">
                                    {customers.length > 0 ? (
                                        customers.map((c, i) => (
                                            <tr key={i} className="hover:bg-muted/50 transition-colors">
                                                <td className="px-4 py-3">
                                                    <div className="font-medium text-foreground">{c.name}</div>
                                                    {c.phone && <div className="text-xs text-muted-foreground">{c.phone}</div>}
                                                </td>
                                                <td className="px-4 py-3 text-right font-medium">{fmt(c.debt_balance)}</td>
                                                <td className="px-4 py-3 text-muted-foreground">
                                                    {c.oldest_due_date ? new Date(c.oldest_due_date).toLocaleDateString('id-ID') : '-'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium
                                                        ${c.aging_bucket === 'none' ? 'bg-muted text-muted-foreground' : 
                                                          c.aging_bucket === '30' ? 'bg-success/10 text-success' : 
                                                          c.aging_bucket === '60' ? 'bg-warning/10 text-warning' : 
                                                          'bg-destructive/10 text-destructive'}`}
                                                    >
                                                        {c.aging_label}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                                                Tidak ada data piutang.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </SectionCard>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}