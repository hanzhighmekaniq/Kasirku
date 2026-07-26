import { useState, useEffect } from "react";
import { getLastSync, isSyncing } from "@/Services/sync";

/**
 * useSyncStatus — hook reaktif untuk status sinkronisasi data master.
 *
 * Menggabungkan:
 * - navigator.onLine + event listener (online/offline)
 * - getLastSync() dari sync.js (polling setiap 30 detik)
 * - isSyncing() dari sync.js
 *
 * Returns:
 *   isOnline   — boolean, apakah browser terhubung ke internet
 *   isSyncing  — boolean, apakah sync sedang berjalan
 *   lastSync   — string | null, ISO timestamp sync terakhir
 *   lastSyncLabel — string, label relatif seperti "2 menit lalu" / "Baru saja"
 */
export default function useSyncStatus() {
    const [isOnline, setIsOnline]     = useState(() => navigator.onLine);
    const [syncing, setSyncing]       = useState(() => isSyncing());
    const [lastSync, setLastSync]     = useState(() => getLastSync());
    const [now, setNow]               = useState(() => new Date());

    // Online/offline listener
    useEffect(() => {
        const handleOnline  = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener("online",  handleOnline);
        window.addEventListener("offline", handleOffline);
        return () => {
            window.removeEventListener("online",  handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    // Poll getLastSync + isSyncing setiap 30 detik
    useEffect(() => {
        const tick = () => {
            setLastSync(getLastSync());
            setSyncing(isSyncing());
            setNow(new Date());
        };
        tick(); // run immediately
        const id = setInterval(tick, 30_000);
        return () => clearInterval(id);
    }, []);

    // Format relatif "X menit lalu"
    const lastSyncLabel = (() => {
        if (!lastSync) return "Belum pernah sync";
        const diffMs  = now - new Date(lastSync);
        const diffMin = Math.floor(diffMs / 60_000);
        if (diffMin < 1)  return "Baru saja";
        if (diffMin < 60) return `${diffMin} menit lalu`;
        const diffH = Math.floor(diffMin / 60);
        if (diffH < 24)   return `${diffH} jam lalu`;
        return `${Math.floor(diffH / 24)} hari lalu`;
    })();

    return { isOnline, isSyncing: syncing, lastSync, lastSyncLabel };
}
