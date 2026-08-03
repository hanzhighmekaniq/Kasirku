import { Head, Link, usePage } from "@inertiajs/react";
import { ArrowRight, Store, User } from "lucide-react";

/**
 * Halaman sambutan untuk user yang sudah login tapi belum punya toko.
 *
 * Menggunakan tema `.dv-auth` yang sama dengan Register, Login, & Onboarding.
 * User bisa mulai onboarding atau mengakses profile.
 */

export default function Welcome() {
    const { auth } = usePage().props;
    const year = new Date().getFullYear();

    return (
        <>
            <Head title="Selamat Datang" />

            <div className="dv-auth grid min-h-screen lg:grid-cols-[1.15fr_1fr] xl:grid-cols-[1.35fr_1fr]">
                {/* ── Band gelap ── */}
                <div className="dv-band hidden flex-col justify-between p-10 xl:p-14 lg:flex">
                    <span className="dv-wordmark text-[1.375rem]">
                        DEVus<span className="dv-wordmark__dot">.</span>id
                    </span>

                    <div className="max-w-xl space-y-6 py-10">
                        <p className="dv-flag">
                            <User size={13} strokeWidth={2.5} />
                            Akun sudah terverifikasi
                        </p>

                        <h1 className="dv-display">
                            Selamat datang,
                            <br />
                            {auth?.user?.name ?? "User"}!
                        </h1>

                        <p className="dv-lead">
                            Akunmu sudah siap. Buat toko pertama untuk mulai
                            menggunakan kasir dan mengelola usahamu.
                        </p>
                    </div>

                    <p className="dv-label">
                        &copy; {year} DEVus.id — Seluruh hak dilindungi
                    </p>
                </div>

                {/* ── Panel konten ── */}
                <div className="flex flex-col justify-center px-6 py-12 sm:px-10 lg:px-12">
                    <div className="mx-auto w-full max-w-[30rem]">
                        <span className="dv-wordmark mb-8 text-[1.375rem] lg:hidden">
                            DEVus
                            <span className="dv-wordmark__dot">.</span>id
                        </span>

                        <h2
                            className="dv-title lg:hidden"
                            style={{ marginBottom: "0.5rem" }}
                        >
                            Halo, {auth?.user?.name ?? "User"}!
                        </h2>
                        <p
                            className="mb-8 text-[0.9375rem] leading-relaxed lg:hidden"
                            style={{ color: "var(--dv-muted)" }}
                        >
                            Akunmu sudah siap. Buat toko pertama untuk mulai
                            menggunakan kasir.
                        </p>

                        {/* Card utama */}
                        <div className="dv-card p-7 sm:p-8">
                            <div className="flex items-start gap-4">
                                <span
                                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                                    style={{
                                        background: "var(--dv-accent)",
                                        color: "var(--dv-accent-ink)",
                                    }}
                                >
                                    <Store size={20} strokeWidth={2} />
                                </span>
                                <div>
                                    <h3
                                        className="text-[1rem] font-semibold"
                                        style={{ color: "var(--dv-ink)" }}
                                    >
                                        Buat Toko Pertamamu
                                    </h3>
                                    <p
                                        className="mt-1 text-[0.875rem] leading-relaxed"
                                        style={{ color: "var(--dv-muted)" }}
                                    >
                                        Pilih jenis usaha, atur plan, dan beri
                                        nama tokomu. Prosesnya cepat dan bisa
                                        diubah kapan saja.
                                    </p>
                                </div>
                            </div>

                            <Link
                                href={route("onboarding")}
                                className="dv-btn dv-btn--accent mt-6 w-full justify-center"
                            >
                                Mulai Buat Toko
                                <ArrowRight size={16} strokeWidth={2.5} />
                            </Link>
                        </div>

                        {/* Info akses */}
                        <p
                            className="mt-6 text-center text-[0.8125rem]"
                            style={{ color: "var(--dv-muted)" }}
                        >
                            Kamu belum bisa mengakses dashboard dan fitur toko
                            sebelum membuat toko.
                        </p>

                        <p className="dv-label mt-10 lg:hidden">
                            &copy; {year} DEVus.id
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
