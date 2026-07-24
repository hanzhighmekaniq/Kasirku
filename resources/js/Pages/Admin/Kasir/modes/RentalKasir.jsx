import { useState } from "react";
import useKasir from "../useKasir";
import KasirLayout from "./KasirLayout";

export default function RentalKasir(props) {
    const k = useKasir(props);
    const [currentMonth] = useState(new Date(2026, 10));

    const items = [
        { n: "Sony A7 IV", c: "Camera Body", p: 85000, unit: "/day", ic: "📷", st: "3 available", stTone: "success" },
        { n: "Canon RF 24-70mm", c: "Lens", p: 45000, unit: "/day", ic: "🔭", st: "1 left", stTone: "warn" },
        { n: "DJI Ronin RS3", c: "Gimbal", p: 60000, unit: "/day", ic: "🎥", st: "Available", stTone: "success" },
        { n: "Aputure 300D", c: "Lighting", p: 35000, unit: "/day", ic: "💡", st: "Booked", stTone: "danger" },
        { n: "Rode Wireless Go", c: "Audio", p: 20000, unit: "/day", ic: "🎙", st: "5 available", stTone: "success" },
        { n: "Manfrotto Tripod", c: "Support", p: 15000, unit: "/day", ic: "📐", st: "Available", stTone: "success" },
    ];

    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const dates = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29];
    const rentedRange = [12, 13, 14];
    const pickedRange = [16, 17, 18, 19];

    const checklist = ["ID scanned", "Rental contract signed", "Equipment inspected", "Insurance opted-in"];

    const toneMap = {
        success: "bg-success/10 text-success border border-emerald-100",
        warn: "bg-warning/10 text-warning border border-amber-100",
        danger: "bg-destructive/5 text-destructive border border-rose-100",
    };

    const mainContent = (
        <div className="flex-1 overflow-y-auto p-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {/* Calendar + Deposit */}
            <div className="grid grid-cols-3 gap-5 mb-5">
                <div className="col-span-2 rounded-2xl bg-card border border-border p-4">
                    <div className="flex items-end justify-between mb-3">
                        <div>
                            <div className="text-[15px] font-semibold tracking-tight">Rental Calendar · November 2026</div>
                            <div className="text-[11.5px] text-muted-foreground mt-0.5">Pickup Sat 16 · Return Tue 19 · 4 days</div>
                        </div>
                        <div className="flex gap-1">
                            <button className="h-8 w-8 rounded-lg border border-border grid place-items-center hover:bg-muted">‹</button>
                            <button className="h-8 w-8 rounded-lg border border-border grid place-items-center hover:bg-muted">›</button>
                        </div>
                    </div>
                    <div className="grid grid-cols-7 gap-1.5 mb-1.5">
                        {days.map((d) => <div key={d} className="text-center text-[10.5px] uppercase tracking-wider text-muted-foreground font-medium py-1">{d}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-1.5">
                        {dates.map((d) => {
                            const cls = rentedRange.includes(d)
                                ? "bg-destructive/5 text-destructive border-destructive/20"
                                : pickedRange.includes(d)
                                    ? "bg-gradient-to-br bg-primary text-white border-primary shadow-sm"
                                    : "bg-card border-border hover:border-indigo-400";
                            return <button key={d} className={`h-11 rounded-lg border text-[12.5px] font-medium transition-all ${cls}`}>{d}</button>;
                        })}
                    </div>
                    <div className="mt-4 flex items-center gap-3 text-[11px]">
                        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-indigo-500"></span>Selected</span>
                        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-destructive/10 border border-destructive/20"></span>Unavailable</span>
                        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-card border border-border"></span>Free</span>
                    </div>
                </div>
                <div className="space-y-4">
                    <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 text-white p-5">
                        <div className="text-[10.5px] uppercase tracking-widest text-white/60 font-medium">Security Deposit</div>
                        <div className="mt-2 text-[32px] font-semibold tracking-tight">{k.fmt(450000)}</div>
                        <div className="text-[11px] text-white/70 mt-1">Held on card ending ····4821</div>
                        <div className="mt-4 flex gap-2">
                            <span className="inline-flex items-center rounded-md bg-card/10 border border-white/10 px-2 py-0.5 text-[10.5px] font-medium text-white">Auth ok</span>
                            <span className="inline-flex items-center rounded-md bg-card/10 border border-white/10 px-2 py-0.5 text-[10.5px] font-medium text-white">Refund on return</span>
                        </div>
                    </div>
                    <div className="rounded-2xl bg-card border border-border p-4">
                        <div className="text-[10.5px] uppercase tracking-widest text-muted-foreground font-medium">Return Checklist</div>
                        <div className="mt-2 space-y-1.5 text-[12.5px]">
                            {checklist.map((x, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <span className={`h-4 w-4 rounded-md border ${i < 3 ? "bg-success border-emerald-500 text-white grid place-items-center" : "border-slate-300"}`}>{i < 3 ? "✓" : ""}</span>
                                    {x}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Equipment grid */}
            <div className="flex items-end justify-between mb-3">
                <div>
                    <div className="text-[15px] font-semibold tracking-tight">Equipment</div>
                    <div className="text-[11.5px] text-muted-foreground mt-0.5">Filter by category · Camera</div>
                </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
                {items.map((item, i) => (
                    <div key={i} className="rounded-2xl border border-border bg-card p-3.5 hover:border-indigo-400 hover:shadow-md transition-all">
                        <div className="flex items-start gap-3">
                            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 grid place-items-center text-2xl">{item.ic}</div>
                            <div className="flex-1 min-w-0">
                                <div className="text-[10.5px] uppercase tracking-wider text-muted-foreground font-medium">{item.c}</div>
                                <div className="text-[13.5px] font-semibold leading-tight mt-0.5">{item.n}</div>
                                <div className="mt-1">
                                    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10.5px] font-medium ${toneMap[item.stTone]}`}>{item.st}</span>
                                </div>
                            </div>
                        </div>
                        <div className="mt-3 flex items-baseline justify-between">
                            <div className="text-[15px] font-semibold tabular-nums">{k.fmt(item.p)}<span className="text-[10.5px] text-muted-foreground font-normal">{item.unit}</span></div>
                            <button onClick={() => k.addToCart({ id: `rent-${i}`, name: item.n, sell_price: item.p, track_stock: false })} className="h-8 px-3 rounded-lg bg-primary text-foreground text-[11.5px] font-medium shadow-sm">Add</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    return <KasirLayout k={k} props={props} mainContent={mainContent} showSearch={false} />;
}
