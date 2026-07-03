/**
 * MutationQueue — offline mutation queue backed by IndexedDB.
 *
 * When the app is offline, mutations (sale transactions, etc.) are queued
 * and automatically replayed when connectivity is restored.
 *
 * Queue processing is **sequential** — each mutation is sent one at a time
 * in FIFO order. If one fails, the rest are blocked until the failure is
 * resolved (prevents out-of-order data).
 *
 * Stores:
 *   storeName: 'offline_mutations'
 *   keyPath:   'id' (UUID v4)
 *   indexes:   'status', 'created_at'
 */

import { getAllByIndex, put, getById, bulkPut } from "@/Services/db";

const STORE = "offline_mutations";
let processing = false;

/* ── helpers ─────────────────────────────────────────── */

function uuid() {
    // crypto.randomUUID() works in all modern browsers
    return crypto.randomUUID();
}

/* ── public API ───────────────────────────────────────── */

/**
 * Enqueue a new mutation to be replayed when back online.
 * @param {Object} mutation
 * @param {string} mutation.type      - 'sale' | 'purchase' | etc
 * @param {string} mutation.url       - Absolute URL (use route() in React)
 * @param {string} mutation.method    - 'POST' | 'PUT' | 'PATCH' | 'DELETE'
 * @param {Object} [mutation.headers] - Extra headers (Content-Type etc)
 * @param {Object} mutation.body      - Request body (plain object)
 * @param {Object} [mutation.meta]    - Optional metadata for optimistic UI
 * @returns {Promise<string>} mutation id
 */
export async function enqueue({
    type,
    url,
    method,
    headers = {},
    body,
    meta = {},
}) {
    const record = {
        id: uuid(),
        type,
        url,
        method: method.toUpperCase(),
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-Requested-With": "XMLHttpRequest",
            "X-Inertia": "false",
            ...headers,
        },
        body,
        meta,
        status: "pending",
        error: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };

    await put(STORE, record);
    console.log(`[MutationQueue] Enqueued ${type} (${record.id})`);
    return record.id;
}

/**
 * Get all queued mutations in FIFO order.
 * @returns {Promise<Array>}
 */
export async function getAll() {
    return getAllByIndex(STORE, "created_at", IDBKeyRange.lowerBound(0));
}

/**
 * Get all pending mutations sorted by created_at ascending.
 * @returns {Promise<Array>}
 */
export async function getPending() {
    return getAllByIndex(STORE, "status", "pending");
}

/**
 * Get all failed mutations (stock conflict, etc).
 * @returns {Promise<Array>}
 */
export async function getFailed() {
    return getAllByIndex(STORE, "status", "failed");
}

/**
 * Get queue summary counts in one query.
 * @returns {Promise<{ pending: number, failed: number }>}
 */
export async function getQueueCounts() {
    const all = await getAll();
    let pending = 0;
    let failed = 0;
    for (const m of all) {
        if (m.status === "pending") pending++;
        else if (m.status === "failed") failed++;
    }
    return { pending, failed };
}

/**
 * Update the status of a queued mutation.
 * @param {string} id
 * @param {string} status  - 'pending' | 'syncing' | 'completed' | 'failed'
 * @param {string|null} [error]
 */
export async function markStatus(id, status, error = null) {
    const record = await getById(STORE, id);
    if (!record) return;
    record.status = status;
    record.error = error;
    record.updated_at = new Date().toISOString();
    await put(STORE, record);
}

/**
 * Process the mutation queue sequentially (FIFO).
 * Fetches all pending mutations and replays each in order.
 * If any mutation fails, processing stops at the failure.
 *
 * @param {Object} [options]
 * @param {Function} [options.onProgress] - Callback after each mutation processed
 * @returns {Promise<{processed: number, failed: number, errors: Array}>}
 */
