import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm } from "@inertiajs/react";
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
                <div className="leading-tight">
                    <div className="text-sm font-semibold text-foreground">
                        Manajemen Kategori
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                        Tambah
                    </div>
                </div>
            }
        >
            <Head title="Tambah Kategori" />

            <div className="mx-auto max-w-2xl">
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
