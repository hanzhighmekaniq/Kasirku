import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";

/**
 * Halaman yang ditampilkan ketika user mengakses fitur yang di-lock oleh plan.
 * Render oleh CheckFeatureAccess middleware (denyPlan).
 *
 * Props:
 *   feature      – kode fitur (mis. "kitchen")
 *   featureLabel – nama ramah (mis. "Kitchen Display")
 *   storePlan    – { plan: "free", label: "Free" }
 *   storeType    – { code: "fnb", label: "FnB" } | null
 */
export default function FeatureLocked({ feature, featureLabel, storePlan, storeType }) {
    return (
        <AuthenticatedLayout header={<span className="text-slate-500">Fitur Terkunci</span>}>
            <Head title="Fitur Terkunci – Upgrade Plan" />

            <div className="flex min-h-[70vh] items-center justify-center px-4">
                <div className="w-full max-w-lg">
                    {/* Card */}
                    <div className="rounded-2xl border border-amber-100 bg-white shadow-sm overflow-hidden">
                        {/* Top banner */}
                        <div className="bg-gradient-to-r from-amber-400 to-orange-400 px-6 py-5 text-white">
                            <div className="flex items-center gap-3">
                                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20 text-2xl">
                                    🔒
                                </span>
                                <div>
                                    <p className="text-xs font-medium text-amber-100 uppercase tracking-wide">
                                        Fitur Terkunci
                                    </p>
                                    <h1 className="text-xl font-bold leading-tight">
                                        {featureLabel ?? feature}
                                    </h1>
                                </div>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="px-6 py-5 space-y-5">
                            {/* Current plan badge */}
                            <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-4 py-3 border border-slate-100">
                                <span className="text-slate-400 text-sm">Paket saat ini:</span>
                                <span className="ml-auto rounded-full bg-slate-200 px-3 py-0.5 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                                    {storePlan?.label ?? storePlan?.plan ?? "Free"}
                                </span>
                            </div>

                            <p className="text-sm text-slate-600 leading-relaxed">
                                Fitur{" "}
                                <span className="font-semibold text-slate-800">
                                    {featureLabel ?? feature}
                                </span>{" "}
                                tidak tersedia pada paket{" "}
                                <span className="font-semibold text-slate-800">
                                    {storePlan?.label ?? storePlan?.plan}
                                </span>{" "}
                                yang sedang Anda gunakan.{" "}
                                Upgrade ke paket yang lebih tinggi untuk mendapatkan akses ke fitur ini.
                            </p>

                            {/* Feature perks hint */}
                            <div className="rounded-lg border border-primary-100 bg-primary-50 px-4 py-3 text-sm text-primary-700">
                                <p className="font-semibold mb-1">✨ Dengan upgrade plan, Anda bisa:</p>
                                <ul className="list-disc list-inside space-y-0.5 text-primary-600 text-xs">
                                    <li>Mengakses fitur <strong>{featureLabel ?? feature}</strong></li>
                                    <li>Menikmati lebih banyak fitur premium lainnya</li>
                                    <li>Meningkatkan limit pengguna dan cabang</li>
                                </ul>
                            </div>

                            {/* Store type note */}
                            {storeType && (
                                <p className="text-xs text-slate-400 text-center">
                                    Tipe toko Anda: <span className="font-medium text-slate-500">{storeType.label}</span>
                                </p>
                            )}
                        </div>

                        {/* Footer actions */}
                        <div className="flex items-center gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
                            <Link
                                href={route("admin.dashboard")}
                                className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2 text-center text-sm font-medium text-slate-600 hover:bg-slate-100 transition"
                            >
                                ← Kembali
                            </Link>
                            <a
                                href="https://wa.me/6281234567890?text=Halo%2C+saya+ingin+upgrade+plan+SIM-KASIR"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 rounded-lg bg-gradient-to-r from-amber-400 to-orange-400 px-4 py-2 text-center text-sm font-semibold text-white shadow-sm hover:opacity-90 transition"
                            >
                                🚀 Upgrade Plan
                            </a>
                        </div>
                    </div>

                    {/* Help text */}
                    <p className="mt-4 text-center text-xs text-slate-400">
                        Butuh bantuan?{" "}
                        <a
                            href="mailto:support@simkasir.id"
                            className="text-primary-500 hover:underline"
                        >
                            Hubungi tim support kami
                        </a>
                    </p>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
