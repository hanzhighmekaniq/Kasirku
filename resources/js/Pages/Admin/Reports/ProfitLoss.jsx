import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader";
import ReportTabs from "@/Components/ReportTabs";
import { Head, router } from "@inertiajs/react";
import SummaryCards from "./components/SummaryCards";
import DateRangeFilter from "./components/DateRangeFilter";
import Button from "@/Components/ui/Button";
import { Download } from "lucide-react";
import SectionCard from "@/Components/ui/SectionCard";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell,
} from "recharts";
import { useTheme } from "@/Theme/ThemeProvider";
import BranchFilter from "../Dashboard/components/BranchFilter";

const fmt = (n) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(n ?? 0);

export default function ProfitLoss({
    from,
    to,
    branches,
    branchIds,
    summary,
    revenueByCategory,
    cogsByCategory,
    expensesByCategory,
    dailyTrend,
}) {
    const { themeTokens } = useTheme();

    const handleExport = () => {
        const params = new URLSearchParams();
        if (from) params.append("start_date", from);
        if (to) params.append("end_date", to);
        if (branchIds?.length) {
            branchIds.forEach((id) => params.append("branch_ids[]", id));
        }
        window.location.href = route("admin.reports.profit-loss.export") + "?" + params.toString();
    };

    return (
        <AuthenticatedLayout>
            <Head title="Laporan Laba Rugi" />

            <PageHeader
                title="Laporan Laba Rugi"
                breadcrumbs={[
                    { label: "Laporan", href: route("admin.reports.index") },
                    { label: "Laba Rugi" },
                ]}
                heading="Laba Rugi (P&L)"
                description="Laporan pendapatan, harga pokok penjualan, dan pengeluaran operasional."
            />

            <ReportTabs />

            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-center gap-3">
                    <DateRangeFilter
                        from={from}
                        to={to}
                        routeName="admin.reports.profit-loss"
                        extraParams={{ branch_ids: branchIds }}
                    />
                    
                    {branches && branches.length > 0 && (
                        <div className="h-6 w-px bg-border max-sm:hidden" />
                    )}
                    
                    {branches && branches.length > 0 && (
                        <BranchFilter
                            branches={branches}
                            activeIds={branchIds}
                            onApply={(ids) => {
                                router.get(
                                    route("admin.reports.profit-loss"),
                                    {
                                        start_date: from,
                                        end_date: to,
                                        branch_ids: ids,
                                    },
                                    { preserveState: true }
                                );
                            }}
                        />
                    )}
                </div>

                {/* <Button variant="outline" size="sm" onClick={handleExport}>
                    <Download className="mr-2 h-4 w-4" /> Export Excel
                </Button> */}
            </div>

            <SummaryCards
                items={[
                    {
                        label: "Pendapatan Bersih",
                        value: summary.pendapatan_bersih,
                        currency: true,
                    },
                    {
                        label: "HPP (COGS)",
                        value: summary.hpp,
                        currency: true,
                        sub: "Harga Pokok Penjualan",
                    },
                    {
                        label: "Laba Kotor",
                        value: summary.laba_kotor,
                        currency: true,
                        sub: `Margin: ${summary.margin_kotor_persen}%`,
                    },
                    {
                        label: "Pengeluaran",
                        value: summary.total_pengeluaran,
                        currency: true,
                    },
                    {
                        label: "Laba Bersih",
                        value: summary.laba_bersih,
                        currency: true,
                        sub: `Margin: ${summary.margin_bersih_persen}%`,
                    },
                ]}
            />

            <div className="mt-6 grid gap-5 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-5">
                    <SectionCard title="Trend Laba Rugi" subtitle="Perbandingan harian">
                        <div className="h-[350px] w-full pt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart
                                    data={dailyTrend}
                                    margin={{ top: 5, right: 0, left: 20, bottom: 0 }}
                                >
                                    <defs>
                                        <linearGradient
                                            id="colorRev"
                                            x1="0"
                                            y1="0"
                                            x2="0"
                                            y2="1"
                                        >
                                            <stop
                                                offset="5%"
                                                stopColor={themeTokens.chart1}
                                                stopOpacity={0.3}
                                            />
                                            <stop
                                                offset="95%"
                                                stopColor={themeTokens.chart1}
                                                stopOpacity={0}
                                            />
                                        </linearGradient>
                                        <linearGradient
                                            id="colorProfit"
                                            x1="0"
                                            y1="0"
                                            x2="0"
                                            y2="1"
                                        >
                                            <stop
                                                offset="5%"
                                                stopColor={themeTokens.chart2}
                                                stopOpacity={0.3}
                                            />
                                            <stop
                                                offset="95%"
                                                stopColor={themeTokens.chart2}
                                                stopOpacity={0}
                                            />
                                        </linearGradient>
                                    </defs>
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
                                        tickFormatter={(val) =>
                                            new Intl.NumberFormat("id-ID", {
                                                notation: "compact",
                                            }).format(val)
                                        }
                                        dx={-10}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: themeTokens.popover,
                                            borderColor: themeTokens.border,
                                            borderRadius: "12px",
                                            color: themeTokens.popoverForeground,
                                            boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                                        }}
                                        itemStyle={{ color: themeTokens.popoverForeground }}
                                        formatter={(val, name) => [
                                            fmt(val),
                                            name === 'revenue' ? 'Pendapatan' : 
                                            name === 'net_profit' ? 'Laba Bersih' : 
                                            name === 'cogs' ? 'HPP' : 'Pengeluaran'
                                        ]}
                                        labelFormatter={(val) =>
                                            new Date(val).toLocaleDateString("id-ID", {
                                                weekday: "long",
                                                year: "numeric",
                                                month: "long",
                                                day: "numeric",
                                            })
                                        }
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke={themeTokens.chart1}
                                        fillOpacity={1}
                                        fill="url(#colorRev)"
                                        strokeWidth={2}
                                        name="revenue"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="net_profit"
                                        stroke={themeTokens.chart2}
                                        fillOpacity={1}
                                        fill="url(#colorProfit)"
                                        strokeWidth={2}
                                        name="net_profit"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </SectionCard>
                </div>
                
                <div className="space-y-5">
                    <SectionCard title="Ringkasan P&L" subtitle="Format Laporan Keuangan">
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-sm font-medium mb-1">
                                    <span className="text-foreground">Pendapatan Bersih</span>
                                    <span className="text-foreground">{fmt(summary.pendapatan_bersih)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-muted-foreground mb-1">
                                    <span>Harga Pokok Penjualan (HPP)</span>
                                    <span>-{fmt(summary.hpp)}</span>
                                </div>
                                <div className="my-2 border-t border-dashed border-border" />
                                <div className="flex justify-between text-sm font-bold text-primary mb-3">
                                    <span>Laba Kotor</span>
                                    <span>{fmt(summary.laba_kotor)}</span>
                                </div>
                            </div>
                            
                            <div>
                                <div className="flex justify-between text-sm text-muted-foreground mb-1">
                                    <span>Total Pengeluaran</span>
                                    <span>-{fmt(summary.total_pengeluaran)}</span>
                                </div>
                                <div className="my-2 border-t border-dashed border-border" />
                                <div className="flex justify-between text-base font-bold text-success">
                                    <span>Laba Bersih</span>
                                    <span>{fmt(summary.laba_bersih)}</span>
                                </div>
                            </div>
                        </div>
                    </SectionCard>
                </div>
            </div>
            
            <div className="mt-6 grid gap-5 lg:grid-cols-3">
                <SectionCard title="Pendapatan per Kategori">
                    <div className="space-y-4 pt-2 max-h-[300px] overflow-y-auto">
                        {revenueByCategory.length > 0 ? (
                            revenueByCategory.map((cat, i) => (
                                <div key={i} className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">{cat.name}</span>
                                    <span className="font-medium">{fmt(cat.total)}</span>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-sm text-muted-foreground py-4">Belum ada data</div>
                        )}
                    </div>
                </SectionCard>
                
                <SectionCard title="HPP per Kategori">
                    <div className="space-y-4 pt-2 max-h-[300px] overflow-y-auto">
                        {cogsByCategory.length > 0 ? (
                            cogsByCategory.map((cat, i) => (
                                <div key={i} className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">{cat.name}</span>
                                    <span className="font-medium text-destructive">{fmt(cat.total)}</span>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-sm text-muted-foreground py-4">Belum ada data</div>
                        )}
                    </div>
                </SectionCard>
                
                <SectionCard title="Pengeluaran per Kategori">
                    <div className="space-y-4 pt-2 max-h-[300px] overflow-y-auto">
                        {expensesByCategory.length > 0 ? (
                            expensesByCategory.map((cat, i) => (
                                <div key={i} className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">{cat.name}</span>
                                    <span className="font-medium text-destructive">{fmt(cat.total)}</span>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-sm text-muted-foreground py-4">Belum ada data</div>
                        )}
                    </div>
                </SectionCard>
            </div>
        </AuthenticatedLayout>
    );
}