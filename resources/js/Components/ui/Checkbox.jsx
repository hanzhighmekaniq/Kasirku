import { Check } from "lucide-react";

/**
 * Checkbox — kotak centang yang digambar manual, bukan native browser checkbox.
 *
 * Native `<input type="checkbox">` mewarnai kotaknya lewat `accent-color`
 * browser, jadi saat tercentang isinya jadi warna primary dengan tanda centang
 * bawaan browser yang warnanya tidak bisa dikontrol. Di tema gelap tanda centang
 * itu sering bertabrakan dengan latar primary sehingga nyaris tak terlihat.
 *
 * Di sini kotak dan tanda centang digambar sendiri memakai token tema:
 * `bg-primary` untuk kotak dan `text-primary-foreground` untuk centangnya, jadi
 * kontrasnya selalu benar mengikuti pasangan token — termasuk saat user
 * mengganti preset warna.
 *
 * Props:
 *   checked   — boolean
 *   onChange  — (event) => void, menerima event asli seperti input biasa
 *   label     — string | ReactNode, teks di samping kotak (opsional)
 *   disabled  — boolean
 *   className — tambahan class untuk wrapper
 */
export default function Checkbox({
    checked = false,
    onChange,
    label,
    disabled = false,
    className = "",
    ...props
}) {
    return (
        <label
            className={`inline-flex select-none items-center gap-3 ${
                disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
            } ${className}`}
        >
            <span className="relative inline-flex h-4 w-4 shrink-0 items-center justify-center">
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={onChange}
                    disabled={disabled}
                    className="peer sr-only"
                    {...props}
                />
                <span
                    className={`flex h-4 w-4 items-center justify-center rounded border-2 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-ring/40 peer-focus-visible:ring-offset-1 peer-focus-visible:ring-offset-background ${
                        checked
                            ? "border-primary bg-primary"
                            : "border-muted-foreground/40 bg-background"
                    }`}
                >
                    {checked && (
                        <Check
                            className="h-3 w-3 text-primary-foreground"
                            strokeWidth={3}
                        />
                    )}
                </span>
            </span>
            {label && <span className="text-sm text-foreground">{label}</span>}
        </label>
    );
}
