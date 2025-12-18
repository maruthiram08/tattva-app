import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import fs from 'fs';
import path from 'path';
import { smartGenerateText, ProviderKey } from '../lib/ai/smart-generation';

const DATA_PATH = path.join(process.cwd(), 'lib', 'data', 'source', 'Valmiki_Ramayan_Shlokas.json');
const OUTPUT_PATH = path.join(process.cwd(), 'lib', 'data', 'sarga_summaries.json');

// Safety limit for batch run. Increase this or set to -1 for full run.
const LIMIT: number = -1;
const WORKER_COUNT = 3;
const PROVIDERS: ProviderKey[] = ['openai', 'anthropic'];

interface SargaTask {
    kanda: string;
    sarga: number;
    shlokas: any[];
}

async function main() {
    console.log('Starting Distributed Batch Generation...');

    // 1. Load Data
    console.log('Reading data...');
    const rawData = fs.readFileSync(DATA_PATH, 'utf-8');
    const shlokas = JSON.parse(rawData);

    // Group into Sarga Tasks
    const groups = new Map<string, any[]>();
    shlokas.forEach((s: any) => {
        const key = `${s.kanda}|${s.sarga}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(s);
    });
    console.log(`Found ${groups.size} distinct sargas.`);

    // 2. Load Existing Summaries
    let summaries: any[] = [];
    if (fs.existsSync(OUTPUT_PATH)) {
        summaries = JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf-8'));
        console.log(`Loaded ${summaries.length} existing summaries.`);
    }

    // 3. Filter Tasks
    const tasks: SargaTask[] = [];
    for (const [key, sargaShlokas] of Array.from(groups.entries())) {
        const [kanda, sargaStr] = key.split('|');
        const sarga = parseInt(sargaStr);

        // Check if exists
        const exists = summaries.find(s => s.kanda === kanda && s.sarga === sarga);
        if (!exists) {
            tasks.push({ kanda, sarga, shlokas: sargaShlokas });
        }
    }

    // Sort tasks naturally (optional but nice)
    // tasks.sort (...)

    let pendingTasks = tasks;
    if (LIMIT !== -1) {
        pendingTasks = tasks.slice(0, LIMIT);
        console.log(`Limit applied. Queueing ${pendingTasks.length} tasks.`);
    } else {
        console.log(`Queueing all ${pendingTasks.length} remaining tasks.`);
    }

    if (pendingTasks.length === 0) {
        console.log("No tasks to process.");
        return;
    }

    // 4. Define Worker
    let tasksCompleted = 0;
    const saveLock = { locked: false }; // Simple lock for writing

    const saveSummaries = () => {
        // Synchronous write is atomic enough for this node script
        fs.writeFileSync(OUTPUT_PATH, JSON.stringify(summaries, null, 2));
    };

    const worker = async (id: number, provider: ProviderKey) => {
        console.log(`[Worker ${id}] Started using ${provider}`);

        while (pendingTasks.length > 0) {
            const task = pendingTasks.shift();
            if (!task) break;

            console.log(`[Worker ${id}] Processing ${task.kanda} Sarga ${task.sarga} (${task.shlokas.length} shlokas)...`);

            // Sort Shlokas
            task.shlokas.sort((a: any, b: any) => a.shloka - b.shloka);
            const fullText = task.shlokas.map((s: any) => s.explanation).filter(Boolean).join('\n');

            if (!fullText) {
                console.log(`[Worker ${id}] No text for ${task.kanda} ${task.sarga}, skipping.`);
                continue;
            }

            try {
                const { text } = await smartGenerateText({
                    system: "You are a master storyteller and scholar of the Valmiki Ramayana. " +
                        "Your task is to summarize the provided verse explanations into a single, coherent, flowing narrative story in English. " +
                        "Do not mention verse numbers. Maintain the sequence of events strictly. Use a reverent, 'book-like' tone. " +
                        "Do not hallucinate details not present in the text, but smooth out the transitions to make it read like a novel.",
                    prompt: fullText,
                    preferredProvider: provider
                });

                // Add to summaries
                summaries.push({
                    kanda: task.kanda,
                    sarga: task.sarga,
                    summary: text,
                    generatedAt: new Date().toISOString()
                });

                tasksCompleted++;
                console.log(`[Worker ${id}] Completed ${task.kanda} Sarga ${task.sarga}. Total Done: ${tasksCompleted}`);

                // Periodic Save (Every 1 task to be safe, or batch it)
                saveSummaries();

            } catch (error) {
                console.error(`[Worker ${id}] Failed ${task.kanda} Sarga ${task.sarga}:`, error);
                // Push back to queue or log as failed?
                // For now, log. Maybe retry?
                // pendingTasks.push(task); // Careful of infinite loops
            }
        }
        console.log(`[Worker ${id}] Finished.`);
    };

    // 5. Start Workers
    const workers = [];
    for (let i = 0; i < WORKER_COUNT; i++) {
        // Round robin provider assignment
        const provider = PROVIDERS[i % PROVIDERS.length];
        workers.push(worker(i + 1, provider));
    }

    await Promise.all(workers);
    console.log('All workers complete. Final save.');
    saveSummaries();
}

main().catch(console.error);
