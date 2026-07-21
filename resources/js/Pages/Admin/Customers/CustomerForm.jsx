import { Link, router } from "@inertiajs/react";
import { useState } from "react";
import Button from "@/Components/ui/Button";
import Field from "@/Components/ui/Field";
import SearchableSelect from "@/Components/ui/SearchableSelect";

const inp = (err) =>
    `mt-1.5 block w-full rounded-xl border py-2.5 px-3.5 text-sm shadow-sm transition focus:ring-2 ${
        err
            ? "border-red-300 focus:border-red-500 focus:ring-red-200"
            : "border-border focus:border-ring focus:ring-ring/20"
    }`;

const genderOptions = [
    { id: "male", name: "Laki-laki" },
    { id: "female", name: "Perempuan" },
];

export default function CustomerForm({
    data,
    setData,
    errors,
    processing,
    onSubmit,
    submitLabel = "Simpan",
    cancelHref,
    storeType = "retail",
    customer = null,
}) {
    const showDeposit = ["service", "rental", "hospitality", "parking", "session"].includes(storeType);
    const [payAmount, setPayAmount] = useState("");
    const [payProcessing, setPayProcessing] = useState(false);

    const handlePayDebt = () => {
        if (!payAmount || Number(payAmount) <= 0) return;
        setPayProcessing(true);
        router.post(
            route("admin.customers.pay-debt", customer.id),
            { amount: Number(payAmount) },
            {
                preserveScroll: true,
                onSuccess: () => setPayAmount(""),
                onFinish: () => setPayProcessing(false),
            },
        );
    };

    return (
        <form onSubmit={onSubmit} className="space-y-5">
            <Field label="Nama Pelanggan" required error={errors.name}>
                <input
                    type="text"
                    value={data.name}
                    autoFocus
                    onChange={(e) => setData("name", e.target.value)}
                    placeholder="cth. John Doe"
                    className={inp(errors.name)}
                />
            </Field>

            <div className="grid grid-cols-2 gap-4">
                <Field label="Telepon" error={errors.phone}>
                    <input
                        type="text"
                        value={data.phone ?? ""}
                        onChange={(e) => setData("phone", e.target.value)}
                        placeholder="08xxxxxxxxxx"
                        className={inp(errors.phone)}
                    />
                </Field>
                <Field label="Email" error={errors.email}>
                    <input
                        type="email"
                        value={data.email ?? ""}
                        onChange={(e) => setData("email", e.target.value)}
                        placeholder="email@contoh.com"
                        className={inp(errors.email)}
                    />
                </Field>
                <Field label="Tanggal Lahir" error={errors.birth_date}>
                    <input
                        type="date"
                        value={data.birth_date ?? ""}
                        onChange={(e) => setData("birth_date", e.target.value)}
                        className={inp(errors.birth_date)}
                    />
                </Field>
                <Field label="Jenis Kelamin" error={errors.gender}>
                    <SearchableSelect
                        options={genderOptions}
                        value={data.gender ?? ""}
                        onChange={(id) => setData("gender", id)}
                        placeholder="Pilih..."
                        searchPlaceholder="Ketik..."
                    />
                </Field>
            </div>

            <Field label="Alamat" error={errors.address}>
                <textarea
                    value={data.address ?? ""}
                    onChange={(e) => setData("address", e.target.value)}
                    rows={2}
                    placeholder="Alamat lengkap..."
                    className={inp(errors.address)}
                />
            </Field>

            {showDeposit && (
                <Field label="Saldo Deposit" error={errors.deposit_balance}>
                    <div className="relative">
                        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
                            Rp
                        </span>
                        <input
                            type="number"
                            value={data.deposit_balance ?? ""}
                            onChange={(e) => setData("deposit_balance", e.target.value)}
                            min="0"
                            placeholder="0"
                            className={`${inp(errors.deposit_balance)} pl-9`}
                        />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Saldo deposit pelanggan (untuk pembayaran prepaid)
                    </p>
                </Field>
            )}

            {/* Hutang Section */}
            <div className="rounded-xl border border-border bg-muted/50 p-4 space-y-3">
                <h4 className="text-sm font-semibold text-foreground">Hutang / Kasbon</h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Limit Kredit" error={errors.credit_limit}>
                        <div className="relative">
                            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
                                Rp
                            </span>
                            <input
                                type="number"
                                value={data.credit_limit ?? ""}
                                onChange={(e) => setData("credit_limit", e.target.value)}
                                min="0"
                                placeholder="0"
                                className={`${inp(errors.credit_limit)} pl-9`}
                            />
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Batas maksimal hutang (0 = tanpa limit)
                        </p>
                    </Field>
                    <Field label="Saldo Hutang Saat Ini">
                        <div className="relative">
                            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
                                Rp
                            </span>
                            <input
                                type="text"
                                value={Number(data.debt_balance ?? 0).toLocaleString("id-ID")}
                                disabled
                                className={`${inp()} pl-9 bg-muted text-muted-foreground`}
                            />
                        </div>
                    </Field>
                </div>

                {/* Pay Debt */}
                {customer && (data.debt_balance ?? 0) > 0 && (
                    <div className="flex items-end gap-3 border-t border-border pt-3">
                        <div className="flex-1">
                            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Bayar Hutang
                            </label>
                            <div className="relative">
                                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
                                    Rp
                                </span>
                                <input
                                    type="number"
                                    value={payAmount}
                                    onChange={(e) => setPayAmount(e.target.value)}
                                    min="0"
                                    max={data.debt_balance}
                                    placeholder="0"
                                    className={`${inp()} pl-9`}
                                />
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handlePayDebt}
                            disabled={payProcessing || !payAmount || Number(payAmount) <= 0}
                            className="shrink-0 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                            {payProcessing ? "..." : "Bayar"}
                        </button>
                    </div>
                )}
            </div>

            <Field label="Catatan" error={errors.notes}>
                <textarea
                    value={data.notes ?? ""}
                    onChange={(e) => setData("notes", e.target.value)}
                    rows={2}
                    placeholder="Preferensi, catatan khusus..."
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
