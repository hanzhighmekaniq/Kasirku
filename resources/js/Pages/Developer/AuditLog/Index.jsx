import DeveloperLayout from "@/Layouts/DeveloperLayout";
import { Head, router } from "@inertiajs/react";
import { useState } from "react";
import { History, RotateCcw, Search, ShieldAlert } from "lucide-react";

const ACTION_LABELS = {
    "store.create": "Buat Toko",
    "store.update": "Ubah Toko",
    "store.destroy": "Hapus Toko",
    "plan.create": "Buat Paket",
    "plan.update": "Ubah Paket",
    "plan.destroy": "Hapus Paket",
    "business_template.create": "Buat Template Bisnis",
    "business_template.update": "Ubah Template Bisnis",
    "business_template.destroy": "Hapus Template Bisnis",
    "feature.create": "Buat Fitur",
    "feature.update": "Ubah Fitur",
    "feature.destroy": "Hapus Fitur",
    "store_type.create": "Buat Jenis Usaha",
    "store_type.update": "Ubah Jenis Usaha",
    "store_type.destroy": "Hapus Jenis Usaha",
    "store.impersonate": "Login Sebagai Owner",
    "store.suspend": "Suspend Toko",
};

const fmtDate = (d) =>
    d
        ? new Date(d).toLocaleString("id-ID", {
              dateStyle: "medium",
              timeStyle: "medium",
          })
        : "-";

const inputCls =
    "w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20";

export default function Index({ logs, developers = [], filters = {} }) {
    const [form, setForm] = useState({
        developer_id: filters.developer_id ?? "",
        action: filters.action ?? "",
        from: filters.from ?? "",
        to: filters.to ?? "",
    });

    const apply = () => {
        const params = Object.fromEntries(
            Object.entries(form).filter(([, v]) => v !== ""),
        );
        router.get(route("developer.audit-log.index"), params, {
            preserveState: true,
            replace: true,
        });
    };

    const clear = () => {
        setForm({ developer_id: "", action: "", from: "", to: "" });
        router.get(route("developer.audit-log.index"), {}, { preserveState: true, replace: true });
    };

    const hasFilters = Object.values(form).some(Boolean);

    return (
        <DeveloperLayout
            header={
                <div>
                    <h2 className="text-lg font-bold text-foreground">
                        Audit Log
                    </h2>
                    <p className="text-xs text-muted-foreground">
                        {logs.total} aksi tercatat
                    </p>
                </div>
            }
        >
            <Head title="Audit Log" />

            <div className="mb-5 flex items-start gap-3 rounded-2xl border border-warning/20 bg-warning/10 px-4 py-3 text-sm text-warning">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
                <p>
                    Mencatat aksi developer terhadap data platform (toko,
                    paket, template bisnis, fitur, jenis usaha) — terpisah
                    dari log aktivitas operasional di dalam toko.
                </p>
            </div>

            <div className="mb-5 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <div className="border-b border-border bg-muted/60 px-6 py-4">
                    <h3 className="text-sm font-bold text-foreground">Filter</h3>
                </div>
                <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-foreground">
                            Developer
                        </label>
                        <select
                            value={form.developer_id}
                            onChange={(e) => setForm((p) => ({ ...p, developer_id: e.target.value }))}
                            className={inputCls}
                        >
                            <option value="">Semua Developer</option>
                            {developers.map((d) => (
                                <option key={d.id} value={d.id}>
                                    {d.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-foreground">
                            Aksi
                        </label>
                        <input
                            value={form.action}
                            onChange={(e) => setForm((p) => ({ ...p, action: e.target.value }))}
                            className={inputCls}
                            placeholder="cth. store, plan.update"
                        />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-foreground">
                            Dari Tanggal
                        </label>
                        <input
                            type="date"
                            value={form.from}
                            onChange={(e) => setForm((p) => ({ ...p, from: e.target.value }))}
                            className={inputCls}
                        />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-foreground">
                            Sampai Tanggal
                        </label>
                        <input
                            type="date"
                            value={form.to}
                            onChange={(e) => setForm((p) => ({ ...p, to: e.target.value }))}
                            className={inputCls}
                        />
                    </div>
                </div>
                <div className="flex items-center gap-2 border-t border-border px-6 py-4">
                    <button
                        onClick={apply}
                        className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                    >
                        <Search className="h-4 w-4" strokeWidth={2.5} />
                        Terapkan
                    </button>
                    {hasFilters && (
                        <button
                            onClick={clear}
                            className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted"
                        >
                            <RotateCcw className="h-4 w-4" strokeWidth={2} />
                            Reset
                        </button>
                    )}
                </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                {logs.data.length === 0 ? (
                    <div className="flex flex-col items-center py-16 text-center">
                        <History className="mb-4 h-12 w-12 text-muted-foreground/50" strokeWidth={1.5} />
                        <p className="text-base font-semibold text-foreground">
                            Belum ada aksi tercatat
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-border">
                        {logs.data.map((log) => (
                            <div key={log.id} className="flex items-center gap-4 px-6 py-4">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xs font-bold text-primary">
                                    {(log.developer?.name ?? "?").charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-semibold text-foreground">
                                            {ACTION_LABELS[log.action] ?? log.action}
                                        </p>
                                        <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                                            {log.action}
                                        </span>
                                    </div>
                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                        {log.developer?.name ?? "Sistem"} · {fmtDate(log.created_at)}
                                        {log.subject_type && ` · ${log.subject_type.split("\\").pop()} #${log.subject_id}`}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {logs.last_page > 1 && (
                <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-border bg-card px-5 py-3.5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-muted-foreground">
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
                                        router.visit(link.url, { preserveState: true, replace: true })
                                    }
                                    className={`min-w-[36px] rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                                        link.active
                                            ? "bg-primary text-primary-foreground shadow-sm"
                                            : link.url
                                              ? "text-muted-foreground hover:bg-muted"
                                              : "cursor-default text-muted-foreground/50"
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            );
                        })}
                    </div>
                </div>
            )}
        </DeveloperLayout>
    );
}
