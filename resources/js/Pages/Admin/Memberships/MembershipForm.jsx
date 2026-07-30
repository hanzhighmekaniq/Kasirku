import { useMemo } from "react";
import { Plus, Trash2, Zap } from "lucide-react";
import Button from "@/Components/ui/Button";
import CurrencyInput from "@/Components/ui/CurrencyInput";
import SearchableSelect from "@/Components/ui/SearchableSelect";
import Checkbox from "@/Components/ui/Checkbox";
import { Link } from "@inertiajs/react";

/**
 * Form membership yang dipakai bersama halaman Create dan Edit.
 *
 * Sebelumnya form ini hidup di dalam modal pada halaman Index. Field-nya banyak
 * (identitas, durasi, harga, tier, auto-tier, dan builder benefit dinamis),
 * jadi dipindah ke halaman sendiri supaya tidak sempit dan tidak perlu
 * scroll di dalam panel modal.
 */

export const inputCls = (err) =>
    `mt-1 block w-full rounded-xl border px-3.5 py-2.5 text-sm bg-background border-input text-foreground placeholder:text-muted-foreground outline-none shadow-sm transition focus:ring-2 ${
        err
            ? "border-destructive focus:border-destructive focus:ring-destructive/20"
            : "focus:border-ring focus:ring-ring/20"
    }`;

/** Baris benefit baru dengan default sesuai tipe yang dipilih. */
export function emptyBenefit(meta) {
    return {
        type: meta?.type ?? "custom_text",
        label: meta?.label ?? "",
        value: "",
        tier_id: "",
        product_id: "",
        quantity: "",
        min_purchase: "",
        max_amount: "",
    };
}

/**
 * Susun payload yang dikirim ke server.
 *
 * Dipakai lewat transform() di Create/Edit — bukan opsi `data` pada
 * post()/patch(), karena useForm mengabaikan opsi itu.
 */
export function buildPayload(form, customerTiers) {
    const cleanBenefits = form.benefits
        .filter((b) => b.type && b.type !== "maps_to_tier" && (b.label || "").trim())
        .map((b) => ({
            type: b.type,
            label: b.label.trim(),
            value: b.value === "" ? null : Number(b.value),
            tier_id: b.tier_id === "" ? null : Number(b.tier_id),
            product_id: b.product_id === "" ? null : Number(b.product_id),
            quantity: b.quantity === "" ? null : Number(b.quantity),
            min_purchase: b.min_purchase === "" ? null : Number(b.min_purchase),
            max_amount: b.max_amount === "" ? null : Number(b.max_amount),
        }));

    // Dropdown "Setara Tier" disuntikkan sebagai benefit maps_to_tier supaya
    // backend tetap punya satu sumber data benefit.
    if (form.maps_to_tier_id) {
        const targetTier = customerTiers.find(
            (t) => String(t.id) === String(form.maps_to_tier_id),
        );

        if (targetTier) {
            cleanBenefits.unshift({
                type: "maps_to_tier",
                label: `Setara tier ${targetTier.name}`,
                tier: targetTier.name.toLowerCase(),
                tier_id: targetTier.id,
            });
        }
    }

    return {
        ...form,
        price: form.price === "" ? 0 : form.price,
        duration_value: form.duration_value === "" ? 1 : Number(form.duration_value),
        auto_tier_min_spend:
            form.auto_tier_min_spend === "" ? null : form.auto_tier_min_spend,
        auto_tier_window_type: form.auto_tier_window_type || null,
        auto_tier_window_value:
            form.auto_tier_window_value === ""
                ? null
                : Number(form.auto_tier_window_value),
        benefits: cleanBenefits,
    };
}

function Section({ title, description, children, allowOverflow = false, className = "" }) {
    return (
        <section
            className={`rounded-2xl border border-border bg-card shadow-sm ${
                allowOverflow ? "" : "overflow-hidden"
            } ${className}`}
        >
            <div
                className={`border-b border-border bg-muted/50 px-6 py-4 ${
                    allowOverflow ? "rounded-t-2xl" : ""
                }`}
            >
                <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                {description && (
                    <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
                )}
            </div>
            <div className="space-y-4 p-6">{children}</div>
        </section>
    );
}

