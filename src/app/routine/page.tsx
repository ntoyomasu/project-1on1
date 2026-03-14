"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    ChevronLeft,
    CheckCircle2,
    Circle,
    Moon,
    Sun,
    Zap,
    Loader2,
    Calendar,
    Lightbulb,
    Save,
    Clock
} from "lucide-react";
import { reflectionService } from "@/services/reflectionService";
import { DailyRoutine } from "@/types/reflection";

export default function RoutinePage() {
    const router = useRouter();
    const today = new Date().toISOString().split('T')[0];

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [items, setItems] = useState([
        { taskName: "朝の白湯を飲む", completed: false, time: "morning" },
        { taskName: "ストレッチ 10分", completed: false, time: "morning" },
        { taskName: "今日の一番の目標を確認", completed: false, time: "morning" },
        { taskName: "スマホを22時以降見ない", completed: false, time: "evening" },
        { taskName: "日記/振り返り 5分", completed: false, time: "evening" },
        { taskName: "明日の準備", completed: false, time: "evening" },
    ]);
    const [sleepHours, setSleepHours] = useState(7);

    useEffect(() => {
        async function load() {
            try {
                const data = await reflectionService.getDailyRoutine("user_demo", today);
                if (data) {
                    // 既存のタスク名でマッピングして状態を復元（なければデフォルト）
                    const restoredItems = items.map(defaultItem => {
                        const saved = data.items.find(i => i.taskName === defaultItem.taskName);
                        return saved ? { ...defaultItem, completed: saved.completed } : defaultItem;
                    });
                    setItems(restoredItems);
                    setSleepHours(data.sleepHours || 7);
                }
            } catch (error) {
                console.error("Routine load error:", error);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [today]);

    const toggleItem = (idx: number) => {
        const newItems = [...items];
        newItems[idx].completed = !newItems[idx].completed;
        setItems(newItems);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await reflectionService.saveDailyRoutine("user_demo", {
                date: today,
                userId: "user_demo",
                items: items.map(({ taskName, completed }) => ({ taskName, completed })),
                sleepHours
            });
            router.push("/");
        } catch (error) {
            console.error("Routine save error:", error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
                <Loader2 className="animate-spin text-blue-500" size={32} />
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-[#0a0a0a] text-white p-6 pb-40">
            <header className="mb-10 pt-4">
                <button onClick={() => router.push("/")} className="p-2 -ml-2 text-zinc-400 hover:text-white transition-colors mb-4">
                    <ChevronLeft size={24} />
                </button>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight">Daily Routine</h1>
                        <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">
                            {new Date().toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'long' })}
                        </p>
                    </div>
                </div>
            </header>

            <section className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Morning Section */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 px-1 text-orange-400">
                        <Sun size={20} />
                        <h2 className="text-sm font-black tracking-widest uppercase">Morning Ritual</h2>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                        {items.filter(i => i.time === "morning").map((item, idx) => {
                            const originalIdx = items.findIndex(i => i.taskName === item.taskName);
                            return (
                                <button
                                    key={idx}
                                    onClick={() => toggleItem(originalIdx)}
                                    className={`flex items-center justify-between p-5 rounded-3xl border transition-all ${item.completed
                                        ? "bg-orange-500/10 border-orange-500/30 text-orange-200"
                                        : "bg-zinc-900/50 border-zinc-800 text-zinc-400"
                                        }`}
                                >
                                    <span className="font-semibold text-sm">{item.taskName}</span>
                                    {item.completed ? <CheckCircle2 className="text-orange-400 shadow-[0_0_10px_rgba(251,146,60,0.4)]" size={24} /> : <Circle size={24} className="opacity-20" />}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Evening Section */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 px-1 text-blue-400">
                        <Moon size={20} />
                        <h2 className="text-sm font-black tracking-widest uppercase">Evening Ritual</h2>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                        {items.filter(i => i.time === "evening").map((item, idx) => {
                            const originalIdx = items.findIndex(i => i.taskName === item.taskName);
                            return (
                                <button
                                    key={idx}
                                    onClick={() => toggleItem(originalIdx)}
                                    className={`flex items-center justify-between p-5 rounded-3xl border transition-all ${item.completed
                                        ? "bg-blue-500/10 border-blue-500/30 text-blue-200"
                                        : "bg-zinc-900/50 border-zinc-800 text-zinc-400"
                                        }`}
                                >
                                    <span className="font-semibold text-sm">{item.taskName}</span>
                                    {item.completed ? <CheckCircle2 className="text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.4)]" size={24} /> : <Circle size={24} className="opacity-20" />}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Sleep Control */}
                <div className="p-6 rounded-[2.5rem] bg-zinc-900/40 border border-zinc-800/80">
                    <h3 className="text-xs font-black text-zinc-500 tracking-widest uppercase mb-6 text-center">Sleep Quality</h3>
                    <div className="flex flex-col items-center gap-6">
                        <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-black">{sleepHours}</span>
                            <span className="text-sm font-bold text-zinc-600">hours</span>
                        </div>
                        <input
                            type="range"
                            min="4"
                            max="12"
                            step="0.5"
                            value={sleepHours}
                            onChange={(e) => setSleepHours(Number(e.target.value))}
                            className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                        <p className="text-[10px] font-bold text-zinc-600 italic">睡眠はパフォーマンスの全ての土台です</p>
                    </div>
                </div>
            </section>

            {/* Bottom Save Button */}
            <div className="fixed bottom-32 left-0 right-0 p-6 z-50">
                <button
                    disabled={saving}
                    onClick={handleSave}
                    className="w-full max-w-md mx-auto flex items-center justify-center gap-2 p-5 rounded-3xl bg-white text-black font-black hover:bg-zinc-200 transition-all shadow-2xl active:scale-[0.98] disabled:opacity-50"
                >
                    {saving ? <Loader2 className="animate-spin" size={20} /> : (
                        <>
                            <Save size={20} />
                            <span>DONE FOR TODAY</span>
                        </>
                    )}
                </button>
            </div>

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
                <button className="text-blue-500 px-3 py-2 rounded-xl bg-blue-500/10 transition-all flex items-center gap-2">
                    <Clock size={20} fill="currentColor" />
                    <span className="text-[10px] font-black tracking-widest">ROUTINE</span>
                </button>
                <button onClick={() => router.push("/summary")} className="text-zinc-500 hover:text-white transition-all flex flex-col items-center gap-1">
                    <Calendar size={20} />
                    <span className="text-[8px] font-black tracking-widest uppercase">Reports</span>
                </button>
            </nav>
        </main>
    );
}
