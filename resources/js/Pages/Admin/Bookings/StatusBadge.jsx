/* Dipakai bersama oleh Index dan Show — satu sumber label & warna status. */
export const STATUS_LABELS = {
    pending: "Pending",
    confirmed: "Confirmed",
    checked_in: "Checked In",
    completed: "Completed",
    cancelled: "Cancelled",
    no_show: "No Show",
};

const STATUS_STYLES = {
    pending: "bg-warning/10 text-warning",
    confirmed: "bg-info/10 text-info",
    checked_in: "bg-success/10 text-success",
    completed: "bg-muted text-muted-foreground",
    cancelled: "bg-destructive/10 text-destructive",
    no_show:
        "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
};

export default function StatusBadge({ status, large = false }) {
    return (
        <span
            className={`inline-flex items-center rounded-full font-medium ${
                large ? "px-4 py-1.5 text-sm" : "px-2.5 py-0.5 text-xs"
            } ${STATUS_STYLES[status] || "bg-muted text-muted-foreground"}`}
        >
            {STATUS_LABELS[status] || status}
        </span>
    );
}
