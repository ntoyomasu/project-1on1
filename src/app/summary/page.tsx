"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    ChevronLeft,
    TrendingUp,
    TrendingDown,
    AlertCircle,
    Loader2,
    FileText,
    Sparkles
} from "lucide-react";
import { reflectionService } from "@/services/reflectionService";
import { analyzeROI, ROIAnalysis } from "@/lib/analytics";
import { WeeklyReflection } from "@/types/reflection";

function SummaryView() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const id = searchParams.get("id");

    const [reflection, setReflection] = useState<WeeklyReflection | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            if (id) {
                const data = await reflectionService.getReflectionById(id);
                setReflection(data);
            }
            setLoading(false);
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

    return (
        <main className="min-h-screen bg-[#0a0a0a] text-white p-6 pb-12">
            <header className="flex items-center gap-4 mb-8">
                <button onClick={() => router.back()} className="p-2 -ml-2 text-zinc-400">
                    <ChevronLeft size={24} />
                </button>
                <div>
                    <h1 className="text-xl font-bold">1on1 Summary</h1>
                    <p className="text-zinc-500 text-xs">
                        {reflection.weekStartDate.toDate().toLocaleDateString('ja-JP')}の週の投資と回収
                    </p>
                </div>
            </header>

            <div className="space-y-6">
                {roiData.map((roi) => (
                    <div key={roi.category} className="glass-card p-5 border border-zinc-800 bg-zinc-900/20">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold flex items-center gap-2">
                                {roi.category}
                                <span className="text-xs font-normal text-zinc-500">Score: {roi.score}</span>
                            </h3>
                            {roi.status === 'PROFIT' ? (
                                <div className="flex items-center gap-1 text-green-400 text-xs font-medium">
                                    <TrendingUp size={14} /> High ROI
                                </div>
                            ) : roi.status === 'LOSS' ? (
                                <div className="flex items-center gap-1 text-red-400 text-xs font-medium">
                                    <TrendingDown size={14} /> Needs Focus
                                </div>
                            ) : null}
                        </div>

                        <div className="space-y-3">
                            <div className="bg-zinc-950/50 p-3 rounded-xl border border-zinc-800/50">
                                <span className="text-[10px] uppercase text-zinc-500 block mb-1">Investment (Plan)</span>
                                <p className="text-sm text-zinc-300">{roi.investment}</p>
                            </div>
                            <div className="bg-blue-500/5 p-3 rounded-xl border border-blue-500/10">
                                <span className="text-[10px] uppercase text-blue-400 block mb-1">Return (Actual)</span>
                                <p className="text-sm text-zinc-100">{roi.return}</p>
                            </div>
                        </div>
                    </div>
                ))}

                <div className="glass-card p-5 border border-dashed border-zinc-700 bg-zinc-900/10">
                    <h3 className="font-bold text-zinc-400 mb-3 flex items-center gap-2">
                        <Sparkles size={16} className="text-amber-400" />
                        今週の発明 (Invention)
                    </h3>
                    <p className="text-sm text-zinc-300 italic leading-relaxed">
                        「{reflection.inventionNote || "特に記録なし"}」
                    </p>
                </div>

                <button className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-zinc-100 text-black font-bold hover:bg-white transition-colors">
                    <FileText size={20} />
                    <span>レポートをPDF出力</span>
                </button>
            </div>
        </main>
    );
}

export default function SummaryPage() {
    return (
        <Suspense fallback={<Loader2 className="animate-spin text-blue-500 mx-auto" size={32} />}>
            <SummaryView />
        </Suspense>
    );
}
