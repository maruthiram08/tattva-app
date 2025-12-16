# Phase 1: Data Ingestion - Detailed Implementation Plan

## Overview
This document contains every detail of the Phase 1 implementation for the Tattva Ramayana application, including all scripts, prompts, architecture decisions, and issues encountered.

---

## 1. Dataset Information

**Location**: `/Users/maruthi/Desktop/MainDirectory/tattvaapp/Valmiki_Ramayan_Dataset/data/Valmiki_Ramayan_Shlokas.json`

**Size**: 23,402 shlokas

**Data Quality** (from validation):
- Sanskrit text: 100%
- Translations: 84.7% (15.3% missing)
- Explanations: 84.0% (16% missing)
- Comments: 2.6% (97.4% missing)

**JSON Schema**:
```json
{
  "kanda": "Bala Kanda",
  "sarga": 1,
  "shloka": 5,
  "shloka_text": "Sanskrit verse text",
  "transliteration": "Romanized Sanskrit" | null,
  "translation": "Word-by-word English" | null,
  "explanation": "Detailed meaning",
  "comments": "Scholarly notes" | null
}
```

---

## 2. Enhanced Metadata Schema

**Goal**: Add metadata to optimize retrieval for all 45 question categories from PRD

**Enhanced Schema** (what we're adding):
```typescript
interface EnhancedShlokaData {
  // Original fields
  kanda: string;
  sarga: number;
  shloka: number;
  shloka_text: string;
  transliteration: string | null;
  translation: string | null;
  explanation: string;
  comments: string | null;

  // NEW FIELDS
  kanda_number: number;           // 1-7 for filtering
  characters: string[];            // ["rama", "sita", "hanuman"]
  events: string[];                // ["exile_announcement", "sita_abduction"]
  themes: string[];                // ["dharma", "loyalty", "sacrifice"]
  has_translation: boolean;        // Quick check
  has_explanation: boolean;        // Quick check
  has_comments: boolean;           // Quick check
}
```

**Kanda Number Mapping**:
```javascript
{
  'Bala Kanda': 1,
  'Ayodhya Kanda': 2,
  'Aranya Kanda': 3,
  'Kishkindha Kanda': 4,
  'Sundara Kanda': 5,
  'Yuddha Kanda': 6,
  'Uttara Kanda': 7
}
```

---

## 3. Tag Extraction Approaches

### **Approach A: Rule-Based Only (FREE, 1-2 minutes)**

**Character Extraction**: High-precision regex patterns
- File: `/lib/constants/character-patterns.ts`
- 40+ characters covered
- Multiple name variations per character

**Event Extraction**: Keyword matching
- File: `/lib/constants/event-theme-patterns.ts`
- 30+ events with keyword lists
- Example: `sita_abduction: ["abduct", "ravana", "carry away", "kidnap"]`

**Theme Extraction**: Keyword matching
- File: `/lib/constants/event-theme-patterns.ts`
- 25+ themes with keyword lists
- Example: `dharma: ["dharma", "righteousness", "duty", "right"]`

**Pros**: Fast, free, decent quality
**Cons**: May miss nuanced events/themes

---

### **Approach B: Hybrid (LLM + Rule-Based)** ⚠️ SLOW

**Character Extraction**: Rule-based (same as above)

**Event/Theme Extraction**: LLM-based
- Uses Claude 3.5 Haiku (or GPT-4o-mini)
- Extracts from explanation + translation text
- Returns structured JSON

**CRITICAL ISSUE**:
- Makes 23,402 individual LLM API calls (one per shloka)
- Takes 6-13 hours to complete
- Not worth the wait for marginal quality improvement

**Current Implementation**: See section 5 for scripts

---

## 4. File Structure

```
tattvaapp/
├── .env.local                          # Environment variables (NEVER commit)
├── .env.example                        # Template for env vars
├── package.json                        # Dependencies + npm scripts
├── tsconfig.json                       # TypeScript config
├── lib/
│   ├── constants/
│   │   ├── character-patterns.ts       # 40+ character regex patterns
│   │   └── event-theme-patterns.ts     # Event/theme keyword patterns
│   └── pinecone/
│       └── client.ts                   # Pinecone client helper
├── scripts/
│   ├── validate-data.ts                # Step 1: Validate dataset
│   ├── extract-tags.ts                 # Step 2: Extract metadata tags
│   ├── generate-embeddings.ts          # Step 3: Create vector embeddings
│   ├── cleanup-pinecone.ts             # Step 4: Delete existing index
│   ├── upload-to-pinecone.ts           # Step 5: Upload vectors
│   ├── enhanced-shlokas.json           # Output of extract-tags
│   ├── vectors.json                    # Output of generate-embeddings
│   └── validation-report.json          # Output of validate-data
└── Valmiki_Ramayan_Dataset/
    └── data/
        └── Valmiki_Ramayan_Shlokas.json
```

---

## 5. Scripts - Complete Implementation

### **Script 1: validate-data.ts**

**Purpose**: Validate dataset quality before processing

**File**: `/scripts/validate-data.ts`

**Complete Code**:
```typescript
import * as fs from 'fs';
import * as path from 'path';

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

interface ValidationReport {
  total_shlokas: number;
  kandas: Record<string, number>;
  translation_coverage: number;
  explanation_coverage: number;
  comments_coverage: number;
  translation_by_kanda: Record<string, number>;
  explanation_by_kanda: Record<string, number>;
  comments_by_kanda: Record<string, number>;
}

async function validateData(): Promise<void> {
  console.log('🔍 Starting data validation...\n');

  const dataPath = path.join(
    __dirname,
    '..',
    'Valmiki_Ramayan_Dataset',
    'data',
    'Valmiki_Ramayan_Shlokas.json'
  );

  const rawData = fs.readFileSync(dataPath, 'utf-8');
  const dataset: ShlokaData[] = JSON.parse(rawData);

  console.log(`📚 Total shlokas: ${dataset.length.toLocaleString()}\n`);

  // Count by kanda
  const kandaCounts: Record<string, number> = {};
  const translationByKanda: Record<string, { has: number; total: number }> = {};
  const explanationByKanda: Record<string, { has: number; total: number }> = {};
  const commentsByKanda: Record<string, { has: number; total: number }> = {};

  let totalTranslations = 0;
  let totalExplanations = 0;
  let totalComments = 0;

  for (const shloka of dataset) {
    kandaCounts[shloka.kanda] = (kandaCounts[shloka.kanda] || 0) + 1;

    if (!translationByKanda[shloka.kanda]) {
      translationByKanda[shloka.kanda] = { has: 0, total: 0 };
      explanationByKanda[shloka.kanda] = { has: 0, total: 0 };
      commentsByKanda[shloka.kanda] = { has: 0, total: 0 };
    }

    translationByKanda[shloka.kanda].total++;
    explanationByKanda[shloka.kanda].total++;
    commentsByKanda[shloka.kanda].total++;

    if (shloka.translation) {
      totalTranslations++;
      translationByKanda[shloka.kanda].has++;
    }
    if (shloka.explanation) {
      totalExplanations++;
      explanationByKanda[shloka.kanda].has++;
    }
    if (shloka.comments) {
      totalComments++;
      commentsByKanda[shloka.kanda].has++;
    }
  }

  console.log('📊 Shlokas by Kanda:');
  for (const [kanda, count] of Object.entries(kandaCounts)) {
    console.log(`   ${kanda}: ${count.toLocaleString()}`);
  }

  const translationPct = (totalTranslations / dataset.length) * 100;
  const explanationPct = (totalExplanations / dataset.length) * 100;
  const commentsPct = (totalComments / dataset.length) * 100;

  console.log('\n📈 Data Completeness:');
  console.log(`   Translations: ${translationPct.toFixed(1)}%`);
  console.log(`   Explanations: ${explanationPct.toFixed(1)}%`);
  console.log(`   Comments: ${commentsPct.toFixed(1)}%`);

  console.log('\n📋 Translation Coverage by Kanda:');
  for (const [kanda, stats] of Object.entries(translationByKanda)) {
    const pct = (stats.has / stats.total) * 100;
    console.log(`   ${kanda}: ${pct.toFixed(1)}% (${stats.has}/${stats.total})`);
  }

  console.log('\n📋 Explanation Coverage by Kanda:');
  for (const [kanda, stats] of Object.entries(explanationByKanda)) {
    const pct = (stats.has / stats.total) * 100;
    console.log(`   ${kanda}: ${pct.toFixed(1)}% (${stats.has}/${stats.total})`);
  }

  // Save report
  const report: ValidationReport = {
    total_shlokas: dataset.length,
    kandas: kandaCounts,
    translation_coverage: translationPct,
    explanation_coverage: explanationPct,
    comments_coverage: commentsPct,
    translation_by_kanda: Object.fromEntries(
      Object.entries(translationByKanda).map(([k, v]) => [k, (v.has / v.total) * 100])
    ),
    explanation_by_kanda: Object.fromEntries(
      Object.entries(explanationByKanda).map(([k, v]) => [k, (v.has / v.total) * 100])
    ),
    comments_by_kanda: Object.fromEntries(
      Object.entries(commentsByKanda).map(([k, v]) => [k, (v.has / v.total) * 100])
    ),
  };

  const reportPath = path.join(__dirname, 'validation-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log(`\n✅ Validation complete! Report saved to: ${reportPath}\n`);
}

validateData()
  .then(() => {
    console.log('🎉 Success!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
```

**Run**: `npm run validate-data`

**Output**: `scripts/validation-report.json`

---

### **Script 2: extract-tags.ts** (Rule-Based Version)

**Purpose**: Extract character, event, and theme tags using regex/keywords

**File**: `/scripts/extract-tags.ts`

**Dependencies**:
- `/lib/constants/character-patterns.ts`
- `/lib/constants/event-theme-patterns.ts`

**Complete Code** (Rule-Based Version):
```typescript
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

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

// Kanda name to number mapping
const KANDA_MAP: Record<string, number> = {
  'Bala Kanda': 1,
  'Ayodhya Kanda': 2,
  'Aranya Kanda': 3,
  'Kishkindha Kanda': 4,
  'Sundara Kanda': 5,
  'Yuddha Kanda': 6,
  'Uttara Kanda': 7,
};

async function extractTags(): Promise<void> {
  console.log('🏷️  Starting tag extraction (Rule-based only)...\n');

  // Load dataset
  const dataPath = path.join(
    __dirname,
    '..',
    'Valmiki_Ramayan_Dataset',
    'data',
    'Valmiki_Ramayan_Shlokas.json'
  );

  const rawData = fs.readFileSync(dataPath, 'utf-8');
  const dataset: ShlokaData[] = JSON.parse(rawData);

  console.log(`📚 Loaded ${dataset.length} shlokas\n`);

  const enhancedDataset: EnhancedShlokaData[] = [];

  for (let i = 0; i < dataset.length; i++) {
    const shloka = dataset[i];
    const combinedText = `${shloka.explanation || ''} ${shloka.translation || ''}`;

    // Extract tags using rule-based patterns
    const characters = extractCharacters(combinedText);
    const events = extractEventKeywords(combinedText);
    const themes = extractThemeKeywords(combinedText);

    enhancedDataset.push({
      ...shloka,
      kanda_number: KANDA_MAP[shloka.kanda] || 0,
      characters,
      events,
      themes,
      has_translation: !!shloka.translation,
      has_explanation: !!shloka.explanation,
      has_comments: !!shloka.comments,
    });

    // Show progress every 1000 shlokas
    if ((i + 1) % 1000 === 0) {
      const progress = ((i + 1) / dataset.length) * 100;
      console.log(`Progress: ${progress.toFixed(1)}% (${i + 1}/${dataset.length})`);
    }
  }

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

extractTags()
  .then(() => {
    console.log('\n🎉 Success!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
```

**Run**: `npm run extract-tags:no-llm`

**Time**: 1-2 minutes

**Output**: `scripts/enhanced-shlokas.json`

---

### **Script 3: character-patterns.ts**

**Purpose**: Define regex patterns for character extraction

**File**: `/lib/constants/character-patterns.ts`

**Complete Code**:
```typescript
/**
 * Character name patterns for extraction
 * Covers main characters, royal family, sages, demons, vanaras, and deities
 */

export const CHARACTER_PATTERNS: Record<string, RegExp[]> = {
  // Main Characters
  rama: [
    /\b(rama|rāma|श्रीराम|राम)\b/gi,
    /\b(rāghava|raghava|राघव)\b/gi,
    /\b(dasharatha.*son|dasaratha.*son)\b/gi,
  ],

  sita: [
    /\b(sita|sītā|सीता)\b/gi,
    /\b(vaidehi|vaidehī|वैदेही)\b/gi,
    /\b(janaki|jānakī|जानकी)\b/gi,
    /\b(maithili|maithilī)\b/gi,
  ],

  lakshmana: [
    /\b(lakshmana|lakṣmaṇa|laxman|लक्ष्मण)\b/gi,
    /\b(lakshmanan|laxmanan)\b/gi,
    /\b(saumitri)\b/gi,
  ],

  hanuman: [
    /\b(hanuman|hanumān|हनुमान)\b/gi,
    /\b(anjaneya|āñjaneya)\b/gi,
    /\b(maruti|māruti)\b/gi,
    /\b(pavanputra|pavana.*son)\b/gi,
  ],

  ravana: [
    /\b(ravana|rāvaṇa|रावण)\b/gi,
    /\b(lankesha|laṅkeśa)\b/gi,
    /\b(dashagriva|daśagrīva)\b/gi,
    /\b(ten.*head)\b/gi,
  ],

  // Royal Family - Ayodhya
  dasharatha: [
    /\b(dasharatha|daśaratha|dasaratha|दशरथ)\b/gi,
  ],

  bharata: [
    /\b(bharata|bharatha|भरत)\b/gi,
  ],

  shatrughna: [
    /\b(shatrughna|śatrughna|satrughna)\b/gi,
  ],

  kausalya: [
    /\b(kausalya|kaushalya|kauśalyā)\b/gi,
  ],

  kaikeyi: [
    /\b(kaikeyi|kaikeyī|kaikai)\b/gi,
  ],

  sumitra: [
    /\b(sumitra|sumitrā)\b/gi,
  ],

  // Sages & Rishis
  vishwamitra: [
    /\b(vishwamitra|viśvāmitra|vishvamitra)\b/gi,
  ],

  vasishtha: [
    /\b(vasishtha|vasiṣṭha|vasistha)\b/gi,
  ],

  valmiki: [
    /\b(valmiki|vālmīki)\b/gi,
  ],

  agastya: [
    /\b(agastya|agastī)\b/gi,
  ],

  // Vanaras
  sugriva: [
    /\b(sugriva|sugrīva)\b/gi,
  ],

  vali: [
    /\b(vali|vāli|vaali|bali)\b/gi,
  ],

  angada: [
    /\b(angada|aṅgada)\b/gi,
  ],

  jambavan: [
    /\b(jambavan|jāmbavān|jambavant)\b/gi,
  ],

  // Demons
  surpanakha: [
    /\b(surpanakha|śūrpaṇakhā)\b/gi,
  ],

  khara: [
    /\b(khara)\b/gi,
  ],

  dushana: [
    /\b(dushana|dūṣaṇa)\b/gi,
  ],

  maricha: [
    /\b(maricha|mārīca|mareecha)\b/gi,
  ],

  kumbhakarna: [
    /\b(kumbhakarna|kumbhakarṇa)\b/gi,
  ],

  vibhishana: [
    /\b(vibhishana|vibhīṣaṇa|vibheeshana)\b/gi,
  ],

  indrajit: [
    /\b(indrajit|indrajīt|meghanada|meghanaada)\b/gi,
  ],

  // Deities
  brahma: [
    /\b(brahma|brahmā)\b/gi,
  ],

  vishnu: [
    /\b(vishnu|viṣṇu)\b/gi,
  ],

  shiva: [
    /\b(shiva|śiva)\b/gi,
  ],

  indra: [
    /\b(indra)\b/gi,
  ],

  // Other Important Characters
  jatayu: [
    /\b(jatayu|jaṭāyu)\b/gi,
  ],

  shabari: [
    /\b(shabari|śabarī|sabari)\b/gi,
  ],

  tara: [
    /\b(tara|tārā)\b/gi,
  ],

  mandodari: [
    /\b(mandodari|mandodarī)\b/gi,
  ],
};

/**
 * Extract character names from text using pattern matching
 */
export function extractCharacters(text: string): string[] {
  const foundCharacters = new Set<string>();

  for (const [character, patterns] of Object.entries(CHARACTER_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        foundCharacters.add(character);
        break; // Found this character, move to next
      }
    }
  }

  return Array.from(foundCharacters);
}
```

---

### **Script 4: event-theme-patterns.ts**

**Purpose**: Define keyword patterns for event and theme extraction

**File**: `/lib/constants/event-theme-patterns.ts`

**Complete Code**:
```typescript
/**
 * Event and theme keyword patterns for extraction
 * Used for rule-based semantic tagging
 */

export const EVENT_KEYWORDS: Record<string, string[]> = {
  // Birth & Childhood
  rama_birth: ['birth of rama', 'born', 'incarnation'],
  bow_breaking: ['bow', 'break', 'shiva', 'janaka'],

  // Ayodhya Kanda Events
  coronation_announcement: ['coronation', 'crown', 'king', 'successor'],
  exile_announcement: ['exile', 'forest', 'fourteen years', 'vanavasa'],
  rama_departure: ['depart', 'leave', 'farewell', 'ayodhya'],
  dasharatha_death: ['death of dasharatha', 'died', 'passed away'],
  bharata_return: ['bharata return', 'back to ayodhya'],
  paduka_rule: ['sandal', 'paduka', 'regent'],

  // Aranya Kanda Events
  meeting_rishis: ['rishi', 'sage', 'hermitage', 'ashram'],
  surpanakha_encounter: ['surpanakha', 'disfigure', 'nose'],
  khara_dushana_battle: ['khara', 'dushana', 'fourteen thousand'],
  golden_deer: ['golden deer', 'maricha', 'deer'],
  sita_abduction: ['abduct', 'ravana', 'carry away', 'kidnap'],
  jatayu_fight: ['jatayu', 'vulture', 'fight'],

  // Kishkindha Kanda Events
  meeting_hanuman: ['meet hanuman', 'first meet', 'rishyamukha'],
  sugriva_friendship: ['friendship', 'pact', 'alliance', 'sugriva'],
  vali_sugriva_story: ['vali', 'sugriva', 'brothers', 'conflict'],
  vali_vadha: ['kill vali', 'death of vali', 'arrow'],
  vanara_dispatch: ['search', 'dispatch', 'directions', 'sita'],

  // Sundara Kanda Events
  ocean_crossing: ['ocean', 'leap', 'jump', 'lanka'],
  sita_discovery: ['find sita', 'discover', 'ashoka grove'],
  lanka_burning: ['burn lanka', 'fire', 'tail'],

  // Yuddha Kanda Events
  bridge_construction: ['bridge', 'setubandha', 'ocean'],
  ravana_council: ['council', 'court', 'advisors'],
  vibhishana_surrender: ['vibhishana', 'surrender', 'join rama'],
  war_beginning: ['war start', 'battle begin'],
  kumbhakarna_death: ['kumbhakarna die', 'giant'],
  indrajit_maya: ['indrajit', 'illusion', 'maya'],
  rama_lakshmana_arrows: ['arrow bind', 'serpent'],
  ravana_death: ['ravana die', 'kill ravana', 'final battle'],
  agni_pariksha: ['fire test', 'agni', 'purity'],
  sita_vindication: ['vindication', 'proof', 'purity'],

  // Uttara Kanda Events
  coronation: ['coronation', 'crown', 'king'],
  sita_exile: ['exile sita', 'pregnant', 'banish'],
  lava_kusha_birth: ['lava', 'kusha', 'twins', 'born'],
  ashwamedha: ['horse sacrifice', 'ashwamedha'],
};

export const THEME_KEYWORDS: Record<string, string[]> = {
  // Core Values
  dharma: ['dharma', 'righteousness', 'duty', 'right', 'proper'],

  // Relationships
  duty_vs_emotion: ['duty', 'emotion', 'love', 'sorrow', 'grief'],
  loyalty: ['loyal', 'devotion', 'faithful', 'dedicated'],
  brotherhood: ['brother', 'fraternal', 'sibling'],
  devotion: ['devotion', 'bhakti', 'worship', 'reverence'],

  // Actions & Virtues
  sacrifice: ['sacrifice', 'renounce', 'give up', 'abandon'],
  courage: ['courage', 'brave', 'valiant', 'fearless'],
  obedience: ['obey', 'command', 'follow', 'instruction'],
  honor: ['honor', 'respect', 'dignity', 'esteem'],
  wisdom: ['wisdom', 'wise', 'counsel', 'advice'],

  // Conflicts
  good_vs_evil: ['good', 'evil', 'righteous', 'wicked'],
  temptation: ['tempt', 'desire', 'lust', 'greed'],
  deception: ['deceit', 'trick', 'illusion', 'maya'],
  revenge: ['revenge', 'vengeance', 'retribution'],

  // Emotions
  grief: ['grief', 'sorrow', 'lament', 'mourn'],
  joy: ['joy', 'happiness', 'delight', 'celebrate'],
  anger: ['anger', 'rage', 'fury', 'wrath'],
  compassion: ['compassion', 'mercy', 'kindness', 'pity'],

  // Spiritual Concepts
  karma: ['karma', 'action', 'deed', 'consequence'],
  destiny: ['fate', 'destiny', 'ordained', 'predetermined'],
  divine_intervention: ['divine', 'god', 'deity', 'bless'],

  // Social/Political
  kingship: ['king', 'rule', 'govern', 'throne'],
  exile: ['exile', 'banish', 'forest', 'hermitage'],
  war: ['war', 'battle', 'fight', 'combat'],
  justice: ['justice', 'fair', 'punishment', 'reward'],
};

/**
 * Extract event keywords from text
 */
export function extractEventKeywords(text: string): string[] {
  const lowerText = text.toLowerCase();
  const foundEvents = new Set<string>();

  for (const [event, keywords] of Object.entries(EVENT_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        foundEvents.add(event);
        break;
      }
    }
  }

  return Array.from(foundEvents);
}

/**
 * Extract theme keywords from text
 */
export function extractThemeKeywords(text: string): string[] {
  const lowerText = text.toLowerCase();
  const foundThemes = new Set<string>();

  for (const [theme, keywords] of Object.entries(THEME_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        foundThemes.add(theme);
        break;
      }
    }
  }

  return Array.from(foundThemes);
}
```

---

### **Script 5: generate-embeddings.ts**

**Purpose**: Generate OpenAI embeddings for all enhanced shlokas

**File**: `/scripts/generate-embeddings.ts`

**Complete Code**:
```typescript
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

  // Prepare vectors
  const vectors: VectorData[] = [];
  const BATCH_SIZE = 100; // OpenAI allows up to 2048 inputs per request
  const EMBEDDING_MODEL = 'text-embedding-3-small'; // 1536 dimensions
  const EMBEDDING_DIMENSIONS = 1536;

  let totalCost = 0;
  const costPerToken = 0.00002 / 1000; // $0.00002 per 1K tokens

  for (let i = 0; i < dataset.length; i += BATCH_SIZE) {
    const batch = dataset.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(dataset.length / BATCH_SIZE);

    console.log(`\n📦 Processing batch ${batchNum}/${totalBatches} (${batch.length} shlokas)...`);

    // Create embedding texts
    const embeddingTexts = batch.map((shloka) => createEmbeddingText(shloka));

    try {
      // Generate embeddings
      const response = await openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: embeddingTexts,
        dimensions: EMBEDDING_DIMENSIONS,
      });

      // Estimate cost
      const tokensUsed = response.usage?.total_tokens || 0;
      const batchCost = tokensUsed * costPerToken;
      totalCost += batchCost;

      console.log(`  Tokens used: ${tokensUsed.toLocaleString()}`);
      console.log(`  Batch cost:  $${batchCost.toFixed(4)}`);

      // Create vector objects
      response.data.forEach((embeddingData, idx) => {
        const shloka = batch[idx];
        const vectorId = `${shloka.kanda.toLowerCase().replace(' ', '-')}-${shloka.sarga}-${shloka.shloka}`;

        vectors.push({
          id: vectorId,
          values: embeddingData.embedding,
          metadata: {
            kanda: shloka.kanda,
            kanda_number: shloka.kanda_number,
            sarga: shloka.sarga,
            shloka: shloka.shloka,
            shloka_text: shloka.shloka_text.substring(0, 1000), // Pinecone metadata limit
            explanation: shloka.explanation?.substring(0, 2000) || '',
            translation: shloka.translation?.substring(0, 1000) || null,
            comments: shloka.comments?.substring(0, 1000) || null,
            has_translation: shloka.has_translation,
            has_explanation: shloka.has_explanation,
            has_comments: shloka.has_comments,
            characters: shloka.characters,
            events: shloka.events,
            themes: shloka.themes,
          },
        });
      });

      const progress = ((i + batch.length) / dataset.length) * 100;
      console.log(`  Progress: ${progress.toFixed(1)}%`);
      console.log(`  Total cost so far: $${totalCost.toFixed(4)}`);

      // Rate limiting (avoid hitting OpenAI rate limits)
      if (i + BATCH_SIZE < dataset.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000)); // 1s delay
      }
    } catch (error) {
      console.error(`\n❌ Error in batch ${batchNum}:`, error);
      throw error;
    }
  }

  // Save vectors to file
  const outputPath = path.join(__dirname, 'vectors.json');
  fs.writeFileSync(outputPath, JSON.stringify(vectors, null, 2));

  console.log(`\n\n✅ Embedding generation complete!`);
  console.log(`💾 Saved ${vectors.length.toLocaleString()} vectors to: ${outputPath}`);
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
```

**Run**: `npm run generate-embeddings`

**Time**: ~5-10 minutes

**Cost**: ~$0.50 (using text-embedding-3-small, 1536 dimensions)

**Output**: `scripts/vectors.json`

---

### **Script 6: cleanup-pinecone.ts**

**Purpose**: Delete existing Pinecone index

**File**: `/scripts/cleanup-pinecone.ts`

**Complete Code**:
```typescript
import * as dotenv from 'dotenv';
import * as path from 'path';
import { getPineconeClient, PINECONE_INDEX_NAME } from '../lib/pinecone/client';

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

async function cleanupPinecone() {
  console.log('🧹 Starting Pinecone cleanup...\n');

  try {
    const pinecone = getPineconeClient();

    // List all indexes
    const indexes = await pinecone.listIndexes();
    console.log(`📋 Found ${indexes.indexes?.length || 0} existing indexes`);

    // Check if our index exists
    const indexExists = indexes.indexes?.some((idx) => idx.name === PINECONE_INDEX_NAME);

    if (indexExists) {
      console.log(`\n🗑️  Deleting index: ${PINECONE_INDEX_NAME}`);
      await pinecone.deleteIndex(PINECONE_INDEX_NAME);
      console.log(`✅ Index "${PINECONE_INDEX_NAME}" deleted successfully`);

      // Wait a bit for deletion to propagate
      console.log('⏳ Waiting 10 seconds for deletion to propagate...');
      await new Promise((resolve) => setTimeout(resolve, 10000));
    } else {
      console.log(`\n ℹ️  Index "${PINECONE_INDEX_NAME}" does not exist - nothing to clean`);
    }

    console.log('\n✅ Cleanup complete! Ready for fresh ingestion.');
  } catch (error) {
    console.error('\n❌ Cleanup failed:', error);
    throw error;
  }
}

// Run cleanup
cleanupPinecone()
  .then(() => {
    console.log('\n🎉 Pinecone is clean and ready!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
```

**Run**: `npm run cleanup-pinecone`

**Time**: ~15 seconds

---

### **Script 7: upload-to-pinecone.ts**

**Purpose**: Create Pinecone index and upload all vectors

**File**: `/scripts/upload-to-pinecone.ts`

**Complete Code**:
```typescript
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import {
  getPineconeClient,
  PINECONE_INDEX_NAME,
  EMBEDDING_DIMENSION,
} from '../lib/pinecone/client';

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

interface VectorData {
  id: string;
  values: number[];
  metadata: Record<string, any>;
}

async function uploadToPinecone(): Promise<void> {
  console.log('📤 Starting Pinecone upload...\n');

  // Initialize Pinecone client
  const pinecone = getPineconeClient();
  console.log('✅ Pinecone client initialized\n');

  // Load vectors
  const vectorsPath = path.join(__dirname, 'vectors.json');

  if (!fs.existsSync(vectorsPath)) {
    throw new Error(`Vectors not found at ${vectorsPath}. Run generate-embeddings.ts first!`);
  }

  const rawData = fs.readFileSync(vectorsPath, 'utf-8');
  const vectors: VectorData[] = JSON.parse(rawData);

  console.log(`📚 Loaded ${vectors.length.toLocaleString()} vectors\n`);

  // Check if index exists
  const indexes = await pinecone.listIndexes();
  const indexExists = indexes.indexes?.some((idx) => idx.name === PINECONE_INDEX_NAME);

  if (!indexExists) {
    console.log(`🔨 Creating new index: ${PINECONE_INDEX_NAME}`);
    console.log(`   Dimensions: ${EMBEDDING_DIMENSION}`);
    console.log(`   Metric: cosine`);
    console.log(`   Spec: serverless (free tier)\n`);

    await pinecone.createIndex({
      name: PINECONE_INDEX_NAME,
      dimension: EMBEDDING_DIMENSION,
      metric: 'cosine',
      spec: {
        serverless: {
          cloud: 'aws',
          region: 'us-east-1',
        },
      },
    });

    console.log('✅ Index created successfully');
    console.log('⏳ Waiting 60 seconds for index to initialize...\n');
    await new Promise((resolve) => setTimeout(resolve, 60000));
  } else {
    console.log(`ℹ️  Index "${PINECONE_INDEX_NAME}" already exists\n`);
  }

  // Get index
  const index = pinecone.index(PINECONE_INDEX_NAME);

  // Upload in batches
  const BATCH_SIZE = 100; // Pinecone recommends 100-200 vectors per batch

  for (let i = 0; i < vectors.length; i += BATCH_SIZE) {
    const batch = vectors.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(vectors.length / BATCH_SIZE);

    console.log(`📦 Uploading batch ${batchNum}/${totalBatches} (${batch.length} vectors)...`);

    try {
      await index.upsert(batch);

      const progress = ((i + batch.length) / vectors.length) * 100;
      console.log(`   Progress: ${progress.toFixed(1)}%\n`);

      // Rate limiting
      if (i + BATCH_SIZE < vectors.length) {
        await new Promise((resolve) => setTimeout(resolve, 500)); // 500ms delay
      }
    } catch (error) {
      console.error(`\n❌ Error uploading batch ${batchNum}:`, error);
      throw error;
    }
  }

  // Verify upload
  console.log('\n🔍 Verifying upload...');
  const stats = await index.describeIndexStats();
  console.log(`\n📊 Index Statistics:`);
  console.log(`   Total vectors: ${stats.totalRecordCount?.toLocaleString()}`);
  console.log(`   Dimension: ${stats.dimension}`);
  console.log(`   Index fullness: ${((stats.indexFullness || 0) * 100).toFixed(2)}%`);

  if (stats.totalRecordCount !== vectors.length) {
    console.log(`\n⚠️  Warning: Expected ${vectors.length} vectors, but index has ${stats.totalRecordCount}`);
  } else {
    console.log('\n✅ All vectors uploaded successfully!');
  }
}

uploadToPinecone()
  .then(() => {
    console.log('\n🎉 Upload complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
```

**Run**: `npm run upload-pinecone`

**Time**: ~5-10 minutes

---

### **Script 8: Pinecone Client Helper**

**Purpose**: Reusable Pinecone client initialization

**File**: `/lib/pinecone/client.ts`

**Complete Code**:
```typescript
import { Pinecone } from '@pinecone-database/pinecone';

export const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME || 'tattva-shlokas';
export const EMBEDDING_DIMENSION = 1536; // text-embedding-3-small

export function getPineconeClient(): Pinecone {
  const apiKey = process.env.PINECONE_API_KEY;

  if (!apiKey) {
    throw new Error('PINECONE_API_KEY not set in environment variables');
  }

  return new Pinecone({ apiKey });
}
```

---

## 6. Environment Variables

**File**: `.env.local` (NEVER commit this file!)

**Template** (`.env.example`):
```env
# OpenAI
OPENAI_API_KEY=sk-proj-...

# Anthropic (Claude)
ANTHROPIC_API_KEY=sk-ant-...

# Pinecone
PINECONE_API_KEY=...
PINECONE_INDEX_NAME=tattva-shlokas
```

---

## 7. NPM Scripts

**File**: `package.json`

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",

    "validate-data": "tsx scripts/validate-data.ts",
    "cleanup-pinecone": "tsx scripts/cleanup-pinecone.ts",
    "extract-tags": "tsx scripts/extract-tags.ts",
    "extract-tags:no-llm": "tsx scripts/extract-tags.ts --no-llm",
    "generate-embeddings": "tsx scripts/generate-embeddings.ts",
    "upload-pinecone": "tsx scripts/upload-to-pinecone.ts",

    "phase1:full": "npm run validate-data && npm run extract-tags:no-llm && npm run generate-embeddings && npm run cleanup-pinecone && npm run upload-pinecone"
  }
}
```

---

## 8. Dependencies

**File**: `package.json`

```json
{
  "dependencies": {
    "@anthropic-ai/sdk": "^0.32.0",
    "@pinecone-database/pinecone": "^3.0.0",
    "dotenv": "^16.4.7",
    "next": "15.1.3",
    "openai": "^4.75.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "@types/node": "^22",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "15.1.3",
    "tsx": "^4.19.2",
    "typescript": "^5"
  }
}
```

**Install**: `npm install`

---

## 9. Execution Steps (Rule-Based - RECOMMENDED)

### **Step 1: Validate Dataset**
```bash
npm run validate-data
```
- **Time**: 5 seconds
- **Output**: `scripts/validation-report.json`
- **Purpose**: Verify data quality

### **Step 2: Extract Tags (Rule-Based)**
```bash
npm run extract-tags:no-llm
```
- **Time**: 1-2 minutes
- **Cost**: FREE
- **Output**: `scripts/enhanced-shlokas.json`
- **Purpose**: Add character/event/theme tags

### **Step 3: Generate Embeddings**
```bash
npm run generate-embeddings
```
- **Time**: 5-10 minutes
- **Cost**: ~$0.50
- **Output**: `scripts/vectors.json`
- **Purpose**: Create OpenAI embeddings

### **Step 4: Clear Pinecone**
```bash
npm run cleanup-pinecone
```
- **Time**: 15 seconds
- **Purpose**: Delete existing index

### **Step 5: Upload to Pinecone**
```bash
npm run upload-pinecone
```
- **Time**: 5-10 minutes
- **Purpose**: Create index and upload vectors

### **Total Time**: ~15-20 minutes
### **Total Cost**: ~$0.50

---

## 10. LLM Prompts (If Using Hybrid Approach)

### **Claude 3.5 Haiku Prompt** (used in hybrid version)

**System Prompt**:
```
You are a Ramayana scholar extracting tags from shloka explanations.
Extract:
1. Events: Specific happenings (e.g., "exile_announcement", "sita_abduction", "bow_breaking")
2. Themes: Abstract concepts (e.g., "dharma", "loyalty", "sacrifice", "duty_vs_emotion")

