import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, useForm } from "@inertiajs/react";
import { Eye } from "lucide-react";
import ThemeForm from "./ThemeForm";
import ThemePreview from "./ThemePreview";

export default function Edit({ theme }) {
    const { data, setData, put, processing, errors } = useForm({
        name: theme.name,
        description: theme.description || "",
        primary: theme.primary,
        secondary: theme.secondary,
        accent: theme.accent,
        is_dark: theme.is_dark,
        light_tokens: theme.light_tokens || {},
        dark_tokens: theme.dark_tokens || {},
    });

    const submit = (e) => {
        e.preventDefault();
        put(route("admin.themes.update", theme.id));
    };

    const previewTokens = data.is_dark
        ? (data.dark_tokens || {})
        : (data.light_tokens || {});

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <Link
                        href={route("admin.themes.index")}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                        aria-label="Kembali"
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                    </Link>
                    <h2 className="text-lg font-semibold text-slate-800">Edit Tema</h2>
                </div>
            }
        >
            <Head title="Edit Tema" />

            <div className="flex flex-col gap-5 lg:flex-row">
                <div className="w-full lg:w-[55%] lg:shrink-0">
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-5">
                            <h3 className="text-base font-semibold text-slate-900">Informasi Tema</h3>
                            <p className="mt-0.5 text-sm text-slate-500">
                                Edit36 token tema custom. Preview update otomatis.
                            </p>
                        </div>
                        <div className="p-6">
                            <ThemeForm
                                data={data}
                                setData={setData}
                                errors={errors}
                                processing={processing}
                                onSubmit={submit}
                                submitLabel="Simpan Perubahan"
                                cancelHref={route("admin.themes.index")}
                            />
                        </div>
                    </div>
                </div>

                <div className="w-full lg:w-[45%] lg:sticky lg:top-16 lg:self-start">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="mb-3 flex items-center gap-2">
                            <Eye size={16} className="text-slate-500" />
                            <h3 className="text-sm font-semibold text-slate-800">Preview</h3>
                            <span className="ml-auto rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-500">
                                {data.is_dark ? "Gelap" : "Terang"}
                            </span>
                        </div>
                        <div className="h-[360px] overflow-hidden rounded-xl">
                            <ThemePreview
                                primary={previewTokens.primary || "#4F46E5"}
                                secondary={previewTokens.secondary || "#64748B"}
                                accent={previewTokens.accent || "#8B5CF6"}
                                isDark={data.is_dark}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
