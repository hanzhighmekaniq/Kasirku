import { useEffect, useRef, useState, useCallback } from "react";
import {
    BrowserMultiFormatReader,
    NotFoundException,
    DecodeHintType,
    BarcodeFormat,
} from "@zxing/library";
import { X, ScanLine, CheckCircle2, SwitchCamera } from "lucide-react";

const SCAN_HINTS = (() => {
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.CODE_128,
        BarcodeFormat.CODE_39,
        BarcodeFormat.QR_CODE,
        BarcodeFormat.UPC_A,
        BarcodeFormat.UPC_E,
        BarcodeFormat.ITF,
    ]);
    return hints;
})();

export default function BarcodeScanner({ onScan, onClose, isOpen = false }) {
    const videoRef = useRef(null);
    const [error, setError] = useState(null);
    const [lastScan, setLastScan] = useState(null);
    const [facingMode, setFacingMode] = useState("environment");
    const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
    const codeReader = useRef(null);
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

    useEffect(() => {
        if (!isOpen) return;
        stopAll();
        startScanning();
    }, [facingMode]);

    const stopAll = () => {
        if (codeReader.current) {
            try {
                codeReader.current.reset();
            } catch {}
            codeReader.current = null;
        }
    };

    const checkMultipleCameras = async () => {
        try {
            const tempReader = new BrowserMultiFormatReader();
            const devices = await tempReader.listVideoInputDevices();
            setHasMultipleCameras(devices.length > 1);
            tempReader.reset();
        } catch {
            setHasMultipleCameras(false);
        }
    };

    const startScanning = async () => {
        try {
            setError(null);
            stopAll();

            codeReader.current = new BrowserMultiFormatReader(SCAN_HINTS);

            const constraints = {
                video: {
                    facingMode,
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                },
            };

            await codeReader.current.decodeFromConstraints(
                constraints,
                videoRef.current,
                (result, err) => {
                    if (result && !cooldownRef.current) {
                        cooldownRef.current = true;
                        setTimeout(() => {
                            cooldownRef.current = false;
                        }, 1500);

                        const barcode = result.getText();
                        setLastScan(barcode);
                        setTimeout(() => setLastScan(null), 2500);

                        if (onScan) onScan(barcode);
                    }

                    if (err && !(err instanceof NotFoundException)) {
                        console.error("Scan error:", err);
                    }
                },
            );

            checkMultipleCameras();
        } catch (err) {
            console.error("Scanner error:", err);
            handleCameraError(err);
        }
    };

    const handleCameraError = (err) => {
        if (err.name === "NotAllowedError") {
            setError(
                "Izin kamera ditolak. Izinkan akses kamera di pengaturan browser.",
            );
        } else if (err.name === "NotFoundError") {
            setError("Tidak ada kamera ditemukan di perangkat ini.");
        } else if (err.name === "OverconstrainedError") {
            setError(
                "Kamera tidak mendukung konfigurasi yang diminta. Coba ganti kamera.",
            );
        } else {
            setError("Gagal mengakses kamera: " + err.message);
        }
    };

    const switchCamera = useCallback(() => {
        setFacingMode((prev) =>
            prev === "environment" ? "user" : "environment",
        );
    }, []);

    const handleClose = () => {
        stopAll();
        setLastScan(null);
        if (onClose) onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] bg-black">
            <video
                ref={videoRef}
                className="absolute inset-0 h-full w-full object-cover"
                playsInline
                muted
                autoPlay
            />

            <div className="absolute inset-0 pointer-events-none">
                <div className="pointer-events-auto absolute top-0 left-0 right-0 z-10 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent px-5 py-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleClose}
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm text-white transition hover:bg-white/20"
                        >
                            <X size={20} />
                        </button>
                        <div>
                            <h3 className="text-[15px] font-semibold text-white">
                                Scan Barcode
                            </h3>
                            <p className="text-[11px] text-white/60">
                                Arahkan barcode ke area scan
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {hasMultipleCameras && (
                            <button
                                onClick={switchCamera}
                                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm text-white transition hover:bg-white/20"
                                title={
                                    facingMode === "environment"
                                        ? "Ganti ke kamera depan"
                                        : "Ganti ke kamera belakang"
                                }
                            >
                                <SwitchCamera size={20} />
                            </button>
                        )}
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                        </span>
                        <span className="text-[11px] text-white/70 font-medium">
                            Aktif
                        </span>
                    </div>
                </div>

                <div className="absolute inset-0 flex items-center justify-center">
                    <div
                        className="absolute top-0 left-0 right-0 bg-black/60"
                        style={{ height: "calc(50% - 18%)" }}
                    />
                    <div
                        className="absolute bottom-0 left-0 right-0 bg-black/60"
                        style={{ height: "calc(50% - 18%)" }}
                    />
                    <div
                        className="absolute bg-black/60"
                        style={{
                            top: "calc(50% - 18%)",
                            bottom: "calc(50% - 18%)",
                            left: 0,
                            right: "calc(50% + 35%)",
                        }}
                    />
                    <div
                        className="absolute bg-black/60"
                        style={{
                            top: "calc(50% - 18%)",
                            bottom: "calc(50% - 18%)",
                            left: "calc(50% + 35%)",
                            right: 0,
                        }}
                    />
                </div>

                <div
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                    style={{ width: "70%", height: "36%" }}
                >
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-[3px] border-l-[3px] border-white" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-[3px] border-r-[3px] border-white" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-[3px] border-l-[3px] border-white" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-[3px] border-r-[3px] border-white" />

                    <div className="absolute inset-x-0 top-0 overflow-hidden">
                        <div className="scan-line-anim h-[2px] w-full bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />
                    </div>

                    <div className="absolute left-2 right-2 top-1/2 -translate-y-1/2 h-px bg-white/10" />
                </div>
            </div>

            {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-20 p-6">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 mb-4">
                        <X size={32} className="text-red-400" />
                    </div>
                    <p className="text-sm text-center text-white/80 max-w-xs">
                        {error}
                    </p>
                    <button
                        onClick={startScanning}
                        className="mt-5 px-6 py-3 bg-white text-black text-sm font-semibold rounded-xl"
                    >
                        Coba Lagi
                    </button>
                    {hasMultipleCameras && (
                        <button
                            onClick={switchCamera}
                            className="mt-3 px-6 py-2.5 text-sm text-white/70 hover:text-white transition flex items-center gap-2"
                        >
                            <SwitchCamera size={16} />
                            Ganti Kamera
                        </button>
                    )}
                    <button
                        onClick={handleClose}
                        className="mt-3 px-6 py-2 text-sm text-white/50 hover:text-white/80 transition"
                    >
                        Tutup
                    </button>
                </div>
            )}

            <div className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none">
                <div className="flex flex-col items-center pb-8">
                    {lastScan && (
                        <div className="flex items-center gap-2.5 bg-emerald-500/90 backdrop-blur-sm text-white px-5 py-3 rounded-2xl shadow-lg shadow-emerald-500/20 mb-4 animate-bounce">
                            <CheckCircle2 size={18} />
                            <span className="text-sm font-semibold">
                                {lastScan}
                            </span>
                            <span className="text-sm text-white/80">
                                ditambahkan
                            </span>
                        </div>
                    )}

                    <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm text-white/60 px-4 py-2 rounded-full">
                        <ScanLine size={14} />
                        <span className="text-[12px]">
                            {lastScan
                                ? "Scan barcode berikutnya..."
                                : "Arahkan barcode ke area scan"}
                        </span>
                    </div>
                </div>
            </div>

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
