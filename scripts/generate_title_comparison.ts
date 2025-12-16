import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createProvider, isProviderAvailable } from '../lib/llm/provider-factory';
import { LLMGenerateRequest, LLMProvider } from '../lib/types/llm-provider';

// Hardcoded path to data - assuming run from root
const DATA_PATH = './Valmiki_Ramayan_Dataset/data/Valmiki_Ramayan_Shlokas.json';
const OUTPUT_FILE = './projectdocs/sarga_title_comparison.md';

interface Shloka {
    kanda: string;
    sarga: number;
    shloka: number;
    comments?: string;
}

interface SargaData {
    kanda: string;
    sarga: number;
    summary: string;
}

async function main() {
    console.log('Starting Sarga Title Comparison Generation...');

    // 1. Read Data
    const rawData: Shloka[] = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));

    // 2. Extract unique sargas (shloka 1 has comments)
    const sargas: SargaData[] = [];
    rawData.forEach(item => {
        if (item.shloka === 1 && item.comments) {
            sargas.push({
                kanda: item.kanda,
                sarga: item.sarga,
                summary: item.comments
            });
        }
    });
    console.log(`Found ${sargas.length} Sargas to process.`);

    // 3. Initialize Providers
    const providers: { type: LLMProvider, instance: any }[] = [];

    if (process.env.OPENAI_API_KEY) {
        providers.push({ type: 'openai', instance: createProvider({ provider: 'openai' }) });
    }
    if (process.env.ANTHROPIC_API_KEY) {
        providers.push({ type: 'claude', instance: createProvider({ provider: 'claude' }) });
    }

    if (providers.length === 0) {
        console.error('No LLM providers available! Check .env.local');
        return;
    }
    console.log(`Using providers: ${providers.map(p => p.type).join(', ')}`);

    // 4. Batch Process
    let markdown = '# Sarga Title AI Comparison\n\n';
    markdown += '| Kanda | Sarga | Claude Title | OpenAI Title | Final Selection |\n';
    markdown += '|---|---|---|---|---|\n';

    // Limit for testing if needed, or process all?
    // User asked for "all sargas". Let's process a few batches or all.
    // Given 600+ sargas, let's limit simply to first 20 for this demo pass unless requested otherwise essentially.
    // Or better, let's process ALL but strictly sequentially to avoid rate limits.
    // Since time is factor, let's process 10 items as a proof of concept first. 
    // Wait, user said "for all sargas". I should probably do all but I will do first 10 for speed and then user can ask for more.
    // Process all sargas
    const PROCESS_LIMIT = 1000;
    console.log(`Processing up to ${PROCESS_LIMIT} sargas (Full Dataset)...`);

    const subset = sargas.slice(0, PROCESS_LIMIT);

    for (const sarga of subset) {
        console.log(`Processing ${sarga.kanda} - Sarga ${sarga.sarga}...`);

        const titles: Record<string, string> = { claude: '', openai: '' };

        const prompt = `Read the following summary of a Ramayana chapter (Sarga) and generate a short, evocative title (2-6 words) for it. 
      Do NOT use "Chapter" or "Sarga" in the title. Focus on the main event or theme.
      
      Summary: "${sarga.summary}"
      
      Title:`;

        for (const p of providers) {
            try {
                const req: LLMGenerateRequest = {
                    messages: [{ role: 'user', content: prompt }]
                };
                const response = await p.instance.generateAnswer(req);
                titles[p.type] = response.content.replace(/["']/g, '').trim();
            } catch (error) {
                console.error(`Error with ${p.type}:`, error);
                titles[p.type] = 'ERROR';
            }
        }

        markdown += `| ${sarga.kanda} | ${sarga.sarga} | ${titles['claude'] || '-'} | ${titles['openai'] || '-'} |  |\n`;
    }

    // 5. Write Output
    if (!fs.existsSync(path.dirname(OUTPUT_FILE))) {
        fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
    }
    fs.writeFileSync(OUTPUT_FILE, markdown);
    console.log(`Comparison table saved to ${OUTPUT_FILE}`);
}

main().catch(console.error);
