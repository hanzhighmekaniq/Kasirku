import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader";
import { Head } from "@inertiajs/react";
import { useState, useRef, useEffect, useMemo } from "react";
import * as ReactDOM from "react-dom";
import Button from "@/Components/ui/Button";
import StockBucketPicker, { BucketItemLabel } from "@/Components/ui/StockBucketPicker";
import SearchableSelect from "@/Components/ui/SearchableSelect";
import { Printer, X } from "lucide-react";
import JsBarcode from "jsbarcode";

/**
 * Template label — sistem slot-based (data-driven).
 *
 * Setiap template hanya mendeskripsikan ukuran fisik + urutan `slots` yang
 * mau ditampilkan. Satu komponen `LabelSlot` merender semua tipe slot, jadi
 * menambah template baru = menambah 1 object di sini, tanpa menyentuh
 * renderer atau CSS. `height: "auto"` dipakai untuk template yang tingginya
 * menyesuaikan isi (mis. thermal).
 */
const LABEL_TEMPLATES = [
    {
        id: "retail-std",
        name: "Retail Standar",
        desc: "Produk + varian + harga + barcode",
        width: 100, height: 40,
        fontSize: 11, barcodeHeight: 22,
        slots: [
            { type: "name", style: "bold" },
            { type: "variant", style: "muted" },
            { type: "price", style: "normal" },
            { type: "sku", style: "small" },
            { type: "barcode" },
        ],
    },
    {
        id: "price-tag",
        name: "Price Tag",
        desc: "Toko + harga besar + barcode",
        width: 80, height: 38,
        fontSize: 10, barcodeHeight: 18,
        slots: [
            { type: "store", style: "caps" },
            { type: "name", style: "bold" },
            { type: "price", style: "large" },
            { type: "barcode" },
        ],
    },
    {
        id: "grosir",
        name: "Grosir",
        desc: "Produk + harga grosir + barcode",
        width: 80, height: 35,
        fontSize: 10, barcodeHeight: 16,
        slots: [
            { type: "name", style: "bold" },
            { type: "price", style: "normal" },
            { type: "barcode" },
            { type: "sku", style: "small" },
        ],
    },
    {
        id: "fashion",
        name: "Fashion / Varian",
        desc: "Brand + varian + harga + barcode",
        width: 75, height: 35,
        fontSize: 10, barcodeHeight: 16,
        slots: [
            { type: "store", style: "caps" },
            { type: "variant", style: "bold" },
            { type: "price", style: "normal" },
            { type: "barcode" },
        ],
    },
    {
        id: "sku-only",
        name: "SKU Minimalis",
        desc: "SKU + barcode saja",
        width: 50, height: 25,
        fontSize: 8, barcodeHeight: 14,
        slots: [
            { type: "sku", style: "code" },
            { type: "barcode" },
        ],
    },
    {
        id: "supermarket",
        name: "Supermarket",
        desc: "Produk + harga/satuan + barcode",
        width: 100, height: 50,
        fontSize: 11, barcodeHeight: 24,
        slots: [
            { type: "name", style: "bold" },
            { type: "unitprice", style: "normal" },
            { type: "barcode" },
            { type: "sku", style: "small" },
        ],
    },
    {
        id: "optik",
        name: "Optik / Kode Item",
        desc: "Kode item + produk + harga + barcode",
        width: 70, height: 30,
        fontSize: 9, barcodeHeight: 14,
        slots: [
            { type: "sku", style: "code" },
            { type: "name", style: "bold" },
            { type: "price", style: "normal" },
            { type: "barcode" },
        ],
    },
    {
        id: "diskon",
        name: "Diskon",
        desc: "Harga coret + harga baru + barcode",
        width: 80, height: 38,
        fontSize: 10, barcodeHeight: 18,
        slots: [
            { type: "name", style: "bold" },
            { type: "price-old", style: "strike" },
            { type: "price", style: "large" },
            { type: "barcode" },
        ],
    },
    {
        id: "thermal",
        name: "Lembar Thermal",
        desc: "Toko + produk + harga besar + barcode",
        width: 76, height: "auto",
        fontSize: 11, barcodeHeight: 28,
        slots: [
            { type: "store", style: "caps" },
            { type: "name", style: "bold" },
            { type: "variant", style: "muted" },
            { type: "price", style: "large" },
            { type: "barcode" },
            { type: "sku", style: "small" },
        ],
    },
];

