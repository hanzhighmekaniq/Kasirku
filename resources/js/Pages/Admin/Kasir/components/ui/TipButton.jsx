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
    ghost: "text-muted-foreground hover:bg-muted hover:text-foreground",
    subtle: "bg-muted text-muted-foreground hover:bg-muted hover:text-foreground",
    solid: "bg-primary text-white hover:bg-foreground",
    primary: "bg-primary text-primary-foreground hover:bg-foreground",
    danger: "text-muted-foreground/60 hover:bg-destructive/5 hover:text-destructive",
    success: "text-muted-foreground/60 hover:bg-success/10 hover:text-success",
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
    side = "buttom",
    variant = "ghost",
    size = "md",
    active = false,
    disabled = false,
    type = "button",
    className = "",
}) {
    const s = SIZES[size] ?? SIZES.md;
    const variantClass = active
        ? "bg-primary text-white"
        : (VARIANTS[variant] ?? VARIANTS.ghost);

    return (
        <Tooltip label={label} side={side}>
            <button
                type={type}
                onClick={onClick}
                disabled={disabled}
                aria-label={label}
                className={`inline-flex shrink-0 items-center justify-left transition justify-center ${s.box} ${variantClass} disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
            >
                {Icon && <Icon size={s.icon} strokeWidth={2} />}
            </button>
        </Tooltip>
    );
}
