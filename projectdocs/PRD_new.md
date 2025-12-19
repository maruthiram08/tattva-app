# Tattva - Product Requirements Document (v2.0 - Live Status)

> **Last Updated**: December 18, 2025
> **Status**: Phase 5 Complete (UI/UX Live) | Next: Phase 6 (Evaluation)

## 1. Product Vision
**Tattva is a trustworthy Ramayana interpreter** that answers ONLY text-grounded questions using Valmiki's Ramayana (24,000 verses). It prioritizes accuracy, scholarly citation, and intellectual honesty over generative fluency.

### Core Differentiators
1.  **No Hallucination**: Answers are strictly grounded in retrieved shlokas.
2.  **Explicit Scope**: Knows what it *cannot* answer (modern politics, self-help, dating advice).
3.  **Scholarly Tone**: Distinguishes between explicit text, interpretation, and inference.

---

## 2. Implemented Features (Live State)

### A. Core RAG Pipeline
1.  **Semantic Query Expansion**:
    -   Uses `gpt-4o-mini` to expand user queries (e.g., "Dadhimukha" → "Dadhimukha, the monkey guardian...") before embedding.
    -   Increases retrieval accuracy for specific names/terms.
2.  **Vector Retrieval**:
    -   Pinecone Serverless index (`tattva-shlokas`) with 3,072-dim embeddings.
    -   Granular filtering by Kanda/Sarga/Shloka.
3.  **Intelligent Routing**:
    -   Classifies questions into **45 strict categories** (Story, Character, Dharma, Meaning, Meta).
    -   Routes to locked templates (T1/T2/T3) to enforce safety.

### B. User Experience (Frontend)
1.  **Typewriter Search Interface**:
    -   Animated placeholders ("Who is Hanuman?", "Why was Sita exiled?").
    -   Engaging "Consulting Valmiki's Wisdom..." loading state.
2.  **Voice Search**:
    -   Integrated Web Speech API for seamless voice input.
    -   Visual feedback for listening state.
3.  **Refined Home Page**:
    -   "Curated Threads" for guided discovery (cards with hover effects).
    -   "Daily Wisdom" widget showcasing random shlokas.
    -   "Sri Rama Jayam" footer for cultural resonance.
4.  **Mobile-First Design**:
    -   Optimized navigation with responsive sidebar.
    -   Floating call-to-action buttons.
    -   Adaptive layouts for reading long answers.

### C. Answer Templates (Enforced)
-   **T1 (Textual)**: For factual questions (Answer + Citations + Explanation).
-   **T2 (Interpretive)**: For ambiguous questions (Answer + Interpretations + Limit of Certainty).
-   **T3 (Refusal)**: Polite out-of-scope redirection.

---

## 3. Remaining Roadmap

### Phase 6: Evaluation System (Immediate Priority)
**Goal**: Verify trustworthiness before full public marketing.
-   [ ] **Golden Dataset**: 30 questions covering all edge cases.
-   [ ] **Automated Evaluators**:
    -   Routing Accuracy (Did it go to the right category?)
    -   Citation Verification (Do the cited shlokas exist?)
    -   Template Compliance (Did it follow T1/T2 rules?)

### Phase 7: Optimization & Scale
**Goal**: Production readiness for high traffic.
-   [ ] **End-to-End Testing**: Playwright suite for user flows.
-   [ ] **Caching**: Vercel KV for frequent questions (1hr TTL).
-   [ ] **Rate Limiting**: Protection against abuse.
-   [ ] **Cost Optimization**: Dynamic model selection (GPT-3.5 vs GPT-4).

### Phase 8: Official Launch
-   [ ] **SEO**: Sitemap, Metadata, Structured Data.
-   [ ] **Legal/Meta**: Final "About & Limits" page content.

---

## 4. Technical Stack (Current)

| Component | Technology | Status |
| :--- | :--- | :--- |
| **Frontend** | Next.js 14, Tailwind, Framer Motion | ✅ Live |
| **Database** | Pinecone (Vector), Vercel KV (Redis) | ✅ Live |
| **Classification** | GPT-4o (Structured JSON) | ✅ Live |
| **Retrieval** | OpenAI `text-embedding-3-small` | ✅ Live |
| **Generation** | Claude 3.5 Sonnet | ✅ Live |
| **Hosting** | Vercel Serverless | ✅ Live |

---

## 5. Feature Specifications (Detailed)

### 5.1 Query Expansion Logic
-   **Input**: Raw user query ("Lakshmana line")
-   **Process**: LLM expands to semantic meaning ("Lakshmana Rekha, the protective line drawn for Sita...")
-   **Output**: Richer embedding vector for retrieval.

### 5.2 Floating Question Input
-   **States**:
    -   *Collapsed*: "Ask Tattva..." pill.
    -   *Expanded*: Full width search bar.
    -   *Listening*: Pulsing mic icon.
    -   *Loading*: "Consulting Valmiki..." animation.

### 5.3 Curated Threads
-   Pre-defined entry points for users unfamiliar with the epic.
-   Categories: "Beginner's Guide", "Dharma Dilemmas", "Unsung Heroes".

---

## 6. Access & Constraints
-   **No Hallucination**: The system prefers refusing to answering incorrectly.
-   **No Modern Politics**: Explicitly out of scope.
-   **Valmiki Only**: Does not mix Tulsi/Kamba Ramayana versions.
