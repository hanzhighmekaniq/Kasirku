import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Panel mengambang yang menempel pada elemen pemicu.
 *
 * Dirender lewat portal ke <body>, bukan sebagai anak dari pemicunya. Ini yang
 * membedakannya dari `absolute` biasa: panel tidak pernah ikut terpotong oleh
 * `overflow-hidden` milik container induk.
 *
 * Kasus nyatanya: dropdown filter di dalam card tabel. Card memakai
 * `overflow-hidden` supaya sudut tabel ikut membulat, tapi efek sampingnya
 * daftar dropdown ikut terpotong mengikuti tinggi card — paling kentara saat
 * datanya sedikit, karena card jadi pendek dan daftar nyaris tak terlihat.
 *
 * Panel juga otomatis membalik ke atas kalau ruang di bawah tidak cukup, dan
 * menutup sendiri saat diklik di luar (pengecekannya mencakup panel, supaya
 * klik pada isinya tidak dianggap "klik di luar").
 */
export default function AnchoredPanel({
    anchorRef,
    open,
    onClose,
    matchAnchorWidth = false,
    width,
    className = "",
    children,
}) {
    const panelRef = useRef(null);
    const [style, setStyle] = useState(null);

    const compute = useCallback(() => {
        const anchor = anchorRef.current;
        if (!anchor) return;

        const rect = anchor.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom - 8;
        // Balik ke atas hanya kalau ruang bawah sempit DAN ruang atas lebih lega.
        const dropUp = spaceBelow < 240 && rect.top > spaceBelow;
        const panelWidth = matchAnchorWidth ? rect.width : width;

        setStyle({
            position: "fixed",
            left: rect.left,
            zIndex: 9999,
            ...(panelWidth ? { width: panelWidth } : {}),
            ...(dropUp
                ? { bottom: window.innerHeight - rect.top + 4 }
                : { top: rect.bottom + 4 }),
        });
    }, [anchorRef, matchAnchorWidth, width]);

    // useLayoutEffect supaya posisi sudah benar pada paint pertama — tanpa ini
    // panel sempat berkedip di pojok kiri atas sebelum dipindahkan.
    useLayoutEffect(() => {
        if (open) compute();
    }, [open, compute]);

    useEffect(() => {
        if (!open) return;

        const reposition = () => compute();
        // capture: true — scroll bisa datang dari container mana pun, bukan
        // cuma window (mis. tabel yang bisa di-scroll horizontal).
        window.addEventListener("scroll", reposition, true);
        window.addEventListener("resize", reposition);

        const handleOutside = (e) => {
            if (
                !anchorRef.current?.contains(e.target) &&
                !panelRef.current?.contains(e.target)
            ) {
                onClose?.();
            }
        };
        document.addEventListener("mousedown", handleOutside);

        return () => {
            window.removeEventListener("scroll", reposition, true);
            window.removeEventListener("resize", reposition);
            document.removeEventListener("mousedown", handleOutside);
        };
    }, [open, compute, anchorRef, onClose]);

    if (!open || !style) return null;

    return createPortal(
        <div ref={panelRef} style={style} className={className}>
            {children}
        </div>,
        document.body,
    );
}
