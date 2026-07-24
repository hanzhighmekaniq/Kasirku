import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from "@/Components/PageHeader";
import { Head, Link, useForm } from '@inertiajs/react';
import BranchForm from './BranchForm';

export default function Edit({ branch }) {
    const { data, setData, put, processing, errors } = useForm({
        code: branch.code || '',
        name: branch.name || '',
        phone: branch.phone || '',
        address: branch.address || '',
        is_active: !!branch.is_active,
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('admin.branches.update', branch.id));
    };

    return (
        <AuthenticatedLayout
            
            header={
                <div className="leading-tight"
            
            backUrl={route("admin.branches.index")}>
                    <div className="text-sm font-semibold text-foreground">
                        Cabang
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                        Edit
                    </div>
                </div>
            }>
            <PageHeader
                title="Edit Cabang"
                breadcrumbs={["Admin", "Cabang", "Edit"]}
                heading={
                    <>
                        Edit{" "}
                        <span className="bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
                            Cabang
                        </span>
                    </>
                }
                description={`Perbarui detail cabang "${branch.name}".`}
                
            />

            <div className="mx-auto max-w-2xl">
                <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                    <div className="border-b border-border bg-muted/50 px-6 py-5">
                        <h3 className="text-base font-semibold text-foreground">Informasi Cabang</h3>
                        <p className="mt-0.5 text-sm text-muted-foreground">Perbarui detail cabang "{branch.name}".</p>
                    </div>
                    <div className="p-6">
                        <BranchForm
                            data={data}
                            setData={setData}
                            errors={errors}
                            processing={processing}
                            onSubmit={submit}
                            submitLabel="Simpan Perubahan"
                            cancelHref={route('admin.branches.index')}
                        />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
