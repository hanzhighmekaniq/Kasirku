import { useState } from "react";
import useKasir from "../useKasir";
import KasirLayout from "./KasirLayout";

export default function SessionKasir(props) {
    const k = useKasir(props);

    const rooms = [
        { n: "PS5 Room 01", t: "PlayStation", st: "active", elapsed: "01:24:12", end: "in 35m", rate: 6000, bill: 8420, bg: "from-indigo-500 to-blue-600" },
        { n: "Karaoke Sky", t: "Karaoke", st: "active", elapsed: "00:48:07", end: "in 12m", rate: 18000, bill: 14400, bg: "from-rose-500 to-fuchsia-500" },
        { n: "Billiard #3", t: "Billiard", st: "active", elapsed: "02:12:44", end: "open", rate: 10000, bill: 22100, bg: "from-emerald-500 to-teal-600" },
        { n: "PS5 Room 02", t: "PlayStation", st: "idle", elapsed: "—", end: "—", rate: 6000, bill: 0, bg: "from-slate-300 to-slate-400" },
        { n: "Karaoke Bay", t: "Karaoke", st: "idle", elapsed: "—", end: "—", rate: 18000, bill: 0, bg: "from-slate-300 to-slate-400" },
        { n: "Billiard #4", t: "Billiard", st: "cleaning", elapsed: "—", end: "ready 5m", rate: 10000, bill: 0, bg: "from-amber-400 to-orange-500" },
    ];

    const orders = [
        { n: "Coca-Cola 330ml", qty: 2, price: 2500, ic: "🥤" },
        { n: "Cheese Fries", qty: 1, price: 6500, ic: "🍟" },
        { n: "Fried Chicken", qty: 1, price: 9900, ic: "🍗" },
        { n: "Nachos Combo", qty: 1, price: 8200, ic: "🌮" },
    ];

    const stats = [
        { l: "Rooms live", v: "3 / 6", s: "50% utilization", tone: "brand" },
        { l: "Avg session", v: "1h 32m", s: "+8 min vs yday" },
        { l: "Revenue", v: k.fmt(412800), s: "Today", tone: "success" },
        { l: "F&B add-ons", v: k.fmt(96500), s: "23% attach rate" },
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

            {/* Room cards */}
            <div className="flex items-end justify-between mb-3">
                <div>
                    <div className="text-[15px] font-semibold tracking-tight">Rooms</div>
                    <div className="text-[11.5px] text-slate-500 mt-0.5">{rooms.length} rooms · live timers</div>
                </div>
                <div className="flex gap-1.5">
                    <button className="h-8 px-3 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-[11.5px] shadow-sm">All</button>
                    <button className="h-8 px-3 rounded-lg border border-slate-200 text-[11.5px] hover:bg-slate-50">PS</button>
                    <button className="h-8 px-3 rounded-lg border border-slate-200 text-[11.5px] hover:bg-slate-50">Karaoke</button>
                    <button className="h-8 px-3 rounded-lg border border-slate-200 text-[11.5px] hover:bg-slate-50">Billiard</button>
                </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-6">
                {rooms.map((r, i) => {
                    const isActive = r.st === "active";
                    return (
                        <div key={i} className={`rounded-2xl border ${isActive ? "border-indigo-400 shadow-md" : "border-slate-200"} bg-white overflow-hidden`}>
                            <div className={`h-16 bg-gradient-to-br ${r.bg} relative`}>
                                <div className="absolute inset-0 flex items-center justify-between px-4">
                                    <div className="text-white">
                                        <div className="text-[10.5px] uppercase tracking-widest opacity-80 font-medium">{r.t}</div>
                                        <div className="text-[14px] font-semibold">{r.n}</div>
                                    </div>
                                    {isActive ? (
                                        <span className="inline-flex items-center rounded-md bg-white/20 border border-white/20 px-2 py-0.5 text-[10.5px] font-medium text-white">
                                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 mr-1 animate-pulse"></span>Live
                                        </span>
                                    ) : r.st === "cleaning" ? (
                                        <span className="inline-flex items-center rounded-md bg-white/20 border border-white/20 px-2 py-0.5 text-[10.5px] font-medium text-white">Cleaning</span>
                                    ) : (
                                        <span className="inline-flex items-center rounded-md bg-white/20 border border-white/20 px-2 py-0.5 text-[10.5px] font-medium text-white">Idle</span>
                                    )}
                                </div>
                            </div>
                            <div className="p-4">
                                <div className="flex items-baseline justify-between">
                                    <div className="text-[26px] font-semibold tabular-nums tracking-tight">{r.elapsed}</div>
                                    <div className="text-[11px] text-slate-500">{r.end}</div>
                                </div>
                                <div className="mt-2 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                    <div className={`h-full ${isActive ? "bg-emerald-500" : "bg-slate-200"}`} style={{ width: isActive ? "60%" : "0%" }}></div>
                                </div>
                                <div className="mt-3 flex items-center justify-between text-[11.5px]">
                                    <span className="text-slate-500">{k.fmt(r.rate)}/hr</span>
                                    <span className="font-semibold tabular-nums">{r.bill > 0 ? k.fmt(r.bill) : "—"}</span>
                                </div>
                                <div className="mt-3 grid grid-cols-3 gap-1.5">
                                    <button className="h-8 rounded-lg border border-slate-200 text-[11px] font-medium hover:bg-slate-50">+15m</button>
                                    <button className="h-8 rounded-lg border border-slate-200 text-[11px] font-medium hover:bg-slate-50">Pause</button>
                                    <button className={`h-8 rounded-lg ${isActive ? "bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-sm" : "border border-slate-200 text-slate-400 cursor-not-allowed"} text-[11px] font-medium`}>Stop</button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Additional Orders + Timer */}
            <div className="grid grid-cols-3 gap-5">
                <div className="col-span-2 rounded-2xl bg-white border border-slate-200 p-4">
                    <div className="flex items-end justify-between mb-3">
                        <div>
                            <div className="text-[15px] font-semibold tracking-tight">Additional Orders · PS5 Room 01</div>
                            <div className="text-[11.5px] text-slate-500 mt-0.5">Charged to session</div>
                        </div>
                    </div>
                    <div className="overflow-hidden rounded-xl border border-slate-200">
                        <table className="w-full text-[12.5px]">
                            <thead className="bg-slate-50 text-slate-500 text-[10.5px] uppercase tracking-widest">
                                <tr>
                                    <th className="text-left px-4 py-2 font-medium">Item</th>
                                    <th className="text-left px-4 py-2 font-medium">Qty</th>
                                    <th className="text-left px-4 py-2 font-medium">Time</th>
                                    <th className="text-right px-4 py-2 font-medium">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((o, i) => (
                                    <tr key={i} className="border-t border-slate-100 hover:bg-slate-50/50">
                                        <td className="px-4 py-2.5">
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg">{o.ic}</span>
                                                <span className="font-medium">{o.n}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2.5">×{o.qty}</td>
                                        <td className="px-4 py-2.5 text-slate-500 tabular-nums">13:{20 + i * 8}</td>
                                        <td className="px-4 py-2.5 text-right font-semibold tabular-nums">{k.fmt(o.qty * o.price)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 text-white p-5">
                    <div className="text-[10.5px] uppercase tracking-widest text-white/60 font-medium">Session Timer · PS5 R01</div>
                    <div className="mt-3 text-center">
                        <div className="text-[52px] font-semibold tracking-tight tabular-nums leading-none">01:24:12</div>
                        <div className="text-[11px] text-white/60 mt-2">Started 12:00 · Ends 15:00</div>
                    </div>
                    <div className="mt-5 space-y-2 text-[12.5px]">
                        <div className="flex items-center justify-between"><span className="text-white/60">Duration paid</span><span className="tabular-nums">3h 00m</span></div>
                        <div className="flex items-center justify-between"><span className="text-white/60">Rate</span><span className="tabular-nums">{k.fmt(6000)} / hr</span></div>
                        <div className="flex items-center justify-between"><span className="text-white/60">Time bill</span><span className="tabular-nums">{k.fmt(8420)}</span></div>
                        <div className="flex items-center justify-between"><span className="text-white/60">F&B</span><span className="tabular-nums">{k.fmt(22100)}</span></div>
                    </div>
                    <div className="mt-5 grid grid-cols-2 gap-2">
                        <button className="h-10 rounded-lg bg-white/10 text-white text-[12px] font-medium">+30 min</button>
                        <button className="h-10 rounded-lg bg-white text-slate-900 text-[12px] font-semibold">Add F&B</button>
                    </div>
                </div>
            </div>
        </div>
    );

    return <KasirLayout k={k} props={props} mainContent={mainContent} showSearch={false} />;
}
