/**
 * IndexedDB service wrapper for offline data caching + offline mutation queue.
 * Provides CRUD operations for object stores:
 *   - Master data: products, categories, customers, payment_methods
 *   - Offline mutations: offline_mutations (queued CRUD/transactions)
 */

const DB_NAME = "simkasir-cache";
const DB_VERSION = 3;
const STORES = ["products", "categories", "customers", "payment_methods"];

/** Auto-upgrade: add offline_mutations store on version 2 */
function upgradeDB(db, oldVersion) {
    if (oldVersion < 2) {
        if (!db.objectStoreNames.contains("offline_mutations")) {
            const store = db.createObjectStore("offline_mutations", {
                keyPath: "id",
            });
            store.createIndex("status", "status", { unique: false });
            store.createIndex("created_at", "created_at", { unique: false });
        }
    }
    // Version 3 fix: recreate offline_mutations without autoIncrement
    if (oldVersion < 3) {
        if (db.objectStoreNames.contains("offline_mutations")) {
            db.deleteObjectStore("offline_mutations");
        }
        const store = db.createObjectStore("offline_mutations", {
            keyPath: "id",
        });
        store.createIndex("status", "status", { unique: false });
        store.createIndex("created_at", "created_at", { unique: false });
    }
}

/**
 * Open (or create/upgrade) the IndexedDB database.
 * @returns {Promise<IDBDatabase>}
 */
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            STORES.forEach((storeName) => {
                if (!db.objectStoreNames.contains(storeName)) {
                    db.createObjectStore(storeName, { keyPath: "id" });
                }
            });
            upgradeDB(db, event.oldVersion);
        };

        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

/**
 * Get all records from a store.
 * @param {string} storeName
 * @returns {Promise<Array>}
 */
export async function getAll(storeName) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, "readonly");
        const store = tx.objectStore(storeName);
        const request = store.getAll();
        request.onsuccess = () => {
            resolve(request.result);
            db.close();
        };
        request.onerror = () => {
            reject(request.error);
            db.close();
        };
    });
}

/**
 * Get a single record by ID.
 * @param {string} storeName
 * @param {number|string} id
 * @returns {Promise<Object|undefined>}
 */
export async function getById(storeName, id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, "readonly");
        const store = tx.objectStore(storeName);
        const request = store.get(id);
        request.onsuccess = () => {
            resolve(request.result);
            db.close();
        };
        request.onerror = () => {
            reject(request.error);
            db.close();
        };
    });
}

/**
 * Insert or update a single record.
 * @param {string} storeName
 * @param {Object} data
 * @returns {Promise<*>}
 */
export async function put(storeName, data) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, "readwrite");
        const store = tx.objectStore(storeName);
        const request = store.put(data);
        request.onsuccess = () => {
            resolve(request.result);
            db.close();
        };
        request.onerror = () => {
            reject(request.error);
            db.close();
        };
    });
}

/**
 * Bulk insert or update many records at once.
 * @param {string} storeName
 * @param {Array} items
 * @returns {Promise<void>}
 */
export async function bulkPut(storeName, items) {
    if (!items || items.length === 0) return;

    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, "readwrite");
        const store = tx.objectStore(storeName);
        items.forEach((item) => store.put(item));
        tx.oncomplete = () => {
            resolve();
            db.close();
        };
        tx.onerror = (event) => {
            reject(event.target.error);
            db.close();
        };
    });
}

/**
 * Delete a single record by ID.
 * @param {string} storeName
 * @param {number|string} id
 * @returns {Promise<void>}
 */
export async function deleteItem(storeName, id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, "readwrite");
        const store = tx.objectStore(storeName);
        const request = store.delete(id);
        request.onsuccess = () => {
            resolve();
            db.close();
        };
        request.onerror = () => {
            reject(request.error);
            db.close();
        };
    });
}

/**
 * Clear all records from a store.
 * @param {string} storeName
 * @returns {Promise<void>}
 */
export async function clearStore(storeName) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, "readwrite");
        const store = tx.objectStore(storeName);
        const request = store.clear();
        request.onsuccess = () => {
            resolve();
            db.close();
        };
        request.onerror = () => {
            reject(request.error);
            db.close();
        };
    });
}

/**
 * Get the number of records in a store.
 * @param {string} storeName
 * @returns {Promise<number>}
 */
export async function getStoreCount(storeName) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, "readonly");
        const store = tx.objectStore(storeName);
        const request = store.count();
        request.onsuccess = () => {
            resolve(request.result);
            db.close();
        };
        request.onerror = () => {
            reject(request.error);
            db.close();
        };
    });
}

/**
 * Get all records from a store filtered by an index value.
 * @param {string} storeName
 * @param {string} indexName
 * @param {*} value
 * @returns {Promise<Array>}
 */
export async function getAllByIndex(storeName, indexName, value) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, "readonly");
        const store = tx.objectStore(storeName);
        const index = store.index(indexName);
        const request = index.getAll(value);
        request.onsuccess = () => {
            resolve(request.result);
            db.close();
        };
        request.onerror = () => {
            reject(request.error);
            db.close();
        };
    });
}
