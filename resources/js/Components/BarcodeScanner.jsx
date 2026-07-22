import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/library";
import { X, ScanLine, CheckCircle2 } from "lucide-react";

/**
 * BarcodeScanner — full-screen modern barcode scanner.
 * Camera fills entire screen with a rectangular scan area in the center.
 * Corner brackets + animated scan line for visual guidance.
 */
export default function BarcodeScanner({ onScan, onClose, isOpen = false }) {
    const videoRef = useRef(null);
    const [error, setError] = useState(null);
    const [lastScan, setLastScan] = useState(null);
    const codeReader = useRef(null);
    const streamRef = useRef(null);
    const cooldownRef = useRef(false);

    useEffect(() => {
        if (!isOpen) {
            stopAll();
            setError(null);
            setLastScan(null);
            return;
        }
        startScanning();
        return () => stopAll();
    }, [isOpen]);

    const stopAll = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
        if (codeReader.current) {
            try { codeReader.current.reset(); } catch {}
            codeReader.current = null;
        }
        if (videoRef.current) videoRef.current.srcObject = null;
    };

    const startScanning = async () => {
        try {
            setError(null);
            stopAll();
            codeReader.current = new BrowserMultiFormatReader();

            await codeReader.current.decodeFromVideoDevice(
                null,
                videoRef.current,
                (result) => {
                    if (result && !cooldownRef.current) {
                        cooldownRef.current = true;
                        setTimeout(() => { cooldownRef.current = false; }, 1500);

                        const barcode = result.getText();
                        setLastScan(barcode);
                        setTimeout(() => setLastScan(null), 2500);

                        if (onScan) onScan(barcode);
                    }
                },
            );

            if (videoRef.current?.srcObject) {
                streamRef.current = videoRef.current.srcObject;
            }
        } catch (err) {
            console.error("Scanner error:", err);
            if (err.name === "NotAllowedError") {
                setError("Izin kamera ditolak. Izinkan akses kamera di browser.");
            } else {
                setError("Gagal mengakses kamera: " + err.message);
            }
        }
    };

    const handleClose = () => {
        stopAll();
        setLastScan(null);
        if (onClose) onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] bg-black">
            {/* Camera video — full screen */}
            <video
                ref={videoRef}
                className="absolute inset-0 h-full w-full object-cover"
                playsInline
                muted
                autoPlay
            />

            {/* Dark overlay with scan window cutout */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Top bar */}
                <div className="pointer-events-auto absolute top-0 left-0 right-0 z-10 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent px-5 py-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleClose}
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm text-white transition hover:bg-white/20"
                        >
                            <X size={20} />
                        </button>
                        <div>
                            <h3 className="text-[15px] font-semibold text-white">Scan Barcode</h3>
                            <p className="text-[11px] text-white/60">Arahkan barcode ke area scan</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                        </span>
                        <span className="text-[11px] text-white/70 font-medium">Aktif</span>
                    </div>
                </div>

                {/* Semi-transparent overlay — 4 panels around scan area */}
                {/* Scan area: centered, ~70% width, ~35% height */}
                <div className="absolute inset-0 flex items-center justify-center">
                    {/* Top dark panel */}
                    <div className="absolute top-0 left-0 right-0 bg-black/60" style={{ height: "calc(50% - 18%)" }} />
                    {/* Bottom dark panel */}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60" style={{ height: "calc(50% - 18%)" }} />
                    {/* Left dark panel */}
                    <div className="absolute bg-black/60" style={{ top: "calc(50% - 18%)", bottom: "calc(50% - 18%)", left: 0, right: "calc(50% + 35%)" }} />
                    {/* Right dark panel */}
                    <div className="absolute bg-black/60" style={{ top: "calc(50% - 18%)", bottom: "calc(50% - 18%)", left: "calc(50% + 35%)", right: 0 }} />
                </div>

                {/* Scan area frame */}
                <div
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                    style={{ width: "70%", height: "36%" }}
                >
                    {/* Corner brackets — thin, clean, no rounded */}
                    {/* Top-left */}
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-[3px] border-l-[3px] border-white" />
                    {/* Top-right */}
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-[3px] border-r-[3px] border-white" />
                    {/* Bottom-left */}
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-[3px] border-l-[3px] border-white" />
                    {/* Bottom-right */}
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-[3px] border-r-[3px] border-white" />

                    {/* Animated scan line */}
                    <div className="absolute inset-x-0 top-0 overflow-hidden">
                        <div className="scan-line-anim h-[2px] w-full bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />
                    </div>

                    {/* Side guides — subtle horizontal lines */}
                    <div className="absolute left-2 right-2 top-1/2 -translate-y-1/2 h-px bg-white/10" />
                </div>
            </div>

            {/* Error state */}
            {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-20 p-6">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 mb-4">
                        <X size={32} className="text-red-400" />
                    </div>
                    <p className="text-sm text-center text-white/80 max-w-xs">{error}</p>
                    <button
                        onClick={startScanning}
                        className="mt-5 px-6 py-3 bg-white text-black text-sm font-semibold rounded-xl"
                    >
                        Coba Lagi
                    </button>
                    <button
                        onClick={handleClose}
                        className="mt-3 px-6 py-2 text-sm text-white/50 hover:text-white/80 transition"
                    >
                        Tutup
                    </button>
                </div>
            )}

            {/* Bottom toast — last scan result */}
            <div className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none">
                <div className="flex flex-col items-center pb-8">
                    {/* Success toast */}
                    {lastScan && (
                        <div className="flex items-center gap-2.5 bg-emerald-500/90 backdrop-blur-sm text-white px-5 py-3 rounded-2xl shadow-lg shadow-emerald-500/20 mb-4 animate-bounce">
                            <CheckCircle2 size={18} />
                            <span className="text-sm font-semibold">{lastScan}</span>
                            <span className="text-sm text-white/80">ditambahkan</span>
                        </div>
                    )}

                    {/* Hint text */}
                    <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm text-white/60 px-4 py-2 rounded-full">
                        <ScanLine size={14} />
                        <span className="text-[12px]">
                            {lastScan ? "Scan barcode berikutnya..." : "Arahkan barcode ke area scan"}
                        </span>
                    </div>
                </div>
            </div>

            {/* Scan line animation CSS */}
            <style>{`
                .scan-line-anim {
                    animation: scanMove 2s ease-in-out infinite;
                }
                @keyframes scanMove {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(calc(36vh - 2px)); }
                }
            `}</style>
        </div>
    );
}
