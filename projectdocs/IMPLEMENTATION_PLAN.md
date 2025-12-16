# Tattva Application - Implementation Plan

## Project Overview

**Goal**: Build a trustworthy Ramayana interpreter that answers ONLY text-grounded questions using Valmiki's Ramayana with explicit citations and clear limits.

**Current State**: Greenfield project - only documentation and dataset exist
- PRD defines 45 question categories, 3 answer templates (T1/T2/T3)
- Dataset: 23,402 shlokas in JSON format with kanda/sarga/shloka hierarchy
- Data completeness: 100% Sanskrit text, 84.7% translations, 84.0% explanations, 2.6% comments

**Technical Requirements**:
- Deployment: Vercel (serverless)
- Database: Pinecone (vector database)
- Responsive: Desktop, tablet, mobile
- Core constraint: NO hallucination - all answers must be text-grounded

---

## Tech Stack

### Frontend
- **Next.js 14+** (App Router) - Native Vercel deployment, SSR/SSG, API routes
- **TypeScript** - Type safety for template enforcement and citation tracking
- **Tailwind CSS + shadcn/ui** - Responsive design, accessible components
- **React Hook Form + Zod** - Type-safe input validation

### Backend/API
- **Vercel Serverless Functions** - Next.js API routes for main pipeline
- **Edge Functions** - Low-latency classification for simple rule-based routing
- **Vercel KV (Redis)** - Category routing table, template definitions, caching
- **Vercel Blob Storage** - Original dataset, evaluation logs

### AI/LLM
- **OpenAI GPT-4** - Question classification (structured outputs via JSON mode)
- **Claude 3.5 Sonnet** - Answer assembly (superior instruction-following for template constraints)
- **OpenAI text-embedding-3-large** - 3,072-dim embeddings for Sanskrit+English

### Database
- **Pinecone Serverless** - Single index with 23,402 vectors, metadata filtering for granular retrieval

### Monitoring
- **Sentry** - Error tracking, template violations, hallucination detection
- **Posthog** - Query analytics, category distribution, refusal rates

---

## Architecture Overview

### Three-Step Pipeline: Classification → Retrieval → Assembly

```
User Question
    ↓
[STEP 1: CLASSIFICATION]
- Rule-based pre-filtering (regex patterns, character names)
- LLM classification into 1 of 45 categories
- Lock template type (T1/T2/T3)
- Determine answerability (Answer/Refuse)
    ↓
[STEP 2: RETRIEVAL]
- Query Pinecone based on category + question embedding
- Granularity: shloka-level / sarga-level / kanda-level
- Fetch: explanation (always) + translation (verse-focused) + comments (interpretive)
- Handle missing data gracefully
    ↓
[STEP 3: ASSEMBLY]
- Load locked template definition (T1/T2/T3)
- Fill template sections with retrieved text
- Enforce constraints (T1 cannot use comments, T2 requires "Limit of Certainty")
- Validate citations (all kanda/sarga/shloka must exist in dataset)
- Reject and retry if validation fails
    ↓
Structured Answer Card / Refusal Card
```

### Template Enforcement Strategy

**T1 (Textual)**: Explicit text-grounded answers only
- Sections: Answer, Textual Basis, Explanation
- Prohibited: Speculation, modal verbs ("might", "could"), comments field
- Validation: Regex check for speculative language

**T2 (Interpretive)**: Labeled inference with commentary
- Sections: Answer, What Text States, Traditional Interpretations, Limit of Certainty
- Required: comments field, explicit inference labeling
- Validation: Must include "Limit of Certainty" section

**T3 (Refusal)**: Out-of-scope notice with redirection
- Sections: Out-of-Scope Notice, Why, Alternative Suggestions
- Prohibited: Apologies ("sorry", "unfortunately"), partial answers
- Tone: Calm and confident

### Pinecone Index Structure

**Single Index: `tattva-shlokas`** (23,402 vectors)
- Dimensions: 3,072 (text-embedding-3-large)
- Similarity: Cosine

