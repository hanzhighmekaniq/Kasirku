import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
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
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <Link
                        href={route('admin.cafe-tables.index')}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                        aria-label="Kembali"
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                    </Link>
                    <h2 className="text-lg font-semibold text-slate-800">Edit Meja Cafe</h2>
                </div>
            }
        >
            <Head title={`Edit Meja ${cafeTable.table_number}`} />

            <div className="mx-auto max-w-2xl">
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-5">
                        <h3 className="text-base font-semibold text-slate-900">Detail Meja</h3>
                        <p className="mt-0.5 text-sm text-slate-500">
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
