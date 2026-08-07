import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader";
import { Head, router, useForm } from "@inertiajs/react";
import { useState, useMemo } from "react";
import { Plus, Search } from "lucide-react";
import Button from "@/Components/ui/Button";
import Modal from "@/Components/Modal";

const fmt = (val) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(val);

const TYPE_BADGE = {
    deposit: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    usage: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const TYPE_LABEL = { deposit: "Deposit", usage: "Penggunaan" };

export default function Index({ deposits }) {
    const [search, setSearch] = useState("");
    const [showCreate, setShowCreate] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        customer_id: "",
        amount: "",
        payment_method: "cash",
        deposit_at: new Date().toISOString().split("T")[0],
        notes: "",
    });

    const items = deposits.data || deposits;

    const filtered = useMemo(() => {
        if (!search) return items;
        const q = search.toLowerCase();
        return items.filter(
            (d) =>
                d.deposit_no?.toLowerCase().includes(q) ||
                d.customer?.name?.toLowerCase().includes(q),
        );
    }, [items, search]);

    const submitCreate = (e) => {
        e.preventDefault();
        post(route("admin.customer-deposits.store"), {
            onSuccess: () => { setShowCreate(false); reset(); },
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    title="Deposit Pelanggan"
                    breadcrumbs={["Dashboard", "Deposit Pelanggan"]}
                    heading="Deposit Pelanggan"
                    description="Kelola uang muka dan cicilan pelanggan."
                    actions={<Button onClick={() => setShowCreate(true)} icon={Plus}>Tambah Deposit</Button>}
                />
            }
        >
            <Head title="Deposit Pelanggan" />

            <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                    <div className="border-b border-border p-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Cari no. deposit atau nama pelanggan..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full rounded-lg border border-border bg-background py-2 pl-10 pr-4 text-sm text-card-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                        </div>
                    </div>

                    <div className="hidden md:block">
                        <table className="min-w-full divide-y divide-border">
                            <thead className="bg-popover text-xs uppercase tracking-wide text-card-foreground">
                                <tr>
                                    <th className="px-5 py-3.5 text-left font-semibold">No. Deposit</th>
                                    <th className="px-5 py-3.5 text-left font-semibold">Tanggal</th>
                                    <th className="px-5 py-3.5 text-left font-semibold">Pelanggan</th>
                                    <th className="px-5 py-3.5 text-center font-semibold">Tipe</th>
                                    <th className="px-5 py-3.5 text-right font-semibold">Jumlah</th>
                                    <th className="px-5 py-3.5 text-right font-semibold">Sisa Saldo</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border bg-background">
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-5 py-16 text-center text-sm text-muted-foreground">
                                            Belum ada data deposit.
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map((d) => (
                                        <tr key={d.id} className="transition hover:bg-[rgb(var(--color-table-hover))]">
                                            <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-card-foreground">{d.deposit_no}</td>
                                            <td className="whitespace-nowrap px-5 py-4 text-sm text-muted-foreground">
                                                {new Date(d.deposit_at).toLocaleDateString("id-ID")}
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-4 text-sm text-card-foreground">{d.customer?.name}</td>
                                            <td className="px-5 py-4 text-center">
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${TYPE_BADGE[d.type] || ""}`}>
                                                    {TYPE_LABEL[d.type] || d.type}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-4 text-right text-sm text-card-foreground">{fmt(d.amount)}</td>
                                            <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-medium text-card-foreground">{fmt(d.remaining_balance)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="space-y-3 p-3 md:hidden">
                        {filtered.length === 0 ? (
                            <div className="py-16 text-center text-sm text-muted-foreground">Belum ada data deposit.</div>
                        ) : (
                            filtered.map((d) => (
                                <div key={d.id} className="rounded-xl border border-border bg-background p-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-card-foreground">{d.deposit_no}</span>
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${TYPE_BADGE[d.type] || ""}`}>
                                            {TYPE_LABEL[d.type] || d.type}
                                        </span>
                                    </div>
                                    <div className="mt-1 text-xs text-muted-foreground">
                                        {d.customer?.name} &middot; {new Date(d.deposit_at).toLocaleDateString("id-ID")}
                                    </div>
                                    <div className="mt-2 flex justify-between text-sm">
                                        <span className="text-muted-foreground">Jumlah</span>
                                        <span className="font-medium text-card-foreground">{fmt(d.amount)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Sisa</span>
                                        <span className="font-medium text-card-foreground">{fmt(d.remaining_balance)}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <Modal show={showCreate} onClose={() => setShowCreate(false)}>
                <form onSubmit={submitCreate} className="p-6">
                    <h2 className="text-lg font-semibold text-card-foreground">Tambah Deposit</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Catat uang muka dari pelanggan.</p>

                    <div className="mt-4 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-card-foreground">ID Pelanggan</label>
                            <input type="number" value={data.customer_id} onChange={(e) => setData("customer_id", e.target.value)}
                                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-card-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" required />
                            {errors.customer_id && <p className="mt-1 text-xs text-red-500">{errors.customer_id}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-card-foreground">Jumlah (Rp)</label>
                            <input type="number" value={data.amount} onChange={(e) => setData("amount", e.target.value)}
                                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-card-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" min="1" required />
                            {errors.amount && <p className="mt-1 text-xs text-red-500">{errors.amount}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-card-foreground">Metode Bayar</label>
                            <select value={data.payment_method} onChange={(e) => setData("payment_method", e.target.value)}
                                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-card-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
                                <option value="cash">Cash</option>
                                <option value="transfer">Transfer</option>
                                <option value="qris">QRIS</option>
                                <option value="edc">EDC</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-card-foreground">Tanggal</label>
                            <input type="date" value={data.deposit_at} onChange={(e) => setData("deposit_at", e.target.value)}
                                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-card-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-card-foreground">Catatan</label>
                            <textarea value={data.notes} onChange={(e) => setData("notes", e.target.value)} rows={2}
                                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-card-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <Button type="button" variant="ghost" onClick={() => { setShowCreate(false); reset(); }}>Batal</Button>
                        <Button type="submit" disabled={processing}>{processing ? "Menyimpan..." : "Simpan Deposit"}</Button>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
