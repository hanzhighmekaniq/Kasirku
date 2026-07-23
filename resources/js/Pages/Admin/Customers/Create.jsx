import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader";
import { Head, Link, useForm } from "@inertiajs/react";
import SectionCard from "@/Components/ui/SectionCard";
import CustomerForm from "./CustomerForm";

export default function Create({ storeType = "retail" }) {
    const { data, setData, post, processing, errors } = useForm({
        name: "",
        phone: "",
        email: "",
        address: "",
        birth_date: "",
        gender: "",
        notes: "",
    });

    const subtitle = ["retail", "fnb", "service", "hospitality"].includes(storeType)
        ? "Tambahkan pelanggan baru untuk program loyalitas."
        : "Tambahkan pelanggan baru.";
    const submit = (e) => {
        e.preventDefault();
        post(route("admin.customers.store"));
    };

    return (
        <AuthenticatedLayout>
            <PageHeader
                title="Tambah Pelanggan"
                breadcrumbs={["Admin", "Pelanggan", "Tambah"]}
                heading={
                    <>
                        Tambah{" "}
                        <span className="bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
                            Pelanggan
                        </span>
                    </>
                }
                description={subtitle}
                backUrl={route("admin.customers.index")}
            />

            <div className="mx-auto max-w-2xl">
                <SectionCard
                    title="Informasi Pelanggan"
                    subtitle={subtitle}
                >
                    <CustomerForm
                        data={data}
                        setData={setData}
                        errors={errors}
                        processing={processing}
                        onSubmit={submit}
                        submitLabel="Simpan Pelanggan"
                        cancelHref={route("admin.customers.index")}
                        storeType={storeType}
                    />
                </SectionCard>
            </div>
        </AuthenticatedLayout>
    );
}
