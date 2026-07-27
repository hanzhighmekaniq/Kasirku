import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";

/**
 * SearchableSelect — dropdown modern dengan search.
 * Gaya mirip ProductCombobox tapi generic untuk data apapun.
 *
 * Props:
 *   options    — array of { id, name }
 *   value      — string, selected id ("" = belum pilih)
 *   onChange   — (id: string) => void
 *   placeholder — teks saat belum ada yang dipilih
 *   searchPlaceholder — teks di input search
 *   searchable — boolean, false = sembunyikan kotak search (untuk opsi sedikit)
 *   error      — boolean, tampil border merah
 *   disabled   — boolean
 *   required   — boolean
 */
export default function SearchableSelect({
    options = [],
    value = "",
    onChange,
    placeholder = "Pilih...",
    searchPlaceholder = "Ketik untuk mencari...",
    searchable = true,
    error = false,
    disabled = false,
    required = false,
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [idx, setIdx] = useState(0);
    const containerRef = useRef(null);
    const inputRef = useRef(null);

    const selected = useMemo(
        () => options.find((o) => String(o.id) === String(value)),
        [options, value],
    );

    const filtered = useMemo(() => {
        const q = searchable ? query.trim().toLowerCase() : "";
        if (!q) return options;
        return options.filter((o) => o.name.toLowerCase().includes(q));
    }, [query, options, searchable]);

    // Reset idx saat filtered berubah
    useEffect(() => {
        setIdx(0);
    }, [filtered.length]);

    // Close on outside click
    useEffect(() => {
        const fn = (e) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(e.target)
            ) {
                setOpen(false);
                setQuery("");
            }
        };
        if (open) document.addEventListener("mousedown", fn);
        return () => document.removeEventListener("mousedown", fn);
    }, [open]);

    const pick = (option) => {
        onChange?.(String(option.id));
        setOpen(false);
        setQuery("");
        setIdx(0);
    };

    const onKeyDown = (e) => {
        if (!open) {
            if (e.key === "ArrowDown" || e.key === "Enter") {
                e.preventDefault();
                setOpen(true);
            }
            return;
        }
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setIdx((i) => Math.min(i + 1, filtered.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setIdx((i) => Math.max(i - 1, 0));
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (filtered[idx]) pick(filtered[idx]);
        } else if (e.key === "Escape") {
            setOpen(false);
            setQuery("");
        }
    };

    const baseCls =
        "block w-full rounded-xl border bg-background text-foreground text-sm shadow-sm transition outline-none focus:ring-2 focus:border-ring hover:border-primary/40";
    const cls = error
        ? `${baseCls} border-destructive focus:ring-destructive/20`
        : `${baseCls} border-input focus:ring-ring/20`;

    return (
        <div ref={containerRef} className="relative">
            {/* Trigger button */}
            <button
                type="button"
                disabled={disabled}
                onKeyDown={searchable ? undefined : onKeyDown}
                onClick={() => {
                    if (!disabled) {
                        const next = !open;
                        setOpen(next);
                        if (next) {
                            const at = options.findIndex(
                                (o) => String(o.id) === String(value),
                            );
                            setIdx(at >= 0 ? at : 0);
                            if (searchable)
                                setTimeout(
                                    () => inputRef.current?.focus(),
                                    50,
                                );
                        }
                    }
                }}
                className={`${cls} flex items-center justify-between px-3.5 py-2.5 text-left ${
                    disabled
                        ? "cursor-not-allowed bg-muted text-muted-foreground"
                        : ""
                } text-foreground`}
            >
                <span
                    className={`truncate ${selected ? "" : "text-muted-foreground"}`}
                >
                    {selected?.name ?? placeholder}
                    {required && !value && (
                        <span className="ml-1 text-destructive">*</span>
                    )}
                </span>
                <ChevronDown
                    className={`ml-2 h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
                        open ? "rotate-180" : ""
                    }`}
                />
            </button>

            {/* Dropdown */}
            {open && !disabled && (
                <div className="absolute z-50 mt-1.5 w-full overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-xl">
                    {/* Search input — disembunyikan saat searchable=false */}
                    {searchable && (
                        <div className="border-b border-border p-2">
                            <div className="relative">
                                <Search className="pointer-events-none absolute inset-y-0 left-3 my-auto h-4 w-4 text-muted-foreground" />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={query}
                                    onChange={(e) => {
                                        setQuery(e.target.value);
                                        setIdx(0);
                                    }}
                                    onKeyDown={onKeyDown}
                                    placeholder={searchPlaceholder}
                                    className="block w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
                                    autoComplete="off"
                                />
                            </div>
                        </div>
                    )}

                    {/* Options list */}
                    <div
                        className={`overflow-y-auto overscroll-contain p-1 ${searchable ? "max-h-56" : "max-h-64"}`}
                    >
                        {filtered.length === 0 ? (
                            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                                Tidak ditemukan
                            </div>
                        ) : (
                            filtered.map((option, i) => (
                                <button
                                    key={option.id}
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => pick(option)}
                                    onMouseEnter={() => setIdx(i)}
                                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                                        String(option.id) === String(value)
                                            ? "bg-primary/10 font-semibold text-primary"
                                            : i === idx
                                              ? "bg-accent text-accent-foreground"
                                              : "hover:bg-accent hover:text-accent-foreground"
                                    }`}
                                >
                                    <span className="flex-1 truncate">
                                        {option.name}
                                    </span>
                                    {String(option.id) === String(value) && (
                                        <Check className="h-4 w-4 shrink-0 text-primary" />
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
