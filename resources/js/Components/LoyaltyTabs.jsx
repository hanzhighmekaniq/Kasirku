import { Users, BadgeCheck, Layers } from "lucide-react";
import PageTabs from "@/Components/PageTabs";
import { usePage } from "@inertiajs/react";
import { useStoreModules } from "@/Hooks/useStoreModules";

export default function LoyaltyTabs() {
    const { auth } = usePage().props;
    const { hasCustomer, needsMembership } = useStoreModules();

    const can = (permission) => auth?.permissions?.includes(permission);

    const tabs = [
        {
            name: "Data Pelanggan",
            href: route("admin.customers.index"),
            active: route().current("admin.customers.*"),
            icon: <Users className="h-4 w-4" />,
            show: hasCustomer && can("customer.view"),
        },
        {
            name: "Paket Membership",
            href: route("admin.memberships.index"),
            active: route().current("admin.memberships.*"),
            icon: <BadgeCheck className="h-4 w-4" />,
            show: needsMembership && can("membership.view"),
        },
        {
            name: "Level Tier",
            href: route("admin.customer-tiers.index"),
            active: route().current("admin.customer-tiers.*"),
            icon: <Layers className="h-4 w-4" />,
            show: needsMembership && can("membership.view"),
        },
    ].filter((tab) => tab.show);

    return <PageTabs tabs={tabs} />;
}
