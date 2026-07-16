import { useState } from "react";
import useKasir from "../useKasir";
import KasirLayout from "./KasirLayout";

export default function ParkingKasir(props) {
    const k = useKasir(props);

    const slots = [];
    for (let i = 1; i <= 48; i++) {
        let st = "free";
        if ([2, 5, 7, 10, 11, 15, 18, 22, 25, 27, 31, 34, 36, 40, 44, 47].includes(i)) st = "occ";
        if ([6, 17, 33].includes(i)) st = "res";
        slots.push({ id: "A-" + String(i).padStart(2, "0"), st });
    }

    const stMap = {
        free: "bg-white border-slate-200 text-slate-700 hover:border-indigo-400",
        occ: "bg-indigo-500 text-white border-indigo-500 shadow-sm",
        res: "bg-amber-50 border-amber-200 text-amber-800",
    };

    const activeVehicles = [
        { plate: "B 1234 XYZ", slot: "A-05", in: "09:12", dur: "3h 41m", fee: "Rp 8.250", type: "Sedan" },
        { plate: "D 7788 KL", slot: "A-11", in: "11:04", dur: "1h 49m", fee: "Rp 4.500", type: "SUV" },
        { plate: "AB 902 CD", slot: "A-22", in: "12:33", dur: "0h 20m", fee: "Rp 1.000", type: "Motorcycle" },
        { plate: "F 4402 M", slot: "A-31", in: "08:00", dur: "4h 53m", fee: "Rp 11.000", type: "Sedan" },
    ];

    const stats = [
        { l: "Total slots", v: "48", s: "Level A" },
        { l: "Occupied", v: "16", s: "33%", tone: "brand" },
        { l: "Reserved", v: "3", s: "Monthly pass" },
        { l: "Revenue today", v: k.fmt(284500), s: "+12% vs yday", tone: "success" },
    ];

    const mainContent = (
        <div className="flex-1 overflow-y-auto p-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {/* Stats */}
            <div className="grid grid-cols-4 gap-3 mb-5">
                {stats.map((s, i) => (
                    <div key={i} className="rounded-2xl bg-white border border-slate-200 p-4">
                        <div className="text-[10.5px] uppercase tracking-widest text-slate-500 font-medium">{s.l}</div>
                        <div className="mt-1 text-[24px] font-semibold tracking-tight tabular-nums">{s.v}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{s.s}</div>
                    </div>
                ))}
            </div>

            {/* Slot grid + ANPR */}
            <div className="grid grid-cols-3 gap-5 mb-5">
                <div className="col-span-2 rounded-2xl bg-white border border-slate-200 p-4">
                    <div className="flex items-end justify-between mb-3">
                        <div>
                            <div className="text-[15px] font-semibold tracking-tight">Slots · Level A</div>
                            <div className="text-[11.5px] text-slate-500 mt-0.5">48 slots · Zone North</div>
                        </div>
                        <div className="flex items-center gap-2 text-[11px]">
                            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-white border border-slate-200"></span>Free</span>
                            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-indigo-500"></span>Occupied</span>
                            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-amber-100 border border-amber-200"></span>Reserved</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-12 gap-1.5">
                        {slots.map((s) => (
                            <div key={s.id} className={`rounded-lg border ${stMap[s.st]} px-2 py-2 flex flex-col items-center justify-center cursor-pointer hover:shadow-sm transition-all`}>
                                <svg className="h-4 w-4 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                    <path d="M14 16H9m10 0h1.5a2.5 2.5 0 0 0 0-5H19M5 16H3.5a2.5 2.5 0 0 1 0-5H5m0 0h14m-14 0 2-6h10l2 6" />
                                </svg>
                                <div className="text-[10.5px] font-semibold mt-0.5">{s.id}</div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 text-white p-5 flex flex-col">
                    <div className="text-[10.5px] uppercase tracking-widest text-white/60 font-medium">ANPR Scanner</div>
                    <div className="mt-3 rounded-xl bg-black/40 border border-white/10 aspect-video grid place-items-center relative overflow-hidden">
                        <div className="absolute inset-3 border border-emerald-400/70 rounded-lg"></div>
                        <div className="text-center">
                            <div className="text-[10.5px] uppercase tracking-widest text-emerald-300 font-medium">Plate Detected</div>
                            <div className="mt-2 inline-block bg-white text-slate-900 rounded-md px-4 py-1.5 text-[20px] font-bold tracking-widest">B 1892 KL</div>
                        </div>
                    </div>
                    <div className="mt-4 space-y-2 text-[12.5px]">
                        <div className="flex items-center justify-between"><span className="text-white/60">Type</span><span className="font-medium">Sedan · Toyota Camry</span></div>
                        <div className="flex items-center justify-between"><span className="text-white/60">Time in</span><span className="font-medium tabular-nums">13:04:22</span></div>
                        <div className="flex items-center justify-between"><span className="text-white/60">Assigned slot</span><span className="font-medium">A-06</span></div>
                        <div className="flex items-center justify-between"><span className="text-white/60">Rate</span><span className="font-medium">{k.fmt(2500)} · first hour</span></div>
                    </div>
                    <button className="mt-auto h-11 rounded-xl bg-white text-slate-900 font-semibold text-[13px] mt-4">Open Gate & Print Ticket</button>
                </div>
            </div>

            {/* Active vehicles table */}
            <div className="rounded-2xl bg-white border border-slate-200 p-4">
                <div className="flex items-end justify-between mb-3">
                    <div>
                        <div className="text-[15px] font-semibold tracking-tight">Active Vehicles</div>
                        <div className="text-[11.5px] text-slate-500 mt-0.5">{activeVehicles.length} currently inside · sortable</div>
                    </div>
                    <div className="flex gap-1.5">
                        <button className="h-8 px-3 rounded-lg border border-slate-200 text-[11.5px] hover:bg-slate-50">Filter</button>
                        <button className="h-8 px-3 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-[11.5px] shadow-sm">Export CSV</button>
                    </div>
                </div>
                <div className="overflow-hidden rounded-xl border border-slate-200">
                    <table className="w-full text-[12.5px]">
                        <thead className="bg-slate-50 text-slate-500 text-[10.5px] uppercase tracking-widest">
                            <tr>
                                <th className="text-left px-4 py-2 font-medium">Plate</th>
                                <th className="text-left px-4 py-2 font-medium">Slot</th>
                                <th className="text-left px-4 py-2 font-medium">Type</th>
                                <th className="text-left px-4 py-2 font-medium">Time In</th>
                                <th className="text-left px-4 py-2 font-medium">Duration</th>
                                <th className="text-right px-4 py-2 font-medium">Fee</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {activeVehicles.map((a, i) => (
                                <tr key={i} className="border-t border-slate-100 hover:bg-slate-50/50">
                                    <td className="px-4 py-2.5 font-mono font-semibold">{a.plate}</td>
                                    <td className="px-4 py-2.5">
                                        <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-[10.5px] font-medium text-indigo-700 border border-indigo-100">{a.slot}</span>
                                    </td>
                                    <td className="px-4 py-2.5 text-slate-600">{a.type}</td>
                                    <td className="px-4 py-2.5 tabular-nums">{a.in}</td>
                                    <td className="px-4 py-2.5 tabular-nums">{a.dur}</td>
                                    <td className="px-4 py-2.5 text-right font-semibold tabular-nums">{a.fee}</td>
                                    <td className="px-4 py-2.5 text-right">
                                        <button className="text-[11.5px] font-medium text-indigo-600">Check-out →</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    return <KasirLayout k={k} props={props} mainContent={mainContent} showSearch={false} />;
}
