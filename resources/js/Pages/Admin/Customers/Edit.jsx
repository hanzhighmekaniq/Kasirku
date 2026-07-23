import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader";
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
        <AuthenticatedLayout>
            <PageHeader
                title="Edit Pelanggan"
                breadcrumbs={["Admin", "Pelanggan", "Edit"]}
                heading={
                    <>
                        Edit{" "}
                        <span className="bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
                            Pelanggan
                        </span>
                    </>
                }
                description={`Perbarui data pelanggan "${customer.name}".`}
                backUrl={route("admin.customers.index")}
            />

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