**Metadata per vector**:
```typescript
{
  id: "bala-1-5",
  values: [...3072-dim embedding],
  metadata: {
    kanda: "Bala Kanda",
    sarga: 1,
    shloka: 5,
    shloka_text: "Sanskrit text",
    explanation: "Detailed meaning",
    translation: "Word-by-word English",
    comments: "Scholarly notes" | null,
    has_translation: true,
    has_explanation: true,
    has_comments: false
  }
}
```

**Query strategy**:
- Epic/Kanda overview: Filter by kanda, retrieve all explanations
- Sarga overview: Filter by kanda + sarga
- Specific shloka: Filter by exact kanda/sarga/shloka
- Character/Episode: Semantic search + filter by relevant sargas

---

## Implementation Phases

### Phase 0: Project Setup (Week 1)

**Tasks**:
1. Initialize Next.js 14 project with TypeScript + Tailwind
2. Set up Vercel project and connect to GitHub
3. Configure environment variables (OpenAI, Anthropic, Pinecone, Vercel KV/Blob)
4. Install dependencies: `@pinecone-database/pinecone`, `openai`, `@anthropic-ai/sdk`, `@vercel/kv`, `@vercel/blob`, `zod`, `react-hook-form`, `shadcn/ui`
5. Set up ESLint, Prettier, Husky (pre-commit hooks)

**Deliverables**:
- Working Next.js app deployed to Vercel
- CI/CD pipeline (auto-deploy on push to main)

**Critical Files**:
- `package.json` - Dependencies
- `next.config.js` - Next.js configuration
- `tsconfig.json` - TypeScript strict mode
- `.env.local` - Environment variables template

---

### Phase 1: Data Ingestion & Vector Database (Week 2)

**Tasks**:
1. **Data validation** - Load JSON, validate schema, flag missing fields
2. **Embedding generation** - Create embeddings for all 23,402 shlokas
   - Combine: `{kanda} - {sarga} - {shloka}\nSanskrit: {shloka_text}\nExplanation: {explanation}\nTranslation: {translation}`
   - Use OpenAI `text-embedding-3-large` (3,072 dimensions)
   - Process in batches of 1,000 to avoid rate limits
   - Estimated cost: ~$5
3. **Pinecone index creation** - Create serverless index with 3,072 dimensions
4. **Upload vectors** - Batch upload (100 at a time) with metadata
5. **Verification queries** - Test retrieval accuracy with sample questions

**Deliverables**:
- Pinecone index populated with 23,402 vectors
- Data quality report (% missing fields per kanda)
- Retrieval test results

**Critical Files**:
- `/scripts/validate-data.ts` - Data validation script
- `/scripts/generate-embeddings.ts` - Embedding generation
- `/scripts/upload-to-pinecone.ts` - Pinecone upload
- `/lib/pinecone-client.ts` - Reusable Pinecone connection helper

---

### Phase 2: Category Routing & Template Engine (Week 3)

**Tasks**:
1. **Seed category table** - Load 45-category routing table into Vercel KV
2. **Seed template definitions** - Store T1/T2/T3 structures in Vercel KV
3. **Classification API** (`/api/classify`) - Hybrid approach:
   - Rule-based pre-filtering (regex for explicit references, character names)
   - LLM classification (GPT-4 with structured JSON output)
   - Return: `{ category_id, template, confidence, reasoning }`
4. **Template validator** - Zod schemas for each template type
   - T1: Check for speculative language, verify citation format
   - T2: Verify "Limit of Certainty" section exists
   - T3: Check for apology language
5. **UI components** - React components for rendering T1/T2/T3 answers

**Deliverables**:
- Classification API with >95% accuracy on test questions
- Template validator catching violations
- UI components for all 3 templates

