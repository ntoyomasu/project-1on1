"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    ChevronLeft,
    Lightbulb,
    Loader2,
    Calendar,
    Search,
    Sparkles,
    Clock,
    Zap,
    History,
    ChevronDown,
    ChevronUp,
    Target,
    CheckCircle2,
    ArrowRight
} from "lucide-react";
import { reflectionService } from "@/services/reflectionService";
import { WeeklyReflection } from "@/types/reflection";

export default function ArchivePage() {
    const router = useRouter();
    const [reflections, setReflections] = useState<WeeklyReflection[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'HISTORY' | 'INVENTIONS'>('HISTORY');
    const [filter, setFilter] = useState<'ALL' | 'LIFE' | 'SOCCER' | 'STUDY'>('ALL');
    const [expandedId, setExpandedId] = useState<string | null>(null);

    useEffect(() => {
        async function fetchAll() {
            try {
                const data = await reflectionService.getAllReflections("user_demo");
                // Sort by date descending
                setReflections(data.sort((a, b) => b.weekStartDate.toMillis() - a.weekStartDate.toMillis()));
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
                        <History size={24} />
                    </div>
                    <h1 className="text-2xl font-black tracking-tight">Archive</h1>
                </div>
                <p className="text-zinc-500 text-sm font-medium">これまでの歩みと積み重ねた知恵</p>
            </header>

            {/* View Switcher */}
            <div className="flex p-1 bg-zinc-900 rounded-2xl mb-8">
                <button
                    onClick={() => setView('HISTORY')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black tracking-widest transition-all ${view === 'HISTORY' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500'}`}
                >
                    <Clock size={16} />
                    HISTORY
                </button>
                <button
                    onClick={() => setView('INVENTIONS')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black tracking-widest transition-all ${view === 'INVENTIONS' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500'}`}
                >
                    <Lightbulb size={16} />
                    INVENTIONS
                </button>
            </div>

            {view === 'INVENTIONS' ? (
                <>
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
                                <p className="text-zinc-500 text-sm font-medium">まだ「発明」が記録されていません。</p>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <div className="space-y-4">
                    {reflections.map((ref) => (
                        <div key={ref.id} className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl overflow-hidden backdrop-blur-sm transition-all hover:bg-zinc-900/60">
                            <button
                                onClick={() => setExpandedId(expandedId === ref.id ? null : ref.id)}
                                className="w-full p-5 flex items-center justify-between text-left"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-zinc-500 tracking-widest uppercase mb-0.5">WEEK START</span>
                                        <span className="text-lg font-black">{ref.weekStartDate.toDate().toLocaleDateString('ja-JP')}</span>
                                    </div>
                                    <div className="flex gap-2 ml-4">
                                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black ${ref.study.score >= 80 ? 'bg-blue-500/20 text-blue-400' : 'bg-zinc-800 text-zinc-500'}`}>
                                            {ref.study.score}
                                        </span>
                                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black ${ref.soccer.score >= 80 ? 'bg-green-500/20 text-green-400' : 'bg-zinc-800 text-zinc-500'}`}>
                                            {ref.soccer.score}
                                        </span>
                                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black ${ref.life.score >= 80 ? 'bg-orange-500/20 text-orange-400' : 'bg-zinc-800 text-zinc-500'}`}>
                                            {ref.life.score}
                                        </span>
                                    </div>
                                </div>
                                {expandedId === ref.id ? <ChevronUp size={20} className="text-zinc-500" /> : <ChevronDown size={20} className="text-zinc-500" />}
                            </button>

                            {expandedId === ref.id && (
                                <div className="px-5 pb-6 space-y-6 animate-in slide-in-from-top-2 duration-200">
                                    <div className="h-[1px] bg-zinc-800 w-full" />

                                    {/* Detailed Sections */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {(['STUDY', 'SOCCER', 'LIFE'] as const).map((catName) => {
                                            const cat = catName === 'STUDY' ? ref.study : catName === 'SOCCER' ? ref.soccer : ref.life;
                                            const color = catName === 'STUDY' ? 'blue' : catName === 'SOCCER' ? 'green' : 'orange';
                                            return (
                                                <div key={catName} className="space-y-3">
                                                    <div className={`text-[10px] font-black tracking-[0.2em] px-2 py-1 rounded bg-${color}-500/10 text-${color}-400 inline-block uppercase`}>
                                                        {catName}
                                                    </div>

                                                    {cat.plan && (
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-1.5 text-zinc-500">
                                                                <Target size={12} />
                                                                <span className="text-[9px] font-black uppercase tracking-wider">Plan</span>
                                                            </div>
                                                            <p className="text-xs text-zinc-300 leading-relaxed bg-white/5 p-2 rounded-lg">{cat.plan}</p>
                                                        </div>
                                                    )}

                                                    {(cat.learnings.success || cat.learnings.failure) && (
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-1.5 text-zinc-500">
                                                                <CheckCircle2 size={12} />
                                                                <span className="text-[9px] font-black uppercase tracking-wider">Learnings</span>
                                                            </div>
                                                            {cat.learnings.success && <p className="text-xs text-green-400/80 leading-relaxed bg-green-500/5 p-2 rounded-lg border border-green-500/10">＋ {cat.learnings.success}</p>}
                                                            {cat.learnings.failure && <p className="text-xs text-red-400/80 leading-relaxed bg-red-500/5 p-2 rounded-lg border border-red-500/10">－ {cat.learnings.failure}</p>}
                                                        </div>
                                                    )}

                                                    {cat.nextWill && (
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-1.5 text-zinc-500">
                                                                <ArrowRight size={12} />
                                                                <span className="text-[9px] font-black uppercase tracking-wider">Next Will</span>
                                                            </div>
                                                            <p className="text-xs text-zinc-300 leading-relaxed bg-white/5 p-2 rounded-lg">{cat.nextWill}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {ref.inventionNote && (
                                        <div className="p-4 rounded-2xl bg-yellow-500/5 border border-yellow-500/20">
                                            <div className="flex items-center gap-2 mb-2 text-yellow-500">
                                                <Sparkles size={16} />
                                                <span className="text-[10px] font-black uppercase tracking-wider">Weekly Invention Note</span>
                                            </div>
                                            <p className="text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">{ref.inventionNote}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Global Nav-Bar */}
            <nav className="fixed bottom-6 left-6 right-6 h-16 rounded-[2rem] border border-white/5 bg-zinc-900/80 backdrop-blur-xl flex items-center justify-around px-8 shadow-2xl z-50">
                <button onClick={() => router.push("/")} className="text-zinc-500 hover:text-white transition-all flex flex-col items-center gap-1">
                    <Zap size={20} />
                    <span className="text-[8px] font-black tracking-widest uppercase">Home</span>
                </button>
                <button className="text-yellow-500 px-3 py-2 rounded-xl bg-yellow-500/10 transition-all flex items-center gap-2">
                    <History size={20} fill="currentColor" />
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
