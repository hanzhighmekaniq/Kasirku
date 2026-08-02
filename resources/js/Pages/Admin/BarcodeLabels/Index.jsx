import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader";
import { Head } from "@inertiajs/react";
import { useState, useRef, useEffect } from "react";
import Button from "@/Components/ui/Button";
import SearchableSelect from "@/Components/ui/SearchableSelect";
import { Printer, X, Barcode } from "lucide-react";
import JsBarcode from "jsbarcode";

const LABEL_TEMPLATES = [
    { id: "standard", name: "Standar (103×38mm)", width: 103, height: 38, fontSize: 11, barcodeHeight: 25 },
    { id: "small", name: "Kecil (64×34mm)", width: 64, height: 34, fontSize: 9, barcodeHeight: 20 },
    { id: "mini", name: "Mini (38×22mm)", width: 38, height: 22, fontSize: 7, barcodeHeight: 15 },
];

const fmt = (n) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(n ?? 0);

export default function Index({ products }) {
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [quantities, setQuantities] = useState({});
    const [template, setTemplate] = useState(LABEL_TEMPLATES[0]);
    const [showPreview, setShowPreview] = useState(false);
    const printRef = useRef(null);

    const addProduct = (productId) => {
        const id = Number(productId);
        if (!id || selectedProducts.includes(id)) return;
        setSelectedProducts((prev) => [...prev, id]);
        setQuantities((prev) => ({ ...prev, [id]: 1 }));
    };

    const removeProduct = (id) => {
        setSelectedProducts((prev) => prev.filter((pid) => pid !== id));
        setQuantities((prev) => {
            const copy = { ...prev };
            delete copy[id];
            return copy;
        });
    };

    const updateQty = (id, qty) => {
        setQuantities((prev) => ({ ...prev, [id]: Math.max(1, qty) }));
    };

    const productOptions = products
        .filter((p) => !selectedProducts.includes(p.id))
        .map((p) => ({
            value: p.id,
            label: `${p.name} (${p.sku})${p.barcode ? ` - ${p.barcode}` : ""}`,
        }));

    const handlePrint = () => {
        setShowPreview(true);
    };

    useEffect(() => {
        if (!showPreview || !printRef.current) return;
        const timer = setTimeout(() => window.print(), 600);
        return () => clearTimeout(timer);
    }, [showPreview]);

    const selectedItems = selectedProducts.map((id) => ({
        ...products.find((p) => p.id === id),
        qty: quantities[id] || 1,
    }));

    const totalLabels = selectedItems.reduce((sum, item) => sum + item.qty, 0);

    return (
        <>
            <Head title="Label Barcode" />

            <style>{`
                @media print {
                    body > *:not(.print-area) { display: none !important; }
                    .print-area { display: block !important; }
                    @page { margin: 5mm; }
                    .label-item {
                        display: inline-block;
                        width: ${template.width}mm;
                        height: ${template.height}mm;
                        padding: 2mm;
                        margin: 1mm;
                        border: 0.5px solid #ccc;
                        text-align: center;
                        page-break-inside: avoid;
                        overflow: hidden;
                    }
                    .label-item svg { max-width: 100%; height: auto; }
                    .label-name { font-size: ${template.fontSize}px; font-weight: bold; margin: 1mm 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
                    .label-price { font-size: ${template.fontSize - 1}px; }
                    .label-sku { font-size: ${template.fontSize - 2}px; color: #666; }
                }
            `}</style>

            {showPreview && (
                <div className="print-area" style={{ display: "none" }}>
                    {selectedItems.map((item) =>
                        Array.from({ length: item.qty }).map((_, i) => (
                            <div key={`${item.id}-${i}`} className="label-item">
                                <BarcodeImage
                                    value={item.barcode || item.sku}
                                    height={template.barcodeHeight}
                                />
                                <div className="label-name">{item.name}</div>
                                <div className="label-price">{fmt(item.sell_price)}</div>
                                <div className="label-sku">{item.sku}</div>
                            </div>
                        ))
                    )}
                </div>
            )}

            <AuthenticatedLayout>
                <PageHeader
                    title="Label Barcode"
                    breadcrumbs={[
                        { label: "Master Data", href: route("admin.products.index") },
                        { label: "Label Barcode" },
                    ]}
                    heading="Cetak Label Barcode"
                    description="Pilih produk, atur ukuran label, dan cetak barcode untuk rak atau stiker."
                />

                <div className="mt-6 grid gap-6 lg:grid-cols-3">
                    {/* LEFT: Selection */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="rounded-xl border border-border bg-card p-6">
                            <h3 className="mb-4 text-base font-semibold text-foreground">Pilih Produk</h3>
                            <SearchableSelect
                                options={productOptions}
                                value=""
                                onChange={addProduct}
                                placeholder="Cari produk untuk ditambahkan..."
                            />

                            {selectedItems.length > 0 && (
                                <div className="mt-4 divide-y divide-border">
                                    {selectedItems.map((item) => (
                                        <div key={item.id} className="flex items-center gap-4 py-3">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                                                <p className="text-xs text-muted-foreground">{item.sku}{item.barcode ? ` • ${item.barcode}` : ""}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <label className="text-xs text-muted-foreground">Qty:</label>
                                                <input
                                                    type="number"
                                                    min={1}
                                                    max={100}
                                                    value={item.qty}
                                                    onChange={(e) => updateQty(item.id, Number(e.target.value) || 1)}
                                                    className="w-16 rounded border border-border bg-card px-2 py-1 text-center text-sm text-foreground"
                                                />
                                            </div>
                                            <button
                                                onClick={() => removeProduct(item.id)}
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

                    {/* RIGHT: Settings & Print */}
                    <div className="space-y-6">
                        <div className="rounded-xl border border-border bg-card p-6">
                            <h3 className="mb-4 text-base font-semibold text-foreground">Pengaturan Label</h3>

                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-muted-foreground">Ukuran Label</label>
                                <div className="space-y-2">
                                    {LABEL_TEMPLATES.map((t) => (
                                        <label
                                            key={t.id}
                                            className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition ${template.id === t.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted"}`}
                                        >
                                            <input
                                                type="radio"
                                                name="template"
                                                checked={template.id === t.id}
                                                onChange={() => setTemplate(t)}
                                                className="text-primary"
                                            />
                                            <div>
                                                <p className="text-sm font-medium text-foreground">{t.name}</p>
                                                <p className="text-xs text-muted-foreground">{t.width} × {t.height}mm</p>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl border border-border bg-card p-6">
                            <div className="mb-4 flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Total Label</span>
                                <span className="text-lg font-bold text-foreground">{totalLabels}</span>
                            </div>
                            <Button
                                variant="primary"
                                className="w-full"
                                disabled={selectedItems.length === 0}
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
