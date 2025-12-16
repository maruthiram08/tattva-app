# Phase 1: Data Ingestion & Vector Database Scripts

This directory contains all scripts needed to ingest the Valmiki Ramayana dataset and upload it to Pinecone with enhanced metadata.

## 📋 Scripts Overview

### 1. `validate-data.ts`
Validates the raw dataset and generates statistics.

```bash
npm run validate-data
```

**Output:**
- Prints dataset statistics (total shlokas, distribution by kanda, data completeness)
- Saves validation report to `validation-report.json`

---

### 2. `extract-tags.ts`
Extracts character, event, and theme tags using hybrid approach (rule-based + LLM).

```bash
# Hybrid mode (recommended): Rule-based characters + GPT-4o-mini for events/themes
npm run extract-tags

# Rule-based only mode (FREE but less accurate)
npm run extract-tags:no-llm
```

**Output:**
- Enhanced dataset with tags saved to `enhanced-shlokas.json`
- Cost: ~$2 (hybrid mode) or FREE (rule-based only)

---

### 3. `generate-embeddings.ts`
Generates OpenAI embeddings (text-embedding-3-small, 1536-dim) for all shlokas.

```bash
npm run generate-embeddings
```

**Output:**
- Vectors with metadata saved to `vectors.json`
- Cost: ~$0.50 (for 23,402 shlokas)

---

### 4. `cleanup-pinecone.ts`
Deletes existing Pinecone index to start fresh.

```bash
npm run cleanup-pinecone
```

**Output:**
- Deletes index if it exists
- Waits for deletion to propagate

---

### 5. `upload-to-pinecone.ts`
Creates Pinecone index and uploads all vectors.

```bash
npm run upload-pinecone
```

**Output:**
- Creates serverless index `tattva-shlokas` (1536-dim, cosine metric)
- Uploads all vectors in batches
- Verifies upload completion

---

## 🚀 Full Pipeline

Run all steps in sequence:

```bash
npm run phase1:full
```

This executes:
1. `validate-data` - Check dataset quality
2. `extract-tags` - Add character/event/theme tags (hybrid mode)
3. `generate-embeddings` - Create vector embeddings
4. `cleanup-pinecone` - Delete existing index
5. `upload-pinecone` - Upload fresh data

**Total time:** ~30-45 minutes
**Total cost:** ~$2.50

---

## 📊 Enhanced Metadata Schema

Each vector in Pinecone has this metadata:

```typescript
{
  // Location
  kanda: "Bala Kanda",
  kanda_number: 1,
  sarga: 1,
  shloka: 5,

  // Content
  shloka_text: "sanskrit text...",
  explanation: "detailed explanation...",
  translation: "word-by-word translation..." | null,
  comments: "scholarly notes..." | null,

  // Data availability flags
  has_translation: boolean,
  has_explanation: boolean,
  has_comments: boolean,

  // Enhanced tags (NEW!)
  characters: ["rama", "sita", "lakshmana"],
  events: ["exile_announcement", "dharma_decision"],
  themes: ["dharma", "duty", "sacrifice"]
}
```

---

## 💰 Cost Breakdown

| Step | Service | Cost | Notes |
|------|---------|------|-------|
| Tag Extraction (hybrid) | OpenAI GPT-4o-mini | ~$2.00 | Optional: use `--no-llm` for FREE |
| Embedding Generation | OpenAI text-embedding-3-small | ~$0.50 | One-time cost |
| Pinecone Storage | Pinecone Serverless | FREE | Free tier (100K vectors) |
| **Total** | | **~$2.50** | One-time setup cost |

---

## ⚠️  Prerequisites

Before running scripts, ensure:

1. ✅ Environment variables set in `.env.local`:
   ```env
   OPENAI_API_KEY=sk-...
   PINECONE_API_KEY=...
   PINECONE_INDEX_NAME=tattva-shlokas
   ```

2. ✅ Dataset exists at:
   ```
   Valmiki_Ramayan_Dataset/data/Valmiki_Ramayan_Shlokas.json
   ```

3. ✅ Dependencies installed:
   ```bash
   npm install
   ```

---

## 🐛 Troubleshooting

### "OPENAI_API_KEY not set"
- Check `.env.local` file exists in project root
- Verify API key is valid

### "Enhanced dataset not found"
- Run `npm run extract-tags` before `generate-embeddings`

### "Vectors not found"
- Run `npm run generate-embeddings` before `upload-pinecone`

### Pinecone rate limits
- Scripts include automatic rate limiting
- If errors persist, increase delay in script

### Missing explanations warning
- 16% of shlokas lack explanations (expected)
- These are handled gracefully with fallback to translation

---

## 📈 Success Metrics

After successful Phase 1 completion:

- ✅ 23,402 vectors in Pinecone
- ✅ All vectors have enhanced metadata (characters, events, themes)
- ✅ Index dimension: 1536
- ✅ Similarity metric: cosine
- ✅ Total cost: < $3

---

## 🔄 Re-running Phase 1

To regenerate everything from scratch:

1. Delete existing index:
   ```bash
   npm run cleanup-pinecone
   ```

2. Run full pipeline:
   ```bash
   npm run phase1:full
   ```

Or run individual steps as needed.

---

## 📂 Generated Files

Scripts generate these files in `/scripts`:

- `validation-report.json` - Dataset statistics
- `enhanced-shlokas.json` - Dataset with extracted tags (~150MB)
- `vectors.json` - Embeddings ready for upload (~300MB)

**Note:** These files are .gitignored and can be regenerated anytime.
