import { useState } from "react";
import useKasir from "../useKasir";
import KasirLayout from "./KasirLayout";

export default function TicketKasir(props) {
    const k = useKasir(props);

    const events = [
        { n: "Interstellar", c: "IMAX · Sci-Fi", when: "Today · Studio 4", tag: "Now Showing", ic: "🎬", color: "from-indigo-500 to-fuchsia-500" },
        { n: "Coldplay · Music Of The Spheres", c: "Concert · Stadium A", when: "Sat 20:00", tag: "Selling fast", ic: "🎤", color: "from-rose-500 to-orange-400" },
        { n: "Van Gogh Immersive", c: "Exhibition · Hall B", when: "All week", tag: "New", ic: "🎨", color: "from-amber-400 to-yellow-500" },
    ];

    const times = ["13:20", "15:45", "18:10", "20:35", "23:00"];
    const [selectedTime, setSelectedTime] = useState(2);
    const [selectedSeats, setSelectedSeats] = useState(["E5", "E6", "E7"]);

    const rows = ["A", "B", "C", "D", "E", "F", "G", "H"];
    const taken = new Set(["B3", "B4", "C7", "D5", "D6", "E2", "F8", "G4", "H1", "H2"]);

    const addons = [
        { n: "Large Popcorn", p: 8500, ic: "🍿" },
        { n: "Coke Combo", p: 10000, ic: "🥤" },
        { n: "Nachos", p: 9000, ic: "🌮" },
        { n: "IMAX Glasses", p: 2000, ic: "🕶" },
    ];

    const toggleSeat = (s) => {
        if (taken.has(s)) return;
        setSelectedSeats((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
    };

    const mainContent = (
        <div className="flex-1 overflow-y-auto p-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {/* Events */}
            <div className="flex items-end justify-between mb-3">
                <div>
                    <div className="text-[15px] font-semibold tracking-tight">Choose Event</div>
                    <div className="text-[11.5px] text-slate-500 mt-0.5">Today · Nov 12</div>
                </div>
                <button className="h-8 px-3 rounded-lg border border-slate-200 text-[11.5px] hover:bg-slate-50">All events →</button>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-6">
                {events.map((e, i) => (
                    <div key={i} className={`rounded-2xl border ${i === 0 ? "border-indigo-400 shadow-md" : "border-slate-200"} bg-white p-3 cursor-pointer`}>
                        <div className={`h-24 rounded-xl bg-gradient-to-br ${e.color} grid place-items-center text-4xl text-white/90`}>{e.ic}</div>
                        <div className="mt-3 flex items-center justify-between">
                            <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[10.5px] font-medium text-slate-700">{e.c.split(" · ")[0]}</span>
                            <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-[10.5px] font-medium text-indigo-700 border border-indigo-100">{e.tag}</span>
                        </div>
                        <div className="text-[13.5px] font-semibold mt-2 leading-tight">{e.n}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{e.when}</div>
                    </div>
                ))}
            </div>

            {/* Schedule + Seat selection */}
            <div className="grid grid-cols-3 gap-5 mb-6">
                <div className="rounded-2xl bg-white border border-slate-200 p-4">
                    <div className="flex items-end justify-between mb-3">
                        <div>
                            <div className="text-[15px] font-semibold tracking-tight">Schedule</div>
                            <div className="text-[11.5px] text-slate-500 mt-0.5">{times.length} showtimes today</div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {times.map((t, i) => (
                            <button key={i} onClick={() => setSelectedTime(i)} className={`rounded-xl border px-3 py-2.5 text-left transition-all ${i === selectedTime ? "bg-gradient-to-r from-indigo-500 to-violet-600 text-white border-indigo-500 shadow-sm" : "bg-white border-slate-200 hover:border-indigo-400"}`}>
                                <div className="text-[13px] font-semibold">{t}</div>
                                <div className={`text-[10.5px] mt-0.5 ${i === selectedTime ? "text-white/70" : "text-slate-500"}`}>Studio 4 · {k.fmt(14000)}</div>
                            </button>
                        ))}
                    </div>
                </div>
                <div className="col-span-2 rounded-2xl bg-white border border-slate-200 p-4">
                    <div className="flex items-end justify-between mb-3">
                        <div>
                            <div className="text-[15px] font-semibold tracking-tight">Seat Selection · Studio 4</div>
                            <div className="text-[11.5px] text-slate-500 mt-0.5">{selectedSeats.length} seats selected · Row E</div>
                        </div>
                        <div className="flex items-center gap-2 text-[11px]">
                            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-white border border-slate-200"></span>Free</span>
                            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-slate-200"></span>Taken</span>
                            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-indigo-500"></span>Yours</span>
                        </div>
                    </div>
                    <div className="rounded-xl bg-gradient-to-b from-slate-100 to-transparent py-2 text-center text-[10.5px] uppercase tracking-widest text-slate-500 font-medium mb-4">Screen</div>
                    <div className="flex flex-col items-center gap-1.5">
                        {rows.map((r) => (
                            <div key={r} className="flex items-center gap-1.5">
                                <div className="w-4 text-[10.5px] text-slate-400 font-medium">{r}</div>
                                {Array.from({ length: 10 }, (_, i) => {
                                    const s = r + (i + 1);
                                    const isPicked = selectedSeats.includes(s);
                                    const isTaken = taken.has(s);
                                    const cls = isPicked ? "bg-gradient-to-br from-indigo-500 to-violet-600 text-white border-indigo-500 shadow-sm"
                                        : isTaken ? "bg-slate-200 text-slate-400 border-slate-200 cursor-not-allowed"
                                            : "bg-white border-slate-200 hover:border-indigo-400 hover:bg-slate-50";
                                    return <button key={s} onClick={() => toggleSeat(s)} className={`h-8 w-8 rounded-md border text-[10px] font-medium ${cls}`}>{i + 1}</button>;
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Add-ons */}
            <div className="flex items-end justify-between mb-3">
                <div>
                    <div className="text-[15px] font-semibold tracking-tight">Add-ons</div>
                    <div className="text-[11.5px] text-slate-500 mt-0.5">Snacks & merch</div>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                {addons.map((a, i) => (
                    <div key={i} className="rounded-xl border border-slate-200 bg-white p-3 flex items-center gap-3">
                        <div className="h-11 w-11 rounded-lg bg-slate-50 grid place-items-center text-xl">{a.ic}</div>
                        <div className="flex-1">
                            <div className="text-[12.5px] font-semibold">{a.n}</div>
                            <div className="text-[11px] text-slate-500">{k.fmt(a.p)}</div>
                        </div>
                        <button onClick={() => k.addToCart({ id: `addon-${i}`, name: a.n, sell_price: a.p, track_stock: false })} className="h-7 w-7 rounded-md border border-slate-200 grid place-items-center text-slate-500 hover:bg-slate-50">+</button>
                    </div>
                ))}
            </div>
        </div>
    );

    return <KasirLayout k={k} props={props} mainContent={mainContent} showSearch={false} />;
}
