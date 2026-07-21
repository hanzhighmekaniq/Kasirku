import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, useForm } from "@inertiajs/react";
import CategoryForm from "./CategoryForm";

export default function Create({ parentCategories = [] }) {
    const { data, setData, post, processing, errors } = useForm({
        name: "",
        description: "",
        parent_id:
            new URLSearchParams(window.location.search).get("parent_id") ||
            null,
    });
    const submit = (e) => {
        e.preventDefault();
        post(route("admin.categories.store"));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <Link
                        href={route("admin.categories.index")}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
                        aria-label="Kembali"
                    >
                        <svg
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.8}
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15.75 19.5L8.25 12l7.5-7.5"
                            />
                        </svg>
                    </Link>
                    <h2 className="text-lg font-semibold text-foreground">
                        Tambah Kategori
                    </h2>
                </div>
            }
        >
            <Head title="Tambah Kategori" />

            <div className="mx-auto max-w-4xl">
                <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                    <div className="border-b border-border bg-muted/50 px-6 py-5">
                        <h3 className="text-base font-semibold text-foreground">
                            Informasi Kategori
                        </h3>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            Buat kategori baru untuk mengelompokkan produk kamu.
                        </p>
                    </div>
                    <div className="p-6">
                        <CategoryForm
                            data={data}
                            setData={setData}
                            errors={errors}
                            processing={processing}
                            onSubmit={submit}
                            submitLabel="Simpan Kategori"
                            cancelHref={route("admin.categories.index")}
                            parentCategories={parentCategories}
                        />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
