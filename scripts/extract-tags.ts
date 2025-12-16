/**
 * Tag Extraction Script (Dual-Provider Parallel Processing)
 * Hybrid approach: Rule-based characters + LLM (Claude + OpenAI) for events/themes
 * Uses Round-Robin Load Balancing to maximize throughput
 */

import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });
import { extractCharacters } from '../lib/constants/character-patterns';
import {
  extractEventKeywords,
  extractThemeKeywords,
} from '../lib/constants/event-theme-patterns';

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

interface EnhancedShlokaData extends ShlokaData {
  kanda_number: number;
  characters: string[];
  events: string[];
  themes: string[];
  has_translation: boolean;
  has_explanation: boolean;
  has_comments: boolean;
}

interface LLMTagsResponse {
  id: string; // "kanda-sarga-shloka"
  events: string[];
  themes: string[];
}

interface BatchInput {
  id: string;
  text: string;
}

// Kanda name to number mapping
const KANDA_MAP: Record<string, number> = {
  'Bala Kanda': 1,
  'Ayodhya Kanda': 2,
  'Aranya Kanda': 3,
  'Kishkindha Kanda': 4,
  'Sundara Kanda': 5,
  'Yuddha Kanda': 6,
  'Uttara Kanda': 7,
  'Uttara Kanda (Appendix)': 7,
};

// System prompt shared by both providers
const SYSTEM_PROMPT = `You are a Ramayana scholar extracting tags from shloka explanations.
For EACH item in the input array, extract:
1. Events: Specific happenings (e.g., "exile_announcement", "sita_abduction")
2. Themes: Abstract concepts (e.g., "dharma", "loyalty", "sacrifice")

Return a JSON OBJECT where keys are the input "id" and values are objects with "events" and "themes" arrays.
Use lowercase_underscore format for tags. Be concise.

Example Output Format:
{
  "bala-1-1": { "events": ["..."], "themes": ["..."] },
  "bala-1-2": { "events": ["..."], "themes": ["..."] }
}`;

/**
 * Generate a unique ID for a shloka for mapping results
 */
function getShlokaId(s: ShlokaData): string {
  // sanitize kanda name
  const kandaSlug = s.kanda.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return `${kandaSlug}-${s.sarga}-${s.shloka}`;
}

// CLAUDE BATCH HANDLER
async function extractTagsBatchClaude(
  batchInputs: BatchInput[],
  claude: Anthropic
): Promise<Record<string, LLMTagsResponse>> {
  try {
    const response = await claude.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 4000,
      temperature: 0.3,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: JSON.stringify(batchInputs),
        },
      ],
    });

    const content = response.content[0];
    if (content.type === 'text') {
      const jsonStr = content.text.trim();
      const cleanJson = jsonStr.replace(/^```json\n|\n```$/g, '');
      return JSON.parse(cleanJson);
    }
    return {};
  } catch (error) {
    console.error('Claude batch extraction error:', error);
    throw error; // Throw to trigger retry/fallback
  }
}

// OPENAI BATCH HANDLER
async function extractTagsBatchOpenAI(
  batchInputs: BatchInput[],
  openai: OpenAI
): Promise<Record<string, LLMTagsResponse>> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: JSON.stringify(batchInputs),
        },
      ],
    });

    const content = response.choices[0].message.content;
    if (content) {
      return JSON.parse(content);
    }
    return {};
  } catch (error) {
    console.error('OpenAI batch extraction error:', error);
    throw error; // Throw to trigger retry/fallback
  }
}

