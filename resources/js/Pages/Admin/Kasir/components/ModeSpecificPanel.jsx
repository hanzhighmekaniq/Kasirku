export default function ModeSpecificPanel({ k }) {
    const sectionClass =
        "overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm";
    const labelClass = "mb-1 block text-xs font-medium text-slate-600";
    const inputClass =
        "block w-full rounded-lg border-slate-300 py-1.5 text-xs shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200";

    const renderFeatureChips = () => (
        <div className="mt-2 flex flex-wrap gap-1.5">
            {k.modeConfig.features.slice(0, 6).map((feature) => (
                <span
                    key={feature}
                    className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-medium text-slate-600 ring-1 ring-slate-200"
                >
                    {feature.replace(/_/g, " ")}
                </span>
            ))}
        </div>
    );

    return (
        <div className={sectionClass}>
            <div className="border-b border-slate-100 bg-indigo-50/60 px-4 py-2.5">
                <div className="flex items-start gap-2">
                    <span className="text-lg leading-none">
                        {k.modeConfig.icon}
                    </span>
                    <div className="min-w-0">
                        <h3 className="text-xs font-semibold text-indigo-800">
                            {k.modeConfig.label} POS
                        </h3>
                        <p className="mt-0.5 text-[11px] leading-relaxed text-indigo-700/80">
                            {k.modeConfig.description}
                        </p>
                        {renderFeatureChips()}
                    </div>
                </div>
            </div>

            <div className="space-y-3 p-3">
                {k.isTicket && (
                    <>
                        <div>
                            <label className={labelClass}>
                                Karyawan / Petugas
                            </label>
                            {k.employees && k.employees.length > 0 ? (
                                <select
                                    value={k.selectedEmployee}
                                    onChange={(e) =>
                                        k.setSelectedEmployee(e.target.value)
                                    }
                                    className={inputClass}
                                >
                                    <option value="">
                                        -- Pilih Karyawan --
                                    </option>
                                    {k.employees.map((emp) => (
                                        <option key={emp.id} value={emp.id}>
                                            {emp.name}
                                            {emp.position
                                                ? ` (${emp.position})`
                                                : ""}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type="text"
                                    value={k.ticketEvent}
                                    onChange={(e) =>
                                        k.setTicketEvent(e.target.value)
                                    }
                                    placeholder="Nama petugas / penjaga"
                                    className={inputClass}
                                />
                            )}
                        </div>
                        <div>
                            <label className={labelClass}>Event / Jadwal</label>
                            <input
                                type="text"
                                value={k.ticketEvent}
                                onChange={(e) =>
                                    k.setTicketEvent(e.target.value)
                                }
                                placeholder="Contoh: Avengers 14:00 / Futsal 20:00"
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>
                                No. Booking / Slot
                            </label>
                            <input
                                type="text"
                                value={k.ticketSlot}
                                onChange={(e) =>
                                    k.setTicketSlot(e.target.value)
                                }
                                placeholder="Contoh: Seat A12 / Slot #5"
                                className={inputClass}
                            />
                        </div>
                        <p className="text-[11px] text-slate-500">
                            Ticket untuk bioskop, futsal, event — booking slot
                            terjadwal, check-in, dan refund.
                        </p>
                    </>
                )}

                {k.isService && (
                    <>
                        {k.isService && !k.selectedCustomer && (
                            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-700">
                                <span className="font-semibold">⚠️ Customer wajib diisi</span>
                                <span className="block mt-0.5 text-amber-600">Pilih pelanggan dari dropdown di atas sebelum bayar</span>
                            </div>
                        )}
                        <div>
                            <label className={labelClass}>
                                Karyawan / Teknisi
                            </label>
                            {k.employees && k.employees.length > 0 ? (
                                <select
                                    value={k.selectedEmployee}
                                    onChange={(e) =>
                                        k.setSelectedEmployee(e.target.value)
                                    }
                                    className={inputClass}
                                >
                                    <option value="">
                                        -- Pilih Karyawan --
                                    </option>
                                    {k.employees.map((emp) => (
                                        <option key={emp.id} value={emp.id}>
                                            {emp.name}
                                            {emp.position
                                                ? ` (${emp.position})`
                                                : ""}
                                            {emp.commission_value > 0
                                                ? ` · ${emp.commission_type === "percent" ? emp.commission_value + "%" : "Rp " + Number(emp.commission_value).toLocaleString("id-ID")}`
                                                : ""}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type="text"
                                    value={k.ticketEvent}
                                    onChange={(e) =>
                                        k.setTicketEvent(e.target.value)
                                    }
                                    placeholder="Nama pegawai / teknisi"
                                    className={inputClass}
                                />
                            )}
                        </div>
                        <div>
                            <label className={labelClass}>
                                No. Booking / Antrian
                            </label>
                            <input
                                type="text"
                                value={k.ticketSlot}
                                onChange={(e) =>
                                    k.setTicketSlot(e.target.value)
                                }
                                placeholder="Contoh: Booking 14:00 / Q-012"
                                className={inputClass}
                            />
                        </div>
                        <p className="text-[11px] text-slate-500">
                            Komisi karyawan dihitung otomatis saat transaksi
                            selesai.
                        </p>
                    </>
                )}

                {k.isRental && (
                    <>
                        {!k.selectedCustomer && (
                            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-700">
                                <span className="font-semibold">⚠️ Customer wajib diisi</span>
                                <span className="block mt-0.5 text-amber-600">Pilih penyewa dari dropdown pelanggan di atas</span>
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className={labelClass}>Durasi</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={k.rentalDuration}
                                    onChange={(e) =>
                                        k.setRentalDuration(
                                            Number(e.target.value),
                                        )
                                    }
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Satuan</label>
                                <select
                                    value={k.rentalUnit}
                                    onChange={(e) =>
                                        k.setRentalUnit(e.target.value)
                                    }
                                    className={inputClass}
                                >
                                    <option value="per_hour">Per Jam</option>
                                    <option value="per_day">Per Hari</option>
                                    <option value="per_week">Per Minggu</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className={labelClass}>
                                Unit / barang sewa
                            </label>
                            <input
                                type="text"
                                value={k.roomNumber}
                                onChange={(e) =>
                                    k.setRoomNumber(e.target.value)
                                }
                                placeholder="Contoh: Kamera A7, Motor 01"
                                className={inputClass}
                            />
                        </div>
                        {/* Estimasi tanggal kembali — kalkulasi otomatis */}
                        {k.rentalDuration > 0 && (
                            <div className="rounded-xl bg-indigo-50 border border-indigo-100 px-3 py-2.5">
                                <p className="text-[10px] font-semibold text-indigo-500 mb-1">Estimasi Kembali</p>
                                <p className="text-sm font-bold text-indigo-700">
                                    {(() => {
                                        const now = new Date();
                                        const ms = k.rentalUnit === 'per_hour'
                                            ? k.rentalDuration * 3600000
                                            : k.rentalUnit === 'per_day'
                                            ? k.rentalDuration * 86400000
                                            : k.rentalDuration * 604800000;
                                        const endDate = new Date(now.getTime() + ms);
                                        return endDate.toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }) +
                                            (k.rentalUnit === 'per_hour' ? ' ' + endDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '');
                                    })()}
                                </p>
                            </div>
                        )}
                        <p className="text-[11px] text-slate-500">
                            Rental wajib menjaga availability, deposit, tanggal
                            sewa, return, dan denda telat/rusak.
                        </p>
                    </>
                )}

                {k.isHospitality && (
                    <>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className={labelClass}>No. Kamar</label>
                                <input
                                    type="text"
                                    value={k.roomNumber}
                                    onChange={(e) =>
                                        k.setRoomNumber(e.target.value)
                                    }
                                    placeholder="Contoh: 101 / Deluxe"
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>
                                    Jumlah Tamu
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={k.guestCount}
                                    onChange={(e) =>
                                        k.setGuestCount(Number(e.target.value))
                                    }
                                    className={inputClass}
                                />
                            </div>
                        </div>
                        <div>
                            <label className={labelClass}>Tipe Check-in</label>
                            <select
                                value={k.orderType}
                                onChange={(e) =>
                                    k.handleOrderTypeChange(e.target.value)
                                }
                                className={inputClass}
                            >
                                {k.orderOpts.map((option) => (
                                    <option key={option.v} value={option.v}>
                                        {option.l}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <p className="text-[11px] text-slate-500">
                            Hospitality untuk hotel, villa, penginapan —
                            check-in/out, deposit, dan tamu.
                        </p>
                    </>
                )}

                {k.isRetail && (
                    <p className="text-[11px] text-slate-500">
                        Retail memakai alur cepat: scan/pilih produk, validasi
                        stok, bayar, stok berkurang, lalu struk.
                    </p>
                )}

                {k.isFnb && (
                    <p className="text-[11px] text-slate-500">
                        F&B memakai order type, meja untuk dine-in,
                        modifier/topping, delivery info, dan status dapur.
                    </p>
                )}
            </div>
        </div>
    );
}
