import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader";
import { Link, router } from "@inertiajs/react";
import { useState } from "react";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import Button from "@/Components/ui/Button";
import ConfirmDeleteModal from "@/Components/ConfirmDeleteModal";
import StatusBadge from "./StatusBadge";

function formatRupiah(val) {
    return "Rp " + Number(val || 0).toLocaleString("id-ID");
}

function formatDateTime(str) {
    if (!str) return "—";
    return new Date(str).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function Row({ label, children }) {
    return (
        <div>
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <p className="mt-0.5 text-sm font-medium text-foreground">{children}</p>
        </div>
    );
}

export default function Show({ booking, table = null }) {
    const [confirming, setConfirming] = useState(false);

    const sisaDeposit =
        Number(booking.deposit_amount || 0) - Number(booking.deposit_paid || 0);

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
                title={`Booking - ${booking.booking_no}`}
                breadcrumbs={["Admin", "Booking", booking.booking_no]}
                heading={
                    <>
                        Detail{" "}
                        <span className="bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
                            Booking
                        </span>
                    </>
                }
                description="Rincian reservasi pelanggan."
                action={
                    <Link href={route("admin.bookings.edit", booking.id)}>
                        <Button icon={Pencil}>Edit</Button>
                    </Link>
                }
            />

            <div className="mx-auto max-w-3xl space-y-6">
                <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                    <div className="flex flex-col gap-4 border-b border-border p-6 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                No. Booking
                            </p>
                            <h3 className="mt-1 text-xl font-bold text-foreground">
                                {booking.booking_no}
                            </h3>
                        </div>
                        <StatusBadge status={booking.status} large />
                    </div>

                    <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
                        <Row label="Nama Pelanggan">{booking.customer_name}</Row>
                        <Row label="Telepon">{booking.customer_phone || "—"}</Row>
                        <Row label="Pelanggan Terdaftar">
                            {booking.customer?.name || "—"}
                        </Row>
                        <Row label="Karyawan">{booking.employee?.name || "—"}</Row>
                        <Row label="Mulai">{formatDateTime(booking.booking_start_at)}</Row>
                        <Row label="Selesai">
                            {booking.booking_end_at
                                ? formatDateTime(booking.booking_end_at)
                                : "— (dianggap 2 jam)"}
                        </Row>
                        <Row label="Meja">{table || "—"}</Row>
                        <Row label="Jumlah Tamu">
                            {booking.guest_count ? `${booking.guest_count} orang` : "—"}
                        </Row>
                        <Row label="Cabang">{booking.branch?.name || "—"}</Row>
                        {booking.notes && (
                            <div className="sm:col-span-2">
                                <p className="text-xs font-medium text-muted-foreground">
                                    Catatan
                                </p>
                                <p className="mt-0.5 whitespace-pre-wrap text-sm text-foreground">
                                    {booking.notes}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                    <div className="border-b border-border bg-muted/50 px-6 py-4">
                        <h3 className="text-sm font-semibold text-foreground">Deposit</h3>
                    </div>
                    <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-3">
                        <Row label="Ditagih">{formatRupiah(booking.deposit_amount)}</Row>
                        <Row label="Dibayar">{formatRupiah(booking.deposit_paid)}</Row>
                        <div>
                            <p className="text-xs font-medium text-muted-foreground">
                                Sisa
                            </p>
                            <p
                                className={`mt-0.5 text-sm font-bold ${
                                    sisaDeposit > 0 ? "text-warning" : "text-success"
                                }`}
                            >
                                {formatRupiah(sisaDeposit)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <Link
                        href={route("admin.bookings.index")}
                        className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted"
                    >
                        <ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
                        Kembali ke Daftar
                    </Link>
                    <button
                        onClick={() => setConfirming(true)}
                        className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-destructive transition hover:bg-destructive/10"
                    >
                        <Trash2 className="h-4 w-4" strokeWidth={1.8} />
                        Hapus Booking
                    </button>
                </div>
            </div>

            <ConfirmDeleteModal
                open={confirming}
                title="Hapus booking?"
                description={`Booking ${booking.booking_no} untuk ${booking.customer_name} akan dihapus permanen.`}
                onConfirm={() =>
                    router.delete(route("admin.bookings.destroy", booking.id))
                }
                onClose={() => setConfirming(false)}
            />
        </AuthenticatedLayout>
    );
}