**Critical Files**:
- `/scripts/seed-categories.ts` - Load category table to KV
- `/app/api/classify/route.ts` - **MOST CRITICAL** - Classification logic
- `/lib/template-validator.ts` - **CRITICAL** - Template enforcement
- `/lib/prompts/classification-prompt.ts` - Few-shot classification prompt
- `/components/answer-card.tsx` - T1/T2 answer display
- `/components/refusal-card.tsx` - T3 refusal display

---

### Phase 3: Retrieval Pipeline (Week 4)

**Tasks**:
1. **Retrieval configuration** - Define retrieval rules for all 45 categories
   - Granularity (shloka/sarga/kanda)
   - Filter criteria (kanda, sarga, has_translation, etc.)
   - Top-K results
   - Required fields (explanation, translation, comments)
2. **Retrieval API** (`/api/retrieve`) - Query Pinecone based on category
   - Generate question embedding
   - Apply category-specific filters
   - Fetch metadata with results
   - Handle missing data (add warnings if translation/explanation unavailable)
3. **Context aggregator** - Merge multiple shloka results into coherent context
4. **Citation formatter** - Convert metadata to human-readable citations

**Deliverables**:
- Retrieval API returning relevant context with citations
- Context aggregation preserving attribution
- Graceful handling of missing data

**Critical Files**:
- `/lib/retrieval-configs.ts` - **CRITICAL** - Retrieval rules for all 45 categories
- `/app/api/retrieve/route.ts` - Retrieval logic
- `/lib/context-aggregator.ts` - Context merging
- `/lib/citation-formatter.ts` - Citation formatting

---

### Phase 4: Answer Assembly Engine (Week 5)

**Tasks**:
1. **Template-specific prompts** - Create system prompts for T1/T2/T3
   - T1: Emphasize no speculation, explicit citations only
   - T2: Separate explicit text from interpretations, require "Limit of Certainty"
   - T3: Calm refusal, no apologies, redirect to allowed questions
2. **Assembly API** (`/api/answer`) - Generate answers using Claude 3.5 Sonnet
   - Load template prompt
   - Pass retrieved context + citations
   - Enforce template structure via Zod validation
   - Retry (max 2x) if validation fails
3. **Hallucination detector** - Validate all citations exist in dataset
   - Extract citations from generated answer
   - Cross-check against retrieved context
   - Reject if fabricated citation detected
4. **Response post-processor** - Format output, add metadata

**Deliverables**:
- Answer assembly API producing valid T1/T2/T3 responses
- Zero fabricated citations (verified via golden questions)
- Retry logic for validation failures

**Critical Files**:
- `/app/api/answer/route.ts` - **CRITICAL** - Answer assembly logic
- `/lib/prompts/t1-textual-prompt.ts` - T1 system prompt
- `/lib/prompts/t2-interpretive-prompt.ts` - T2 system prompt
- `/lib/prompts/t3-refusal-prompt.ts` - T3 system prompt
- `/lib/hallucination-detector.ts` - Citation validation
- `/lib/response-processor.ts` - Output formatting

---

### Phase 5: Frontend UI & UX (Week 6)

**Tasks**:
1. **Landing page** - Hero section, question input, example questions
2. **Question input component** - Validation, character count, loading state
3. **Answer display** - Conditional rendering (T1/T2/T3)
4. **Citation component** - Hover tooltip, click to expand shloka
5. **About & Limits page** - Content from PRD section 10
6. **Responsive design** - Desktop (2-column), tablet, mobile layouts
7. **Error states** - Network errors, rate limiting, invalid questions

**Deliverables**:
- Fully responsive UI (desktop/tablet/mobile)
- Accessible (WCAG AA compliant)
- Fast (Lighthouse score >90)

**Critical Files**:
- `/app/page.tsx` - Landing page
- `/app/about/page.tsx` - About & Limits page
- `/components/question-input.tsx` - Question input
- `/components/answer-display.tsx` - Conditional answer rendering
- `/components/citation.tsx` - Citation display with expand/collapse

---

### Phase 6: Evaluation System (Week 7)

