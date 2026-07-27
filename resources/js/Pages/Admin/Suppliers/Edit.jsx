import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Check, Loader2, X } from "lucide-react";
import Button from "@/Components/ui/Button";
import PageHeader from "@/Components/PageHeader";

export default function Edit({ supplier }) {
    const { flash } = usePage().props;

    const { data, setData, put, processing, errors } = useForm({
        name:           supplier.name           ?? '',
        contact_person: supplier.contact_person ?? '',
        phone:          supplier.phone          ?? '',
        email:          supplier.email          ?? '',
        address:        supplier.address        ?? '',
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('admin.suppliers.update', supplier.id));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="leading-tight">
                    <div className="text-sm font-semibold text-foreground">
                        Supplier
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                        Manajemen
                    </div>
                </div>
            }
        >
            <Head title={`Edit: ${supplier.name}`} />
            <PageHeader
                title="Edit Supplier"
                breadcrumbs={["Admin", "Supplier", "Edit"]}
                heading={
                    <>
                        Edit{" "}
                        <span className="bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
                            Supplier
                        </span>
                    </>
                }
                description={`Perbarui data pemasok ${supplier.name}.`}
                backUrl={route("admin.suppliers.index")}
            />

            {flash?.success && (
                <div className="mb-4 rounded-xl border border-success/20 bg-success/10 px-4 py-3 text-sm text-success">{flash.success}</div>
            )}

            <form onSubmit={submit}>
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                    {/* Main */}
                    <div className="space-y-5 lg:col-span-2">
                        <SectionCard title="Identitas Supplier">
                            <div className="space-y-4">
                                <Field label="Nama Supplier" required error={errors.name}>
                                    <input type="text" value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="Contoh: PT Sumber Makmur" className={inputCls(!!errors.name)} autoFocus />
                                </Field>
                                <Field label="Kontak Person" error={errors.contact_person} hint="Opsional">
                                    <input type="text" value={data.contact_person} onChange={(e) => setData('contact_person', e.target.value)} placeholder="Nama PIC / penanggung jawab" className={inputCls(!!errors.contact_person)} />
                                </Field>
                            </div>
                        </SectionCard>

                        <SectionCard title="Informasi Kontak">
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <Field label="Telepon" error={errors.phone}>
                                        <div className="relative">
                                            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>
                                            </span>
                                            <input type="tel" value={data.phone} onChange={(e) => setData('phone', e.target.value)} placeholder="08xxxxxxxxxx" className={inputCls(!!errors.phone, 'pl-9')} />
                                        </div>
                                    </Field>
                                    <Field label="Email" error={errors.email}>
                                        <div className="relative">
                                            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
                                            </span>
                                            <input type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} placeholder="email@perusahaan.com" className={inputCls(!!errors.email, 'pl-9')} />
                                        </div>
                                    </Field>
                                </div>
                                <Field label="Alamat" error={errors.address}>
                                    <textarea value={data.address} onChange={(e) => setData('address', e.target.value)} rows={3} placeholder="Alamat lengkap supplier" className={`${inputCls(!!errors.address)} resize-none`} />
                                </Field>
                            </div>
                        </SectionCard>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-5">
                        <SectionCard title="Ringkasan">
                            <dl className="space-y-2.5 text-sm">
                                <InfoRow label="Kode" value={<span className="rounded-lg bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">{supplier.code}</span>} />
                                <InfoRow label="Nama" value={data.name || <span className="text-muted-foreground/50 italic">Belum diisi</span>} />
                                <InfoRow label="Kontak" value={data.contact_person || <span className="text-muted-foreground/50 italic">-</span>} />
                                <InfoRow label="Telepon" value={data.phone || <span className="text-muted-foreground/50 italic">-</span>} />
                                <InfoRow label="Email" value={data.email || <span className="text-muted-foreground/50 italic">-</span>} />
                            </dl>
                        </SectionCard>

                        {/* Aksi desktop — di mobile digantikan FAB di bawah */}
                        <div className="hidden flex-col gap-2 sm:flex">
                            <Button type="submit" loading={processing} disabled={!data.name.trim()} className="w-full">
                                Simpan Perubahan
                            </Button>
                            <Link href={route('admin.suppliers.index')} className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-center text-sm font-medium text-foreground transition hover:bg-muted">
                                Batal
                            </Link>
                        </div>
                    </div>
                </div>

                {/* FAB — mobile only */}
                <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 sm:hidden">
                    <Link
                        href={route('admin.suppliers.index')}
                        className="flex h-12 w-12 items-center justify-center rounded-full bg-card text-muted-foreground shadow-lg ring-1 ring-border transition hover:bg-destructive/10 hover:text-destructive hover:ring-destructive/30"
                        title="Batal"
                    >
                        <X className="h-5 w-5" strokeWidth={2} />
                    </Link>
                    <button
                        type="submit"
                        disabled={processing || !data.name.trim()}
                        className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/40 transition hover:bg-primary/90 disabled:opacity-60"
                        title="Simpan Perubahan"
                    >
                        {processing ? (
                            <Loader2 className="h-6 w-6 animate-spin" />
                        ) : (
                            <Check className="h-6 w-6" strokeWidth={2.5} />
                        )}
                    </button>
                </div>

                {/* Spacer supaya konten tidak tertutup FAB di mobile */}
                <div className="h-24 sm:hidden" />
            </form>
        </AuthenticatedLayout>
    );
}

function SectionCard({ title, children }) {
    return (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="border-b border-border bg-muted/50 px-6 py-5">
                <h3 className="text-base font-semibold text-foreground">{title}</h3>
            </div>
            <div className="p-6">{children}</div>
        </div>
    );
}

function Field({ label, required, error, hint, children }) {
    return (
        <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
                {label} {required && <span className="text-destructive">*</span>}
                {hint && <span className="ml-1 text-xs font-normal text-muted-foreground">{hint}</span>}
            </label>
            {children}
            {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
        </div>
    );
}

function InfoRow({ label, value }) {
    return (
        <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="text-right font-medium text-foreground">{value}</dd>
        </div>
    );
}

// `border` (lebar) wajib ditulis — tanpa itu `border-input` hanya menyetel
// warna sementara lebarnya tetap 0, jadi border tidak pernah tampil.
// `bg-input` juga salah token: `input` dipakai untuk BORDER, background form
// memakai `bg-background` (lihat TOKEN_MAPPING → Form & Input).
function inputCls(hasError, extra = '') {
    return `block w-full rounded-xl border bg-background py-2.5 px-3.5 text-sm text-foreground shadow-sm outline-none transition placeholder:text-muted-foreground focus:ring-2 ${hasError ? 'border-destructive focus:border-destructive focus:ring-destructive/20' : 'border-input focus:border-ring focus:ring-ring/20'} ${extra}`;
}
