/* ── tiny UI primitives ─────────────────────────────── */
export default function IconBtn({ onClick, title, children, red, amber }) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={title}
            className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition ${
                red
                    ? "text-muted-foreground/60 hover:bg-destructive/10 hover:text-destructive"
                    : amber
                      ? "text-muted-foreground/60 hover:bg-warning/10 hover:text-warning"
                      : "text-muted-foreground/60 hover:bg-primary/10 hover:text-primary"
            }`}
        >
            {children}
        </button>
    );
}
