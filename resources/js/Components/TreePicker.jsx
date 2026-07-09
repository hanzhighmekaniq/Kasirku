import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronRight, ChevronsUpDown, Search, X } from "lucide-react";

/* ── Depth visual helpers ─────────────────────────────── */
const DEPTH_COLORS = [
    "text-indigo-600",
    "text-violet-600",
    "text-blue-500",
    "text-cyan-500",
    "text-teal-500",
];
const DEPTH_BG = [
    "bg-indigo-50",
    "bg-violet-50",
    "bg-blue-50",
    "bg-cyan-50",
    "bg-teal-50",
];
const DEPTH_ICONS = ["📁", "📂", "📄", "📎", "🔖"];

function depthColor(d) {
    return DEPTH_COLORS[Math.min(d, DEPTH_COLORS.length - 1)];
}
function depthBg(d) {
    return DEPTH_BG[Math.min(d, DEPTH_BG.length - 1)];
}
function depthIcon(d) {
    return DEPTH_ICONS[Math.min(d, DEPTH_ICONS.length - 1)];
}

/**
 * TreePicker — Portal-based tree select with search & keyboard nav.
 *
 * Props:
 *   categories          — array of { id, name, display_path, depth, parent_id }
 *   value               — currently selected category id (string or number)
 *   onChange(value)     — called with String(id) when user selects
 *   onClear()           — called when user clears selection
 *   placeholder         — text shown when nothing selected (default: "Pilih...")
 *   showRoot            — show "Kategori Utama" root option (optional)
 *   rootLabel           — label for root option (default: "Kategori Utama")
 *   size                — "sm" | "md" | "lg" (default: "md")
 *   triggerClassName    — extra classes for trigger button
 *   showSelectedBanner  — show confirmation banner below (default: false)
 *   bannerLabel         — label for the banner prefix (default: "Dipilih:")
 */
