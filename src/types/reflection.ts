import { Timestamp } from 'firebase/firestore';

export type ImprovementCategory = {
  plan: string;
  actual: string;
  score: number;
  good: string;
  bad: string;
  nextWill: string;
};

export type ReflectionStatus = 'DRAFT' | 'COMPLETED';

export interface WeeklyReflection {
  id: string; // YYYY_Wxx
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
