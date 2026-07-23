import { TrendingUp, ShoppingBag, Boxes, Receipt, Clock, BadgeDollarSign } from 'lucide-react';
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
