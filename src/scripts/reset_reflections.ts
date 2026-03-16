import fs from 'fs';
import path from 'path';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore/lite';

const envPath = '/Users/NOB/Projects/01_my-project/project-1on1/.env.local';
if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim();
        }
    });
}

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
    console.log("Fetching all weeklyReflections...");
    const snapshot = await getDocs(collection(db, 'weeklyReflections'));
    console.log(`Found ${snapshot.docs.length} records. Deleting...`);
    
    let count = 0;
    for (const docSnapshot of snapshot.docs) {
        await deleteDoc(doc(db, 'weeklyReflections', docSnapshot.id));
        count++;
    }
    console.log(`Successfully deleted ${count} records.`);
}

run().catch(console.error);