const fmt = (n) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(n ?? 0);

/**
 * Style kotak label — dipakai untuk preview di layar.
 *
 * Sengaja pakai unit `mm` langsung (bukan konversi manual ke px): browser
 * menerjemahkan `mm` ke ukuran fisik yang proporsional di layar, jadi
 * preview ini menunjukkan proporsi asli label tanpa perlu logic scaling
 * terpisah dari CSS print di bawah.
 */
function labelBoxStyle(template) {
    return {
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: "1mm",
        width: `${template.width}mm`,
        height: template.height === "auto" ? "auto" : `${template.height}mm`,
        minHeight: template.height === "auto" ? "20mm" : undefined,
        padding: "2mm",
        border: "1px solid rgb(var(--border))",
        background: "white",
        color: "#1a1a1a",
        textAlign: "center",
        overflow: "hidden",
    };
}

export default function Index({ buckets = [], storeName = "" }) {
    const [items, setItems] = useState([]);
    const [template, setTemplate] = useState(LABEL_TEMPLATES[0]);

    const usedKeys = useMemo(() => new Set(items.map((i) => i.key)), [items]);

    /** Satu item = satu bucket (produk + variant + satuan) yang dipilih dari picker. */
    const addItem = (bucket) => {
        if (usedKeys.has(bucket.key)) return;

        setItems((prev) => [
            ...prev,
            {
                key: bucket.key,
                product_id: bucket.product_id,
                variant_id: bucket.variant_id,
                packaging_unit_id: bucket.packaging_unit_id,
                product_name: bucket.product_name,
                product_sku: bucket.product_sku,
                variant_name: bucket.variant_name,
                unit_name: bucket.unit_name,
                conversion_qty: bucket.conversion_qty,
                barcode: bucket.barcode,
                sell_price: bucket.sell_price,
                qty: 1,
            },
        ]);
    };

    const removeItem = (key) => {
        setItems((prev) => prev.filter((i) => i.key !== key));
    };

    const updateQty = (key, qty) => {
        setItems((prev) =>
            prev.map((i) => (i.key === key ? { ...i, qty: Math.max(1, qty) } : i)),
        );
    };

    const handlePrint = () => {
        // Portal-nya selalu ter-render (disembunyikan lewat @media screen di
        // bawah), jadi tidak perlu delay/toggle state — beda dengan versi
        // lama yang baru me-render .print-area setelah setShowPreview(true).
        window.print();
    };

    const totalLabels = items.reduce((sum, item) => sum + item.qty, 0);

    // Data contoh dipakai preview saat belum ada produk dipilih, supaya user
    // tetap bisa melihat bentuk template sebelum menambahkan item apa pun.
    const demoItem = {
        product_name: "Contoh Produk",
        variant_name: "Varian Contoh",
        product_sku: "SKU-0001",
        barcode: "1234567890128",
        sell_price: 15000,
        unit_name: "pcs",
    };
    const previewItem = items[0] ?? demoItem;

    const labelSheet = (
        <div className="print-only-labels">
            {items.map((item) =>
                Array.from({ length: item.qty }).map((_, i) => (
                    <div key={`${item.key}-${i}`} className="label-item">
                        {template.slots.map((slot, si) => (
                            <LabelSlot
                                key={si}
                                type={slot.type}
                                slotStyle={slot.style}
                                item={item}
                                template={template}
                                storeName={storeName}
                            />
                        ))}
                    </div>
                ))
            )}
        </div>
    );

    return (
        <>
            {/* CSS untuk layar vs print — pola sama dengan ReceiptModal:
                di layar .print-only-labels disembunyikan, saat print SEMUA
                direct-child body lain (termasuk #app) disembunyikan supaya
                cuma label yang tercetak. */}
            <style>{`
                @media screen {
                    .print-only-labels { display: none !important; }
                }
                @media print {
                    body > *:not(.print-only-labels) {
                        display: none !important;
                    }
                    body {
                        margin: 0 !important;
                        padding: 0 !important;
                        background: white !important;
                    }
                    .print-only-labels {
                        display: block !important;
                    }
                    @page { margin: 5mm; }
                    .label-item {
                        display: flex !important;
                        flex-direction: column;
                        justify-content: center;
                        align-items: center;
                        gap: 0.5mm;
                        width: ${template.width}mm;
                        height: ${template.height === "auto" ? "auto" : `${template.height}mm`};
                        padding: 2mm;
                        margin: 1mm;
                        border: 0.5px solid #ccc;
                        text-align: center;
                        page-break-inside: avoid;
                        overflow: hidden;
                        break-inside: avoid;
                    }
                    .print-only-labels {
                        display: flex !important;
                        flex-wrap: wrap;
                    }
                    .label-item svg { max-width: 100%; height: auto; }
                    .label-text {
                        display: block !important;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        max-width: 100%;
                        line-height: 1.2;
                        font-size: ${template.fontSize}px;
                    }
                }
            `}</style>

            {/* Portal langsung ke body agar .print-only-labels jadi direct
                child <body>, sejajar dengan #app — bukan nested di
                dalamnya. Kalau tidak di-portal, selector
                `body > *:not(.print-only-labels)` di atas tetap akan
                menyembunyikan #app (ancestor-nya), sehingga label ikut
                tidak terlihat walau class-nya sendiri diberi display:block. */}
            {ReactDOM.createPortal(labelSheet, document.body)}

            <AuthenticatedLayout
                header={
                    <div className="leading-tight">
                        <div className="text-sm font-semibold text-foreground">
                            Cetak Label Barcode
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                            Manajemen
                        </div>
                    </div>
                }
            >
                <PageHeader
                    title="Label Barcode"
                    breadcrumbs={["Admin", "Label Barcode"]}
                    heading={
                        <>
                            Cetak{" "}
                            <span className="bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
                                Label Barcode
                            </span>
                        </>
                    }
                    description="Pilih produk atau variant, pilih template label, dan cetak barcode."
                />

                <div className="grid gap-6 lg:grid-cols-3">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="rounded-xl border border-border bg-card p-6">
                                <h3 className="mb-4 text-base font-semibold text-foreground">Pilih Produk</h3>
                                <StockBucketPicker
                                    buckets={buckets}
                                    excludeKeys={usedKeys}
                                    onSelect={addItem}
                                    placeholder="Pilih produk / variant / satuan"
                                />
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Produk dengan variant atau multi-satuan bisa dipilih sampai level
                                    yang paling spesifik.
                                </p>

                                {items.length > 0 && (
                                    <div className="mt-4 divide-y divide-border">
                                        {items.map((item) => (
                                            <div key={item.key} className="flex items-center gap-4 py-3">
                                                <div className="flex-1 min-w-0">
                                                    <BucketItemLabel item={item} />
                                                    {item.barcode && (
                                                        <p className="mt-0.5 text-xs text-muted-foreground">
                                                            {item.barcode}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <label className="text-xs text-muted-foreground">Qty:</label>
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        max={100}
                                                        value={item.qty}
                                                        onChange={(e) => updateQty(item.key, Number(e.target.value) || 1)}
                                                        className="w-16 rounded border border-border bg-card px-2 py-1 text-center text-sm text-foreground"
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => removeItem(item.key)}
                                                    className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-destructive"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Sidebar sticky — preview di atas, dropdown template, lalu ringkasan + cetak */}
                        <div className="space-y-6 lg:sticky lg:top-20 lg:self-start">
                            {/* Preview live */}
                            <div className="rounded-xl border border-border bg-card p-6">
                                <div className="mb-4 flex items-center justify-between">
                                    <h3 className="text-base font-semibold text-foreground">Preview Label</h3>
                                    {items.length === 0 && (
                                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                            Contoh
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center justify-center rounded-lg bg-muted/40 p-4">
                                    <div style={labelBoxStyle(template)}>
                                        {template.slots.map((slot, si) => (
                                            <LabelSlot
                                                key={si}
                                                type={slot.type}
                                                slotStyle={slot.style}
                                                item={previewItem}
                                                template={template}
                                                storeName={storeName}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <p className="mt-3 text-center text-xs text-muted-foreground">
                                    {template.name} — {template.width} × {template.height === "auto" ? "auto" : template.height}mm
                                </p>
                            </div>

                            {/* Pilih template — dropdown */}
                            <div className="rounded-xl border border-border bg-card p-6">
                                <SearchableSelect
                                    options={LABEL_TEMPLATES.map((t) => ({
                                        id: t.id,
                                        name: `${t.name} (${t.width}×${t.height === "auto" ? "auto" : t.height}mm)`,
                                    }))}
                                    value={template.id}
                                    onChange={(id) => {
                                        const found = LABEL_TEMPLATES.find((t) => t.id === id);
                                        if (found) setTemplate(found);
                                    }}
                                    placeholder="Cari template..."
                                />
                            </div>

                            {/* Total + Cetak */}
                            <div className="rounded-xl border border-border bg-card p-6">
                                <div className="mb-4 flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Total Label</span>
                                    <span className="text-lg font-bold text-foreground">{totalLabels}</span>
                                </div>
                                <Button
                                    variant="primary"
                                    className="w-full"
                                    disabled={items.length === 0}
                                    onClick={handlePrint}
                                >
                                    <Printer className="mr-2 h-4 w-4" /> Cetak Label
                                </Button>
                            </div>
                        </div>
                    </div>
            </AuthenticatedLayout>
        </>
    );
}

/**
 * Renderer tunggal untuk semua tipe slot label.
 *
 * Menambah template baru tidak perlu menyentuh komponen ini — cukup susun
 * ulang `slots` di LABEL_TEMPLATES. Slot yang datanya kosong (mis. `variant`
 * tanpa variant, `store` tanpa nama toko) otomatis tidak dirender.
 */
function LabelSlot({ type, slotStyle, item, template, storeName }) {
    switch (type) {
        case "name":
            return (
                <div
                    className="label-text"
                    style={{ fontWeight: slotStyle === "bold" ? 700 : 400 }}
                >
                    {item.product_name}
                </div>
            );

        case "variant":
            if (!item.variant_name) return null;
            return (
                <div
                    className="label-text"
                    style={
                        slotStyle === "muted"
                            ? { color: "#666", fontSize: `${template.fontSize - 1}px` }
                            : { fontWeight: 700 }
                    }
                >
                    {item.variant_name}
                </div>
            );

        case "store":
            if (!storeName) return null;
            return (
                <div
                    className="label-text"
                    style={{
                        fontWeight: 700,
                        textTransform: slotStyle === "caps" ? "uppercase" : "none",
                        letterSpacing: "0.5px",
                        fontSize: `${Math.max(template.fontSize - 2, 6)}px`,
                    }}
                >
                    {storeName}
                </div>
            );

        case "price":
            return (
                <div
                    className="label-text"
                    style={
                        slotStyle === "large"
                            ? { fontWeight: 900, fontSize: `${template.fontSize + 4}px` }
                            : { fontWeight: 600 }
                    }
                >
                    {fmt(item.sell_price)}
                </div>
            );

        case "price-old":
            // Placeholder: belum ada field harga-asli tersendiri di bucket,
            // jadi harga coret dihitung 1.2x harga jual supaya template
            // diskon tetap bisa dipakai. Bisa diganti field asli nanti tanpa
            // mengubah struktur slot ini.
            return (
                <div
                    className="label-text"
                    style={{
                        textDecoration: "line-through",
                        color: "#999",
                        fontSize: `${Math.max(template.fontSize - 2, 6)}px`,
                    }}
                >
                    {fmt(item.sell_price * 1.2)}
                </div>
            );

        case "unitprice":
            return (
                <div className="label-text" style={{ fontWeight: 600 }}>
                    {fmt(item.sell_price)}
                    {item.unit_name ? ` / ${item.unit_name}` : ""}
                </div>
            );

        case "sku":
            return (
                <div
                    className="label-text"
                    style={
                        slotStyle === "code"
                            ? {
                                  fontWeight: 700,
                                  letterSpacing: "1px",
                                  fontSize: `${template.fontSize + 2}px`,
                              }
                            : { color: "#888", fontSize: `${Math.max(template.fontSize - 2, 6)}px` }
                    }
                >
                    {item.product_sku}
                </div>
            );

        case "barcode":
            return (
                <BarcodeImage
                    value={item.barcode || item.product_sku}
                    height={template.barcodeHeight}
                />
            );

        default:
            return null;
    }
}

function BarcodeImage({ value, height = 25 }) {
    const svgRef = useRef(null);

    useEffect(() => {
        if (svgRef.current && value) {
            try {
                JsBarcode(svgRef.current, value, {
                    format: "CODE128",
                    width: 1.5,
                    height,
                    displayValue: false,
                    margin: 0,
                });
            } catch (e) {
                // Invalid barcode value
            }
        }
    }, [value, height]);

    return <svg ref={svgRef} />;
}
