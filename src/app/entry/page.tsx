"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    ChevronLeft,
    ChevronRight,
    Save,
    Sparkles,
    Loader2
} from "lucide-react";
import { reflectionService } from "@/services/reflectionService";
import { WeeklyReflection, ImprovementCategory } from "@/types/reflection";

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
                // IDがない場合は新規作成（デモ用）
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

    const handleSave = async () => {
        if (!reflection || !reflectionId) return;
        setSaving(true);
        try {
            const isLastStep = step === 4;
            await reflectionService.updateReflection(reflectionId, {
                ...reflection,
                status: isLastStep ? "COMPLETED" : "DRAFT"
            });
            if (isLastStep) {
                router.push("/");
            } else {
                setStep(step + 1);
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
        { key: "study", title: "学習", subtitle: "今週の進捗と獲得" },
        { key: "soccer", title: "サッカー", subtitle: "パフォーマンスと課題" },
        { key: "life", title: "生活", subtitle: "ルーティンとコンディション" },
        { key: "invention", title: "発明", subtitle: "新しい工夫のストック" },
    ] as const;

    const currentCategoryKey = steps[step - 1].key;
    const currentData = currentCategoryKey !== "invention"
        ? (reflection[currentCategoryKey as keyof WeeklyReflection] as ImprovementCategory)
        : null;

    return (
        <main className="min-h-screen bg-[#0a0a0a] text-white p-6 pb-32">
            <div className="flex items-center justify-between mb-8">
                <button onClick={() => router.push("/")} className="p-2 -ml-2 text-zinc-400 hover:text-white transition-colors">
                    <ChevronLeft size={24} />
                </button>
                <div className="flex gap-1.5">
                    {[1, 2, 3, 4].map((s) => (
                        <div
                            key={s}
                            className={`h-1.5 rounded-full transition-all duration-300 ${s === step ? "w-8 bg-blue-500" : s < step ? "w-4 bg-blue-500/40" : "w-4 bg-zinc-800"
                                }`}
                        />
                    ))}
                </div>
                <div className="w-6" />
            </div>

            <div className="mb-10">
                <h2 className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-1">
                    STEP {step} / 4
                </h2>
                <h1 className="text-3xl font-bold">{steps[step - 1].title}</h1>
                <p className="text-zinc-400">{steps[step - 1].subtitle}</p>
            </div>

            <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {currentCategoryKey === "invention" ? (
                    <label className="block">
                        <span className="text-sm font-medium text-zinc-300">今週編み出した独自の工夫</span>
                        <textarea
                            rows={6}
                            value={reflection.inventionNote}
                            onChange={(e) => setReflection({ ...reflection, inventionNote: e.target.value })}
                            placeholder="例：計算ミスのために／を入れるようにした、等"
                            className="mt-2 w-full p-4 rounded-2xl bg-zinc-900 border border-zinc-800 focus:border-blue-500/50 outline-none transition-all placeholder:text-zinc-600"
                        />
                    </label>
                ) : (
                    <>
                        <div className="space-y-4">
                            <label className="block">
                                <span className="text-sm font-medium text-zinc-300">予定（前回決めたこと）</span>
                                <div className="mt-2 p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 text-zinc-400 text-sm">
                                    {currentData?.plan || "予定なし"}
                                </div>
                            </label>

                            <label className="block">
                                <span className="text-sm font-medium text-zinc-300">実行した内容</span>
                                <textarea
                                    rows={3}
                                    value={currentData?.actual}
                                    onChange={(e) => updateCategory(currentCategoryKey as any, { actual: e.target.value })}
                                    placeholder="具体的に何をしたか入力..."
                                    className="mt-2 w-full p-4 rounded-2xl bg-zinc-900 border border-zinc-800 focus:border-blue-500/50 outline-none transition-all placeholder:text-zinc-600"
                                />
                            </label>

                            <div className="grid grid-cols-2 gap-4">
                                <label className="block">
                                    <span className="text-sm font-medium text-zinc-300">達成度 (0-100)</span>
                                    <input
                                        type="number"
                                        value={currentData?.score || ""}
                                        onChange={(e) => updateCategory(currentCategoryKey as any, { score: Number(e.target.value) })}
                                        placeholder="%"
                                        className="mt-2 w-full p-4 rounded-2xl bg-zinc-900 border border-zinc-800 focus:border-blue-500/50 outline-none transition-all"
                                    />
                                </label>
                                <div className="flex items-end">
                                    <div className={`w-full h-[58px] rounded-2xl border flex items-center justify-center transition-all ${(currentData?.score || 0) >= 80 ? "bg-green-600/10 border-green-500/20 text-green-400" : "bg-zinc-900 border-zinc-800 text-zinc-600"
                                        }`}>
                                        <Sparkles size={18} className={`mr-2 ${(currentData?.score || 0) >= 80 ? "animate-pulse" : ""}`} />
                                        <span className="text-sm font-medium">Good Job!</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="block">
                                <span className="text-sm font-medium text-zinc-300">来週への意志（Next Will）</span>
                                <textarea
                                    rows={2}
                                    value={currentData?.nextWill}
                                    onChange={(e) => updateCategory(currentCategoryKey as any, { nextWill: e.target.value })}
                                    placeholder="翌週の「予定」に自動で引き継がれます..."
                                    className="mt-2 w-full p-4 rounded-2xl bg-zinc-900 border border-zinc-800 focus:border-green-500/50 outline-none transition-all border-l-4 border-l-green-500/50 placeholder:text-zinc-600"
                                />
                            </label>
                        </div>
                    </>
                )}
            </section>

            <footer className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#0a0a0a] to-transparent pt-12">
                <div className="flex gap-4">
                    {step > 1 && (
                        <button
                            disabled={saving}
                            onClick={() => setStep(step - 1)}
                            className="flex-1 p-4 rounded-2xl bg-zinc-900 border border-zinc-800 font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50"
                        >
                            戻る
                        </button>
                    )}
                    <button
                        disabled={saving}
                        onClick={handleSave}
                        className="flex-[2] p-4 rounded-2xl bg-white text-black font-bold flex items-center justify-center gap-2 hover:bg-zinc-200 transition-colors disabled:opacity-50"
                    >
                        {saving ? (
                            <Loader2 className="animate-spin" size={20} />
                        ) : step === 4 ? (
                            <>
                                <Save size={20} />
                                <span>完了して保存</span>
                            </>
                        ) : (
                            <>
                                <span>次へ進む</span>
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
