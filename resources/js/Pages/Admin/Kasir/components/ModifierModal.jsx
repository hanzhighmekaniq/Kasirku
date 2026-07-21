import { useState } from "react";
import { fmt, fmtShort } from "./helpers";

export default function ModifierModal({ product, onConfirm, onClose }) {
    const groups = product.modifier_groups ?? [];
    const [selections, setSelections] = useState(() => {
        const init = {};
        groups.forEach((g) => {
            init[g.id] = g.selection_type === "single" ? null : [];
        });
        return init;
    });
    const [itemNote, setItemNote] = useState("");

    const toggle = (groupId, modifier, type) => {
        setSelections((prev) => {
            if (type === "single") return { ...prev, [groupId]: modifier };
            const cur = prev[groupId] ?? [];
            const exists = cur.find((m) => m.id === modifier.id);
            return {
                ...prev,
                [groupId]: exists
                    ? cur.filter((m) => m.id !== modifier.id)
                    : [...cur, modifier],
            };
        });
    };

    const isValid = groups.every(
        (g) =>
            !g.is_required ||
            (g.selection_type === "single"
                ? selections[g.id]
                : (selections[g.id]?.length ?? 0) > 0),
    );

    const buildModifiers = () => {
        const mods = [];
        groups.forEach((g) => {
            const sel = selections[g.id];
            if (g.selection_type === "single" && sel)
                mods.push({
                    name: sel.name,
                    price_addition: Number(sel.price_addition),
                });
            else if (Array.isArray(sel))
                sel.forEach((m) =>
                    mods.push({
                        name: m.name,
                        price_addition: Number(m.price_addition),
                    }),
                );
        });
        return mods;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
            <div
                onClick={onClose}
                className="absolute inset-0 bg-primary/60 backdrop-blur-sm"
            />
            <div className="relative w-full max-w-md bg-card shadow-2xl rounded-t-2xl sm:rounded-2xl">
                <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                    <div>
                        <h3 className="font-semibold text-foreground">
                            {product.name}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                            {fmt(product.sell_price)}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-muted-foreground/60 hover:text-card-foreground"
                    >
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>
                <div className="px-5 py-4 space-y-5 overflow-y-auto max-h-72">
                    {groups.map((g) => (
                        <div key={g.id}>
                            <p className="mb-2 text-sm font-semibold text-foreground">
                                {g.name}
                                {g.is_required && (
                                    <span className="ml-1 text-destructive">*</span>
                                )}
                                <span className="ml-1 text-xs font-normal text-muted-foreground/60">
                                    (
                                    {g.selection_type === "single"
                                        ? "Pilih 1"
                                        : "Bisa banyak"}
                                    )
                                </span>
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {(g.modifiers ?? [])
                                    .filter((m) => m.is_active)
                                    .map((m) => {
                                        const sel = selections[g.id];
                                        const active =
                                            g.selection_type === "single"
                                                ? sel?.id === m.id
                                                : sel?.find(
                                                      (x) => x.id === m.id,
                                                  );
                                        return (
                                            <button
                                                key={m.id}
                                                type="button"
                                                onClick={() =>
                                                    toggle(
                                                        g.id,
                                                        m,
                                                        g.selection_type,
                                                    )
                                                }
                                                className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition ${
                                                    active
                                                        ? "border-primary bg-primary/10 text-primary"
                                                        : "border-border text-muted-foreground hover:border-primary/30"
                                                }`}
                                            >
                                                {m.name}{" "}
                                                {Number(m.price_addition) >
                                                    0 && (
                                                    <span className="text-muted-foreground/60">
                                                        +
                                                        {fmtShort(
                                                            m.price_addition,
                                                        )}
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                            </div>
                        </div>
                    ))}
                    <div>
                        <p className="mb-1 text-sm font-medium text-card-foreground">
                            Catatan Item
                        </p>
                        <input
                            type="text"
                            value={itemNote}
                            onChange={(e) => setItemNote(e.target.value)}
                            placeholder="cth. tanpa es, pedas"
                            className="block w-full text-sm rounded-xl border-slate-300 focus:border-primary focus:ring-2 focus:ring-indigo-200"
                        />
                    </div>
                </div>
                <div className="px-5 py-4 border-t border-border">
                    ```jsx
                    <button
                        type="button"
                        disabled={!isValid}
                        onClick={() => onConfirm(buildModifiers(), itemNote)}
                        className="
        w-full
        rounded-lg sm:rounded-lg md:rounded-xl
        bg-primary
        px-3 sm:px-4 md:px-5
        py-1.5 sm:py-2 md:py-2.5
        text-xs sm:text-sm md:text-sm
        font-semibold text-white
        shadow-md sm:shadow-lg
        shadow-indigo-500/30
        transition
        hover:from-indigo-600 hover:to-violet-700
        disabled:opacity-50
    "
                    >
                        Tambah ke Keranjang
                    </button>
                    ```
                </div>
            </div>
        </div>
    );
}
