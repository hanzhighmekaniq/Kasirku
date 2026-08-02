import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

export default function BranchFilter({ branches, activeIds = [], onApply }) {
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState(
        activeIds.length > 0 ? activeIds.map(Number) : branches.map((b) => b.id)
    );
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const toggle = (id) => {
        setSelected((prev) =>
            prev.includes(id) ? prev.filter((bid) => bid !== id) : [...prev, id]
        );
    };

    const allSelected = selected.length === branches.length;
    const label = allSelected
        ? "Semua Cabang"
        : selected.length === 1
            ? branches.find((b) => b.id === selected[0])?.name ?? "1 cabang"
            : `${selected.length} cabang`;

    const handleApply = () => {
        onApply(allSelected ? [] : selected);
        setOpen(false);
    };

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground transition hover:bg-muted"
            >
                {label}
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>

            {open && (
                <div className="absolute left-0 top-full z-50 mt-1 w-56 rounded-xl border border-border bg-popover p-2 shadow-xl">
                    <div className="mb-1 max-h-48 overflow-y-auto space-y-0.5">
                        {branches.map((b) => (
                            <label
                                key={b.id}
                                className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm hover:bg-muted"
                            >
                                <input
                                    type="checkbox"
                                    checked={selected.includes(b.id)}
                                    onChange={() => toggle(b.id)}
                                    className="rounded border-border"
                                />
                                <span className="flex-1 truncate text-foreground">{b.name}</span>
                                {selected.includes(b.id) && (
                                    <Check className="h-3.5 w-3.5 text-primary" />
                                )}
                            </label>
                        ))}
                    </div>
                    <button
                        type="button"
                        onClick={handleApply}
                        className="mt-1 w-full rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                    >
                        Terapkan
                    </button>
                </div>
            )}
        </div>
    );
}
