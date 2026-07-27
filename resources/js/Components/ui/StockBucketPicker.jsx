import { useEffect, useMemo, useRef, useState } from "react";
import { Boxes, ChevronDown, Search } from "lucide-react";

/**
 * Pemilih bucket stok.
 *
 * Stok disimpan per produk + variant + satuan + cabang, jadi yang dipilih di
 * form stok harus bucket-nya, bukan produknya. Satu produk bervariant muncul
 * beberapa kali di daftar ini — satu baris per variant, plus satu baris lagi
 * untuk tiap satuan kemasan variant tersebut.
 *
 * Props:
 *   buckets      — array dari BuildsStockBucketOptions (punya `key`, `label`, `stock_by_branch`)
 *   branchId     — cabang yang stoknya ditampilkan ("" = belum dipilih, stok disembunyikan)
 *   excludeKeys  — Set/array key bucket yang sudah masuk daftar item
 *   onSelect     — (bucket) => void
 *   disabled     — boolean
 *   placeholder  — teks tombol saat belum memilih
 */
export default function StockBucketPicker({
    buckets = [],
    branchId = null,
    excludeKeys = [],
    onSelect,
    disabled = false,
    placeholder = "Pilih produk / variant / satuan",
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const containerRef = useRef(null);
    const searchRef = useRef(null);

    const excluded = useMemo(
        () => (excludeKeys instanceof Set ? excludeKeys : new Set(excludeKeys)),
        [excludeKeys],
    );

    useEffect(() => {
        const onClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setOpen(false);
                setQuery("");
            }
        };
        if (open) document.addEventListener("mousedown", onClickOutside);
        return () => document.removeEventListener("mousedown", onClickOutside);
    }, [open]);

    useEffect(() => {
        if (open) searchRef.current?.focus();
    }, [open]);

    const stockOf = (bucket) => {
        if (branchId === null || branchId === "" || branchId === undefined) return null;
        return bucket.stock_by_branch?.[String(branchId)] ?? 0;
    };

    const visible = useMemo(() => {
        const q = query.trim().toLowerCase();
        return buckets.filter((b) => {
            if (excluded.has(b.key)) return false;
            if (!q) return true;
            return (
                b.label?.toLowerCase().includes(q) ||
                b.sku?.toLowerCase().includes(q) ||
                b.unit_name?.toLowerCase().includes(q)
            );
        });
    }, [buckets, excluded, query]);

    return (
        <div className="relative" ref={containerRef}>
            <button
                type="button"
                disabled={disabled}
                onClick={() => {
                    if (disabled) return;
                    setOpen(!open);
                    setQuery("");
                }}
                className="flex w-full items-center gap-2 rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm font-medium text-foreground shadow-sm transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
            >
                <Boxes className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.8} />
                <span className="flex-1 truncate text-left text-muted-foreground">
                    {placeholder}
                </span>
                <ChevronDown
                    className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
                    strokeWidth={2}
                />
            </button>

            {open && !disabled && (
                <div className="absolute z-50 mt-2 w-full rounded-2xl border border-border bg-popover text-popover-foreground shadow-xl">
                    <div className="border-b border-border p-3">
                        <div className="relative">
                            <Search
                                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                                strokeWidth={1.8}
                            />
                            <input
                                ref={searchRef}
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Cari nama, SKU, atau satuan..."
                                className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm text-foreground shadow-sm outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20"
                            />
                        </div>
                    </div>

                    <div className="max-h-72 overflow-y-auto p-1.5">
                        {visible.length === 0 ? (
                            <p className="px-3 py-4 text-center text-xs text-muted-foreground">
                                {buckets.length === 0
                                    ? "Belum ada produk berstok."
                                    : "Tidak ada yang cocok."}
                            </p>
                        ) : (
                            visible.map((b) => {
                                const stock = stockOf(b);
                                return (
                                    <button
                                        key={b.key}
                                        type="button"
                                        onClick={() => {
                                            onSelect?.(b);
                                            setOpen(false);
                                            setQuery("");
                                        }}
                                        className="w-full rounded-lg px-3 py-2 text-left text-sm transition hover:bg-accent hover:text-accent-foreground"
                                    >
                                        <span className="block truncate font-medium text-foreground">
                                            {b.product_name}
                                        </span>

                                        <div className="mt-0.5 flex items-center justify-between gap-2">
                                            <span className="flex min-w-0 flex-wrap items-center gap-1">
                                                {b.variant_name && (
                                                    <span className="inline-flex items-center rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                                                        {b.variant_name}
                                                    </span>
                                                )}
                                                {b.unit_name && (
                                                    <span className="inline-flex items-center rounded bg-warning/10 px-1.5 py-0.5 text-[10px] font-semibold text-warning">
                                                        {b.unit_name}
                                                        {b.conversion_qty
                                                            ? ` · ${b.conversion_qty} ${b.unit || "pcs"}`
                                                            : ""}
                                                    </span>
                                                )}
                                                <span className="truncate font-mono text-[11px] text-muted-foreground">
                                                    {b.sku}
                                                </span>
                                            </span>

                                            {stock !== null && (
                                                <span className="shrink-0 text-xs text-muted-foreground">
                                                    Stok: {stock}
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

/**
 * Label ringkas satu bucket untuk ditampilkan di baris item yang sudah dipilih.
 * Dipakai bersama supaya ketiga form stok menuliskannya dengan cara yang sama.
 */
export function BucketItemLabel({ item }) {
    return (
        <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
                {item.product_name}
            </p>
            <div className="mt-0.5 flex flex-wrap items-center gap-1">
                {item.variant_name && (
                    <span className="inline-flex items-center rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                        {item.variant_name}
                    </span>
                )}
                {item.unit_name && (
                    <span className="inline-flex items-center rounded bg-warning/10 px-1.5 py-0.5 text-[10px] font-semibold text-warning">
                        {item.unit_name}
                        {item.conversion_qty
                            ? ` · ${item.conversion_qty} ${item.unit || "pcs"}`
                            : ""}
                    </span>
                )}
                <span className="truncate font-mono text-[11px] text-muted-foreground">
                    {item.product_sku}
                </span>
            </div>
        </div>
    );
}
