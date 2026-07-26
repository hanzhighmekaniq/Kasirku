import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader";
import { useForm } from "@inertiajs/react";
import SectionCard from "@/Components/ui/SectionCard";
import BookingForm from "./BookingForm";

export default function Create({ customers = [], employees = [], tables = [] }) {
    const { data, setData, post, processing, errors } = useForm({
        customer_id: "",
        employee_id: "",
        resource_type: "",
        resource_id: "",
        customer_name: "",
        customer_phone: "",
        booking_start_at: "",
        booking_end_at: "",
        guest_count: "",
        deposit_amount: "",
        deposit_paid: "",
        status: "pending",
        notes: "",
    });

    const submit = (e) => {
        e.preventDefault();
        post(route("admin.bookings.store"));
    };

    return (
        <AuthenticatedLayout
            backUrl={route("admin.bookings.index")}
            header={
                <div className="leading-tight">
                    <div className="text-sm font-semibold text-foreground">
                        Booking
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                        Tambah
                    </div>
                </div>
            }>
            <PageHeader
                title="Tambah Booking"
                breadcrumbs={["Admin", "Booking", "Tambah"]}
                heading={
                    <>
                        Tambah{" "}
                        <span className="bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
                            Booking
                        </span>
                    </>
                }
                description="Catat reservasi baru beserta jam kedatangan dan depositnya."
            />

            <div className="mx-auto max-w-2xl">
                <SectionCard
                    title="Informasi Booking"
                    subtitle="Isi data pelanggan dan jadwal reservasi."
                >
                    <BookingForm
                        data={data}
                        setData={setData}
                        errors={errors}
                        processing={processing}
                        onSubmit={submit}
                        submitLabel="Buat Booking"
                        cancelHref={route("admin.bookings.index")}
                        customers={customers}
                        employees={employees}
                        tables={tables}
                    />
                </SectionCard>
            </div>
        </AuthenticatedLayout>
    );
}
