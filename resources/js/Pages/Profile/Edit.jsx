import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Mail, CheckCircle, RefreshCw, Shield, AlertTriangle } from 'lucide-react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

const ROLE_LABELS = {
    developer: { label: 'Developer', cls: 'bg-violet-100 text-violet-700' },
    admin:     { label: 'Admin',     cls: 'bg-primary-100 text-primary-700' },
    kasir:     { label: 'Kasir',     cls: 'bg-slate-100 text-slate-600' },
};

function SectionCard({ title, subtitle, children, id }) {
    return (
        <div id={id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-5">
                <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
                {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
            </div>
            <div className="p-6">{children}</div>
        </div>
    );
}

function EmailVerificationSection() {
    const { auth } = usePage().props;
    const isVerified = auth?.emailVerified ?? false;
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    const resend = () => {
        setSending(true);
        router.post(
            route('verification.send'),
            {},
            {
                onFinish: () => {
                    setSending(false);
                    setSent(true);
                },
            },
        );
    };

    if (isVerified) {
        return (
            <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
                <CheckCircle size={20} className="text-green-500 shrink-0" />
                <div>
                    <p className="text-sm font-semibold text-green-800">Email Terverifikasi</p>
                    <p className="text-xs text-green-600">
                        Email kamu sudah terverifikasi. Semua fitur sudah aktif.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                <AlertTriangle size={20} className="text-amber-500 shrink-0" />
                <div>
                    <p className="text-sm font-semibold text-amber-800">Belum Terverifikasi</p>
                    <p className="text-xs text-amber-600">
                        Email kamu belum diverifikasi. Verifikasi untuk membuka semua fitur transaksi.
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <button
                    onClick={resend}
                    disabled={sending || sent}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {sending ? (
                        <>
                            <RefreshCw size={14} className="animate-spin" />
                            Mengirim…
                        </>
                    ) : sent ? (
                        <>
                            <CheckCircle size={14} />
                            Link Terkirim!
                        </>
                    ) : (
                        <>
                            <Mail size={14} />
                            Kirim Link Verifikasi
                        </>
                    )}
                </button>
                {sent && (
                    <p className="text-xs text-slate-500">
                        Cek email kamu dan klik link verifikasi.
                    </p>
                )}
            </div>
        </div>
    );
}

export default function Edit() {
    const { auth } = usePage().props;
    const user = auth.user;
    const role = ROLE_LABELS[auth.role] ?? auth.role ?? 'User';
    const isVerified = auth?.emailVerified ?? false;

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-sm font-bold text-white shadow-lg shadow-primary-500/25">
                        {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">Pengaturan Akun</h2>
                        <p className="text-xs text-slate-500">Kelola profil dan keamanan akun Anda</p>
                    </div>
                </div>
            }
        >
            <Head title="Pengaturan Akun" />

            <div className="mx-auto max-w-4xl space-y-6 py-8">
                {/* User identity card */}
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-r from-primary-500 to-primary-600 p-6 text-white shadow-lg shadow-primary-500/20">
                    <div className="flex items-center gap-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 text-2xl font-bold backdrop-blur-sm">
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">{user.name}</h3>
                            <p className="text-sm text-white/80">{user.email}</p>
                            {role && (
                                <span className="mt-1 inline-flex items-center rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium backdrop-blur-sm">
                                    {role.label}
                                </span>
                            )}
                        </div>
                        {!isVerified && (
                            <div className="ml-auto">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/20 px-3 py-1 text-xs font-semibold text-amber-100 backdrop-blur-sm">
                                    <AlertTriangle size={12} />
                                    Belum Verifikasi
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Email Verification */}
                <SectionCard
                    id="verifikasi-email"
                    title="Verifikasi Email"
                    subtitle="Verifikasi email untuk mengaktifkan semua fitur transaksi"
                >
                    <EmailVerificationSection />
                </SectionCard>

                {/* Profile info */}
                <SectionCard title="Informasi Profil" subtitle="Perbarui nama dan alamat email akun Anda">
                    <UpdateProfileInformationForm className="max-w-xl" />
                </SectionCard>

                {/* Password */}
                <SectionCard title="Ubah Password" subtitle="Pastikan akun Anda menggunakan password yang kuat">
                    <UpdatePasswordForm className="max-w-xl" />
                </SectionCard>

                {/* Danger zone */}
                <div className="overflow-hidden rounded-2xl border border-red-200 bg-white shadow-sm">
                    <div className="border-b border-red-100 bg-red-50/60 px-6 py-5">
                        <h3 className="text-sm font-semibold text-red-900">Zona Berbahaya</h3>
                        <p className="mt-0.5 text-xs text-red-500">Hapus akun secara permanen. Tindakan ini tidak dapat dibatalkan.</p>
                    </div>
                    <div className="p-6">
                        <DeleteUserForm className="max-w-xl" />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
