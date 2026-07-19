/**
 * Tooltip — bubble ringan berbasis CSS untuk menjelaskan tombol icon-only.
 * Muncul saat hover ATAU focus (keyboard-friendly), tanpa library tambahan.
 *
 * Props:
 *   label    — teks tooltip (string). Kalau kosong, hanya render children.
 *   side     — "top" | "bottom" | "left" | "right" (default "top")
 *   children — elemen pemicu (biasanya <button>)
 */
export default function Tooltip({ label, side = "top", children, className = "" }) {
    if (!label) return children;

    const pos = {
        top: "bottom-full left-1/2 mb-2 -translate-x-1/2",
        bottom: "top-full left-1/2 mt-2 -translate-x-1/2",
        left: "right-full top-1/2 mr-2 -translate-y-1/2",
        right: "left-full top-1/2 ml-2 -translate-y-1/2",
    }[side];

    const arrow = {
        top: "top-full left-1/2 -translate-x-1/2 -mt-1",
        bottom: "bottom-full left-1/2 -translate-x-1/2 -mb-1",
        left: "left-full top-1/2 -translate-y-1/2 -ml-1",
        right: "right-full top-1/2 -translate-y-1/2 -mr-1",
    }[side];

    return (
        <span className={`group/tt relative inline-flex ${className}`}>
            {children}
            <span
                role="tooltip"
                className={`pointer-events-none absolute z-[10050] hidden whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-[11px] font-semibold leading-none text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover/tt:opacity-100 group-focus-within/tt:opacity-100 sm:block ${pos}`}
            >
                {label}
                <span
                    className={`absolute h-2 w-2 rotate-45 bg-slate-900 ${arrow}`}
                />
            </span>
        </span>
    );
}
