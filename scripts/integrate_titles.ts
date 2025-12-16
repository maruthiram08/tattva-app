import fs from 'fs';
import path from 'path';

const INPUT_FILE = './projectdocs/sarga_title_comparison.md';
const OUTPUT_FILE = './lib/data/sarga_titles.json';

interface TitleEntry {
    kanda: string;
    sarga: number;
    title: string;
}

function main() {
    console.log('Starting Title Integration...');

    if (!fs.existsSync(INPUT_FILE)) {
        console.error(`Input file not found: ${INPUT_FILE}`);
        process.exit(1);
    }

    const content = fs.readFileSync(INPUT_FILE, 'utf-8');
    const lines = content.split('\n');

    const titles: TitleEntry[] = [];
    let processedCount = 0;
    let fallbackCount = 0;

    for (const line of lines) {
        const trimmed = line.trim();
        // Skip header and separator lines
        if (!trimmed.startsWith('|') || trimmed.includes('Claude Title') || trimmed.includes('---')) {
            continue;
        }

        const parts = trimmed.split('|').map(p => p.trim());
        // Expected: | Kanda | Sarga | Claude | OpenAI | Final |
        // indices: 0(empty), 1(Kanda), 2(Sarga), 3(Claude), 4(OpenAI), 5(Final), 6(empty)

        if (parts.length < 6) continue;

        const kanda = parts[1];
        const sarga = parseInt(parts[2], 10);
        const claudeTitle = parts[3];
        const openaiTitle = parts[4];
        let finalTitle = parts[5];

        if (!kanda || isNaN(sarga)) continue;

        // Fallback logic if final selection is empty
        if (!finalTitle) {
            if (claudeTitle) {
                finalTitle = claudeTitle;
                fallbackCount++;
            } else if (openaiTitle) {
                finalTitle = openaiTitle;
                fallbackCount++;
            } else {
                console.warn(`Warning: No title found for ${kanda} Sarga ${sarga}`);
                continue; // Skip if absolutely no title
            }
        }

        titles.push({
            kanda,
            sarga,
            title: finalTitle
        });
        processedCount++;
    }

    console.log(`Processed ${processedCount} titles.`);
    if (fallbackCount > 0) {
        console.log(`Used fallback (Claude/OpenAI) for ${fallbackCount} missing selections.`);
    }

    // Create directory if it doesn't exist
    const dir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(titles, null, 2));
    console.log(`Successfully saved titles to ${OUTPUT_FILE}`);
}

main();
