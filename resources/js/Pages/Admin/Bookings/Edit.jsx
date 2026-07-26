import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader";
import { useForm } from "@inertiajs/react";
import SectionCard from "@/Components/ui/SectionCard";
import BookingForm from "./BookingForm";

export default function Edit({ booking, customers = [], employees = [], tables = [] }) {
    const { data, setData, patch, processing, errors } = useForm({
        customer_id: booking.customer_id ?? "",
        employee_id: booking.employee_id ?? "",
        resource_type: booking.resource_type ?? "",
        resource_id: booking.resource_id ?? "",
        customer_name: booking.customer_name ?? "",
        customer_phone: booking.customer_phone ?? "",
        booking_start_at: booking.booking_start_at ?? "",
        booking_end_at: booking.booking_end_at ?? "",
        guest_count: booking.guest_count ?? "",
        deposit_amount: booking.deposit_amount ?? "",
        deposit_paid: booking.deposit_paid ?? "",
        status: booking.status,
        notes: booking.notes ?? "",
    });

    const submit = (e) => {
        e.preventDefault();
        patch(route("admin.bookings.update", booking.id));
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
                        {booking.booking_no}
                    </div>
                </div>
            }>
            <PageHeader
                title={`Edit Booking - ${booking.booking_no}`}
                breadcrumbs={["Admin", "Booking", booking.booking_no]}
                heading={
                    <>
                        Edit{" "}
                        <span className="bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
                            Booking
                        </span>
                    </>
                }
                description="Perbarui jadwal, status, atau deposit reservasi ini."
            />

            <div className="mx-auto max-w-2xl">
                <SectionCard
                    title={`Booking ${booking.booking_no}`}
                    subtitle="Ubah data reservasi lalu simpan."
                >
                    <BookingForm
                        data={data}
                        setData={setData}
                        errors={errors}
                        processing={processing}
                        onSubmit={submit}
                        submitLabel="Simpan Perubahan"
                        cancelHref={route("admin.bookings.show", booking.id)}
                        customers={customers}
                        employees={employees}
                        tables={tables}
                        isEdit
                    />
                </SectionCard>
            </div>
        </AuthenticatedLayout>
    );
}
