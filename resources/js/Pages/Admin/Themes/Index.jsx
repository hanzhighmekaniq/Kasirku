import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader";
import { useTheme } from "@/Theme/ThemeProvider";
import { Head, Link, router, usePage } from "@inertiajs/react";
import {
    Check,
    Eye,
    Moon,
    Palette,
    Pencil,
    Plus,
    Sun,
    Trash2,
    X,
} from "lucide-react";
import { useMemo, useState, useEffect, useCallback } from "react";
import ConfirmDeleteModal from "@/Components/ConfirmDeleteModal";
import ThemePreview from "./ThemePreview";

const SWATCH_KEYS = ["primary", "background", "card", "accent", "muted"];

/* ── Tooltip swatch (shows hex on hover) ── */
function Swatch({ label, hex }) {
    return (
        <div className="group/swatch relative">
            <div
                className="h-5 w-5 rounded-md border border-white/10 transition-transform hover:scale-110"
                style={{ background: hex }}
            />
            <div className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-foreground px-2 py-1 text-[10px] font-medium text-background opacity-0 shadow-lg transition-opacity group-hover/swatch:opacity-100">
                {label}
                <span className="ml-1.5 text-background/60">{hex}</span>
            </div>
        </div>
    );
}

/* ── Mini preview renderer (compact dashboard mock) ── */
function MiniPreview({ tokens, small = true }) {
    const t = tokens;
    const h = small ? 160 : 300;

    return (
        <div
            className="overflow-hidden rounded-lg border"
            style={{
                background: t.background || "#fff",
                borderColor: t.border || "#e2e8f0",
            }}
        >
            <div style={{ display: "flex", height: h }}>
                {/* Sidebar */}
                <div
                    style={{
                        width: small ? 54 : 80,
                        background: t.sidebar || t.card || "#fff",
                        borderRight: `1px solid ${t.border || "#e2e8f0"}`,
                        padding: small ? 8 : 12,
                        display: "flex",
                        flexDirection: "column",
                        gap: small ? 6 : 8,
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                        }}
                    >
                        <div
                            style={{
                                width: small ? 10 : 14,
                                height: small ? 10 : 14,
                                borderRadius: 4,
                                background: t.primary || "#4F46E5",
                            }}
                        />
                        {!small && (
                            <div
                                style={{
                                    height: 6,
                                    flex: 1,
                                    borderRadius: 2,
                                    background:
                                        t.sidebarForeground ||
                                        t.foreground ||
                                        "#0f172a",
                                    opacity: 0.8,
                                }}
                            />
                        )}
                    </div>
                    <div
                        style={{
                            height: small ? 5 : 7,
                            borderRadius: 3,
                            background: t.primary || "#4F46E5",
                            opacity: 0.15,
                        }}
                    />
                    <div
                        style={{
                            height: 4,
                            borderRadius: 3,
                            background:
                                t.sidebarForeground ||
                                t.foreground ||
                                "#0f172a",
                            opacity: 0.15,
                            width: "80%",
                        }}
                    />
                    <div
                        style={{
                            height: 4,
                            borderRadius: 3,
                            background:
                                t.sidebarForeground ||
                                t.foreground ||
                                "#0f172a",
                            opacity: 0.15,
                            width: "65%",
                        }}
                    />
                    <div
                        style={{
                            marginTop: "auto",
                            height: 4,
                            borderRadius: 3,
                            background:
                                t.sidebarForeground ||
                                t.foreground ||
                                "#0f172a",
                            opacity: 0.1,
                            width: "60%",
                        }}
                    />
                </div>

                {/* Main */}
                <div
                    style={{
                        flex: 1,
                        padding: small ? 8 : 12,
                        display: "flex",
                        flexDirection: "column",
                        gap: small ? 6 : 10,
                        minWidth: 0,
                    }}
                >
                    {/* Topbar */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                        }}
                    >
                        <div
                            style={{
                                height: small ? 5 : 7,
                                width: small ? 60 : 90,
                                borderRadius: 2,
                                background: t.foreground || "#0f172a",
                                opacity: 0.85,
                            }}
                        />
                        <div
                            style={{
                                marginLeft: "auto",
                                height: small ? 14 : 20,
                                width: small ? 40 : 60,
                                borderRadius: 4,
                                background: t.input || t.card || "#f1f5f9",
                                border: `1px solid ${t.border || "#e2e8f0"}`,
                            }}
                        />
                        <div
                            style={{
                                height: small ? 14 : 20,
                                padding: `0 ${small ? 6 : 8}px`,
                                display: "inline-flex",
                                alignItems: "center",
                                borderRadius: 4,
                                background: t.primary || "#4F46E5",
                                color: t.primaryForeground || "#fff",
                                fontSize: small ? 7 : 9,
                                fontWeight: 600,
                            }}
                        >
                            Action
                        </div>
                    </div>

                    {/* Cards row */}
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: small ? 5 : 8,
                        }}
                    >
                        {[
                            { l: "Revenue", v: "Rp 24.8k" },
                            { l: "Users", v: "1,204" },
                        ].map(({ l, v }) => (
                            <div
                                key={l}
                                style={{
                                    background: t.card || "#fff",
                                    color: t.cardForeground || "#0f172a",
                                    border: `1px solid ${t.border || "#e2e8f0"}`,
                                    borderRadius: 6,
                                    padding: small ? "5px 6px" : "8px 10px",
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: small ? 6 : 8,
                                        color:
                                            t.mutedForeground || "#64748b",
                                        fontWeight: 500,
                                    }}
                                >
                                    {l}
                                </div>
                                <div
                                    style={{
                                        fontSize: small ? 9 : 12,
                                        fontWeight: 600,
                                        marginTop: 1,
                                    }}
                                >
                                    {v}
                                </div>
                                <div
                                    style={{
                                        display: "inline-block",
                                        marginTop: small ? 3 : 5,
                                        padding: "1px 4px",
                                        borderRadius: 3,
                                        background:
                                            t.accent ||
                                            (t.primary || "#4F46E5") + "1a",
                                        color:
                                            t.accentForeground ||
                                            t.primary ||
                                            "#4F46E5",
                                        fontSize: small ? 6 : 8,
                                        fontWeight: 600,
                                    }}
                                >
                                    +12%
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* List */}
                    <div
                        style={{
                            background: t.card || "#fff",
                            border: `1px solid ${t.border || "#e2e8f0"}`,
                            borderRadius: 6,
                            padding: small ? 5 : 8,
                            flex: 1,
                            display: "flex",
                            flexDirection: "column",
                            gap: small ? 4 : 6,
                        }}
                    >
                        {[0, 1, 2].map((i) => (
                            <div
                                key={i}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: small ? 4 : 6,
                                }}
                            >
                                <div
                                    style={{
                                        width: small ? 10 : 14,
                                        height: small ? 10 : 14,
                                        borderRadius: 9999,
                                        background: t.primary || "#4F46E5",
                                        opacity: 0.9 - i * 0.2,
                                    }}
                                />
                                <div
                                    style={{
                                        flex: 1,
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 2,
                                    }}
                                >
                                    <div
                                        style={{
                                            height: small ? 3 : 5,
                                            width: `${55 + i * 10}%`,
                                            background:
                                                t.foreground || "#0f172a",
                                            opacity: 0.8,
                                            borderRadius: 2,
                                        }}
                                    />
                                    <div
                                        style={{
                                            height: small ? 2.5 : 4,
                                            width: `${35 + i * 5}%`,
                                            background:
                                                t.mutedForeground || "#64748b",
                                            opacity: 0.5,
                                            borderRadius: 2,
                                        }}
                                    />
                                </div>
                                <div
                                    style={{
                                        padding: "1px 4px",
                                        borderRadius: 3,
                                        background:
                                            t.accent ||
                                            (t.primary || "#4F46E5") + "1a",
                                        color:
                                            t.accentForeground ||
                                            t.primary ||
                                            "#4F46E5",
                                        fontSize: small ? 6 : 8,
                                        fontWeight: 600,
                                    }}
                                >
                                    Live
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ── Theme Card ── */
function ThemeCard({
    theme: t,
    active,
    isDark,
    onActivate,
    onEdit,
    onDelete,
    onPreview,
}) {
    const tokens = isDark ? t.dark : t.light;

    return (
        <div
            className={`group/card relative flex flex-col rounded-xl border bg-card transition-all duration-200 ${active
                ? "border-primary/50 shadow-md shadow-primary/5"
                : "border-border hover:border-border"
                }`}
        >
            {/* Card header */}
            <div className="flex items-start justify-between p-4 pb-0">
                <div className="flex items-center gap-3">
                    <div
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border"
                        style={{
                            background: isDark
                                ? "linear-gradient(180deg, var(--card), var(--background))"
                                : "linear-gradient(180deg, #FAFAFA, #EEE)",
                        }}
                    >
                        {isDark ? (
                            <Moon size={15} className="text-foreground" />
                        ) : (
                            <Sun size={15} className="text-foreground" />
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold tracking-tight text-foreground">
                                {t.name}
                            </span>
                            {active && (
                                <span className="inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                                    <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-sm shadow-primary/30" />
                                    Active
                                </span>
                            )}
                        </div>
                        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                            <span className="inline-flex items-center rounded-md border border-border px-1.5 py-0.5 text-[10px] font-medium">
                                {isDark ? "Dark" : "Light"}
                            </span>
                            <span className="text-muted-foreground/60">
                                36 tokens
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mini preview */}
            <div className="px-4 pt-3">
                <MiniPreview tokens={tokens} small />
            </div>

            {/* Swatches */}
            <div className="flex items-center justify-between px-4 pt-3">
                <div className="flex items-center gap-1.5">
                    {SWATCH_KEYS.map((k) => (
                        <Swatch
                            key={k}
                            label={k.charAt(0).toUpperCase() + k.slice(1)}
                            hex={tokens?.[k] || "#ccc"}
                        />
                    ))}
                </div>
                <span className="text-[10px] text-muted-foreground/60">
                    {isDark
                        ? "Neutral \u00b7 Low glare"
                        : "Bright \u00b7 High contrast"}
                </span>
            </div>

            {/* Footer */}
            <div className="mt-4 flex items-center gap-2 border-t border-border px-4 py-3">
                <button
                    type="button"
                    onClick={onPreview}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-[11px] font-medium text-foreground transition hover:bg-muted"
                >
                    <Eye size={12} /> Preview
                </button>
                {onEdit && (
                    <Link
                        href={onEdit}
                        className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-[11px] font-medium text-foreground transition hover:bg-muted"
                    >
                        <Pencil size={12} /> Edit Theme
                    </Link>
                )}
                <div className="ml-auto">
                    {!active ? (
                        <button
                            type="button"
                            onClick={onActivate}
                            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[11px] font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
                        >
                            <Check size={12} /> Aktifkan
                        </button>
                    ) : (
                        onDelete && (
                            <button
                                type="button"
                                onClick={onDelete}
                                className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-medium text-destructive transition hover:bg-destructive/10"
                            >
                                <Trash2 size={12} /> Hapus
                            </button>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}

/* ── Dashed "Create new theme" card ── */
function CreateCard() {
    return (
        <Link
            href={route("admin.themes.create")}
            className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-transparent p-6 text-center transition-all hover:border-border hover:bg-muted/30"
            style={{ minHeight: 340 }}
        >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-muted">
                <Plus size={16} className="text-muted-foreground" />
            </div>
            <div className="text-sm font-semibold text-foreground">
                Create new theme
            </div>
            <div className="mt-1.5 max-w-[260px] text-xs text-muted-foreground">
                Build a custom color system for your application. Start from
                scratch or duplicate an existing theme.
            </div>
        </Link>
    );
}

/* ── Preview Modal ── */
function PreviewModal({ theme: t, isDark, onClose }) {
    useEffect(() => {
        const onKey = (e) => e.key === "Escape" && onClose();
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [onClose]);

    if (!t) return null;

    const tokens = isDark ? t.dark : t.light;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className="relative w-full max-w-[880px] overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
                <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
                    <div>
                        <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                            Theme Preview
                        </div>
                        <div className="mt-0.5 text-sm font-semibold text-foreground">
                            {t.name} &middot; {isDark ? "Dark" : "Light"}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    >
                        <X size={16} />
                    </button>
                </div>
                <div className="p-5">
                    <ThemePreview tokens={tokens} isDark={isDark} />
                </div>
            </div>
        </div>
    );
}

/* ── Page ── */
export default function Index({ userThemes = [] }) {
    const { flash } = usePage().props;
    const {
        preference,
        theme: activeTheme,
        isDark,
        setTemplate,
        setCustomTokens,
        templates: systemTemplates,
    } = useTheme();

    const [previewTarget, setPreviewTarget] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    // Merge system + user themes into one flat list
    const allThemes = useMemo(() => {
        const system = (systemTemplates || []).map((tpl) => ({
            ...tpl,
            _type: "system",
            _rawId: tpl.id, // slug for setTemplate
        }));
        const user = (userThemes || []).map((u) => ({
            id: u.id,
            name: u.name,
            description: u.description,
            light: u.light_tokens || {},
            dark: u.dark_tokens || {},
            _type: "user",
            _rawId: u.id, // numeric ID for setCustomTokens
            _primary: (u.light_tokens || {}).primary,
            _accent: (u.light_tokens || {}).accent,
        }));
        return [...system, ...user];
    }, [systemTemplates, userThemes]);

    // Count stats
    const lightCount = allThemes.filter(
        (t) => t.light && t.light.background,
    ).length;
    const darkCount = allThemes.filter(
        (t) => t.dark && t.dark.background,
    ).length;

    // Active check
    const isActive = useCallback(
        (t) => {
            if (t._type === "system") {
                return (
                    preference.templateId === t._rawId &&
                    preference.templateId !== "custom"
                );
            }
            // User theme: match primary+accent in customTokens
            return (
                preference.templateId === "custom" &&
                preference.customTokens?.light?.primary === t._primary &&
                preference.customTokens?.light?.accent === t._accent
            );
        },
        [preference],
    );

    const handleActivate = (t) => {
        if (t._type === "system") {
            setTemplate(t._rawId);
        } else {
            setCustomTokens({ light: t.light, dark: t.dark });
        }
    };

    const confirmDelete = () => {
        if (!deleteTarget) return;
        setDeleting(true);
        router.delete(route("admin.themes.destroy", deleteTarget._rawId), {
            preserveScroll: true,
            onFinish: () => {
                setDeleting(false);
                setDeleteTarget(null);
            },
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="leading-tight">
                    <div className="text-sm font-semibold text-foreground">
                        Manajemen Tema
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                        Tema & Warna
                    </div>
                </div>
            }
        >
            <Head title="Manajemen Tema" />

            <PageHeader
                title="Manajemen Tema"
                breadcrumbs={["Admin", "Sistem", "Tema"]}
                heading={
                    <>
                        <span className="bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
                            Manajemen Tema
                        </span>
                    </>
                }
                description="Kelola tampilan visual aplikasi dengan tema dan skema warna pilihan."
            />

            {flash?.success && (
                <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {flash.success}
                </div>
            )}

            {/* Info bar */}
            <div className="mb-6 flex items-center gap-4 border-y border-border py-3 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">
                    {allThemes.length} Themes
                </span>
                <span className="text-muted-foreground/40">&middot;</span>
                <span className="inline-flex items-center gap-1.5">
                    <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: "#F59E0B" }}
                    />
                    {lightCount} Light
                </span>
                <span className="inline-flex items-center gap-1.5">
                    <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: "#7C8794" }}
                    />
                    {darkCount} Dark
                </span>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                {allThemes.map((t) => (
                    <ThemeCard
                        key={`${t._type}-${t._rawId}`}
                        theme={t}
                        active={isActive(t)}
                        isDark={isDark}
                        onActivate={() => handleActivate(t)}
                        onEdit={
                            t._type === "user"
                                ? route("admin.themes.edit", t._rawId)
                                : null
                        }
                        onDelete={
                            t._type === "user"
                                ? () => setDeleteTarget(t)
                                : null
                        }
                        onPreview={() => setPreviewTarget(t)}
                    />
                ))}
                <CreateCard />
            </div>

            {/* Preview modal */}
            <PreviewModal
                theme={previewTarget}
                isDark={isDark}
                onClose={() => setPreviewTarget(null)}
            />

            {/* Delete confirmation */}
            <ConfirmDeleteModal
                open={!!deleteTarget}
                title="Hapus tema?"
                description={
                    deleteTarget
                        ? `Tema "${deleteTarget.name}" akan dihapus permanen.`
                        : ""
                }
                processing={deleting}
                onConfirm={confirmDelete}
                onClose={() => !deleting && setDeleteTarget(null)}
            />
        </AuthenticatedLayout>
    );
}
