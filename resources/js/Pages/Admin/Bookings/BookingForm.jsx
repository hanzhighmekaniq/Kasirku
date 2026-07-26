import { Link } from "@inertiajs/react";
import Button from "@/Components/ui/Button";
import Field from "@/Components/ui/Field";
import SearchableSelect from "@/Components/ui/SearchableSelect";
import DateTimePicker from "@/Components/ui/DateTimePicker";

const inp = (err) =>
    `mt-1.5 block w-full rounded-lg border py-2.5 px-3.5 text-sm bg-background text-foreground outline-none transition-all ${
        err
            ? "border-destructive focus:border-destructive focus:ring-3 focus:ring-destructive/20"
            : "border-border focus:border-ring focus:ring-3 focus:ring-primary/20"
    }`;

/* Status akhir hanya masuk akal untuk booking yang sudah ada — backend juga
   menolaknya saat membuat (lihat BookingController::rules). */
const CREATE_STATUSES = [
    { id: "pending", name: "Pending" },
    { id: "confirmed", name: "Confirmed" },
    { id: "checked_in", name: "Checked In" },
];

const EDIT_STATUSES = [
    ...CREATE_STATUSES,
    { id: "completed", name: "Completed" },
    { id: "cancelled", name: "Cancelled" },
    { id: "no_show", name: "No Show" },
];

/** ISO/`Y-m-d H:i:s` dari server -> Date untuk DateTimePicker. */
function toDate(value) {
    if (!value) return null;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
}

/** Date -> `Y-m-d H:i:s` lokal. toISOString() menggeser ke UTC dan membuat
    booking jam 19:00 WIB tersimpan sebagai 12:00. */
function toServer(date) {
    if (!date) return "";
    const p = (n) => String(n).padStart(2, "0");
    return (
        `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}` +
        ` ${p(date.getHours())}:${p(date.getMinutes())}:00`
    );
}

export default function BookingForm({
    data,
    setData,
    errors,
    processing,
    onSubmit,
    submitLabel = "Simpan",
    cancelHref,
    customers = [],
    employees = [],
    tables = [],
    isEdit = false,
}) {
    /* Memilih meja sekaligus menetapkan resource_type — backend mewajibkan
       keduanya ada bersamaan (required_with). */
    const setTable = (id) => {
        setData((prev) => ({
            ...prev,
            resource_id: id,
            resource_type: id ? "table" : "",
        }));
    };

    return (
        <form onSubmit={onSubmit} className="space-y-5">
            <Field label="Nama Pelanggan" required error={errors.customer_name}>
                <input
                    type="text"
                    value={data.customer_name ?? ""}
                    autoFocus
                    maxLength={200}
                    onChange={(e) => setData("customer_name", e.target.value)}
                    placeholder="cth. Budi Santoso"
                    className={inp(errors.customer_name)}
                />
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Telepon" error={errors.customer_phone}>
                    <input
                        type="text"
                        value={data.customer_phone ?? ""}
                        maxLength={30}
                        onChange={(e) => setData("customer_phone", e.target.value)}
                        placeholder="08xxxxxxxxxx"
                        className={inp(errors.customer_phone)}
                    />
                </Field>
                <Field label="Pelanggan Terdaftar" error={errors.customer_id}>
                    <SearchableSelect
                        options={customers}
                        value={data.customer_id ?? ""}
                        onChange={(id) => setData("customer_id", id)}
                        placeholder="— Tanpa pelanggan —"
                        searchPlaceholder="Cari pelanggan..."
                        error={!!errors.customer_id}
                    />
                </Field>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Karyawan" error={errors.employee_id}>
                    <SearchableSelect
                        options={employees}
                        value={data.employee_id ?? ""}
                        onChange={(id) => setData("employee_id", id)}
                        placeholder="— Tanpa karyawan —"
                        searchPlaceholder="Cari karyawan..."
                        error={!!errors.employee_id}
                    />
                </Field>
                {/* Meja hanya ada di toko FnB/hospitality */}
                {tables.length > 0 && (
                    <Field label="Meja" error={errors.resource_id}>
                        <SearchableSelect
                            options={tables.map((t) => ({
                                id: t.id,
                                name: t.capacity
                                    ? `${t.table_number} (${t.capacity} org)`
                                    : t.table_number,
                            }))}
                            value={data.resource_id ?? ""}
                            onChange={setTable}
                            placeholder="— Tanpa meja —"
                            searchPlaceholder="Cari meja..."
                            error={!!errors.resource_id}
                        />
                    </Field>
                )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Mulai" required error={errors.booking_start_at}>
                    <DateTimePicker
                        value={toDate(data.booking_start_at)}
                        onChange={(d) => setData("booking_start_at", toServer(d))}
                        placeholder="Pilih tanggal & jam mulai"
                        clearable={false}
                    />
                </Field>
                <Field label="Selesai" error={errors.booking_end_at}>
                    <DateTimePicker
                        value={toDate(data.booking_end_at)}
                        onChange={(d) => setData("booking_end_at", toServer(d))}
                        placeholder="Pilih tanggal & jam selesai"
                        minDate={toDate(data.booking_start_at)}
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                        Dikosongkan berarti dianggap 2 jam.
                    </p>
                </Field>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Jumlah Tamu" error={errors.guest_count}>
                    <input
                        type="number"
                        min="1"
                        value={data.guest_count ?? ""}
                        onChange={(e) => setData("guest_count", e.target.value)}
                        placeholder="0"
                        className={inp(errors.guest_count)}
                    />
                </Field>
                <Field label="Status" required error={errors.status}>
                    <SearchableSelect
                        options={isEdit ? EDIT_STATUSES : CREATE_STATUSES}
                        value={data.status ?? "pending"}
                        onChange={(id) => setData("status", id)}
                        placeholder="Pilih status"
                        searchPlaceholder="Cari status..."
                        error={!!errors.status}
                        required
                    />
                </Field>
            </div>

            <div className="space-y-3 rounded-xl border border-border bg-muted/50 p-4">
                <h4 className="text-sm font-semibold text-foreground">Deposit</h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Ditagih" error={errors.deposit_amount}>
                        <div className="relative">
                            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
                                Rp
                            </span>
                            <input
                                type="number"
                                min="0"
                                step="any"
                                value={data.deposit_amount ?? ""}
                                onChange={(e) => setData("deposit_amount", e.target.value)}
                                placeholder="0"
                                className={`${inp(errors.deposit_amount)} pl-9`}
                            />
                        </div>
                    </Field>
                    <Field label="Dibayar" error={errors.deposit_paid}>
                        <div className="relative">
                            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
                                Rp
                            </span>
                            <input
                                type="number"
                                min="0"
                                step="any"
                                value={data.deposit_paid ?? ""}
                                onChange={(e) => setData("deposit_paid", e.target.value)}
                                placeholder="0"
                                className={`${inp(errors.deposit_paid)} pl-9`}
                            />
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Tidak boleh melebihi deposit yang ditagih.
                        </p>
                    </Field>
                </div>
            </div>

            <Field label="Catatan" error={errors.notes}>
                <textarea
                    value={data.notes ?? ""}
                    rows={3}
                    maxLength={500}
                    onChange={(e) => setData("notes", e.target.value)}
                    placeholder="Permintaan khusus, preferensi meja..."
                    className={inp(errors.notes)}
                />
            </Field>

            <div className="flex justify-end gap-3 border-t border-border pt-4">
                <Link
                    href={cancelHref}
                    className="rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted"
                >
                    Batal
                </Link>
                <Button type="submit" loading={processing}>
                    {submitLabel}
                </Button>
            </div>
        </form>
    );
}
