import Button from "@/Components/ui/Button";
import { Download } from "lucide-react";

export default function ExportButton({ routeName, from, to, branchIds, className = "" }) {
    const handleExport = () => {
        const params = new URLSearchParams();
        if (from) params.append("start_date", from);
        if (to) params.append("end_date", to);
        if (branchIds?.length) {
            branchIds.forEach((id) => params.append("branch_ids[]", id));
        }
        window.location.href = route(routeName) + "?" + params.toString();
    };

    return (
        <Button variant="outline" size="sm" onClick={handleExport} className={className}>
            <Download className="mr-2 h-4 w-4" /> Export Excel
        </Button>
    );
}
