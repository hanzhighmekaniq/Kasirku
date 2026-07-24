import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader";
import { Head, Link, useForm } from "@inertiajs/react";
import { useMemo, useState } from "react";
import Field from "@/Components/ui/Field";
import Button from "@/Components/ui/Button";
import SectionCard from "@/Components/ui/SectionCard";
import SearchableSelect from "@/Components/ui/SearchableSelect";

const fmtRp = (v) => `Rp ${Number(v || 0).toLocaleString("id-ID")}`;
const inputCls =
    "block w-full rounded-xl border-border text-sm shadow-sm transition focus:border-ring focus:ring-2 focus:ring-ring/20";

export default function Create({ sales }) {
    const { data, setData, post, processing, errors } = useForm({
        sale_id: "",
        return_date: new Date().toISOString().split("T")[0],
        notes: "",
        items: [],
    });

    const [saleItems, setSaleItems] = useState([]);
    const [loadingItems, setLoadingItems] = useState(false);

    const selectedSale = sales.find(
        (s) => String(s.id) === String(data.sale_id),
    );

    const fetchSaleItems = async (saleId) => {
        if (!saleId) {
            setSaleItems([]);
            setData("items", []);
            return;
        }
        setLoadingItems(true);
        try {
            const res = await fetch(
                route("admin.sale-returns.getSaleItems", saleId),
            );
            const json = await res.json();
            setSaleItems(
                json.items.map((i) => ({
                    ...i,
                    selected: false,
                    return_qty: "",
                    reason: "",
                })),
            );
            setData("items", []);
        } catch (e) {
            console.error(e);
        }
        setLoadingItems(false);
    };

    const selectedItems = useMemo(
        () => saleItems.filter((i) => i.selected && i.return_qty > 0),
        [saleItems],
    );

    const subtotal = useMemo(
        () =>
            selectedItems.reduce(
                (sum, i) =>
                    sum +
                    parseFloat(i.return_qty || 0) *
                        parseFloat(i.unit_price || 0),
                0,
            ),
        [selectedItems],
    );

    const toggleItem = (item) => {
        setSaleItems((prev) =>
            prev.map((i) =>
                i.id === item.id
                    ? { ...i, selected: !i.selected, return_qty: "" }
                    : i,
            ),
        );
    };

    const updateItem = (id, field, value) => {
        setSaleItems((prev) =>
            prev.map((i) => (i.id === id ? { ...i, [field]: value } : i)),
        );
    };

    const submit = (e) => {
        e.preventDefault();
        const items = selectedItems.map((i) => ({
            sale_item_id: i.id,
            product_id: i.product_id,
            quantity: parseFloat(i.return_qty),
            unit_price: parseFloat(i.unit_price),
            reason: i.reason || null,
        }));
        setData("items", items);
        post(route("admin.sale-returns.store"));
    };

    return (
        <AuthenticatedLayout
            
            header={
                <div className="leading-tight"
            
            backUrl={route("admin.sale-returns.index")}>
                    <div className="text-sm font-semibold text-foreground">
                        Retur Penjualan
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                        Buat
                    </div>
                </div>
            }>
            <PageHeader
                title="Buat Retur Penjualan"
                breadcrumbs={["Admin", "Retur Penjualan", "Buat"]}
                heading={
                    <>
                        Buat{" "}
                        <span className="bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
                            Retur Penjualan
                        </span>
                    </>
                }
                description="Pilih penjualan yang akan diretur."
                
            />

            <form onSubmit={submit} className="space-y-5">
                {/* Info Card */}
                <SectionCard title="Informasi Retur">
                    <div className="space-y-4">
                        {/* Sale selector */}
                        <Field
                            label="Penjualan Asal"
                            required
                            error={errors.sale_id}
                        >
                            <SearchableSelect
                                options={sales.map((s) => ({
                                    id: s.id,
                                    name: `${s.sale_no} — ${fmtRp(s.grand_total)}${s.customer ? ` · ${s.customer.name}` : ""}`,
                                }))}
                                value={data.sale_id}
                                onChange={(id) => {
                                    setData("sale_id", id);
                                    fetchSaleItems(id);
                                }}
                                placeholder="Pilih penjualan..."
                                searchPlaceholder="Ketik no. penjualan…"
                                error={!!errors.sale_id}
                                required
                            />
                        </Field>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-foreground">
                                    Tanggal Retur
                                </label>
                                <input
                                    type="date"
                                    value={data.return_date}
                                    onChange={(e) =>
                                        setData("return_date", e.target.value)
                                    }
                                    className={inputCls}
                                />
                                {errors.return_date && (
                                    <p className="mt-1 text-xs text-destructive">
                                        {errors.return_date}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-foreground">
                                Catatan
                            </label>
                            <textarea
                                rows={2}
                                value={data.notes}
                                onChange={(e) =>
                                    setData("notes", e.target.value)
                                }
                                className={inputCls}
                                placeholder="Opsional..."
                            />
                            {errors.notes && (
                                <p className="mt-1 text-xs text-destructive">
                                    {errors.notes}
                                </p>
                            )}
                        </div>
                    </div>
                </SectionCard>

                {/* Items Card */}
                {data.sale_id && (
                    <SectionCard
                        title="Item Penjualan"
                        subtitle={
                            selectedSale
                                ? `${selectedSale.sale_no} · Pelanggan: ${selectedSale.customer?.name ?? "-"}`
                                : null
                        }
                    >
                        <div className="-m-6">
                            {loadingItems ? (
                                <p className="px-6 py-8 text-center text-sm text-muted-foreground">
                                    Memuat...
                                </p>
                            ) : saleItems.length === 0 ? (
                                <p className="px-6 py-8 text-center text-sm text-muted-foreground">
                                    Tidak ada item
                                </p>
                            ) : (
                                <div className="divide-y divide-border">
                                    {saleItems.map((item) => (
                                        <div
                                            key={item.id}
                                            className="px-6 py-4 transition hover:bg-muted/50"
                                        >
                                            <div className="flex items-start gap-4">
                                                <input
                                                    type="checkbox"
                                                    checked={item.selected}
                                                    onChange={() =>
                                                        toggleItem(item)
                                                    }
                                                    className="mt-1 h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500"
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-medium text-foreground">
                                                        {item.product_name}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        SKU: {item.product_sku}{" "}
                                                        · Qty: {item.quantity} ·
                                                        Harga:{" "}
                                                        {fmtRp(item.unit_price)}
                                                    </p>
                                                    {item.returned_qty > 0 && (
                                                        <p className="text-xs text-amber-600">
                                                            Sudah diretur:{" "}
                                                            {item.returned_qty}
                                                        </p>
                                                    )}
                                                    <p className="text-xs text-muted-foreground">
                                                        Bisa diretur:{" "}
                                                        {item.returnable_qty}
                                                    </p>
                                                </div>
                                            </div>
                                            {item.selected && (
                                                <div className="mt-3 ml-8 space-y-2">
                                                    <div className="flex gap-3">
                                                        <div className="w-24">
                                                            <label className="block text-xs text-muted-foreground mb-1">
                                                                Qty Retur
                                                            </label>
                                                            <input
                                                                type="number"
                                                                min="0.01"
                                                                step="0.01"
                                                                max={
                                                                    item.returnable_qty
                                                                }
                                                                value={
                                                                    item.return_qty
                                                                }
                                                                onChange={(e) =>
                                                                    updateItem(
                                                                        item.id,
                                                                        "return_qty",
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                className="block w-full rounded-lg border-border py-1.5 text-sm focus:border-ring focus:ring-2 focus:ring-ring/20"
                                                            />
                                                        </div>
                                                        <div className="flex-1">
                                                            <label className="block text-xs text-muted-foreground mb-1">
                                                                Alasan
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={
                                                                    item.reason
                                                                }
                                                                onChange={(e) =>
                                                                    updateItem(
                                                                        item.id,
                                                                        "reason",
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                placeholder="Rusak / salah / lainnya..."
                                                                className="block w-full rounded-lg border-border py-1.5 text-sm focus:border-ring focus:ring-2 focus:ring-ring/20"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </SectionCard>
                )}

                {errors.items && (
                    <p className="text-sm text-destructive">{errors.items}</p>
                )}

                {/* Summary */}
                {selectedItems.length > 0 && (
                    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                        <div className="border-b border-border bg-muted/50 px-6 py-4">
                            <h3 className="text-base font-semibold text-foreground">
                                Ringkasan Retur
                            </h3>
                        </div>
                        <div className="p-6">
                            <div className="space-y-3">
                                {selectedItems.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex items-center justify-between text-sm"
                                    >
                                        <span className="text-muted-foreground">
                                            {item.product_name} ×{" "}
                                            {item.return_qty}
                                        </span>
                                        <span className="font-medium text-foreground">
                                            {fmtRp(
                                                item.return_qty *
                                                    item.unit_price,
                                            )}
                                        </span>
                                    </div>
                                ))}
                                <hr className="border-border" />
                                <div className="flex items-center justify-between text-base">
                                    <span className="font-semibold text-foreground">
                                        Total Retur
                                    </span>
                                    <span className="text-lg font-bold text-primary-600">
                                        {fmtRp(subtotal)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <Link
                        href={route("admin.sale-returns.index")}
                        className="inline-flex items-center justify-center rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted"
                    >
                        Batal
                    </Link>
                    <Button
                        type="submit"
                        loading={processing}
                        disabled={selectedItems.length === 0}
                    >
                        Simpan Retur
                    </Button>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
