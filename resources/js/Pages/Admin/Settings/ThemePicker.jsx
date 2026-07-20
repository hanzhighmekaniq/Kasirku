import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import { useMemo, useState } from "react";
import { Check, Laptop, Moon, Palette, Sun } from "lucide-react";
import { useTheme } from "@/Theme/ThemeProvider";
import { LIGHT_TEMPLATES, DARK_TEMPLATES } from "@/Theme/templates";
import PreviewDashboard from "./ThemePicker/PreviewDashboard";
import PreviewPOS from "./ThemePicker/PreviewPOS";
import PreviewInvoice from "./ThemePicker/PreviewInvoice";
import PreviewSidebar from "./ThemePicker/PreviewSidebar";
import CustomThemeForm from "./ThemePicker/CustomThemeForm";

const PREVIEW_TABS = [
    { key: "dashboard", label: "Dashboard" },
    { key: "pos", label: "POS" },
    { key: "invoice", label: "Invoice" },
    { key: "sidebar", label: "Sidebar" },
];

const MODE_OPTIONS = [
    { key: "light", label: "Light", icon: Sun },
    { key: "dark", label: "Dark", icon: Moon },
    { key: "system", label: "System", icon: Laptop },
];

/** Kartu swatch kecil (5 titik warna) dipakai di kartu pilihan template. */
function TemplateSwatch({ tokens }) {
    const colors = [tokens.primary["600"], tokens.accent["500"], tokens.success, tokens.warning, tokens.danger];
    return (
        <div className="flex gap-1">
            {colors.map((c, i) => (
                <span key={i} className="h-4 w-4 rounded-full border border-black/5" style={{ background: c }} />
            ))}
        </div>
    );
}

function TemplateCard({ theme, active, onSelect }) {
    const isDarkTemplate = theme.recommendedMode === "dark";
    const tokens = isDarkTemplate ? theme.dark : theme.light;

    return (
        <button
            type="button"
            onClick={onSelect}
            className={`relative flex flex-col gap-3 rounded-2xl border-2 p-4 text-left transition ${
                active ? "border-primary-500 bg-primary-50/50 shadow-sm" : "border-slate-200 bg-white hover:border-slate-300"
            }`}
        >
            {active && (
                <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-white">
                    <Check size={12} strokeWidth={3} />
                </span>
            )}
            {/* Mini hero card — kalau dark-native, tampilkan langsung suasana gelapnya */}
            <div
                className="flex h-16 w-full items-end justify-between overflow-hidden rounded-xl p-2"
                style={{
                    background: isDarkTemplate
                        ? tokens.background
                        : `linear-gradient(135deg, ${tokens.primary["500"]}, ${tokens.accent["500"]})`,
                }}
            >
                {isDarkTemplate && (
                    <>
                        <span className="h-2.5 w-10 rounded-full" style={{ background: tokens.primary["500"] }} />
                        <span className="flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[8px] font-bold text-white" style={{ background: tokens.primary["600"] }}>
                            <Moon size={8} /> Dark
                        </span>
                    </>
                )}
            </div>
            <div>
                <p className="text-sm font-bold text-slate-800">{theme.label}</p>
                <p className="mt-0.5 text-xs text-slate-400">{theme.description}</p>
            </div>
            <TemplateSwatch tokens={tokens} />
        </button>
    );
}

