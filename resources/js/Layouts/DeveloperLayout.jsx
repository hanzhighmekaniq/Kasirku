import ApplicationLogo from "@/Components/ApplicationLogo";
import Dropdown from "@/Components/Dropdown";
import { Link, usePage } from "@inertiajs/react";
import { useState } from "react";
import { useTheme } from "@/Theme/ThemeProvider";
import {
    LayoutDashboard,
    Store,
    GitBranch,
    Users,
    Package,
    Tags,
    ShieldCheck,
    CreditCard,
    Wallet,
    Palette,
    UserCog,
    Moon,
    Sun,
    Menu,
    LogOut,
    User
} from "lucide-react";

const navItems = [
    {
        name: "Dashboard",
        href: route("developer.dashboard"),
        current: "developer.dashboard",
        icon: LayoutDashboard,
    },
    {
        name: "Kelola Toko",
        href: route("developer.stores.index"),
        current: "developer.stores.*",
        icon: Store,
    },
    {
        name: "Semua Cabang",
        href: route("developer.branches.index"),
        current: "developer.branches.*",
        icon: GitBranch,
    },
    {
        name: "Kelola User",
        href: route("developer.users.index"),
        current: "developer.users.*",
        icon: Users,
    },
    {
        name: "Paket",
        href: route("developer.plans.index"),
        current: "developer.plans.*",
        icon: Package,
    },
    {
        name: "Fitur Tipe",
        href: route("developer.type-features"),
        current: "developer.type-features",
        icon: Tags,
    },
    {
        name: "Role & Permission",
        href: route("developer.roles.index"),
        current: "developer.roles.*",
        icon: ShieldCheck,
    },
    {
        name: "Template Role",
        href: route("developer.role-templates.index"),
        current: "developer.role-templates.*",
        icon: UserCog,
    },
    {
        name: "Payment Gateway",
        href: route("developer.payment-gateway.index"),
        current: "developer.payment-gateway.*",
        icon: CreditCard,
    },
    {
        name: "Wallet Store",
        href: route("developer.wallets.index"),
        current: "developer.wallets.*",
        icon: Wallet,
    },
    {
        name: "Tema & Warna",
        href: route("developer.themes.index"),
        current: "developer.themes.*",
        icon: Palette,
    },
];

