import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { generateColorScale } from "@/Theme/generateShades";
import { useTheme } from "@/Theme/ThemeProvider";
import { Head, Link, router, usePage } from "@inertiajs/react";
import {
    Check,
    Eye,
    Laptop,
    LayoutDashboard,
    Monitor,
    Moon,
    Palette,
    Pencil,
    Plus,
    Receipt,
    Sun,
    Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import PreviewDashboard from "./PreviewDashboard";
import PreviewPOS from "./PreviewPOS";
import PreviewInvoice from "./PreviewInvoice";

const PREVIEW_TABS = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { key: "pos", label: "POS", icon: Monitor },
    { key: "invoice", label: "Invoice", icon: Receipt },
];

const MODE_OPTIONS = [
    { key: "light", label: "Terang", icon: Sun },
    { key: "dark", label: "Gelap", icon: Moon },
    { key: "system", label: "Sistem", icon: Laptop },
];

/* ── Kartu Template Sistem (dari database via seeder) ── */
function SystemCard({ tpl, active, onSelect }) {
    // Setiap kartu render sesuai identitas mode aslinya (recommendedMode),
    // BUKAN mode aktif user — supaya semua template tampil konsisten
    // dalam satu galeri gabungan, apapun mode yang user pilih saat ini.
    const isDarkTemplate = tpl.recommendedMode === "dark";
    const tokens = isDarkTemplate ? tpl.dark : tpl.light;

    return (
        <button
            type="button"
            onClick={onSelect}
            className={`group relative flex flex-col gap-2.5 rounded-xl border-2 p-3 text-left transition-all duration-200 ${
                active
                    ? "border-primary-500 bg-primary-50/60 shadow-md shadow-primary-500/10 ring-1 ring-primary-500/20"
                    : "border-slate-200 bg-white hover:border-primary-300 hover:shadow-sm"
            }`}
        >
            {active && (
                <span className="absolute right-2.5 top-2.5 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-white shadow-sm">
                    <Check size={12} strokeWidth={3} />
                </span>
            )}

            <div
                className="flex h-14 w-full items-end justify-between overflow-hidden rounded-lg p-2"
                style={{
                    background: isDarkTemplate
                        ? tokens.background
                        : `linear-gradient(135deg, ${tokens.primary}, ${tokens.accent})`,
                }}
            >
                {isDarkTemplate && (
                    <>
                        <span
                            className="h-2 w-8 rounded-full"
                            style={{ background: tokens.primary }}
                        />
                        <span
                            className="flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[7px] font-bold"
                            style={{
                                background: tokens.primary,
                                color: tokens.primaryForeground || "#fff",
                            }}
                        >
                            <Moon size={7} /> Dark
                        </span>
                    </>
                )}
            </div>

            <div>
                <p
                    className={`text-xs font-bold ${active ? "text-primary-700" : "text-slate-800"}`}
                >
                    {tpl.label}
                </p>
                <p className="mt-0.5 text-[10px] leading-tight text-slate-400 line-clamp-2">
                    {tpl.description}
                </p>
            </div>

            <div className="flex gap-1">
                {[tokens.primary, tokens.accent, tokens.success || '#16A34A', tokens.warning || '#F59E0B'].map((color, i) => (
                    <span
                        key={i}
                        className="h-3 w-3 rounded-full border border-black/5"
                        style={{ background: color }}
                    />
                ))}
            </div>
        </button>
    );
}

