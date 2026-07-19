import { useState } from "react";
import axios from "axios";
import { UserRound, Search, UserPlus, Check, TriangleAlert } from "lucide-react";
import PosModal from "../ui/PosModal";

/**
 * CustomerModal — cari & pilih pelanggan (nama / telepon), plus tambah
 * pelanggan baru dengan cepat. Menggantikan dropdown inline di keranjang
 * supaya layout POS tetap stabil.
 */
export default function CustomerModal({ show, onClose, k }) {
    const [search, setSearch] = useState("");
    const [addOpen, setAddOpen] = useState(false);
    const [addName, setAddName] = useState("");
    const [addPhone, setAddPhone] = useState("");
    const [adding, setAdding] = useState(false);
    const [addError, setAddError] = useState("");

    const selectedId = String(k.selectedCustomer ?? "");

    const syncName = (name) => {
        if (k.orderType === "delivery") k.setDeliveryCustomerName(name);
        if (k.orderType === "takeaway") k.setTakeawayCustomerName(name);
    };

    const choose = (cust) => {
        if (cust) {
            k.setSelectedCustomer(cust.id);
            syncName(cust.name);
        } else {
            k.setSelectedCustomer("");
        }
        onClose();
    };

    const resetAdd = () => {
        setAddOpen(false);
        setAddName("");
        setAddPhone("");
        setAddError("");
    };

    const submitAdd = async () => {
        if (!addName.trim()) return;
        setAdding(true);
        setAddError("");
        try {
            const { data } = await axios.post(
                route("admin.customers.store"),
                {
                    name: addName.trim(),
                    phone: addPhone.trim() || null,
                    email: null,
                    address: null,
                },
                { headers: { "X-Inertia": "false", Accept: "application/json" } },
            );
            if (data.customer) {
                k.setCustomers((prev) => [data.customer, ...prev]);
                resetAdd();
                choose(data.customer);
            } else {
                resetAdd();
                onClose();
            }
        } catch (err) {
            setAddError(
                err.response?.data?.message || err.message || "Gagal menyimpan.",
            );
        } finally {
            setAdding(false);
        }
    };

    const q = search.toLowerCase().trim();
    const filtered = k.customers.filter(
        (c) =>
            !q ||
            c.name?.toLowerCase().includes(q) ||
            c.phone?.includes(q) ||
            c.code?.toLowerCase().includes(q),
    );

    return (
        <PosModal
            show={show}
            onClose={onClose}
            icon={UserRound}
            title="Pilih Pelanggan"
            subtitle="Cari berdasarkan nama atau nomor telepon"
            maxWidth="md"
            bodyClass="!px-0 !py-0"
        >
            {/* Search + tambah baru */}
            <div className="border-b border-slate-100 px-5 py-3">
                <div className="relative">
                    <Search
                        size={16}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                        type="text"
                        autoFocus
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Cari nama atau telepon..."
                        className="block w-full rounded-xl border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm shadow-sm transition focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100"
                    />
                </div>

                {!addOpen ? (
                    <button
                        type="button"
                        onClick={() => setAddOpen(true)}
                        className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:bg-slate-50"
                    >
                        <UserPlus size={15} />
                        Tambah Pelanggan Baru
                    </button>
                ) : (
                    <div className="mt-2.5 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <input
                            type="text"
                            autoFocus
                            value={addName}
                            onChange={(e) => setAddName(e.target.value)}
                            placeholder="Nama pelanggan *"
                            className="block w-full rounded-lg border-slate-200 py-2 text-sm shadow-sm focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                        />
                        <input
                            type="text"
                            value={addPhone}
                            onChange={(e) => setAddPhone(e.target.value)}
                            placeholder="Nomor telepon (opsional)"
                            className="block w-full rounded-lg border-slate-200 py-2 text-sm shadow-sm focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                        />
                        {addError && (
                            <p className="flex items-center gap-1.5 text-xs font-medium text-rose-600">
                                <TriangleAlert size={13} /> {addError}
                            </p>
                        )}
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={submitAdd}
                                disabled={!addName.trim() || adding}
                                className="flex-1 rounded-lg bg-slate-900 py-2 text-xs font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
                            >
                                {adding ? "Menyimpan..." : "Simpan & Pilih"}
                            </button>
                            <button
                                type="button"
                                onClick={resetAdd}
                                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                            >
                                Batal
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Daftar pelanggan */}
            <div className="max-h-[46vh] overflow-y-auto p-2">
                {/* Umum / tanpa pelanggan */}
                <button
                    type="button"
                    onClick={() => choose(null)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-slate-50 ${!selectedId ? "bg-slate-50" : ""}`}
                >
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500">
                        U
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-700">Umum</p>
                        <p className="text-[11px] text-slate-400">
                            Transaksi tanpa pelanggan
                        </p>
                    </div>
                    {!selectedId && (
                        <Check size={17} className="shrink-0 text-slate-900" />
                    )}
                </button>

                {filtered.length === 0 ? (
                    <p className="px-3 py-8 text-center text-sm text-slate-400">
                        Pelanggan tidak ditemukan
                    </p>
                ) : (
                    filtered.map((c) => {
                        const isSel = String(c.id) === selectedId;
                        return (
                            <button
                                key={c.id}
                                type="button"
                                onClick={() => choose(c)}
                                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-slate-50 ${isSel ? "bg-slate-50" : ""}`}
                            >
                                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-bold uppercase text-white">
                                    {c.name?.charAt(0) ?? "?"}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold text-slate-700">
                                        {c.name}
                                    </p>
                                    <p className="truncate text-[11px] text-slate-400">
                                        {c.phone || "Tanpa telepon"}
                                        {c.code ? ` · ${c.code}` : ""}
                                    </p>
                                </div>
                                {c.tier && (
                                    <span
                                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${k.TIER_COLORS[c.tier] ?? k.TIER_COLORS.bronze}`}
                                    >
                                        {c.tier}
                                    </span>
                                )}
                                {isSel && (
                                    <Check
                                        size={17}
                                        className="shrink-0 text-slate-900"
                                    />
                                )}
                            </button>
                        );
                    })
                )}
            </div>
        </PosModal>
    );
}
