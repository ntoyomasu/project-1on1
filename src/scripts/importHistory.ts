
import { db } from '../lib/firebase'; // 既存の構成を使用
import { collection, doc, writeBatch, serverTimestamp } from 'firebase/firestore/lite';

/**
 * 過去の1on1データをFirestoreにインポートするスクリプト
 * 抽出したJSONデータをここに配置して実行する想定
 */

const REFLECTION_COLLECTION = "weeklyReflections";

async function importHistory(userId: string, data: any[]) {
    const batch = writeBatch(db);

    data.forEach((entry) => {
        const docId = `${userId}_${entry.startDate}`;
        const docRef = doc(db, REFLECTION_COLLECTION, docId);

        batch.set(docRef, {
            ...entry,
            userId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
    });

    try {
        await batch.commit();
        console.log(`Successfully imported ${data.length} records.`);
    } catch (error) {
        console.error("Error importing history:", error);
    }
}

// 実行例（実際のデータ取得後に呼び出す）
// importHistory("user_id_here", transformedData);