Return ONLY valid JSON with lowercase_underscore format. Be concise.
```

**User Prompt**:
```
Explanation: {explanation text, limited to 500 chars}
Translation: {translation text if available}
```

**Expected Response**:
```json
{
  "events": ["exile_announcement", "grief"],
  "themes": ["duty_vs_emotion", "sacrifice", "loyalty"]
}
```

**Model**: `claude-3-5-haiku-20241022`
**Parameters**:
- `temperature`: 0.3
- `max_tokens`: 150

---

### **GPT-4o-mini Prompt** (alternative, also slow)

**System Prompt**: Same as Claude

**User Prompt**: Same as Claude

**Model**: `gpt-4o-mini`
**Parameters**:
- `temperature`: 0.3
- `max_tokens`: 150
- `response_format`: `{ type: 'json_object' }`

---

## 11. Issues Encountered & Solutions

### **Issue 1: OpenAI API Connection Errors**
- **Error**: `APIConnectionError: ENOTFOUND api.openai.com`
- **Cause**: Network/DNS issue when script started
- **Solution**: Restarted script when network was stable

### **Issue 2: Environment Variables Not Loading**
- **Error**: `OPENAI_API_KEY not set`
- **Cause**: Using `import 'dotenv/config'` instead of explicit path
- **Solution**: Changed to `dotenv.config({ path: path.join(__dirname, '..', '.env.local') })`

### **Issue 3: LLM Tag Extraction Too Slow**
- **Problem**: 23,402 individual API calls taking 6-13 hours
- **Root Cause**: Script makes one API call per shloka instead of batching
- **Attempted Fix**: Switched from OpenAI to Claude (no improvement)
- **Recommendation**: Use rule-based extraction instead (1-2 minutes, FREE)

### **Issue 4: Rate Limiting**
- **Problem**: Could hit OpenAI rate limits
- **Solution**: Added 1-second delay between batches in `generate-embeddings.ts`

---

## 12. Optimization Opportunities

### **For Tag Extraction (if you want LLM quality)**

**Current Problem**: 23,402 individual API calls

**Solution**: Batch processing
- Instead of 1 shloka per call, send 10-50 shlokas per call
- Modify prompt to handle array input/output
- Example:
```json
Input:
[
  {"id": "bala-1-1", "explanation": "...", "translation": "..."},
  {"id": "bala-1-2", "explanation": "...", "translation": "..."},
  ...
]

