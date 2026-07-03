import DeveloperLayout from '@/Layouts/DeveloperLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import BranchForm from './BranchForm';

export default function Create({ store }) {
    const { data, setData, post, processing, errors } = useForm({
        code: '',
        name: '',
        phone: '',
        address: '',
        is_active: true,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('developer.stores.branches.store', store));
    };

    return (
        <DeveloperLayout
            header={
                <div className="flex items-center gap-3">
                    <Link
                        href={route('developer.stores.branches.index', store)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                        aria-label="Kembali"
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                    </Link>
                    <div>
                        <h2 className="text-lg font-semibold text-slate-800">Tambah Cabang</h2>
                        <p className="text-xs text-slate-500">{store.name}</p>
                    </div>
                </div>
            }
        >
            <Head title={`Tambah Cabang — ${store.name}`} />

            <div className="mx-auto max-w-2xl">
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-5">
                        <h3 className="text-base font-semibold text-slate-900">Informasi Cabang</h3>
                        <p className="mt-0.5 text-sm text-slate-500">Buat outlet untuk memisahkan stok, transaksi, dan kasir per lokasi.</p>
                    </div>
                    <div className="p-6">
                        <BranchForm
                            data={data}
                            setData={setData}
                            errors={errors}
                            processing={processing}
                            onSubmit={submit}
                            submitLabel="Simpan Cabang"
                            cancelHref={route('developer.stores.branches.index', store)}
                        />
                    </div>
                </div>
            </div>
        </DeveloperLayout>
    );
}
