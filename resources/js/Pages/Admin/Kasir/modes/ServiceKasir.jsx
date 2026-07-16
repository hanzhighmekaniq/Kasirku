import useKasir from "../useKasir";
import KasirLayout from "./KasirLayout";

export default function ServiceKasir(props) {
    const k = useKasir(props);
    const { employees = [] } = props;

    const staff = employees.length > 0
        ? employees.map((e, i) => ({
            n: e.name,
            role: e.position || "Staff",
            avail: e.status === "busy" ? "Busy" : "Free now",
            rate: e.commission_value > 0
                ? `${e.commission_type === "percent" ? e.commission_value + "%" : "Rp " + Number(e.commission_value).toLocaleString("id-ID")}`
                : "",
            busy: e.status === "busy",
            av: e.name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase(),
            color: ["from-fuchsia-400 to-rose-500", "from-sky-400 to-indigo-500", "from-amber-400 to-orange-500", "from-emerald-400 to-teal-500"][i % 4],
        }))
        : [
            { n: "Jenna Wills", role: "Senior Stylist", avail: "Free · 14:00", rate: "", busy: false, av: "JW", color: "from-fuchsia-400 to-rose-500" },
            { n: "Marco Reyes", role: "Barber", avail: "Busy · until 13:45", rate: "", busy: true, av: "MR", color: "from-sky-400 to-indigo-500" },
            { n: "Lea Park", role: "Colorist", avail: "Free now", rate: "", busy: false, av: "LP", color: "from-amber-400 to-orange-500" },
            { n: "Diego Suarez", role: "Junior Stylist", avail: "Free · 15:30", rate: "", busy: false, av: "DS", color: "from-emerald-400 to-teal-500" },
        ];

    const services = [
        { n: "Haircut & Blowdry", d: "45 min", p: 38000, ic: "✂️", c: "Hair" },
        { n: "Beard Trim", d: "20 min", p: 18000, ic: "🧔", c: "Grooming" },
        { n: "Full Color", d: "2 hr", p: 120000, ic: "🎨", c: "Color" },
        { n: "Deep Conditioning", d: "30 min", p: 28000, ic: "💆", c: "Treatment" },
        { n: "Highlights", d: "1h 30m", p: 95000, ic: "✨", c: "Color" },
        { n: "Kids Cut", d: "25 min", p: 20000, ic: "🧒", c: "Hair" },
    ];

    const queue = [
        { n: "K. Hillman", s: "Beard Trim · Marco", t: "Now", tone: "brand" },
        { n: "R. Osei", s: "Haircut · Any", t: "12 min", tone: "warn" },
        { n: "P. Yamada", s: "Full Color · Lea", t: "40 min", tone: "default" },
    ];

    const toneMap = {
        brand: "bg-indigo-50 text-indigo-700 border border-indigo-100",
        warn: "bg-amber-50 text-amber-700 border border-amber-100",
        default: "bg-slate-100 text-slate-700",
    };

    const hours = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];
    const bars = [
        { n: "Jenna", s: 1, e: 3, label: "A. Chen · Highlights", tone: "bg-indigo-500" },
        { n: "Marco", s: 2, e: 3, label: "K. Hill · Beard", tone: "bg-rose-500" },
        { n: "Lea", s: 0, e: 2, label: "M. Park · Color", tone: "bg-amber-500" },
        { n: "Diego", s: 5, e: 6, label: "Break", tone: "bg-slate-300" },
    ];

    const mainContent = (
        <div className="flex-1 overflow-y-auto p-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {/* Schedule + Queue */}
            <div className="grid grid-cols-3 gap-5 mb-5">
                <div className="col-span-2 rounded-2xl bg-white border border-slate-200 p-4">
                    <div className="flex items-end justify-between mb-3">
                        <div>
                            <div className="text-[15px] font-semibold tracking-tight">Today's Schedule</div>
                            <div className="text-[11.5px] text-slate-500 mt-0.5">Schedule at a glance</div>
                        </div>
                        <div className="flex gap-1.5">
                            <button className="h-8 px-3 rounded-lg border border-slate-200 text-[11.5px] hover:bg-slate-50">Day</button>
                            <button className="h-8 px-3 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-[11.5px] shadow-sm">Staff</button>
                            <button className="h-8 px-3 rounded-lg border border-slate-200 text-[11.5px] hover:bg-slate-50">Week</button>
                        </div>
                    </div>
                    <div className="flex border-b border-slate-200 mb-1">
                        <div className="w-16"></div>
                        {hours.map((h) => (
                            <div key={h} className="flex-1 border-r last:border-r-0 border-slate-100 text-center py-2 text-[10.5px] text-slate-500 font-medium">{h}</div>
                        ))}
                    </div>
                    {bars.map((b, i) => (
                        <div key={i} className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-b-0">
                            <div className="w-16 text-[11.5px] font-medium text-slate-700">{b.n}</div>
                            <div className="flex-1 relative h-8 bg-slate-50 rounded-lg">
                                <div className={`absolute top-1 bottom-1 ${b.tone} rounded-md text-white text-[10.5px] font-medium px-2 flex items-center`} style={{ left: `${(b.s / 10) * 100}%`, width: `${((b.e - b.s) / 10) * 100}%` }}>{b.label}</div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="rounded-2xl bg-white border border-slate-200 p-4">
                    <div className="flex items-end justify-between mb-3">
                        <div>
                            <div className="text-[15px] font-semibold tracking-tight">Queue</div>
                            <div className="text-[11.5px] text-slate-500 mt-0.5">{queue.length} waiting</div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        {queue.map((q, i) => (
                            <div key={i} className="rounded-xl border border-slate-200 p-3 flex items-center gap-3">
                                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 grid place-items-center text-[11px] font-semibold text-slate-700">{q.n.split(" ").map((x) => x[0]).join("")}</div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-[12.5px] font-semibold truncate">{q.n}</div>
                                    <div className="text-[10.5px] text-slate-500 truncate">{q.s}</div>
                                </div>
                                <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10.5px] font-medium ${toneMap[q.tone]}`}>{q.t}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Staff availability */}
            <div className="flex items-end justify-between mb-3">
                <div>
                    <div className="text-[15px] font-semibold tracking-tight">Staff Availability</div>
                    <div className="text-[11.5px] text-slate-500 mt-0.5">{staff.length} stylists on shift</div>
                </div>
            </div>
            <div className="grid grid-cols-4 gap-3 mb-6">
                {staff.map((s, i) => (
                    <div key={i} className="rounded-2xl border border-slate-200 bg-white p-3.5 transition-all cursor-pointer hover:border-indigo-400">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className={`h-11 w-11 rounded-full bg-gradient-to-br ${s.color} grid place-items-center text-white text-[12px] font-semibold shadow-sm`}>{s.av}</div>
                                <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${s.busy ? "bg-rose-500" : "bg-emerald-500"}`}></span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-[13px] font-semibold leading-tight">{s.n}</div>
                                <div className="text-[10.5px] text-slate-500 mt-0.5">{s.role}</div>
                            </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-[11px]">
                            <span className={s.busy ? "text-rose-600 font-medium" : "text-emerald-600 font-medium"}>{s.avail}</span>
                            {s.rate && <span className="text-slate-500">{s.rate}</span>}
                        </div>
                    </div>
                ))}
            </div>

            {/* Services */}
            <div className="flex items-end justify-between mb-3">
                <div>
                    <div className="text-[15px] font-semibold tracking-tight">Services</div>
                    <div className="text-[11.5px] text-slate-500 mt-0.5">Select to add to booking</div>
                </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
                {services.map((s, i) => (
                    <button key={i} onClick={() => k.addToCart({ id: `svc-${i}`, name: s.n, sell_price: s.p, track_stock: false })} className="text-left rounded-2xl bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all p-4">
                        <div className="flex items-start justify-between">
                            <div className="h-11 w-11 rounded-xl bg-slate-50 grid place-items-center text-xl">{s.ic}</div>
                            <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[10.5px] font-medium text-slate-700">{s.c}</span>
                        </div>
                        <div className="text-[13.5px] font-semibold mt-3 leading-tight">{s.n}</div>
                        <div className="text-[11px] text-slate-500 mt-1">{s.d}</div>
                        <div className="mt-2 text-[15px] font-semibold tabular-nums">{k.fmt(s.p)}</div>
                    </button>
                ))}
            </div>
        </div>
    );

    return <KasirLayout k={k} props={props} mainContent={mainContent} />;
}
