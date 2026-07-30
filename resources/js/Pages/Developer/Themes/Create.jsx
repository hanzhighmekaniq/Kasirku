import DeveloperLayout from "@/Layouts/DeveloperLayout";
import { useTheme } from "@/Theme/ThemeProvider";
import { Head, useForm } from "@inertiajs/react";
import { Eye, Moon, Sun } from "lucide-react";
import { useMemo, useState } from "react";
import ThemeForm from "@/Pages/Admin/Themes/ThemeForm";
import ThemePreview from "@/Pages/Admin/Themes/ThemePreview";

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
        post(route("developer.themes.store"));
    };

    const previewTokens = useMemo(
        () =>
            previewMode === "dark"
                ? data.dark_tokens || {}
                : data.light_tokens || {},
        [previewMode, data.light_tokens, data.dark_tokens],
    );

    return (
        <DeveloperLayout header="Buat Tema Baru">
            <Head title="Buat Tema Baru" />

            <div className="mb-6">
                <h1 className="text-xl font-semibold tracking-tight text-foreground">
                    Buat tema baru
                </h1>
                <p className="mt-1.5 max-w-lg text-sm text-muted-foreground">
                    Atur 36 token warna untuk mode terang dan gelap. Perubahan
                    terlihat langsung di panel preview kanan.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
                <ThemeForm
                    data={data}
                    setData={setData}
                    errors={errors}
                    processing={processing}
                    onSubmit={submit}
                    submitLabel="Buat Tema"
                    cancelHref={route("developer.themes.index")}
                    previewMode={previewMode}
                    setPreviewMode={setPreviewMode}
                    defaultLight={defaultLight}
                    defaultDark={defaultDark}
                />

                <div className="space-y-4 xl:sticky xl:top-20 xl:self-start">
                    <div className="rounded-xl border border-border bg-card p-4">
                        <div className="mb-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Eye className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-semibold text-foreground">
                                    Live preview
                                </span>
                            </div>
                            <span className="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
                                {previewMode === "light" ? (
                                    <>
                                        <Sun className="h-2.5 w-2.5 text-warning" />
                                        Terang
                                    </>
                                ) : (
                                    <>
                                        <Moon className="h-2.5 w-2.5 text-primary" />
                                        Gelap
                                    </>
                                )}
                            </span>
                        </div>
                        <ThemePreview
                            tokens={previewTokens}
                            isDark={previewMode === "dark"}
                        />
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
        </DeveloperLayout>
    );
}
