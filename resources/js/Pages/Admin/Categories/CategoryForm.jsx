import { Link } from "@inertiajs/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

const inp = (err) =>
    `mt-1.5 block w-full rounded-xl border text-sm shadow-sm transition focus:outline-none focus:ring-2 ${
        err
            ? "border-red-300 focus:border-red-400 focus:ring-red-100"
            : "border-slate-200 focus:border-indigo-400 focus:ring-indigo-100"
    }`;

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

/* ── Tree Picker (Portal-based, no overflow issues) ────── */
function TreePicker({ parentCategories, value, onChange, onClear }) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [highlightIdx, setHlIdx] = useState(-1);

    const triggerRef = useRef(null);
    const panelRef = useRef(null);
    const searchRef = useRef(null);
    const hlRef = useRef(null);

    /* Panel position — computed fresh each open, no setTimeout */
    const [panelStyle, setPanelStyle] = useState({});

    const selectedCat = useMemo(
        () => parentCategories.find((c) => c.id === Number(value)),
        [parentCategories, value],
    );

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return parentCategories;
        return parentCategories.filter(
            (c) =>
                c.name.toLowerCase().includes(q) ||
                (c.display_path || "").toLowerCase().includes(q),
        );
    }, [parentCategories, search]);

    /* ── Compute panel position synchronously ── */
    const computePosition = useCallback(() => {
        if (!triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        const space = window.innerHeight - rect.bottom - 8;
        const PANEL = 340; // estimated panel height

        if (space >= PANEL || space >= 200) {
            // Drop down
            setPanelStyle({
                position: "fixed",
                top: rect.bottom + 4,
                left: rect.left,
                width: rect.width,
                zIndex: 9999,
            });
        } else {
            // Drop up
            setPanelStyle({
                position: "fixed",
                bottom: window.innerHeight - rect.top + 4,
                left: rect.left,
                width: rect.width,
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
        /* Focus search immediately — NO setTimeout */
        requestAnimationFrame(() => searchRef.current?.focus());
    };

    const closePicker = useCallback(() => {
        setOpen(false);
        setSearch("");
        setHlIdx(-1);
    }, []);

    /* ── Scroll to selected item when panel opens ── */
    useEffect(() => {
        if (!open) return;
        /* instant scroll — no smooth to avoid lag */
        requestAnimationFrame(() => {
            hlRef.current?.scrollIntoView({
                block: "nearest",
                behavior: "instant",
            });
        });
    }, [open]);

    /* ── Scroll to highlighted item on keyboard nav ── */
    useEffect(() => {
        if (!open || highlightIdx < 0) return;
        hlRef.current?.scrollIntoView({
            block: "nearest",
            behavior: "instant",
        });
    }, [highlightIdx, open]);

    /* ── Close on outside click ── */
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

    /* ── Panel content (rendered via portal) ── */
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
                          <svg
                              className="pointer-events-none absolute inset-y-0 left-3 my-auto h-4 w-4 text-slate-400"
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
                              ref={searchRef}
                              type="text"
                              value={search}
                              onChange={(e) => {
                                  setSearch(e.target.value);
                                  setHlIdx(0);
                              }}
                              onKeyDown={handleKey}
                              placeholder="Ketik nama kategori..."
                              className="block w-full rounded-xl border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
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
                                  <svg
                                      className="h-4 w-4"
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
                          )}
                      </div>
                  </div>

                  {/* List */}
                  <div className="max-h-64 overflow-y-auto overscroll-contain">
                      {/* Root option */}
                      {!search && (
                          <button
                              type="button"
                              onMouseDown={(e) => {
                                  e.preventDefault();
                                  clear();
                              }}
                              className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition ${
                                  !value ? "bg-indigo-50" : "hover:bg-slate-50"
                              }`}
                          >
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-base">
                                  🏠
                              </span>
                              <div className="min-w-0 flex-1">
                                  <p
                                      className={`text
-sm font-semibold ${!value ? "text-indigo-700" : "text-slate-700"}`}
                                  >
                                      Kategori Utama
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

                      {!search && (
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
                                      /* Use onMouseDown so it fires before blur */
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
                                      {/* Vertical guide lines */}
                                      {depth > 0 && (
                                          <span className="mr-1 shrink-0 font-mono text-xs text-slate-200 select-none">
                                              {"│ ".repeat(depth - 1)}└─
                                          </span>
                                      )}

                                      {/* Icon badge */}
                                      <span
                                          className={`mr-2.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm ${depthBg(depth)}`}
                                      >
                                          {depthIcon(depth)}
                                      </span>

                                      {/* Text */}
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

                                      {/* Check */}
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
                      <span>{parentCategories.length} kategori tersedia</span>
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
                className={`flex w-full items-center gap-3 rounded-xl border bg-white px-4 py-2.5 text-left text-sm shadow-sm transition focus:outline-none focus:ring-2 focus:ring-indigo-200 ${
                    open
                        ? "border-indigo-400 ring-2 ring-indigo-100"
                        : "border-indigo-300 hover:border-indigo-400"
                }`}
            >
                {selectedCat ? (
                    <>
                        <span
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-base ${depthBg(selectedCat.depth ?? 0)}`}
                        >
                            {depthIcon(selectedCat.depth ?? 0)}
                        </span>
                        <div className="min-w-0 flex-1">
                            <p
                                className={`truncate text-sm font-semibold ${depthColor(selectedCat.depth ?? 0)}`}
                            >
                                {selectedCat.name}
                            </p>
                            <p className="truncate text-xs text-slate-400">
                                {selectedCat.display_path}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onClear();
                            }}
                            className="ml-2 shrink-0 rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-500"
                            title="Hapus pilihan"
                        >
                            <svg
                                className="h-4 w-4"
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
                    </>
                ) : (
                    <>
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                            <svg
                                className="h-4 w-4"
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
                        <span className="text-slate-400">
                            Pilih kategori induk...
                        </span>
                        <svg
                            className="ml-auto h-4 w-4 shrink-0 text-slate-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9"
                            />
                        </svg>
                    </>
                )}
            </button>

            {panel}

            {/* Selected confirmation banner */}
            {selectedCat && (
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
                    <span className="text-slate-600">Sub-kategori dari:</span>
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

/* ── Main Form ──────────────────────────────────────────── */
export default function CategoryForm({
    data,
    setData,
    errors,
    processing,
    onSubmit,
    submitLabel = "Simpan",
    cancelHref,
    parentCategories = [],
}) {
    return (
        <form onSubmit={onSubmit} className="space-y-5">
            {/* Nama */}
            <div>
                <label className="block text-sm font-medium text-slate-700">
                    Nama Kategori <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    value={data.name}
                    autoFocus
                    onChange={(e) => setData("name", e.target.value)}
                    placeholder="cth. Minuman, Kaos, Lengan Panjang, Bordir"
                    className={inp(errors.name)}
                />
                {errors.name && (
                    <p className="mt-1 text-xs text-red-600">{errors.name}</p>
                )}
            </div>

            {/* Kategori Induk — Tree Picker */}
            {parentCategories.length > 0 && (
                <div className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-4">
                    <div className="mb-3">
                        <p className="text-sm font-semibold text-indigo-800">
                            📁 Kategori Induk
                            <span className="ml-1.5 text-xs font-normal text-indigo-400">
                                (opsional)
                            </span>
                        </p>
                        <p className="mt-0.5 text-xs text-indigo-500">
                            Kosongkan untuk kategori utama. Pilih untuk membuat
                            sub-kategori di bawah kategori lain.
                        </p>
                    </div>

                    <TreePicker
                        parentCategories={parentCategories}
                        value={data.parent_id}
                        onChange={(v) => setData("parent_id", v)}
                        onClear={() => setData("parent_id", null)}
                    />
                </div>
            )}

            {/* Deskripsi */}
            <div>
                <label className="block text-sm font-medium text-slate-700">
                    Deskripsi
                </label>
                <textarea
                    value={data.description ?? ""}
                    rows={3}
                    onChange={(e) => setData("description", e.target.value)}
                    placeholder="Keterangan singkat (opsional)"
                    className={inp(errors.description)}
                />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <Link
                    href={cancelHref}
                    className="rounded-xl border border-slate-200 px-5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                    Batal
                </Link>
                <button
                    type="submit"
                    disabled={processing}
                    className="rounded-xl bg-indigo-600 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                    {processing ? "Menyimpan..." : submitLabel}
                </button>
            </div>
        </form>
    );
}
