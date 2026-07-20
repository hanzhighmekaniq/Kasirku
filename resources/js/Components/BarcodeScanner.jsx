import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/library";

/**
 * BarcodeScanner - Kamera tetap aktif setelah scan
 * - Scan berhasil → beep + notif → kamera tetap ON
 * - Close manual via tombol
 */
export default function BarcodeScanner({ onScan, onClose, isOpen = false }) {
    const videoRef = useRef(null);
    const [error, setError] = useState(null);
    const [lastScan, setLastScan] = useState(null); // notif hasil scan
    const codeReader = useRef(null);
    const streamRef = useRef(null);
    const cooldownRef = useRef(false); // cegah scan double

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
            try {
                codeReader.current.reset();
            } catch (e) {}
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
                (result, err) => {
                    if (result && !cooldownRef.current) {
                        // Cooldown 1.5 detik — cegah scan barcode yang sama berkali-kali
                        cooldownRef.current = true;
                        setTimeout(() => {
                            cooldownRef.current = false;
                        }, 1500);

                        const barcode = result.getText();
                        setLastScan(barcode);

                        // Hapus notif setelah 2 detik
                        setTimeout(() => setLastScan(null), 2000);

                        // Callback ke Kasir.jsx — kamera TIDAK dimatikan
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
                setError(
                    "Izin kamera ditolak. Izinkan akses kamera di browser.",
                );
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
        <div
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
            onClick={(e) => {
                if (e.target === e.currentTarget) handleClose();
            }}
        >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
                {/* Header */}
                <div className="flex justify-between items-center px-4 py-3 border-b">
                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                            </span>
                            Scan Barcode
                        </span>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg p-1.5 transition"
                        title="Tutup Scanner"
                    >
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                {/* Camera */}
                <div className="p-3">
                    <div className="relative bg-black rounded-xl overflow-hidden aspect-video">
                        {error ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50 text-red-600 p-4">
                                <p className="text-sm text-center">{error}</p>
                                <button
                                    onClick={startScanning}
                                    className="mt-3 px-4 py-2 bg-primary-600 text-white text-sm rounded-lg"
                                >
                                    Coba Lagi
                                </button>
                            </div>
                        ) : (
                            <>
                                <video
                                    ref={videoRef}
                                    className="w-full h-full object-cover"
                                    playsInline
                                    muted
                                    autoPlay
                                />
                                {/* Kotak scan */}
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div
                                        className="border-2 border-green-400 rounded-xl"
                                        style={{ width: "75%", height: "45%" }}
                                    >
                                        {/* Sudut-sudut animasi */}
                                        <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-green-400 rounded-tl-lg -translate-x-0.5 -translate-y-0.5" />
                                        <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-green-400 rounded-tr-lg translate-x-0.5 -translate-y-0.5" />
                                        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-green-400 rounded-bl-lg -translate-x-0.5 translate-y-0.5" />
                                        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-green-400 rounded-br-lg translate-x-0.5 translate-y-0.5" />
                                    </div>
                                </div>

                                {/* Notif sukses scan */}
                                {lastScan && (
                                    <div className="absolute top-3 left-3 right-3 flex items-center justify-center">
                                        <div className="flex items-center gap-2 bg-green-500 text-white text-sm font-medium px-4 py-2 rounded-full shadow-lg animate-bounce">
                                            <svg
                                                className="w-4 h-4 shrink-0"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2.5}
                                                    d="M5 13l4 4L19 7"
                                                />
                                            </svg>
                                            Produk ditambahkan!
                                        </div>
                                    </div>
                                )}

                                {/* Info bawah */}
                                <div className="absolute bottom-3 left-3 right-3 text-center">
                                    <span className="inline-block bg-black bg-opacity-50 text-white text-xs px-3 py-1 rounded-full">
                                        {lastScan
                                            ? `✓ ${lastScan}`
                                            : "Arahkan barcode ke kotak hijau"}
                                    </span>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-4 pb-4 flex items-center justify-between">
                    <p className="text-xs text-slate-400">
                        Kamera tetap aktif — scan berkali-kali
                    </p>
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition text-sm font-medium"
                    >
                        Selesai Scan
                    </button>
                </div>
            </div>
        </div>
    );
}
