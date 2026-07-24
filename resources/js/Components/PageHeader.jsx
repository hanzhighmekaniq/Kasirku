import { Head, router } from "@inertiajs/react";
import { ArrowLeft } from "lucide-react";

/**
 * PageHeader Component
 * 
 * @param {string} title - The meta `<Head title={...} />` for the page.
 * @param {Array<string>} breadcrumbs - An array of strings for breadcrumb tags, e.g., ["Katalog", "Kategori", "Tambah"]. The first one is visually highlighted.
 * @param {ReactNode} heading - The main page heading.
 * @param {string} description - The sub-description below the heading.
 * @param {string|Function} backUrl - The URL to navigate back to, or a function to call onClick. If provided, the back button is shown.
 * @param {ReactNode} action - An optional right-aligned action (e.g., "Add New" button).
 */
export default function PageHeader({
    title,
    breadcrumbs = [],
    heading,
    description,
    backUrl,
    action,
}) {
    const handleBackClick = (e) => {
        if (typeof backUrl === "function") {
            backUrl(e);
        } else if (typeof backUrl === "string") {
            router.visit(backUrl, { preserveScroll: true });
        }
    };

    return (
        <>
            {title && <Head title={title} />}

            <section className="mb-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div className="flex items-start gap-3">
                        <div>
                            {/* Breadcrumbs */}
                            {breadcrumbs && breadcrumbs.length > 0 && (
                                <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/10 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                                        {breadcrumbs[0]}
                                    </span>
                                    {breadcrumbs.slice(1).map((crumb, idx) => (
                                        <div key={idx} className="flex items-center gap-2">
                                            <span className="text-muted-foreground">·</span>
                                            <span>{crumb}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Heading */}
                            <h1 className="text-lg font-bold tracking-tighter text-foreground sm:text-3xl">
                                {heading}
                            </h1>

                            {/* Description */}
                            {description && (
                                <p className="mt-2 max-w-xl text-xs text-muted-foreground">
                                    {description}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    {action && <div>{action}</div>}
                </div>
            </section>
        </>
    );
}
