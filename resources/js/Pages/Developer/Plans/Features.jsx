import DeveloperLayout from "@/Layouts/DeveloperLayout";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { useState } from "react";
import { ArrowLeft, Check, CircleCheck, TriangleAlert } from "lucide-react";
import {
    FEATURE_GROUPS,
    FEATURE_GROUP_ORDER,
    featureGroupOf,
} from "@/Utils/featureGroups";

const GROUP_BADGE_CLS = {
    home: "bg-blue-100 text-blue-700 ring-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:ring-blue-800",
    transaction: "bg-cyan-100 text-cyan-700 ring-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-400 dark:ring-cyan-800",
    operations: "bg-orange-100 text-orange-700 ring-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:ring-orange-800",
    catalog: "bg-amber-100 text-amber-700 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:ring-amber-800",
    people: "bg-violet-100 text-violet-700 ring-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:ring-violet-800",
    finance: "bg-emerald-100 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:ring-emerald-800",
    system: "bg-muted text-muted-foreground ring-border",
    other: "bg-muted text-muted-foreground ring-border",
};

export default function Features({ plan, allFeatures = [] }) {
    const { flash } = usePage().props;

    const featureArr = Array.isArray(allFeatures) ? allFeatures : [];
    const allIds = featureArr.map((f) => f.id);
    const [selectedIds, setSelectedIds] = useState(
        (plan?.feature_ids ?? []).map(Number),
    );
    const [saving, setSaving] = useState(false);

    const allSelected = allIds.length > 0 && selectedIds.length === allIds.length;

    const toggle = (id) =>
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
        );

    const toggleAll = () => setSelectedIds(allSelected ? [] : [...allIds]);

    const grouped = {};
    featureArr.forEach((f) => {
        const g = featureGroupOf(f);
        if (!grouped[g]) grouped[g] = [];
        grouped[g].push(f);
    });
    const orderedGroupKeys = FEATURE_GROUP_ORDER.filter((g) => grouped[g]?.length > 0);

    const handleSave = (e) => {
        e.preventDefault();
        setSaving(true);
        router.put(
            route("developer.plans.update-features", plan.id),
            { feature_ids: selectedIds },
            {
                preserveScroll: true,
                onFinish: () => setSaving(false),
            },
        );
    };

    return (
        <DeveloperLayout
            header={
                <div className="flex items-center gap-3">
                    <Link
                        href={route("developer.plans.index")}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground shadow-sm transition hover:bg-muted hover:text-foreground"
                    >
                        <ArrowLeft className="h-4 w-4" strokeWidth={2} />
                    </Link>
                    <div>
                        <h2 className="text-lg font-bold text-foreground">
                            Fitur Paket — {plan.label}
                        </h2>
                        <p className="text-xs text-muted-foreground">
                            <span className="font-semibold text-primary">{selectedIds.length}</span>
                            {" dari "}
                            <span className="font-semibold">{allIds.length}</span>
                            {" fitur dipilih"}
                        </p>
                    </div>
                </div>
            }
        >
            <Head title={`Fitur — ${plan.label}`} />

            {flash?.success && (
                <div className="mb-5 flex items-center gap-3 rounded-2xl border border-success/20 bg-success/10 px-4 py-3 text-sm font-medium text-success">
                    <CircleCheck className="h-4 w-4 shrink-0" strokeWidth={2} />
                    {flash.success}
                </div>
            )}
            {flash?.error && (
                <div className="mb-5 flex items-center gap-3 rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
                    <TriangleAlert className="h-4 w-4 shrink-0" strokeWidth={2} />
                    {flash.error}
                </div>
            )}

            <form onSubmit={handleSave}>
                <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                    <div className="flex items-center justify-between border-b border-border bg-muted/60 px-6 py-4">
                        <div>
                            <h3 className="text-sm font-bold text-foreground">Fitur yang Disertakan</h3>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                Kode: <span className="font-mono font-semibold text-foreground">{plan.code}</span>
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={toggleAll}
                            className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                                allSelected
                                    ? "bg-primary/10 text-primary hover:bg-primary/20"
                                    : "border border-border bg-card text-muted-foreground hover:bg-muted"
                            }`}
                        >
                            {allSelected ? "✓ Semua Dipilih" : "Pilih Semua"}
                        </button>
                    </div>

                    {/* Progress bar */}
                    <div className="h-1 bg-muted">
                        <div
                            className="h-1 bg-primary transition-all duration-300"
                            style={{
                                width: allIds.length > 0
                                    ? `${(selectedIds.length / allIds.length) * 100}%`
                                    : "0%",
                            }}
                        />
                    </div>

                    <div className="space-y-5 p-6">
                        {orderedGroupKeys.map((groupKey) => {
                            const groupFeatures = grouped[groupKey];
                            const group = FEATURE_GROUPS[groupKey] ?? FEATURE_GROUPS.other;
                            const badgeCls = GROUP_BADGE_CLS[groupKey] ?? GROUP_BADGE_CLS.other;
                            const catSelected = groupFeatures.filter((f) =>
                                selectedIds.includes(f.id),
                            ).length;
                            const catAllSelected = catSelected === groupFeatures.length;

                            return (
                                <div key={groupKey}>
                                    <div className="mb-2.5 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <group.Icon
                                                className="h-4 w-4 text-muted-foreground"
                                                strokeWidth={1.8}
                                            />
                                            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                                {group.label}
                                            </h4>
                                            <span
                                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ${badgeCls}`}
                                            >
                                                {catSelected}/{groupFeatures.length}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (catAllSelected) {
                                                    setSelectedIds((prev) =>
                                                        prev.filter(
                                                            (id) =>
                                                                !groupFeatures.find((f) => f.id === id),
                                                        ),
                                                    );
                                                } else {
                                                    const newIds = [
                                                        ...new Set([
                                                            ...selectedIds,
                                                            ...groupFeatures.map((f) => f.id),
                                                        ]),
                                                    ];
                                                    setSelectedIds(newIds);
                                                }
                                            }}
                                            className="text-[11px] font-medium text-primary transition hover:text-primary/80"
                                        >
                                            {catAllSelected ? "Hapus semua" : "Pilih semua"}
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                                        {groupFeatures.map((f) => {
                                            const checked = selectedIds.includes(f.id);
                                            return (
                                                <label
                                                    key={f.id}
                                                    className={`group flex cursor-pointer select-none items-start gap-2.5 rounded-xl border p-3 transition ${
                                                        checked
                                                            ? "border-primary/40 bg-primary/10"
                                                            : "border-border bg-card hover:bg-muted"
                                                    }`}
                                                >
                                                    <div
                                                        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${
                                                            checked
                                                                ? "border-primary bg-primary"
                                                                : "border-border group-hover:border-muted-foreground"
                                                        }`}
                                                    >
                                                        {checked && (
                                                            <Check
                                                                className="h-3 w-3 text-primary-foreground"
                                                                strokeWidth={3}
                                                            />
                                                        )}
                                                    </div>
                                                    <input
                                                        type="checkbox"
                                                        checked={checked}
                                                        onChange={() => toggle(f.id)}
                                                        className="sr-only"
                                                    />
                                                    <div className="min-w-0">
                                                        <p
                                                            className={`text-xs font-semibold leading-tight ${
                                                                checked ? "text-primary" : "text-foreground"
                                                            }`}
                                                        >
                                                            {f.label}
                                                        </p>
                                                        <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                                                            {f.code}
                                                        </p>
                                                    </div>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex items-center justify-between border-t border-border bg-muted/40 px-6 py-4">
                        <p className="text-xs text-muted-foreground">
                            {selectedIds.length} fitur dipilih untuk paket{" "}
                            <span className="font-semibold text-foreground">{plan.label}</span>
                        </p>
                        <button
                            type="submit"
                            disabled={saving}
                            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:opacity-60"
                        >
                            {saving ? (
                                <>
                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                    Menyimpan...
                                </>
                            ) : (
                                "Simpan Fitur"
                            )}
                        </button>
                    </div>
                </div>
            </form>
        </DeveloperLayout>
    );
}
