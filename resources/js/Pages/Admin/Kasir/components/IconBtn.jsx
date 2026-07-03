/* ── tiny UI primitives ─────────────────────────────── */
export default function IconBtn({ onClick, title, children, red, amber }) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={title}
            className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition ${
                red
                    ? "text-slate-400 hover:bg-red-50 hover:text-red-600"
                    : amber
                      ? "text-slate-400 hover:bg-amber-50 hover:text-amber-600"
                      : "text-slate-400 hover:bg-indigo-50 hover:text-indigo-600"
            }`}
        >
            {children}
        </button>
    );
}
