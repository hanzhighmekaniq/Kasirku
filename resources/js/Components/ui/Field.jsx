/**
 * Reusable form field wrapper.
 * Shows label, required indicator (*), and error message.
 */
export default function Field({ label, required, error, children }) {
    return (
        <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
                {label} {required && <span className="text-destructive">*</span>}
            </label>
            {children}
            {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
        </div>
    );
}
