import { usePage } from "@inertiajs/react";
import { useState, useCallback, useEffect } from "react";

const STORAGE_PREFIX = "sidebar-order-";
const CHANGE_EVENT = "sidebar-order-changed";

/**
 * Hook untuk menyimpan dan mengelola custom ordering sidebar per user.
 * Disimpan di localStorage dengan key: sidebar-order-{userId}
 *
 * Structure: { [groupKey]: [itemKey, itemKey, ...] }
 */
export function useSidebarOrder() {
    const { auth } = usePage().props;
    const userId = auth?.user?.id ?? "guest";
    const storageKey = STORAGE_PREFIX + userId;

    const readFromStorage = () => {
        try {
            return JSON.parse(localStorage.getItem(storageKey)) || {};
        } catch {
            return {};
        }
    };

    const [customOrder, setCustomOrder] = useState(readFromStorage);

    // Listen for changes from other pages / other tabs
    useEffect(() => {
        const handleStorage = (e) => {
            if (e.key === storageKey) {
                setCustomOrder(readFromStorage());
            }
        };

        const handleCustomEvent = () => {
            setCustomOrder(readFromStorage());
        };

        window.addEventListener("storage", handleStorage);
        window.addEventListener(CHANGE_EVENT, handleCustomEvent);

        return () => {
            window.removeEventListener("storage", handleStorage);
            window.removeEventListener(CHANGE_EVENT, handleCustomEvent);
        };
    }, [storageKey]);

    // Notify other listeners when we write
    const notify = () => {
        window.dispatchEvent(new Event(CHANGE_EVENT));
    };

    /** Ambil custom order untuk sebuah group */
    const getGroupOrder = useCallback(
        (groupKey) => customOrder[groupKey] || [],
        [customOrder],
    );

    /** Simpan full order array untuk sebuah group */
    const saveGroupOrder = useCallback(
        (groupKey, newOrder) => {
            setCustomOrder((prev) => {
                const next = { ...prev, [groupKey]: newOrder };
                localStorage.setItem(storageKey, JSON.stringify(next));
                return next;
            });
            // Notify after state update (use setTimeout to let React batch)
            setTimeout(notify, 0);
        },
        [storageKey],
    );

    /** Pindahkan item dalam group (reorder via drag & drop) */
    const moveItem = useCallback(
        (groupKey, fromIndex, toIndex) => {
            setCustomOrder((prev) => {
                const groupOrder = [...(prev[groupKey] || [])];
                if (
                    fromIndex < 0 ||
                    fromIndex >= groupOrder.length ||
                    toIndex < 0 ||
                    toIndex > groupOrder.length
                ) {
                    return prev;
                }

                const [moved] = groupOrder.splice(fromIndex, 1);
                groupOrder.splice(toIndex, 0, moved);

                const next = { ...prev, [groupKey]: groupOrder };
                localStorage.setItem(storageKey, JSON.stringify(next));
                return next;
            });
            setTimeout(notify, 0);
        },
        [storageKey],
    );

    return { customOrder, getGroupOrder, saveGroupOrder, moveItem };
}

/**
 * Terapkan custom order pada array items.
 * Unlocked items diurutkan sesuai customOrder, locked items tetap di bawah.
 *
 * @param {Array} items - Array item NavItem
 * @param {Array<string>} orderKeys - Array key yang menentukan urutan custom
 * @returns {Array} Items yang sudah di-sort
 */
export function applyCustomOrderToItems(items, orderKeys = []) {
    const unlocked = items.filter((i) => !i.locked);
    const locked = items.filter((i) => i.locked);

    // Build order map dari custom order
    const orderMap = {};
    orderKeys.forEach((key, idx) => {
        orderMap[key] = idx;
    });

    // Pisahkan: yang ada di custom order vs yang belum pernah di-save
    const inOrder = [];
    const notInOrder = [];
    unlocked.forEach((item) => {
        if (Object.prototype.hasOwnProperty.call(orderMap, item.key)) {
            inOrder.push(item);
        } else {
            notInOrder.push(item);
        }
    });

    // Sort yang ada di custom order sesuai urutan
    inOrder.sort((a, b) => (orderMap[a.key] ?? 999) - (orderMap[b.key] ?? 999));

    return [...inOrder, ...notInOrder, ...locked];
}
