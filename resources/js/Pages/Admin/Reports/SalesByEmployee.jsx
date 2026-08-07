import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader";
import ReportTabs from "@/Components/ReportTabs";
import ExportButton from "./components/ExportButton";
import { Head, router } from "@inertiajs/react";
import SummaryCards from "./components/SummaryCards";
import DateRangeFilter from "./components/DateRangeFilter";
import SectionCard from "@/Components/ui/SectionCard";
import BranchFilter from "../Dashboard/components/BranchFilter";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
} from "recharts";
import { useTheme } from "@/Theme/ThemeProvider";

const fmt = (n) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(n ?? 0);

export default function SalesByEmployee({
    from,
    to,
    branches,
    branchIds,
    summary,
    byEmployee,
    dailyTrend,
    cashierNames,
}) {
    const { themeTokens } = useTheme();

    return (
        <AuthenticatedLayout>
            <Head title="Laporan Per Kasir" />

            <PageHeader
                title="Laporan Penjualan per Kasir"
                breadcrumbs={[
                    { label: "Laporan", href: route("admin.reports.index") },
                    { label: "Per Kasir" },
                ]}
                heading="Kinerja Penjualan Kasir"
                description="Laporan pendapatan dan jumlah transaksi berdasarkan pengguna kasir."
            />

            <ReportTabs />

            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-center gap-3">
                    <DateRangeFilter
                        from={from}
                        to={to}
                        routeName="admin.reports.sales-by-employee"
                        extraParams={{ branch_ids: branchIds }}
                    />
                    
                    {branches && branches.length > 0 && (
                        <>
                            <div className="h-6 w-px bg-border max-sm:hidden" />
                            <BranchFilter
                                branches={branches}
                                activeIds={branchIds}
                                onApply={(ids) => {
                                    router.get(
                                        route("admin.reports.sales-by-employee"),
                                        { start_date: from, end_date: to, branch_ids: ids },
                                        { preserveState: true }
                                    );
                                }}
                            />
                        </>
                    )}
                </div>
                <ExportButton
                    routeName="admin.reports.export.sales-by-employee"
                    from={from}
                    to={to}
                    branchIds={branchIds}
                />
            </div>

            <SummaryCards
                items={[
                    { label: "Total Kasir Aktif", value: summary.total_kasir, currency: false },
                    { label: "Total Transaksi", value: summary.total_transaksi, currency: false },
                    { label: "Total Pendapatan", value: summary.total_pendapatan, currency: true },
                    { label: "Rata-rata Transaksi", value: summary.rata_rata_transaksi, currency: true },
                ]}
            />

            <div className="mt-6 grid gap-5 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-5">
                    <SectionCard title="Pendapatan Harian per Kasir" subtitle="Trend 30 Hari Terakhir">
                        <div className="h-[350px] w-full pt-4">
                            {dailyTrend.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={dailyTrend} margin={{ top: 5, right: 0, left: 20, bottom: 0 }}>
                                        <XAxis
                                            dataKey="date"
                                            tick={{ fill: themeTokens.mutedForeground, fontSize: 12 }}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(val) => {
                                                const d = new Date(val);
                                                return `${d.getDate()}/${d.getMonth() + 1}`;
                                            }}
                                            dy={10}
                                        />
                                        <YAxis
                                            tick={{ fill: themeTokens.mutedForeground, fontSize: 12 }}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(val) => new Intl.NumberFormat("id-ID", { notation: "compact" }).format(val)}
                                            dx={-10}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: themeTokens.popover,
                                                borderColor: themeTokens.border,
                                                borderRadius: "12px",
                                                color: themeTokens.popoverForeground,
                                            }}
                                            formatter={(val, name) => [fmt(val), name]}
                                        />
                                        {cashierNames.map((name, i) => (
                                            <Area
                                                key={name}
                                                type="monotone"
                                                dataKey={name}
                                                stackId="1"
                                                stroke={i % 2 === 0 ? themeTokens.chart1 : themeTokens.chart2}
                                                fill={i % 2 === 0 ? themeTokens.chart1 : themeTokens.chart2}
                                                fillOpacity={0.6}
                                            />
                                        ))}
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex h-full items-center justify-center text-muted-foreground">Belum ada data</div>
                            )}
                        </div>
                    </SectionCard>
                </div>

                <div className="space-y-5">
                    <SectionCard title="Peringkat Kasir">
                        <div className="space-y-4 pt-2">
                            {byEmployee.length > 0 ? (
                                byEmployee.map((emp, i) => (
                                    <div key={i} className="flex justify-between items-center text-sm border-b border-dashed border-border pb-3 last:border-0">
                                        <div>
                                            <div className="font-medium text-foreground">{emp.cashier_name}</div>
                                            <div className="text-xs text-muted-foreground">{emp.total_transactions} transaksi</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-success">{fmt(emp.total_revenue)}</div>
                                            <div className="text-xs text-muted-foreground">Avg: {fmt(emp.avg_transaction)}</div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center text-sm text-muted-foreground py-4">Belum ada data</div>
                            )}
                        </div>
                    </SectionCard>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}