export default function ThemePicker() {
    const { preference, theme, isDark, setTemplate, setMode, setCustomColors } = useTheme();
    const [activePreviewTab, setActivePreviewTab] = useState("dashboard");
    const [showCustomForm, setShowCustomForm] = useState(preference.templateId === "custom");

    const previewTokens = isDark ? theme.dark : theme.light;

    const handleSelectTemplate = (templateId) => {
        setShowCustomForm(false);
        setTemplate(templateId);
    };

    const handleSelectCustom = () => {
        setShowCustomForm(true);
    };

    const previewComponent = useMemo(() => {
        switch (activePreviewTab) {
            case "pos":
                return <PreviewPOS tokens={previewTokens} />;
            case "invoice":
                return <PreviewInvoice tokens={previewTokens} />;
            case "sidebar":
                return <PreviewSidebar />;
            default:
                return <PreviewDashboard tokens={previewTokens} />;
        }
    }, [activePreviewTab, previewTokens]);

    return (
        <AuthenticatedLayout
            header={
                <div className="flex w-full items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
                            <Palette className="h-5 w-5" strokeWidth={1.8} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">Tema Aplikasi</h2>
                            <p className="text-xs text-slate-400">Pilih template warna & mode tampilan</p>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title="Tema Aplikasi" />

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px]">
                {/* ── LEFT: pengaturan ── */}
                <div className="space-y-5">
                    {/* Mode Light/Dark/System */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <h3 className="text-sm font-semibold text-slate-800">Mode Tampilan</h3>
                        <p className="mt-0.5 text-xs text-slate-400">Terapkan langsung tanpa reload halaman</p>
                        <div className="mt-3 grid grid-cols-3 gap-2">
                            {MODE_OPTIONS.map(({ key, label, icon: Icon }) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => setMode(key)}
                                    className={`flex flex-col items-center gap-1.5 rounded-xl border-2 py-3 text-xs font-semibold transition ${
                                        preference.mode === key
                                            ? "border-primary-500 bg-primary-50 text-primary-700"
                                            : "border-slate-200 text-slate-500 hover:border-slate-300"
                                    }`}
                                >
                                    <Icon size={18} />
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Template built-in — Terang */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center gap-2">
                            <Sun size={16} className="text-amber-500" />
                            <h3 className="text-sm font-semibold text-slate-800">Template Terang</h3>
                        </div>
                        <p className="mt-0.5 text-xs text-slate-400">4 tema siap pakai, disesuaikan untuk berbagai jenis usaha</p>
                        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {LIGHT_TEMPLATES.map((t) => (
                                <TemplateCard
                                    key={t.id}
                                    theme={t}
                                    active={!showCustomForm && preference.templateId === t.id}
                                    onSelect={() => handleSelectTemplate(t.id)}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Template built-in — Gelap */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center gap-2">
                            <Moon size={16} className="text-indigo-500" />
                            <h3 className="text-sm font-semibold text-slate-800">Template Gelap</h3>
                        </div>
                        <p className="mt-0.5 text-xs text-slate-400">Versi dark-native — suasana warna diracik khusus untuk malam, bukan sekadar invert</p>
                        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {DARK_TEMPLATES.map((t) => (
                                <TemplateCard
                                    key={t.id}
                                    theme={t}
                                    active={!showCustomForm && preference.templateId === t.id}
                                    onSelect={() => handleSelectTemplate(t.id)}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Custom Theme */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <button
                            type="button"
                            onClick={handleSelectCustom}
                            className={`flex w-full items-center justify-between rounded-xl border-2 px-4 py-3 text-left transition ${
                                showCustomForm ? "border-primary-500 bg-primary-50/50" : "border-dashed border-slate-300 hover:border-slate-400"
                            }`}
                        >
                            <div>
                                <p className="text-sm font-bold text-slate-800">Custom Theme</p>
                                <p className="text-xs text-slate-400">Buat tema sendiri dari 3 warna dasar</p>
                            </div>
                            {showCustomForm && (
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-600 text-white">
                                    <Check size={14} strokeWidth={3} />
                                </span>
                            )}
                        </button>

                        {showCustomForm && (
                            <div className="mt-4 border-t border-slate-100 pt-4">
                                <CustomThemeForm
                                    initialColors={preference.custom}
                                    onApply={(colors) => setCustomColors(colors)}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* ── RIGHT: Live Preview (sticky) ── */}
                <div className="lg:sticky lg:top-5 lg:self-start">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="mb-3 flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-slate-800">Live Preview</h3>
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                                {isDark ? "Dark" : "Light"} · {theme.label}
                            </span>
                        </div>

                        <div className="mb-3 flex gap-1 rounded-xl bg-slate-100 p-1">
                            {PREVIEW_TABS.map((tab) => (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => setActivePreviewTab(tab.key)}
                                    className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition ${
                                        activePreviewTab === tab.key
                                            ? "bg-white text-slate-800 shadow-sm"
                                            : "text-slate-500 hover:text-slate-700"
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <div className="h-64 overflow-hidden rounded-xl">{previewComponent}</div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
