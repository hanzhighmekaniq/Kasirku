import { usePage } from "@inertiajs/react";
import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_PREFIX = "sidebar-order-";
const CHANGE_EVENT = "sidebar-order-changed";
const SAVE_DEBOUNCE_MS = 400;

/**
 * Hook untuk menyimpan dan mengelola custom layout sidebar per user.
 *
 * Tiga lapis sumber, persis seperti ThemeProvider (resources/js/Theme/ThemeProvider.jsx):
 *   1. `users.sidebar_preference` (DB)  — sumber kebenaran, ikut ke perangkat manapun user login.
 *   2. localStorage (`sidebar-order-{userId}`) — cache instan, dibaca sebelum request DB kembali.
 *   3. Default sistem (EMPTY_PREFS)     — dipakai kalau keduanya kosong.
 *
 * Struktur (v2):
 * {
 *   groups: [groupKey, groupKey, ...],       // urutan grup, menimpa default navConfig
 *   items:  { [groupKey]: [itemKey, ...] },  // urutan item DI DALAM grup itu
 *   placement: { [itemKey]: groupKey },      // grup tujuan kalau item dipindah dari grup asalnya
 *   groupLabels: { [groupKey]: "Nama Custom" }, // nama custom grup, menimpa label bawaan navConfig
 * }
 *
 * Format lama (v1) — flat object { [groupKey]: [itemKey, ...] } — otomatis
 * dimigrasi ke `items` saat dibaca, supaya urutan yang sudah disimpan user
 * tidak hilang waktu update ini dirilis.
 */

const EMPTY_PREFS = { groups: [], items: {}, placement: {}, groupLabels: {} };

/** Migrasi bentuk lama (flat) ke bentuk baru. Data v2 dikembalikan apa adanya. */
function normalizePrefs(raw) {
    if (!raw || typeof raw !== "object") return { ...EMPTY_PREFS };

    // Bentuk v2 sudah punya salah satu dari tiga kunci ini secara eksplisit.
    const isV2 =
        Object.prototype.hasOwnProperty.call(raw, "groups") ||
        Object.prototype.hasOwnProperty.call(raw, "placement");

    if (isV2) {
        return {
            groups: Array.isArray(raw.groups) ? raw.groups : [],
            items: raw.items && typeof raw.items === "object" ? raw.items : {},
            placement:
                raw.placement && typeof raw.placement === "object"
                    ? raw.placement
                    : {},
            groupLabels:
                raw.groupLabels && typeof raw.groupLabels === "object"
                    ? raw.groupLabels
                    : {},
        };
    }

    // Bentuk v1: seluruh object adalah { [groupKey]: [itemKey, ...] }.
    return { groups: [], items: raw, placement: {}, groupLabels: {} };
}

/** Ambil XSRF-TOKEN dari cookie — dipakai buat header fetch ke endpoint PATCH. */
function getXsrfTokenFromCookie() {
    const match = document.cookie
        .split("; ")
        .find((row) => row.startsWith("XSRF-TOKEN="));
    return match ? decodeURIComponent(match.split("=")[1]) : null;
}

/** Kirim preferensi ke server. Dipanggil lewat debounce, bukan tiap perubahan. */
function persistToServer(prefs, onStatus) {
    onStatus?.("saving");
    try {
        const xsrfToken = getXsrfTokenFromCookie();
        fetch(route("admin.sidebar-preference.update"), {
            method: "PATCH",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                ...(xsrfToken ? { "X-XSRF-TOKEN": xsrfToken } : {}),
            },
            body: JSON.stringify(prefs),
        })
            .then((res) => onStatus?.(res.ok ? "saved" : "error"))
            .catch(() => onStatus?.("error"));
    } catch {
        onStatus?.("error");
    }
}