function NavItem({ item, onClick }) {
    const active = route().current(item.current);
    const Icon = item.icon;

    return (
        <Link
            href={item.href}
            onClick={onClick}
            title={item.name}
            className={`group relative flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-all
                ${active
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                    : "hover:bg-accent hover:text-accent-foreground text-sidebar-foreground"
                }`}
        >
            {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-primary-foreground/50" />
            )}
            <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md transition ${active
                    ? "text-primary-foreground"
                    : "text-sidebar-foreground/70 group-hover:text-accent-foreground"
                    }`}
            >
                <Icon className="h-[15px] w-[15px]" strokeWidth={2} />
            </span>
            <span
                className={`truncate text-[13px] transition-all font-medium ${active
                    ? "font-semibold text-primary-foreground"
                    : "text-sidebar-foreground group-hover:text-accent-foreground"
                    }`}
            >
                {item.name}
            </span>
        </Link>
    );
}

export default function DeveloperLayout({ header, children }) {
    const { auth, flash } = usePage().props;
    const user = auth?.user;
    const [mobileOpen, setMobileOpen] = useState(false);
    const { isDark, setMode } = useTheme();

    const toggleTheme = () => {
        setMode(isDark ? "light" : "dark");
    };

    const Sidebar = () => (
        <div className="flex flex-col h-full overflow-hidden border-r bg-sidebar border-border">
            {/* Brand */}
            <div className="flex h-[68px] shrink-0 items-center border-b border-border bg-sidebar px-5">
                <div className="flex items-center gap-3">
                    <div className="relative flex items-center justify-center w-10 h-10 shadow-lg shrink-0 rounded-xl bg-primary shadow-primary/30">
                        <ApplicationLogo className="w-5 h-5 text-white fill-current" />
                        <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-sidebar bg-success ring-2 ring-success/20" />
                    </div>
                    <div className="leading-tight transition-all duration-300 ease-in-out">
                        <span className="block text-[15px] font-bold tracking-tight text-sidebar-foreground whitespace-nowrap">
                            SIM-KASIR
                        </span>
                        <span className="block text-[11px] font-medium text-sidebar-foreground/60 whitespace-nowrap">
                            Developer Panel
                        </span>
                    </div>
                </div>
            </div>

            {/* Theme Toggle */}
            <div className="px-4 pt-3 pb-3 space-y-3 shrink-0 border-b border-border">
                <div className="flex items-center justify-between rounded-xl bg-muted border border-border px-3.5 py-2.5">
                    <div className="flex items-center gap-2.5">
                        <div className="flex items-center justify-center rounded-lg h-7 w-7 bg-sidebar">
                            {isDark ? (
                                <Moon className="w-4 h-4 text-sidebar-foreground" />
                            ) : (
                                <Sun className="w-4 h-4 text-warning" />
                            )}
                        </div>
                        <span className="text-sm font-medium text-sidebar-foreground/70">
                            Tema
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={toggleTheme}
                        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
                        className={`relative h-6 w-11 rounded-full transition-colors duration-300 ${isDark ? "bg-primary" : "bg-border"
                            }`}
                    >
                        <span
                            className={`absolute top-0.5 left-0.5 flex h-5 w-5 items-center justify-center rounded-full shadow-sm transition-all duration-300 ${isDark
                                ? "translate-x-5 bg-primary-foreground text-primary"
                                : "translate-x-0 bg-white text-black"
                                }`}
                        >
                            {isDark ? (
                                <Moon className="w-3.5 h-3.5" />
                            ) : (
                                <Sun className="w-3.5 h-3.5" />
                            )}
                        </span>
                    </button>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 space-y-0.5 overflow-y-auto px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <p className="mb-2 px-2 text-[11px] font-bold uppercase tracking-wider text-sidebar-foreground/50">
                    Menu Utama
                </p>
                {navItems.map((item) => (
                    <NavItem key={item.name} item={item} onClick={() => setMobileOpen(false)} />
                ))}
            </nav>

            {/* Footer */}
            <div className="shrink-0 border-t border-border px-5 py-4">
                <span className="text-[11px] text-sidebar-foreground/50 font-medium">
                    © {new Date().getFullYear()} SIM-KASIR Dev
                </span>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-background flex">
            {/* Desktop sidebar */}
            <aside className="fixed inset-y-0 left-0 z-30 hidden w-[240px] lg:block">
                <Sidebar />
            </aside>

            {/* Mobile drawer */}
            <div
                className={`fixed inset-0 z-40 lg:hidden ${mobileOpen ? "" : "pointer-events-none"}`}
            >
                <div
                    onClick={() => setMobileOpen(false)}
                    className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity ${mobileOpen ? "opacity-100" : "opacity-0"}`}
                />
                <aside
                    className={`absolute inset-y-0 left-0 w-[260px] overflow-hidden shadow-2xl transition-transform ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
                >
                    <Sidebar />
                </aside>
            </div>

            {/* Main */}
            <div className="flex min-h-screen w-full flex-col lg:pl-[240px]">
                {/* Topbar */}
                <header className="sticky top-0 z-20 flex h-[56px] items-center gap-2.5 border-b border-border bg-sidebar px-4 sm:px-6 shadow-sm">
                    {/* Mobile menu */}
                    <button
                        onClick={() => setMobileOpen(true)}
                        className="flex items-center justify-center transition-colors rounded-lg h-7 w-7 text-sidebar-foreground/60 hover:bg-muted lg:hidden"
                    >
                        <Menu className="w-4 h-4" />
                    </button>
                    <div className="h-4 w-px bg-border lg:hidden" />
                    
                    <div className="flex-1 min-w-0">
                        <div className="truncate text-[15px] font-semibold text-sidebar-foreground">
                            {header}
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-3">
                        <Dropdown>
                            <Dropdown.Trigger>
                                <button className="flex items-center gap-2 rounded-xl border border-border bg-sidebar px-2.5 py-1.5 text-sm hover:bg-muted transition-colors">
                                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-[11px] font-bold text-primary">
                                        {user?.name?.charAt(0).toUpperCase()}
                                    </span>
                                    <span className="hidden max-w-[8rem] truncate text-[13px] font-medium text-sidebar-foreground sm:block">
                                        {user?.name}
                                    </span>
                                </button>
                            </Dropdown.Trigger>
                            <Dropdown.Content align="end">
                                <Dropdown.Link href={route("developer.profile.edit")}>
                                    <span className="flex items-center gap-2">
                                        <User className="w-4 h-4" />
                                        Pengaturan Akun
                                    </span>
                                </Dropdown.Link>
                                <div className="my-1 border-t border-border" />
                                <Dropdown.Link href={route("logout")} method="post" as="button">
                                    <span className="flex items-center gap-2 text-destructive">
                                        <LogOut className="w-4 h-4" />
                                        Keluar
                                    </span>
                                </Dropdown.Link>
                            </Dropdown.Content>
                        </Dropdown>
                    </div>
                </header>

                {/* Flash Messages */}
                {flash?.success && (
                    <div className="mx-4 sm:mx-6 mt-4 rounded-xl border border-success/20 bg-success/10 px-5 py-3 text-sm text-success shadow-sm flex items-center gap-2">
                        <span className="text-lg">✅</span> {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="mx-4 sm:mx-6 mt-4 rounded-xl border border-destructive/20 bg-destructive/10 px-5 py-3 text-sm text-destructive shadow-sm flex items-center gap-2">
                        <span className="text-lg">❌</span> {flash.error}
                    </div>
                )}

                <main className="flex-1 p-4 sm:p-6">{children}</main>
            </div>
        </div>
    );
}
