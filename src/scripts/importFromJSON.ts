import fs from 'fs';
import path from 'path';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, Timestamp, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore/lite';

// Load .env.local manually
const envPath = path.resolve(process.cwd(), '.env.local');
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

const JSON_DATA_PATH = path.resolve(process.cwd(), 'extracted_text_log');
const USER_ID = 'user_demo';

async function run() {
    console.log("Reading raw JSON data...");
    const content = fs.readFileSync(JSON_DATA_PATH, 'utf8');
    let records = [];
    try {
        records = JSON.parse(content);
    } catch (err) {
        console.error("Failed to parse JSON file.", err);
        return;
    }

    console.log(`Parsed ${records.length} records from JSON.`);

    for (const record of records) {
        // Prepare the record to match the Firestore schema structure
        const reflection: any = { ...record };
        
        ['study', 'soccer', 'life'].forEach(cat => {
            if (reflection[cat] && reflection[cat].plan !== undefined) {
                reflection[cat].goalAndMetrics = reflection[cat].plan;
                delete reflection[cat].plan;
            }
            if (reflection[cat]) {
                reflection[cat].nextGoalAndMetrics = "";
            }
        });
        
        if (reflection.id) {
            delete reflection.id; // Usually db sets doc.id
        }
        
        reflection.userId = USER_ID;
        
        // Convert date string to Firestore Timestamp
        const dateObj = new Date(record.weekStartDate);
        reflection.weekStartDate = Timestamp.fromDate(dateObj);
        reflection.createdAt = Timestamp.now();
        reflection.updatedAt = Timestamp.now();
        
        const dateStr = dateObj.toISOString().split('T')[0];
        console.log(`Importing record for date: ${dateStr}...`);

        try {
            // Check for existing records with the same start date
            const q = query(
                collection(db, 'weeklyReflections'),
                where('userId', '==', USER_ID),
                where('weekStartDate', '==', reflection.weekStartDate)
            );
            const snapshot = await getDocs(q);

            // Delete any existing duplicates for this week
            if (!snapshot.empty) {
                console.log(`Found ${snapshot.docs.length} existing record(s) for ${dateStr}. Overwriting...`);
                for (const existingDoc of snapshot.docs) {
                    await deleteDoc(doc(db, 'weeklyReflections', existingDoc.id));
                }
            }

            // Insert new record
            await addDoc(collection(db, 'weeklyReflections'), reflection);
        } catch (e) {
            console.error(`Error importing ${dateStr}:`, e);
        }
    }

    console.log("JSON Import completed.");
}

run().catch(console.error);
