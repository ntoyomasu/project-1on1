"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    ChevronLeft,
    Lightbulb,
    Loader2,
    Calendar,
    Search,
    Filter,
    Sparkles,
    Clock
} from "lucide-react";
import { reflectionService } from "@/services/reflectionService";
import { WeeklyReflection } from "@/types/reflection";

export default function ArchivePage() {
    const router = useRouter();
    const [reflections, setReflections] = useState<WeeklyReflection[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'ALL' | 'LIFE' | 'SOCCER' | 'STUDY'>('ALL');

    useEffect(() => {
        async function fetchAll() {
            try {
                const data = await reflectionService.getAllReflections("user_demo");
                setReflections(data);
            } catch (error) {
                console.error("Archive fetch error:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchAll();
    }, []);

    // 全ての「発明」をフラットなリストに変換
    const allInventions = reflections.flatMap(ref => {
        const dateStr = ref.weekStartDate.toDate().toLocaleDateString('ja-JP');
        return [
            { cat: 'LIFE', text: ref.life.learnings.success, date: dateStr, timestamp: ref.weekStartDate.toMillis() },
            { cat: 'SOCCER', text: ref.soccer.learnings.success, date: dateStr, timestamp: ref.weekStartDate.toMillis() },
            { cat: 'STUDY', text: ref.study.learnings.success, date: dateStr, timestamp: ref.weekStartDate.toMillis() }
        ].filter(inv => inv.text && inv.text.trim().length > 0);
    }).sort((a, b) => b.timestamp - a.timestamp);

    const filteredInventions = filter === 'ALL'
        ? allInventions
        : allInventions.filter(inv => inv.cat === filter);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
                <Loader2 className="animate-spin text-blue-500" size={32} />
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-[#0a0a0a] text-white p-6 pb-32">
            <header className="mb-8 pt-4">
                <button onClick={() => router.push("/")} className="p-2 -ml-2 text-zinc-400 hover:text-white transition-colors mb-4">
                    <ChevronLeft size={24} />
                </button>
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-yellow-500/10 text-yellow-500 flex items-center justify-center">
                        <Lightbulb size={24} />
                    </div>
                    <h1 className="text-2xl font-black tracking-tight">Invention Archive</h1>
                </div>
                <p className="text-zinc-500 text-sm font-medium">これまでに編み出した「自分だけの攻略法」のすべて</p>
            </header>

            {/* Filter Chips */}
            <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
                {(['ALL', 'LIFE', 'SOCCER', 'STUDY'] as const).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-5 py-2.5 rounded-full text-xs font-black tracking-widest transition-all whitespace-nowrap ${filter === f
                            ? "bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                            : "bg-zinc-900 text-zinc-500 border border-zinc-800 hover:border-zinc-700"
                            }`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            <div className="space-y-6">
                {filteredInventions.length > 0 ? (
                    filteredInventions.map((inv, idx) => (
                        <div key={idx} className="relative group">
                            {/* Connector Line */}
                            {idx !== filteredInventions.length - 1 && (
                                <div className="absolute left-6 top-14 bottom-[-24px] w-[1px] bg-zinc-800 hidden sm:block"></div>
                            )}

                            <div className="p-6 rounded-3xl bg-zinc-900/40 border border-zinc-800/80 backdrop-blur-sm hover:border-yellow-500/30 transition-all group-hover:bg-zinc-900/60 shadow-xl">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded tracking-widest uppercase ${inv.cat === 'LIFE' ? "bg-orange-500/10 text-orange-400" :
                                            inv.cat === 'SOCCER' ? "bg-green-500/10 text-green-400" :
                                                "bg-blue-500/10 text-blue-400"
                                            }`}>
                                            {inv.cat}
                                        </span>
                                        <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-tighter">
                                            {inv.date}
                                        </span>
                                    </div>
                                    <Sparkles size={14} className="text-yellow-500/20 group-hover:text-yellow-500/50 transition-colors" />
                                </div>
                                <p className="text-zinc-200 text-base leading-relaxed font-semibold italic">
                                    "{inv.text}"
                                </p>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="py-20 text-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-700">
                            <Search size={24} />
                        </div>
                        <p className="text-zinc-500 text-sm font-medium">まだ「発明」が記録されていません。<br />日々の振り返りで成功の理由を見つけましょう。</p>
                    </div>
                )}
            </div>

            {/* Global Nav-Bar (Universal 4-button) */}
            <nav className="fixed bottom-6 left-6 right-6 h-16 rounded-[2rem] border border-white/5 bg-zinc-900/80 backdrop-blur-xl flex items-center justify-around px-8 shadow-2xl z-50">
                <button onClick={() => router.push("/")} className="text-zinc-500 hover:text-white transition-all flex flex-col items-center gap-1">
                    <Zap size={20} />
                    <span className="text-[8px] font-black tracking-widest uppercase">Home</span>
                </button>
                <button className="text-yellow-500 px-3 py-2 rounded-xl bg-yellow-500/10 transition-all flex items-center gap-2">
                    <Lightbulb size={20} fill="currentColor" />
                    <span className="text-[10px] font-black tracking-widest">ARCHIVE</span>
                </button>
                <button onClick={() => router.push("/routine")} className="text-zinc-500 hover:text-white transition-all flex flex-col items-center gap-1">
                    <Clock size={20} />
                    <span className="text-[8px] font-black tracking-widest uppercase">Routine</span>
                </button>
                <button onClick={() => router.push("/summary")} className="text-zinc-500 hover:text-white transition-all flex flex-col items-center gap-1">
                    <Calendar size={20} />
                    <span className="text-[8px] font-black tracking-widest uppercase">Reports</span>
                </button>
            </nav>
        </main>
    );
}

import { Zap } from "lucide-react";
