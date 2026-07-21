import { useEffect, useState } from "react";
import { Truck, PackageCheck } from "lucide-react";
import PosModal from "../ui/PosModal";
import Field from "@/Components/ui/Field";
import CurrencyInput from "@/Components/ui/CurrencyInput";

const inputClass =
    "block w-full rounded-xl border-border bg-muted/50 py-2.5 text-sm shadow-sm transition focus:border-slate-400 focus:bg-card focus:ring-2 focus:ring-slate-100";

/**
 * TransactionInfoModal — input data tambahan per mode transaksi (Antar /
 * Ambil) lewat modal, supaya area keranjang tidak ikut memanjang.
 * Draft lokal di-commit ke hook hanya saat "Simpan" (Batal = revert).
 */
export default function TransactionInfoModal({ show, onClose, k }) {
    const isDelivery = k.orderType === "delivery";

    const [dName, setDName] = useState("");
    const [dPhone, setDPhone] = useState("");
    const [dAddress, setDAddress] = useState("");
    const [dCourier, setDCourier] = useState("");
    const [dNote, setDNote] = useState("");
    const [dFee, setDFee] = useState("");
    const [pName, setPName] = useState("");
    const [pPhone, setPPhone] = useState("");
    const [pTime, setPTime] = useState("");
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (!show) return;
        setDName(k.deliveryCustomerName || "");
        setDPhone(k.deliveryPhone || "");
        setDAddress(k.deliveryAddress || "");
        setDCourier(k.deliveryCourier || "");
        setDNote(k.deliveryNote || "");
        setDFee(k.deliveryFee || "");
        setPName(k.takeawayCustomerName || "");
        setPPhone(k.takeawayPhone || "");
        setPTime(k.pickupTime || "");
        setErrors({});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [show]);

    const save = () => {
        if (isDelivery) {
            const errs = {};
            if (!dName.trim() && !k.selectedCustomer)
                errs.name = "Nama penerima wajib diisi.";
            if (!dPhone.trim()) errs.phone = "Nomor telepon wajib diisi.";
            if (!dAddress.trim()) errs.address = "Alamat pengiriman wajib diisi.";
            if (Object.keys(errs).length) {
                setErrors(errs);
                return;
            }
            k.setDeliveryCustomerName(dName.trim());
            k.setDeliveryPhone(dPhone.trim());
            k.setDeliveryAddress(dAddress.trim());
            k.setDeliveryCourier(dCourier.trim());
            k.setDeliveryNote(dNote.trim());
            k.setDeliveryFee(dFee);
        } else {
            k.setTakeawayCustomerName(pName.trim());
            k.setTakeawayPhone(pPhone.trim());
            k.setPickupTime(pTime.trim());
        }
        onClose();
    };

    return (
        <PosModal
            show={show}
            onClose={onClose}
            icon={isDelivery ? Truck : PackageCheck}
            title={isDelivery ? "Info Pengiriman" : "Info Pengambilan"}
            subtitle={
                isDelivery
                    ? "Data penerima & alamat untuk diantar"
                    : "Opsional — untuk pesanan yang diambil"
            }
            maxWidth="md"
            footer={
                <>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-muted-foreground transition hover:bg-muted"
                    >
                        Batal
                    </button>
                    <button
                        type="button"
                        onClick={save}
                        className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
                    >
                        Simpan
                    </button>
                </>
            }
        >
            {isDelivery ? (
                <div className="space-y-3.5">
                    <Field label="Nama Penerima" required error={errors.name}>
                        <input
                            type="text"
                            value={dName}
                            onChange={(e) => setDName(e.target.value)}
                            placeholder="Nama penerima paket"
                            className={inputClass}
                        />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Nomor Telepon" required error={errors.phone}>
                            <input
                                type="tel"
                                value={dPhone}
                                onChange={(e) => setDPhone(e.target.value)}
                                placeholder="0812xxxx"
                                className={inputClass}
                            />
                        </Field>
                        <Field label="Kurir / Ekspedisi">
                            <input
                                type="text"
                                value={dCourier}
                                onChange={(e) => setDCourier(e.target.value)}
                                placeholder="Contoh: GoSend"
                                className={inputClass}
                            />
                        </Field>
                    </div>
                    <Field label="Alamat Pengiriman" required error={errors.address}>
                        <textarea
                            rows={2}
                            value={dAddress}
                            onChange={(e) => setDAddress(e.target.value)}
                            placeholder="Jl. Contoh No. 123, kecamatan..."
                            className={inputClass}
                        />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Biaya Antar / Ongkir">
                            <CurrencyInput
                                value={dFee || "0"}
                                onChange={setDFee}
                                placeholder="0"
                            />
                        </Field>
                        <Field label="Catatan Pengiriman">
                            <input
                                type="text"
                                value={dNote}
                                onChange={(e) => setDNote(e.target.value)}
                                placeholder="Patokan, dll"
                                className={inputClass}
                            />
                        </Field>
                    </div>
                </div>
            ) : (
                <div className="space-y-3.5">
                    <Field label="Nama Pengambil">
                        <input
                            type="text"
                            value={pName}
                            onChange={(e) => setPName(e.target.value)}
                            placeholder="Nama pemesan / pengambil"
                            className={inputClass}
                        />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Nomor Telepon">
                            <input
                                type="tel"
                                value={pPhone}
                                onChange={(e) => setPPhone(e.target.value)}
                                placeholder="0812xxxx"
                                className={inputClass}
                            />
                        </Field>
                        <Field label="Waktu Pengambilan">
                            <input
                                type="text"
                                value={pTime}
                                onChange={(e) => setPTime(e.target.value)}
                                placeholder="Contoh: 14:30"
                                className={inputClass}
                            />
                        </Field>
                    </div>
                </div>
            )}
        </PosModal>
    );
}
