/**
 * Embedding Generation Script
 * Generates OpenAI embeddings for all shlokas with enhanced metadata
 * Uses text-embedding-3-small (1536 dimensions) for cost efficiency
 */

import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import OpenAI from 'openai';

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

interface EnhancedShlokaData {
  kanda: string;
  sarga: number;
  shloka: number;
  shloka_text: string;
  transliteration: string | null;
  translation: string | null;
  explanation: string;
  comments: string | null;
  kanda_number: number;
  characters: string[];
  events: string[];
  themes: string[];
  has_translation: boolean;
  has_explanation: boolean;
  has_comments: boolean;
}

interface VectorData {
  id: string;
  values: number[];
  metadata: {
    kanda: string;
    kanda_number: number;
    sarga: number;
    shloka: number;
    shloka_text: string;
    explanation: string;
    translation: string | null;
    comments: string | null;
    has_translation: boolean;
    has_explanation: boolean;
    has_comments: boolean;
    characters: string[];
    events: string[];
    themes: string[];
  };
}

/**
 * Create embedding text by combining key fields
 */
function createEmbeddingText(shloka: EnhancedShlokaData): string {
  const parts: string[] = [];

  // Location context
  parts.push(`${shloka.kanda} - Sarga ${shloka.sarga} - Shloka ${shloka.shloka}`);

  // Sanskrit text
  parts.push(`Sanskrit: ${shloka.shloka_text}`);

  // Explanation (most important)
  if (shloka.explanation) {
    parts.push(`Explanation: ${shloka.explanation}`);
  }

  // Translation (if available)
  if (shloka.translation) {
    parts.push(`Translation: ${shloka.translation}`);
  }

  // Tags (help with semantic search)
  if (shloka.characters.length > 0) {
    parts.push(`Characters: ${shloka.characters.join(', ')}`);
  }
  if (shloka.events.length > 0) {
    parts.push(`Events: ${shloka.events.join(', ')}`);
  }
  if (shloka.themes.length > 0) {
    parts.push(`Themes: ${shloka.themes.join(', ')}`);
  }

  return parts.join('\n');
}

/**
 * Generate embeddings in batches
 */
async function generateEmbeddings(): Promise<void> {
  console.log('🔮 Starting embedding generation...\n');

  // Initialize OpenAI
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not set');
  }

  const openai = new OpenAI({ apiKey });
  console.log('✅ OpenAI client initialized\n');

  // Load enhanced dataset
  const enhancedDataPath = path.join(__dirname, 'enhanced-shlokas.json');

  if (!fs.existsSync(enhancedDataPath)) {
    throw new Error(
      `Enhanced dataset not found at ${enhancedDataPath}. Run extract-tags.ts first!`
    );
  }

  const rawData = fs.readFileSync(enhancedDataPath, 'utf-8');
  const dataset: EnhancedShlokaData[] = JSON.parse(rawData);

  console.log(`📚 Loaded ${dataset.length} enhanced shlokas\n`);


  // Prepare output file
  const outputPath = path.join(__dirname, 'vectors.jsonl');
  // Clear existing file if starting fresh
  fs.writeFileSync(outputPath, '');

  console.log(`💾 Writing to: ${outputPath}\n`);

  const BATCH_SIZE = 100;
  const EMBEDDING_MODEL = 'text-embedding-3-small';
  const EMBEDDING_DIMENSIONS = 1536;

  let totalCost = 0;
  const costPerToken = 0.00002 / 1000;
  let totalVectorsSaved = 0;

  for (let i = 0; i < dataset.length; i += BATCH_SIZE) {
    const batch = dataset.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(dataset.length / BATCH_SIZE);

    console.log(`📦 Processing batch ${batchNum}/${totalBatches} (${batch.length} shlokas)...`);

    const embeddingTexts = batch.map((shloka) => createEmbeddingText(shloka));

    try {
      const response = await openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: embeddingTexts,
        dimensions: EMBEDDING_DIMENSIONS,
      });

      const tokensUsed = response.usage?.total_tokens || 0;
      const batchCost = tokensUsed * costPerToken;
      totalCost += batchCost;

      // Append to file immediately
      const lines = response.data.map((embeddingData, idx) => {
        const shloka = batch[idx];
        const vectorId = `${shloka.kanda.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${shloka.sarga}-${shloka.shloka}`;

        const vector: VectorData = {
          id: vectorId,
          values: embeddingData.embedding,
          metadata: {
            kanda: shloka.kanda,
            kanda_number: shloka.kanda_number,
            sarga: shloka.sarga,
            shloka: shloka.shloka,
            shloka_text: shloka.shloka_text.substring(0, 1000),
            explanation: shloka.explanation?.substring(0, 2000) || '',
            translation: shloka.translation?.substring(0, 1000) || null,
            comments: shloka.comments?.substring(0, 1000) || null,
            has_translation: shloka.has_translation,
            has_explanation: shloka.has_explanation,
            has_comments: shloka.has_comments,
            characters: shloka.characters,
            events: shloka.events,
            themes: shloka.themes,
          }
        };
        return JSON.stringify(vector);
      });

      fs.appendFileSync(outputPath, lines.join('\n') + '\n');
      totalVectorsSaved += lines.length;

      const progress = ((i + batch.length) / dataset.length) * 100;
      console.log(`  Progress: ${progress.toFixed(1)}%`);
      console.log(`  Saved ${lines.length} vectors`);
      console.log(`  Total cost so far: $${totalCost.toFixed(4)}`);

      if (i + BATCH_SIZE < dataset.length) {
        await new Promise((resolve) => setTimeout(resolve, 500)); // Reduced delay since we are already waiting on network
      }
    } catch (error) {
      console.error(`\n❌ Error in batch ${batchNum}:`, error);
      throw error;
    }
  }

  console.log(`\n\n✅ Embedding generation complete!`);
  console.log(`💾 Saved ${totalVectorsSaved.toLocaleString()} vectors to: ${outputPath}`);
  console.log(`\n💰 Total cost: $${totalCost.toFixed(4)}`);
  console.log(`📊 Average cost per shloka: $${(totalCost / dataset.length).toFixed(6)}\n`);
}

generateEmbeddings()
  .then(() => {
    console.log('🎉 Success!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
