import { useEffect, useMemo, useRef, useState } from "react";

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
        const q = query.trim().toLowerCase();
        if (!q) return options;
        return options.filter((o) => o.name.toLowerCase().includes(q));
    }, [query, options]);

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
        "block w-full rounded-xl border bg-background text-sm shadow-sm transition focus:ring-2";
    const cls = error
        ? `${baseCls} border-destructive focus:border-destructive focus:ring-destructive/20`
        : `${baseCls} border-input focus:border-ring focus:ring-ring/20`;

    return (
        <div ref={containerRef} className="relative">
            {/* Trigger button */}
            <button
                type="button"
                disabled={disabled}
                onClick={() => {
                    if (!disabled) {
                        setOpen(!open);
                        if (!open)
                            setTimeout(() => inputRef.current?.focus(), 50);
                    }
                }}
                className={`${cls} flex items-center justify-between px-3.5 py-2.5 text-left ${
                    disabled
                        ? "cursor-not-allowed bg-muted text-muted-foreground"
                        : ""
                } text-foreground`}
            >
                <span className="truncate">
                    {selected?.name ?? placeholder}
                    {required && !value && (
                        <span className="ml-1 text-destructive">*</span>
                    )}
                </span>
                <svg
                    className={`ml-2 h-4 w-4 shrink-0 text-muted-foreground transition ${
                        open ? "rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                    />
                </svg>
            </button>

            {/* Dropdown */}
            {open && !disabled && (
                <div className="absolute z-50 mt-1.5 w-full overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-xl">
                    {/* Search input */}
                    <div className="border-b border-border p-2">
                        <div className="relative">
                            <svg
                                className="pointer-events-none absolute inset-y-0 left-3 my-auto h-4 w-4 text-muted-foreground"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.8}
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                                />
                            </svg>
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
                                className="w-full rounded-xl border border-input bg-background py-2 pl-10 pr-3 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
                                autoComplete="off"
                            />
                        </div>
                    </div>

                    {/* Options list */}
                    <div className="max-h-56 overflow-y-auto">
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
                                    className={`flex w-full items-center px-4 py-2.5 text-left text-sm transition ${
                                        String(option.id) === String(value)
                                            ? "bg-primary-50 text-primary-700"
                                            : i === idx
                                              ? "bg-accent text-accent-foreground"
                                              : "hover:bg-accent hover:text-accent-foreground"
                                    }`}
                                >
                                    <span className="flex-1 truncate">
                                        {option.name}
                                    </span>
                                    {String(option.id) === String(value) && (
                                        <svg
                                            className="h-4 w-4 shrink-0 text-primary-500"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            strokeWidth={2.5}
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M4.5 12.75l6 6 9-13.5"
                                            />
                                        </svg>
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
