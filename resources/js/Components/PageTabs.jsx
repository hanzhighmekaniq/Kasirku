import { Link } from '@inertiajs/react';

export default function PageTabs({ tabs }) {
    return (
        <div className="mb-6 flex space-x-1 rounded-xl bg-muted/50 p-1 shadow-sm border border-border overflow-x-auto">
            {tabs.map((tab) => {
                const isActive = tab.active;
                return (
                    <Link
                        key={tab.name}
                        href={tab.href}
                        className={`
                            flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all whitespace-nowrap
                            ${isActive
                                ? 'bg-card text-foreground shadow-sm ring-1 ring-border/50'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            }
                        `}
                    >
                        {tab.icon && <span className="shrink-0">{tab.icon}</span>}
                        {tab.name}
                    </Link>
                );
            })}
        </div>
    );
}
