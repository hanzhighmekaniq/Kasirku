import Modal from "@/Components/Modal";
import { X } from "lucide-react";

/**
 * PosModal — cangkang modal seragam untuk seluruh modal POS.
 * Header (icon + judul + subjudul + tombol tutup), body, dan footer opsional.
 *
 * Props:
 *   show, onClose  — kontrol modal
 *   title          — judul (string)
 *   subtitle       — subjudul kecil (opsional)
 *   icon           — komponen icon lucide (opsional)
 *   maxWidth       — "sm" | "md" | "lg" | "xl" | "2xl" (default "md")
 *   footer         — konten footer (biasanya tombol aksi)
 *   bodyClass      — class tambahan untuk area body
 */
export default function PosModal({
    show,
    onClose,
    title,
    subtitle,
    icon: Icon,
    maxWidth = "md",
    children,
    footer,
    bodyClass = "",
}) {
    return (
        <Modal show={show} onClose={onClose} maxWidth={maxWidth}>
            <div className="flex items-start gap-3 border-b border-border px-5 py-4">
                {Icon && (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white">
                        <Icon size={19} strokeWidth={2} />
                    </div>
                )}
                <div className="min-w-0 flex-1">
                    <h2 className="text-[15px] font-bold tracking-tight text-foreground">
                        {title}
                    </h2>
                    {subtitle && (
                        <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
                    )}
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Tutup"
                    className="-mr-1.5 -mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground/60 transition hover:bg-muted hover:text-card-foreground"
                >
                    <X size={18} strokeWidth={2.2} />
                </button>
            </div>

            <div className={`px-5 py-4 ${bodyClass}`}>{children}</div>

            {footer && (
                <div className="flex items-center justify-end gap-2 border-t border-border bg-muted/50 px-5 py-3.5">
                    {footer}
                </div>
            )}
        </Modal>
    );
}
