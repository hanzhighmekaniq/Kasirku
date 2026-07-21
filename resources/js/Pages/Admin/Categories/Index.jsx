import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { useState } from "react";
import { Plus } from "lucide-react";
import Button from "@/Components/ui/Button";
import ConfirmDeleteModal from "@/Components/ConfirmDeleteModal";

export default function Index({ categories, stats = {}, filters = {} }) {
    const { flash } = usePage().props;
    const [search, setSearch] = useState(filters?.search || "");
    const [target, setTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const doSearch = (value) => {
        router.get(
            route("admin.categories.index"),
            { search: value || undefined },
            { preserveState: true, replace: true },
        );
    };

    const confirmDelete = () => {
        if (!target) return;
        setDeleting(true);
        router.delete(route("admin.categories.destroy", target.id), {
            preserveScroll: true,
            onFinish: () => {
                setDeleting(false);
                setTarget(null);
            },
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex w-full items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold text-foreground">
                        Kategori
                    </h2>
                    <Button
                        as={Link}
                        href={route("admin.categories.create")}
                        icon={Plus}
                    >
                        <span className="hidden sm:inline">
                            Tambah Kategori
                        </span>
                        <span className="sm:hidden">Tambah</span>
                    </Button>
                </div>
            }
        >
            <Head title="Kategori" />

            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                {/* Toolbar */}
                <div className=" border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            doSearch(search);
                        }}
                        className="relative w-full sm:max-w-xs"
                    >
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari kategori..."
                            className="block w-full rounded-xl border border-border py-2.5 pl-9 pr-10 text-sm shadow-sm transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                        />
                        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
                            <svg
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.8}
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                                />
                            </svg>
                        </span>
                        <button
                            type="submit"
                            className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-primary-500"
                        >
                            <svg
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.8}
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                                />
                            </svg>
                        </button>
                    </form>
                    <div className="pt-4 flex items-center ">
                        <p className="text-xs text-muted-foreground">
                            Menampilkan{" "}
                            <span className="font-semibold text-foreground">
                                {categories.data.length}
                            </span>{" "}
                            dari {categories.total} kategori
                        </p>
                    </div>
                </div>

                {categories.data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                            <svg
                                className="h-8 w-8 text-muted-foreground"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
                                />
                            </svg>
                        </div>
                        <h3 className="mt-4 text-base font-semibold text-foreground">
                            {search
                                ? "Kategori tidak ditemukan"
                                : "Belum ada kategori"}
                        </h3>
                        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                            {search
                                ? "Coba kata kunci lain."
                                : "Mulai dengan menambahkan kategori pertama untuk produk kamu."}
                        </p>
                        {!search && (
                            <Button
                                as={Link}
                                href={route("admin.categories.create")}
                                icon={Plus}
                                className="mt-5"
                            >
                                Tambah Kategori
                            </Button>
                        )}
                    </div>
                ) : (
                    <CategoryTree
                        categories={categories.data}
                        onDelete={setTarget}
                    />
                )}

                {categories.last_page > 1 && (
                    <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <span className="text-xs text-muted-foreground">
                            {categories.total} kategori • Halaman{" "}
                            {categories.current_page} dari{" "}
                            {categories.last_page}
                        </span>
                        <div className="flex items-center gap-1">
                            {categories.links?.map((link, i) => {
                                if (link.label === "...") {
                                    return (
                                        <span
                                            key={i}
                                            className="px-2 text-xs text-muted-foreground"
                                        >
                                            ...
                                        </span>
                                    );
                                }
                                return (
                                    <Link
                                        key={i}
                                        href={link.url || "#"}
                                        preserveScroll
                                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                                            link.active
                                                ? "bg-primary text-primary-foreground shadow-sm"
                                                : link.url
                                                  ? "text-muted-foreground hover:bg-muted"
                                                  : "cursor-not-allowed text-muted-foreground/50"
                                        }`}
                                        dangerouslySetInnerHTML={{
                                            __html: link.label,
                                        }}
                                    />
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            <ConfirmDeleteModal
                open={!!target}
                title="Hapus kategori?"
                description={
                    target
                        ? `Kategori "${target.name}" akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.`
                        : ""
                }
                processing={deleting}
                onConfirm={confirmDelete}
                onClose={() => !deleting && setTarget(null)}
            />
        </AuthenticatedLayout>
    );
}

function CategoryBadge({ cat }) {
    // Roots and parents with children get folder icon
    if (cat.depth === 0 || !cat.parent_id) {
        return (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500/15 to-primary-500/15 text-lg">
                📁
            </span>
        );
    }
    return (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-bold text-muted-foreground">
            {cat.name.charAt(0).toUpperCase()}
        </span>
    );
}

function RowActions({ cat, onDelete }) {
    return (
        <div className="flex items-center justify-end gap-1">
            <Link
                href={route("admin.categories.edit", cat.id)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-primary-50 hover:text-primary-600"
                title="Edit"
            >
                <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.7}
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"
                    />
                </svg>
            </Link>
            <Link
                href={`${route("admin.categories.create")}?parent_id=${cat.id}`}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-success/10 hover:text-emerald-600"
                title="Tambah Sub-Kategori"
            >
                <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 4.5v15m7.5-7.5h-15"
                    />
                </svg>
            </Link>
            <button
                onClick={() => onDelete(cat)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                title="Hapus"
            >
                <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.7}
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                    />
                </svg>
            </button>
        </div>
    );
}

function ExpandIcon({ expanded, hasChildren, onClick }) {
    if (!hasChildren) {
        return <span className="inline-block w-5 shrink-0" />;
    }
    return (
        <button
            type="button"
            onClick={onClick}
            className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground transition hover:bg-muted/70 hover:text-muted-foreground"
        >
            <svg
                className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-90" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.25 4.5l7.5 7.5-7.5 7.5"
                />
            </svg>
        </button>
    );
}

/* ── Expandable tree: desktop rows + mobile cards ────────── */
function CategoryTree({ categories, onDelete }) {
    const [expanded, setExpanded] = useState({});

    const toggle = (id) => {
        setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const expandAll = () => {
        const all = {};
        const walk = (items) => {
            items.forEach((item) => {
                if (item.has_children) all[item.id] = true;
                if (item.children) walk(item.children);
            });
        };
        walk(categories);
        setExpanded(all);
    };

    const collapseAll = () => setExpanded({});

    // Flatten visible rows based on expanded state
    const flattenVisible = (items, depth = 0, ancestorHasMore = []) => {
        const rows = [];
        items.forEach((item, index) => {
            const isLast = index === items.length - 1;
            const lines = [...ancestorHasMore, !isLast];

            rows.push({
                ...item,
                _depth: depth,
                _isLast: isLast,
                _ancestorLines: ancestorHasMore,
            });

            if (expanded[item.id] && item.children?.length) {
                rows.push(...flattenVisible(item.children, depth + 1, lines));
            }
        });
        return rows;
    };

    const visible = flattenVisible(categories);

    return (
        <>
            {/* Expand/collapse all buttons */}
            {categories.length > 0 &&
                categories.some((c) => c.has_children) && (
                    <div className="flex items-center gap-2 border-b border-border px-4 py-2">
                        <button
                            onClick={expandAll}
                            className="text-xs text-primary-600 hover:text-primary-800 font-medium"
                        >
                            Expand Semua
                        </button>
                        <span className="text-muted-foreground/50">|</span>
                        <button
                            onClick={collapseAll}
                            className="text-xs text-primary-600 hover:text-primary-800 font-medium"
                        >
                            Collapse Semua
                        </button>
                        <span className="ml-auto text-xs text-muted-foreground">
                            {
                                Object.keys(expanded).filter((k) => expanded[k])
                                    .length
                            }{" "}
                            grup terbuka
                        </span>
                    </div>
                )}

            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-border bg-muted/50 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            <th className="px-4 py-3.5">Nama</th>
                            <th className="px-4 py-3.5">Path</th>
                            <th className="px-4 py-3.5 text-center w-24">
                                Produk
                            </th>
                            <th className="px-4 py-3.5 text-right w-24">
                                Aksi
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {visible.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={4}
                                    className="px-4 py-16 text-center text-muted-foreground"
                                >
                                    Belum ada kategori
                                </td>
                            </tr>
                        ) : (
                            visible.map((cat) => (
                                <CategoryRow
                                    key={cat.id}
                                    cat={cat}
                                    depth={cat._depth}
                                    isExpanded={expanded[cat.id] || false}
                                    onToggle={() => toggle(cat.id)}
                                    onDelete={onDelete}
                                />
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile cards */}
            <div className="divide-y divide-border md:hidden">
                {visible.length === 0 ? (
                    <div className="px-4 py-16 text-center text-muted-foreground">
                        Belum ada kategori
                    </div>
                ) : (
                    visible.map((cat) => (
                        <div
                            key={cat.id}
                            className={`flex items-start gap-3 p-4 ${cat._depth === 0 && !cat.parent_id ? "bg-muted/50" : ""}`}
                        >
                            {cat._depth > 0 && (
                                <span className="mt-0.5 shrink-0 select-none">
                                    {cat._ancestorLines?.map((hasMore, d) => (
                                        <span
                                            key={`m-anc-${d}`}
                                            className="font-mono text-xs text-muted-foreground/50"
                                        >
                                            {hasMore ? "│" : " "}
                                        </span>
                                    ))}
                                    <span
                                        key="m-branch"
                                        className="font-mono text-xs text-muted-foreground"
                                    >
                                        {cat._isLast ? "└" : "├"}
                                    </span>
                                </span>
                            )}
                            <ExpandIcon
                                expanded={expanded[cat.id] || false}
                                hasChildren={cat.has_children}
                                onClick={() => toggle(cat.id)}
                            />
                            <CategoryBadge
                                cat={{ ...cat, depth: cat._depth }}
                            />
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <p
                                        className={`truncate ${cat._depth === 0 ? "font-semibold text-foreground" : "font-medium text-foreground"}`}
                                    >
                                        {cat.name}
                                    </p>
                                    {cat.has_children && (
                                        <span className="shrink-0 rounded-full bg-primary-100 px-1.5 py-0.5 text-[10px] font-semibold text-primary-600">
                                            +
                                            {cat.total_products -
                                                (cat.products_count || 0)}
                                        </span>
                                    )}
                                </div>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                    {cat.path || cat.name}
                                </p>
                                <span
                                    className={`mt-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                        cat._depth === 0
                                            ? "bg-primary-100 text-primary-700"
                                            : "bg-muted text-muted-foreground"
                                    }`}
                                >
                                    {cat.total_products} produk
                                </span>
                            </div>
                            <RowActions cat={cat} onDelete={onDelete} />
                        </div>
                    ))
                )}
            </div>
        </>
    );
}

function CategoryRow({ cat, depth = 0, isExpanded, onToggle, onDelete }) {
    const indent = depth * 24;

    // Build tree line prefix like "│  │  ├── " or "│     └── "
    const treePrefix = [];
    if (depth > 0) {
        // Render ancestor lines
        if (cat._ancestorLines) {
            for (let d = 0; d < cat._ancestorLines.length; d++) {
                treePrefix.push(
                    <span
                        key={`anc-${d}`}
                        className={`inline-block w-6 text-center font-mono text-xs ${cat._ancestorLines[d] ? "text-muted-foreground/50" : "text-transparent"}`}
                    >
                        {cat._ancestorLines[d] ? "│" : " "}
                    </span>,
                );
            }
        }
        // Branch connector
        treePrefix.push(
            <span
                key="branch"
                className={`inline-block w-6 text-center font-mono text-xs ${cat._isLast ? "text-muted-foreground" : "text-muted-foreground/50"}`}
            >
                {cat._isLast ? "└" : "├"}
            </span>,
        );
    }

    return (
        <tr
            className={`transition hover:bg-muted/70 ${depth === 0 ? "bg-muted/80" : ""}`}
        >
            <td className="px-4 py-3">
                <div className="flex items-center gap-1">
                    {/* Tree connector lines */}
                    {depth > 0 && (
                        <span
                            className="inline-flex shrink-0 select-none items-center"
                            style={{ paddingLeft: 0 }}
                        >
                            {treePrefix}
                        </span>
                    )}
                    <ExpandIcon
                        expanded={isExpanded}
                        hasChildren={cat.has_children}
                        onClick={onToggle}
                    />
                    <CategoryBadge cat={{ ...cat, depth }} />
                    <span
                        className={
                            depth === 0
                                ? "font-semibold text-foreground"
                                : "text-foreground"
                        }
                    >
                        {cat.name}
                    </span>
                    {cat.has_children && !isExpanded && (
                        <span className="rounded-full bg-primary-100 px-1.5 py-0.5 text-[10px] font-semibold text-primary-600">
                            {cat.children?.length ?? 0}
                        </span>
                    )}
                    {cat.has_children && isExpanded && (
                        <span className="text-[10px] text-muted-foreground">
                            ({cat.children?.length ?? 0} sub)
                        </span>
                    )}
                </div>
            </td>
            <td className="px-4 py-3">
                <span
                    className={`text-xs ${depth === 0 ? "text-muted-foreground" : "text-muted-foreground"}`}
                >
                    {cat.path || cat.name}
                </span>
            </td>
            <td className="px-4 py-3 text-center">
                <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        depth === 0
                            ? "bg-primary-100 text-primary-700"
                            : "bg-muted text-muted-foreground"
                    }`}
                >
                    {cat.total_products}
                </span>
            </td>
            <td className="px-4 py-3">
                <RowActions cat={cat} onDelete={onDelete} />
            </td>
        </tr>
    );
}
