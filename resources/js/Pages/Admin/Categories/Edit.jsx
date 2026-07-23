import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader";
import { Head, useForm } from "@inertiajs/react";
import CategoryForm from "./CategoryForm";

export default function Edit({ category, parentCategories = [] }) {
    const { data, setData, put, processing, errors } = useForm({
        name: category.name || "",
        description: category.description || "",
        parent_id: category.parent_id || null,
    });
    const submit = (e) => {
        e.preventDefault();
        put(route("admin.categories.update", category.id));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="leading-tight">
                    <div className="text-sm font-semibold text-foreground">
                        Manajemen Kategori
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                        Edit
                    </div>
                </div>
            }
        >
            <PageHeader
                title="Katalog Kategori - Edit"
                breadcrumbs={["Katalog", "Kategori", "Edit"]}
                heading={
                    <>
                        Edit{" "}
                        <span className="bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
                            kategori
                        </span>
                    </>
                }
                description={`Perbarui detail kategori "${category.name}".`}
                backUrl={route("admin.categories.index")}
            />

            <div className="mx-auto max-w-2xl">
                <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                    <div className="border-b border-border bg-muted/50 px-6 py-5">
                        <h3 className="text-base font-semibold text-foreground">
                            Informasi Kategori
                        </h3>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            Perbarui detail kategori &quot;{category.name}&quot;.
                        </p>
                    </div>
                    <div className="p-6">
                        <CategoryForm
                            data={data}
                            setData={setData}
                            errors={errors}
                            processing={processing}
                            onSubmit={submit}
                            submitLabel="Simpan Perubahan"
                            cancelHref={route("admin.categories.index")}
                            parentCategories={parentCategories}
                        />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
