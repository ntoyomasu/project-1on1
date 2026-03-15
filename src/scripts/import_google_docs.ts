import fs from 'fs';
import path from 'path';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore/lite';

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

const RAW_DATA_PATH = path.resolve(process.cwd(), 'raw_extracted_data.txt');
const USER_ID = 'user_demo'; // Default user for import

function parseRawData(content: string) {
    const reflections: any[] = [];
    const tabs = content.split('### Tab: ').filter(t => t.trim() !== '');

    tabs.forEach(tab => {
        const lines = tab.split('\n');
        const dateStr = lines[0].trim();
        const bodyArr = lines.slice(1);
        const body = bodyArr.join('\n');

        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return;

        const reflection: any = {
            userId: USER_ID,
            weekStartDate: Timestamp.fromDate(date),
            status: 'COMPLETED',
            study: createEmptyCategory(),
            soccer: createEmptyCategory(),
            life: createEmptyCategory(),
            inventionNote: "",
            mentorComment: "",
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        };

        // Helper to extract content between identifiers
        const getSection = (text: string, startMarker: string, endMarkers: string[]) => {
            const startIndex = text.indexOf(startMarker);
            if (startIndex === -1) return "";

            let minEndIndex = text.length;
            endMarkers.forEach(marker => {
                const idx = text.indexOf(marker, startIndex + startMarker.length);
                if (idx !== -1 && idx < minEndIndex) {
                    minEndIndex = idx;
                }
            });

            return text.substring(startIndex + startMarker.length, minEndIndex).trim();
        };

        const goalText = getSection(tab, 'G - Goal', ['R - Reality', 'O - Options', 'W - Will', '---']);
        const realityText = getSection(tab, 'R - Reality', ['O - Options', 'W - Will', '---']);
        const optionsText = getSection(tab, 'O - Options', ['W - Will', '---']);
        const willText = getSection(tab, 'W - Will', ['---']);

        const extractByCategory = (text: string) => {
            const records = { study: "", soccer: "", life: "" };
            if (!text) return records;

            // Look for "記録:" block first
            let recordContent = text;
            if (text.includes('記録:')) {
                recordContent = text.split('記録:').pop() || "";
            }

            const studyRegex = /(?:学問|学習|学)：?([\s\S]*?)(?=(?:サッカー|生活|Investment|Return|ROI|Good|Bad|Next|$))/i;
            const soccerRegex = /(?:サッカー)：?([\s\S]*?)(?=(?:学問|学習|学|生活|Investment|Return|ROI|Good|Bad|Next|$))/i;
            const lifeRegex = /(?:生活)：?([\s\S]*?)(?=(?:学問|学習|学|サッカー|Investment|Return|ROI|Good|Bad|Next|$))/i;

            const sMatch = recordContent.match(studyRegex);
            const socMatch = recordContent.match(soccerRegex);
            const lMatch = recordContent.match(lifeRegex);

            if (sMatch) records.study = sMatch[1].trim();
            if (socMatch) records.soccer = socMatch[1].trim();
            if (lMatch) records.life = lMatch[1].trim();

            return records;
        };

        // Map Goal -> Plan
        const goals = extractByCategory(goalText);
        reflection.study.plan = goals.study;
        reflection.soccer.plan = goals.soccer;
        reflection.life.plan = goals.life;

        // Map Reality -> Learnings/Actual
        const realityRecords = extractByCategory(realityText);

        // Extract ROI scores
        const roiRegex = /(?:学問|学習|学|サッカー|生活)：?ROI\s*(\d+)/gi;
        let match;
        while ((match = roiRegex.exec(realityText)) !== null) {
            const cat = match[0].toLowerCase();
            const score = parseInt(match[1]);
            if (cat.includes('学')) reflection.study.score = score;
            else if (cat.includes('サッカー')) reflection.soccer.score = score;
            else if (cat.includes('生活')) reflection.life.score = score;
        }

        // Helper to extract score or standalone numbers
        const extractScoreLines = (text: string) => {
            const lines = text.split('\n');
            for (const line of lines) {
                const scoreMatch = line.trim().match(/^(\d{2,3})$/);
                if (scoreMatch) return parseInt(scoreMatch[1]);
                const roiLineMatch = line.match(/ROI[：\s]*(\d+)/i);
                if (roiLineMatch) return parseInt(roiLineMatch[1]);
            }
            return 0;
        };

        if (reflection.study.score === 0) reflection.study.score = extractScoreLines(realityRecords.study);
        if (reflection.soccer.score === 0) reflection.soccer.score = extractScoreLines(realityRecords.soccer);
        if (reflection.life.score === 0) reflection.life.score = extractScoreLines(realityRecords.life);

        // Extract Good/Bad points
        const extractLearnings = (text: string) => {
            const success = (text.match(/(?:Good|成功理由|発明|R：)：?([\s\S]*?)(?=(?:Bad|改善点|Next|Wait|$))/i)?.[1] || "").trim();
            const failure = (text.match(/(?:Bad|改善点|失敗点)：?([\s\S]*?)(?=(?:Good|成功理由|Next|$))/i)?.[1] || "").trim();
            return { success, failure };
        };

        const sLearnings = extractLearnings(realityRecords.study);
        reflection.study.learnings.success = sLearnings.success;
        reflection.study.learnings.failure = sLearnings.failure;

        const socLearnings = extractLearnings(realityRecords.soccer);
        reflection.soccer.learnings.success = socLearnings.success;
        reflection.soccer.learnings.failure = socLearnings.failure;

        const lLearnings = extractLearnings(realityRecords.life);
        reflection.life.learnings.success = lLearnings.success;
        reflection.life.learnings.failure = lLearnings.failure;

        // Map Will -> NextWill
        const wills = extractByCategory(willText);
        reflection.study.nextWill = wills.study;
        reflection.soccer.nextWill = wills.soccer;
        reflection.life.nextWill = wills.life;

        // Special handling for Investment/Return section
        const combinedOptionsWill = optionsText + "\n" + willText;
        const invMatch = combinedOptionsWill.match(/Investment\(投資\)([\s\S]*?)(?=Return|$)/i);
        if (invMatch) {
            const invCats = extractByCategory(invMatch[1]);
            if (invCats.study) reflection.study.nextWill += (reflection.study.nextWill ? "\n" : "") + "Investment: " + invCats.study;
            if (invCats.soccer) reflection.soccer.nextWill += (reflection.soccer.nextWill ? "\n" : "") + "Investment: " + invCats.soccer;
            if (invCats.life) reflection.life.nextWill += (reflection.life.nextWill ? "\n" : "") + "Investment: " + invCats.life;
        }

        // Invention notes
        const inventionMatches = body.match(/(?:発明|成功理由|Good)：([\s\S]*?)(?=(?:Bad|Next|---|$))/g);
        if (inventionMatches) {
            reflection.inventionNote = inventionMatches.map(m => m.replace(/^(?:発明|成功理由|Good)：/, '').trim()).join('\n');
        }

        reflections.push(reflection);
    });

    return reflections;
}

function createEmptyCategory() {
    return {
        plan: "",
        dailyLogs: {
            sat: { actual: "", nextWill: "" },
            sun: { actual: "", nextWill: "" },
            mon: { actual: "", nextWill: "" },
            tue: { actual: "", nextWill: "" },
            wed: { actual: "", nextWill: "" },
            thu: { actual: "", nextWill: "" },
            fri: { actual: "", nextWill: "" },
        },
        learnings: {
            failure: "",
            success: "",
        },
        score: 0,
        nextWill: "",
    };
}

async function run() {
    console.log("Reading raw data...");
    const content = fs.readFileSync(RAW_DATA_PATH, 'utf8');
    const reflections = parseRawData(content);

    console.log(`Parsed ${reflections.length} reflections.`);

    for (const ref of reflections) {
        console.log(`Importing reflection for date: ${ref.weekStartDate.toDate().toISOString().split('T')[0]}...`);
        try {
            await addDoc(collection(db, 'weeklyReflections'), ref);
        } catch (e) {
            console.error(`Error importing ${ref.weekStartDate.toDate()}:`, e);
        }
    }

    console.log("Import completed.");
}

run().catch(console.error);
