"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Trophy,
  Heart,
  ChevronRight,
  Plus,
  Zap,
  Loader2,
  Calendar,
  Sparkles,
  Target,
  Lightbulb,
  PencilLine,
  Clock
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
      try {
        const data = await reflectionService.getAllReflections("user_demo");
        setReflections(data);
      } catch (error: any) {
        console.error("Fetch error:", error);
      } finally {
        setLoading(false);
      }
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

  const latestReflection = reflections[0];
  const isDraft = latestReflection?.status === "DRAFT";

  // 発明（成功理由）を集約する
  const getAllInventions = (ref: WeeklyReflection | undefined) => {
    if (!ref) return [];
    const inventions = [
      { cat: "LIFE", text: ref.life.learnings.success },
      { cat: "SOCCER", text: ref.soccer.learnings.success },
      { cat: "STUDY", text: ref.study.learnings.success },
    ].filter(item => item.text && item.text.trim().length > 0);
    return inventions;
  };

  const inventions = getAllInventions(latestReflection);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white p-6 pb-40">
      <header className="mb-10 pt-4 flex justify-between items-end">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Zap size={18} fill="white" />
            </div>
            <h1 className="text-2xl font-black tracking-tighter">SPIRAL UP</h1>
          </div>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">
            Performance Management
          </p>
        </div>
        <div className="text-right">
          <p className="text-zinc-400 text-[10px] font-bold">
            {new Date().toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' })}
          </p>
        </div>
      </header>

      <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* 1. Primary Action */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
          <button
            disabled={creating}
            onClick={isDraft ? () => router.push(`/entry?id=${latestReflection.id}`) : handleStartNewEntry}
            className="relative w-full flex items-center justify-between p-6 rounded-3xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800/80 transition-all disabled:opacity-50 overflow-hidden"
          >
            <div className="flex items-center gap-5">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isDraft ? "bg-yellow-500/10 text-yellow-500" : "bg-blue-500/10 text-blue-500"}`}>
                {isDraft ? <PencilLine size={28} /> : <Plus size={28} />}
              </div>
              <div className="text-left">
                <h3 className="font-black text-lg tracking-tight">
                  {isDraft ? "振り返りを再開する" : "今週を振り返る"}
                </h3>
                <p className="text-zinc-500 text-xs font-medium">
                  {isDraft ? "書きかけのエントリーがあります" : "新しい週のリフレクションを開始"}
                </p>
              </div>
            </div>
            <ChevronRight size={24} className="text-zinc-700" />
          </button>
        </div>

        {/* 2. Latest Goals (Plans) */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Target size={16} className="text-blue-500" />
            <h2 className="text-sm font-black tracking-widest text-zinc-400 uppercase">Current Focus</h2>
          </div>
          {latestReflection ? (
            <div className="grid grid-cols-1 gap-3">
              {[
                { title: "LIFE", data: latestReflection.life, icon: Heart, color: "text-orange-400" },
                { title: "SOCCER", data: latestReflection.soccer, icon: Trophy, color: "text-green-400" },
                { title: "STUDY", data: latestReflection.study, icon: BookOpen, color: "text-blue-400" },
              ].map((cat) => (
                <div key={cat.title} className="p-5 rounded-3xl bg-zinc-900/50 border border-zinc-800/50 flex gap-4 items-start backdrop-blur-sm shadow-xl">
                  <div className={`w-10 h-10 rounded-xl bg-zinc-800/50 flex items-center justify-center ${cat.color} shrink-0`}>
                    <cat.icon size={20} />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-[10px] font-black text-zinc-500 tracking-widest mb-1.5">{cat.title}</h4>
                    <p className="text-sm text-zinc-300 leading-relaxed font-medium">
                      {cat.data.goalAndMetrics || "目標が設定されていません"}
                    </p>
                  </div>
                  <div className={`text-[10px] font-black px-2 py-1 rounded-lg ${cat.data.score >= 80 ? "bg-green-500/10 text-green-500" : "bg-zinc-800 text-zinc-600"}`}>
                    {cat.data.score}%
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 rounded-3xl border border-dashed border-zinc-800 text-center">
              <p className="text-zinc-600 text-sm font-medium">最初のエントリーを始めましょう</p>
            </div>
          )}
        </div>

        {/* 3. Dynamic Invention Cards (Aggregated) */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Lightbulb size={16} className="text-yellow-500" />
            <div className="flex-1 flex justify-between items-center">
              <h2 className="text-sm font-black tracking-widest text-zinc-400 uppercase">My Inventions</h2>
              <button onClick={() => router.push("/archive")} className="text-[10px] font-black text-blue-500 hover:text-blue-400 transition-colors uppercase tracking-widest">View All</button>
            </div>
          </div>
          {inventions.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {inventions.map((inv, idx) => (
                <div key={idx} className="p-6 rounded-3xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800/80 shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Sparkles size={60} className="text-yellow-500" />
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[9px] font-black px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-500 tracking-widest uppercase">
                      {inv.cat}
                    </span>
                  </div>
                  <p className="text-zinc-200 text-base leading-relaxed font-semibold italic">
                    "{inv.text}"
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 rounded-3xl border border-dashed border-zinc-800 text-center">
              <p className="text-zinc-600 text-sm font-medium">各セクションの振り返りで「発明」が記録されると、ここに表示されます</p>
            </div>
          )}
        </div>
      </section>

      {/* Global Nav-Bar (Fully Functional) */}
      <nav className="fixed bottom-6 left-6 right-6 h-16 rounded-[2rem] border border-white/5 bg-zinc-900/80 backdrop-blur-xl flex items-center justify-around px-8 shadow-2xl z-50">
        <button className="text-blue-500 px-3 py-2 rounded-xl bg-blue-500/10 transition-all flex items-center gap-2">
          <Zap size={20} fill="currentColor" />
          <span className="text-[10px] font-black tracking-widest">HOME</span>
        </button>
        <button onClick={() => router.push("/archive")} className="text-zinc-500 hover:text-white transition-all flex flex-col items-center gap-1">
          <Lightbulb size={20} />
          <span className="text-[8px] font-black tracking-widest uppercase">Archive</span>
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
