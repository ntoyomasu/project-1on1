"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    ChevronLeft,
    ChevronRight,
    Save,
    Sparkles,
    Loader2,
    Calendar,
    Target,
    Zap,
    AlertCircle,
    CheckCircle2,
    PencilLine,
    UserCircle2,
    MessageSquare
} from "lucide-react";
import { reflectionService } from "@/services/reflectionService";
import { WeeklyReflection, ImprovementCategory } from "@/types/reflection";

const DAYS = [
    { key: "sat", label: "土" },
    { key: "sun", label: "日" },
    { key: "mon", label: "月" },
    { key: "tue", label: "火" },
    { key: "wed", label: "水" },
    { key: "thu", label: "木" },
    { key: "fri", label: "金" },
] as const;

function EntryForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const reflectionId = searchParams.get("id");

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [reflection, setReflection] = useState<WeeklyReflection | null>(null);

    useEffect(() => {
        async function init() {
            if (reflectionId) {
                const data = await reflectionService.getReflectionById(reflectionId);
                if (data) {
                    setReflection(data);
                } else {
                    router.push("/");
                }
            } else {
                const id = await reflectionService.createNewWeeklyReflection("user_demo", new Date());
                router.push(`/entry?id=${id}`);
            }
            setLoading(false);
        }
        init();
    }, [reflectionId, router]);

    const updateCategory = (key: 'study' | 'soccer' | 'life', updates: Partial<ImprovementCategory>) => {
        if (!reflection) return;
        setReflection({
            ...reflection,
            [key]: { ...reflection[key] as ImprovementCategory, ...updates }
        });
    };

    const updateDailyLog = (cat: 'study' | 'soccer' | 'life', day: string, field: 'actual' | 'nextWill', value: string) => {
        if (!reflection) return;
        const category = reflection[cat] as ImprovementCategory;
        setReflection({
            ...reflection,
            [cat]: {
                ...category,
                dailyLogs: {
                    ...category.dailyLogs,
                    [day]: {
                        ...category.dailyLogs[day as keyof typeof category.dailyLogs],
                        [field]: value
                    }
                }
            }
        });
    };

    const updateLearnings = (cat: 'study' | 'soccer' | 'life', field: 'failure' | 'success', value: string) => {
        if (!reflection) return;
        const category = reflection[cat] as ImprovementCategory;
        setReflection({
            ...reflection,
            [cat]: {
                ...category,
                learnings: {
                    ...category.learnings,
                    [field]: value
                }
            }
        });
    };

    const handleSave = async () => {
        if (!reflection || !reflectionId) return;
        setSaving(true);
        try {
            const isLastStep = step === 3;
            await reflectionService.updateReflection(reflectionId, {
                ...reflection,
                status: isLastStep ? "COMPLETED" : "DRAFT"
            });
            if (isLastStep) {
                router.push("/");
            } else {
                setStep(step + 1);
                window.scrollTo(0, 0);
            }
        } catch (error) {
            console.error("Failed to save:", error);
        } finally {
            setSaving(false);
        }
    };

    if (loading || !reflection) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
                <Loader2 className="animate-spin text-blue-500" size={32} />
            </div>
        );
    }

    const steps = [
        { key: "life", title: "生活", subtitle: "ルーティンとコンディション" },
        { key: "soccer", title: "サッカー", subtitle: "パフォーマンスと課題" },
        { key: "study", title: "学習", subtitle: "今週の進捗と獲得" },
    ] as const;

    const currentCategoryKey = steps[step - 1].key;
    const currentData = reflection[currentCategoryKey as keyof WeeklyReflection] as ImprovementCategory;

    const getScoreColor = (score: number) => {
        if (score >= 80) return "text-green-400 border-green-500/20 bg-green-500/10";
        if (score >= 50) return "text-yellow-400 border-yellow-500/20 bg-yellow-500/10";
        return "text-red-400 border-red-500/20 bg-red-500/10";
    };

    return (
        <main className="min-h-screen bg-[#0a0a0a] text-white p-6 pb-40">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <button onClick={() => router.push("/")} className="p-2 -ml-2 text-zinc-400 hover:text-white transition-colors">
                    <ChevronLeft size={24} />
                </button>
                <div className="flex gap-1.5">
                    {[1, 2, 3].map((s) => (
                        <div
                            key={s}
                            className={`h-1.5 rounded-full transition-all duration-300 ${s === step ? "w-8 bg-blue-500" : s < step ? "w-4 bg-blue-500/40" : "w-4 bg-zinc-800"
                                }`}
                        />
                    ))}
                </div>
                <div className="w-6" />
            </div>

            {/* Title Section */}
            <div className="mb-10">
                <h2 className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-1">
                    STEP {step} / 3
                </h2>
                <h1 className="text-3xl font-bold tracking-tight">{steps[step - 1].title}</h1>
                <p className="text-zinc-400 text-sm mt-1">{steps[step - 1].subtitle}</p>
            </div>

            <section className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <>
                    {/* 1. Goal (Plan) - EDITABLE */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-zinc-500 flex items-center gap-2">
                            <PencilLine size={16} className="text-blue-400" />
                            今週の予定・目標（編集可能）
                        </h3>
                        <textarea
                            rows={4}
                            value={currentData?.plan}
                            onChange={(e) => updateCategory(currentCategoryKey as any, { plan: e.target.value })}
                            placeholder="今週の目標を修正、または入力してください..."
                            className="w-full p-5 rounded-3xl bg-zinc-900/50 border border-zinc-800 focus:border-blue-500/30 outline-none transition-all text-zinc-300 text-sm leading-relaxed backdrop-blur-sm resize-none"
                        />
                    </div>

                    {/* 2. Execution (Daily Logs - Actual) */}
                    <div className="space-y-6">
                        <h3 className="text-sm font-semibold text-zinc-500 flex items-center gap-2">
                            <Calendar size={16} />
                            実行した内容（土〜金：日次）
                        </h3>
                        <div className="space-y-4">
                            {DAYS.map((day) => (
                                <div key={day.key} className="p-4 rounded-3xl bg-zinc-900/50 border border-zinc-800/50 flex gap-4 items-start">
                                    <div className="w-10 h-10 shrink-0 rounded-2xl bg-zinc-800 flex items-center justify-center text-sm font-black text-zinc-300">
                                        {day.label}
                                    </div>
                                    <textarea
                                        rows={2}
                                        value={currentData?.dailyLogs[day.key].actual}
                                        onChange={(e) => updateDailyLog(currentCategoryKey as any, day.key, 'actual', e.target.value)}
                                        placeholder="具体的に何をしたか..."
                                        className="w-full p-0 bg-transparent border-none focus:ring-0 outline-none transition-all text-sm placeholder:text-zinc-700 resize-none font-medium leading-relaxed"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 3. Achievement (Weekly Score) */}
                    <div className="space-y-6 pt-4">
                        <div className="grid grid-cols-2 gap-4">
                            <label className="block">
                                <span className="text-sm font-semibold text-zinc-500 flex items-center gap-2 mb-3">
                                    <AlertCircle size={14} />
                                    達成度（週単位）
                                </span>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={currentData?.score || ""}
                                        onChange={(e) => updateCategory(currentCategoryKey as any, { score: Math.min(100, Math.max(0, Number(e.target.value))) })}
                                        placeholder="0-100"
                                        className="w-full p-5 pl-7 rounded-3xl bg-zinc-900 border border-zinc-800 focus:border-white/20 outline-none transition-all text-2xl font-black"
                                    />
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 font-bold">%</span>
                                </div>
                            </label>
                            <div className="flex items-end">
                                <div className={`w-full h-16 rounded-3xl border flex items-center justify-center transition-all duration-500 ${getScoreColor(currentData?.score || 0)}`}>
                                    <Sparkles size={20} className={`mr-2 ${(currentData?.score || 0) >= 80 ? "animate-pulse" : ""}`} />
                                    <span className="text-sm font-black italic">
                                        {(currentData?.score || 0) >= 80 ? "EXCELLENT" : (currentData?.score || 0) >= 50 ? "GOOD" : "KEEP UP"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 4. Learnings (Weekly) */}
                    <div className="space-y-6 pt-4">
                        <h3 className="text-sm font-semibold text-zinc-500 flex items-center gap-2">
                            <Zap size={16} />
                            今週得られた学び（週単位）
                        </h3>
                        <div className="grid grid-cols-1 gap-4">
                            <div className="p-5 rounded-3xl bg-zinc-900/50 border border-zinc-800/50 group">
                                <span className="text-xs font-bold text-red-400 flex items-center gap-1.5 mb-4 group-focus-within:text-red-300 transition-colors">
                                    失敗（怠慢の理由）
                                </span>
                                <textarea
                                    rows={3}
                                    value={currentData?.learnings.failure}
                                    onChange={(e) => updateLearnings(currentCategoryKey as any, 'failure', e.target.value)}
                                    placeholder="何に負けて、どう行動しなかったか..."
                                    className="w-full p-0 bg-transparent border-none focus:ring-0 outline-none transition-all text-sm placeholder:text-zinc-700 resize-none font-medium leading-relaxed"
                                />
                            </div>
                            <div className="p-5 rounded-3xl bg-zinc-900/50 border border-zinc-800/50 group">
                                <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5 mb-4 group-focus-within:text-blue-300 transition-colors">
                                    成功理由（発明）
                                </span>
                                <textarea
                                    rows={3}
                                    value={currentData?.learnings.success}
                                    onChange={(e) => updateLearnings(currentCategoryKey as any, 'success', e.target.value)}
                                    placeholder="どんな工夫をして上手くいったか..."
                                    className="w-full p-0 bg-transparent border-none focus:ring-0 outline-none transition-all text-sm placeholder:text-zinc-700 resize-none font-medium leading-relaxed"
                                />
                            </div>
                        </div>
                    </div>

                    {/* 5. Next Will (Daily Logs) */}
                    <div className="space-y-6 pt-4">
                        <h3 className="text-sm font-semibold text-zinc-500 flex items-center gap-2">
                            <CheckCircle2 size={16} className="text-green-400" />
                            来週への意志（土〜金：日次）
                        </h3>
                        <div className="space-y-4">
                            {DAYS.map((day) => (
                                <div key={`next-${day.key}`} className="p-4 rounded-3xl bg-zinc-900/50 border border-zinc-800/50 flex gap-4 items-start border-l-8 border-l-green-500/30">
                                    <div className="w-10 h-10 shrink-0 rounded-2xl bg-zinc-800 flex items-center justify-center text-sm font-black text-green-400/70">
                                        {day.label}
                                    </div>
                                    <textarea
                                        rows={2}
                                        value={currentData?.dailyLogs[day.key].nextWill}
                                        onChange={(e) => updateDailyLog(currentCategoryKey as any, day.key, 'nextWill', e.target.value)}
                                        placeholder="翌週のこの日、どうありたいか..."
                                        className="w-full p-0 bg-transparent border-none focus:ring-0 outline-none transition-all text-sm placeholder:text-zinc-700 resize-none font-medium leading-relaxed"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 6. Global Reflection & Mentor Message (Step 3 Only) */}
                    {step === 3 && (
                        <div className="space-y-6 pt-10 border-t border-zinc-900">
                            <h3 className="text-sm font-black text-zinc-400 flex items-center gap-2 uppercase tracking-widest">
                                <UserCircle2 size={16} className="text-blue-500" />
                                Global Wrap-up
                            </h3>
                            <div className="p-6 rounded-[2rem] bg-zinc-900/60 border border-zinc-800 group focus-within:border-blue-500/30 transition-all shadow-2xl">
                                <div className="flex items-center gap-2 mb-4">
                                    <MessageSquare size={14} className="text-zinc-600" />
                                    <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Message to Mentor (Optional)</span>
                                </div>
                                <textarea
                                    rows={4}
                                    value={reflection?.mentorComment || ""}
                                    onChange={(e) => setReflection(prev => prev ? { ...prev, mentorComment: e.target.value } : null)}
                                    placeholder="今週の総括や、メンターに伝えたいこと、相談したいこと..."
                                    className="w-full bg-transparent border-none focus:ring-0 outline-none text-sm text-zinc-300 placeholder:text-zinc-700 resize-none font-medium leading-relaxed"
                                />
                            </div>
                            <p className="text-[10px] font-bold text-zinc-600 text-center italic">「完了して保存」で今週のレポートが確定します</p>
                        </div>
                    )}
                </>
            </section>

            {/* Sticky Footer */}
            <footer className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a] to-transparent pt-20 z-50">
                <div className="flex gap-4 max-w-2xl mx-auto">
                    {step > 1 && (
                        <button
                            disabled={saving}
                            onClick={() => {
                                setStep(step - 1);
                                window.scrollTo(0, 0);
                            }}
                            className="flex-1 p-5 rounded-3xl bg-zinc-900 border border-zinc-800 font-bold hover:bg-zinc-800 transition-all disabled:opacity-50 active:scale-95"
                        >
                            戻る
                        </button>
                    )}
                    <button
                        disabled={saving}
                        onClick={handleSave}
                        className="flex-[2] p-5 rounded-3xl bg-blue-600 text-white font-black flex items-center justify-center gap-2 hover:bg-blue-500 transition-all shadow-[0_0_30px_rgba(37,99,235,0.2)] active:scale-[0.98] disabled:opacity-50"
                    >
                        {saving ? (
                            <Loader2 className="animate-spin" size={20} />
                        ) : step === 3 ? (
                            <>
                                <Save size={20} />
                                <span>完了して保存</span>
                            </>
                        ) : (
                            <>
                                <span>次は「{steps[step].title}」</span>
                                <ChevronRight size={20} />
                            </>
                        )}
                    </button>
                </div>
            </footer>
        </main>
    );
}

export default function EntryPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
                <Loader2 className="animate-spin text-blue-500" size={32} />
            </div>
        }>
            <EntryForm />
        </Suspense>
    );
}
