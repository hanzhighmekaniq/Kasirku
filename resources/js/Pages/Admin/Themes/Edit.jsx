import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, useForm } from "@inertiajs/react";
import { Check, Eye, Sun, Moon } from "lucide-react";
import { useState, useMemo } from "react";
import ThemeForm from "./ThemeForm";
import ThemePreview from "./ThemePreview";

const SWATCH_KEYS = ["primary", "background", "card", "accent", "muted"];

export default function Edit({ theme }) {
    const { data, setData, put, processing, errors } = useForm({
        name: theme.name,
        description: theme.description || "",
        light_tokens: theme.light_tokens || {},
        dark_tokens: theme.dark_tokens || {},
    });

    const [previewMode, setPreviewMode] = useState("light");

    const submit = (e) => {
        e.preventDefault();
        put(route("admin.themes.update", theme.id));
    };

    const previewTokens = useMemo(
        () =>
            previewMode === "dark"
                ? data.dark_tokens || {}
                : data.light_tokens || {},
        [previewMode, data.light_tokens, data.dark_tokens],
    );

    // Defaults for "reset this mode" — use the original theme tokens (pre-edit)
    const defaultLight = theme.light_tokens || {};
    const defaultDark = theme.dark_tokens || {};

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
            <Head title={`Edit — ${theme.name}`} />

            

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
                {/* LEFT: Form */}
                <div>
                    <ThemeForm
                        data={data}
                        setData={setData}
                        errors={errors}
                        processing={processing}
                        onSubmit={submit}
                        submitLabel="Save Changes"
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