**Tasks**:
1. **Golden questions dataset** - Convert PRD's 30 golden questions to JSON
   - Each question has: expected category, template, answerability, mandatory checks
2. **Evaluation API** (`/api/evaluate`) - Run golden questions through pipeline
   - Check routing accuracy (≥95%)
   - Verify template compliance (100%)
   - Validate answerability decisions (100% for refusals)
   - Check citation accuracy (≥95%)
3. **Automated evaluators** - Category routing, template structure, citations, tone
4. **CI integration** - GitHub Actions workflow
   - Run evaluation on every PR
   - Block merge if score < 95%

**Deliverables**:
- Evaluation suite passing ≥95% on all criteria
- Automated checks in CI/CD
- Evaluation report showing pass/fail per question

**Critical Files**:
- `/data/golden-questions.json` - 30 golden questions from PRD
- `/app/api/evaluate/route.ts` - Evaluation orchestrator
- `/lib/evaluators/routing-evaluator.ts` - Category accuracy check
- `/lib/evaluators/template-evaluator.ts` - Template compliance check
- `/lib/evaluators/citation-evaluator.ts` - Citation validation
- `/.github/workflows/evaluate.yml` - CI evaluation workflow

---

### Phase 7: Integration, Testing & Optimization (Week 8)

**Tasks**:
1. **End-to-end tests** - Playwright tests for critical user flows
2. **Performance optimization**:
   - Cache identical questions (Vercel KV, 1-hour TTL)
   - Parallel classification + embedding generation
   - Code-split components, lazy-load answer cards
   - Target: <3s end-to-end response time
3. **Cost optimization**:
   - Use GPT-3.5-Turbo for simple classifications (escalate to GPT-4 if confidence <0.7)
   - Cache embeddings for common questions
   - Target: <$0.10 per query
4. **Rate limiting** - 10 requests/min per IP, 100/day per IP
5. **Monitoring setup** - Sentry (errors), Posthog (analytics), Vercel Analytics

**Deliverables**:
- E2E test suite covering critical flows
- Response time <3s (95th percentile)
- Cost per query <$0.10
- Rate limiting preventing abuse

**Critical Files**:
- `/tests/e2e/question-flow.spec.ts` - E2E tests
- `/lib/rate-limiter.ts` - Rate limiting logic
- `/lib/cache-manager.ts` - Question caching

---

### Phase 8: Deployment & Launch (Week 9)

**Tasks**:
1. **Production environment** - Create production Vercel project, configure env vars
2. **Security hardening** - Enable WAF, CORS, CSP headers
3. **SEO & metadata** - Add page metadata, robots.txt, sitemap.xml
4. **Final evaluation** - Run golden questions in production, verify ≥95% pass
5. **Launch checklist**:
   - [ ] All 30 golden questions pass
   - [ ] Responsive design tested on all devices
   - [ ] Lighthouse score >90
   - [ ] WCAG AA compliant
   - [ ] No exposed API keys
   - [ ] Monitoring configured
   - [ ] About & Limits page live
6. **Documentation** - User guide, developer docs, deployment guide

**Deliverables**:
- Production deployment live
- All launch checklist items completed
- Documentation published

**Critical Files**:
- `/public/robots.txt` - SEO configuration
- `/public/sitemap.xml` - Site map
- `/app/layout.tsx` - Metadata configuration
- `/docs/USER_GUIDE.md` - User documentation
- `/docs/DEPLOYMENT_GUIDE.md` - Deployment instructions

---

## Critical Design Decisions

### 1. Question Classification: Hybrid (Rule-based + LLM)

**Approach**:
- **Phase 1**: Rule-based pre-filtering (<50ms)
  - Regex for explicit references: "Bala Kanda 1.5" → Category 34
  - Character name extraction: "Who is Rama?" → Category 16
- **Phase 2**: LLM classification (GPT-4 with structured JSON output)
  - Used when rule-based doesn't match
  - Returns: `{ category_id, template, confidence, reasoning }`
  - If confidence <0.7, flag for human review

