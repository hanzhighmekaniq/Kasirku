import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader";
import { Head, Link, useForm } from "@inertiajs/react";

export default function Create({ branchName, suggestedShiftNo, storeType = "retail" }) {
    const { data, setData, post, processing, errors } = useForm({
        opening_cash: "",
        opening_note: "",
    });

    const PAGE_LABEL = {
        retail: "Shift Kasir",
        fnb: "Shift Kasir",
        service: "Shift Layanan",
        rental: "Shift Staf",
        ticket: "Shift Operator",
        hospitality: "Shift Resepsionis",
        parking: "Shift Petugas",
        session: "Shift Operator",
    };
    const pageLabel = PAGE_LABEL[storeType] ?? "Shift Kasir";

    const submit = (e) => {
        e.preventDefault();
        post(route("admin.cashier-shifts.store"));
    };

    return (
        <AuthenticatedLayout
            
            header={
                <div className="leading-tight"
            
            backUrl={route("admin.cashier-shifts.index")}>
                    <div className="text-sm font-semibold text-foreground">
                        Shift
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                        Buka
                    </div>
                </div>
            }>
            <PageHeader
                title={`Buka ${pageLabel}`}
                breadcrumbs={["Admin", "Shift", "Buka"]}
                heading={
                    <>
                        Buka{" "}
                        <span className="bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
                            {pageLabel}
                        </span>
                    </>
                }
                description={branchName || "Masukkan kas awal untuk membuka shift."}
                
            />

            <div className="mx-auto max-w-lg">
                <form
                    onSubmit={submit}
                    className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
                >
                    {/* Header kartu */}
                    <div className="border-b border-border bg-muted px-6 py-4">
                        <p className="text-sm font-semibold text-foreground">
                            Informasi Shift
                        </p>
                        {suggestedShiftNo && (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                Nomor shift:{" "}
                                <span className="font-mono font-semibold text-primary-600">
                                    {suggestedShiftNo}
                                </span>
                            </p>
                        )}
                    </div>

                    {/* Body */}
                    <div className="space-y-5 p-6">
                        {/* Kas Awal */}
                        <div>
                            <label
                                htmlFor="opening_cash"
                                className="mb-1.5 block text-sm font-medium text-foreground"
                            >
                                Kas Awal <span className="text-destructive">*</span>
                            </label>
                            <div className="relative">
                                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-muted-foreground">
                                    Rp
                                </span>
                                <input
                                    id="opening_cash"
                                    type="number"
                                    min="0"
                                    step="1"
                                    required
                                    value={data.opening_cash}
                                    onChange={(e) =>
                                        setData("opening_cash", e.target.value)
                                    }
                                    className="block w-full rounded-xl border-border pl-9 text-sm shadow-sm focus:border-ring focus:ring-2 focus:ring-ring/20"
                                    placeholder="0"
                                />
                            </div>
                            {errors.opening_cash && (
                                <p className="mt-1 text-xs text-destructive">
                                    {errors.opening_cash}
                                </p>
                            )}
                            <p className="mt-1 text-xs text-muted-foreground">
                                Jumlah uang tunai di laci kasir saat memulai
                                shift.
                            </p>
                        </div>

                        {/* Catatan Pembukaan */}
                        <div>
                            <label
                                htmlFor="opening_note"
                                className="mb-1.5 block text-sm font-medium text-foreground"
                            >
                                Catatan Pembukaan
                            </label>
                            <textarea
                                id="opening_note"
                                rows={3}
                                maxLength={1000}
                                value={data.opening_note}
                                onChange={(e) =>
                                    setData("opening_note", e.target.value)
                                }
                                className="block w-full rounded-xl border-border text-sm shadow-sm focus:border-ring focus:ring-2 focus:ring-ring/20"
                                placeholder="Opsional..."
                            />
                            {errors.opening_note && (
                                <p className="mt-1 text-xs text-destructive">
                                    {errors.opening_note}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-2 border-t border-border bg-muted px-6 py-4">
                        <Link
                            href={route("admin.cashier-shifts.index")}
                            className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
                        >
                            Batal
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-xl bg-primary-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-primary/90 disabled:opacity-60"
                        >
                            {processing ? "Membuka..." : "Buka Shift"}
                        </button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
