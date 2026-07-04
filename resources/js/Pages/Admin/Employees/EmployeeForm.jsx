import { Link } from "@inertiajs/react";

const STATUS_OPTIONS = [
    { value: "active", label: "Aktif" },
    { value: "inactive", label: "Nonaktif" },
    { value: "terminated", label: "Berhenti" },
];

function inputClass(hasError) {
    return `mt-1.5 block w-full rounded-xl shadow-sm transition focus:ring-2 ${
        hasError
            ? "border-red-300 focus:border-red-500 focus:ring-red-200"
            : "border-slate-300 focus:border-indigo-500 focus:ring-indigo-200"
    }`;
}

function FieldError({ message }) {
    return message ? (
        <p className="mt-1.5 text-sm text-red-600">{message}</p>
    ) : null;
}

export default function EmployeeForm({
    data,
    setData,
    errors,
    processing,
    onSubmit,
    branches,
    roles = [],
    submitLabel = "Simpan",
    cancelHref,
    editing = false,
}) {
    const showAccountFields = data.create_account;
    // Filter role yang bisa di-assign ke karyawan (bukan owner)
    const assignableRoles = roles.filter(r => r.name !== 'owner' && r.name !== 'developer');

    return (
        <form onSubmit={onSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                    <label
                        htmlFor="employee_code"
                        className="block text-sm font-medium text-slate-700"
                    >
                        Kode Karyawan <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="employee_code"
                        type="text"
                        value={data.employee_code}
                        autoFocus
                        onChange={(e) =>
                            setData(
                                "employee_code",
                                e.target.value.toUpperCase(),
                            )
                        }
                        placeholder="cth. EMP0001"
                        className={inputClass(!!errors.employee_code)}
                    />
                    <FieldError message={errors.employee_code} />
                </div>

                <div>
                    <label
                        htmlFor="branch_id"
                        className="block text-sm font-medium text-slate-700"
                    >
                        Cabang
                    </label>
                    <select
                        id="branch_id"
                        value={data.branch_id}
                        onChange={(e) => setData("branch_id", e.target.value)}
                        className={inputClass(!!errors.branch_id)}
                    >
                        <option value="">Belum ditentukan</option>
                        {branches.map((branch) => (
                            <option key={branch.id} value={branch.id}>
                                {branch.name} ({branch.code})
                            </option>
                        ))}
                    </select>
                    <FieldError message={errors.branch_id} />
                </div>
            </div>

            <div>
                <label
                    htmlFor="name"
                    className="block text-sm font-medium text-slate-700"
                >
                    Nama Karyawan <span className="text-red-500">*</span>
                </label>
                <input
                    id="name"
                    type="text"
                    value={data.name}
                    onChange={(e) => setData("name", e.target.value)}
                    placeholder="cth. Siti Aminah"
                    className={inputClass(!!errors.name)}
                />
                <FieldError message={errors.name} />
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                    <label
                        htmlFor="phone"
                        className="block text-sm font-medium text-slate-700"
                    >
                        Telepon
                    </label>
                    <input
                        id="phone"
                        type="text"
                        value={data.phone}
                        onChange={(e) => setData("phone", e.target.value)}
                        placeholder="08xxxxxxxxxx"
                        className={inputClass(!!errors.phone)}
                    />
                    <FieldError message={errors.phone} />
                </div>

                <div>
                    <label
                        htmlFor="email"
                        className="block text-sm font-medium text-slate-700"
                    >
                        Email{" "}
                        {data.create_account && (
                            <span className="text-red-500">*</span>
                        )}
                    </label>
                    <input
                        id="email"
                        type="email"
                        value={data.email}
                        onChange={(e) => setData("email", e.target.value)}
                        placeholder="nama@email.com"
                        className={inputClass(!!errors.email)}
                    />
                    <FieldError message={errors.email} />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                    <label
                        htmlFor="position"
                        className="block text-sm font-medium text-slate-700"
                    >
                        Jabatan
                    </label>
                    <input
                        id="position"
                        type="text"
                        value={data.position}
                        onChange={(e) => setData("position", e.target.value)}
                        placeholder="cth. Kasir, Manager Shift"
                        className={inputClass(!!errors.position)}
                    />
                    <FieldError message={errors.position} />
                </div>

                <div>
                    <label
                        htmlFor="status"
                        className="block text-sm font-medium text-slate-700"
                    >
                        Status <span className="text-red-500">*</span>
                    </label>
                    <select
                        id="status"
                        value={data.status}
                        onChange={(e) => setData("status", e.target.value)}
                        className={inputClass(!!errors.status)}
                    >
                        {STATUS_OPTIONS.map((status) => (
                            <option key={status.value} value={status.value}>
                                {status.label}
                            </option>
                        ))}
                    </select>
                    <FieldError message={errors.status} />
                </div>
            </div>

            {/* Section Komisi */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <h3 className="mb-3 text-sm font-semibold text-slate-700">Komisi</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <label htmlFor="commission_type" className="block text-sm font-medium text-slate-700">
                            Tipe Komisi
                        </label>
                        <select
                            id="commission_type"
                            value={data.commission_type}
                            onChange={(e) => setData("commission_type", e.target.value)}
                            className={inputClass(!!errors.commission_type)}
                        >
                            <option value="none">Tidak ada</option>
                            <option value="percent">Persentase (%)</option>
                            <option value="flat">Nominal Tetap (Rp)</option>
                        </select>
                        <FieldError message={errors.commission_type} />
                    </div>

                    {data.commission_type !== "none" && (
                        <div>
                            <label htmlFor="commission_value" className="block text-sm font-medium text-slate-700">
                                {data.commission_type === "percent" ? "Persentase (%)" : "Nominal (Rp)"}
                            </label>
                            <div className="relative mt-1.5">
                                {data.commission_type === "flat" && (
                                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-slate-400">Rp</span>
                                )}
                                <input
                                    id="commission_value"
                                    type="number"
                                    min="0"
                                    step={data.commission_type === "percent" ? "0.1" : "1000"}
                                    max={data.commission_type === "percent" ? "100" : undefined}
                                    value={data.commission_value}
                                    onChange={(e) => setData("commission_value", e.target.value)}
                                    placeholder={data.commission_type === "percent" ? "contoh: 15" : "contoh: 50000"}
                                    className={`${inputClass(!!errors.commission_value)} ${data.commission_type === "flat" ? "pl-10" : ""}`}
                                />
                                {data.commission_type === "percent" && (
                                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-slate-400">%</span>
                                )}
                            </div>
                            <FieldError message={errors.commission_value} />
                            <p className="mt-1 text-xs text-slate-400">
                                {data.commission_type === "percent"
                                    ? "Komisi dihitung dari total transaksi."
                                    : "Komisi tetap per transaksi."}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Section Akun Login */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <label className="flex items-start gap-3">
                    <input
                        type="checkbox"
                        checked={data.create_account}
                        onChange={(e) =>
                            setData("create_account", e.target.checked)
                        }
                        className="mt-0.5 rounded border-slate-300 text-indigo-600 shadow-sm focus:ring-indigo-500"
                    />
                    <span>
                        <span className="block text-sm font-medium text-slate-800">
                            Buat / aktifkan akun login
                        </span>
                        <span className="mt-0.5 block text-xs text-slate-500">
                            Aktifkan ini jika karyawan perlu masuk ke dashboard
                            atau POS.
                        </span>
                    </span>
                </label>

                {showAccountFields && (
                        <div className="mt-5 space-y-5 border-t border-slate-200 pt-5">
                        <div>
                            <span className="block text-sm font-medium text-slate-700 mb-2">
                                Role Akun:
                            </span>
                            <div className="flex flex-wrap gap-3">
                                {assignableRoles.length > 0
                                    ? assignableRoles.map(r => (
                                        <label key={r.name} className="flex items-center gap-2 cursor-pointer">
                                            <input type="radio" name="role" value={r.name}
                                                checked={data.role === r.name}
                                                onChange={(e) => setData("role", e.target.value)}
                                                className="rounded-full border-slate-300 text-indigo-600 shadow-sm focus:ring-indigo-500" />
                                            <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                                                {r.name}
                                            </span>
                                        </label>
                                    ))
                                    : [['admin','Admin','emerald'], ['kasir','Kasir','blue'], ['supervisor','Supervisor','violet'], ['gudang','Gudang','orange']].map(([v,l,c]) => (
                                        <label key={v} className="flex items-center gap-2 cursor-pointer">
                                            <input type="radio" name="role" value={v}
                                                checked={data.role === v}
                                                onChange={(e) => setData("role", e.target.value)}
                                                className="rounded-full border-slate-300 text-indigo-600 shadow-sm focus:ring-indigo-500" />
                                            <span className={`inline-flex items-center rounded-full bg-${c}-50 px-2.5 py-0.5 text-xs font-semibold text-${c}-700`}>{l}</span>
                                        </label>
                                    ))
                                }
                            </div>
                            <FieldError message={errors.role} />
                        </div>

                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <div>
                                <label
                                    htmlFor="password"
                                    className="block text-sm font-medium text-slate-700"
                                >
                                    Password{" "}
                                    {!editing && (
                                        <span className="text-red-500">*</span>
                                    )}
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    value={data.password}
                                    onChange={(e) =>
                                        setData("password", e.target.value)
                                    }
                                    placeholder={
                                        editing
                                            ? "Kosongkan jika tidak diganti"
                                            : "Minimal 8 karakter"
                                    }
                                    className={inputClass(!!errors.password)}
                                />
                                <FieldError message={errors.password} />
                            </div>

                            <div>
                                <label
                                    htmlFor="password_confirmation"
                                    className="block text-sm font-medium text-slate-700"
                                >
                                    Konfirmasi Password{" "}
                                    {!editing && (
                                        <span className="text-red-500">*</span>
                                    )}
                                </label>
                                <input
                                    id="password_confirmation"
                                    type="password"
                                    value={data.password_confirmation}
                                    onChange={(e) =>
                                        setData(
                                            "password_confirmation",
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Ulangi password"
                                    className={inputClass(
                                        !!errors.password_confirmation,
                                    )}
                                />
                                <FieldError
                                    message={errors.password_confirmation}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <Link
                    href={cancelHref}
                    className="inline-flex justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                    Batal
                </Link>
                <button
                    type="submit"
                    disabled={processing}
                    className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:from-indigo-600 hover:to-violet-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60"
                >
                    {processing ? "Menyimpan..." : submitLabel}
                </button>
            </div>
        </form>
    );
}
