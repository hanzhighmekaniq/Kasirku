import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from "@/Components/PageHeader";
import { Head, Link, useForm } from '@inertiajs/react';
import BranchForm from './BranchForm';

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        code: '',
        name: '',
        phone: '',
        address: '',
        is_active: true,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.branches.store'));
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
                        Tambah
                    </div>
                </div>
            }>
            <PageHeader
                title="Tambah Cabang"
                breadcrumbs={["Admin", "Cabang", "Tambah"]}
                heading={
                    <>
                        Tambah{" "}
                        <span className="bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
                            Cabang
                        </span>
                    </>
                }
                description="Buat outlet untuk memisahkan stok, transaksi, dan kasir per lokasi."
                
            />

            <div className="mx-auto max-w-2xl">
                <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                    <div className="border-b border-border bg-muted/50 px-6 py-5">
                        <h3 className="text-base font-semibold text-foreground">Informasi Cabang</h3>
                        <p className="mt-0.5 text-sm text-muted-foreground">Buat outlet untuk memisahkan stok, transaksi, dan kasir per lokasi.</p>
                    </div>
                    <div className="p-6">
                        <BranchForm
                            data={data}
                            setData={setData}
                            errors={errors}
                            processing={processing}
                            onSubmit={submit}
                            submitLabel="Simpan Cabang"
                            cancelHref={route('admin.branches.index')}
                        />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
