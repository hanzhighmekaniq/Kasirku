import { Check } from "lucide-react";

/**
 * CheckboxTile — checkbox custom bergaya "tile" (label + kotak centang + teks),
 * dipakai untuk daftar pilihan seperti filter cabang. Kotak checkbox digambar
 * manual (bukan native browser checkbox) supaya kontras checked/unchecked
 * selalu jelas terlihat di semua tema, termasuk dark mode.
 *
 * Props:
 *   checked   — boolean
 *   onChange  — () => void
 *   label     — string | ReactNode, teks di sebelah kotak
 *   className — string, tambahan class untuk wrapper label
 */
export default function CheckboxTile({ checked, onChange, label, className = "" }) {
    return (
        <label
            className={`flex cursor-pointer select-none items-center gap-3 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                checked
                    ? "border-primary bg-primary/10 text-primary shadow-sm"
                    : "border-border bg-card text-foreground hover:bg-muted"
            } ${className}`}
        >
            <span
                className={`relative flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                    checked
                        ? "border-primary bg-primary"
                        : "border-muted-foreground/40 bg-card"
                }`}
            >
                {checked && (
                    <Check
                        className="h-3 w-3 text-primary-foreground"
                        strokeWidth={3}
                    />
                )}
            </span>
            <input
                type="checkbox"
                checked={checked}
                onChange={onChange}
                className="sr-only"
            />
            <span>{label}</span>
        </label>
    );
}
