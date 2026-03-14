"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    ChevronLeft,
    TrendingUp,
    TrendingDown,
    AlertCircle,
    Loader2,
    Zap,
    Sparkles,
    Target,
    Activity,
    Lightbulb,
    BarChart3,
    Calendar,
    Clock,
    UserCircle2,
    MessageSquareQuote,
    CheckCircle2
} from "lucide-react";
import { reflectionService } from "@/services/reflectionService";
import { analyzeROI, ROIAnalysis } from "@/lib/analytics";
import { WeeklyReflection, DailyRoutine } from "@/types/reflection";

function SummaryView() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const id = searchParams.get("id");

    const [reflection, setReflection] = useState<WeeklyReflection | null>(null);
    const [allReflections, setAllReflections] = useState<WeeklyReflection[]>([]);
    const [routines, setRoutines] = useState<DailyRoutine[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const [target, all] = await Promise.all([
                    id ? reflectionService.getReflectionById(id) : reflectionService.getLatestCompletedReflection("user_demo"),
                    reflectionService.getAllReflections("user_demo")
                ]);
                setReflection(target);
                setAllReflections(all);

                if (target) {
                    const weekRoutines = await reflectionService.getRoutinesForWeek("user_demo", target.weekStartDate.toDate());
                    setRoutines(weekRoutines);
                }
            } catch (error) {
                console.error("Summary fetch error:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
                <Loader2 className="animate-spin text-blue-500" size={32} />
            </div>
        );
    }

    if (!reflection) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] p-6 text-center pt-20">
                <AlertCircle className="mx-auto text-zinc-600 mb-4" size={48} />
                <p className="text-zinc-400">振り返りデータが見つかりませんでした</p>
                <button onClick={() => router.push("/")} className="mt-4 text-blue-400">ホームへ戻る</button>
            </div>
        );
    }

    const roiData = analyzeROI(reflection);
    const averageScore = Math.round((reflection.life.score + reflection.soccer.score + reflection.study.score) / 3);

    return (
        <main className="min-h-screen bg-[#0a0a0a] text-white p-6 pb-32">
            <header className="flex items-center justify-between mb-8 pt-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push("/")} className="p-2 -ml-2 text-zinc-400">
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-xl font-black tracking-tight uppercase">Performance Report</h1>
                        <p className="text-zinc-500 text-[10px] font-bold tracking-widest uppercase">
                            Week of {reflection.weekStartDate.toDate().toLocaleDateString('en-US')}
                        </p>
                    </div>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-full flex items-center gap-2">
                    <Activity size={12} className="text-blue-500" />
                    <span className="text-[10px] font-black">{reflection.status}</span>
                </div>
            </header>

            {/* 1. Overview Score */}
            <div className="mb-10 relative overflow-hidden p-8 rounded-[2.5rem] bg-gradient-to-br from-blue-600 to-blue-800 shadow-2xl shadow-blue-900/40">
                <div className="absolute top-0 right-0 p-6 opacity-20">
                    <TrendingUp size={120} />
                </div>
                <div className="relative z-10">
                    <h2 className="text-blue-100 text-xs font-black tracking-widest uppercase mb-1">Weekly Average Performance</h2>
                    <div className="flex items-baseline gap-2">
                        <span className="text-6xl font-black tracking-tighter">{averageScore}</span>
                        <span className="text-xl font-bold text-blue-200">%</span>
                    </div>
                    <p className="mt-4 text-sm text-blue-100/80 font-medium leading-relaxed max-w-[240px]">
                        {averageScore >= 80 ? "素晴らしいパフォーマンスです。この状態を維持するための「発明」を大切にしましょう。" :
                            averageScore >= 50 ? "着実な進歩が見られます。来週は更なる「伸び代」を追求していきましょう。" :
                                "課題が明確になった週です。生活リズムの再構築から始めましょう。"}
                    </p>
                </div>
            </div>

            {/* Routine Stats Section */}
            <div className="grid grid-cols-2 gap-4 mb-10">
                <div className="p-6 rounded-3xl bg-zinc-900/40 border border-zinc-800/80 backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <CheckCircle2 size={14} className="text-green-400" />
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Routine Mastery</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black">{
                            routines.length > 0
                                ? Math.round((routines.reduce((acc, r) => acc + (r.items.filter(i => i.completed).length / r.items.length), 0) / 7) * 100)
                                : 0
                        }</span>
                        <span className="text-xs font-bold text-zinc-600">%</span>
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-2 font-medium">Weekly consistency rate</p>
                </div>
                <div className="p-6 rounded-3xl bg-zinc-900/40 border border-zinc-800/80 backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <Clock size={14} className="text-blue-400" />
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Sleep Quality</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black">{
                            routines.length > 0
                                ? (routines.reduce((acc, r) => acc + r.sleepHours, 0) / routines.length).toFixed(1)
                                : 0
                        }</span>
                        <span className="text-xs font-bold text-zinc-600">h</span>
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-2 font-medium">Average sleep duration</p>
                </div>
            </div>

            {/* 2. ROI Breakdown Cards */}
            <section className="space-y-6">
                <div className="flex items-center gap-2 px-1">
                    <BarChart3 size={16} className="text-zinc-500" />
                    <h2 className="text-xs font-black tracking-widest text-zinc-500 uppercase">Analysis Breakdown</h2>
                </div>

                {roiData.map((roi) => (
                    <div key={roi.category} className="p-6 rounded-3xl bg-zinc-900/40 border border-zinc-800/80 backdrop-blur-sm">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-lg font-black tracking-tight">{roi.category}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Efficiency:</span>
                                    <span className={`text-[10px] font-black uppercase ${roi.status === 'PROFIT' ? 'text-green-400' : roi.status === 'LOSS' ? 'text-red-400' : 'text-yellow-400'}`}>
                                        {roi.status}
                                    </span>
                                </div>
                            </div>
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${roi.score >= 80 ? "bg-green-500/10 text-green-400 border border-green-500/20" :
                                roi.score >= 50 ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20" :
                                    "bg-red-500/10 text-red-400 border border-red-500/20"
                                }`}>
                                {roi.score}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-2">
                                <div className="flex items-center gap-1.5">
                                    <Target size={12} className="text-zinc-600" />
                                    <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Investment (Plan)</span>
                                </div>
                                <p className="text-sm text-zinc-400 font-medium leading-relaxed pl-4 border-l border-zinc-800">{roi.investment}</p>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-1.5">
                                    <Zap size={12} className="text-blue-500/60" />
                                    <span className="text-[9px] font-black text-blue-500/60 uppercase tracking-widest">Return (Actual)</span>
                                </div>
                                <p className="text-sm text-zinc-200 font-semibold leading-relaxed pl-4 border-l border-blue-500/30">{roi.return}</p>
                            </div>
                        </div>
                    </div>
                ))}

                {/* 3. Mentor Perspective (AI + Manual) */}
                <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-zinc-900 to-zinc-950 border border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-10">
                        <UserCircle2 size={100} className="text-blue-500" />
                    </div>

                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                            <MessageSquareQuote size={20} />
                        </div>
                        <h2 className="text-base font-black tracking-tight uppercase">Mentor's Perspective</h2>
                    </div>

                    <div className="space-y-8 relative z-10">
                        {/* AI Advice */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Sparkles size={14} className="text-yellow-500" />
                                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">AI Intelligence</span>
                            </div>
                            <div className="p-5 rounded-2xl bg-white/5 border border-white/5 italic text-sm text-blue-100/90 leading-relaxed font-medium">
                                {averageScore >= 80 ?
                                    "高スコアを維持できています。特にルーチン化された「発明」が寄与しているようです。来週はこれらを無意識の習慣まで昇華させましょう。" :
                                    averageScore >= 50 ?
                                        "全体的に安定していますが、特定のカテゴリでの「怠慢」が平均を下げています。まずは一点突破でその課題を潰すことにフォーカスすべきです。" :
                                        "生活リズムの乱れが全カテゴリに波及しています。まずは睡眠時間の確保と、朝のルーチンだけを死守することから立て直しましょう。"
                                }
                            </div>
                        </div>

                        {/* Manual Comment */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <UserCircle2 size={14} className="text-zinc-500" />
                                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Human Feedback</span>
                            </div>
                            <div className="pl-4 border-l-2 border-zinc-800">
                                <p className="text-sm text-zinc-400 font-medium leading-relaxed">
                                    {reflection.mentorComment || "メンターからの直接コメントはありません。"}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. Inventions Section */}
                <div className="p-8 rounded-[2rem] bg-zinc-950 border border-zinc-800 relative overflow-hidden group">
                    <div className="absolute -top-10 -right-10 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Lightbulb size={160} className="text-yellow-500" />
                    </div>
                    <div className="flex items-center gap-2 mb-6">
                        <Sparkles size={16} className="text-yellow-500" />
                        <h3 className="text-sm font-black tracking-widest text-zinc-400 uppercase">Discoveries</h3>
                    </div>
                    <div className="space-y-4 relative z-10">
                        {roiData.some(r => reflection[r.category === '学習' ? 'study' : r.category === 'サッカー' ? 'soccer' : 'life'].learnings.success) ? (
                            roiData.map(r => {
                                const success = reflection[r.category === '学習' ? 'study' : r.category === 'サッカー' ? 'soccer' : 'life'].learnings.success;
                                return success ? (
                                    <div key={r.category} className="flex gap-4">
                                        <div className="w-1 h-auto bg-yellow-500/30 rounded-full"></div>
                                        <p className="text-sm text-zinc-300 font-medium italic">"{success}"</p>
                                    </div>
                                ) : null;
                            })
                        ) : (
                            <p className="text-zinc-600 text-sm italic italic">今週の独自の発明は特に記録されていません</p>
                        )}
                    </div>
                </div>
            </section>

            {/* Global Nav-Bar (Universal 4-button) */}
            <nav className="fixed bottom-6 left-6 right-6 h-16 rounded-[2rem] border border-white/5 bg-zinc-900/80 backdrop-blur-xl flex items-center justify-around px-8 shadow-2xl z-50">
                <button onClick={() => router.push("/")} className="text-zinc-500 hover:text-white transition-all flex flex-col items-center gap-1">
                    <Zap size={20} />
                    <span className="text-[8px] font-black tracking-widest uppercase">Home</span>
                </button>
                <button onClick={() => router.push("/archive")} className="text-zinc-500 hover:text-white transition-all flex flex-col items-center gap-1">
                    <Lightbulb size={20} />
                    <span className="text-[8px] font-black tracking-widest uppercase">Archive</span>
                </button>
                <button onClick={() => router.push("/routine")} className="text-zinc-500 hover:text-white transition-all flex flex-col items-center gap-1">
                    <Clock size={20} />
                    <span className="text-[8px] font-black tracking-widest uppercase">Routine</span>
                </button>
                <button className="text-blue-500 px-3 py-2 rounded-xl bg-blue-500/10 transition-all flex items-center gap-2">
                    <Calendar size={20} fill="currentColor" />
                    <span className="text-[10px] font-black tracking-widest">REPORTS</span>
                </button>
            </nav>
        </main>
    );
}

export default function SummaryPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
                <Loader2 className="animate-spin text-blue-500" size={32} />
            </div>
        }>
            <SummaryView />
        </Suspense>
    );
}
