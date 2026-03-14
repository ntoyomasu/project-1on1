"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Trophy,
  Heart,
  ChevronRight,
  CheckCircle2,
  Plus,
  Zap,
  Loader2,
  Calendar
} from "lucide-react";
import { reflectionService } from "@/services/reflectionService";
import { WeeklyReflection } from "@/types/reflection";

export default function Home() {
  const router = useRouter();
  const [reflections, setReflections] = useState<WeeklyReflection[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    async function fetchReflections() {
      const data = await reflectionService.getAllReflections("user_demo");
      setReflections(data);
      setLoading(false);
    }
    fetchReflections();
  }, []);

  const handleStartNewEntry = async () => {
    setCreating(true);
    try {
      const id = await reflectionService.createNewWeeklyReflection("user_demo", new Date());
      router.push(`/entry?id=${id}`);
    } catch (error) {
      console.error("Failed to create new reflection:", error);
      setCreating(false);
    }
  };

  const categories = [
    { title: "学習", icon: BookOpen, color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20" },
    { title: "サッカー", icon: Trophy, color: "text-green-400", bg: "bg-green-400/10", border: "border-green-400/20" },
    { title: "生活", icon: Heart, color: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-400/20" },
  ];

  const currentReflection = reflections[0]; // 最も新しいもの

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white p-6 pb-24">
      <header className="mb-10 pt-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <Zap size={18} fill="white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Spiral Up Logger</h1>
        </div>
        <p className="text-zinc-400 text-sm">
          {new Date().toLocaleDateString('ja-JP', { weekday: 'long', hour: '2-digit', minute: '2-digit' })}
        </p>
      </header>

      <section className="space-y-6">
        {/* Status Card */}
        <div className="glass-card p-6 border border-zinc-800 bg-zinc-900/40">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-1">Latest Reflection</h2>
              <p className="text-xl font-medium">
                {currentReflection ? `${currentReflection.weekStartDate.toDate().toLocaleDateString('ja-JP')}の週` : "データなし"}
              </p>
            </div>
            {currentReflection && (
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${currentReflection.status === "COMPLETED"
                  ? "bg-green-500/10 text-green-400 border-green-500/20"
                  : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                }`}>
                {currentReflection.status}
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            {categories.map((cat) => (
              <div key={cat.title} className="space-y-2">
                <div className={`aspect-square rounded-2xl ${cat.bg} border ${cat.border} flex items-center justify-center`}>
                  <cat.icon className={cat.color} size={24} />
                </div>
                <span className="text-[10px] text-zinc-400">{cat.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-zinc-400 px-1">クイックアクション</h3>
          <button
            disabled={creating}
            onClick={handleStartNewEntry}
            className="w-full flex items-center justify-between p-4 rounded-2xl bg-blue-600 hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/20 disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              {creating ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
              <span className="font-semibold">モーニング・エントリーを開始</span>
            </div>
            <ChevronRight size={18} />
          </button>
        </div>

        {/* History List */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-zinc-400 px-1">履歴</h3>
          <div className="space-y-2">
            {reflections.map((ref) => (
              <button
                key={ref.id}
                onClick={() => router.push(`/entry?id=${ref.id}`)}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:bg-zinc-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Calendar size={18} className="text-zinc-500" />
                  <div className="text-left">
                    <p className="text-sm font-medium">{ref.weekStartDate.toDate().toLocaleDateString('ja-JP')}の週</p>
                    <p className="text-[10px] text-zinc-500">{ref.status}</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-zinc-600" />
              </button>
            ))}
            {reflections.length === 0 && (
              <p className="text-center text-zinc-600 py-4 text-sm">振り返り履歴がまだありません</p>
            )}
          </div>
        </div>
      </section>

      {/* Navigation Bar */}
      <nav className="fixed bottom-6 left-6 right-6 h-16 glass-card border border-zinc-800 bg-zinc-950/80 flex items-center justify-around px-4">
        <button className="flex flex-col items-center gap-1 text-blue-400">
          <Zap size={20} />
          <span className="text-[10px] font-medium">HOME</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-zinc-500">
          <BookOpen size={20} />
          <span className="text-[10px] font-medium">LOGS</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-zinc-500">
          <Trophy size={20} />
          <span className="text-[10px] font-medium">GOALS</span>
        </button>
      </nav>
    </main>
  );
}
