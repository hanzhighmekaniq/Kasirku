/**
 * Checkbox native sederhana (sisa scaffold Breeze).
 *
 * `text-primary-600` dan `focus:ring-primary-500` sebelumnya dipakai di sini —
 * itu numeric palette scale yang dilarang TOKEN_MAPPING karena tidak ikut tema
 * aktif. Sekarang memakai token, dan warna kotak tercentang diatur global di
 * `app.css`.
 *
 * Untuk checkbox baru, pakai `@/Components/ui/Checkbox` yang menggambar kotak
 * dan centangnya sendiri sehingga kontrasnya dijamin di semua tema.
 */
export default function Checkbox({ className = '', ...props }) {
    return (
        <input
            {...props}
            type="checkbox"
            className={
                'rounded border-input bg-background text-primary shadow-sm focus:ring-2 focus:ring-ring/20 ' +
                className
            }
        />
    );
}