**Why**: Fast + deterministic for simple patterns, semantic understanding for complex questions

### 2. Hallucination Prevention: Three-Layer Defense

**Layers**:
1. **Template constraints** (structural) - Zod schemas enforce section requirements
2. **Citation validation** (factual) - Cross-check all kanda/sarga/shloka against dataset
3. **LLM instruction** (behavioral) - System prompts emphasize "NEVER speculate"

**Citation validation**:
```typescript
// Extract citations from generated answer
const citations = extractCitations(answer) // "Bala Kanda 1.5", "Ayodhya 20.1-20.5"

// Verify each citation exists in dataset
for (const citation of citations) {
  const exists = dataset.find(s => matches(s, citation))
  if (!exists) throw new HallucinationError("Fabricated citation")
}
```

### 3. Missing Data Handling: Graceful Degradation

**Strategy**:
- 15.3% missing translations: Use explanation only, add disclaimer
- 16% missing explanations: Return partial answer or refusal with caveat
- 97.4% missing comments: Check metadata before interpretive questions, downgrade to T1 if unavailable

**Example**:
```
"Note: Word-by-word translation unavailable for this verse.
Explanation is provided based on scholarly commentary."
```

### 4. Cost Optimization: Caching + Tiered LLMs

**Optimizations**:
- Cache identical questions (1-hour TTL) → 20-30% hit rate
- Use GPT-3.5-Turbo first, escalate to GPT-4 if confidence <0.7 → 70% savings
- Cache embeddings for top 100 common questions
- Use Claude streaming to reduce max_tokens

**Projected cost**: $0.026 per query → optimized to $0.015/query

---

## Critical Files Summary

**Most Critical (Must implement correctly)**:
1. `/app/api/classify/route.ts` - Classification determines all downstream behavior
2. `/lib/template-validator.ts` - Template enforcement prevents hallucination
3. `/app/api/answer/route.ts` - Answer assembly is the heart of RAG pipeline
4. `/scripts/upload-to-pinecone.ts` - Data ingestion must succeed before retrieval works
5. `/lib/retrieval-configs.ts` - Retrieval rules define behavior for all 45 categories

**High Priority**:
6. `/lib/hallucination-detector.ts` - Citation validation ensures trust
7. `/app/api/retrieve/route.ts` - Retrieval accuracy affects answer quality
8. `/data/golden-questions.json` - Evaluation dataset for quality gates
9. `/lib/prompts/t1-textual-prompt.ts` - T1 prompt sets scholarly tone
10. `/components/answer-card.tsx` - UI presentation of answers

---

## Timeline & Milestones

**Total Duration**: 9 weeks (2 months)

**Milestones**:
- Week 2: Pinecone index populated, retrieval working
- Week 4: Full pipeline (classify → retrieve → assemble) functional
- Week 6: UI complete, responsive on all devices
- Week 7: Evaluation suite passing ≥95%
- Week 9: Production launch

**Critical path dependencies**:
- Pinecone ingestion blocks retrieval testing
- Classification blocks answer assembly
- Evaluation suite blocks production deployment

---

## Success Metrics (Post-Launch)

**Technical**:
- Response time: <3s (95th percentile)
- Error rate: <2%
- Evaluation score: ≥95% on golden questions
- Hallucination rate: 0 fabricated citations
- Template compliance: 100%

**Product**:
- Refusal rate: 10-20% (indicates scope discipline)
- Citation click-through: >30% (users verify sources)
- Repeat usage: >40% (users return within 7 days)

**Quality** (manual review):
- Scholarly accuracy: 100% (no factual errors in sample of 100)
- Tone consistency: 95% (neutral, calm, non-preachy)
- User trust: >85% ("Would you trust this answer?")

---

## Next Steps

1. Confirm tech stack and approach with stakeholders
2. Begin Phase 0: Project setup
3. Set up development environment (API keys, Vercel account)
4. Start data validation and embedding generation (Phase 1)
