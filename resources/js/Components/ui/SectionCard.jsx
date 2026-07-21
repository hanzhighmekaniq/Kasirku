/**
 * Reusable card section with title + optional subtitle.
 * Used in Create/Edit/Show forms across the app.
 */
export default function SectionCard({ title, subtitle, children }) {
    return (
        <div className="rounded-2xl border border-border bg-card text-card-foreground shadow-sm">
            <div className="border-b border-border bg-muted/60 px-6 py-5">
                <h3 className="text-base font-semibold text-card-foreground">
                    {title}
                </h3>
                {subtitle && (
                    <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
                )}
            </div>
            <div className="p-6">{children}</div>
        </div>
    );
}
