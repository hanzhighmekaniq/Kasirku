import { Link } from "@inertiajs/react";
import Button from "@/Components/ui/Button";
import Select from "@/Components/ui/Select";

const STATUS_OPTIONS = [
    { value: "active", label: "Aktif" },
    { value: "inactive", label: "Nonaktif" },
    { value: "terminated", label: "Berhenti" },
];

const COMMISSION_OPTIONS = [
    { value: "none", label: "Tidak ada" },
    { value: "percent", label: "Persentase (%)" },
    { value: "flat", label: "Nominal Tetap (Rp)" },
];

function inputCls(hasError) {
    return `mt-1.5 block w-full rounded-xl border text-sm shadow-sm transition focus:outline-none focus:ring-2 ${
        hasError
            ? "border-destructive/40 focus:border-destructive focus:ring-destructive/20"
            : "border-border focus:border-ring focus:ring-ring/20"
    }`;
}

function Field({ label, hint, error, required, children }) {
    return (
        <div>
            <label className="block text-sm font-medium text-foreground">
                {label}{" "}
                {required && <span className="text-destructive">*</span>}
            </label>
            {children}
            {hint && !error && (
                <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
            )}
            {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
        </div>
    );
}

function SectionCard({ step, title, subtitle, children }) {
    return (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="border-b border-border bg-muted/40 px-5 py-4 sm:px-6">
                <div className="flex items-start gap-3">
                    {step != null && (
                        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                            {step}
                        </span>
                    )}
                    <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-foreground sm:text-base">
                            {title}
                        </h3>
                        {subtitle && (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                {subtitle}
                            </p>
                        )}
                    </div>
                </div>
            </div>
            <div className="p-5 sm:p-6">{children}</div>
        </div>
    );
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
    storeType = "retail",
    showCommission = false,
}) {
    const showAccountFields = data.create_account;
    const assignableRoles = roles.filter(
        (r) => r.name !== "owner" && r.name !== "developer",
    );

    const POSITION_HINT = {
        service: "cth. Terapis, Receptionist",
        rental: "cth. Operator, Admin",
        ticket: "cth. Operator Loket, Guide",
        hospitality: "cth. Resepsionis, Housekeeping",
        parking: "cth. Petugas Loket, Security",
        session: "cth. Operator, Admin",
    };
    const positionPlaceholder =
        POSITION_HINT[storeType] ?? "cth. Kasir, Manager Shift";

    let step = 1;

    return (
        <form onSubmit={onSubmit} className="space-y-5">
            <SectionCard
                step={step++}
                title="Informasi Dasar"
                subtitle="Identitas karyawan yang tampil di POS, shift, dan laporan"
            >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field
                        label="Kode Karyawan"
                        required
                        error={errors.employee_code}
                    >
                        <input
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
                            className={inputCls(!!errors.employee_code)}
                        />
                    </Field>

                    <Select
                        label="Cabang"
                        options={branches.map((b) => ({
                            value: b.id,
                            label: `${b.name} (${b.code})`,
                        }))}
                        value={data.branch_id}
                        onChange={(v) => setData("branch_id", v)}
                        placeholder="Belum ditentukan"
                        error={errors.branch_id}
                    />
                </div>

                <div className="mt-4">
                    <Field label="Nama Karyawan" required error={errors.name}>
                        <input
                            type="text"
                            value={data.name}
                            onChange={(e) => setData("name", e.target.value)}
                            placeholder="cth. Siti Aminah"
                            className={inputCls(!!errors.name)}
                        />
                    </Field>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Telepon" error={errors.phone}>
                        <input
                            type="text"
                            value={data.phone}
                            onChange={(e) => setData("phone", e.target.value)}
                            placeholder="08xxxxxxxxxx"
                            className={inputCls(!!errors.phone)}
                        />
                    </Field>

                    <Field
                        label="Email"
                        required={!!data.create_account}
                        error={errors.email}
                    >
                        <input
                            type="email"
                            value={data.email}
                            onChange={(e) => setData("email", e.target.value)}
                            placeholder="nama@email.com"
                            className={inputCls(!!errors.email)}
                        />
                    </Field>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Jabatan" error={errors.position}>
                        <input
                            type="text"
                            value={data.position}
                            onChange={(e) =>
                                setData("position", e.target.value)
                            }
                            placeholder={positionPlaceholder}
                            className={inputCls(!!errors.position)}
                        />
                    </Field>

                    <Select
                        label="Status"
                        required
                        options={STATUS_OPTIONS}
                        value={data.status}
                        onChange={(v) => setData("status", v)}
                        placeholder="Pilih Status"
                        error={errors.status}
                    />
                </div>
            </SectionCard>

            {showCommission && (
                <SectionCard
                    step={step++}
                    title="Komisi"
                    subtitle="Atur skema komisi per transaksi bila tersedia di tipe toko ini"
                >
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Select
                            label="Tipe Komisi"
                            options={COMMISSION_OPTIONS}
                            value={data.commission_type}
                            onChange={(v) => setData("commission_type", v)}
                            placeholder="Pilih Tipe"
                            error={errors.commission_type}
                        />

                        {data.commission_type !== "none" && (
                            <Field
                                label={
                                    data.commission_type === "percent"
                                        ? "Persentase (%)"
                                        : "Nominal (Rp)"
                                }
                                error={errors.commission_value}
                            >
                                <div className="relative">
                                    {data.commission_type === "flat" && (
                                        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
                                            Rp
                                        </span>
                                    )}
                                    <input
                                        type="number"
                                        min="0"
                                        step={
                                            data.commission_type === "percent"
                                                ? "0.1"
                                                : "1000"
                                        }
                                        max={
                                            data.commission_type === "percent"
                                                ? "100"
                                                : undefined
                                        }
                                        value={data.commission_value}
                                        onChange={(e) =>
                                            setData(
                                                "commission_value",
                                                e.target.value,
                                            )
                                        }
                                        placeholder={
                                            data.commission_type === "percent"
                                                ? "contoh: 15"
                                                : "contoh: 50000"
                                        }
                                        className={`${inputCls(!!errors.commission_value)} ${data.commission_type === "flat" ? "pl-10" : ""}`}
                                    />
                                    {data.commission_type === "percent" && (
                                        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
                                            %
                                        </span>
                                    )}
                                </div>
                                {!errors.commission_value && (
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {data.commission_type === "percent"
                                            ? "Komisi dihitung dari total transaksi."
                                            : "Komisi tetap per transaksi."}
                                    </p>
                                )}
                            </Field>
                        )}
                    </div>
                </SectionCard>
            )}

            <SectionCard
                step={step++}
                title="Akun Login"
                subtitle="Opsional — aktifkan jika karyawan perlu masuk dashboard atau POS"
            >
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-muted/30 p-4 transition hover:bg-muted/50">
                    <input
                        type="checkbox"
                        checked={data.create_account}
                        onChange={(e) =>
                            setData("create_account", e.target.checked)
                        }
                        className="mt-0.5 h-4 w-4 rounded border-border text-primary shadow-sm focus:ring-primary"
                    />
                    <span>
                        <span className="block text-sm font-medium text-foreground">
                            Buat / aktifkan akun login
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                            Aktifkan jika karyawan perlu masuk ke dashboard atau
                            POS.
                        </span>
                    </span>
                </label>

                {showAccountFields && (
                    <div className="mt-5 space-y-5 border-t border-border pt-5">
                        <div>
                            <span className="mb-2 block text-sm font-medium text-foreground">
                                Role Akun{" "}
                                <span className="text-destructive">*</span>
                            </span>
                            <div className="flex flex-wrap gap-2">
                                {assignableRoles.length > 0
                                    ? assignableRoles.map((r) => {
                                          const active = data.role === r.name;
                                          return (
                                              <label
                                                  key={r.name}
                                                  className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
                                                      active
                                                          ? "border-primary bg-primary/10 text-primary"
                                                          : "border-border bg-card text-muted-foreground hover:bg-muted"
                                                  }`}
                                              >
                                                  <input
                                                      type="radio"
                                                      name="role"
                                                      value={r.name}
                                                      checked={active}
                                                      onChange={(e) =>
                                                          setData(
                                                              "role",
                                                              e.target.value,
                                                          )
                                                      }
                                                      className="sr-only"
                                                  />
                                                  <span className="font-medium capitalize">
                                                      {r.name}
                                                  </span>
                                              </label>
                                          );
                                      })
                                    : [
                                          ["admin", "Admin"],
                                          ["kasir", "Kasir"],
                                          ["supervisor", "Supervisor"],
                                          ["gudang", "Gudang"],
                                      ].map(([v, l]) => {
                                          const active = data.role === v;
                                          return (
                                              <label
                                                  key={v}
                                                  className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
                                                      active
                                                          ? "border-primary bg-primary/10 text-primary"
                                                          : "border-border bg-card text-muted-foreground hover:bg-muted"
                                                  }`}
                                              >
                                                  <input
                                                      type="radio"
                                                      name="role"
                                                      value={v}
                                                      checked={active}
                                                      onChange={(e) =>
                                                          setData(
                                                              "role",
                                                              e.target.value,
                                                          )
                                                      }
                                                      className="sr-only"
                                                  />
                                                  <span className="font-medium">
                                                      {l}
                                                  </span>
                                              </label>
                                          );
                                      })}
                            </div>
                            {errors.role && (
                                <p className="mt-1 text-xs text-destructive">
                                    {errors.role}
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <Field
                                label="Password"
                                required={!editing}
                                hint={
                                    editing
                                        ? "Kosongkan jika tidak diganti"
                                        : "Minimal 8 karakter"
                                }
                                error={errors.password}
                            >
                                <input
                                    type="password"
                                    value={data.password}
                                    onChange={(e) =>
                                        setData("password", e.target.value)
                                    }
                                    placeholder="••••••••"
                                    className={inputCls(!!errors.password)}
                                />
                            </Field>

                            <Field
                                label="Konfirmasi Password"
                                required={!editing}
                                error={errors.password_confirmation}
                            >
                                <input
                                    type="password"
                                    value={data.password_confirmation}
                                    onChange={(e) =>
                                        setData(
                                            "password_confirmation",
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Ulangi password"
                                    className={inputCls(
                                        !!errors.password_confirmation,
                                    )}
                                />
                            </Field>
                        </div>
                    </div>
                )}
            </SectionCard>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Link
                    href={cancelHref}
                    className="inline-flex justify-center rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted"
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
