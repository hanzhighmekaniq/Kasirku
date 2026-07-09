/**
 * Reusable card section with title + optional subtitle.
 * Used in Create/Edit/Show forms across the app.
 */
export default function SectionCard({ title, subtitle, children }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-5">
                <h3 className="text-base font-semibold text-slate-900">
                    {title}
                </h3>
                {subtitle && (
                    <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>
                )}
            </div>
            <div className="p-6">{children}</div>
        </div>
    );
}
