import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from "@/Components/PageHeader";
import { Head, Link, useForm } from '@inertiajs/react';
import CafeTableForm from './CafeTableForm';

export default function Edit({ cafeTable, branches }) {
    const { data, setData, put, processing, errors } = useForm({
        branch_id: cafeTable.branch_id || '',
        table_number: cafeTable.table_number || '',
        capacity: cafeTable.capacity || 4,
        status: cafeTable.status || 'available',
        is_active: cafeTable.is_active ?? true,
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('admin.cafe-tables.update', cafeTable.id));
    };

    return (
        <AuthenticatedLayout>
            <PageHeader
                title={`Edit Meja ${cafeTable.table_number}`}
                breadcrumbs={["Admin", "Meja", "Edit"]}
                heading={
                    <>
                        Edit{" "}
                        <span className="bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
                            Meja
                        </span>
                    </>
                }
                description={`Edit meja ${cafeTable.table_number}`}
                backUrl={route("admin.cafe-tables.index")}
            />

            <div className="mx-auto max-w-2xl">
                <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                    <div className="border-b border-border bg-muted/50 px-6 py-5">
                        <h3 className="text-base font-semibold text-foreground">Detail Meja</h3>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            Edit meja <span className="font-medium text-primary-600">{cafeTable.table_number}</span>
                        </p>
                    </div>
                    <div className="p-6">
                        <CafeTableForm
                            data={data}
                            setData={setData}
                            errors={errors}
                            processing={processing}
                            onSubmit={submit}
                            submitLabel="Update Meja"
                            cancelHref={route('admin.cafe-tables.index')}
                            branches={branches}
                        />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
