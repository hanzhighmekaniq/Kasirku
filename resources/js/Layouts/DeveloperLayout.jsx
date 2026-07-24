import ApplicationLogo from "@/Components/ApplicationLogo";
import Dropdown from "@/Components/Dropdown";
import { Link, usePage } from "@inertiajs/react";
import { useState } from "react";

const navItems = [
    {
        name: "Dashboard",
        href: route("developer.dashboard"),
        current: "developer.dashboard",
        icon: (
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25a2.25 2.25 0 01-2.25 2.25h-2.25A2.25 2.25 0 0113.5 8.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
            />
        ),
    },
    {
        name: "Kelola Toko",
        href: route("developer.stores.index"),
        current: "developer.stores.*",
        icon: (
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.375.375 0 01.375.375v1.875c0 .207-.168.375-.375.375H6.75a.375.375 0 01-.375-.375v-1.875A.375.375 0 016.75 18z"
            />
        ),
    },
    {
        name: "Semua Cabang",
        href: route("developer.branches.index"),
        current: "developer.branches.*",
        icon: (
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 21h16.5M4.5 21V8.25A2.25 2.25 0 016.75 6h10.5a2.25 2.25 0 012.25 2.25V21M8.25 21v-5.25A1.5 1.5 0 019.75 14.25h4.5a1.5 1.5 0 011.5 1.5V21M8.25 10.5h.008v.008H8.25V10.5zm3.75 0h.008v.008H12V10.5zm3.75 0h.008v.008h-.008V10.5z"
            />
        ),
    },
    {
        name: "Kelola User",
        href: route("developer.users.index"),
        current: "developer.users.*",
        icon: (
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
            />
        ),
    },
    {
        name: "Paket",
        href: route("developer.plans.index"),
        current: "developer.plans.*",
        icon: (
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
            />
        ),
    },
    {
        name: "Fitur Tipe",
        href: route("developer.type-features"),
        current: "developer.type-features",
        icon: (
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75"
            />
        ),
    },
    {
        name: "Role & Permission",
        href: route("developer.roles.index"),
        current: "developer.roles.*",
        icon: (
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
            />
        ),
    },
    {
        name: "Payment Gateway",
        href: route("developer.payment-gateway.index"),
        current: "developer.payment-gateway.*",
        icon: (
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
            />
        ),
    },
    {
        name: "Wallet Store",
        href: route("developer.wallets.index"),
        current: "developer.wallets.*",
        icon: (
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6.75A2.25 2.25 0 0018.75 4.5H5.25A2.25 2.25 0 003 6.75V9"
            />
        ),
    },
];

function NavItem({ item }) {
    const active = route().current(item.current);
    return (
        <Link
            href={item.href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all
                ${active ? "bg-primary-50 text-primary-700" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"}`}
        >
            <span
                className={`flex h-[22px] w-[22px] items-center justify-center ${active ? "text-primary-600" : "text-muted-foreground"}`}
            >
                <svg
                    className="h-[15px] w-[15px]"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.7}
                    stroke="currentColor"
                >
                    {item.icon}
                </svg>
            </span>
            {item.name}
        </Link>
    );
}

export default function DeveloperLayout({ header, children }) {
    const { auth, flash } = usePage().props;
    const user = auth?.user;
    const [mobileOpen, setMobileOpen] = useState(false);

    const Sidebar = () => (
        <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
            {/* Brand */}
            <div className="flex h-[57px] shrink-0 items-center gap-2.5 border-b border-sidebar-border px-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary shadow-sm">
                    <ApplicationLogo className="h-4 w-4 fill-current text-sidebar-primary-foreground" />
                </div>
                <div className="leading-none">
                    <span className="block text-[13px] font-bold tracking-tight text-sidebar-foreground">
                        SIM-KASIR
                    </span>
                    <span className="block text-[10px] text-primary-500 font-medium">
                        Developer Panel
                    </span>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
                <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Menu
                </p>
                {navItems.map((item) => (
                    <NavItem key={item.name} item={item} />
                ))}
            </nav>

            {/* Footer */}
            <div className="shrink-0 border-t border-sidebar-border px-4 py-2.5">
                <span className="text-[10px] text-muted-foreground">
                    © {new Date().getFullYear()} SIM-KASIR Dev
                </span>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Desktop sidebar */}
            <aside className="fixed inset-y-0 left-0 z-30 hidden w-[240px] overflow-hidden lg:block">
                <Sidebar />
            </aside>

            {/* Mobile drawer */}
            <div
                className={`fixed inset-0 z-40 lg:hidden ${mobileOpen ? "" : "pointer-events-none"}`}
            >
                <div
                    onClick={() => setMobileOpen(false)}
                    className={`absolute inset-0 bg-black/20 backdrop-blur-[2px] transition-opacity ${mobileOpen ? "opacity-100" : "opacity-0"}`}
                />
                <aside
                    className={`absolute inset-y-0 left-0 w-[240px] overflow-hidden shadow-xl transition-transform ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
                >
                    <Sidebar />
                </aside>
            </div>

            {/* Main */}
            <div className="flex min-h-screen flex-col lg:pl-[240px]">
                {/* Topbar */}
                <header className="sticky top-0 z-20 flex h-[57px] items-center justify-between border-b border-border bg-card px-4 sm:px-5">
                    <div className="flex min-w-0 items-center gap-3">
                        <button
                            onClick={() => setMobileOpen(true)}
                            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground lg:hidden"
                        >
                            <svg
                                className="h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                                />
                            </svg>
                        </button>
                        <div className="h-5 w-px bg-border" />
                        <div className="min-w-0 truncate text-sm text-foreground">
                            {header}
                        </div>
                    </div>

                    <Dropdown>
                        <Dropdown.Trigger>
                            <button className="flex items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-1.5 text-sm hover:bg-accent">
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                                    {user?.name?.charAt(0).toUpperCase()}
                                </span>
                                <span className="hidden max-w-[8rem] truncate text-xs font-medium text-foreground sm:block">
                                    {user?.name}
                                </span>
                                <svg
                                    className="h-3.5 w-3.5 text-muted-foreground"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </button>
                        </Dropdown.Trigger>
                        <Dropdown.Content>
                            <Dropdown.Link
                                href={route("developer.profile.edit")}
                            >
                                Pengaturan Akun
                            </Dropdown.Link>
                            <div className="my-1 border-t border-border" />
                            <Dropdown.Link
                                href={route("logout")}
                                method="post"
                                as="button"
                            >
                                Keluar
                            </Dropdown.Link>
                        </Dropdown.Content>
                    </Dropdown>
                </header>

                {/* Flash */}
                {flash?.success && (
                    <div className="mx-5 mt-4 rounded-lg border border-success/20 bg-success/10 px-4 py-2.5 text-sm text-success">
                        ✅ {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="mx-5 mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
                        ❌ {flash.error}
                    </div>
                )}

                <main className="flex-1 p-4 sm:p-5">{children}</main>
            </div>
        </div>
    );
}
