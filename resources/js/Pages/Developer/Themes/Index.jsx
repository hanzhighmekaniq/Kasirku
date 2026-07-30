import DeveloperLayout from "@/Layouts/DeveloperLayout";
import ConfirmDeleteModal from "@/Components/ConfirmDeleteModal";
import { useTheme } from "@/Theme/ThemeProvider";
import { Head, Link, router, usePage } from "@inertiajs/react";
import {
    Check,
    Eye,
    Monitor,
    Moon,
    Palette,
    Pencil,
    Plus,
    Sun,
    Trash2,
    X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import ThemePreview from "@/Pages/Admin/Themes/ThemePreview";

const SWATCH_KEYS = ["primary", "background", "card", "accent", "muted"];

const MODE_OPTIONS = [
    { value: "light", label: "Terang", Icon: Sun },
    { value: "dark", label: "Gelap", Icon: Moon },
    { value: "system", label: "Ikut Sistem", Icon: Monitor },
];

/** Swatch kecil dengan tooltip hex. */
function Swatch({ label, hex }) {
    return (
        <div className="group/swatch relative">
            <div
                className="h-5 w-5 rounded-md border border-border transition-transform hover:scale-110"
                style={{ background: hex }}
            />
            <div className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-foreground px-2 py-1 text-[10px] font-medium text-background opacity-0 shadow-lg transition-opacity group-hover/swatch:opacity-100">
                {label}
                <span className="ml-1.5 text-background/60">{hex}</span>
            </div>
        </div>
    );
}

/** Kartu tema — preset sistem maupun tema custom developer. */
function ThemeCard({
    theme,
    active,
    isDark,
    onActivate,
    onEdit,
    onDelete,
    onPreview,
}) {
    const tokens = isDark ? theme.dark : theme.light;
    const isSystem = theme._type === "system";

    return (
        <div
            className={`group/card flex flex-col rounded-xl border bg-card transition-all duration-200 ${
                active
                    ? "border-primary/50 shadow-md shadow-primary/5"
                    : "border-border hover:border-muted-foreground/30"
            }`}
        >
            <div className="flex items-start justify-between gap-3 p-4 pb-0">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-sm font-semibold tracking-tight text-foreground">
                            {theme.name}
                        </span>
                        {active && (
                            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                                Aktif
                            </span>
                        )}
                        <span
                            className={`inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
                                isSystem
                                    ? "bg-muted text-muted-foreground"
                                    : "bg-primary/10 text-primary"
                            }`}
                        >
                            {isSystem ? "Sistem" : "Custom"}
                        </span>
                    </div>
                    <p className="mt-1 line-clamp-1 text-[11px] text-muted-foreground">
                        {theme.description || "Tanpa deskripsi"}
                    </p>
                </div>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted">
                    {isDark ? (
                        <Moon className="h-[15px] w-[15px] text-foreground" />
                    ) : (
                        <Sun className="h-[15px] w-[15px] text-foreground" />
                    )}
                </div>
            </div>

            <div className="px-4 pt-3">
                <ThemePreview tokens={tokens} isDark={isDark} compact />
            </div>

            <div className="flex items-center justify-between px-4 pt-3">
                <div className="flex items-center gap-1.5">
                    {SWATCH_KEYS.map((key) => (
                        <Swatch
                            key={key}
                            label={key.charAt(0).toUpperCase() + key.slice(1)}
                            hex={tokens?.[key] || "#cccccc"}
                        />
                    ))}
                </div>
                <span className="text-[10px] text-muted-foreground/60">
                    {isDark ? "Mode gelap" : "Mode terang"}
                </span>
            </div>

            <div className="mt-4 flex items-center gap-2 border-t border-border px-4 py-3">
                <button
                    type="button"
                    onClick={onPreview}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-[11px] font-medium text-foreground transition hover:bg-muted"
                >
                    <Eye className="h-3 w-3" /> Preview
                </button>
                {onEdit && (
                    <Link
                        href={onEdit}
                        className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-[11px] font-medium text-foreground transition hover:bg-muted"
                    >
                        <Pencil className="h-3 w-3" /> Edit
                    </Link>
                )}
                {onDelete && (
                    <button
                        type="button"
                        onClick={onDelete}
                        className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-medium text-destructive transition hover:bg-destructive/10"
                    >
                        <Trash2 className="h-3 w-3" /> Hapus
                    </button>
                )}
                <div className="ml-auto">
                    {active ? (
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-3 py-1.5 text-[11px] font-semibold text-muted-foreground">
                            <Check className="h-3 w-3" /> Terpakai
                        </span>
                    ) : (
                        <button
                            type="button"
                            onClick={onActivate}
                            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[11px] font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
                        >
                            <Check className="h-3 w-3" /> Aktifkan
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

/** Kartu dashed untuk membuat tema baru. */
function CreateCard() {
    return (
        <Link
            href={route("developer.themes.create")}
            className="flex min-h-[340px] flex-col items-center justify-center rounded-xl border border-dashed border-border p-6 text-center transition-all hover:border-muted-foreground/40 hover:bg-muted/30"
        >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-muted">
                <Plus className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-sm font-semibold text-foreground">
                Buat tema baru
            </div>
            <div className="mt-1.5 max-w-[260px] text-xs text-muted-foreground">
                Susun palet warna sendiri dengan 36 token, lengkap untuk mode
                terang dan gelap.
            </div>
        </Link>
    );
}

/** Modal preview tema ukuran penuh. */
function PreviewModal({ theme, isDark, onClose }) {
    useEffect(() => {
        const onKey = (e) => e.key === "Escape" && onClose();
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [onClose]);

    if (!theme) return null;

    const tokens = isDark ? theme.dark : theme.light;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className="relative w-full max-w-[880px] overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-2xl">
                <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
                    <div>
                        <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                            Preview Tema
                        </div>
                        <div className="mt-0.5 text-sm font-semibold text-foreground">
                            {theme.name} · {isDark ? "Gelap" : "Terang"}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <div className="p-5">
                    <ThemePreview tokens={tokens} isDark={isDark} />
                </div>
            </div>
        </div>
    );
}

export default function Index({ userThemes = [] }) {
    const { errors } = usePage().props;
    const {
        preference,
        isDark,
        templates: systemTemplates,
        setTemplate,
        setMode,
        setCustomTokens,
    } = useTheme();

    const [previewTarget, setPreviewTarget] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const allThemes = useMemo(() => {
        const system = (systemTemplates || []).map((tpl) => ({
            ...tpl,
            _type: "system",
            _rawId: tpl.id,
        }));
        const custom = (userThemes || []).map((theme) => ({
            id: theme.id,
            name: theme.name,
            description: theme.description,
            light: theme.light_tokens || {},
            dark: theme.dark_tokens || {},
            _type: "user",
            _rawId: theme.id,
            _primary: (theme.light_tokens || {}).primary,
            _accent: (theme.light_tokens || {}).accent,
        }));
        return [...system, ...custom];
    }, [systemTemplates, userThemes]);

    const isActive = useCallback(
        (theme) => {
            if (theme._type === "system") {
                return preference.templateId === theme._rawId;
            }
            return (
                preference.templateId === "custom" &&
                preference.customTokens?.light?.primary === theme._primary &&
                preference.customTokens?.light?.accent === theme._accent
            );
        },
        [preference],
    );

    const handleActivate = (theme) => {
        if (theme._type === "system") {
            setTemplate(theme._rawId);
        } else {
            setCustomTokens({ light: theme.light, dark: theme.dark });
        }
    };

    const confirmDelete = () => {
        if (!deleteTarget) return;
        setDeleting(true);
        router.delete(route("developer.themes.destroy", deleteTarget._rawId), {
            preserveScroll: true,
            onFinish: () => {
                setDeleting(false);
                setDeleteTarget(null);
            },
        });
    };

    const customCount = allThemes.filter((t) => t._type === "user").length;
    const systemCount = allThemes.length - customCount;

    return (
        <DeveloperLayout header="Tema & Warna">
            <Head title="Tema & Warna" />

            {errors?.theme && (
                <div className="mb-5 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {errors.theme}
                </div>
            )}

            {/* Mode tampilan */}
            <div className="mb-5 rounded-2xl border border-border bg-card p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                            <Palette
                                className="h-5 w-5 text-primary"
                                strokeWidth={1.8}
                            />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-foreground">
                                Mode Tampilan
                            </h3>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                Pilihan ini tersimpan di akun kamu dan berlaku
                                di semua perangkat.
                            </p>
                        </div>
                    </div>
                    <div className="inline-flex rounded-xl border border-border bg-muted p-0.5">
                        {MODE_OPTIONS.map(({ value, label, Icon }) => (
                            <button
                                key={value}
                                type="button"
                                onClick={() => setMode(value)}
                                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition ${
                                    preference.mode === value
                                        ? "bg-card text-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                <Icon className="h-3.5 w-3.5" />
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Ringkasan */}
            <div className="mb-6 flex flex-wrap items-center gap-4 border-y border-border py-3 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">
                    {allThemes.length} tema
                </span>
                <span className="text-muted-foreground/40">·</span>
                <span>{systemCount} preset sistem</span>
                <span>{customCount} tema custom</span>
                <span className="text-muted-foreground/40">·</span>
                <span>
                    Sedang tampil:{" "}
                    <span className="font-medium text-foreground">
                        {isDark ? "gelap" : "terang"}
                    </span>
                </span>
            </div>

            {/* Grid tema */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
                {allThemes.map((theme) => (
                    <ThemeCard
                        key={`${theme._type}-${theme._rawId}`}
                        theme={theme}
                        active={isActive(theme)}
                        isDark={isDark}
                        onActivate={() => handleActivate(theme)}
                        onEdit={
                            theme._type === "user"
                                ? route("developer.themes.edit", theme._rawId)
                                : null
                        }
                        onDelete={
                            theme._type === "user"
                                ? () => setDeleteTarget(theme)
                                : null
                        }
                        onPreview={() => setPreviewTarget(theme)}
                    />
                ))}
                <CreateCard />
            </div>

            <PreviewModal
                theme={previewTarget}
                isDark={isDark}
                onClose={() => setPreviewTarget(null)}
            />

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
        </DeveloperLayout>
    );
}
