import ReactDatePicker from "react-datepicker";
import { forwardRef } from "react";
import { CalendarClock, X } from "lucide-react";
import { id } from "date-fns/locale";

/**
 * DateTimePicker — pilih tanggal + jam sekaligus
 *
 * Props:
 *   value         — Date | null
 *   onChange      — (Date | null) => void
 *   placeholder   — string, default "Pilih tanggal & waktu"
 *   dateFormat    — string, default "dd MMM yyyy  HH:mm"
 *   timeFormat    — string, default "HH:mm"
 *   timeIntervals — number, interval menit (default 15)
 *   minDate       — Date | null
 *   maxDate       — Date | null
 *   minTime       — Date | null
 *   maxTime       — Date | null
 *   disabled      — boolean
 *   clearable     — boolean (default true)
 *   label         — string
 *   error         — string
 *   className     — string
 *   showMonthYearDropdown — boolean (default true)
 */
const DateTimeInput = forwardRef(
    ({ value, onClick, placeholder, disabled, onClear, hasValue }, ref) => {
        const inputCls = `flex w-full items-center gap-2 rounded-xl border bg-card px-3 py-2.5 text-sm shadow-sm transition
            focus:outline-none focus:border-ring focus:ring-2 focus:ring-ring/20
            ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:border-ring/60"}
            ${hasValue ? "border-input text-foreground" : "border-input text-muted-foreground"}`;

        return (
            <div className="relative w-full">
                <button
                    type="button"
                    ref={ref}
                    onClick={onClick}
                    disabled={disabled}
                    className={inputCls}
                >
                    <CalendarClock className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="flex-1 text-left">
                        {value || placeholder}
                    </span>
                </button>
                {hasValue && onClear && !disabled && (
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onClear(); }}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-muted-foreground hover:text-foreground transition"
                        tabIndex={-1}
                        aria-label="Hapus tanggal & waktu"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                )}
            </div>
        );
    }
);
DateTimeInput.displayName = "DateTimeInput";

export default function DateTimePicker({
    value = null,
    onChange,
    placeholder = "Pilih tanggal & waktu",
    dateFormat = "dd MMM yyyy  HH:mm",
    timeFormat = "HH:mm",
    timeIntervals = 15,
    minDate,
    maxDate,
    minTime,
    maxTime,
    disabled = false,
    clearable = true,
    label,
    error,
    className = "",
    showMonthYearDropdown = true,
}) {
    return (
        <div className={`w-full ${className}`}>
            {label && (
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                    {label}
                </label>
            )}
            <ReactDatePicker
                selected={value}
                onChange={onChange}
                showTimeSelect
                timeFormat={timeFormat}
                timeIntervals={timeIntervals}
                dateFormat={dateFormat}
                minDate={minDate}
                maxDate={maxDate}
                minTime={minTime}
                maxTime={maxTime}
                disabled={disabled}
                locale={id}
                timeCaption="Waktu"
                showMonthDropdown={showMonthYearDropdown}
                showYearDropdown={showMonthYearDropdown}
                dropdownMode="select"
                popperPlacement="bottom-start"
                customInput={
                    <DateTimeInput
                        placeholder={placeholder}
                        disabled={disabled}
                        hasValue={!!value}
                        onClear={clearable ? () => onChange(null) : null}
                    />
                }
            />
            {error && (
                <p className="mt-1.5 text-xs text-destructive">{error}</p>
            )}
        </div>
    );
}
