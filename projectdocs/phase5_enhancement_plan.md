# Phase 5: Enhancements Plan (UI, Reliability, QA)

**Goal**: Elevate Tattva from a functional prototype to a polished, robust, and verifiable product.

---

## 1. UI Polish: Interactive Citations (High Priority)
**Objective**: Transform static text citations (e.g., "Bala Kanda 1.1") into interactive, verifying elements.

### Features:
1.  **Citation Parsing**: Automatically detect "Kanda X.Y" or "Sarga X" patterns in the AI answer text.
2.  **Hover Tooltip (Quick Peek)**:
    *   On mouse hover, show a small card with the **Sanskrit Shloka** and **English Translation**.
    *   This builds trust instantly ("Trust but Verify").
3.  **Click Interaction (Deep Dive)**:
    *   Clicking opens the specific `Explorer` page, scrolled to the exact shloka.
    *   Example: Clicking "Bala Kanda 1.1" -> navigates to `/explorer/bala%20kanda/1#shloka-1`.
4.  **Source List**: A consolidated list of all cited sources at the bottom of the answer card.

### Technical Implementation:
*   **Component**: `components/answer/CitationTooltip.tsx` (New)
*   **Logic**: Regex parsing in `T1AnswerCard.tsx` and `T2AnswerCard.tsx` to wrap text in the tooltip component.
*   **Data**: The `retrieval` object in the API response already contains the full shloka text, so we don't need a new API call! We just need to pass this data to the frontend component.

---

## 2. Backend Reliability: Multi-Provider Fallbacks (Medium Priority)
**Objective**: Ensure the app never goes down, even if OpenAI has an outage, and optimize costs.

### Features:
1.  **Provider Fixing**:
    *   **Claude**: Update model ID to `claude-3-5-sonnet-latest` to fix 404s.
    *   **Gemini**: Fix module caching so we can use the cheaper `gemini-1.5-flash` or `pro`.
2.  **Automatic Fallback Strategy**:
    *   **Primary**: OpenAI (GPT-4o) - Best quality.
    *   **Secondary**: Claude 3.5 Sonnet - If OpenAI fails/times out.
    *   **Tertiary**: Gemini - If both fail.
3.  **Cost Optimization (Smart Routing)**:
    *   Route simple "Fact Retrieval" questions (T1) to Gemini (cheaper).
    *   Route complex "Interpretive" questions (T2) to GPT-4o.

### Technical Implementation:
*   **File**: `lib/llm/providers/claude-provider.ts` and `gemini-provider.ts`
*   **File**: `app/api/answer/route.ts` (Update try-catch block to iterate through providers).

---

## 3. Quality Assurance: Evaluation System (Safety)
**Objective**: Systematically prove that the AI is safe, accurate, and citation-grounded.

### Features:
1.  **Golden Dataset**:
    *   A JSON file with ~30 curated questions covering:
        *   **Facts**: "Who is Hanuman?"
        *   **Philosophy**: "What is Dharma?"
        *   **Controversial**: "Was Rama fair to Vali?"
        *   **Refusals**: "Comparison with other religions."
2.  **Automated Grading Script**:
    *   Runs all 30 questions.
    *   **Checks**:
        *   Did it answer? (Refusal check)
        *   Are there citations? (Hallucination check)
        *   Is the JSON valid? (Structure check)
3.  **CI/CD Integration**:
    *   Run this script automatically before every deploy to prevent regressions.

### Technical Implementation:
*   **Data**: `data/golden_dataset.json`
*   **Script**: `scripts/evaluate.ts`

---

## Execution Order
1.  **Interactive Citations** (User facing, high impact).
2.  **Backend Reliability** (Engineering robustness).
3.  **Evaluation System** (Long-term safety).
