import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";

/**
 * Halaman yang ditampilkan ketika user tidak memiliki permission Spatie.
 * Render oleh PermissionMiddleware saat UnauthorizedException.
 *
 * Props:
 *   permission – nama permission (mis. "purchase.create")
 *   error      – pesan error
 */
export default function PermissionDenied({ permission, error }) {
    return (
        <AuthenticatedLayout header={<span className="text-slate-500">Akses Ditolak</span>}>
            <Head title="Akses Ditolak" />

            <div className="flex min-h-[70vh] items-center justify-center px-4">
                <div className="w-full max-w-lg">
                    <div className="rounded-2xl border border-rose-100 bg-white shadow-sm overflow-hidden">
                        {/* Top banner */}
                        <div className="bg-gradient-to-r from-rose-500 to-pink-500 px-6 py-5 text-white">
                            <div className="flex items-center gap-3">
                                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20 text-2xl">
                                    🚫
                                </span>
                                <div>
                                    <p className="text-xs font-medium text-rose-100 uppercase tracking-wide">
                                        403 — Akses Ditolak
                                    </p>
                                    <h1 className="text-xl font-bold leading-tight">
                                        Permission: <span className="font-mono">{permission}</span>
                                    </h1>
                                </div>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="px-6 py-5 space-y-5">
                            <div className="rounded-lg border border-rose-100 bg-rose-50 px-4 py-3">
                                <p className="text-sm text-rose-700 font-medium">
                                    ⚠️ {error || `Anda tidak memiliki izin "${permission}".`}
                                </p>
                            </div>

                            <p className="text-sm text-slate-600 leading-relaxed">
                                Role Anda saat ini tidak memiliki permission{" "}
                                <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-mono text-rose-600">
                                    {permission}
                                </code>
                                . Hubungi admin atau owner toko untuk menambahkan permission ini ke role Anda.
                            </p>

                            {/* Tips */}
                            <div className="rounded-lg border border-primary-100 bg-primary-50 px-4 py-3 text-sm text-primary-700">
                                <p className="font-semibold mb-1">💡 Cara memperbaiki:</p>
                                <ul className="list-disc list-inside space-y-0.5 text-primary-600 text-xs">
                                    <li>Minta owner toko untuk membuka <strong>Developer → Roles</strong></li>
                                    <li>Pilih toko yang sesuai, lalu edit role Anda</li>
                                    <li>Centang permission <code className="bg-primary-100 px-1 rounded">{permission}</code></li>
                                    <li>Atau minta owner assign role yang lebih tinggi</li>
                                </ul>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
                            <Link
                                href={route("admin.dashboard")}
                                className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2 text-center text-sm font-medium text-slate-600 hover:bg-slate-100 transition"
                            >
                                ← Kembali ke Dashboard
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
