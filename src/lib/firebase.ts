import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Next.jsのビルド時（プリレンダリング時）にAPIキーがない場合のエラーを回避
const isConfigValid = !!firebaseConfig.apiKey;

let app;
if (getApps().length > 0) {
    app = getApp();
} else if (isConfigValid) {
    app = initializeApp(firebaseConfig);
}

// appが初期化できない場合はダミーオブジェクトを返す（ビルドエラー回避用）
const db = app ? getFirestore(app) : ({} as any);
const auth = app ? getAuth(app) : ({} as any);

export { db, auth };