Output:
[
  {"id": "bala-1-1", "events": [...], "themes": [...]},
  {"id": "bala-1-2", "events": [...], "themes": [...]},
  ...
]
```

**Expected Speedup**: 10-50x faster (10-60 minutes instead of 6-13 hours)
**Cost**: Still ~$0.50-1.00 (same quality, much faster)

---

### **Alternative Approach: Parallel Processing**

Use multiple concurrent API calls:
```typescript
const CONCURRENT_CALLS = 10; // Process 10 batches at once
const promises = [];

for (let i = 0; i < CONCURRENT_CALLS; i++) {
  promises.push(processBatch(batches[i]));
}

await Promise.all(promises);
```

**Expected Speedup**: 10x faster if rate limits allow

---

## 13. Recommended Workflow

### **Option A: Rule-Based (Fast & Free)** ✅ RECOMMENDED
1. `npm run validate-data` (5s)
2. `npm run extract-tags:no-llm` (1-2 min)
3. `npm run generate-embeddings` (5-10 min)
4. `npm run cleanup-pinecone` (15s)
5. `npm run upload-pinecone` (5-10 min)

**Total**: 15-20 minutes, $0.50

---

### **Option B: Hybrid with Batch Processing** (Better Quality)
1. Modify `extract-tags.ts` to batch API calls (10-50 shlokas per call)
2. Run modified script
3. Continue with steps 3-5 from Option A

**Total**: 30-60 minutes, $1.00-1.50

---

## 14. Next Steps After Phase 1

Once vectors are uploaded to Pinecone:

1. **Test retrieval**: Query Pinecone with sample questions
2. **Phase 2**: Implement category routing & template engine
3. **Phase 3**: Build retrieval pipeline with metadata filters
4. **Phase 4**: Create answer assembly engine

---

## 15. Contact & Files

**Project Location**: `/Users/maruthi/Desktop/MainDirectory/tattvaapp`

**Key Files to Share**:
- This document: `projectdocs/PHASE1_DETAILED_PLAN.md`
- PRD: `projectdocs/PRD.md`
- Prompt: `projectdocs/prompt.md`
- Implementation Plan: `projectdocs/IMPLEMENTATION_PLAN.md`

**All Scripts Available**: `/scripts/` folder

---

## 16. Summary

**What Works**:
- ✅ Rule-based tag extraction (1-2 min, FREE, good quality)
- ✅ Embedding generation (5-10 min, $0.50)
- ✅ Pinecone upload (5-10 min)

**What Doesn't Work**:
- ❌ Current LLM tag extraction (6-13 hours - too slow)

**What Needs Fixing**:
- Batch LLM API calls (10-50 shlokas per call)
- Add parallel processing for concurrent API calls

**Recommended Path Forward**:
Use rule-based extraction for now, optimize LLM approach later if needed.

---

**Document Created**: 2025-12-15
**Author**: Claude (Anthropic)
**Status**: Complete & Ready for Handoff
