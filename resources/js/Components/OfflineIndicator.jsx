import { useState, useEffect } from "react";

export default function OfflineIndicator() {
    const [offline, setOffline] = useState(
        typeof navigator !== "undefined" ? !navigator.onLine : false
    );

    useEffect(() => {
        const goOnline = () => setOffline(false);
        const goOffline = () => setOffline(true);

        window.addEventListener("online", goOnline);
        window.addEventListener("offline", goOffline);

        return () => {
            window.removeEventListener("online", goOnline);
            window.removeEventListener("offline", goOffline);
        };
    }, []);

    if (!offline) return null;

    return (
        <div className="sticky top-0 z-50 w-full bg-amber-50 border-b border-amber-200 px-4 py-2.5">
            <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 text-sm font-medium text-amber-800">
                {/* Wifi-off icon */}
                <svg
                    className="h-4 w-4 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M18.364 5.636a9 9 0 0 1 0 12.728m-2.829-2.829a5 5 0 0 0 0-7.07m-4.243 4.243a1 1 0 0 1 0-1.414"
                    />
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 3l18 18"
                    />
                </svg>
                <span>
                    Kamu sedang offline &mdash; data yang tersimpan akan
                    disinkronkan saat koneksi kembali
                </span>
            </div>
        </div>
    );
}
