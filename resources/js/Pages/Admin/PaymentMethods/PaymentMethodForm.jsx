import { Link } from '@inertiajs/react';
import { Banknote, CreditCard, FileClock, ImagePlus, Lock, Smartphone, Upload, X } from 'lucide-react';
import Button from "@/Components/ui/Button";
import Field from "@/Components/ui/Field";

const TYPE_META = {
    cash:    { label: 'Tunai',          icon: Banknote,    desc: 'Uang tunai fisik' },
    digital: { label: 'Digital / QRIS', icon: Smartphone,  desc: 'E-wallet, QRIS, transfer' },
    card:    { label: 'Kartu',          icon: CreditCard,  desc: 'Debit atau kredit' },
    credit:  { label: 'Kredit / Tempo', icon: FileClock,   desc: 'Piutang / pembayaran tunda' },
};

const inp = (err) =>
    `mt-1.5 block w-full rounded-xl border py-2.5 px-3.5 text-sm shadow-sm transition focus:outline-none focus:ring-2 ${
        err
            ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
            : 'border-border focus:border-ring focus:ring-ring/20'
    }`;

export default function PaymentMethodForm({
    data,
    setData,
    errors,
    processing,
    onSubmit,
    submitLabel = 'Simpan',
    cancelHref,
    types,
    imagePreview,
    onImageChange,
    onRemoveImage,
    isTypeLocked = false,
    lockedTypeName = 'Tunai',
}) {
    return (
        <form onSubmit={onSubmit} className="space-y-6">
            {/* Kode & Nama */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Field label="Kode" required error={errors.code}>
                    <input
                        id="code"
                        type="text"
                        value={data.code}
                        onChange={(e) => setData('code', e.target.value.toUpperCase())}
                        placeholder="cth. CASH, QRIS, CARD"
                        maxLength={50}
                        className={`${inp(errors.code)} font-mono uppercase tracking-wide`}
                    />
                    <p className="mt-1.5 text-xs text-muted-foreground">
                        Huruf kapital tanpa spasi — dipakai sebagai ID unik.
                    </p>
                </Field>

                <Field label="Nama" required error={errors.name}>
                    <input
                        id="name"
                        type="text"
                        value={data.name}
                        autoFocus
                        onChange={(e) => setData('name', e.target.value)}
                        placeholder="cth. Tunai, QRIS GoPay"
                        className={inp(errors.name)}
                    />
                </Field>
            </div>

            {/* Tipe */}
            <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                    Tipe <span className="text-destructive">*</span>
                    {isTypeLocked && (
                        <span className="ml-2 inline-flex items-center gap-1 text-[11px] font-normal text-muted-foreground">
                            <Lock size={11} strokeWidth={2} /> {lockedTypeName} wajib, tidak bisa diubah
                        </span>
                    )}
                </label>
                <div className={`grid grid-cols-2 gap-3 sm:grid-cols-4 ${isTypeLocked ? 'opacity-60 pointer-events-none' : ''}`}>
                    {types.map((t) => {
                        const meta = TYPE_META[t] ?? { label: t, icon: CreditCard, desc: '' };
                        const Icon = meta.icon;
                        const selected = data.type === t;
                        return (
                            <button
                                key={t}
                                type="button"
                                onClick={() => setData('type', t)}
                                disabled={isTypeLocked}
                                className={`relative flex flex-col items-start gap-2 rounded-xl border p-3.5 text-left transition ${
                                    selected
                                        ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20'
                                        : 'border-border bg-card hover:border-primary/30 hover:bg-muted/50'
                                }`}
                            >
                                <span
                                    className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${
                                        selected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                                    }`}
                                >
                                    <Icon size={17} strokeWidth={2} />
                                </span>
                                <div>
                                    <p className={`text-sm font-semibold ${selected ? 'text-primary' : 'text-foreground'}`}>
                                        {meta.label}
                                    </p>
                                    <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{meta.desc}</p>
                                </div>
                            </button>
                        );
                    })}
                </div>
                {errors.type && <p className="mt-2 text-xs text-destructive">{errors.type}</p>}
            </div>

            {/* Provider */}
            <Field label="Provider" error={errors.provider}>
                <input
                    id="provider"
                    type="text"
                    value={data.provider}
                    onChange={(e) => setData('provider', e.target.value)}
                    placeholder="cth. GoPay, OVO, BCA, Mandiri (opsional)"
                    className={inp(errors.provider)}
                />
                <p className="mt-1.5 text-xs text-muted-foreground">Nama bank atau platform pembayaran, jika relevan.</p>
            </Field>

            {/* Nomor Rekening / HP */}
            <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Info Transfer Manual</p>
                <p className="text-xs text-muted-foreground -mt-2">
                    Isi jika metode ini dipakai untuk transfer bank atau e-wallet manual. Nomor akan muncul sebagai teks yang bisa disalin kasir.
                </p>
                <Field label="Nomor Rekening / HP" error={errors.account_number}>
                    <input
                        type="text"
                        value={data.account_number ?? ''}
                        onChange={(e) => setData('account_number', e.target.value)}
                        placeholder="cth. 1234567890 atau 0812xxxx"
                        className={inp(errors.account_number)}
                    />
                </Field>
                <Field label="Atas Nama" error={errors.account_name}>
                    <input
                        type="text"
                        value={data.account_name ?? ''}
                        onChange={(e) => setData('account_name', e.target.value)}
                        placeholder="cth. PT Toko Sejahtera"
                        className={inp(errors.account_name)}
                    />
                </Field>
            </div>

            {/* Gambar */}
            <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Gambar</label>
                <p className="mb-2.5 text-xs text-muted-foreground">
                    Opsional — tampilkan QR statis agar kasir bisa tunjukkan langsung ke pelanggan.
                </p>
                <div className="flex items-start gap-4">
                    <div
                        className="group relative flex h-28 w-28 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-border bg-muted/40 transition hover:border-primary hover:bg-primary/5"
                        onClick={() => document.getElementById('pmImageInput').click()}
                    >
                        {imagePreview ? (
                            <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                        ) : (
                            <div className="flex flex-col items-center gap-1 px-2 text-center">
                                <ImagePlus size={20} className="text-muted-foreground/60" strokeWidth={1.75} />
                                <span className="text-[10px] leading-tight text-muted-foreground/70">Klik pilih</span>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-1 flex-col gap-2 pt-1">
                        <input
                            id="pmImageInput"
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={onImageChange}
                            className="hidden"
                        />
                        <button
                            type="button"
                            onClick={() => document.getElementById('pmImageInput').click()}
                            className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted"
                        >
                            <Upload size={13} strokeWidth={2} />
                            {imagePreview ? 'Ganti gambar' : 'Pilih gambar'}
                        </button>
                        {imagePreview && (
                            <button
                                type="button"
                                onClick={onRemoveImage}
                                className="inline-flex w-fit items-center gap-1.5 text-xs font-medium text-destructive transition hover:text-destructive/80"
                            >
                                <X size={13} strokeWidth={2} />
                                Hapus gambar
                            </button>
                        )}
                        <p className="text-[11px] text-muted-foreground/70">JPG, PNG, atau WebP — maks 2MB.</p>
                    </div>
                </div>
                {errors.image && <p className="mt-1.5 text-xs text-destructive">{errors.image}</p>}
            </div>

            {/* Status aktif */}
            <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 p-4">
                <button
                    type="button"
                    role="switch"
                    aria-checked={data.is_active}
                    onClick={() => setData('is_active', !data.is_active)}
                    className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                        data.is_active ? 'bg-primary' : 'bg-muted-foreground/25'
                    }`}
                >
                    <span
                        className={`pointer-events-none inline-block h-5 w-5 translate-y-0.5 transform rounded-full bg-card shadow transition duration-200 ${
                            data.is_active ? 'translate-x-5' : 'translate-x-0.5'
                        }`}
                    />
                </button>
                <div>
                    <p className="text-sm font-medium text-foreground">{data.is_active ? 'Aktif' : 'Nonaktif'}</p>
                    <p className="text-xs text-muted-foreground">
                        {data.is_active
                            ? 'Metode ini tampil dan bisa dipilih kasir saat transaksi.'
                            : 'Metode ini disembunyikan dari kasir dan tidak bisa dipilih.'}
                    </p>
                </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
                <Link
                    href={cancelHref}
                    className="inline-flex items-center justify-center rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted"
                >
                    Batal
                </Link>
                <Button type="submit" loading={processing}>
                    {submitLabel}
                </Button>
            </div>
        </form>
    );
}
