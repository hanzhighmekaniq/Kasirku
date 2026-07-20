import { CheckCircle, X } from 'lucide-react';

/**
 * Toast kecil yang muncul otomatis saat tema berhasil/gagal disimpan.
 * Dirender di dalam ThemeProvider, tampil di pojok kanan bawah layar.
 *
 * @param {{ status: 'idle'|'saving'|'saved'|'error', onDismiss: () => void }} props
 */
export default function ThemeSaveToast({ status, onDismiss }) {
    if (status === 'idle') return null;

    const isSaved = status === 'saved';
    const isError = status === 'error';
    const isSaving = status === 'saving';

    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex items-center gap-2.5 rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-card))] px-4 py-3 shadow-xl transition-all duration-300">
            {isSaving && (
                <svg className="h-4 w-4 animate-spin text-primary-500" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
            )}
            {isSaved && (
                <CheckCircle size={16} className="text-emerald-500" strokeWidth={2.5} />
            )}
            {isError && (
                <X size={16} className="text-red-500" strokeWidth={2.5} />
            )}
            <span className="text-sm font-medium text-[rgb(var(--color-text-primary))]">
                {isSaving && 'Menyimpan...'}
                {isSaved && 'Tersimpan ✓'}
                {isError && 'Gagal simpan'}
            </span>
            {isError && (
                <button
                    type="button"
                    onClick={onDismiss}
                    className="ml-1 rounded p-0.5 text-[rgb(var(--color-text-muted))] hover:bg-[rgb(var(--color-surface-secondary))]"
                >
                    <X size={12} />
                </button>
            )}
        </div>
    );
}
