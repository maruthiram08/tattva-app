---
Date: 2025-12-18
Version: 2.0 (Live Status)
Author: Tattva Team
Status: Phase 5 Complete (UI/UX Live)
Next Phase: Phase 6 (Evaluation)
---

# Product Requirements Document (Live Status)

This document defines the current state of the Tattva application, detailing implemented features, technical architecture, and the immediate roadmap for evaluation and launch. It serves as the single source of truth for the "Live" system.

## 1. Product Vision

**Tattva** is a trustworthy Ramayana interpreter that answers **ONLY** text-grounded questions using Valmiki's Ramayana. It prioritizes accuracy, scholarly citation, and intellectual honesty over generative fluency.

### Core Principles

-   **No Hallucination**: Answers are strictly grounded in retrieved shlokas.
-   **Explicit Scope**: Clearly defines what it *cannot* answer (e.g., modern politics, self-help).
-   **Scholarly Tone**: Distinguishes between explicit text, traditional interpretation, and inference.

## 2. Implemented Features (Live State)

### Core RAG Pipeline

The backend leverages a hybrid search approach to ensure high-recall retrieval.

1.  **Semantic Query Expansion**
    -   Uses `gpt-4o-mini` to rewrite user queries for better vector matching.
    -   *Example*: "Dadhimukha" $\to$ "Dadhimukha, the monkey guardian of Madhuvana..."
2.  **Vector Retrieval**
    -   **Engine**: Pinecone Serverless (`tattva-shlokas` index).
    -   **Embedding**: OpenAI `text-embedding-3-small` (3,072 dimensions).
    -   **Filtering**: Granular selection by `kanda`, `sarga`, and `shloka`.
3.  **Intelligent Routing**
    -   Questions are classified into **45 strict categories**.
    -   Routing dictates the locked **Answer Template** (T1/T2/T3).

### User Experience (Frontend)

The UI has been overhauled for immersion and accessibility.

1.  **Typewriter Search Interface**
    -   Animated placeholders cycle through prompting questions.
    -   *Example*: "Who is Hanuman?" $\to$ "Why was Sita exiled?"
2.  **Voice Search Integration**
    -   Uses standard Web Speech API for dictate-to-search.
    -   Visual feedback states: `Listening`, `Processing`, `Searching`.
3.  **Discovery Features**
    -   **Curated Threads**: Guided entry points for new users.
    -   **Daily Wisdom**: Random shloka widget.
    -   **Cultural Touches**: "Sri Rama Jayam" footer and authentic typography.

## 3. Technical Architecture

### Stack Components

| Component | Technology | Status |
| :--- | :--- | :--- |
| **Framework** | Next.js 14 (App Router) | ✅ Live |
| **Styling** | Tailwind CSS + Framer Motion | ✅ Live |
| **Database** | Pinecone (Vector) + Vercel KV | ✅ Live |
| **LLMs** | GPT-4o (Routing) + Claude 3.5 Sonnet (Gen) | ✅ Live |
| **Hosting** | Vercel Serverless | ✅ Live |

### Directory Structure

-   `app/`: Next.js App Router pages and API routes.
-   `components/`: Reusable UI components (shadcn/ui).
-   `lib/services/`: Core business logic (`retrieval`, `classification`).
-   `lib/hooks/`: Custom React hooks (e.g., `useTypewriter`).

## 4. Work in Progress: Evaluation System (Phase 6)

The immediate priority is verifying system trustworthiness before public marketing.

### Golden Dataset
A set of **30 Golden Questions** covering edge cases defined in the PRD, including:
-   Ambiguous queries requiring T2 templates.
-   Out-of-scope queries requiring T3 refusals.
-   Complex multi-step factual questions.

### Automated Evaluators
We are building automated checks for:
1.  **Routing Accuracy**: ensuring questions hit the correct 1-of-45 category.
2.  **Citation Verification**: ensuring every cited shloka exists in the dataset.
3.  **Template Compliance**: ensuring T1 answers contain zero speculation.

## 5. Constraints & Non-Goals

### Hard Constraints
> These are enforced at the engine level.

-   **Valmiki Only**: No content from Tulsi, Kamba, or Adhyatma versions.
-   **No Modern Politics**: Explicit rejection of political analogies.
-   **No Personal Advice**: Tattva is an interpreter, not a guru.

### Known Limitations
-   **Voice Search**: Currently supported only on browsers implementing Web Speech API (Chrome/Safari).
-   **Latency**: Complex queries with expansion may take 2-4s to process.
