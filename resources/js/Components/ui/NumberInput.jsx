import { forwardRef } from "react";

/**
 * NumberInput — input angka yang ramah pengguna.
 *
 * Menangani masalah nilai default '0'. Jika nilai saat ini '0' dan
 * pengguna mulai mengetik angka lain (misal '9'), hasilnya menjadi '9'
 * alih-alih '09'. Tetap mempertahankan fungsi panah atas/bawah bawaan
 * input type="number" dan mengizinkan pengosongan nilai.
 */
const NumberInput = forwardRef(function NumberInput(
    {
        value = "",
        onChange,
        min,
        max,
        step,
        disabled = false,
        placeholder,
        error = false,
        className = "",
        ...props
    },
    ref
) {
    const handleChange = (e) => {
        let val = e.target.value;

        // Cegah leading zero jika bukan desimal (misal '09' menjadi '9')
        if (val.length > 1 && val.startsWith("0") && !val.startsWith("0.")) {
            val = val.replace(/^0+/, "");
            if (val === "") val = "0";
        }

        // Panggil onChange bawaan (opsional, karena biasanya form hook membungkusnya)
        // Kita meneruskan val berupa string agar parent bebas mem-parse-nya,
        // sekaligus memungkinkan nilai string kosong ("") jika di-hapus.
        onChange?.(val);
    };

    // Override the raw event handler so react-hook-form or other tools
    // that pass a custom onChange function get the cleaned value.
    const handleOnChangeWrapper = (e) => {
        // e is a SyntheticEvent. We shouldn't mutate e.target.value directly,
        // but we can pass the event to onChange, OR some wrappers like Inertia's useForm
        // expect the event or the value.
        // Actually, Inertia's useForm works fine if we just pass e.target.value in the event.
        // Let's modify the event's target value.
        let val = e.target.value;
        if (val.length > 1 && val.startsWith("0") && !val.startsWith("0.")) {
            val = val.replace(/^0+/, "");
            if (val === "") val = "0";
        }
        
        // Buat event cloning yang aman
        const eventClone = {
            ...e,
            target: {
                ...e.target,
                value: val,
                name: e.target.name
            }
        };
        
        onChange?.(eventClone);
    }

    return (
        <input
            ref={ref}
            type="number"
            value={value}
            onChange={handleOnChangeWrapper}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            placeholder={placeholder}
            className={`block w-full rounded-xl border bg-input py-2.5 px-3.5 text-sm text-foreground shadow-sm transition focus:border-ring focus:outline-none focus:ring-2 ${
                error
                    ? "border-destructive focus:ring-destructive"
                    : "border-border focus:ring-ring"
            } ${disabled ? "cursor-not-allowed opacity-60" : ""} ${className}`}
            {...props}
        />
    );
});

export default NumberInput;