export function useSidebarOrder() {
    const { auth } = usePage().props;
    const userId = auth?.user?.id ?? null;
    const storageKey = STORAGE_PREFIX + (userId ?? "guest");
    const dbPrefs = normalizePrefs(auth?.user?.sidebar_preference ?? null);
    const hasDbPrefs = Boolean(auth?.user?.sidebar_preference);

    const readFromStorage = useCallback(() => {
        try {
            return normalizePrefs(JSON.parse(localStorage.getItem(storageKey)));
        } catch {
            return { ...EMPTY_PREFS };
        }
    }, [storageKey]);

    const writeToStorage = useCallback(
        (next) => {
            try {
                localStorage.setItem(storageKey, JSON.stringify(next));
            } catch {
                /* localStorage penuh/diblokir — DB tetap jadi sumber kebenaran */
            }
        },
        [storageKey],
    );

    // Nilai awal: DB dulu (kalau ada), lalu localStorage, lalu default.
    // Sama seperti ThemeProvider.jsx:192-201.
    const [prefs, setPrefs] = useState(() => {
        if (hasDbPrefs) return dbPrefs;
        return readFromStorage();
    });
    const [saveStatus, setSaveStatus] = useState("idle");

    const debounceRef = useRef(null);
    const prevUserIdRef = useRef(userId);

    // Saat pindah akun (login/logout/ganti user), sinkronkan ulang dari DB
    // dan bersihkan localStorage supaya preferensi tidak bocor ke user
    // berikutnya di perangkat yang sama. Mengikuti ThemeProvider.jsx:205-220.
    useEffect(() => {
        const prevUserId = prevUserIdRef.current;
        prevUserIdRef.current = userId;

        if (userId === null && prevUserId !== null) {
            try {
                localStorage.removeItem(STORAGE_PREFIX + prevUserId);
            } catch {
                /* noop */
            }
            setPrefs({ ...EMPTY_PREFS });
            return;
        }

        if (hasDbPrefs && prevUserId !== userId) {
            setPrefs(dbPrefs);
            writeToStorage(dbPrefs);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId, hasDbPrefs]);

    // Keputusan A: angkat otomatis preferensi lama di localStorage ke DB.
    // Kalau user login (punya userId) tapi DB masih kosong sementara
    // localStorage sudah berisi preferensi dari sebelum fitur ini ada,
    // kirim sekali ke server supaya tidak hilang.
    useEffect(() => {
        if (!userId || hasDbPrefs) return;
        const local = readFromStorage();
        const isEmpty =
            local.groups.length === 0 &&
            Object.keys(local.items).length === 0 &&
            Object.keys(local.placement).length === 0;
        if (isEmpty) return;

        persistToServer(local, setSaveStatus);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId, hasDbPrefs]);

    // Sinkron antar tab/window di perangkat yang sama.
    useEffect(() => {
        const handleStorage = (e) => {
            if (e.key === storageKey) setPrefs(readFromStorage());
        };
        const handleCustomEvent = () => setPrefs(readFromStorage());

        window.addEventListener("storage", handleStorage);
        window.addEventListener(CHANGE_EVENT, handleCustomEvent);
        return () => {
            window.removeEventListener("storage", handleStorage);
            window.removeEventListener(CHANGE_EVENT, handleCustomEvent);
        };
    }, [storageKey, readFromStorage]);

    const notify = () => window.dispatchEvent(new Event(CHANGE_EVENT));

    /**
     * Terapkan perubahan lokal (langsung, untuk tampilan instan) lalu jadwalkan
     * kirim ke server dengan debounce. Debounce mengirim SELURUH objek prefs
     * (bukan patch sebagian), jadi kalau user menggeser cepat berkali-kali,
     * request terakhir yang benar-benar terkirim tetap memuat kondisi akhir.
     */
    const persist = useCallback(
        (updater) => {
            setPrefs((prev) => {
                const next = updater(prev);
                writeToStorage(next);

                if (userId) {
                    if (debounceRef.current) clearTimeout(debounceRef.current);
                    debounceRef.current = setTimeout(() => {
                        persistToServer(next, setSaveStatus);
                    }, SAVE_DEBOUNCE_MS);
                }

                return next;
            });
            setTimeout(notify, 0);
        },
        [userId, writeToStorage],
    );

    useEffect(() => {
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, []);

    /** Ambil custom order item untuk sebuah grup (bentuk lama, tetap dipertahankan untuk compat). */
    const getGroupOrder = useCallback(
        (groupKey) => prefs.items[groupKey] || [],
        [prefs],
    );

    /** Simpan urutan item di dalam satu grup. */
    const saveGroupOrder = useCallback(
        (groupKey, newOrder) => {
            persist((prev) => ({
                ...prev,
                items: { ...prev.items, [groupKey]: newOrder },
            }));
        },
        [persist],
    );

    /** Simpan urutan grup (array of groupKey). */
    const saveGroupsOrder = useCallback(
        (newGroupOrder) => {
            persist((prev) => ({ ...prev, groups: newGroupOrder }));
        },
        [persist],
    );

    /**
     * Pindahkan sebuah item ke grup lain.
     *
     * Item ditaruh di akhir urutan grup tujuan. Urutan di grup asal otomatis
     * menyesuaikan karena item itu tidak lagi ada di sana saat redistribusi.
     */
    const moveItemToGroup = useCallback(
        (itemKey, targetGroupKey) => {
            persist((prev) => {
                const nextItems = { ...prev.items };
                // Bersihkan item ini dari urutan manual grup lain kalau ada,
                // supaya tidak nyantol sebagai entri basi.
                Object.keys(nextItems).forEach((gk) => {
                    nextItems[gk] = (nextItems[gk] || []).filter((k) => k !== itemKey);
                });
                nextItems[targetGroupKey] = [
                    ...(nextItems[targetGroupKey] || []),
                    itemKey,
                ];

                return {
                    ...prev,
                    placement: { ...prev.placement, [itemKey]: targetGroupKey },
                    items: nextItems,
                };
            });
        },
        [persist],
    );

    /**
     * Ganti nama tampilan sebuah grup. Kirim string kosong untuk kembali ke
     * nama bawaan dari navConfig — key-nya dihapus, bukan disimpan sebagai
     * string kosong, supaya applyCustomLayout() jatuh balik ke label default.
     */
    const saveGroupLabel = useCallback(
        (groupKey, label) => {
            persist((prev) => {
                const nextLabels = { ...prev.groupLabels };
                const trimmed = label.trim();
                if (trimmed) {
                    nextLabels[groupKey] = trimmed;
                } else {
                    delete nextLabels[groupKey];
                }
                return { ...prev, groupLabels: nextLabels };
            });
        },
        [persist],
    );

    /** Reset seluruh preferensi (grup, urutan, penempatan, nama) ke default sistem. */
    const resetAll = useCallback(() => {
        persist(() => ({ ...EMPTY_PREFS }));
    }, [persist]);

    return {
        prefs,
        customOrder: prefs.items, // alias untuk compat dengan pemanggil lama
        saveStatus,
        getGroupOrder,
        saveGroupOrder,
        saveGroupsOrder,
        moveItemToGroup,
        saveGroupLabel,
        resetAll,
    };
}

/**
 * Terapkan custom order pada array items DI DALAM SATU GRUP.
 * Unlocked items diurutkan sesuai orderKeys, locked items tetap di bawah.
 * Dipertahankan untuk kode lama yang belum pindah ke applyCustomLayout().
 */
export function applyCustomOrderToItems(items, orderKeys = []) {
    const unlocked = items.filter((i) => !i.locked);
    const locked = items.filter((i) => i.locked);

    const orderMap = {};
    orderKeys.forEach((key, idx) => {
        orderMap[key] = idx;
    });

    const inOrder = [];
    const notInOrder = [];
    unlocked.forEach((item) => {
        if (Object.prototype.hasOwnProperty.call(orderMap, item.key)) {
            inOrder.push(item);
        } else {
            notInOrder.push(item);
        }
    });

    inOrder.sort((a, b) => (orderMap[a.key] ?? 999) - (orderMap[b.key] ?? 999));

    return [...inOrder, ...notInOrder, ...locked];
}

/**
 * Terapkan seluruh preferensi custom (grup + item + penempatan) ke daftar
 * grup default dari buildNavGroups().
 *
 * Urutan pengerjaan:
 * 1. Redistribusi item sesuai `placement` — item pindah dari grup asal ke
 *    grup tujuan yang dipilih user.
 * 2. Urutkan item di dalam tiap grup sesuai `items[groupKey]`.
 * 3. Urutkan grup itu sendiri sesuai `groups`, sisanya (grup baru yang belum
 *    pernah diatur) menyusul di belakang dalam urutan default.
 * 4. Buang grup yang jadi kosong akibat semua isinya dipindah keluar.
 *
 * @param {Array} defaultGroups - hasil buildNavGroups()
 * @param {object} prefs - { groups, items, placement }
 * @returns {Array} grup yang sudah disusun ulang
 */
export function applyCustomLayout(defaultGroups, prefs) {
    const {
        groups: groupOrder = [],
        items: itemOrders = {},
        placement = {},
        groupLabels = {},
    } = prefs;

    // 1. Redistribusi item ke grup tujuan sesuai placement.
    const byGroupKey = {};
    defaultGroups.forEach((g) => {
        byGroupKey[g.key] = { ...g, items: [] };
    });

    defaultGroups.forEach((g) => {
        g.items.forEach((item) => {
            const targetKey = placement[item.key];
            // Placement hanya berlaku kalau grup tujuannya benar-benar ada di
            // build saat ini (fitur tujuan mungkin sudah dimatikan/diganti tipe toko).
            const destKey =
                targetKey && byGroupKey[targetKey] ? targetKey : g.key;
            byGroupKey[destKey].items.push({ ...item, originGroupKey: g.key });
        });
    });

    // 2. Urutkan item di dalam tiap grup.
    Object.keys(byGroupKey).forEach((key) => {
        byGroupKey[key].items = applyCustomOrderToItems(
            byGroupKey[key].items,
            itemOrders[key] || [],
        );
    });

    // 3. Buang grup yang sekarang kosong.
    const nonEmptyGroups = Object.values(byGroupKey).filter(
        (g) => g.items.length > 0,
    );

    // Pisahkan grup pinned — selalu di posisi paling bawah, tidak ikut reordering.
    const pinnedGroups = nonEmptyGroups.filter((g) => g.pinned);
    const sortableGroups = nonEmptyGroups.filter((g) => !g.pinned);

    // 4. Urutkan grup sortable: yang ada di groupOrder dulu (sesuai urutannya),
    // sisanya menyusul mengikuti urutan default (defaultGroups) di belakang.
    const orderMap = {};
    groupOrder.forEach((key, idx) => {
        orderMap[key] = idx;
    });

    const inOrder = [];
    const notInOrder = [];
    sortableGroups.forEach((g) => {
        if (Object.prototype.hasOwnProperty.call(orderMap, g.key)) {
            inOrder.push(g);
        } else {
            notInOrder.push(g);
        }
    });
    inOrder.sort((a, b) => (orderMap[a.key] ?? 999) - (orderMap[b.key] ?? 999));

    // 5. Timpa label grup dengan nama custom kalau user pernah menggantinya.
    // Grup pinned tidak bisa diganti namanya — selalu pakai label bawaan.
    const applyLabels = (g) => ({
        ...g,
        label: g.pinned ? g.label : (groupLabels[g.key] || g.label),
        defaultLabel: g.label,
    });

    return [
        ...[...inOrder, ...notInOrder].map(applyLabels),
        ...pinnedGroups.map(applyLabels),
    ];
}
