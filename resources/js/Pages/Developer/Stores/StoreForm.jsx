import DeveloperLayout from "@/Layouts/DeveloperLayout";
import { Link, usePage } from "@inertiajs/react";
import { useState } from "react";

const iCls = (err) =>
    `block w-full rounded-xl border px-3 py-2 text-sm shadow-sm transition focus:outline-none focus:ring-2 ${
        err
            ? "border-red-300 focus:ring-red-200"
            : "border-slate-300 focus:ring-indigo-200 focus:border-indigo-500"
    }`;

export default function StoreForm({
    title,
    data,
    setData,
    errors,
    processing,
    onSubmit,
    cancelHref,
    isEdit = false,
    availableOwners = [],
    plans = [],
    storeTypes = [],
    onAddBranch,
    onRemoveBranch,
    onUpdateBranch,
    onToggleOwner,
    onUpdateNewOwner,
}) {
    const [ownerSearch, setOwnerSearch] = useState("");

    const filteredOwners = ownerSearch.trim()
        ? availableOwners.filter(
              (u) =>
                  u.name.toLowerCase().includes(ownerSearch.toLowerCase()) ||
                  u.email.toLowerCase().includes(ownerSearch.toLowerCase()) ||
                  (u.stores ?? []).some((s) =>
                      s.toLowerCase().includes(ownerSearch.toLowerCase()),
                  ),
          )
        : availableOwners;
    return (
        <DeveloperLayout
            header={<span className="font-semibold">{title}</span>}
        >
            <div className="mx-auto max-w-3xl">
                <form onSubmit={onSubmit} className="space-y-6">
                    {/* Info Toko */}
                    <section className="rounded-2xl border border-slate-200 bg-white p-6">
                        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
                            Informasi Toko
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">
                                    Kode Toko *
                                </label>
                                <input
                                    value={data.code}
                                    onChange={(e) =>
                                        setData(
                                            "code",
                                            e.target.value.toUpperCase(),
                                        )
                                    }
                                    className={iCls(errors.code)}
                                    placeholder="STORE001"
                                />
                                {errors.code && (
                                    <p className="mt-1 text-xs text-red-600">
                                        {errors.code}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">
                                    Nama Toko *
                                </label>
                                <input
                                    value={data.name}
                                    onChange={(e) =>
                                        setData("name", e.target.value)
                                    }
                                    className={iCls(errors.name)}
                                    placeholder="Kopi Senja"
                                />
                                {errors.name && (
                                    <p className="mt-1 text-xs text-red-600">
                                        {errors.name}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">
                                    No. Telepon
                                </label>
                                <input
                                    value={data.phone}
                                    onChange={(e) =>
                                        setData("phone", e.target.value)
                                    }
                                    className={iCls(errors.phone)}
                                    placeholder="081234567890"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={(e) =>
                                        setData("email", e.target.value)
                                    }
                                    className={iCls(errors.email)}
                                    placeholder="toko@email.com"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="mb-1 block text-sm font-medium text-slate-700">
                                    Alamat
                                </label>
                                <textarea
                                    value={data.address}
                                    onChange={(e) =>
                                        setData("address", e.target.value)
                                    }
                                    rows={2}
                                    className={iCls(errors.address)}
                                    placeholder="Jl. Contoh No. 1, Kota"
                                />
                            </div>
                            <div className="col-span-2 flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={data.is_active}
                                    onChange={(e) =>
                                        setData("is_active", e.target.checked)
                                    }
                                    className="h-4 w-4 rounded"
                                />
                                <label
                                    htmlFor="is_active"
                                    className="text-sm text-slate-700"
                                >
                                    Toko Aktif
                                </label>
                            </div>
                        </div>
                    </section>

                    {/* Tipe Toko */}
                    <section className="rounded-2xl border border-slate-200 bg-white p-6">
                        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
                            Tipe Toko *
                        </h2>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                            {storeTypes.map((t) => (
                                <button
                                    type="button"
                                    key={t.id}
                                    onClick={() =>
                                        setData("store_type_id", t.id)
                                    }
                                    className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 text-center transition ${
                                        data.store_type_id === t.id
                                            ? "border-indigo-500 bg-indigo-50"
                                            : "border-slate-200 bg-white hover:border-slate-300"
                                    }`}
                                >
                                    <span className="text-2xl">{t.icon}</span>
                                    <span
                                        className={`text-xs font-semibold ${data.store_type_id === t.id ? "text-indigo-700" : "text-slate-700"}`}
                                    >
                                        {t.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                        {errors.store_type_id && (
                            <p className="mt-2 text-xs text-red-600">
                                {errors.store_type_id}
                            </p>
                        )}
                    </section>

                    {/* Paket Langganan */}
                    <section className="rounded-2xl border border-slate-200 bg-white p-6">
                        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
                            Paket Langganan
                        </h2>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                            {(Array.isArray(plans)
                                ? plans
                                : Object.values(plans)
                            ).map((plan) => {
                                const isSelected = data.plan_id === plan.id;
                                const colorMap = {
                                    free: {
                                        border: "border-slate-200 hover:border-slate-300",
                                        selectedBorder:
                                            "border-slate-700 bg-slate-50",
                                        badge: "bg-slate-500",
                                    },
                                    basic: {
                                        border: "border-blue-200 hover:border-blue-300",
                                        selectedBorder:
                                            "border-blue-600 bg-blue-50",
                                        badge: "bg-blue-500",
                                    },
                                    pro: {
                                        border: "border-indigo-200 hover:border-indigo-300",
                                        selectedBorder:
                                            "border-indigo-600 bg-indigo-50",
                                        badge: "bg-indigo-500",
                                    },
                                };
                                const c = colorMap[plan.key] ?? colorMap.free;
                                return (
                                    <button
                                        type="button"
                                        key={plan.id}
                                        onClick={() =>
                                            setData("plan_id", plan.id)
                                        }
                                        className={`flex flex-col rounded-xl border-2 p-4 text-left transition ${isSelected ? c.selectedBorder : c.border}`}
                                    >
                                        <span
                                            className={`inline-flex w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold text-white ${c.badge}`}
                                        >
                                            {plan.label}
                                        </span>
                                        {plan.price > 0 && (
                                            <span className="mt-1.5 text-sm font-bold text-slate-800">
                                                Rp{" "}
                                                {plan.price.toLocaleString(
                                                    "id-ID",
                                                )}
                                                <span className="text-xs font-normal text-slate-400">
                                                    /bln
                                                </span>
                                            </span>
                                        )}
                                        <span className="mt-2 text-xs text-slate-600">
                                            Maks {plan.max_users} user ·{" "}
                                            {plan.max_branches} cabang
                                        </span>
                                        {plan.trial_days > 0 && (
                                            <span className="mt-1 text-[11px] text-emerald-600">
                                                Trial {plan.trial_days} hari
                                            </span>
                                        )}
                                        <span className="mt-1 text-[11px] text-slate-400 leading-relaxed">
                                            {plan.features?.length > 0
                                                ? plan.features.length +
                                                  " fitur"
                                                : "Semua fitur"}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                        {errors.plan_id && (
                            <p className="mt-2 text-xs text-red-600">
                                {errors.plan_id}
                            </p>
                        )}

                        {/* Override per-toko — hanya di edit mode */}
                        {isEdit && (
                            <div className="mt-5 grid grid-cols-3 gap-4 rounded-xl bg-slate-50 p-4">
                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                        Exp. Plan
                                    </label>
                                    <input
                                        type="date"
                                        value={data.plan_expires_at ?? ""}
                                        onChange={(e) =>
                                            setData(
                                                "plan_expires_at",
                                                e.target.value || null,
                                            )
                                        }
                                        className="block w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                                    />
                                    <p className="mt-1 text-[10px] text-slate-400">
                                        Kosong = tidak ada batas
                                    </p>
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                        Override Max User
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={data.max_users ?? ""}
                                        onChange={(e) =>
                                            setData(
                                                "max_users",
                                                e.target.value
                                                    ? parseInt(e.target.value)
                                                    : null,
                                            )
                                        }
                                        placeholder="Ikut plan"
                                        className="block w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                                    />
                                    <p className="mt-1 text-[10px] text-slate-400">
                                        Kosong = ikut plan
                                    </p>
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                        Override Max Cabang
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={data.max_branches ?? ""}
                                        onChange={(e) =>
                                            setData(
                                                "max_branches",
                                                e.target.value
                                                    ? parseInt(e.target.value)
                                                    : null,
                                            )
                                        }
                                        placeholder="Ikut plan"
                                        className="block w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                                    />
                                    <p className="mt-1 text-[10px] text-slate-400">
                                        Kosong = ikut plan
                                    </p>
                                </div>
                            </div>
                        )}
                    </section>

                    {/* Cabang — hanya saat create */}
                    {!isEdit && (
                        <section className="rounded-2xl border border-slate-200 bg-white p-6">
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                                    Cabang *
                                </h2>
                                <button
                                    type="button"
                                    onClick={onAddBranch}
                                    className="rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
                                >
                                    + Tambah Cabang
                                </button>
                            </div>
                            <div className="space-y-3">
                                {(data.branches ?? []).map((b, i) => (
                                    <div
                                        key={i}
                                        className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3"
                                    >
                                        <div>
                                            <label className="text-xs font-medium text-slate-600">
                                                Kode Cabang *
                                            </label>
                                            <input
                                                value={b.code}
                                                onChange={(e) =>
                                                    onUpdateBranch(
                                                        i,
                                                        "code",
                                                        e.target.value.toUpperCase(),
                                                    )
                                                }
                                                className="mt-1 block w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs"
                                                placeholder="BR001"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-slate-600">
                                                Nama Cabang *
                                            </label>
                                            <input
                                                value={b.name}
                                                onChange={(e) =>
                                                    onUpdateBranch(
                                                        i,
                                                        "name",
                                                        e.target.value,
                                                    )
                                                }
                                                className="mt-1 block w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs"
                                                placeholder="Pusat"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-slate-600">
                                                Telepon
                                            </label>
                                            <input
                                                value={b.phone ?? ""}
                                                onChange={(e) =>
                                                    onUpdateBranch(
                                                        i,
                                                        "phone",
                                                        e.target.value,
                                                    )
                                                }
                                                className="mt-1 block w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-slate-600">
                                                Alamat
                                            </label>
                                            <input
                                                value={b.address ?? ""}
                                                onChange={(e) =>
                                                    onUpdateBranch(
                                                        i,
                                                        "address",
                                                        e.target.value,
                                                    )
                                                }
                                                className="mt-1 block w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs"
                                            />
                                        </div>
                                        {(data.branches ?? []).length > 1 && (
                                            <div className="col-span-2 flex justify-end">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        onRemoveBranch(i)
                                                    }
                                                    className="text-xs text-red-600 hover:text-red-800"
                                                >
                                                    Hapus Cabang
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            {errors.branches && (
                                <p className="mt-2 text-xs text-red-600">
                                    {errors.branches}
                                </p>
                            )}
                        </section>
                    )}

                    {/* Owner — hanya saat create */}
                    {!isEdit && (
                        <section className="rounded-2xl border border-slate-200 bg-white p-6">
                            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
                                Owner Toko
                            </h2>

                            {/* Existing users — searchable */}
                            {availableOwners.length > 0 && (
                                <div className="mb-4">
                                    <p className="mb-2 text-xs font-medium text-slate-600">
                                        Pilih dari user yang sudah ada:
                                    </p>

                                    {/* Search input */}
                                    <div className="relative mb-2">
                                        <svg
                                            className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            strokeWidth={2}
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                                            />
                                        </svg>
                                        <input
                                            type="text"
                                            value={ownerSearch}
                                            onChange={(e) =>
                                                setOwnerSearch(e.target.value)
                                            }
                                            placeholder="Cari nama, email, atau toko..."
                                            className="block w-full rounded-lg border-slate-300 py-1.5 pl-9 pr-2 text-xs shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                        />
                                    </div>

                                    {/* Filtered list */}
                                    <div className="max-h-40 space-y-1.5 overflow-y-auto rounded-xl border border-slate-200 p-2">
                                        {filteredOwners.length > 0 ? (
                                            filteredOwners.map((u) => (
                                                <label
                                                    key={u.id}
                                                    className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 hover:bg-slate-50"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={(
                                                            data.owner_ids ?? []
                                                        ).includes(u.id)}
                                                        onChange={() =>
                                                            onToggleOwner(u.id)
                                                        }
                                                        className="h-4 w-4 rounded"
                                                    />
                                                    <div>
                                                        <p className="text-sm font-medium text-slate-700">
                                                            {u.name}
                                                        </p>
                                                        <p className="text-xs text-slate-400">
                                                            {u.email}
                                                        </p>
                                                        {u.stores?.length >
                                                            0 && (
                                                            <p className="text-xs text-slate-400">
                                                                Toko:{" "}
                                                                {u.stores.join(
                                                                    ", ",
                                                                )}
                                                            </p>
                                                        )}
                                                    </div>
                                                </label>
                                            ))
                                        ) : (
                                            <p className="py-3 text-center text-xs text-slate-400">
                                                Tidak ditemukan. Coba kata kunci
                                                lain.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Create new owner */}
                            <p className="mb-2 text-xs font-medium text-slate-600">
                                Atau buat owner baru:
                            </p>
                            <div className="grid grid-cols-3 gap-3 rounded-xl bg-slate-50 p-3">
                                {["name", "email", "password"].map((f) => (
                                    <div key={f}>
                                        <label className="text-xs font-medium capitalize text-slate-600">
                                            {f === "password"
                                                ? "Password"
                                                : f === "email"
                                                  ? "Email"
                                                  : "Nama"}
                                        </label>
                                        <input
                                            type={
                                                f === "password"
                                                    ? "password"
                                                    : f === "email"
                                                      ? "email"
                                                      : "text"
                                            }
                                            value={data.new_owner?.[f] ?? ""}
                                            onChange={(e) =>
                                                onUpdateNewOwner(
                                                    f,
                                                    e.target.value,
                                                )
                                            }
                                            className="mt-1 block w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs"
                                            placeholder={
                                                f === "name"
                                                    ? "Nama Pemilik"
                                                    : f === "email"
                                                      ? "email@toko.com"
                                                      : "min. 6 karakter"
                                            }
                                        />
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pb-6">
                        <Link
                            href={cancelHref}
                            className="rounded-xl border border-slate-200 px-5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                        >
                            Batal
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-xl bg-indigo-600 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                        >
                            {processing
                                ? "Menyimpan..."
                                : isEdit
                                  ? "Simpan Perubahan"
                                  : "Buat Toko"}
                        </button>
                    </div>
                </form>
            </div>
        </DeveloperLayout>
    );
}
