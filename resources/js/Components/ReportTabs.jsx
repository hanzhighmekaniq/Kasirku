import { TrendingUp, ShoppingBag, Boxes, Receipt, Clock, BadgeDollarSign, Wallet, UserCheck, RotateCcw } from 'lucide-react';
import PageTabs from '@/Components/PageTabs';

export default function ReportTabs() {
    const tabs = [
        {
            name: "Penjualan",
            href: route("admin.reports.index"),
            active: route().current("admin.reports.index"),
            icon: <TrendingUp className="h-4 w-4" />,
        },
        {
            name: "Laba Rugi",
            href: route("admin.reports.profit-loss"),
            active: route().current("admin.reports.profit-loss"),
            icon: <Wallet className="h-4 w-4" />,
        },
        {
            name: "Per Kasir",
            href: route("admin.reports.sales-by-employee"),
            active: route().current("admin.reports.sales-by-employee"),
            icon: <UserCheck className="h-4 w-4" />,
        },
        {
            name: "Retur",
            href: route("admin.reports.sale-returns"),
            active: route().current("admin.reports.sale-returns"),
            icon: <RotateCcw className="h-4 w-4" />,
        },
        {
            name: "Pembelian",
            href: route("admin.reports.purchases"),
            active: route().current("admin.reports.purchases"),
            icon: <ShoppingBag className="h-4 w-4" />,
        },
        {
            name: "Stok",
            href: route("admin.reports.stock"),
            active: route().current("admin.reports.stock"),
            icon: <Boxes className="h-4 w-4" />,
        },
        {
            name: "Pengeluaran",
            href: route("admin.reports.expenses"),
            active: route().current("admin.reports.expenses"),
            icon: <Receipt className="h-4 w-4" />,
        },
        {
            name: "Shift Kasir",
            href: route("admin.reports.shifts"),
            active: route().current("admin.reports.shifts"),
            icon: <Clock className="h-4 w-4" />,
        },
        {
            name: "Komisi Karyawan",
            href: route("admin.reports.commissions"),
            active: route().current("admin.reports.commissions"),
            icon: <BadgeDollarSign className="h-4 w-4" />,
        },
    ];

    return <PageTabs tabs={tabs} />;
}
