import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader";
import { Head, useForm } from "@inertiajs/react";
import Button from "@/Components/ui/Button";

const DAY_NAMES = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

export default function Index({ hours }) {
    const { data, setData, put, processing } = useForm({
        hours: hours.map((h) => ({
            day_of_week: h.day_of_week,
            open_time: h.open_time || "08:00",
            close_time: h.close_time || "21:00",
            is_closed: h.is_closed || false,
        })),
    });

    const updateDay = (index, field, value) => {
        const updated = [...data.hours];
        updated[index] = { ...updated[index], [field]: value };
        setData("hours", updated);
    };

    const submit = (e) => {
        e.preventDefault();
        put(route("admin.business-hours.update"));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="leading-tight">
                    <div className="text-sm font-semibold text-foreground">
                        Jam Operasional
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                        Pengaturan
                    </div>
                </div>
            }
        >
            <PageHeader
                title="Jam Operasional"
                breadcrumbs={["Admin", "Pengaturan", "Jam Operasional"]}
                heading={
                    <>
                        Jam{" "}
                        <span className="bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
                            Operasional
                        </span>
                    </>
                }
                description="Atur jam buka dan tutup toko untuk setiap hari."
            />

            <div className="mx-auto max-w-3xl space-y-6 px-4 sm:px-6 lg:px-8">
                <form onSubmit={submit}>
                    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                        <div className="border-b border-border p-4">
                            <h3 className="text-sm font-semibold text-card-foreground">Jadwal Mingguan</h3>
                        </div>

                        <div className="hidden md:block">
                            <table className="min-w-full divide-y divide-border">
                                <thead className="bg-popover text-xs uppercase tracking-wide text-card-foreground">
                                    <tr>
                                        <th className="px-5 py-3.5 text-left font-semibold">Hari</th>
                                        <th className="px-5 py-3.5 text-center font-semibold">Status</th>
                                        <th className="px-5 py-3.5 text-left font-semibold">Jam Buka</th>
                                        <th className="px-5 py-3.5 text-left font-semibold">Jam Tutup</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border bg-background">
                                    {data.hours.map((day, index) => (
                                        <tr key={day.day_of_week} className="transition hover:bg-[rgb(var(--color-table-hover))]">
                                            <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-card-foreground">
                                                {DAY_NAMES[day.day_of_week]}
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => updateDay(index, "is_closed", !day.is_closed)}
                                                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition ${
                                                        day.is_closed
                                                            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                                            : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                                    }`}
                                                >
                                                    {day.is_closed ? "Tutup" : "Buka"}
                                                </button>
                                            </td>
                                            <td className="px-5 py-4">
                                                <input
                                                    type="time"
                                                    value={day.open_time}
                                                    onChange={(e) => updateDay(index, "open_time", e.target.value)}
                                                    disabled={day.is_closed}
                                                    className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-card-foreground disabled:opacity-40"
                                                />
                                            </td>
                                            <td className="px-5 py-4">
                                                <input
                                                    type="time"
                                                    value={day.close_time}
                                                    onChange={(e) => updateDay(index, "close_time", e.target.value)}
                                                    disabled={day.is_closed}
                                                    className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-card-foreground disabled:opacity-40"
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="space-y-3 p-3 md:hidden">
                            {data.hours.map((day, index) => (
                                <div key={day.day_of_week} className="rounded-xl border border-border bg-background p-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-card-foreground">{DAY_NAMES[day.day_of_week]}</span>
                                        <button
                                            type="button"
                                            onClick={() => updateDay(index, "is_closed", !day.is_closed)}
                                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition ${
                                                day.is_closed
                                                    ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                                    : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                            }`}
                                        >
                                            {day.is_closed ? "Tutup" : "Buka"}
                                        </button>
                                    </div>
                                    {!day.is_closed && (
                                        <div className="mt-3 flex gap-2">
                                            <input type="time" value={day.open_time} onChange={(e) => updateDay(index, "open_time", e.target.value)} className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-card-foreground" />
                                            <span className="self-center text-xs text-muted-foreground">-</span>
                                            <input type="time" value={day.close_time} onChange={(e) => updateDay(index, "close_time", e.target.value)} className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-card-foreground" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-4 flex justify-end">
                        <Button type="submit" disabled={processing}>
                            {processing ? "Menyimpan..." : "Simpan Jam Operasional"}
                        </Button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
