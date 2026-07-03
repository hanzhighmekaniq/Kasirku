import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import EmployeeForm from './EmployeeForm';

export default function Create({ branches, suggestedCode, roles = [] }) {
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
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                        aria-label="Kembali"
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                    </Link>
                    <h2 className="text-lg font-semibold text-slate-800">Tambah Karyawan / User</h2>
                </div>
            }
        >
            <Head title="Tambah Karyawan / User" />

            <div className="mx-auto max-w-3xl">
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-5">
                        <h3 className="text-base font-semibold text-slate-900">Informasi Karyawan</h3>
                        <p className="mt-0.5 text-sm text-slate-500">Tambahkan karyawan dan akun login admin jika diperlukan.</p>
                    </div>
                    <div className="p-6">
                        <EmployeeForm
                            data={data} setData={setData} errors={errors}
                            processing={processing} onSubmit={submit}
                            branches={branches} roles={roles}
                            submitLabel="Simpan Karyawan"
                            cancelHref={route('admin.employees.index')}
                        />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
