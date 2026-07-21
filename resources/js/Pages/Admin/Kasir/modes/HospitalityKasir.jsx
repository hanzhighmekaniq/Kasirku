import { useState } from "react";
import useKasir from "../useKasir";
import KasirLayout from "./KasirLayout";

export default function HospitalityKasir(props) {
    const k = useKasir(props);

    const rooms = [];
    for (let f = 3; f >= 1; f--) {
        for (let n = 1; n <= 10; n++) {
            const num = f * 100 + n;
            let st = "free";
            if ([201, 203, 305, 102, 108, 306].includes(num)) st = "occupied";
            else if ([202, 307, 105].includes(num)) st = "dirty";
            else if ([204, 101].includes(num)) st = "reserved";
            rooms.push({ num, st, f });
        }
    }

    const stMap = {
        free: { c: "bg-card border-border text-card-foreground hover:border-slate-900", l: "Vacant" },
        occupied: { c: "bg-indigo-500 text-white border-primary shadow-sm", l: "Occupied" },
        dirty: { c: "bg-warning/10 border-warning/10 text-warning", l: "Housekeeping" },
        reserved: { c: "bg-primary text-primary-foreground border-slate-900", l: "Reserved" },
    };

    const days = [12, 13, 14, 15, 16, 17, 18];
    const bookings = [
        { g: "A. Chen · Deluxe 305", s: 1, e: 4, tone: "bg-indigo-500" },
        { g: "M. Reyes · Suite 201", s: 0, e: 2, tone: "bg-primary" },
        { g: "K. Park · Twin 108", s: 3, e: 6, tone: "bg-success" },
        { g: "D. Silva · Deluxe 306", s: 2, e: 5, tone: "bg-warning" },
    ];

    const additionalServices = [
        { n: "Breakfast Buffet", p: "$22/pax" },
        { n: "Airport Transfer", p: "$45" },
        { n: "Spa Session 60m", p: "$85" },
        { n: "Late Check-out", p: "$40" },
    ];

    const mainContent = (
        <div className="flex-1 overflow-y-auto p-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {/* Room Board + Guest Profile */}
            <div className="grid grid-cols-3 gap-5 mb-5">
                <div className="col-span-2 rounded-2xl bg-card border border-border p-4">
                    <div className="flex items-end justify-between mb-3">
                        <div>
                            <div className="text-[15px] font-semibold tracking-tight">Room Board</div>
                            <div className="text-[11.5px] text-muted-foreground mt-0.5">3 floors · {rooms.length} rooms · {rooms.filter((r) => r.st === "occupied").length} occupied</div>
                        </div>
                        <div className="flex items-center gap-2 text-[11px]">
                            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-card border border-border"></span>Vacant</span>
                            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-indigo-500"></span>Occupied</span>
                            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-amber-100 border border-warning/10"></span>Housekeeping</span>
                            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-primary"></span>Reserved</span>
                        </div>
                    </div>
                    {[3, 2, 1].map((f) => (
                        <div key={f} className="mb-3">
                            <div className="text-[10.5px] uppercase tracking-widest text-muted-foreground font-medium mb-1.5">Floor {f}</div>
                            <div className="grid grid-cols-10 gap-1.5">
                                {rooms.filter((r) => r.f === f).map((r) => {
                                    const s = stMap[r.st];
                                    return (
                                        <div key={r.num} onClick={() => k.setRoomNumber(String(r.num))} className={`rounded-lg border ${s.c} p-2 aspect-square flex flex-col justify-between cursor-pointer hover:shadow-sm transition-all`}>
                                            <div className="text-[13px] font-semibold tracking-tight">{r.num}</div>
                                            <div className="text-[9px] opacity-80 font-medium truncate">{s.l}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="space-y-4">
                    <div className="rounded-2xl bg-card border border-border p-4">
                        <div className="flex items-end justify-between mb-3">
                            <div>
                                <div className="text-[15px] font-semibold tracking-tight">Guest Profile</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="h-14 w-14 rounded-full bg-gradient-to-br from-amber-300 to-rose-400 grid place-items-center text-white text-[15px] font-semibold shadow-sm">AC</div>
                            <div>
                                <div className="text-[13.5px] font-semibold">Amanda Chen</div>
                                <div className="text-[11px] text-muted-foreground">Platinum · 12 stays</div>
                            </div>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
                            <div className="rounded-lg bg-muted/50 p-2.5"><div className="text-[10px] text-muted-foreground uppercase">Check-in</div><div className="font-semibold mt-0.5">Nov 12 · 15:00</div></div>
                            <div className="rounded-lg bg-muted/50 p-2.5"><div className="text-[10px] text-muted-foreground uppercase">Check-out</div><div className="font-semibold mt-0.5">Nov 15 · 12:00</div></div>
                            <div className="rounded-lg bg-muted/50 p-2.5"><div className="text-[10px] text-muted-foreground uppercase">Room</div><div className="font-semibold mt-0.5">Deluxe 305</div></div>
                            <div className="rounded-lg bg-muted/50 p-2.5"><div className="text-[10px] text-muted-foreground uppercase">Guests</div><div className="font-semibold mt-0.5">2 adults</div></div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                            <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-[10.5px] font-medium text-primary border border-primary/10">Late checkout</span>
                            <span className="inline-flex items-center rounded-md bg-sky-50 px-2 py-0.5 text-[10.5px] font-medium text-sky-700 border border-sky-100">Non-smoking</span>
                            <span className="inline-flex items-center rounded-md bg-success/10 px-2 py-0.5 text-[10.5px] font-medium text-success border border-success/10">Airport pickup</span>
                        </div>
                    </div>
                    <div className="rounded-2xl bg-card border border-border p-4">
                        <div className="flex items-end justify-between mb-3">
                            <div>
                                <div className="text-[15px] font-semibold tracking-tight">Additional Services</div>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            {additionalServices.map((s, i) => (
                                <label key={i} className="flex items-center gap-3 rounded-lg border border-border p-2.5 cursor-pointer hover:bg-muted">
                                    <span className="h-4 w-4 rounded-md border border-border grid place-items-center"></span>
                                    <span className="flex-1 text-[12.5px] font-medium">{s.n}</span>
                                    <span className="text-[11.5px] text-muted-foreground tabular-nums">{s.p}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Booking Calendar */}
            <div className="rounded-2xl bg-card border border-border p-4">
                <div className="flex items-end justify-between mb-3">
                    <div>
                        <div className="text-[15px] font-semibold tracking-tight">Booking Calendar · This week</div>
                        <div className="text-[11.5px] text-muted-foreground mt-0.5">Nov 12 – 18</div>
                    </div>
                </div>
                <div className="grid grid-cols-8 gap-2 mb-2 text-[11px] text-muted-foreground font-medium">
                    <div></div>
                    {days.map((d) => <div key={d} className="text-center">Nov {d}</div>)}
                </div>
                {bookings.map((b, i) => (
                    <div key={i} className="flex items-center gap-2 py-1.5">
                        <div className="w-40 text-[11.5px] font-medium">{b.g}</div>
                        <div className="flex-1 relative h-7 bg-muted/50 rounded-lg">
                            <div className={`absolute top-1 bottom-1 ${b.tone} rounded-md text-white text-[10.5px] font-medium px-2 flex items-center`} style={{ left: `${(b.s / 7) * 100}%`, width: `${((b.e - b.s) / 7) * 100}%` }}>{b.e - b.s} nights</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    return <KasirLayout k={k} props={props} mainContent={mainContent} showSearch={false} />;
}
