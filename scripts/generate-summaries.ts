import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import fs from 'fs';
import path from 'path';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

const DATA_PATH = path.join(process.cwd(), 'lib', 'data', 'source', 'Valmiki_Ramayan_Shlokas.json');
const OUTPUT_PATH = path.join(process.cwd(), 'lib', 'data', 'sarga_summaries.json');

async function main() {
    console.log('Reading data...');
    const rawData = fs.readFileSync(DATA_PATH, 'utf-8');
    const shlokas = JSON.parse(rawData);

    // Filter for Bala Kanda 1
    const targetShlokas = shlokas.filter((s: any) => s.kanda === 'Bala Kanda' && s.sarga === 1);

    console.log(`Found ${targetShlokas.length} shlokas for Bala Kanda 1.`);

    // Combine explanations
    // Sort by shloka number just in case
    targetShlokas.sort((a: any, b: any) => a.shloka - b.shloka);

    const fullText = targetShlokas.map((s: any) => s.explanation).filter(Boolean).join('\n');

    console.log('Generating summary...');

    // Call AI
    const { text } = await generateText({
        model: openai('gpt-4o'),
        system: "You are a master storyteller and scholar of the Valmiki Ramayana. Your task is to summarize the provided verse explanations into a single, coherent, flowing narrative story in English. Do not mention verse numbers. Maintain the sequence of events strictly. Use a reverent, 'book-like' tone. Do not hallucinate details not present in the text, but smooth out the transitions to make it read like a novel.",
        prompt: fullText,
    });

    console.log('Summary Generated!');
    // console.log(text);

    // Save to file (append or create)
    let summaries: any[] = [];
    if (fs.existsSync(OUTPUT_PATH)) {
        summaries = JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf-8'));
    }

    // Update or Add
    const existingIndex = summaries.findIndex(s => s.kanda === 'Bala Kanda' && s.sarga === 1);
    const newEntry = {
        kanda: 'Bala Kanda',
        sarga: 1,
        summary: text,
        generatedAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
        summaries[existingIndex] = newEntry;
    } else {
        summaries.push(newEntry);
    }

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(summaries, null, 2));
    console.log(`Saved to ${OUTPUT_PATH}`);
}

main().catch(console.error);
