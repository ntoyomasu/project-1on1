import {
    collection,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    addDoc,
    updateDoc,
    doc,
    setDoc,
    Timestamp,
    serverTimestamp,
    getDoc
} from "firebase/firestore/lite";
import { db } from "../lib/firebase";
import { WeeklyReflection, ImprovementCategory, DailyLog, DailyRoutine } from "../types/reflection";

const COLLECTION_NAME = "weeklyReflections";
const ROUTINE_COLLECTION = "dailyRoutines";

const emptyDailyLog: DailyLog = {
    actual: "",
    nextWill: "",
};

const createEmptyCategory = (): ImprovementCategory => ({
    goalAndMetrics: "",
    nextGoalAndMetrics: "",
    dailyLogs: {
        sat: { ...emptyDailyLog },
        sun: { ...emptyDailyLog },
        mon: { ...emptyDailyLog },
        tue: { ...emptyDailyLog },
        wed: { ...emptyDailyLog },
        thu: { ...emptyDailyLog },
        fri: { ...emptyDailyLog },
    },
    learnings: {
        failure: "",
        success: "",
    },
    score: 0,
    nextWill: "",
});

/**
 * 日次 Next Will を集約して Plan 文字列を作成する
 */
const consolidateDailyWills = (category: ImprovementCategory | undefined): string => {
    if (!category || !category.dailyLogs) return "";

    const days: (keyof typeof category.dailyLogs)[] = ['sat', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri'];
    const labels = { sat: '土', sun: '日', mon: '月', tue: '火', wed: '水', thu: '木', fri: '金' };

    const logs = days
        .map(day => {
            const will = category.dailyLogs[day].nextWill;
            return will ? `【${labels[day]}】${will}` : null;
        })
        .filter(v => v !== null);

    if (logs.length === 0) return category.nextWill || "";
    return logs.join('\n');
};

/**
 * 古いデータを新スキーマに正規化する
 */
const normalizeReflection = (data: any): WeeklyReflection => {
    const categories: ('study' | 'soccer' | 'life')[] = ['study', 'soccer', 'life'];
    const normalized = { ...data };

    categories.forEach(cat => {
        if (!normalized[cat]) {
            normalized[cat] = createEmptyCategory();
        } else {
            if (!normalized[cat].dailyLogs) {
                normalized[cat].dailyLogs = createEmptyCategory().dailyLogs;
            }
            if (!normalized[cat].learnings) {
                normalized[cat].learnings = createEmptyCategory().learnings;
            }
            if (normalized[cat].score === undefined) {
                normalized[cat].score = 0;
            }
            if (normalized[cat].nextWill === undefined) {
                normalized[cat].nextWill = "";
            }
            if ((normalized[cat] as any).plan !== undefined) {
                normalized[cat].goalAndMetrics = (normalized[cat] as any).plan;
                delete (normalized[cat] as any).plan;
            }
            if (normalized[cat].goalAndMetrics === undefined) {
                normalized[cat].goalAndMetrics = "";
            }
            if (normalized[cat].nextGoalAndMetrics === undefined) {
                normalized[cat].nextGoalAndMetrics = "";
            }
        }
    });

    if (normalized.inventionNote === undefined) normalized.inventionNote = "";
    if (normalized.mentorComment === undefined) normalized.mentorComment = "";

    return normalized as WeeklyReflection;
};

export const reflectionService = {
    // --- Reflections ---

    async getLatestCompletedReflection(userId: string): Promise<WeeklyReflection | null> {
        try {
            const q = query(
                collection(db, COLLECTION_NAME),
                where("userId", "==", userId),
                where("status", "==", "COMPLETED"),
                orderBy("weekStartDate", "desc"),
                limit(1)
            );

            const querySnapshot = await getDocs(q);
            if (querySnapshot.empty) return null;

            return normalizeReflection({ id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() });
        } catch (error: any) {
            if (error.code === 'failed-precondition' || error.message?.includes('index') || error.message?.includes('Bad Request')) {
                const simpleQ = query(
                    collection(db, COLLECTION_NAME),
                    where("userId", "==", userId)
                );
                const querySnapshot = await getDocs(simpleQ);
                if (querySnapshot.empty) return null;

                const docs = querySnapshot.docs
                    .map(doc => normalizeReflection({ id: doc.id, ...doc.data() }))
                    .filter(ref => ref.status === "COMPLETED");

                if (docs.length === 0) return null;
                return docs.sort((a, b) => b.weekStartDate.toMillis() - a.weekStartDate.toMillis())[0];
            }
            throw error;
        }
    },

    async createNewWeeklyReflection(userId: string, weekStartDate: Date): Promise<string> {
        const lastReflection = await this.getLatestCompletedReflection(userId);

        const newReflection: Omit<WeeklyReflection, 'id'> = {
            userId,
            weekStartDate: Timestamp.fromDate(weekStartDate),
            status: "DRAFT",
            study: {
                ...createEmptyCategory(),
                goalAndMetrics: lastReflection?.study?.nextGoalAndMetrics || "",
            },
            soccer: {
                ...createEmptyCategory(),
                goalAndMetrics: lastReflection?.soccer?.nextGoalAndMetrics || "",
            },
            life: {
                ...createEmptyCategory(),
                goalAndMetrics: lastReflection?.life?.nextGoalAndMetrics || "",
            },
            inventionNote: "",
            mentorComment: "",
            createdAt: serverTimestamp() as Timestamp,
            updatedAt: serverTimestamp() as Timestamp,
        };

        const docRef = await addDoc(collection(db, COLLECTION_NAME), newReflection);
        return docRef.id;
    },

    async updateReflection(id: string, updates: Partial<WeeklyReflection>): Promise<void> {
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, {
            ...updates,
            updatedAt: serverTimestamp(),
        });
    },

    async getReflectionById(id: string): Promise<WeeklyReflection | null> {
        const q = query(
            collection(db, COLLECTION_NAME),
            where("__name__", "==", id)
        );

        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) return null;

        return normalizeReflection({ id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() });
    },

    async getAllReflections(userId: string): Promise<WeeklyReflection[]> {
        try {
            const q = query(
                collection(db, COLLECTION_NAME),
                where("userId", "==", userId),
                orderBy("weekStartDate", "desc")
            );

            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => normalizeReflection({ id: doc.id, ...doc.data() }));
        } catch (error: any) {
            if (error.code === 'failed-precondition' || error.message?.includes('index') || error.message?.includes('Bad Request')) {
                const simpleQ = query(
                    collection(db, COLLECTION_NAME),
                    where("userId", "==", userId)
                );
                const querySnapshot = await getDocs(simpleQ);
                const docs = querySnapshot.docs.map(doc => normalizeReflection({ id: doc.id, ...doc.data() }));
                return docs.sort((a, b) => b.weekStartDate.toMillis() - a.weekStartDate.toMillis());
            }
            throw error;
        }
    },

    // --- Daily Routines (New) ---

    async getDailyRoutine(userId: string, date: string): Promise<DailyRoutine | null> {
        const docId = `${userId}_${date}`;
        const docRef = doc(db, ROUTINE_COLLECTION, docId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as DailyRoutine;
        }
        return null;
    },

    async saveDailyRoutine(userId: string, routine: Omit<DailyRoutine, 'id' | 'createdAt'>): Promise<void> {
        const docId = `${userId}_${routine.date}`;
        const docRef = doc(db, ROUTINE_COLLECTION, docId);
        await setDoc(docRef, {
            ...routine,
            createdAt: serverTimestamp()
        }, { merge: true });
    },

    async getRoutinesForWeek(userId: string, weekStartDate: Date): Promise<DailyRoutine[]> {
        const start = new Date(weekStartDate);
        const end = new Date(weekStartDate);
        end.setDate(end.getDate() + 7);

        const startDateStr = start.toISOString().split('T')[0];
        const endDateStr = end.toISOString().split('T')[0];

        try {
            const q = query(
                collection(db, ROUTINE_COLLECTION),
                where("userId", "==", userId),
                where("date", ">=", startDateStr),
                where("date", "<", endDateStr),
                orderBy("date", "asc")
            );

            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DailyRoutine));
        } catch (error: any) {
            // インデックス未作成の場合は全取得してフィルタリング
            const simpleQ = query(collection(db, ROUTINE_COLLECTION), where("userId", "==", userId));
            const querySnapshot = await getDocs(simpleQ);
            return querySnapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() } as DailyRoutine))
                .filter(r => r.date >= startDateStr && r.date < endDateStr)
                .sort((a, b) => a.date.localeCompare(b.date));
        }
    }
};
