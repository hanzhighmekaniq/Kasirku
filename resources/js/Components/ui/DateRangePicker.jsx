import ReactDatePicker from "react-datepicker";
import { forwardRef } from "react";
import { Calendar, X, ArrowRight } from "lucide-react";
import { id } from "date-fns/locale";

/**
 * DateRangePicker — pilih range tanggal (start & end)
 *
 * Props:
 *   startDate    — Date | null
 *   endDate      — Date | null
 *   onChange     — ({ startDate, endDate }) => void
 *   placeholder  — string, default "Pilih rentang tanggal"
 *   dateFormat   — string, default "dd MMM yyyy"
 *   minDate      — Date | null
 *   maxDate      — Date | null
 *   disabled     — boolean
 *   clearable    — boolean (default true)
 *   label        — string
 *   error        — string
 *   className    — string
 *   monthsShown  — number, jumlah bulan ditampilkan (default 2)
 */
const RangeInput = forwardRef(
    ({ value, onClick, placeholder, disabled, onClear, hasValue }, ref) => {
        const inputCls = `inline-flex w-auto items-center gap-2 rounded-xl border bg-card px-3 py-2.5 text-sm shadow-sm transition
            focus:outline-none focus:border-ring focus:ring-2 focus:ring-ring/20
            ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:border-ring/60"}
            ${hasValue ? "border-input text-foreground" : "border-input text-muted-foreground"}`;

        return (
            <div className="relative inline-block">
                <button
                    type="button"
                    ref={ref}
                    onClick={onClick}
                    disabled={disabled}
                    className={inputCls}
                >
                    <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="whitespace-nowrap text-left">
                        {value || placeholder}
                    </span>
                </button>
                {hasValue && onClear && !disabled && (
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onClear(); }}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-muted-foreground hover:text-foreground transition"
                        tabIndex={-1}
                        aria-label="Hapus rentang tanggal"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                )}
            </div>
        );
    }
);
RangeInput.displayName = "RangeInput";

export default function DateRangePicker({
    startDate = null,
    endDate = null,
    onChange,
    placeholder = "Pilih rentang tanggal",
    dateFormat = "dd MMM yyyy",
    minDate,
    maxDate,
    disabled = false,
    clearable = true,
    label,
    error,
    className = "",
    monthsShown = 2,
}) {
    const handleChange = ([start, end]) => {
        onChange({ startDate: start, endDate: end });
    };

    const handleClear = () => {
        onChange({ startDate: null, endDate: null });
    };

    // Format display value
    const displayValue = (() => {
        if (!startDate) return null;
        const fmt = (d) =>
            d?.toLocaleDateString("id-ID", {
                day: "2-digit",
                month: "short",
                year: "numeric",
            });
        if (!endDate) return fmt(startDate);
        return `${fmt(startDate)}  →  ${fmt(endDate)}`;
    })();

    return (
        <div className={`inline-block ${className}`}>
            {label && (
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                    {label}
                </label>
            )}
            <ReactDatePicker
                selectsRange
                startDate={startDate}
                endDate={endDate}
                onChange={handleChange}
                dateFormat={dateFormat}
                minDate={minDate}
                maxDate={maxDate}
                disabled={disabled}
                locale={id}
                monthsShown={monthsShown}
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
                popperPlacement="bottom-start"
                customInput={
                    <RangeInput
                        placeholder={placeholder}
                        disabled={disabled}
                        hasValue={!!startDate}
                        value={displayValue}
                        onClear={clearable ? handleClear : null}
                    />
                }
            />
            {error && (
                <p className="mt-1.5 text-xs text-destructive">{error}</p>
            )}
        </div>
    );
}
