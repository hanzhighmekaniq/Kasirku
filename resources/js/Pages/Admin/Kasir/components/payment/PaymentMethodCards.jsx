import { getMethodIcon } from './methodIcons';

/**
 * PaymentMethodCards — Grid of payment method selection cards.
 * Reusable across LangsungPanel and KasbonPanel DP selection.
 */
export default function PaymentMethodCards({
    methods = [],
    selectedMethodId = null,
    onSelect,
}) {
    return (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {methods.map((m) => {
                const Icon = getMethodIcon(m.code, m.type);
                const isSelected = String(selectedMethodId) === String(m.id);
                return (
                    <button
                        key={m.id}
                        type="button"
                        onClick={() => onSelect(m)}
                        className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-medium transition ${
                            isSelected
                                ? 'border-primary bg-primary/10 text-primary shadow-sm ring-1 ring-primary/30 font-semibold'
                                : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
                        }`}
                    >
                        <Icon size={20} strokeWidth={1.8} />
                        <span className="text-center leading-tight">{m.name}</span>
                    </button>
                );
            })}
        </div>
    );
}
