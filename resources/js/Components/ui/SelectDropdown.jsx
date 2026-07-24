import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

/**
 * SelectDropdown — custom dropdown select using theme tokens.
 *
 * Props:
 *   value        — current selected value (string)
 *   options      — [{value: string, label: string}]
 *   onChange      — callback(new_value)
 *   placeholder  — label when nothing selected
 *   disabled     — disable the dropdown
 */
export default function SelectDropdown({
    value,
    options = [],
    onChange,
    placeholder = "Pilih...",
    disabled = false,
}) {
    const [open, setOpen] = useState(false);
    const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
    const btnRef = useRef(null);

    useEffect(() => {
        if (!open) return;
        const handler = (e) => {
            if (btnRef.current && !btnRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    const toggle = () => {
        if (disabled) return;
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
                disabled={disabled}
                className={`inline-flex w-full items-center justify-between gap-2 rounded-xl px-4 py-2.5 border text-sm transition
                    ${disabled
                        ? "border-border bg-muted text-muted-foreground cursor-not-allowed opacity-60"
                        : open
                            ? "border-ring bg-card text-foreground ring-1 ring-ring/20 hover:text-accent-foreground hover:shadow-sm"
                            : "border-border bg-card text-foreground hover:border-ring hover:text-accent-foreground hover:shadow-sm"
                    }`}
            >
                <span className={selected ? "text-foreground" : "text-muted-foreground"}>
                    {selected?.label ?? placeholder}
                </span>
                <ChevronDown
                    className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
                    strokeWidth={2}
                />
            </button>
            {open && (
                <div
                    className="fixed z-[100] max-h-56 overflow-y-auto rounded-xl border border-border bg-popover shadow-xl ring-1 ring-black/5"
                    style={{ top: pos.top, left: pos.left, minWidth: pos.width }}
                >
                    <button
                        type="button"
                        onClick={() => { onChange(""); setOpen(false); }}
                        className={`flex w-full items-center gap-2 px-4 py-2.5 text-sm transition hover:bg-accent hover:text-accent-foreground ${!value ? "bg-popover text-popover-foreground font-medium" : "text-muted-foreground"}`}
                    >
                        {placeholder}
                        {!value && <Check className="ml-auto h-3.5 w-3.5 text-primary" strokeWidth={2.5} />}
                    </button>
                    {options.map((opt) => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => { onChange(opt.value); setOpen(false); }}
                            className={`flex w-full items-center gap-2 px-4 py-2.5 text-sm transition hover:bg-accent hover:text-accent-foreground ${value === opt.value ? "bg-primary/10 text-primary font-medium" : "text-foreground"}`}
                        >
                            {opt.label}
                            {value === opt.value && (
                                <Check className="ml-auto h-3.5 w-3.5 text-primary" strokeWidth={2.5} />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </>
    );
}
