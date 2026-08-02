import { useEffect, useRef } from "react";

/**
 * Widget Cloudflare Turnstile (verifikasi anti-bot).
 *
 * Script Turnstile dimuat dari resources/views/app.blade.php, hanya pada
 * halaman yang membutuhkannya. Kalau `siteKey` kosong (mis. development
 * sebelum key didaftarkan), widget tidak dirender dan verifikasi dilewati
 * di sisi server — lihat App\Rules\Turnstile.
 */
export default function TurnstileWidget({ siteKey, onToken, onReady, className = "mt-6" }) {
    const ref = useRef(null);
    const widgetId = useRef(null);

    useEffect(() => {
        if (!siteKey || !ref.current) return;

        let cancelled = false;
        let interval = null;

        const render = () => {
            if (cancelled || !window.turnstile || widgetId.current !== null) return;

            widgetId.current = window.turnstile.render(ref.current, {
                sitekey: siteKey,
                callback: (token) => onToken(token),
                "expired-callback": () => onToken(""),
                "error-callback": () => onToken(""),
            });

            if (onReady) onReady();
        };

        // Script dimuat async — tunggu sampai global `turnstile` tersedia.
        if (window.turnstile) {
            render();
        } else {
            interval = setInterval(() => {
                if (window.turnstile) {
                    clearInterval(interval);
                    render();
                }
            }, 200);
        }

        return () => {
            cancelled = true;
            if (interval) clearInterval(interval);
            if (widgetId.current !== null && window.turnstile) {
                window.turnstile.remove(widgetId.current);
                widgetId.current = null;
            }
        };
    }, [siteKey, onToken]);

    if (!siteKey) return null;

    return <div ref={ref} className={className} />;
}
