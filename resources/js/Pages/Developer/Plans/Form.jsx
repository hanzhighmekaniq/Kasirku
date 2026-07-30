import DeveloperLayout from "@/Layouts/DeveloperLayout";
import { Head, Link, useForm } from "@inertiajs/react";
import { ArrowLeft } from "lucide-react";

const iCls = (err) =>
    `block w-full rounded-xl border px-3.5 py-2.5 text-sm text-foreground transition placeholder:text-muted-foreground focus:outline-none focus:ring-2 ${
        err
            ? "border-destructive bg-destructive/10 focus:ring-destructive/20"
            : "border-input bg-background focus:border-ring focus:ring-ring/20"
    }`;

function Label({ children, required }) {
    return (
        <label className="mb-1.5 block text-sm font-medium text-foreground">
            {children}
            {required && <span className="ml-0.5 text-destructive">*</span>}
        </label>
    );
}
function FieldError({ msg }) {
    return msg ? <p className="mt-1 text-xs text-destructive">{msg}</p> : null;
}
function Hint({ children }) {
    return <p className="mt-1 text-[11px] text-muted-foreground">{children}</p>;
}

export default function Form({ plan }) {
    const isEdit = !!plan;

    const { data, setData, post, put, processing, errors } = useForm({
        code:                        plan?.code                        ?? "",
        label:                       plan?.label                       ?? "",
        description:                 plan?.description                 ?? "",
        max_users:                   plan?.max_users                   ?? 1,
        max_branches:                plan?.max_branches                ?? 1,
        max_stores:                  plan?.max_stores                  ?? 1,
        max_products:                plan?.max_products                ?? "",
        max_transactions_per_month:  plan?.max_transactions_per_month  ?? "",
        price:                       plan?.price                       ?? 0,
        price_yearly:                plan?.price_yearly                ?? 0,
        trial_days:                  plan?.trial_days                  ?? 0,
        is_active:                   plan?.is_active                   ?? true,
        is_popular:                  plan?.is_popular                  ?? false,
        is_seasonal:                 plan?.is_seasonal                 ?? false,
        seasonal_label:              plan?.seasonal_label              ?? "",
        sort_order:                  plan?.sort_order                  ?? 0,
    });

    const submit = (e) => {
        e.preventDefault();
        isEdit
            ? put(route("developer.plans.update", plan))
            : post(route("developer.plans.store"));
    };

    return (
        <DeveloperLayout
            header={
                <div className="flex items-center gap-3">
                    <Link
                        href={route("developer.plans.index")}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground shadow-sm transition hover:bg-muted hover:text-foreground"
                    >
                        <ArrowLeft className="h-4 w-4" strokeWidth={2} />
                    </Link>
                    <div>
                        <h2 className="text-lg font-bold text-foreground">
                            {isEdit ? `Edit Paket — ${plan.label}` : "Tambah Paket Baru"}
                        </h2>
                        <p className="text-xs text-muted-foreground">
                            {isEdit
                                ? `Kode: ${plan.code} · Atur fitur & add-on lewat tombol di halaman daftar`
                                : "Isi informasi paket langganan"}
                        </p>
                    </div>
                </div>
            }
        >
            <Head title={isEdit ? `Edit Paket — ${plan.label}` : "Tambah Paket"} />

            <div className="mx-auto max-w-3xl">
                <form onSubmit={submit} className="space-y-5">

                    {/* ── Identitas ── */}
                    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                        <div className="border-b border-border bg-muted/60 px-6 py-4">
                            <h3 className="text-sm font-bold text-foreground">Identitas Paket</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4 p-6">
                            <div>
                                <Label required>Kode</Label>
                                <input
                                    value={data.code}
                                    onChange={(e) => setData("code", e.target.value.toLowerCase())}
                                    className={iCls(errors.code)}
                                    placeholder="free / starter / pro"
                                    disabled={isEdit}
                                />
                                <Hint>Lowercase, tanpa spasi. Tidak bisa diubah setelah dibuat.</Hint>
                                <FieldError msg={errors.code} />
                            </div>
                            <div>
                                <Label required>Label</Label>
                                <input
                                    value={data.label}
                                    onChange={(e) => setData("label", e.target.value)}
                                    className={iCls(errors.label)}
                                    placeholder="Free / Starter / Pro"
                                />
                                <FieldError msg={errors.label} />
                            </div>
                            <div className="col-span-2">
                                <Label>Deskripsi</Label>
                                <textarea
                                    value={data.description}
                                    onChange={(e) => setData("description", e.target.value)}
                                    rows={2}
                                    className={iCls(errors.description)}
                                    placeholder="Deskripsi singkat yang tampil di halaman pilih paket..."
                                />
                                <FieldError msg={errors.description} />
                            </div>
                        </div>
                    </section>

                    {/* ── Limit ── */}
                    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                        <div className="border-b border-border bg-muted/60 px-6 py-4">
                            <h3 className="text-sm font-bold text-foreground">Batas Penggunaan</h3>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                Kosongkan Produk & Transaksi untuk unlimited.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 p-6 sm:grid-cols-3">
                            {[
                                { key: "max_users", label: "Maks User", suffix: "user", min: 1 },
                                { key: "max_branches", label: "Maks Cabang", suffix: "cabang", min: 1 },
                                { key: "max_stores", label: "Maks Store", suffix: "toko", min: 1 },
                            ].map(({ key, label, suffix, min }) => (
                                <div key={key}>
                                    <Label required>{label}</Label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min={min}
                                            value={data[key]}
                                            onChange={(e) => setData(key, Number(e.target.value))}
                                            className={iCls(errors[key])}
                                        />
                                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                                            {suffix}
                                        </span>
                                    </div>
                                    <FieldError msg={errors[key]} />
                                </div>
                            ))}
                            <div>
                                <Label>Maks Produk</Label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="1"
                                        value={data.max_products}
                                        onChange={(e) => setData("max_products", e.target.value)}
                                        placeholder="∞ Unlimited"
                                        className={iCls(errors.max_products)}
                                    />
                                </div>
                                <Hint>Kosong = unlimited</Hint>
                                <FieldError msg={errors.max_products} />
                            </div>
                            <div>
                                <Label>Maks Transaksi/Bulan</Label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="1"
                                        value={data.max_transactions_per_month}
                                        onChange={(e) => setData("max_transactions_per_month", e.target.value)}
                                        placeholder="∞ Unlimited"
                                        className={iCls(errors.max_transactions_per_month)}
                                    />
                                </div>
                                <Hint>Kosong = unlimited</Hint>
                                <FieldError msg={errors.max_transactions_per_month} />
                            </div>
                        </div>
                    </section>

                    {/* ── Harga ── */}
                    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                        <div className="border-b border-border bg-muted/60 px-6 py-4">
                            <h3 className="text-sm font-bold text-foreground">Harga & Trial</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4 p-6 sm:grid-cols-3">
                            <div>
                                <Label>Harga / Bulan</Label>
                                <div className="relative">
                                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                                        Rp
                                    </span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="1000"
                                        value={data.price}
                                        onChange={(e) => setData("price", Number(e.target.value))}
                                        className={`${iCls(errors.price)} pl-9`}
                                        placeholder="0 = Gratis"
                                    />
                                </div>
                                <FieldError msg={errors.price} />
                            </div>
                            <div>
                                <Label>Harga / Tahun</Label>
                                <div className="relative">
                                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                                        Rp
                                    </span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="1000"
                                        value={data.price_yearly}
                                        onChange={(e) => setData("price_yearly", Number(e.target.value))}
                                        className={`${iCls(errors.price_yearly)} pl-9`}
                                        placeholder="0 = Tidak ada opsi tahunan"
                                    />
                                </div>
                                <Hint>0 = tidak ada opsi harga tahunan</Hint>
                                <FieldError msg={errors.price_yearly} />
                            </div>
                            <div>
                                <Label>Trial</Label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="0"
                                        value={data.trial_days}
                                        onChange={(e) => setData("trial_days", Number(e.target.value))}
                                        className={iCls(errors.trial_days)}
                                        placeholder="0 = Tidak ada trial"
                                    />
                                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                                        hari
                                    </span>
                                </div>
                                <FieldError msg={errors.trial_days} />
                            </div>
                        </div>
                    </section>

                    {/* ── Visibilitas & Paket Event ── */}
                    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                        <div className="border-b border-border bg-muted/60 px-6 py-4">
                            <h3 className="text-sm font-bold text-foreground">Visibilitas</h3>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                Atur tampilan paket di landing page dan badge khusus.
                            </p>
                        </div>
                        <div className="space-y-4 p-6">
                            {/* Toggle row */}
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                {[
                                    {
                                        key: "is_active",
                                        label: "Aktif",
                                        desc: "Paket bisa dipilih oleh toko baru",
                                    },
                                    {
                                        key: "is_popular",
                                        label: "Populer",
                                        desc: 'Tampilkan badge "Populer" di landing page',
                                    },
                                    {
                                        key: "is_seasonal",
                                        label: "Event / Musiman",
                                        desc: "Paket khusus event — developer toggle manual",
                                    },
                                ].map(({ key, label, desc }) => (
                                    <label
                                        key={key}
                                        className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-card p-3.5 transition hover:bg-muted"
                                    >
                                        <div
                                            className={`relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors ${data[key] ? "bg-primary" : "bg-muted-foreground/30"}`}
                                        >
                                            <div
                                                className={`absolute top-0.5 h-4 w-4 rounded-full bg-card shadow transition-transform ${data[key] ? "translate-x-4" : "translate-x-0.5"}`}
                                            />
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={data[key]}
                                            onChange={(e) => setData(key, e.target.checked)}
                                            className="sr-only"
                                        />
                                        <div>
                                            <p className="text-sm font-semibold text-foreground">
                                                {label}
                                            </p>
                                            <p className="text-xs text-muted-foreground">{desc}</p>
                                        </div>
                                    </label>
                                ))}
                            </div>

                            {/* Label event — hanya muncul saat is_seasonal aktif */}
                            {data.is_seasonal && (
                                <div>
                                    <Label>Label Event</Label>
                                    <input
                                        value={data.seasonal_label}
                                        onChange={(e) => setData("seasonal_label", e.target.value)}
                                        className={iCls(errors.seasonal_label)}
                                        placeholder="cth. Ramadhan Special · Harbolnas · New Year"
                                        maxLength={100}
                                    />
                                    <Hint>
                                        Teks badge yang tampil di landing page saat paket ini
                                        aktif. Kosongkan untuk memakai label generik "Event".
                                    </Hint>
                                    <FieldError msg={errors.seasonal_label} />
                                </div>
                            )}
                        </div>
                    </section>

                    {/* ── Urutan ── */}
                    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                        <div className="border-b border-border bg-muted/60 px-6 py-4">
                            <h3 className="text-sm font-bold text-foreground">Urutan Tampilan</h3>
                        </div>
                        <div className="p-6">
                            <div className="flex items-center gap-4">
                                <div>
                                    <Label>Urutan</Label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={data.sort_order}
                                        onChange={(e) => setData("sort_order", Number(e.target.value))}
                                        className="w-24 rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
                                    />
                                    <Hint>Bisa diubah via drag & drop di halaman daftar</Hint>
                                </div>
                                {isEdit && (
                                    <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
                                        <strong className="text-foreground">Fitur</strong> dan{" "}
                                        <strong className="text-foreground">Add-on</strong> dikelola
                                        lewat tombol di halaman daftar paket, bukan di sini.
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* ── Actions ── */}
                    <div className="flex items-center justify-end gap-3 pb-6">
                        <Link
                            href={route("developer.plans.index")}
                            className="rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-muted"
                        >
                            Batal
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:opacity-60"
                        >
                            {processing ? (
                                <>
                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                    Menyimpan...
                                </>
                            ) : isEdit ? (
                                "Simpan Perubahan"
                            ) : (
                                "Buat Paket"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </DeveloperLayout>
    );
}
