const fmt = (n) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(n ?? 0);

export default function SummaryCards({ items = [] }) {
    return (
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(items.length, 4)}, 1fr)` }}>
            {items.map((item, i) => (
                <div
                    key={i}
                    className="rounded-xl border border-border bg-card p-4 shadow-sm"
                >
                    <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
                    <p className="mt-1 text-xl font-bold text-foreground">
                        {item.currency ? fmt(item.value) : (item.value ?? 0)}
                    </p>
                    {item.sub && (
                        <p className="mt-0.5 text-xs text-muted-foreground">{item.sub}</p>
                    )}
                </div>
            ))}
        </div>
    );
}
