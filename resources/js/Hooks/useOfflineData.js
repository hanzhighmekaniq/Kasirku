/**
 * useOfflineData — React hook that transparently fetches master data from the server,
 * falling back to IndexedDB when offline or when the request fails.
 *
 * Usage:
 *   const { data, loading, error, isOffline } = useOfflineData('products');
 *
 *   if (loading) return <Spinner />;
 *   if (error) return <Error message={error} />;
 *   return <List items={data} />;
 */

import { useState, useEffect, useRef } from "react";
import { getAll } from "@/Services/db";
import { getLastSync } from "@/Services/sync";

/**
 * @param {string} storeName — IndexedDB store name (products, categories, customers, payment_methods)
 * @param {object} [options]
 * @param {boolean} [options.skipServer=false] — Skip server fetch and use cache immediately
 * @param {number} [options.staleMs=30000] — Time in ms before re-fetching from server (default 30s)
 * @returns {{ data: Array, loading: boolean, error: string|null, isOffline: boolean, lastSync: string|null }}
 */
export default function useOfflineData(storeName, options = {}) {
    const { skipServer = false, staleMs = 30000 } = options;

    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isOffline, setIsOffline] = useState(!navigator.onLine);
    const [lastSync, setLastSync] = useState(getLastSync());

    const lastFetchRef = useRef(0);
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;

        async function load() {
            setLoading(true);
            setError(null);

            const now = Date.now();

            // Try server first (unless offline or skipServer)
            if (
                !skipServer &&
                navigator.onLine &&
                now - lastFetchRef.current > staleMs
            ) {
                try {
                    const apiStore =
                        storeName === "payment_methods"
                            ? "payment_methods"
                            : storeName;
                    const response = await fetch(`/app/master-data`, {
                        headers: {
                            Accept: "application/json",
                            "X-Requested-With": "XMLHttpRequest",
                            "X-Inertia": "false",
                        },
                    });

                    if (response.ok) {
                        const body = await response.json();
                        lastFetchRef.current = now;

                        if (mountedRef.current) {
                            const items = body[apiStore] || [];
                            setData(items);
                            setIsOffline(false);
                            setLastSync(
                                body.synced_at || new Date().toISOString(),
                            );
                            setLoading(false);
                            return; // success — exit early
                        }
                    }
                } catch (e) {
                    // Network error — fall through to IndexedDB fallback
                    console.warn(
                        `[useOfflineData] Server fetch failed for ${storeName}, falling back to cache:`,
                        e.message,
                    );
                }
            }

            // Fallback: read from IndexedDB
            try {
                const cached = await getAll(storeName);
                if (mountedRef.current) {
                    setData(cached || []);
                    setIsOffline(true);
                    setLoading(false);
                }
            } catch (dbError) {
                if (mountedRef.current) {
                    setError(
                        `Gagal memuat data ${storeName} — ${dbError.message}`,
                    );
                    setLoading(false);
                }
            }
        }

        load();

        return () => {
            mountedRef.current = false;
        };
    }, [storeName, skipServer, staleMs]);

    // Listen to online/offline events to auto-retry when connectivity returns
    useEffect(() => {
        function handleOnline() {
            setIsOffline(false);
            // Trigger a re-fetch by bumping the ref
            lastFetchRef.current = 0;
        }

        function handleOffline() {
            setIsOffline(true);
        }

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    return { data, loading, error, isOffline, lastSync };
}