/* ── Kartu Tema Custom User ── */
function UserCard({ theme, active, onSelect, onEdit, onDelete }) {
    const scales = useMemo(
        () => ({
            primary: generateColorScale(theme.primary),
            accent: generateColorScale(theme.accent),
        }),
        [theme.primary, theme.accent],
    );

    return (
        <div
            className={`group relative flex flex-col gap-2.5 rounded-xl border-2 p-3 transition-all duration-200 ${
                active
                    ? "border-primary-500 bg-primary-50/60 shadow-md shadow-primary-500/10 ring-1 ring-primary-500/20"
                    : "border-slate-200 bg-white hover:border-primary-300 hover:shadow-sm"
            }`}
        >
            {active && (
                <span className="absolute right-2.5 top-2.5 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-white shadow-sm">
                    <Check size={12} strokeWidth={3} />
                </span>
            )}

            <button
                type="button"
                onClick={onSelect}
                className="flex flex-col gap-2.5"
            >
                <div
                    className="flex h-14 w-full items-end justify-between overflow-hidden rounded-lg p-2"
                    style={{
                        background: theme.is_dark
                            ? "#0f1512"
                            : `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
                    }}
                >
                    {theme.is_dark && (
                        <>
                            <span
                                className="h-2 w-8 rounded-full"
                                style={{ background: theme.primary }}
                            />
                            <span className="flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[7px] font-bold text-white/90"
                                style={{ background: theme.primary }}
                            >
                                <Moon size={7} /> Dark
                            </span>
                        </>
                    )}
                </div>

                <div>
                    <p
                        className={`text-xs font-bold ${active ? "text-primary-700" : "text-slate-800"}`}
                    >
                        {theme.name}
                    </p>
                    {theme.description && (
                        <p className="mt-0.5 text-[10px] leading-tight text-slate-400 line-clamp-2">
                            {theme.description}
                        </p>
                    )}
                    <p className="mt-0.5 font-mono text-[9px] text-slate-300">
                        {theme.primary} · {theme.accent}
                    </p>
                </div>

                <div className="flex gap-1">
                    {["600", "500", "400"].map((s) => (
                        <span
                            key={s}
                            className="h-3 w-3 rounded-full border border-black/5"
                            style={{ background: scales.primary[s] }}
                        />
                    ))}
                    <span
                        className="h-3 w-3 rounded-full border border-black/5"
                        style={{ background: scales.accent["500"] }}
                    />
                </div>
            </button>

            {/* CRUD buttons — hanya untuk custom user theme */}
            {!theme.is_system && (
                <div className="flex gap-1.5 border-t border-slate-100 pt-2">
                    <Link
                        href={route("admin.themes.edit", theme.id)}
                        className="flex flex-1 items-center justify-center gap-1 rounded-lg py-1.5 text-[10px] font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                    >
                        <Pencil size={10} />
                        Edit
                    </Link>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(theme);
                        }}
                        className="flex flex-1 items-center justify-center gap-1 rounded-lg py-1.5 text-[10px] font-semibold text-red-400 transition hover:bg-red-50 hover:text-red-600"
                    >
                        <Trash2 size={10} />
                        Hapus
                    </button>
                </div>
            )}
        </div>
    );
}

/* ── Halaman Utama ── */
export default function Index({ userThemes = [], filters = {} }) {
    const { flash } = usePage().props;
    const {
        preference,
        theme,
        isDark,
        setTemplate,
        setMode,
        setCustomColors,
        templates: systemTemplates,
    } = useTheme();

    const [activePreviewTab, setActivePreviewTab] = useState("dashboard");
    const [previewTheme, setPreviewTheme] = useState(null);
    const [target, setTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    // Semua preset sistem ditampilkan dalam satu galeri — setiap kartu
    // sudah punya identitas light/dark sendiri dari database (bukan
    // dipisah per-mode lagi, karena tiap template dari seeder cuma punya
    // 1 mode "utama" + 1 mode auto-generated).
    const activeGallery = systemTemplates;

    // Preview tokens: pakai tema yang di-hover (sesuai recommendedMode
    // template itu sendiri), atau tema aktif (sesuai mode yang user pilih).
    const previewTokens = useMemo(() => {
        if (previewTheme) {
            return previewTheme.recommendedMode === "dark"
                ? previewTheme.dark
                : previewTheme.light;
        }
        return isDark ? theme.dark : theme.light;
    }, [previewTheme, theme, isDark]);

    const previewComponent = useMemo(() => {
        switch (activePreviewTab) {
            case "pos":
                return <PreviewPOS tokens={previewTokens} />;
            case "invoice":
                return <PreviewInvoice tokens={previewTokens} />;
            default:
                return <PreviewDashboard tokens={previewTokens} />;
        }
    }, [activePreviewTab, previewTokens]);

    const handleSelectSystem = (tpl) => {
        setPreviewTheme(null);
        setTemplate(tpl.id);
    };

    const handleSelectUser = (preset) => {
        setPreviewTheme(null);
        setCustomColors({
            primary: preset.primary,
            secondary: preset.secondary,
            accent: preset.accent,
        });
    };

    const isActiveSystem = (tpl) =>
        preference.templateId === tpl.id && preference.templateId !== "custom";

    const isActiveUser = (preset) =>
        preference.templateId === "custom" &&
        preference.custom?.primary === preset.primary &&
        preference.custom?.accent === preset.accent;

    const confirmDelete = () => {
        if (!target) return;
        setDeleting(true);
        router.delete(route("admin.themes.destroy", target.id), {
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
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
                            <Palette className="h-5 w-5" strokeWidth={1.8} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">
                                Tema
                            </h2>
                            <p className="text-xs text-slate-500">
                                Pilih tema dan kustomisasi tampilan aplikasi
                            </p>
                        </div>
                    </div>
                    <Link
                        href={route("admin.themes.create")}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-primary-500/25 transition hover:from-primary-600 hover:to-primary-700"
                    >
                        <Plus size={16} />
                        <span className="hidden sm:inline">Buat Tema</span>
                    </Link>
                </div>
            }
        >
            <Head title="Tema" />

            {flash?.success && (
                <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {flash.success}
                </div>
            )}

            <div className="flex flex-col gap-5 lg:flex-row">
                {/* ── KIRI: Daftar tema ── */}
                <div className="w-full space-y-4 lg:w-[48%] lg:shrink-0">
                    {/* Mode selector */}
                    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                        <div className="grid grid-cols-3 gap-1.5">
                            {MODE_OPTIONS.map(
                                ({ key, label, icon: Icon }) => (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => setMode(key)}
                                        className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition ${
                                            preference.mode === key
                                                ? "bg-primary-600 text-white shadow-sm"
                                                : "text-slate-500 hover:bg-slate-100"
                                        }`}
                                    >
                                        <Icon size={14} />
                                        {label}
                                    </button>
                                ),
                            )}
                        </div>
                    </div>

                    {/* Template Sistem */}
                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="mb-3 flex items-center gap-2">
                            <Palette size={14} className="text-slate-400" />
                            <h3 className="text-sm font-semibold text-slate-800">
                                Template Sistem
                            </h3>
                            <span className="ml-auto text-[10px] text-slate-400">
                                {activeGallery.length} template
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2.5">
                            {activeGallery.map((tpl) => (
                                <SystemCard
                                    key={tpl.id}
                                    tpl={tpl}
                                    active={isActiveSystem(tpl)}
                                    onSelect={() =>
                                        handleSelectSystem(tpl)
                                    }
                                    onMouseEnter={() =>
                                        setPreviewTheme(tpl)
                                    }
                                    onMouseLeave={() =>
                                        setPreviewTheme(null)
                                    }
                                />
                            ))}
                        </div>
                    </div>

                    {/* Tema Saya */}
                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="mb-3 flex items-center gap-2">
                            <Pencil size={14} className="text-slate-400" />
                            <h3 className="text-sm font-semibold text-slate-800">
                                Tema Saya
                            </h3>
                            <span className="ml-auto text-[10px] text-slate-400">
                                {userThemes.length} tema
                            </span>
                        </div>
                        {userThemes.length > 0 ? (
                            <div className="grid grid-cols-2 gap-2.5">
                                {userThemes.map((preset) => (
                                    <UserCard
                                        key={preset.id}
                                        theme={preset}
                                        active={isActiveUser(preset)}
                                        onSelect={() =>
                                            handleSelectUser(preset)
                                        }
                                        onEdit={() =>
                                            router.get(
                                                route(
                                                    "admin.themes.edit",
                                                    preset.id,
                                                ),
                                            )
                                        }
                                        onDelete={setTarget}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-slate-200 py-6 text-center">
                                <Palette
                                    size={24}
                                    className="text-slate-300"
                                />
                                <p className="text-xs text-slate-500">
                                    Belum ada tema custom
                                </p>
                                <Link
                                    href={route("admin.themes.create")}
                                    className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-primary-700"
                                >
                                    <Plus size={12} />
                                    Buat tema
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── KANAN: Preview ── */}
                <div className="w-full lg:w-[52%] lg:sticky lg:top-16 lg:self-start">
                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="mb-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Eye
                                    size={14}
                                    className="text-slate-400"
                                />
                                <h3 className="text-sm font-semibold text-slate-800">
                                    Preview
                                </h3>
                            </div>
                            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-500">
                                {isDark ? "Gelap" : "Terang"} ·{" "}
                                {theme.label}
                            </span>
                        </div>

                        {/* Preview tabs */}
                        <div className="mb-3 flex gap-1 rounded-lg bg-slate-100 p-1">
                            {PREVIEW_TABS.map(
                                ({ key, label, icon: Icon }) => (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() =>
                                            setActivePreviewTab(key)
                                        }
                                        className={`flex flex-1 items-center justify-center gap-1 rounded-md py-2 text-[11px] font-semibold transition ${
                                            activePreviewTab === key
                                                ? "bg-white text-slate-800 shadow-sm"
                                                : "text-slate-400 hover:text-slate-600"
                                        }`}
                                    >
                                        <Icon size={13} />
                                        {label}
                                    </button>
                                ),
                            )}
                        </div>

                        <div className="h-[400px] overflow-hidden rounded-lg lg:h-[500px]">
                            {previewComponent}
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmDeleteModal
                open={!!target}
                title="Hapus tema?"
                description={
                    target
                        ? `Tema "${target.name}" akan dihapus permanen.`
                        : ""
                }
                processing={deleting}
                onConfirm={confirmDelete}
                onClose={() => !deleting && setTarget(null)}
            />
        </AuthenticatedLayout>
    );
}
