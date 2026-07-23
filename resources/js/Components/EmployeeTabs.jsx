import { Users, UserCog, ShieldCheck } from 'lucide-react';
import PageTabs from '@/Components/PageTabs';
import { usePage } from '@inertiajs/react';

export default function EmployeeTabs() {
    const { auth } = usePage().props;
    const can = (permission) => auth?.permissions?.includes(permission);

    // Some tabs might be restricted by 'setting.edit' depending on the plan.
    const tabs = [
        {
            name: "Karyawan",
            href: route("admin.employees.index"),
            active: route().current("admin.employees.*"),
            icon: <Users className="h-4 w-4" />,
            show: true,
        },
        {
            name: "Pengguna Aplikasi",
            href: route("admin.store-users.index"),
            active: route().current("admin.store-users.*"),
            icon: <UserCog className="h-4 w-4" />,
            show: can('setting.edit'),
        },
        {
            name: "Role & Hak Akses",
            href: route("admin.roles.index"),
            active: route().current("admin.roles.*"),
            icon: <ShieldCheck className="h-4 w-4" />,
            show: can('setting.edit'),
        }
    ].filter(tab => tab.show);

    return <PageTabs tabs={tabs} />;
}
