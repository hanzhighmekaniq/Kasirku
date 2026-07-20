import { useMemo, useState } from 'react';
import { generateColorScale } from '@/Theme/generateShades';
import { SHADE_KEYS } from '@/Theme/tokens';

/**
 * ── Theme Picker: Custom Theme Generator ─────────────────────────
 *
 * Form 3 color picker (Primary/Secondary/Accent) + live preview
 * skala 50-950 yang di-generate langsung dari generateShades.js —
 * user melihat hasil algoritma HSL secara real-time sebelum apply.
 */
export default function CustomThemeForm({ initialColors, onApply }) {
    const [colors, setColors] = useState(
        initialColors ?? { primary: '#4F46E5', secondary: '#64748B', accent: '#8B5CF6' },
    );

    const scales = useMemo(
        () => ({
            primary: generateColorScale(colors.primary),
            secondary: generateColorScale(colors.secondary),
            accent: generateColorScale(colors.accent),
        }),
        [colors],
    );

    const updateColor = (key, value) => {
        setColors((prev) => ({ ...prev, [key]: value }));
    };

    return (
        <div className="space-y-5">
            {/* Color pickers */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {[
                    { key: 'primary', label: 'Primary' },
                    { key: 'secondary', label: 'Secondary' },
                    { key: 'accent', label: 'Accent' },
                ].map(({ key, label }) => (
                    <div key={key} className="space-y-1.5">
                        <label className="block text-xs font-semibold text-slate-600">{label}</label>
                        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
                            <input
                                type="color"
                                value={colors[key]}
                                onChange={(e) => updateColor(key, e.target.value)}
                                className="h-8 w-8 shrink-0 cursor-pointer rounded-lg border border-slate-200"
                            />
                            <input
                                type="text"
                                value={colors[key]}
                                onChange={(e) => updateColor(key, e.target.value)}
                                className="w-full border-0 bg-transparent p-0 font-mono text-sm text-slate-700 focus:outline-none focus:ring-0"
                                placeholder="#4F46E5"
                            />
                        </div>
                    </div>
                ))}
            </div>

            {/* Live shade preview per warna */}
            <div className="space-y-3">
                {[
                    { key: 'primary', label: 'Primary Scale' },
                    { key: 'secondary', label: 'Secondary Scale' },
                    { key: 'accent', label: 'Accent Scale' },
                ].map(({ key, label }) => (
                    <div key={key}>
                        <p className="mb-1.5 text-xs font-semibold text-slate-500">{label}</p>
                        <div className="flex overflow-hidden rounded-xl border border-slate-200">
                            {SHADE_KEYS.map((shade) => (
                                <div
                                    key={shade}
                                    className="group relative flex-1"
                                    style={{ background: scales[key][shade], height: '32px' }}
                                    title={`${shade}: ${scales[key][shade]}`}
                                >
                                    <span className="absolute inset-x-0 bottom-0 hidden bg-black/70 py-0.5 text-center text-[8px] font-medium text-white group-hover:block">
                                        {shade}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Derived tokens preview */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="mb-2 text-xs font-semibold text-slate-500">Turunan Otomatis (Primary)</p>
                <div className="flex flex-wrap gap-2">
                    {[
                        { label: 'Hover', hex: scales.primary['700'] },
                        { label: 'Active', hex: scales.primary['800'] },
                        { label: 'Soft', hex: scales.primary['50'] },
                        { label: 'Border', hex: scales.primary['200'] },
                    ].map((d) => (
                        <div key={d.label} className="flex items-center gap-1.5 rounded-lg bg-white px-2 py-1 shadow-sm">
                            <span className="h-3.5 w-3.5 rounded-full border border-slate-200" style={{ background: d.hex }} />
                            <span className="text-[11px] font-medium text-slate-600">{d.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            <button
                type="button"
                onClick={() => onApply(colors)}
                className="w-full rounded-xl bg-primary-600 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700"
            >
                Terapkan Custom Theme
            </button>
        </div>
    );
}
