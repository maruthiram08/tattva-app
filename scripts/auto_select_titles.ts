import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createProvider } from '../lib/llm/provider-factory';
import { LLMGenerateRequest } from '../lib/types/llm-provider';

const INPUT_FILE = './projectdocs/sarga_title_comparison.md';
const BATCH_SIZE = 20; // Process 20 rows at a time to keep context clear

// The exact system prompt provided by the user
const SYSTEM_PROMPT = `
You are a **classical-text editorial agent** specializing in the *Valmiki Ramayana*.
Your task is to **select the most appropriate sarga title** between two candidates.
You must prioritize **narrative fidelity, textual accuracy, and traditional neutrality** over poetic flourish or modern storytelling styles.

## 🧭 Core Editorial Principles (Rules)

### **Rule 1: Narrative Fidelity (Highest Priority)**
Choose the title that most directly states **what happens in the sarga**.
✔ Names the primary event, action, or interaction
❌ Adds interpretation, judgment, or future consequence

### **Rule 2: Canonical Neutrality**
Prefer titles that could plausibly appear in:
* a Sanskrit adhyāya list
* a traditional commentary
* an academic table of contents

Avoid:
* modern abstractions (odyssey, arc, redemption, destiny)
* excessive adjectives not grounded in the text

### **Rule 3: Specificity over Emotion**
When one title:
* names **people, places, or actions**, and
* the other emphasizes **emotion or mood**,
→ **Always choose specificity**
Exception: If **lament, grief, or plea** is the *central action* of the sarga itself, emotional wording is allowed.

### **Rule 4: No Moral or Devotional Overlay**
Avoid titles that:
* praise or condemn characters beyond textual action
* impose later bhakti framing
* imply divine intent unless explicitly described in that sarga

### **Rule 5: Brevity and TOC Fitness**
Prefer:
* shorter titles
* clear nouns + verbs
* easy scanability

## 🚫 Disallowed Patterns (Strong Negative Signal)
Penalize titles containing:
* "Cosmic", "Odyssey", "Arc", "Redemption"
* "Destiny’s Decree", "Divine Reckoning"
* Overloaded emotion: "heartbreaking", "fiery", "anguished" (unless central)

## ✅ Positive Signals (Strong Preference)
Reward titles that:
* mention **named characters** (Rama, Sita, Dasaratha, Ravana, etc.)
* mention **explicit acts** (arrival, abduction, counsel, sacrifice, duel)
* reference **known canonical motifs** (bow of Shiva, golden deer, first śloka)

## 📌 Output Constraints
* For each input row, output strictly the **Final Selection**.
* Do not explain.
* Do not modify the wording of the chosen title.
* Return the result as a JSON array of strings, corresponding to the input order.
`;

async function main() {
    console.log('Starting Auto-Selection of Titles...');

    // 1. Read and Parse Markdown Table
    const content = fs.readFileSync(INPUT_FILE, 'utf-8');
    const lines = content.split('\n');

    // Find table start
    let startIdx = 0;
    const dataRows: { lineIdx: number, kanda: string, sarga: string, claude: string, openai: string }[] = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('|') && !line.includes('Claude Title') && !line.includes('---')) {
            const parts = line.split('|').map(p => p.trim()).filter(p => p !== '');
            if (parts.length >= 4) {
                // Expected parts: Kanda, Sarga, Claude, OpenAI, Selection (maybe empty)
                // Note: Split filter might remove empty selection col if trailing
                // Let's be safer with split
                const cells = line.split('|').slice(1, -1).map(c => c.trim());
                if (cells.length >= 4) {
                    dataRows.push({
                        lineIdx: i,
                        kanda: cells[0],
                        sarga: cells[1],
                        claude: cells[2],
                        openai: cells[3]
                    });
                }
            }
        }
    }

    console.log(`Found ${dataRows.length} rows to process.`);

    // 2. Initialize Provider (Prefer Claude for editorial tasks as it follows instructions well, fallback to OpenAI)
    // Actually, user prompts suggest high reasoning. Claude 3.5 Sonnet is excellent for this.
    const provider = createProvider({
        provider: process.env.ANTHROPIC_API_KEY ? 'claude' : 'openai',
        temperature: 0 // Deterministic
    });

    // 3. Process in Batches
    for (let i = 0; i < dataRows.length; i += BATCH_SIZE) {
        const batch = dataRows.slice(i, i + BATCH_SIZE);
        console.log(`Processing batch ${i + 1} to ${Math.min(i + BATCH_SIZE, dataRows.length)}...`);

        const batchInput = batch.map((row, idx) => ({
            id: idx,
            kanda: row.kanda,
            sarga: row.sarga,
            claude_title: row.claude,
            openai_title: row.openai
        }));

        const prompt = `
    Here is a batch of ${batch.length} title pairs. 
    Select the best title for each based on the rules.
    
    Input:
    ${JSON.stringify(batchInput, null, 2)}
    
    Output format:
    A single JSON array of strings, e.g. ["Selected Title 1", "Selected Title 2", ...]
    Must match the order of input.
    `;

        try {
            const req: LLMGenerateRequest = {
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: prompt }
                ]
            };

            const response = await provider.generateAnswer(req);
            const jsonStr = response.content.replace(/```json/g, '').replace(/```/g, '').trim();
            const selections: string[] = JSON.parse(jsonStr);

            if (selections.length !== batch.length) {
                console.error('Mismatch in response length!', selections.length, batch.length);
                continue;
            }

            // Update parsed lines in memory
            batch.forEach((row, idx) => {
                const selected = selections[idx];
                // Reconstruct the line
                // | Kanda | Sarga | Claude | OpenAI | Final |
                // We need to pad properly or just format simply. Markdown auto-formats usually.
                const newLine = `| ${row.kanda} | ${row.sarga} | ${row.claude} | ${row.openai} | ${selected} |`;
                lines[row.lineIdx] = newLine;
            });

        } catch (e) {
            console.error('Error processing batch:', e);
        }

        // Simple rate limit helper
        await new Promise(r => setTimeout(r, 1000));
    }

    // 4. Write back
    fs.writeFileSync(INPUT_FILE, lines.join('\n'));
    console.log('Finished updating comparison table.');
}

main().catch(console.error);
