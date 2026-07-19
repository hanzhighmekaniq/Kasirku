import Tooltip from "./Tooltip";

/**
 * TipButton — tombol icon-only dengan tooltip + aria-label otomatis.
 * Dipakai di seluruh POS supaya action ringkas tapi tetap jelas maknanya.
 *
 * Props:
 *   label    — teks tooltip + aria-label (WAJIB untuk aksesibilitas)
 *   icon     — komponen icon lucide-react (contoh: ScanLine)
 *   onClick  — handler
 *   side     — posisi tooltip (default "top")
 *   variant  — "ghost" | "subtle" | "solid" | "danger" | "success"
 *   size     — "sm" | "md" | "lg" (ukuran tombol)
 *   active   — bila true, tampil state aktif
 *   disabled — bila true, tombol non-aktif
 */
const VARIANTS = {
    ghost: "text-slate-500 hover:bg-slate-100 hover:text-slate-900",
    subtle: "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900",
    solid: "bg-slate-900 text-white hover:bg-slate-700",
    danger: "text-slate-400 hover:bg-rose-50 hover:text-rose-600",
    success: "text-slate-400 hover:bg-emerald-50 hover:text-emerald-600",
};

const SIZES = {
    sm: { box: "h-7 w-7 rounded-lg", icon: 15 },
    md: { box: "h-9 w-9 rounded-lg", icon: 17 },
    lg: { box: "h-11 w-11 rounded-xl", icon: 20 },
};

export default function TipButton({
    label,
    icon: Icon,
    onClick,
    side = "top",
    variant = "ghost",
    size = "md",
    active = false,
    disabled = false,
    type = "button",
    className = "",
}) {
    const s = SIZES[size] ?? SIZES.md;
    const variantClass = active
        ? "bg-slate-900 text-white"
        : (VARIANTS[variant] ?? VARIANTS.ghost);

    return (
        <Tooltip label={label} side={side}>
            <button
                type={type}
                onClick={onClick}
                disabled={disabled}
                aria-label={label}
                className={`inline-flex shrink-0 items-center justify-center transition ${s.box} ${variantClass} disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
            >
                {Icon && <Icon size={s.icon} strokeWidth={2} />}
            </button>
        </Tooltip>
    );
}
