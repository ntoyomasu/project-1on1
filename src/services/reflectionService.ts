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
    Timestamp,
    serverTimestamp
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { WeeklyReflection, ImprovementCategory } from "../types/reflection";

const COLLECTION_NAME = "weeklyReflections";

const emptyCategory: ImprovementCategory = {
    plan: "",
    actual: "",
    score: 0,
    good: "",
    bad: "",
    nextWill: "",
};

export const reflectionService = {
    /**
     * 直近の完了済み振り返りを取得する
     */
    async getLatestCompletedReflection(userId: string): Promise<WeeklyReflection | null> {
        const q = query(
            collection(db, COLLECTION_NAME),
            where("userId", "==", userId),
            where("status", "==", "COMPLETED"),
            orderBy("weekStartDate", "desc"),
            limit(1)
        );

        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) return null;

        return { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as WeeklyReflection;
    },

    /**
     * 新しい週の振り返りを作成する（スパイラルアップ・ロジック）
     */
    async createNewWeeklyReflection(userId: string, weekStartDate: Date): Promise<string> {
        const lastReflection = await this.getLatestCompletedReflection(userId);

        const newReflection: Omit<WeeklyReflection, 'id'> = {
            userId,
            weekStartDate: Timestamp.fromDate(weekStartDate),
            status: "DRAFT",
            study: {
                ...emptyCategory,
                plan: lastReflection?.study.nextWill || "",
            },
            soccer: {
                ...emptyCategory,
                plan: lastReflection?.soccer.nextWill || "",
            },
            life: {
                ...emptyCategory,
                plan: lastReflection?.life.nextWill || "",
            },
            inventionNote: "",
            mentorComment: "",
            createdAt: serverTimestamp() as Timestamp,
            updatedAt: serverTimestamp() as Timestamp,
        };

        const docRef = await addDoc(collection(db, COLLECTION_NAME), newReflection);
        return docRef.id;
    },

    /**
     * 振り返りを更新する
     */
    async updateReflection(id: string, updates: Partial<WeeklyReflection>): Promise<void> {
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, {
            ...updates,
            updatedAt: serverTimestamp(),
        });
    },

    /**
     * 指定したIDの振り返りを取得する
     */
    async getReflectionById(id: string): Promise<WeeklyReflection | null> {
        const q = query(
            collection(db, COLLECTION_NAME),
            where("__name__", "==", id)
        );

        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) return null;

        return { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as WeeklyReflection;
    },

    /**
     * ユーザーのすべての振り返りを取得する
     */
    async getAllReflections(userId: string): Promise<WeeklyReflection[]> {
        const q = query(
            collection(db, COLLECTION_NAME),
            where("userId", "==", userId),
            orderBy("weekStartDate", "desc")
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WeeklyReflection));
    }
};
