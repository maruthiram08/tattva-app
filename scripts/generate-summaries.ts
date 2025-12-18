import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import fs from 'fs';
import path from 'path';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

const DATA_PATH = path.join(process.cwd(), 'lib', 'data', 'source', 'Valmiki_Ramayan_Shlokas.json');
const OUTPUT_PATH = path.join(process.cwd(), 'lib', 'data', 'sarga_summaries.json');

// Safety limit for batch run. Increase this or set to -1 for full run.
// Current Setting: Unlimited (Full Batch).
const LIMIT: number = -1;

async function main() {
    console.log('Reading data...');
    const rawData = fs.readFileSync(DATA_PATH, 'utf-8');
    const shlokas = JSON.parse(rawData);

    // Group into Kanda -> Sarga -> Shlokas
    // Use a Map to preserve order if consistent, but we will iterate
    const groups = new Map<string, any[]>();

    // Helper to standard sort keys? Ramayana follows specific order.
    // For now, we trust the array order or just process what we find.
    shlokas.forEach((s: any) => {
        const key = `${s.kanda}|${s.sarga}`;
        if (!groups.has(key)) {
            groups.set(key, []);
        }
        groups.get(key)!.push(s);
    });

    console.log(`Found ${groups.size} distinct sargas.`);

    // Load existing summaries
    let summaries: any[] = [];
    if (fs.existsSync(OUTPUT_PATH)) {
        summaries = JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf-8'));
        console.log(`Loaded ${summaries.length} existing summaries.`);
    }

    let processedCount = 0;

    // Iterate through groups
    for (const [key, sargaShlokas] of Array.from(groups.entries())) {
        if (LIMIT !== -1 && processedCount >= LIMIT) {
            console.log(`Test Limit of ${LIMIT} reached. Stopping.`);
            break;
        }

        const [kanda, sargaStr] = key.split('|');
        const sarga = parseInt(sargaStr);

        // Check if exists
        const exists = summaries.find(s => s.kanda === kanda && s.sarga === sarga);
        if (exists) {
            // console.log(`Skipping ${kanda} Sarga ${sarga} (Already exists)`);
            continue;
        }

        console.log(`Generating for ${kanda} Sarga ${sarga}... (${sargaShlokas.length} shlokas)`);

        // Sort by shloka number just in case
        sargaShlokas.sort((a: any, b: any) => a.shloka - b.shloka);

        const fullText = sargaShlokas.map((s: any) => s.explanation).filter(Boolean).join('\n');

        if (!fullText) {
            console.log('No explanation text found, skipping.');
            continue;
        }

        try {
            const { text } = await generateText({
                model: openai('gpt-4o'),
                system: "You are a master storyteller and scholar of the Valmiki Ramayana. Your task is to summarize the provided verse explanations into a single, coherent, flowing narrative story in English. Do not mention verse numbers. Maintain the sequence of events strictly. Use a reverent, 'book-like' tone. Do not hallucinate details not present in the text, but smooth out the transitions to make it read like a novel.",
                prompt: fullText,
            });

            // Add to summaries
            summaries.push({
                kanda,
                sarga,
                summary: text,
                generatedAt: new Date().toISOString()
            });

            // Save immediately to avoid data loss
            fs.writeFileSync(OUTPUT_PATH, JSON.stringify(summaries, null, 2));
            console.log(`Saved ${kanda} Sarga ${sarga}.`);
            processedCount++;

        } catch (error) {
            console.error(`Error generating for ${kanda} Sarga ${sarga}:`, error);
        }
    }

    console.log('Batch processing complete.');
}

main().catch(console.error);
