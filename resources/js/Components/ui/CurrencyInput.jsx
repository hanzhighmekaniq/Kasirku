import { useEffect, useState } from "react";
import { formatNumber } from "@/Utils/currency";

/**
 * CurrencyInput — input rupiah dengan format visual.
 *
 * Saat user mengetik: tampil "12.345" (auto format)
 * Saat disimpan: value = 12345 (raw number string)
 *
 * Props:
 *   value       — string, nilai mentah (contoh: "15000")
 *   onChange    — (value: string) => void, return nilai mentah
 *   placeholder — teks placeholder (default: "0")
 *   disabled    — boolean
 *   error       — boolean, tampil border merah
 *   required    — boolean, diteruskan ke input native
 *   id          — id input native, supaya bisa disorot lewat reportValidity()
 *   className   — class tambahan
 */
export default function CurrencyInput({
    value,
    onChange,
    placeholder = "0",
    disabled = false,
    error = false,
    required = false,
    id,
    className = "",
}) {
    const [display, setDisplay] = useState("");

    // Sync display saat value berubah dari luar (form reset)
    useEffect(() => {
        const num = Number(value);
        if (num > 0) {
            setDisplay(formatNumber(num));
        } else if (!value || value === "0") {
            setDisplay("");
        }
    }, [value]);

    const handleChange = (e) => {
        const raw = e.target.value.replace(/[^0-9]/g, "");
        if (raw === "") {
            setDisplay("");
            onChange?.("0");
            return;
        }
        const num = parseInt(raw, 10);
        setDisplay(formatNumber(num));
        onChange?.(String(num));
    };

    return (
        <div className={`relative ${className}`}>
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-sm font-medium text-muted-foreground">
                Rp
            </span>
            <input
                id={id}
                type="text"
                inputMode="numeric"
                value={display}
                onChange={handleChange}
                placeholder={placeholder}
                disabled={disabled}
                required={required}
                className={`block w-full rounded-xl border bg-input py-2.5 pl-10 pr-3.5 text-sm text-foreground shadow-sm transition focus:border-ring focus:outline-none focus:ring-2 ${
                    error
                        ? "border-destructive focus:ring-destructive"
                        : "border-border focus:ring-ring"
                } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
            />
        </div>
    );
}
