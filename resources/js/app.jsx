import "../css/app.css";
import "./bootstrap";

import { createInertiaApp } from "@inertiajs/react";
import { resolvePageComponent } from "laravel-vite-plugin/inertia-helpers";
import { createRoot } from "react-dom/client";

const appName = import.meta.env.VITE_APP_NAME || "Laravel";

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob("./Pages/**/*.jsx"),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(<App {...props} />);
    },
    progress: {
        color: "#4B5563",
    },
});

// Register Service Worker untuk PWA offline support
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker
            .register("/sw.js")
            .then((registration) => {
                console.log(
                    "[SW] Registered successfully:",
                    registration.scope,
                );
            })
            .catch((error) => {
                console.log("[SW] Registration failed:", error);
            });
    });
}

// Offline data sync: cache master data ke IndexedDB setelah app siap
import { syncAll } from "@/Services/sync";

// Trigger sync pertama setelah halaman dimuat
window.addEventListener("load", () => {
    // Delay sync agar tidak mengganggu rendering awal
    setTimeout(() => {
        syncAll().then((result) => {
            if (result.success) {
                console.log("[Sync] Master data cached at", result.syncedAt);
            }
        });
    }, 3000);
});

// Re-sync setelah setiap navigasi Inertia yang sukses
import { setupAutoReplay } from "@/Services/mutationQueue";
import { router } from "@inertiajs/react";

// Aktifkan auto-replay antrian offline saat online kembali
setupAutoReplay();

router.on("finish", (event) => {
    // Don't sync on POST/PUT/DELETE (submissions) — only GET navigations
    if (event.detail.visit.method === "get") {
        syncAll();
    }
});
