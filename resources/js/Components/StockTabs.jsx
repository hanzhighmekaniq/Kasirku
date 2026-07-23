import { PackageSearch, Archive, ListTodo, ClipboardCheck, ArrowRightLeft, Trash2 } from 'lucide-react';
import PageTabs from '@/Components/PageTabs';
import { usePage } from '@inertiajs/react';

export default function StockTabs() {
    const { auth } = usePage().props;

    // Helper to check permission
    const can = (permission) => auth?.permissions?.includes(permission);

    // Default to show them if permission check not strictly needed, 
    // but better to hide tabs if not allowed.
    const tabs = [
        {
            name: "Manajemen Stok",
            href: route("admin.stock.index"),
            active: route().current("admin.stock.*"),
            icon: <PackageSearch className="h-4 w-4" />,
            show: true,
        },
        {
            name: "Batch / Expired",
            href: route("admin.product-batches.index"),
            active: route().current("admin.product-batches.*"),
            icon: <Archive className="h-4 w-4" />,
            show: true,
        },
        {
            name: "Penyesuaian",
            href: route("admin.stock-adjustments.index"),
            active: route().current("admin.stock-adjustments.*"),
            icon: <ListTodo className="h-4 w-4" />,
            show: can('stock.adjustment'),
        },
        {
            name: "Opname",
            href: route("admin.stock-opnames.index"),
            active: route().current("admin.stock-opnames.*"),
            icon: <ClipboardCheck className="h-4 w-4" />,
            show: can('stock.opname'),
        },
        {
            name: "Transfer",
            href: route("admin.stock-transfers.index"),
            active: route().current("admin.stock-transfers.*"),
            icon: <ArrowRightLeft className="h-4 w-4" />,
            show: can('stock.transfer'),
        },
        {
            name: "Waste",
            href: route("admin.wastes.index"),
            active: route().current("admin.wastes.*"),
            icon: <Trash2 className="h-4 w-4" />,
            show: can('stock.waste'), // usually fnb only
        },
    ].filter(tab => tab.show);

    return <PageTabs tabs={tabs} />;
}
