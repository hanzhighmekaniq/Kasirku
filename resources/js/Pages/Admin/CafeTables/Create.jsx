import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from "@/Components/PageHeader";
import { Head, Link, useForm } from '@inertiajs/react';
import CafeTableForm from './CafeTableForm';

export default function Create({ branches }) {
    const { data, setData, post, processing, errors } = useForm({
        branch_id: '',
        table_number: '',
        capacity: 4,
        status: 'available',
        is_active: true,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.cafe-tables.store'));
    };

    return (
        <AuthenticatedLayout
            
            header={
                <div className="leading-tight"
            
            backUrl={route("admin.cafe-tables.index")}>
                    <div className="text-sm font-semibold text-foreground">
                        Meja
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                        Tambah
                    </div>
                </div>
            }>
            <PageHeader
                title="Tambah Meja Cafe"
                breadcrumbs={["Admin", "Meja", "Tambah"]}
                heading={
                    <>
                        Tambah{" "}
                        <span className="bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
                            Meja
                        </span>
                    </>
                }
                description="Isi informasi meja yang akan ditambahkan."
                
            />

            <div className="mx-auto max-w-2xl">
                <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                    <div className="border-b border-border bg-muted/50 px-6 py-5">
                        <h3 className="text-base font-semibold text-foreground">Detail Meja</h3>
                        <p className="mt-0.5 text-sm text-muted-foreground">Isi informasi meja yang akan ditambahkan.</p>
                    </div>
                    <div className="p-6">
                        <CafeTableForm
                            data={data}
                            setData={setData}
                            errors={errors}
                            processing={processing}
                            onSubmit={submit}
                            submitLabel="Simpan Meja"
                            cancelHref={route('admin.cafe-tables.index')}
                            branches={branches}
                        />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
