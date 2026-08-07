import { useTheme } from "@/Theme/ThemeProvider";
import { Toaster as Sonner } from "sonner";

/**
 * Toaster — shadcn-style Sonner wrapper yang terintegrasi dengan
 * ThemeProvider project ini.
 *
 * Posisi: bottom-right di desktop, bottom-center di mobile.
 * Durasi: 6 detik untuk error/warning, 4 detik untuk success/info.
 * Styling: pakai CSS variables shadcn (--popover, --border, --radius).
 *
 * Dipasang sekali di AuthenticatedLayout (atau DeveloperLayout),
 * lalu setiap halaman cukup panggil toast.success() / toast.error() /
 * toast.warning() / toast.info() dari "sonner".
 */
export default function Toaster() {
    const { isDark } = useTheme();

    return (
        <Sonner
            theme={isDark ? "dark" : "light"}
            position="bottom-right"
            richColors
            closeButton
            duration={4000}
            expand={false}
            gap={8}
            toastOptions={{
                duration: 4000,
                classNames: {
                    toast: "group",
                    error: "[&>div]:!border-destructive/20",
                    success: "[&>div]:!border-success/20",
                    warning: "[&>div]:!border-warning/20",
                },
            }}
            style={
                {
                    "--normal-bg": "rgb(var(--popover))",
                    "--normal-text": "rgb(var(--popover-foreground))",
                    "--normal-border": "rgb(var(--border))",
                    "--border-radius": "var(--radius)",
                    "--success-bg": "rgb(var(--popover))",
                    "--success-text": "rgb(var(--popover-foreground))",
                    "--success-border": "rgb(var(--success) / 0.2)",
                    "--error-bg": "rgb(var(--popover))",
                    "--error-text": "rgb(var(--popover-foreground))",
                    "--error-border": "rgb(var(--destructive) / 0.2)",
                    "--warning-bg": "rgb(var(--popover))",
                    "--warning-text": "rgb(var(--popover-foreground))",
                    "--warning-border": "rgb(var(--warning) / 0.2)",
                    "--info-bg": "rgb(var(--popover))",
                    "--info-text": "rgb(var(--popover-foreground))",
                    "--info-border": "rgb(var(--info) / 0.2)",
                }
            }
        />
    );
}