async function extractTags(useLLM: boolean = true): Promise<void> {
  console.log('🏷️  Starting tag extraction (Dual-Provider Parallel Mode)...\n');

  // Initialize providers
  let claude: Anthropic | null = null;
  let openai: OpenAI | null = null;

  if (useLLM) {
    if (process.env.ANTHROPIC_API_KEY) {
      claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      console.log('✅ Claude client initialized (Claude 3.5 Haiku)');
    } else {
      console.warn('⚠️  ANTHROPIC_API_KEY missing - Claude disabled');
    }

    if (process.env.OPENAI_API_KEY) {
      openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      console.log('✅ OpenAI client initialized (GPT-4o-mini)');
    } else {
      console.warn('⚠️  OPENAI_API_KEY missing - OpenAI disabled');
    }
    console.log('');

    if (!claude && !openai) {
      throw new Error('No LLM providers available! Check .env.local');
    }
  }

  // Load dataset
  const dataPath = path.join(
    __dirname,
    '..',
    'Valmiki_Ramayan_Dataset',
    'data',
    'Valmiki_Ramayan_Shlokas.json'
  );

  const rawData = fs.readFileSync(dataPath, 'utf-8');
  let dataset: ShlokaData[] = JSON.parse(rawData);

  console.log(`📚 Loaded ${dataset.length} shlokas\n`);

  const enhancedDataset: EnhancedShlokaData[] = [];

  // Concurrency configuration
  const BATCH_SIZE = useLLM ? 20 : 1000;
  const MAX_CONCURRENT = 6; // 3 Claude + 3 OpenAI
  const RETRY_DELAY = 10000;
  const MAX_RETRIES = 3;

  let processedCount = 0;
  const startTime = Date.now();

  // Helper for batched processing with Retry & Provider Selection
  const processBatch = async (batch: ShlokaData[], batchIndex: number) => {
    // Prepare batch inputs
    const batchInputs: BatchInput[] = [];
    const shlokaMap = new Map<string, ShlokaData>();

    for (const shloka of batch) {
      const id = getShlokaId(shloka);
      shlokaMap.set(id, shloka);

      if (useLLM && shloka.explanation) {
        const text = `Explanation: ${shloka.explanation.substring(0, 500)}${shloka.translation ? `\nTranslation: ${shloka.translation.substring(0, 200)}` : ''}`;
        batchInputs.push({ id, text });
      }
    }

    // Determine Provider (Round Robin)
    // Even batches -> OpenAI, Odd -> Claude (or failover if one missing)
    let providerName = 'none';
    if (openai && claude) {
      providerName = batchIndex % 2 === 0 ? 'openai' : 'claude';
    } else if (openai) {
      providerName = 'openai';
    } else if (claude) {
      providerName = 'claude';
    }

    // Process batch with Retry Logic
    let llmResults: Record<string, LLMTagsResponse> = {};
    if (useLLM && batchInputs.length > 0) {
      let retries = 0;
      while (retries < MAX_RETRIES) {
        try {
          if (providerName === 'openai' && openai) {
            llmResults = await extractTagsBatchOpenAI(batchInputs, openai);
          } else if (providerName === 'claude' && claude) {
            llmResults = await extractTagsBatchClaude(batchInputs, claude);
          }
          break; // Success
        } catch (error: any) {
          retries++;
          if (retries === MAX_RETRIES) {
            console.error(`❌ Batch failed on ${providerName} after ${MAX_RETRIES} attempts.`);
            break;
          }

          // Switch provider on failure if possible
          if (openai && claude) {
            const oldProvider = providerName;
            providerName = providerName === 'openai' ? 'claude' : 'openai';
            console.log(`⚠️  Switching provider ${oldProvider} -> ${providerName} for retry...`);
          }

          // Backoff
          const delay = RETRY_DELAY * retries;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // Merge results
    const batchResults: EnhancedShlokaData[] = [];
    for (const shloka of batch) {
      const id = getShlokaId(shloka);
      const combinedText = `${shloka.explanation || ''} ${shloka.translation || ''}`;

      const characters = extractCharacters(combinedText);
      const keywordEvents = extractEventKeywords(combinedText);
      const keywordThemes = extractThemeKeywords(combinedText);

      const llmTags = llmResults[id] || { events: [], themes: [] };

      const events = Array.from(new Set([...keywordEvents, ...(llmTags.events || [])]));
      const themes = Array.from(new Set([...keywordThemes, ...(llmTags.themes || [])]));

      batchResults.push({
        ...shloka,
        kanda_number: KANDA_MAP[shloka.kanda] || 7,
        characters,
        events,
        themes,
        has_translation: !!shloka.translation,
        has_explanation: !!shloka.explanation,
        has_comments: !!shloka.comments,
      });
    }
    return batchResults;
  };

  // Main Loop with Concurrency
  const chunks = [];
  for (let i = 0; i < dataset.length; i += BATCH_SIZE) {
    chunks.push(dataset.slice(i, i + BATCH_SIZE));
  }

  // Process chunk by chunk with concurrency limit
  const activePromises: Promise<EnhancedShlokaData[]>[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const batch = chunks[i];

    // Add to active pool
    const promise = processBatch(batch, i).then(res => {
      processedCount += batch.length;
      // Progress Log
      if (processedCount % 100 === 0 || processedCount === dataset.length) {
        const elapsed = (Date.now() - startTime) / 1000;
        const rate = processedCount / elapsed;
        const remaining = (dataset.length - processedCount) / rate;
        console.log(`Progress: ${((processedCount / dataset.length) * 100).toFixed(1)}% | Rate: ${rate.toFixed(1)}/s | ETA: ${(remaining / 60).toFixed(1)}m`);
      }
      return res;
    });

    activePromises.push(promise);

    // If max concurrent reached, wait for one to finish
    if (activePromises.length >= MAX_CONCURRENT) {
      const finishedIndex = await Promise.race(activePromises.map((p, idx) => p.then(() => idx)));
      const result = await activePromises[finishedIndex];
      enhancedDataset.push(...result);
      activePromises.splice(finishedIndex, 1);
    }

    // Delay (reduced since we have dual providers)
    if (useLLM) await new Promise(r => setTimeout(r, 200));
  }

  // Wait for remaining
  const remainingResults = await Promise.all(activePromises);
  remainingResults.forEach(r => enhancedDataset.push(...r));

  // Save enhanced dataset
  const outputPath = path.join(__dirname, 'enhanced-shlokas.json');
  fs.writeFileSync(outputPath, JSON.stringify(enhancedDataset, null, 2));

  console.log(`\n✅ Tag extraction complete!`);
  console.log(`💾 Saved to: ${outputPath}\n`);

  // Statistics
  const totalCharacters = enhancedDataset.reduce((sum, s) => sum + s.characters.length, 0);
  const totalEvents = enhancedDataset.reduce((sum, s) => sum + s.events.length, 0);
  const totalThemes = enhancedDataset.reduce((sum, s) => sum + s.themes.length, 0);

  console.log('📊 Tag Statistics:');
  console.log(`  Total character tags: ${totalCharacters.toLocaleString()}`);
  console.log(`  Total event tags:     ${totalEvents.toLocaleString()}`);
  console.log(`  Total theme tags:     ${totalThemes.toLocaleString()}`);
  console.log(`  Avg tags per shloka:  ${((totalCharacters + totalEvents + totalThemes) / dataset.length).toFixed(1)}`);
}

// Parse CLI arguments
const useLLM = !process.argv.includes('--no-llm');

console.log(`\nMode: ${useLLM ? 'Hybrid (Dual-Provider Parallel LLM)' : 'Rule-based only'}`);
console.log(`Providers: Claude 3.5 Haiku + GPT-4o-mini\n`);

extractTags(useLLM)
  .then(() => {
    console.log('\n🎉 Success!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
