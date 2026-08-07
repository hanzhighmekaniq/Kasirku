import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader";
import { Head, router } from "@inertiajs/react";
import { useState } from "react";
import { Search } from "lucide-react";
import Button from "@/Components/ui/Button";
import CurrencyInput from "@/Components/ui/CurrencyInput";
import Field from "@/Components/ui/Field";
import Select from "@/Components/ui/Select";

const fmt = (n) =>
    "Rp" +
    Number(n ?? 0).toLocaleString("id-ID", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });

export default function Index({ customers, paymentMethods = [] }) {
    const [search, setSearch] = useState("");
    const [payModal, setPayModal] = useState(null);
    const [payAmount, setPayAmount] = useState("");
    const [payMethodId, setPayMethodId] = useState("");
    const [paying, setPaying] = useState(false);
    /* Pesan penolakan dari backend. Sebelumnya modal ditutup lewat onFinish
       sehingga error apa pun ikut hilang dan user mengira sudah tersimpan. */
    const [payError, setPayError] = useState("");
    const [methodError, setMethodError] = useState("");

    /** Buka modal dengan metode pembayaran pertama sebagai default. */
    const openPayModal = (customer) => {
        setPayModal(customer);
        setPayAmount("");
        setPayMethodId(paymentMethods[0] ? String(paymentMethods[0].id) : "");
        setPayError("");
        setMethodError("");
    };

    const closePayModal = () => {
        setPayModal(null);
        setPayAmount("");
        setPayMethodId("");
        setPayError("");
        setMethodError("");
    };

    const filtered = search.trim()
        ? customers.filter(
            (c) =>
                c.name.toLowerCase().includes(search.toLowerCase()) ||
                (c.code || "").toLowerCase().includes(search.toLowerCase()) ||
                (c.phone || "").includes(search),
        )
        : customers;

    // Total dihitung dari hasil filter supaya angkanya konsisten dengan baris
    // yang sedang terlihat, bukan seluruh data.
    const totalDebt = filtered.reduce(
        (sum, c) => sum + Number(c.debt_balance ?? 0),
        0,
    );

    const canSubmitPayment =
        !!payModal && Number(payAmount) > 0 && !!payMethodId;

    const handlePay = () => {
        if (!canSubmitPayment) return;
        setPaying(true);
        setPayError("");
        setMethodError("");
        router.post(
            route("admin.debts.pay", payModal.id),
            {
                amount: Number(payAmount),
                payment_method_id: payMethodId,
            },
            {
                preserveScroll: true,
                // Modal hanya ditutup kalau backend benar-benar menerima.
                onSuccess: closePayModal,
                onError: (errors) => {
                    setPayError(errors.amount || "");
                    setMethodError(errors.payment_method_id || "");
                },
                onFinish: () => setPaying(false),
            },
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="leading-tight">
                    <div className="text-sm font-semibold text-foreground">
                        Kasbon
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                        Manajemen Hutang
                    </div>
                </div>
            }>
            <PageHeader
                title="Hutang / Kasbon"
                breadcrumbs={["Admin", "Keuangan", "Kasbon"]}
                heading={
                    <>
                        Kelola{" "}
                        <span className="bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
                            Hutang
                        </span>{" "}
                        Pelanggan
                    </>
                }
                description="Pantau dan catat pembayaran hutang / kasbon pelanggan."
            />

            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                {/* Toolbar disamakan dengan halaman tabel lain: search selebar
                    ruang tersisa, tinggi py-2.5, dan ikon di dalam field. */}
                <div className="border-b border-border p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="relative flex-1">
                            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
                                <Search className="h-4 w-4" strokeWidth={1.8} />
                            </span>
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari nama, kode, atau telepon pelanggan..."
                                className="block w-full rounded-xl border border-input bg-background py-2.5 pl-9 pr-3 text-sm text-foreground shadow-sm transition placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
                            />
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-4">
                        <p className="text-xs text-muted-foreground">
                            Menampilkan{" "}
                            <span className="font-semibold text-foreground">{filtered.length}</span>{" "}
                            dari{" "}
                            <span className="font-semibold text-foreground">{customers.length}</span>{" "}
                            pelanggan berhutang
                        </p>
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-destructive/10 px-2.5 py-1 text-xs font-semibold text-destructive">
                            Total hutang {fmt(totalDebt)}
                        </span>
                    </div>
                </div>

                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-success/10">
                            <svg className="h-8 w-8 text-success" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="mt-4 text-base font-semibold text-foreground">
                            {search ? "Pelanggan tidak ditemukan" : "Tidak ada pelanggan berhutang"}
                        </h3>
                        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                            {search ? "Coba kata kunci lain." : "Semua pelanggan sudah melunasi hutangnya."}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-popover text-xs uppercase tracking-wide text-card-foreground">
                                <tr>
                                    <th className="px-4 py-3.5 text-left font-semibold">Pelanggan</th>
                                    <th className="px-4 py-3.5 text-left font-semibold">Telepon</th>
                                    <th className="px-4 py-3.5 text-right font-semibold">Total Hutang</th>
                                    <th className="px-4 py-3.5 text-right font-semibold">Limit Kredit</th>
                                    <th className="px-4 py-3.5 text-right font-semibold">Sisa Limit</th>
                                    <th className="px-4 py-3.5 text-right font-semibold">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border bg-background">
                                {filtered.map((c) => (
                                    <tr key={c.id} className="transition hover:bg-[rgb(var(--color-table-hover))]">
                                        <td className="px-4 py-3.5">
                                            <p className="font-medium text-foreground">{c.name}</p>
                                            {c.code && <p className="text-xs text-muted-foreground">{c.code}</p>}
                                        </td>
                                        <td className="px-4 py-3.5 text-muted-foreground">{c.phone || "—"}</td>
                                        <td className="px-4 py-3.5 text-right">
                                            {(c.debt_balance ?? 0) > 0 ? (
                                                <span className="inline-flex items-center rounded-lg border border-destructive/20 bg-destructive/10 px-2.5 py-1 text-xs font-semibold text-destructive">
                                                    {fmt(c.debt_balance)}
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground">
                                                    {fmt(0)}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3.5 text-right text-muted-foreground ">
                                            {(c.credit_limit ?? 0) > 0 ? fmt(c.credit_limit) : "—"}
                                        </td>
                                        <td className="px-4 py-3.5 text-right">
                                            <span className={(c.credit_limit ?? 0) > 0 && (c.credit_limit - c.debt_balance) < 50000 ? "font-semibold text-warning" : "text-muted-foreground"}>
                                                {(c.credit_limit ?? 0) > 0 ? fmt(c.credit_limit - c.debt_balance) : "—"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5 text-right">
                                            <Button
                                                type="button"
                                                variant="success"
                                                size="sm"
                                                onClick={() => openPayModal(c)}
                                            >
                                                Bayar Hutang
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal pembayaran hutang */}
            {payModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                        onClick={closePayModal}
                    />
                    <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-2xl">
                        <div className="px-6 pt-6">
                            <h3 className="text-base font-semibold text-popover-foreground">
                                Bayar Hutang
                            </h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {payModal.name}
                                {payModal.code ? ` · ${payModal.code}` : ""}
                            </p>

                            <div className="mt-4 flex items-center justify-between rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3">
                                <span className="text-xs font-medium text-destructive">
                                    Sisa hutang
                                </span>
                                <span className="text-sm font-bold text-destructive">
                                    {fmt(payModal.debt_balance)}
                                </span>
                            </div>

                            <div className="mt-4 space-y-4">
                                <Field label="Jumlah Pembayaran" required error={payError}>
                                    <CurrencyInput
                                        value={payAmount}
                                        onChange={setPayAmount}
                                        placeholder="0"
                                        error={!!payError}
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setPayAmount(String(payModal.debt_balance))
                                        }
                                        className="mt-2 inline-flex items-center rounded-lg bg-success px-3 py-1.5 text-xs font-semibold text-success-foreground transition hover:bg-success/90"
                                    >
                                        Lunasi Semua ({fmt(payModal.debt_balance)})
                                    </button>
                                </Field>

                                <Field
                                    label="Metode Pembayaran"
                                    required
                                    error={methodError}
                                >
                                    {paymentMethods.length === 0 ? (
                                        <p className="rounded-xl border border-warning/20 bg-warning/10 px-3.5 py-2.5 text-xs text-warning">
                                            Belum ada metode pembayaran aktif. Tambahkan dulu
                                            di menu Metode Pembayaran.
                                        </p>
                                    ) : (
                                        <Select
                                            options={paymentMethods}
                                            value={payMethodId}
                                            onChange={setPayMethodId}
                                            placeholder="Pilih metode pembayaran"
                                            error={methodError}
                                        />
                                    )}
                                </Field>

                                {Number(payAmount) > 0 && (
                                    <div className="flex items-center justify-between rounded-xl bg-muted px-4 py-3 text-sm">
                                        <span className="text-muted-foreground">
                                            Sisa setelah bayar
                                        </span>
                                        <span className="font-semibold text-foreground">
                                            {fmt(
                                                Math.max(
                                                    0,
                                                    Number(payModal.debt_balance) -
                                                    Number(payAmount),
                                                ),
                                            )}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-2 border-t border-border bg-muted/50 px-6 py-4">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={closePayModal}
                            >
                                Batal
                            </Button>
                            <Button
                                type="button"
                                variant="success"
                                size="sm"
                                onClick={handlePay}
                                disabled={!canSubmitPayment}
                                loading={paying}
                            >
                                {paying ? "Memproses..." : "Simpan Pembayaran"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
