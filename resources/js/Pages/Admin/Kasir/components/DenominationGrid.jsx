import { useMemo } from 'react';
import { fmt } from './helpers';

/**
 * DenominationGrid — Reusable quick cash suggestions grid.
 * Generates smart cash denomination buttons based on target total amount.
 */
export default function DenominationGrid({
    totalAmount = 0,
    currentValue = 0,
    onSelect,
}) {
    const suggestions = useMemo(() => {
        const amt = Number(totalAmount) || 0;
        if (amt <= 0) return [10000, 20000, 50000, 100000];

        const list = [amt]; // Uang Pas

        // Add standard rounding steps above amt
        const roundSteps = [5000, 10000, 20000, 50000, 100000];
        roundSteps.forEach((step) => {
            const next = Math.ceil(amt / step) * step;
            if (next >= amt) {
                list.push(next);
            }
        });

        // Common large bill options
        [50000, 100000].forEach((bill) => {
            if (bill > amt) list.push(bill);
        });

        // Remove duplicates and sort
        const unique = Array.from(new Set(list)).sort((a, b) => a - b);
        return unique.slice(0, 6);
    }, [totalAmount]);

    return (
        <div className="grid grid-cols-3 gap-2">
            {suggestions.map((val) => {
                const isExact = val === totalAmount;
                const isActive = currentValue === val;
                return (
                    <button
                        key={val}
                        type="button"
                        onClick={() => onSelect(val)}
                        className={`rounded-lg border px-2.5 py-2 text-xs font-semibold transition ${
                            isActive
                                ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary/30'
                                : 'border-border bg-card text-foreground hover:border-primary/40 hover:bg-muted/50'
                        }`}
                    >
                        {isExact ? (
                            <span className="flex items-center justify-center gap-1">
                                <span className="text-[10px] text-primary">Pas</span>
                                {fmt(val)}
                            </span>
                        ) : (
                            fmt(val)
                        )}
                    </button>
                );
            })}
        </div>
    );
}