export default function MembershipForm({
    data,
    setData,
    errors,
    processing,
    onSubmit,
    submitLabel,
    cancelHref,
    benefitTypes = [],
    products = [],
    customerTiers = [],
}) {
    return (
        <form onSubmit={onSubmit} className="mx-auto max-w-3xl space-y-6">
            {/* Identitas — allowOverflow tidak perlu, tidak ada dropdown */}
            <Section title="Identitas" description="Kode dan nama yang dikenali kasir.">
                <div>
                    <label className="block text-sm font-medium text-foreground">
                        Kode <span className="text-destructive">*</span>
                    </label>
                    <input
                        type="text"
                        value={data.code}
                        required
                        onChange={(e) => setData("code", e.target.value)}
                        maxLength={50}
                        className={inputCls(errors.code)}
                        placeholder="Contoh: GOLD01"
                    />
                    {errors.code && (
                        <p className="mt-1 text-xs text-destructive">{errors.code}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-foreground">
                        Nama <span className="text-destructive">*</span>
                    </label>
                    <input
                        type="text"
                        value={data.name}
                        required
                        onChange={(e) => setData("name", e.target.value)}
                        maxLength={255}
                        className={inputCls(errors.name)}
                        placeholder="Contoh: Gold Member"
                    />
                    {errors.name && (
                        <p className="mt-1 text-xs text-destructive">{errors.name}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-foreground">
                        Deskripsi
                    </label>
                    <textarea
                        value={data.description}
                        onChange={(e) => setData("description", e.target.value)}
                        maxLength={500}
                        rows={3}
                        className={inputCls(errors.description)}
                        placeholder="Deskripsi singkat membership..."
                    />
                    {errors.description && (
                        <p className="mt-1 text-xs text-destructive">
                            {errors.description}
                        </p>
                    )}
                </div>
            </Section>

            {/* Durasi & harga — memuat dropdown, jadi overflow dibiarkan */}
            <Section
                title="Durasi & Harga"
                description="Masa berlaku keanggotaan dan biaya bergabung."
                allowOverflow
                className="relative z-30"
            >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <label className="block text-sm font-medium text-foreground">
                            Tipe Durasi <span className="text-destructive">*</span>
                        </label>
                        <div className="mt-1">
                            <SearchableSelect
                                options={[
                                    { id: "day", name: "Hari" },
                                    { id: "month", name: "Bulan" },
                                    { id: "year", name: "Tahun" },
                                    { id: "visit", name: "Kunjungan" },
                                ]}
                                value={data.duration_type}
                                onChange={(v) => setData("duration_type", v)}
                                placeholder="Pilih..."
                                searchable={false}
                            />
                        </div>
                        {errors.duration_type && (
                            <p className="mt-1 text-xs text-destructive">
                                {errors.duration_type}
                            </p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground">
                            Nilai <span className="text-destructive">*</span>
                        </label>
                        <input
                            type="number"
                            min={1}
                            required
                            value={data.duration_value}
                            onChange={(e) => setData("duration_value", e.target.value)}
                            className={inputCls(errors.duration_value)}
                            placeholder="1"
                        />
                        {errors.duration_value && (
                            <p className="mt-1 text-xs text-destructive">
                                {errors.duration_value}
                            </p>
                        )}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-foreground">
                        Harga
                        <span className="ml-1.5 font-normal text-muted-foreground">
                            (kosongkan jika gratis)
                        </span>
                    </label>
                    <div className="mt-1">
                        <CurrencyInput
                            value={data.price}
                            onChange={(v) => setData("price", v)}
                            placeholder="0"
                            error={!!errors.price}
                        />
                    </div>
                    {errors.price && (
                        <p className="mt-1 text-xs text-destructive">{errors.price}</p>
                    )}
                </div>

                <Checkbox
                    checked={data.is_sellable_at_pos}
                    onChange={(e) => setData("is_sellable_at_pos", e.target.checked)}
                    label="Bisa dijual prabayar ke pelanggan"
                />
            </Section>

            {/* Tier & auto-tier */}
            <Section
                title="Tier & Auto-Tier"
                description="Pengaruh membership ini terhadap status pelanggan."
                allowOverflow
                className="relative z-20"
            >
                <div>
                    <label className="block text-sm font-medium text-foreground">
                        Setara Tier
                        <span className="ml-1.5 font-normal text-muted-foreground">
                            (opsional)
                        </span>
                    </label>
                    <div className="mt-1">
                        <SearchableSelect
                            options={customerTiers.map((t) => ({
                                id: t.id,
                                name: `Lvl ${t.rank} — ${t.name}`,
                            }))}
                            value={data.maps_to_tier_id}
                            onChange={(v) => setData("maps_to_tier_id", v)}
                            placeholder="Tidak mengubah tier..."
                        />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Saat paket ini aktif, status pelanggan otomatis menjadi tier yang
                        dipilih.
                    </p>
                </div>

                <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
                    <p className="text-sm font-semibold text-foreground">
                        Auto-Tier (opsional)
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Pelanggan otomatis naik ke tier ini kalau belanjanya melewati
                        ambang berikut. Kosongkan untuk menonaktifkan.
                    </p>
                    <CurrencyInput
                        value={data.auto_tier_min_spend}
                        onChange={(v) => setData("auto_tier_min_spend", v)}
                        placeholder="Ambang belanja, cth. 2000000"
                        error={!!errors.auto_tier_min_spend}
                    />
                    {errors.auto_tier_min_spend && (
                        <p className="text-xs text-destructive">
                            {errors.auto_tier_min_spend}
                        </p>
                    )}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <SearchableSelect
                            options={[
                                { id: "day", name: "Hari" },
                                { id: "month", name: "Bulan" },
                                { id: "year", name: "Tahun" },
                            ]}
                            value={data.auto_tier_window_type}
                            onChange={(v) => setData("auto_tier_window_type", v)}
                            placeholder="Satuan window..."
                            searchable={false}
                        />
                        <input
                            type="number"
                            min={1}
                            value={data.auto_tier_window_value}
                            onChange={(e) =>
                                setData("auto_tier_window_value", e.target.value)
                            }
                            className={`${inputCls(errors.auto_tier_window_value)} mt-0`}
                            placeholder="Nilai, cth. 30"
                        />
                    </div>
                    {errors.auto_tier_window_value && (
                        <p className="text-xs text-destructive">
                            {errors.auto_tier_window_value}
                        </p>
                    )}
                </div>
            </Section>

            {/* Benefit builder */}
            <Section
                title="Benefit"
                description="Benefit bertanda otomatis langsung dijalankan sistem di kasir. Sisanya hanya tampil sebagai informasi."
                allowOverflow
                className="relative z-10"
            >
                <BenefitBuilder
                    benefits={data.benefits}
                    benefitTypes={benefitTypes}
                    products={products}
                    customerTiers={customerTiers}
                    errors={errors}
                    onChange={(next) => setData("benefits", next)}
                />

                <Checkbox
                    checked={data.is_active}
                    onChange={(e) => setData("is_active", e.target.checked)}
                    label="Aktif"
                />
            </Section>

            {/* Actions */}
            <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
                <Button as={Link} href={cancelHref} variant="outline" disabled={processing}>
                    Batal
                </Button>
                <Button type="submit" loading={processing}>
                    {submitLabel}
                </Button>
            </div>
        </form>
    );
}

/* ------------------------------------------------------------------ */
/*  Benefit Builder                                                    */
/* ------------------------------------------------------------------ */
/**
 * Editor benefit dinamis.
 *
 * Field yang muncul per baris ditentukan katalog dari backend
 * (`Membership::BENEFIT_TYPES`), jadi menambah jenis benefit di server langsung
 * tampil di sini tanpa mengubah komponen ini.
 */
function BenefitBuilder({
    benefits,
    benefitTypes,
    products,
    customerTiers,
    errors,
    onChange,
}) {
    // `maps_to_tier` dikecualikan karena sudah punya dropdown khusus di atas.
    const availableTypes = useMemo(
        () => benefitTypes.filter((t) => t.type !== "maps_to_tier"),
        [benefitTypes],
    );

    const metaOf = (type) => availableTypes.find((t) => t.type === type);

    const updateRow = (index, patchObj) => {
        onChange(benefits.map((row, i) => (i === index ? { ...row, ...patchObj } : row)));
    };

    const changeType = (index, type) => {
        const meta = metaOf(type);
        const current = benefits[index];
        const keepLabel =
            current.label && current.label !== metaOf(current.type)?.label;

        updateRow(index, {
            ...emptyBenefit(meta),
            label: keepLabel ? current.label : (meta?.label ?? ""),
        });
    };

    const optionsForRow = (index) => {
        const usedOnce = benefits
            .filter((row, i) => i !== index && metaOf(row.type)?.once)
            .map((row) => row.type);

        return availableTypes
            .filter((t) => !t.once || !usedOnce.includes(t.type))
            .map((t) => ({ id: t.type, name: t.label }));
    };

    const addRow = () => {
        const usedOnce = benefits
            .filter((row) => metaOf(row.type)?.once)
            .map((row) => row.type);
        const next =
            availableTypes.find((t) => !t.once || !usedOnce.includes(t.type)) ??
            availableTypes[0];

        onChange([...benefits, emptyBenefit(next)]);
    };

    const removeRow = (index) => {
        onChange(benefits.filter((_, i) => i !== index));
    };

    const rowError = (index, field) => errors[`benefits.${index}.${field}`];

    return (
        <div>
            <div className="flex items-center justify-end">
                <Button
                    type="button"
                    variant="outline"
                    icon={Plus}
                    onClick={addRow}
                    className="shrink-0"
                >
                    Tambah Benefit
                </Button>
            </div>

            {typeof errors.benefits === "string" && (
                <p className="mt-2 text-xs text-destructive">{errors.benefits}</p>
            )}

            {benefits.length === 0 ? (
                <p className="mt-3 rounded-lg bg-muted px-3 py-6 text-center text-xs text-muted-foreground">
                    Belum ada benefit. Tambahkan minimal satu agar membership ini punya
                    nilai jual.
                </p>
            ) : (
                <div className="mt-3 space-y-3">
                    {benefits.map((row, index) => {
                        const meta = metaOf(row.type);
                        const uses = meta?.uses ?? [];

                        return (
                            <div
                                key={index}
                                className="rounded-xl border border-border bg-muted/30 p-3"
                            >
                                <div className="flex items-start gap-2">
                                    <div className="min-w-0 flex-1 space-y-2">
                                        <SearchableSelect
                                            options={optionsForRow(index)}
                                            value={row.type}
                                            onChange={(v) => changeType(index, v)}
                                            placeholder="Pilih tipe benefit..."
                                        />
                                        {meta?.auto && (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                                                <Zap className="h-3 w-3" strokeWidth={2} />
                                                Otomatis di kasir
                                            </span>
                                        )}
                                        {meta?.description && (
                                            <p className="text-[11px] text-muted-foreground">
                                                {meta.description}
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeRow(index)}
                                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-destructive transition hover:bg-destructive/10"
                                        title="Hapus benefit"
                                    >
                                        <Trash2 className="h-4 w-4" strokeWidth={1.7} />
                                    </button>
                                </div>

                                <div className="mt-2">
                                    <label className="block text-xs font-medium text-foreground">
                                        Label tampilan{" "}
                                        <span className="text-destructive">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={row.label}
                                        maxLength={120}
                                        onChange={(e) =>
                                            updateRow(index, { label: e.target.value })
                                        }
                                        className={inputCls(rowError(index, "label"))}
                                        placeholder="Yang dibaca pelanggan, cth. Gratis ongkir tanpa batas"
                                    />
                                    {rowError(index, "label") && (
                                        <p className="mt-1 text-xs text-destructive">
                                            {rowError(index, "label")}
                                        </p>
                                    )}
                                </div>

                                {meta?.value_kind === "percent" && (
                                    <div className="mt-2">
                                        <label className="block text-xs font-medium text-foreground">
                                            {meta.value_label} (%)
                                        </label>
                                        <input
                                            type="number"
                                            min={0}
                                            max={100}
                                            step={0.01}
                                            value={row.value}
                                            onChange={(e) =>
                                                updateRow(index, {
                                                    value: e.target.value,
                                                })
                                            }
                                            className={inputCls(rowError(index, "value"))}
                                            placeholder="cth. 10"
                                        />
                                    </div>
                                )}

                                {meta?.value_kind === "amount" && (
                                    <div className="mt-2">
                                        <label className="block text-xs font-medium text-foreground">
                                            {meta.value_label}
                                        </label>
                                        <div className="mt-1">
                                            <CurrencyInput
                                                value={row.value}
                                                onChange={(v) =>
                                                    updateRow(index, { value: v })
                                                }
                                                placeholder="cth. 25000"
                                                error={!!rowError(index, "value")}
                                            />
                                        </div>
                                    </div>
                                )}

                                {meta?.value_kind === "number" && (
                                    <div className="mt-2">
                                        <label className="block text-xs font-medium text-foreground">
                                            {meta.value_label}
                                        </label>
                                        <input
                                            type="number"
                                            min={1}
                                            step={1}
                                            value={row.value}
                                            onChange={(e) =>
                                                updateRow(index, {
                                                    value: e.target.value,
                                                })
                                            }
                                            className={inputCls(rowError(index, "value"))}
                                            placeholder="cth. 2"
                                        />
                                    </div>
                                )}

                                {meta?.value_kind === "tier" && (
                                    <div className="mt-2">
                                        <label className="block text-xs font-medium text-foreground">
                                            {meta.value_label}{" "}
                                            <span className="text-destructive">*</span>
                                        </label>
                                        <div className="mt-1">
                                            <SearchableSelect
                                                options={customerTiers.map((t) => ({
                                                    id: t.id,
                                                    name: `Lvl ${t.rank} — ${t.name}`,
                                                }))}
                                                value={row.tier_id}
                                                onChange={(v) =>
                                                    updateRow(index, { tier_id: v })
                                                }
                                                placeholder="Pilih tier..."
                                            />
                                        </div>
                                        {customerTiers.length === 0 && (
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                Belum ada tier. Buat dulu di menu Level
                                                Tier.
                                            </p>
                                        )}
                                        {rowError(index, "tier_id") && (
                                            <p className="mt-1 text-xs text-destructive">
                                                {rowError(index, "tier_id")}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {meta?.value_kind === "product" && (
                                    <div className="mt-2">
                                        <label className="block text-xs font-medium text-foreground">
                                            {meta.value_label}{" "}
                                            <span className="text-destructive">*</span>
                                        </label>
                                        <div className="mt-1">
                                            <SearchableSelect
                                                options={products.map((p) => ({
                                                    id: p.id,
                                                    name: `${p.name}${p.sku ? ` (${p.sku})` : ""}`,
                                                }))}
                                                value={row.product_id}
                                                onChange={(v) =>
                                                    updateRow(index, { product_id: v })
                                                }
                                                placeholder="Cari produk..."
                                            />
                                        </div>
                                        {rowError(index, "product_id") && (
                                            <p className="mt-1 text-xs text-destructive">
                                                {rowError(index, "product_id")}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {(uses.includes("quantity") ||
                                    uses.includes("min_purchase") ||
                                    uses.includes("max_amount")) && (
                                    <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                                        {uses.includes("quantity") && (
                                            <div>
                                                <label className="block text-xs font-medium text-foreground">
                                                    Jumlah
                                                </label>
                                                <input
                                                    type="number"
                                                    min={1}
                                                    value={row.quantity}
                                                    onChange={(e) =>
                                                        updateRow(index, {
                                                            quantity: e.target.value,
                                                        })
                                                    }
                                                    className={inputCls(
                                                        rowError(index, "quantity"),
                                                    )}
                                                    placeholder="1"
                                                />
                                            </div>
                                        )}
                                        {uses.includes("min_purchase") && (
                                            <div>
                                                <label className="block text-xs font-medium text-foreground">
                                                    Min. belanja
                                                </label>
                                                <div className="mt-1">
                                                    <CurrencyInput
                                                        value={row.min_purchase}
                                                        onChange={(v) =>
                                                            updateRow(index, {
                                                                min_purchase: v,
                                                            })
                                                        }
                                                        placeholder="Kosong = tanpa syarat"
                                                        error={
                                                            !!rowError(
                                                                index,
                                                                "min_purchase",
                                                            )
                                                        }
                                                    />
                                                </div>
                                            </div>
                                        )}
                                        {uses.includes("max_amount") && (
                                            <div>
                                                <label className="block text-xs font-medium text-foreground">
                                                    Batas maksimal
                                                </label>
                                                <div className="mt-1">
                                                    <CurrencyInput
                                                        value={row.max_amount}
                                                        onChange={(v) =>
                                                            updateRow(index, {
                                                                max_amount: v,
                                                            })
                                                        }
                                                        placeholder="Kosong = tanpa batas"
                                                        error={
                                                            !!rowError(
                                                                index,
                                                                "max_amount",
                                                            )
                                                        }
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
