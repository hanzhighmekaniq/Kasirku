import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";

export default function NotFound({ error }) {
    return (
        <AuthenticatedLayout header={<span className="text-slate-500">Tidak Ditemukan</span>}>
            <Head title="404 — Tidak Ditemukan" />

            <div className="flex min-h-[70vh] items-center justify-center px-4">
                <div className="w-full max-w-lg">
                    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                        <div className="bg-gradient-to-r from-slate-400 to-slate-500 px-6 py-5 text-white">
                            <div className="flex items-center gap-3">
                                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20 text-2xl">
                                    🔍
                                </span>
                                <div>
                                    <p className="text-xs font-medium text-slate-200 uppercase tracking-wide">
                                        404 — Tidak Ditemukan
                                    </p>
                                    <h1 className="text-xl font-bold leading-tight">Halaman Tidak Ada</h1>
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-5">
                            <p className="text-sm text-slate-600 leading-relaxed">
                                {error || "Halaman yang Anda cari tidak ditemukan. Mungkin sudah dipindahkan atau dihapus."}
                            </p>
                        </div>

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
