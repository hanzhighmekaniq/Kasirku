import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, useForm } from "@inertiajs/react";
import Field from "@/Components/ui/Field";
import SectionCard from "@/Components/ui/SectionCard";
import CustomerForm from "./CustomerForm";

export default function Edit({ customer, storeType = "retail" }) {
    const { data, setData, put, processing, errors } = useForm({
        name: customer.name || "",
        phone: customer.phone || "",
        email: customer.email || "",
        address: customer.address || "",
        birth_date: customer.birth_date || "",
        gender: customer.gender || "",
        notes: customer.notes || "",
        deposit_balance: customer.deposit_balance ?? 0,
        debt_balance: customer.debt_balance ?? 0,
        credit_limit: customer.credit_limit ?? 0,
    });
    const submit = (e) => {
        e.preventDefault();
        put(route("admin.customers.update", customer.id));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <Link
                        href={route("admin.customers.index")}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
                        aria-label="Kembali"
                    >
                        <svg
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.8}
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15.75 19.5L8.25 12l7.5-7.5"
                            />
                        </svg>
                    </Link>
                    <h2 className="text-lg font-semibold text-foreground">
                        Edit Pelanggan
                    </h2>
                </div>
            }
        >
            <Head title="Edit Pelanggan" />

            <div className="mx-auto max-w-2xl">
                <SectionCard
                    title="Informasi Pelanggan"
                    subtitle={`Perbarui data pelanggan "${customer.name}".`}
                >
                    <CustomerForm
                        data={data}
                        setData={setData}
                        errors={errors}
                        processing={processing}
                        onSubmit={submit}
                        submitLabel="Simpan Perubahan"
                        cancelHref={route("admin.customers.index")}
                        storeType={storeType}
                        customer={customer}
                    />
                </SectionCard>
            </div>
        </AuthenticatedLayout>
    );
}
