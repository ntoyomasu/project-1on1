import { Timestamp } from 'firebase/firestore';

export type DailyLog = {
  actual: string;
  nextWill: string;
};

export type ImprovementCategory = {
  plan: string;
  dailyLogs: {
    sat: DailyLog;
    sun: DailyLog;
    mon: DailyLog;
    tue: DailyLog;
    wed: DailyLog;
    thu: DailyLog;
    fri: DailyLog;
  };
  learnings: {
    failure: string; // 失敗（怠慢）
    success: string; // 成功理由（発明）
  };
  score: number;
  nextWill: string; // 最終的な「来週への意志」
};

export type ReflectionStatus = 'DRAFT' | 'COMPLETED';

export interface WeeklyReflection {
  id: string;
  userId: string;
  weekStartDate: Timestamp;
  status: ReflectionStatus;
  study: ImprovementCategory;
  soccer: ImprovementCategory;
  life: ImprovementCategory;
  inventionNote: string;
  mentorComment: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface DailyRoutineItem {
  taskName: string;
  completed: boolean;
}

export interface DailyRoutine {
  id: string; // YYYY-MM-DD
  userId: string;
  date: string;
  items: DailyRoutineItem[];
  sleepHours: number;
  createdAt: Timestamp;
}
