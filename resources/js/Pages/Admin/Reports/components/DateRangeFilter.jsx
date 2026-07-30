import { router } from '@inertiajs/react';
import { useState } from 'react';
import DateRangePicker from '@/Components/ui/DateRangePicker';
import { format } from 'date-fns';

const PRESETS = [
    { label: 'Hari Ini', getRange: () => { const t = new Date(); return { start: t, end: t }; } },
    { label: '7 Hari', getRange: () => { const e = new Date(); const s = new Date(); s.setDate(s.getDate() - 6); return { start: s, end: e }; } },
    { label: '30 Hari', getRange: () => { const e = new Date(); const s = new Date(); s.setDate(s.getDate() - 29); return { start: s, end: e }; } },
    { label: 'Bulan Ini', getRange: () => { const n = new Date(); return { start: new Date(n.getFullYear(), n.getMonth(), 1), end: n }; } },
];

const toStr = (d) => d ? format(d, 'yyyy-MM-dd') : null;
const toDate = (s) => s ? new Date(s) : null;

export default function DateRangeFilter({ from, to, routeName, extraParams = {} }) {
    const [startDate, setStartDate] = useState(toDate(from));
    const [endDate, setEndDate] = useState(toDate(to));

    const apply = (s, e) => {
        const params = { ...extraParams };
        if (s) params.start_date = toStr(s);
        if (e) params.end_date = toStr(e);
        router.get(route(routeName), params, { preserveState: false, replace: true });
    };

    const handleChange = ({ startDate: s, endDate: e }) => {
        setStartDate(s);
        setEndDate(e);
        // Auto-apply saat range sudah lengkap (start & end dipilih)
        if (s && e) {
            apply(s, e);
        }
    };

    return (
        <div className="flex flex-wrap items-center gap-2">
            {/* Preset buttons */}
            {PRESETS.map((p) => (
                <button
                    key={p.label}
                    type="button"
                    onClick={() => {
                        const r = p.getRange();
                        setStartDate(r.start);
                        setEndDate(r.end);
                        apply(r.start, r.end);
                    }}
                    className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
                >
                    {p.label}
                </button>
            ))}

            {/* Date range picker */}
            <DateRangePicker
                startDate={startDate}
                endDate={endDate}
                onChange={handleChange}
                placeholder="Pilih rentang tanggal"
                monthsShown={2}
            />
        </div>
    );
}
