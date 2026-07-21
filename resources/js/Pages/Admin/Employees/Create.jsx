import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import EmployeeForm from './EmployeeForm';

export default function Create({ branches, suggestedCode, roles = [], storeType = "retail" }) {
    const { data, setData, post, processing, errors } = useForm({
        employee_code:      suggestedCode || '',
        branch_id:          '',
        name:               '',
        phone:              '',
        email:              '',
        position:           '',
        commission_type:    'none',
        commission_value:   0,
        status:             'active',
        create_account:     true,
        role:               'kasir',
        password:           '',
        password_confirmation: '',
    });

    const PAGE_LABEL = {
        retail: "Karyawan",
        fnb: "Karyawan",
        service: "Terapis / Staf",
        rental: "Staf",
        ticket: "Staf & Operator",
        hospitality: "Staf Hotel",
        parking: "Petugas Parkir",
        session: "Operator",
    };
    const pageLabel = PAGE_LABEL[storeType] ?? "Karyawan";
    const showCommission = ["service", "ticket"].includes(storeType);

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.employees.store'));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <Link
                        href={route('admin.employees.index')}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
                        aria-label="Kembali"
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                    </Link>
                    <h2 className="text-lg font-semibold text-foreground">Tambah {pageLabel}</h2>
                </div>
            }
        >
            <Head title={`Tambah ${pageLabel}`} />

            <div className="mx-auto max-w-3xl">
                <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                    <div className="border-b border-border bg-muted/50 px-6 py-5">
                        <h3 className="text-base font-semibold text-foreground">Informasi Karyawan</h3>
                        <p className="mt-0.5 text-sm text-muted-foreground">Tambahkan {pageLabel.toLowerCase()} dan akun login admin jika diperlukan.</p>
                    </div>
                    <div className="p-6">
                        <EmployeeForm
                            data={data} setData={setData} errors={errors}
                            processing={processing} onSubmit={submit}
                            branches={branches} roles={roles}
                            submitLabel={`Simpan ${pageLabel}`}
                            cancelHref={route('admin.employees.index')}
                            storeType={storeType}
                            showCommission={showCommission}
                        />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
