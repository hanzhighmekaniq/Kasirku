import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { useTheme } from "@/Theme/ThemeProvider";
import { Head, Link, useForm } from "@inertiajs/react";
import { Check, Eye, Sun, Moon } from "lucide-react";
import { useState, useMemo } from "react";
import ThemeForm from "./ThemeForm";
import ThemePreview from "./ThemePreview";

const SWATCH_KEYS = ["primary", "background", "card", "accent", "muted"];

export default function Create() {
    const { templates } = useTheme();
    const defaultTemplate = templates[0];
    const defaultLight = defaultTemplate?.light || {};
    const defaultDark = defaultTemplate?.dark || {};

    const { data, setData, post, processing, errors } = useForm({
        name: "",
        description: "",
        light_tokens: { ...defaultLight },
        dark_tokens: { ...defaultDark },
    });

    const [previewMode, setPreviewMode] = useState("light");

    const submit = (e) => {
        e.preventDefault();
        post(route("admin.themes.store"));
    };

    const previewTokens = useMemo(
        () =>
            previewMode === "dark"
                ? data.dark_tokens || {}
                : data.light_tokens || {},
        [previewMode, data.light_tokens, data.dark_tokens],
    );

    return (
        <AuthenticatedLayout
            header={
                <div className="flex w-full items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Link
                            href={route("admin.themes.index")}
                            className="transition hover:text-foreground"
                        >
                            Themes
                        </Link>
                        <span>&rarr;</span>
                        <span className="text-foreground">Create</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link
                            href={route("admin.themes.index")}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground transition hover:bg-muted"
                        >
                            Cancel
                        </Link>
                        <button
                            type="button"
                            onClick={submit}
                            disabled={processing}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Check size={14} /> Create Theme
                        </button>
                    </div>
                </div>
            }
        >
            <Head title="Create Theme" />

            {/* Page header */}
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight text-foreground">
                        Create a new theme
                    </h1>
                    <p className="mt-1.5 max-w-lg text-sm text-muted-foreground">
                        Design your theme in both Light and Dark mode
                        simultaneously. Every token maps directly to your
                        application's design system.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_720px]">
                {/* LEFT: Form */}
                <div>
                    <ThemeForm
                        data={data}
                        setData={setData}
                        errors={errors}
                        processing={processing}
                        onSubmit={submit}
                        submitLabel="Create Theme"
                        cancelHref={route("admin.themes.index")}
                        previewMode={previewMode}
                        setPreviewMode={setPreviewMode}
                        defaultLight={defaultLight}
                        defaultDark={defaultDark}
                    />
                </div>

                {/* RIGHT: Preview panel */}
                <div className="space-y-4 xl:sticky xl:top-20 xl:self-start">
                    <div className="rounded-xl border border-border bg-card p-4">
                        <div className="mb-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Eye
                                    size={15}
                                    className="text-muted-foreground"
                                />
                                <span className="text-sm font-semibold text-foreground">
                                    Live preview
                                </span>
                            </div>
                            <span className="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
                                {previewMode === "light" ? (
                                    <>
                                        <Sun
                                            size={10}
                                            className="text-yellow-500"
                                        />{" "}
                                        Light mode
                                    </>
                                ) : (
                                    <>
                                        <Moon
                                            size={10}
                                            className="text-blue-400"
                                        />{" "}
                                        Dark mode
                                    </>
                                )}
                            </span>
                        </div>
                        <ThemePreview
                            tokens={previewTokens}
                            isDark={previewMode === "dark"}
                        />
                        {/* Swatch strip */}
                        <div className="mt-3 grid grid-cols-5 gap-2">
                            {SWATCH_KEYS.map((k) => (
                                <div key={k} className="text-center">
                                    <div
                                        className="h-6 rounded-md border border-border"
                                        style={{
                                            background:
                                                previewTokens[k] || "#ccc",
                                        }}
                                    />
                                    <div className="mt-1 truncate text-[10px] text-muted-foreground">
                                        {k}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
