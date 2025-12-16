
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

// Import extractors (mocking availability or duplicating logic for standalone)
// Since we can't easily import from the running script, we'll duplicate the core extraction logic for this preview
import { extractCharacters } from '../lib/constants/character-patterns';
import {
    extractEventKeywords,
    extractThemeKeywords,
} from '../lib/constants/event-theme-patterns';

// ... (Interfaces)
interface ShlokaData {
    kanda: string;
    sarga: number;
    shloka: number;
    shloka_text: string;
    transliteration: string | null;
    translation: string | null;
    explanation: string;
    comments: string | null;
}

const SYSTEM_PROMPT = `You are a Ramayana scholar extracting tags from shloka explanations.
For EACH item in the input array, extract:
1. Events: Specific happenings (e.g., "exile_announcement", "sita_abduction")
2. Themes: Abstract concepts (e.g., "dharma", "loyalty", "sacrifice")

Return a JSON OBJECT where keys are the input "id" and values are objects with "events" and "themes" arrays.
Use lowercase_underscore format for tags. Be concise.`;

async function preview() {
    console.log('🔍 Generating Preview (3 Samples)...\n');

    // Load dataset
    const dataPath = path.join(__dirname, '..', 'Valmiki_Ramayan_Dataset', 'data', 'Valmiki_Ramayan_Shlokas.json');
    const rawData = fs.readFileSync(dataPath, 'utf-8');
    let dataset: ShlokaData[] = JSON.parse(rawData);

    // Pick 3 interesting samples (with explanations) from different Kandas
    const samples = [
        dataset.find(s => s.kanda === 'Ayodhya Kanda' && s.explanation && s.explanation.includes('exile')), // Likely exile
        dataset.find(s => s.kanda === 'Sundara Kanda' && s.explanation && s.explanation.includes('Hanuman')), // Hanuman
        dataset.find(s => s.kanda === 'Yuddha Kanda' && s.explanation && s.explanation.includes('Ravana'))  // War
    ].filter(Boolean) as ShlokaData[];

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Format for LLM
    const batchInputs = samples.map(s => ({
        id: `${s.kanda}-${s.sarga}-${s.shloka}`,
        text: `Explanation: ${s.explanation.substring(0, 500)}`
    }));

    console.log('🤖 Asking GPT-4o-mini for tags...');

    const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0.3,
        response_format: { type: 'json_object' },
        messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: JSON.stringify(batchInputs) },
        ],
    });

    const llmResults = JSON.parse(response.choices[0].message.content || '{}');

    // Merge and Display
    console.log('\n✨ PREVIEW RESULTS ✨\n');

    samples.forEach(s => {
        const id = `${s.kanda}-${s.sarga}-${s.shloka}`;
        const combinedText = `${s.explanation} ${s.translation}`;

        const charTags = extractCharacters(combinedText);
        const kwEvents = extractEventKeywords(combinedText);
        const kwThemes = extractThemeKeywords(combinedText);

        const llmTags = llmResults[id] || { events: [], themes: [] };

        const finalEvents = Array.from(new Set([...kwEvents, ...(llmTags.events || [])]));
        const finalThemes = Array.from(new Set([...kwThemes, ...(llmTags.themes || [])]));

        console.log(`📜 ${s.kanda} ${s.sarga}.${s.shloka}`);
        console.log(`   Text: "${s.translation?.substring(0, 80)}..."`);
        console.log(`   👤 Characters: [${charTags.join(', ')}]`);
        console.log(`   🔥 Events:     [${finalEvents.join(', ')}]`);
        console.log(`   🧠 Themes:     [${finalThemes.join(', ')}]`);
        console.log('   --------------------------------------------------\n');
    });
}

preview();
