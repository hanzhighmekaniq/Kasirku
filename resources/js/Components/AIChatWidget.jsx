import { useState, useRef, useEffect } from 'react';
import { router } from '@inertiajs/react';

export default function AIChatWidget({ filters }) {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef(null);

    useEffect(() => {
        if (open && messages.length === 0) {
            setMessages([
                { role: 'ai', text: 'Halo! 👋 Tanya saya seputar laporan. Misalnya:\n\n• "Produk apa yang paling laris?"\n• "Berapa rata-rata transaksi per hari?"\n• "Bandingkan penjualan dengan periode lalu"\n• "Siapa pelanggan terbaik?"' },
            ]);
        }
    }, [open]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const send = async () => {
        const q = input.trim();
        if (!q || loading) return;
        setInput('');
        setMessages((prev) => [...prev, { role: 'user', text: q }]);
        setLoading(true);

        try {
            const res = await fetch(route('admin.reports.ask-ai'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content },
                body: JSON.stringify({
                    question: q,
                    start_date: filters.start_date,
                    end_date: filters.end_date,
                    branch_ids: filters.branch_ids,
                }),
            });
            const data = await res.json();
            setMessages((prev) => [...prev, { role: 'ai', text: data.answer, period: data.context_period }]);
        } catch {
            setMessages((prev) => [...prev, { role: 'ai', text: 'Maaf, terjadi kesalahan. Coba lagi ya.' }]);
        } finally {
            setLoading(false);
        }
    };

    const handleKey = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            send();
        }
    };

    if (!open) {
        return (
            <button
                onClick={() => setOpen(true)}
                className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-lg shadow-primary-200 transition hover:bg-primary-700 hover:scale-105 active:scale-95"
                title="Tanya AI"
            >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                </svg>
            </button>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 z-50 flex w-[380px] flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/60">
            {/* Header */}
            <div className="flex items-center justify-between rounded-t-2xl bg-gradient-to-r from-primary-600 to-primary-600 px-4 py-3 text-white">
                <div className="flex items-center gap-2">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                    </svg>
                    <span className="text-sm font-semibold">Tanya AI</span>
                </div>
                <button onClick={() => setOpen(false)} className="rounded-lg p-1 transition hover:bg-white/20">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Messages */}
            <div className="flex h-[380px] flex-col gap-3 overflow-y-auto px-4 py-3 text-sm">
                {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-xl px-3.5 py-2.5 leading-relaxed ${
                            m.role === 'user'
                                ? 'bg-primary-600 text-white'
                                : 'bg-slate-50 text-slate-700 ring-1 ring-slate-200/60'
                        }`}>
                            {m.period && (
                                <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-slate-400">{m.period}</p>
                            )}
                            <p className="whitespace-pre-wrap">{m.text}</p>
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <div className="max-w-[85%] rounded-xl bg-slate-50 px-3.5 py-2.5 ring-1 ring-slate-200/60">
                            <div className="flex items-center gap-1.5">
                                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300" style={{ animationDelay: '0ms' }} />
                                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300" style={{ animationDelay: '150ms' }} />
                                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="border-t border-slate-100 p-3">
                <div className="flex items-end gap-2">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKey}
                        placeholder="Tanya tentang laporan..."
                        rows={1}
                        className="min-h-[38px] flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition placeholder:text-slate-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                    />
                    <button
                        onClick={send}
                        disabled={loading || !input.trim()}
                        className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white transition hover:bg-primary-700 disabled:opacity-40"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
