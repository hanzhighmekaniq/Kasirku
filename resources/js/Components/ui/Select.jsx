import {
    Fragment,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { createPortal } from "react-dom";
import {
    Listbox,
    ListboxButton,
    ListboxOption,
    ListboxOptions,
    Transition,
} from "@headlessui/react";
import { Check, ChevronsUpDown, Search, X } from "lucide-react";

/**
 * Select — Headless UI Listbox (non-searchable) + custom portal search (searchable).
 *
 * Searchable mode menggunakan portal + ref focus manual — persis seperti TreePicker.
 *
 * Props:
 *   options     — [{ value, label }]  |  [{ id, name }]
 *   value       — nilai terpilih
 *   onChange    — (value) => void
 *   placeholder — teks saat kosong
 *   label       — label opsional
 *   error       — pesan error Laravel
 *   disabled    — boolean
 *   searchable  — boolean, tampilkan search bar di dalam dropdown
 *   className   — class wrapper
 */
export default function Select({
    options = [],
    value,
    onChange,
    placeholder = "Pilih...",
    label,
    error,
    disabled = false,
    searchable = false,
    className = "",
}) {
    const [query, setQuery] = useState("");
    const [highlightIdx, setHlIdx] = useState(-1);

    const triggerRef = useRef(null);
    const panelRef = useRef(null);
    const searchRef = useRef(null);
    const hlRef = useRef(null);

    const getLabel = (opt) =>
        opt.label ?? opt.name ?? String(opt.value ?? opt.id);
    const getValue = (opt) => opt.value ?? opt.id;

    const selected = options.find((o) => String(getValue(o)) === String(value));

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return options;
        return options.filter((o) => getLabel(o).toLowerCase().includes(q));
    }, [options, query]);

    /* ── Panel position ── */
    const [panelStyle, setPanelStyle] = useState({});

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
                width: rect.width,
                zIndex: 9999,
            });
        } else {
            setPanelStyle({
                position: "fixed",
                bottom: window.innerHeight - rect.top + 4,
                left: rect.left,
                width: rect.width,
                zIndex: 9999,
            });
        }
    }, []);

    /* ── Open/close ── */
    const [searchOpen, setSearchOpen] = useState(false);

    const openPicker = () => {
        computePosition();
        setSearchOpen(true);
        setQuery("");
        setHlIdx(-1);
        requestAnimationFrame(() => searchRef.current?.focus());
    };

    const closePicker = useCallback(() => {
        setSearchOpen(false);
        setQuery("");
        setHlIdx(-1);
    }, []);

    /* ── Outside click ── */
    useEffect(() => {
        if (!searchOpen) return;
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
    }, [searchOpen, closePicker]);

    /* ── Recompute on scroll/resize ── */
    useEffect(() => {
        if (!searchOpen) return;
        const fn = () => computePosition();
        window.addEventListener("scroll", fn, true);
        window.addEventListener("resize", fn);
        return () => {
            window.removeEventListener("scroll", fn, true);
            window.removeEventListener("resize", fn);
        };
    }, [searchOpen, computePosition]);

    /* ── Keyboard ── */
    const handleKey = (e) => {
        if (e.key === "Escape") {
            closePicker();
            triggerRef.current?.focus();
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
            const opt = filtered[highlightIdx];
            if (opt) {
                onChange(String(getValue(opt)));
                closePicker();
            }
        }
    };

    const select = (opt) => {
        onChange(String(getValue(opt)));
        closePicker();
    };

    /* ── Shared styles ── */
    const btnCls = `relative w-full cursor-pointer rounded-xl border bg-slate-50 py-2.5 pl-3.5 pr-10 text-left text-sm shadow-sm transition focus:outline-none focus:ring-2 ${
        error
            ? "border-red-300 focus:border-red-400 focus:ring-red-100"
            : "border-slate-300 focus:border-indigo-400 focus:ring-indigo-100"
    } ${disabled ? "cursor-not-allowed bg-slate-100 text-slate-400" : "hover:border-indigo-300"}`;

    const optCls = (active, sel) =>
        `relative cursor-pointer select-none px-3.5 py-2.5 text-sm transition-colors ${
            sel
                ? "bg-indigo-50 font-semibold text-indigo-700"
                : active
                  ? "bg-slate-100 text-slate-800"
                  : "text-slate-700"
        }`;

    const Empty = () => (
        <div className="px-4 py-10 text-center">
            <p className="text-sm text-slate-400">
                {query ? "Tidak ditemukan" : "Tidak ada pilihan"}
            </p>
            {query && (
                <p className="mt-1 text-xs text-slate-300">
                    Coba kata kunci lain
                </p>
            )}
        </div>
    );

    /* ── Searchable panel (portal) ── */
    const searchPanel = searchOpen
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
                              value={query}
                              onChange={(e) => {
                                  setQuery(e.target.value);
                                  setHlIdx(0);
                              }}
                              onKeyDown={handleKey}
                              placeholder="Ketik untuk mencari..."
                              className="block w-full rounded-xl border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
                          />
                          {query && (
                              <button
                                  type="button"
                                  onClick={() => {
                                      setQuery("");
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

                  {/* List options */}
                  <div className="max-h-60 overflow-y-auto overscroll-contain">
                      {filtered.length === 0 ? (
                          <Empty />
                      ) : (
                          filtered.map((opt, i) => {
                              const isSelected =
                                  String(getValue(opt)) === String(value);
                              const isHighlighted = i === highlightIdx;

                              return (
                                  <button
                                      key={getValue(opt) ?? i}
                                      type="button"
                                      ref={isHighlighted ? hlRef : undefined}
                                      onMouseDown={(e) => {
                                          e.preventDefault();
                                          select(opt);
                                      }}
                                      onMouseEnter={() => setHlIdx(i)}
                                      className={`flex w-full items-center text-left text-sm transition-colors ${
                                          isSelected
                                              ? "bg-indigo-50 font-semibold"
                                              : isHighlighted
                                                ? "bg-slate-100"
                                                : "hover:bg-slate-50"
                                      }`}
                                  >
                                      <div className="flex w-full items-center gap-2.5 px-3.5 py-2.5">
                                          <span
                                              className={`block truncate ${
                                                  isSelected
                                                      ? "text-indigo-700"
                                                      : "text-slate-800"
                                              }`}
                                          >
                                              {getLabel(opt)}
                                          </span>
                                          {isSelected && (
                                              <Check className="ml-auto h-4 w-4 shrink-0 text-indigo-500" />
                                          )}
                                      </div>
                                  </button>
                              );
                          })
                      )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between border-t border-slate-100 px-4 py-1.5 text-[11px] text-slate-400">
                      <span>{options.length} pilihan</span>
                      <span>↑↓ navigasi · Enter pilih · Esc tutup</span>
                  </div>
              </div>,
              document.body,
          )
        : null;

    return (
        <div className={className}>
            {label && (
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {label}
                </label>
            )}

            {searchable ? (
                /* ── Custom searchable (portal) ── */
                <div>
                    <button
                        ref={triggerRef}
                        type="button"
                        onClick={searchOpen ? closePicker : openPicker}
                        disabled={disabled}
                        className={`${btnCls} ${searchOpen ? "border-indigo-400 ring-2 ring-indigo-100" : ""}`}
                    >
                        {selected ? (
                            <span className="block truncate text-slate-700">
                                {getLabel(selected)}
                            </span>
                        ) : (
                            <span className="block truncate text-slate-700">
                                {placeholder}
                            </span>
                        )}
                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                            <ChevronsUpDown className="h-4 w-4 text-slate-400" />
                        </span>
                    </button>
                    {searchPanel}
                </div>
            ) : (
                /* ── Listbox (non-searchable) ── */
                <Listbox value={value} onChange={onChange} disabled={disabled}>
                    <div className="relative">
                        <ListboxButton className={btnCls}>
                            {selected ? (
                                <span className="block truncate text-slate-700">
                                    {getLabel(selected)}
                                </span>
                            ) : (
                                <span className="block truncate text-slate-700">
                                    {placeholder}
                                </span>
                            )}
                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                <ChevronsUpDown className="h-4 w-4 text-slate-400" />
                            </span>
                        </ListboxButton>

                        <Transition
                            as={Fragment}
                            leave="transition ease-in duration-100"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                        >
                            <ListboxOptions
                                anchor="bottom start"
                                className="z-[9999] mt-1 w-[var(--button-width)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl focus:outline-none"
                            >
                                <div className="max-h-60 overflow-y-auto overscroll-contain py-1">
                                    {options.length === 0 ? (
                                        <Empty />
                                    ) : (
                                        options.map((opt, i) => (
                                            <ListboxOption
                                                key={getValue(opt) ?? i}
                                                value={getValue(opt)}
                                                as={Fragment}
                                            >
                                                {({
                                                    active,
                                                    selected: sel,
                                                }) => (
                                                    <li
                                                        className={optCls(
                                                            active,
                                                            sel,
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-2.5">
                                                            <span className="block truncate">
                                                                {getLabel(opt)}
                                                            </span>
                                                            {sel && (
                                                                <Check className="ml-auto h-4 w-4 shrink-0 text-indigo-500" />
                                                            )}
                                                        </div>
                                                    </li>
                                                )}
                                            </ListboxOption>
                                        ))
                                    )}
                                </div>
                            </ListboxOptions>
                        </Transition>
                    </div>
                </Listbox>
            )}

            {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
        </div>
    );
}
