import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

const ROLE_LABELS = {
    developer: { label: 'Developer', cls: 'bg-violet-100 text-violet-700' },
    admin:     { label: 'Admin',     cls: 'bg-primary-100 text-primary-700' },
    kasir:     { label: 'Kasir',     cls: 'bg-slate-100 text-slate-600' },
};

function SectionCard({ title, subtitle, children }) {
    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-5">
                <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
                {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
            </div>
            <div className="p-6">{children}</div>
        </div>
    );
}

export default function Edit({ mustVerifyEmail, status }) {
    const { auth } = usePage().props;
    const user = auth.user;
    const role = ROLE_LABELS[auth.role] ?? auth.role ?? 'User';

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
                    </div>
                </div>

                {/* Profile info */}
                <SectionCard title="Informasi Profil" subtitle="Perbarui nama dan alamat email akun Anda">
                    <UpdateProfileInformationForm
                        mustVerifyEmail={mustVerifyEmail}
                        status={status}
                        className="max-w-xl"
                    />
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