export default function TreePicker({
    categories = [],
    value,
    onChange,
    onClear,
    placeholder = "Pilih...",
    showRoot = false,
    rootLabel = "Kategori Utama",
    size = "md",
    triggerClassName = "",
    showSelectedBanner = false,
    bannerLabel = "Dipilih:",
}) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [highlightIdx, setHlIdx] = useState(-1);

    const triggerRef = useRef(null);
    const panelRef = useRef(null);
    const searchRef = useRef(null);
    const hlRef = useRef(null);

    const [panelStyle, setPanelStyle] = useState({});

    const selectedCat = useMemo(
        () => categories.find((c) => c.id === Number(value)),
        [categories, value],
    );

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return categories;
        return categories.filter(
            (c) =>
                c.name.toLowerCase().includes(q) ||
                (c.display_path || "").toLowerCase().includes(q),
        );
    }, [categories, search]);

    /* ── Compute panel position ── */
    const computePosition = useCallback(() => {
        if (!triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        const space = window.innerHeight - rect.bottom - 8;
        const PANEL = 340;

        if (space >= PANEL || space >= 200) {
            setPanelStyle({
                position: "fixed",
                top: rect.bottom + 4,
                left: rect.left,
                width: Math.max(rect.width, 280),
                zIndex: 9999,
            });
        } else {
            setPanelStyle({
                position: "fixed",
                bottom: window.innerHeight - rect.top + 4,
                left: rect.left,
                width: Math.max(rect.width, 280),
                zIndex: 9999,
            });
        }
    }, []);

    /* ── Open / Close ── */
    const openPicker = () => {
        computePosition();
        setOpen(true);
        setSearch("");
        setHlIdx(-1);
        requestAnimationFrame(() => searchRef.current?.focus());
    };

    const closePicker = useCallback(() => {
        setOpen(false);
        setSearch("");
        setHlIdx(-1);
    }, []);

    /* ── Scroll to selected on open ── */
    useEffect(() => {
        if (!open) return;
        requestAnimationFrame(() => {
            hlRef.current?.scrollIntoView({
                block: "nearest",
                behavior: "instant",
            });
        });
    }, [open]);

    /* ── Scroll to highlighted on keyboard nav ── */
    useEffect(() => {
        if (!open || highlightIdx < 0) return;
        hlRef.current?.scrollIntoView({
            block: "nearest",
            behavior: "instant",
        });
    }, [highlightIdx, open]);

    /* ── Outside click ── */
    useEffect(() => {
        if (!open) return;
        const fn = (e) => {
            if (
                !triggerRef.current?.contains(e.target) &&
                !panelRef.current?.contains(e.target)
            ) {
                closePicker();
            }
        };
        document.addEventListener("mousedown", fn);
        return () => document.removeEventListener("mousedown", fn);
    }, [open, closePicker]);

    /* ── Recompute on scroll/resize ── */
    useEffect(() => {
        if (!open) return;
        const fn = () => computePosition();
        window.addEventListener("scroll", fn, true);
        window.addEventListener("resize", fn);
        return () => {
            window.removeEventListener("scroll", fn, true);
            window.removeEventListener("resize", fn);
        };
    }, [open, computePosition]);

    /* ── Keyboard ── */
    const handleKey = (e) => {
        if (e.key === "Escape") {
            closePicker();
            return;
        }
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setHlIdx((i) => Math.min(i + 1, filtered.length - 1));
            return;
        }
        if (e.key === "ArrowUp") {
            e.preventDefault();
            setHlIdx((i) => Math.max(i - 1, -1));
            return;
        }
        if (e.key === "Enter" && highlightIdx >= 0) {
            e.preventDefault();
            const cat = filtered[highlightIdx];
            if (cat) {
                onChange(String(cat.id));
                closePicker();
            }
        }
    };

    const select = (cat) => {
        onChange(String(cat.id));
        closePicker();
    };
    const clear = () => {
        onClear();
        closePicker();
    };

    /* ── Size classes ── */
    const sizeClasses = {
        sm: "px-3 py-1.5 text-xs",
        md: "pl-3.5 pr-4 py-2.5 text-sm",
        lg: "pl-3.5 pr-4 py-3 text-sm",
    };

    /* ── Panel (portal) ── */
    const panel = open
        ? createPortal(
              <div
                  ref={panelRef}
                  style={panelStyle}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
              >
                  {/* Search bar */}
                  <div className="border-b border-slate-100 p-2.5">
                      <div className="relative">
                          <Search className="pointer-events-none absolute inset-y-0 left-3 my-auto h-4 w-4 text-slate-400" />
                          <input
                              ref={searchRef}
                              type="text"
                              value={search}
                              onChange={(e) => {
                                  setSearch(e.target.value);
                                  setHlIdx(0);
                              }}
                              onKeyDown={handleKey}
                              placeholder="Ketik nama kategori..."
                              className="block w-full rounded-xl border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
                          />
                          {search && (
                              <button
                                  type="button"
                                  onClick={() => {
                                      setSearch("");
                                      setHlIdx(-1);
                                      searchRef.current?.focus();
                                  }}
                                  className="absolute inset-y-0 right-2 flex items-center px-1 text-slate-400 hover:text-slate-600"
                              >
                                  <X className="h-4 w-4" />
                              </button>
                          )}
                      </div>
                  </div>

                  {/* List */}
                  <div className="max-h-60 overflow-y-auto overscroll-contain">
                      {showRoot && !search && (
                          <button
                              type="button"
                              onMouseDown={(e) => {
                                  e.preventDefault();
                                  clear();
                              }}
                              className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition ${!value ? "bg-indigo-50" : "hover:bg-slate-50"}`}
                          >
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-base">
                                  🏠
                              </span>
                              <div className="min-w-0 flex-1">
                                  <p
                                      className={`text-sm font-semibold ${!value ? "text-indigo-700" : "text-slate-700"}`}
                                  >
                                      {rootLabel}
                                  </p>
                                  <p className="text-xs text-slate-400">
                                      Tanpa induk (root level)
                                  </p>
                              </div>
                              {!value && (
                                  <svg
                                      className="ml-auto h-5 w-5 shrink-0 text-indigo-500"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      strokeWidth={2}
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
                      )}
                      {showRoot && !search && (
                          <div className="mx-3 border-t border-slate-100" />
                      )}

                      {filtered.length === 0 ? (
                          <div className="px-4 py-10 text-center">
                              <p className="text-sm text-slate-400">
                                  Tidak ditemukan
                              </p>
                              <p className="mt-1 text-xs text-slate-300">
                                  Coba kata kunci lain
                              </p>
                          </div>
                      ) : (
                          filtered.map((cat, i) => {
                              const isSelected = Number(value) === cat.id;
                              const isHighlighted = i === highlightIdx;
                              const depth = cat.depth ?? 0;

                              return (
                                  <button
                                      key={cat.id}
                                      type="button"
                                      ref={
                                          isSelected || isHighlighted
                                              ? hlRef
                                              : undefined
                                      }
                                      onMouseDown={(e) => {
                                          e.preventDefault();
                                          select(cat);
                                      }}
                                      onMouseEnter={() => setHlIdx(i)}
                                      className={`flex w-full items-center text-left text-sm transition-colors ${
                                          isSelected
                                              ? `${depthBg(depth)} font-medium`
                                              : isHighlighted
                                                ? "bg-slate-100"
                                                : "hover:bg-slate-50"
                                      }`}
                                      style={{
                                          paddingLeft: `${12 + depth * 20}px`,
                                          paddingRight: "12px",
                                      }}
                                  >
                                      {/* Vertical guide lines — the "kabel" */}
                                      {depth > 0 && (
                                          <span className="mr-1 shrink-0 font-mono text-xs text-slate-200 select-none">
                                              {"│ ".repeat(depth - 1)}└─
                                          </span>
                                      )}
                                      <span
                                          className={`mr-2.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm ${depthBg(depth)}`}
                                      >
                                          {depthIcon(depth)}
                                      </span>
                                      <div className="min-w-0 flex-1 py-2">
                                          <p
                                              className={`truncate text-sm font-medium ${isSelected ? depthColor(depth) : "text-slate-800"}`}
                                          >
                                              {cat.name}
                                          </p>
                                          {depth > 0 && (
                                              <p className="truncate text-[11px] text-slate-400">
                                                  {cat.display_path}
                                              </p>
                                          )}
                                      </div>
                                      {isSelected && (
                                          <svg
                                              className={`ml-2 h-4 w-4 shrink-0 ${depthColor(depth)}`}
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
                              );
                          })
                      )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between border-t border-slate-100 px-4 py-1.5 text-[11px] text-slate-400">
                      <span>{categories.length} kategori tersedia</span>
                      <span>↑↓ navigasi · Enter pilih · Esc tutup</span>
                  </div>
              </div>,
              document.body,
          )
        : null;

    return (
        <div>
            {/* Trigger button */}
            <button
                ref={triggerRef}
                type="button"
                onClick={open ? closePicker : openPicker}
                className={`flex w-full items-center gap-2.5 rounded-xl border bg-slate-50 text-left shadow-sm transition focus:outline-none focus:ring-2 focus:ring-indigo-200 ${sizeClasses[size]} ${
                    open
                        ? "border-indigo-400 ring-2 ring-indigo-100"
                        : "border-slate-200 hover:border-indigo-300"
                } ${triggerClassName}`}
            >
                {selectedCat ? (
                    <>
                        <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-lg text-xs ${depthBg(selectedCat.depth ?? 0)}`}
                        >
                            {depthIcon(selectedCat.depth ?? 0)}
                        </span>
                        <span
                            className={`min-w-0 flex-1 truncate text-sm font-medium ${depthColor(selectedCat.depth ?? 0)}`}
                        >
                            {selectedCat.name}
                        </span>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onClear();
                            }}
                            className="ml-1 shrink-0 rounded-lg p-0.5 text-slate-400 hover:bg-red-50 hover:text-red-500"
                            title="Hapus pilihan"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </>
                ) : (
                    <>
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                            <svg
                                className="h-2.5 w-2.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
                                />
                            </svg>
                        </span>
                        <span className="text-slate-400">{placeholder}</span>
                        <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 text-slate-400" />
                    </>
                )}
            </button>

            {panel}

            {/* Selected banner */}
            {showSelectedBanner && selectedCat && (
                <div
                    className={`mt-2 flex items-center gap-2.5 rounded-xl border px-3.5 py-2 text-xs ${depthBg(selectedCat.depth ?? 0)}`}
                >
                    <svg
                        className={`h-4 w-4 shrink-0 ${depthColor(selectedCat.depth ?? 0)}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                    <span className="text-slate-600">{bannerLabel}</span>
                    <span
                        className={`font-semibold ${depthColor(selectedCat.depth ?? 0)}`}
                    >
                        {selectedCat.display_path}
                    </span>
                    <span className="ml-auto shrink-0 rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                        Level {(selectedCat.depth ?? 0) + 1}
                    </span>
                </div>
            )}
        </div>
    );
}
