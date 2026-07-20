import { router } from '@inertiajs/react';
import { useState } from 'react';
import { Calendar } from 'lucide-react';

const PRESETS = [
    { label: 'Hari Ini', getRange: () => { const t = new Date().toISOString().slice(0, 10); return { start: t, end: t }; } },
    { label: '7 Hari', getRange: () => { const e = new Date(); const s = new Date(); s.setDate(s.getDate() - 6); return { start: s.toISOString().slice(0, 10), end: e.toISOString().slice(0, 10) }; } },
    { label: '30 Hari', getRange: () => { const e = new Date(); const s = new Date(); s.setDate(s.getDate() - 29); return { start: s.toISOString().slice(0, 10), end: e.toISOString().slice(0, 10) }; } },
    { label: 'Bulan Ini', getRange: () => { const n = new Date(); const s = new Date(n.getFullYear(), n.getMonth(), 1); return { start: s.toISOString().slice(0, 10), end: n.toISOString().slice(0, 10) }; } },
];

export default function DateRangeFilter({ from, to, routeName, extraParams = {} }) {
    const [startDate, setStartDate] = useState(from ?? '');
    const [endDate, setEndDate] = useState(to ?? '');

    const apply = (s, e) => {
        const params = { ...extraParams };
        if (s) params.start_date = s;
        if (e) params.end_date = e;
        router.get(route(routeName), params, { preserveState: false, replace: true });
    };

    return (
        <div className="flex flex-wrap items-center gap-2">
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
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                >
                    {p.label}
                </button>
            ))}
            <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5">
                <Calendar size={13} className="text-slate-400" />
                <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="border-0 bg-transparent p-0 text-xs text-slate-700 focus:outline-none focus:ring-0"
                />
                <span className="text-xs text-slate-400">—</span>
                <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="border-0 bg-transparent p-0 text-xs text-slate-700 focus:outline-none focus:ring-0"
                />
                <button
                    onClick={() => apply(startDate, endDate)}
                    className="ml-1 rounded-md bg-primary-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-primary-700"
                >
                    Terapkan
                </button>
            </div>
        </div>
    );
}
