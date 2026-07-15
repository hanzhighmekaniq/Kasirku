import { Link } from "@inertiajs/react";
import Field from "@/Components/ui/Field";
import SearchableSelect from "@/Components/ui/SearchableSelect";

const inp = (err) =>
    `mt-1.5 block w-full rounded-xl border py-2.5 px-3.5 text-sm shadow-sm transition focus:ring-2 ${
        err
            ? "border-red-300 focus:border-red-500 focus:ring-red-200"
            : "border-slate-300 focus:border-indigo-500 focus:ring-indigo-200"
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
}) {
    const showDeposit = ["service", "rental", "hospitality", "parking", "session"].includes(storeType);
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
                        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-slate-400">
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
                    <p className="mt-1 text-xs text-slate-400">
                        Saldo deposit pelanggan (untuk pembayaran prepaid)
                    </p>
                </Field>
            )}

            <Field label="Catatan" error={errors.notes}>
                <textarea
                    value={data.notes ?? ""}
                    onChange={(e) => setData("notes", e.target.value)}
                    rows={2}
                    placeholder="Preferensi, catatan khusus..."
                    className={inp(errors.notes)}
                />
            </Field>

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <Link
                    href={cancelHref}
                    className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                    Batal
                </Link>
                <button
                    type="submit"
                    disabled={processing}
                    className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                    {processing ? "Menyimpan..." : submitLabel}
                </button>
            </div>
        </form>
    );
}
