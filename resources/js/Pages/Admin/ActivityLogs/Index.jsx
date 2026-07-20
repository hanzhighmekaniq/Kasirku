import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import { useState, useRef, useEffect } from "react";
import { Activity, Calendar, ChevronDown, Check, Filter, RotateCcw, Search } from "lucide-react";

const LOG_NAME_LABELS = {
    shift: "Shift Kasir",
    sale: "Penjualan",
    purchase: "Pembelian",
    stock: "Inventaris",
    expense: "Pengeluaran",
    product: "Produk",
    system: "Sistem",
};
const LOG_NAME_COLORS = {
    shift: "bg-primary-50 text-primary-700 ring-primary-200",
    sale: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    purchase: "bg-blue-50 text-blue-700 ring-blue-200",
    stock: "bg-amber-50 text-amber-700 ring-amber-200",
    expense: "bg-red-50 text-red-700 ring-red-200",
    product: "bg-violet-50 text-violet-700 ring-violet-200",
    system: "bg-slate-100 text-slate-600 ring-slate-200",
};

const fmtDate = (d) =>
    d
        ? new Date(d).toLocaleString("id-ID", {
              dateStyle: "medium",
              timeStyle: "medium",
          })
        : "-";

/* ─── SelectDropdown ──────────────────────────────────── */
function SelectDropdown({ value, options, onChange, placeholder = "Pilih..." }) {
    const [open, setOpen] = useState(false);
    const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
    const btnRef = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (btnRef.current && !btnRef.current.contains(e.target)) setOpen(false);
        };
        if (open) document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    const toggle = () => {
        if (!open && btnRef.current) {
            const rect = btnRef.current.getBoundingClientRect();
            setPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
        }
        setOpen(!open);
    };

    const selected = options.find((o) => o.value === value);

    return (
        <>
            <button
                ref={btnRef}
                type="button"
                onClick={toggle}
                className="inline-flex w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 transition hover:border-slate-300 hover:shadow-sm"
            >
                <span className={selected ? "text-slate-700" : "text-slate-400"}>
                    {selected?.label ?? placeholder}
                </span>
                <ChevronDown
                    className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
                    strokeWidth={2}
                />
            </button>
            {open && (
                <div
                    className="fixed z-[100] max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl ring-1 ring-black/5"
                    style={{ top: pos.top, left: pos.left, minWidth: pos.width }}
                >
                    <button
                        type="button"
                        onClick={() => { onChange(""); setOpen(false); }}
                        className={`flex w-full items-center gap-2 px-4 py-2.5 text-sm transition hover:bg-slate-50 ${
                            !value ? "bg-primary-50/50 text-primary-700 font-medium" : "text-slate-500"
                        }`}
                    >
                        {placeholder}
                        {!value && <Check className="ml-auto h-3.5 w-3.5 text-primary-500" strokeWidth={2.5} />}
                    </button>
                    {options.map((opt) => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => { onChange(opt.value); setOpen(false); }}
                            className={`flex w-full items-center gap-2 px-4 py-2.5 text-sm transition hover:bg-slate-50 ${
                                value === opt.value ? "bg-primary-50/50 text-primary-700 font-medium" : "text-slate-600"
                            }`}
                        >
                            {opt.label}
                            {value === opt.value && (
                                <Check className="ml-auto h-3.5 w-3.5 text-primary-500" strokeWidth={2.5} />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </>
    );
}

const labelClass = "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500";

/* ─── Page ──────────────────────────────────────────── */
export default function Index({
    logs,
    logNames,
    users,
    branches,
    filters,
    currentBranch,
}) {
    const [formFilters, setFormFilters] = useState({
        log_name: filters.log_name ?? "",
        user_id: filters.user_id ? String(filters.user_id) : "",
        branch_id: filters.branch_id ? String(filters.branch_id) : "",
        date_from: filters.date_from ?? "",
        date_to: filters.date_to ?? "",
    });

    const apply = () => {
        const params = {};
        Object.entries(formFilters).forEach(([k, v]) => {
            if (v) params[k] = v;
        });
        router.get(route("admin.activity-logs.index"), params, {
            preserveState: true,
            replace: true,
        });
    };

    const clear = () => {
        setFormFilters({
            log_name: "",
            user_id: "",
            branch_id: "",
            date_from: "",
            date_to: "",
        });
        router.get(route("admin.activity-logs.index"), {}, {
            preserveState: true,
            replace: true,
        });
    };

    const hasFilters =
        formFilters.log_name ||
        formFilters.user_id ||
        formFilters.branch_id ||
        formFilters.date_from ||
        formFilters.date_to;

    const logNameOptions = logNames.map((n) => ({
        value: n,
        label: LOG_NAME_LABELS[n] ?? n,
    }));

    const userOptions = users.map((u) => ({
        value: String(u.id),
        label: u.name,
    }));

    const branchOptions = (branches ?? []).map((b) => ({
        value: String(b.id),
        label: b.name,
    }));

    return (
        <AuthenticatedLayout
            header={
                <div className="flex w-full items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
                            <Activity className="h-5 w-5" strokeWidth={1.8} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">Log Aktivitas</h2>
                            <div className="flex items-center gap-2">
                                <p className="text-xs text-slate-400">
                                    {logs.total} entri
                                </p>
                                {currentBranch && (
                                    <>
                                        <span className="text-slate-300">•</span>
                                        <p className="text-xs text-slate-400">
                                            {currentBranch.name}
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title="Log Aktivitas" />

            <div className="space-y-5">
                {/* ── Filters ── */}
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center gap-3 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-white px-5 py-3.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                            <Filter className="h-4 w-4" strokeWidth={1.8} />
                        </div>
                        <h3 className="text-sm font-semibold text-slate-700">Filter</h3>
                    </div>

                    <div className="p-5">
                        {/* Row 1: Dropdowns */}
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            <div>
                                <label className={labelClass}>Modul</label>
                                <SelectDropdown
                                    value={formFilters.log_name}
                                    options={logNameOptions}
                                    onChange={(v) => setFormFilters((p) => ({ ...p, log_name: v }))}
                                    placeholder="Semua Modul"
                                />
                            </div>
                            <div>
                                <label className={labelClass}>User</label>
                                <SelectDropdown
                                    value={formFilters.user_id}
                                    options={userOptions}
                                    onChange={(v) => setFormFilters((p) => ({ ...p, user_id: v }))}
                                    placeholder="Semua User"
                                />
                            </div>
                            {branches && branches.length > 0 && (
                                <div>
                                    <label className={labelClass}>Cabang</label>
                                    <SelectDropdown
                                        value={formFilters.branch_id}
                                        options={branchOptions}
                                        onChange={(v) => setFormFilters((p) => ({ ...p, branch_id: v }))}
                                        placeholder="Semua Cabang"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Row 2: Dates + Buttons */}
                        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:flex-wrap">
                            <div className="flex items-end gap-2">
                                <div>
                                    <label className={labelClass}>Dari</label>
                                    <input
                                        type="date"
                                        value={formFilters.date_from}
                                        onChange={(e) =>
                                            setFormFilters((p) => ({ ...p, date_from: e.target.value }))
                                        }
                                        className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm transition hover:border-slate-300 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                                    />
                                </div>
                                <span className="pb-2 text-slate-400">—</span>
                                <div>
                                    <label className={labelClass}>Sampai</label>
                                    <input
                                        type="date"
                                        value={formFilters.date_to}
                                        onChange={(e) =>
                                            setFormFilters((p) => ({ ...p, date_to: e.target.value }))
                                        }
                                        className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm transition hover:border-slate-300 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2 sm:ml-auto">
                                <button
                                    onClick={apply}
                                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary-500/25 transition hover:from-primary-600 hover:to-primary-700"
                                >
                                    <Search className="h-4 w-4" strokeWidth={2} />
                                    Terapkan
                                </button>
                                {hasFilters && (
                                    <button
                                        onClick={clear}
                                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                                    >
                                        <RotateCcw className="h-4 w-4" strokeWidth={1.8} />
                                        Reset
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Log Table ── */}
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/60 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    <th className="px-5 py-3.5 whitespace-nowrap">Waktu</th>
                                    <th className="px-5 py-3.5">User</th>
                                    <th className="px-5 py-3.5">Toko / Cabang</th>
                                    <th className="px-5 py-3.5">Modul</th>
                                    <th className="px-5 py-3.5">Deskripsi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {logs.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-5 py-16 text-center">
                                            <div className="flex flex-col items-center">
                                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                                                    <Activity className="h-7 w-7 text-slate-400" strokeWidth={1.4} />
                                                </div>
                                                <h3 className="mt-3 text-sm font-semibold text-slate-700">
                                                    Belum ada log aktivitas
                                                </h3>
                                                <p className="mt-1 text-xs text-slate-400">
                                                    Aktivitas akan tercatat di sini secara otomatis
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    logs.data.map((log) => (
                                        <tr
                                            key={log.id}
                                            className="transition hover:bg-slate-50/60"
                                        >
                                            {/* Waktu */}
                                            <td className="px-5 py-3.5 text-xs text-slate-500 whitespace-nowrap">
                                                {fmtDate(log.created_at)}
                                            </td>

                                            {/* User */}
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-2.5">
                                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-[10px] font-bold text-primary-600">
                                                        {(log.user?.name ?? "S").charAt(0).toUpperCase()}
                                                    </span>
                                                    <span className="text-sm font-medium text-slate-700">
                                                        {log.user?.name ?? "System"}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Toko / Cabang */}
                                            <td className="px-5 py-3.5 text-xs">
                                                {log.store ? (
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-slate-600 truncate max-w-[120px]">
                                                            {log.store.name}
                                                        </span>
                                                        {log.branch && (
                                                            <span className="inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                                                                {log.branch.name}
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400">-</span>
                                                )}
                                            </td>

                                            {/* Modul */}
                                            <td className="px-5 py-3.5">
                                                <span
                                                    className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold ring-1 ${LOG_NAME_COLORS[log.log_name] ?? "bg-slate-100 text-slate-600 ring-slate-200"}`}
                                                >
                                                    {LOG_NAME_LABELS[log.log_name] ?? log.log_name ?? "-"}
                                                </span>
                                            </td>

                                            {/* Deskripsi */}
                                            <td className="px-5 py-3.5 text-sm text-slate-600 max-w-md">
                                                {log.description}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ── Pagination ── */}
                {logs.last_page > 1 && (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white px-5 py-3.5 shadow-sm">
                        <p className="text-xs text-slate-500">
                            Menampilkan {logs.from}-{logs.to} dari {logs.total} log
                        </p>
                        <div className="flex items-center gap-1">
                            {logs.links.map((link, i) => {
                                if (!link.url && !link.active) return null;
                                return (
                                    <button
                                        key={i}
                                        disabled={!link.url}
                                        onClick={() =>
                                            link.url &&
                                            router.visit(link.url, {
                                                preserveState: true,
                                                replace: true,
                                            })
                                        }
                                        className={`min-w-[36px] rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                                            link.active
                                                ? "bg-primary-600 text-white shadow-sm shadow-primary-200"
                                                : link.url
                                                  ? "text-slate-500 hover:bg-slate-100"
                                                  : "cursor-default text-slate-300"
                                        }`}
                                        dangerouslySetInnerHTML={{
                                            __html: link.label,
                                        }}
                                    />
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