export async function processQueue({ onProgress } = {}) {
    if (processing)
        return {
            processed: 0,
            failed: 0,
            errors: [],
            reason: "already_processing",
        };
    if (!navigator.onLine)
        return { processed: 0, failed: 0, errors: [], reason: "offline" };

    processing = true;
    const pending = await getPending();
    let processed = 0;
    let failed = 0;
    const errors = [];

    for (const mutation of pending) {
        if (!navigator.onLine) {
            // Went offline mid-queue — stop
            break;
        }

        await markStatus(mutation.id, "syncing");

        try {
            // Ambil XSRF-TOKEN fresh dari cookie (biar gak kedaluwarsa)
            const xsrfCookie = document.cookie
                .split("; ")
                .find((row) => row.startsWith("XSRF-TOKEN="));
            const xsrfToken = xsrfCookie
                ? decodeURIComponent(xsrfCookie.split("=")[1])
                : null;

            const headers = { ...mutation.headers };
            // Timpa X-CSRF-TOKEN dengan token fresh dari cookie
            if (xsrfToken) {
                headers["X-XSRF-TOKEN"] = xsrfToken;
            }

            const response = await fetch(mutation.url, {
                method: mutation.method,
                headers,
                credentials: "include",
                body:
                    mutation.method !== "GET"
                        ? JSON.stringify(mutation.body)
                        : undefined,
            });

            if (!response.ok) {
                const errorBody = await response.text();
                let errorMsg;
                try {
                    const errJson = JSON.parse(errorBody);
                    errorMsg = errJson.message || errJson.error || errorBody;
                } catch {
                    errorMsg = errorBody || `HTTP ${response.status}`;
                }
                throw new Error(errorMsg);
            }

            await markStatus(mutation.id, "completed");
            processed++;

            if (onProgress) {
                onProgress({
                    id: mutation.id,
                    type: mutation.type,
                    status: "completed",
                });
            }
        } catch (err) {
            await markStatus(mutation.id, "failed", err.message);
            failed++;
            errors.push({
                id: mutation.id,
                type: mutation.type,
                error: err.message,
            });

            if (onProgress) {
                onProgress({
                    id: mutation.id,
                    type: mutation.type,
                    status: "failed",
                    error: err.message,
                });
            }

            // Stop on first failure to preserve ordering
            break;
        }
    }

    processing = false;
    return { processed, failed, errors };
}

/**
 * Get the count of pending mutations.
 * @returns {Promise<number>}
 */
export async function getPendingCount() {
    const pending = await getPending();
    return pending.length;
}

/**
 * Setup auto-replay: when the app comes online, process the queue.
 * Plus periodic retry setiap 30 detik selama masih ada antrian pending.
 * Call this once at app startup.
 * @returns {Function} Cleanup / unsubscribe function
 */
export function setupAutoReplay() {
    const handler = () => {
        if (navigator.onLine) {
            console.log("[MutationQueue] Online — processing queue...");
            processQueue();
        }
    };

    window.addEventListener("online", handler);

    // Also try processing on setup (in case we're already online with pending items)
    if (navigator.onLine) {
        processQueue();
    }

    // Periodic retry: coba proses ulang setiap 30 detik
    // Berguna saat server kembali online (client gak pernah offline)
    const interval = setInterval(async () => {
        if (!navigator.onLine) return;
        const pending = await getPending();
        if (pending.length > 0) {
            console.log(
                `[MutationQueue] Periodic retry — ${pending.length} pending`,
            );
            processQueue();
        }
    }, 30000);

    return () => {
        window.removeEventListener("online", handler);
        clearInterval(interval);
    };
}

/**
 * Get a specific mutation by id.
 * @param {string} id
 * @returns {Promise<Object|null>}
 */
export { getById as getMutation } from "@/Services/db";

/**
 * Clear all completed mutations (housekeeping).
 * @returns {Promise<number>} number of removed records
 */
export async function clearCompleted() {
    const all = await getAll();
    const completed = all.filter((m) => m.status === "completed");

    if (completed.length === 0) return 0;

    // We use bulkPut to delete: put each with _deleted flag,
    // but easier: import deleteItem
    const { deleteItem } = await import("@/Services/db");
    for (const m of completed) {
        await deleteItem(STORE, m.id);
    }
    return completed.length;
}

/**
 * Retry all failed mutations (reset to pending).
 * @returns {Promise<number>}
 */
export async function retryFailed() {
    const all = await getAllByIndex(STORE, "status", "failed");
    for (const m of all) {
        m.status = "pending";
        m.error = null;
        m.updated_at = new Date().toISOString();
        await put(STORE, m);
    }
    return all.length;
}
