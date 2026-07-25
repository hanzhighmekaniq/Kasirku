import { PackageSearch, Archive, ListTodo, ClipboardCheck, ArrowRightLeft, Trash2 } from 'lucide-react';
import PageTabs from '@/Components/PageTabs';
import { usePage } from '@inertiajs/react';
import { useStoreModules } from '@/Hooks/useStoreModules';

export default function StockTabs() {
    const { auth } = usePage().props;
    const { needsAdjustment, needsOpname, needsTransfer, needsWaste } = useStoreModules();

    // Helper to check permission
    const can = (permission) => auth?.permissions?.includes(permission);

    // Only show tabs if both the user has permission AND the store supports the feature
    const tabs = [
        {
            name: "Manajemen Stok",
            href: route("admin.stock.index"),
            active: route().current("admin.stock.*") && !route().current("admin.stock-adjustments.*") && !route().current("admin.stock-opnames.*") && !route().current("admin.stock-transfers.*"),
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
            show: needsAdjustment && can('stock.adjustment'),
        },
        {
            name: "Opname",
            href: route("admin.stock-opnames.index"),
            active: route().current("admin.stock-opnames.*"),
            icon: <ClipboardCheck className="h-4 w-4" />,
            show: needsOpname && can('stock.opname'),
        },
        {
            name: "Transfer",
            href: route("admin.stock-transfers.index"),
            active: route().current("admin.stock-transfers.*"),
            icon: <ArrowRightLeft className="h-4 w-4" />,
            show: needsTransfer && can('stock.transfer'),
        },
        {
            name: "Waste",
            href: route("admin.wastes.index"),
            active: route().current("admin.wastes.*"),
            icon: <Trash2 className="h-4 w-4" />,
            show: needsWaste && can('stock.waste'),
        },
    ].filter(tab => tab.show);

    return <PageTabs tabs={tabs} />;
}
