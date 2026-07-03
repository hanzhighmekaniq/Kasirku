/**
 * SyncService — fetches master data from the API and caches it into IndexedDB.
 * Used for offline support: data is available even when the network is down.
 */

import { bulkPut } from "@/Services/db";
import { router } from "@inertiajs/react";

let syncing = false;
let lastSyncAt = null;

const STORE_MAP = {
    products: "products",
    categories: "categories",
    customers: "customers",
    payment_methods: "payment_methods",
};

/**
 * Sync all master data from the server into IndexedDB.
 * Skips if a sync is already in progress.
 * @returns {Promise<{success: boolean, syncedAt: string|null}>}
 */
export async function syncAll() {
    if (syncing) {
        // If a sync is already running, return the current state
        return {
            success: false,
            reason: "sync_in_progress",
            syncedAt: lastSyncAt,
        };
    }

    syncing = true;

    try {
        const response = await fetch("/app/master-data", {
            headers: {
                Accept: "application/json",
                "X-Requested-With": "XMLHttpRequest",
                "X-Inertia": "false",
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        // Write each data set to its IndexedDB store
        const writes = Object.entries(STORE_MAP).map(([apiKey, storeName]) => {
            const items = data[apiKey];
            return bulkPut(storeName, items);
        });

        // Also save modifier_groups — we'll store them in a separate key for now
        if (data.modifier_groups) {
            // Store modifier groups in localStorage since they're small and often needed
            try {
                localStorage.setItem(
                    "simkasir_modifier_groups",
                    JSON.stringify(data.modifier_groups),
                );
            } catch (e) {
                // localStorage full or unavailable — ignore
            }
        }

        await Promise.all(writes);

        lastSyncAt = data.synced_at || new Date().toISOString();
        try {
            localStorage.setItem("simkasir_last_sync", lastSyncAt);
        } catch (e) {
            // ignore
        }

        syncing = false;
        return { success: true, syncedAt: lastSyncAt };
    } catch (error) {
        syncing = false;
        console.warn("[SyncService] Sync failed:", error.message);
        return { success: false, reason: error.message, syncedAt: lastSyncAt };
    }
}

/**
 * Get the last sync timestamp.
 * @returns {string|null}
 */
export function getLastSync() {
    return lastSyncAt || localStorage.getItem("simkasir_last_sync") || null;
}

/**
 * Returns whether a sync is currently in progress.
 * @returns {boolean}
 */
export function isSyncing() {
    return syncing;
}
