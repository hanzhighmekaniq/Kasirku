import { useEffect } from "react";

/**
 * Toast error API — menggantikan alert() browser untuk error dari
 * axios/API call yang gagal (split bill, PG, finalize, dll). Auto-dismiss
 * setelah beberapa detik, atau bisa ditutup manual.
 */
export default function ApiErrorToast({ message, onClose, autoDismissMs = 6000 }) {
    useEffect(() => {
        if (!message) return;
        const t = setTimeout(onClose, autoDismissMs);
        return () => clearTimeout(t);
    }, [message, onClose, autoDismissMs]);

    if (!message) return null;

    return (
        <div className="fixed inset-x-0 top-4 z-[60] flex justify-center px-4">
            <div className="flex w-full max-w-md items-start gap-3 rounded-xl border border-destructive/20 bg-card px-4 py-3 shadow-2xl">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                    <svg className="h-3.5 w-3.5 text-destructive" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </div>
                <p className="flex-1 text-sm text-foreground">{message}</p>
                <button onClick={onClose} className="shrink-0 text-muted-foreground/60 hover:text-foreground">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
