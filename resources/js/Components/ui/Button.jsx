import { Loader2 } from "lucide-react";

/**
 * Button — komponen tombol universal yang selalu ikut tema aktif (light/dark
 * + preset warna user). Semua variant pakai warna FLAT dari CSS variable
 * tema (bg-primary, bg-destructive, dll) — TIDAK ADA gradient, supaya
 * konsisten & tidak "pecah" warnanya di light mode.
 *
 * Props:
 *   variant  — "primary" | "danger" | "success" | "ghost" | "outline" (default: "primary")
 *   size     — "sm" | "md" | "lg" (default: "md")
 *   as       — komponen lain untuk dirender sebagai pengganti <button>, misal Link dari Inertia
 *   icon     — komponen ikon (biasanya dari lucide-react), dirender di kiri label
 *   loading  — boolean, tampilkan spinner + nonaktifkan tombol
 *   disabled — boolean
 *   className — override/extend class tambahan
 *   ...props — diteruskan ke elemen dasar (href, onClick, type, dll)
 */
const VARIANT_CLASSES = {
    primary:
        "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:ring-primary",
    danger: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 focus-visible:ring-destructive",
    success:
        "bg-success text-success-foreground shadow-sm hover:bg-success/90 focus-visible:ring-success",
    ghost: "bg-transparent text-muted-foreground hover:bg-muted focus-visible:ring-ring",
    outline:
        "border border-border bg-card text-foreground hover:bg-muted focus-visible:ring-ring",
};

const SIZE_CLASSES = {
    sm: "gap-1.5 rounded-lg px-3 py-1.5 text-xs",
    md: "gap-2 rounded-xl px-4 py-2 text-sm",
    lg: "gap-2 rounded-xl px-5 py-2.5 text-sm",
};

const ICON_SIZE = {
    sm: 14,
    md: 16,
    lg: 18,
};

export default function Button({
    variant = "primary",
    size = "md",
    as: Component = "button",
    icon: Icon,
    loading = false,
    disabled = false,
    className = "",
    children,
    type,
    ...props
}) {
    const isDisabled = disabled || loading;
    const iconSize = ICON_SIZE[size] ?? 16;

    return (
        <Component
            type={Component === "button" ? type || "button" : undefined}
            disabled={Component === "button" ? isDisabled : undefined}
            aria-disabled={isDisabled || undefined}
            className={`inline-flex items-center justify-center font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT_CLASSES[variant] ?? VARIANT_CLASSES.primary} ${SIZE_CLASSES[size] ?? SIZE_CLASSES.md} ${className}`}
            {...props}
        >
            {loading ? (
                <Loader2 size={iconSize} className="animate-spin" />
            ) : (
                Icon && <Icon size={iconSize} strokeWidth={2} />
            )}
            {children}
        </Component>
    );
}
