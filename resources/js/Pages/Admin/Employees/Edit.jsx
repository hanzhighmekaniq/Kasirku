import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import EmployeeForm from './EmployeeForm';

export default function Edit({ employee, branches, roles = [], storeType = "retail" }) {
    const { data, setData, put, processing, errors } = useForm({
        employee_code:     employee.employee_code || '',
        branch_id:         employee.branch_id || '',
        name:              employee.name || '',
        phone:             employee.phone || '',
        email:             employee.email || employee.user?.email || '',
        position:          employee.position || '',
        commission_type:   employee.commission_type || 'none',
        commission_value:  employee.commission_value || 0,
        status:            employee.status || 'active',
        create_account:    !!employee.user,
        role:              employee.user_roles?.[0] || 'kasir',
        password:          '',
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
        put(route('admin.employees.update', employee.id));
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
                    <h2 className="text-lg font-semibold text-foreground">Edit {pageLabel}</h2>
                </div>
            }
        >
            <Head title={`Edit ${pageLabel}`} />

            <div className="mx-auto max-w-3xl">
                <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                    <div className="border-b border-border bg-muted/50 px-6 py-5">
                        <h3 className="text-base font-semibold text-foreground">Informasi Karyawan</h3>
                        <p className="mt-0.5 text-sm text-muted-foreground">Perbarui detail {pageLabel.toLowerCase()} "{employee.name}".</p>
                    </div>
                    <div className="p-6">
                        <EmployeeForm
                            data={data} setData={setData} errors={errors}
                            processing={processing} onSubmit={submit}
                            branches={branches} roles={roles}
                            submitLabel="Simpan Perubahan"
                            cancelHref={route('admin.employees.index')}
                            editing
                            storeType={storeType}
                            showCommission={showCommission}
                        />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
