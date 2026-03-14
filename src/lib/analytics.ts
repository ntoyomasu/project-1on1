import { WeeklyReflection } from "../types/reflection";

export interface ROIAnalysis {
    category: string;
    investment: string; // plan
    return: string;     // actual
    score: number;
    status: 'PROFIT' | 'NEUTRAL' | 'LOSS';
}

/**
 * 振り返りデータからROI（投資と回収）を分析する
 */
export function analyzeROI(reflection: WeeklyReflection): ROIAnalysis[] {
    const categories = ['study', 'soccer', 'life'] as const;

    return categories.map(cat => {
        const data = reflection[cat];
        let status: 'PROFIT' | 'NEUTRAL' | 'LOSS' = 'NEUTRAL';

        if (data.score >= 80) status = 'PROFIT';
        else if (data.score < 50) status = 'LOSS';

        return {
            category: cat === 'study' ? '学習' : cat === 'soccer' ? 'サッカー' : '生活',
            investment: data.plan || "予定設定なし",
            return: data.actual || "実績入力なし",
            score: data.score,
            status
        };
    });
}
