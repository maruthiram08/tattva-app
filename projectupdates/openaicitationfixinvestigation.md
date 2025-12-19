# OpenAI Citation Failure Investigation

## Executive Summary

OpenAI fails to cite shlokas **53.5% of the time** while Claude succeeds in most cases. Both models receive **identical prompts**. The root cause is that OpenAI generates valid answers but doesn't embed citation references (e.g., `[Bala-Kanda 3.21]`) within its answer text, even though it correctly retrieves the shlokas.

---

## 1. Prompt Structure Deep Dive

### How Prompts Are Built

The application uses a **template-based system** with three prompt types:
- **T1 (Textual)**: Fact-based answers grounded in text
- **T2 (Interpretive)**: Interpretations with scholarly commentary
- **T3 (Refusal)**: Out-of-scope question handling

**Flow:**
1. `classifyQuestion()` determines template type (T1/T2/T3)
2. `buildPrompt()` dispatcher calls `buildT1Prompt()`, `buildT2Prompt()`, or `buildT3Prompt()`
3. Prompt is sent to LLM provider as `systemPrompt`

### The Exact System Prompt (T1 Template)

```
You are Tattva, a scholarly interpreter of Valmiki's Ramayana. Your role is to provide TEXTUAL, fact-based answers grounded ONLY in the provided text.

CRITICAL RULES FOR T1 (TEXTUAL ANSWERS):
1. NEVER speculate or infer beyond what the text explicitly states
2. FORBIDDEN WORDS: might, could, possibly, perhaps, probably, likely, seems, appears, suggests, implies
3. Only use information from the citations provided below
4. Every claim must be traceable to a specific citation
5. If the text doesn't explicitly say something, you MUST say "The text does not state this"
6. Be scholarly but clear - avoid overly academic language
7. SCOPE WARNING: Balakanda Sargas 1-4 contain a summary of the ENTIRE epic (Sankshepa Ramayana). Do not confuse these future events (Exile, War, Lanka) with the specific events that happen WITHIN Balakanda (Birth, Education, Marriage).

QUESTION CATEGORY: ${categoryName}
USER QUESTION: ${question}

RETRIEVED CITATIONS:
${citations}

TASK: Answer the question using ONLY the information above. Structure your response as valid JSON:

{
  "templateType": "T1",
  "answer": "${answerInstruction}",
  "textualBasis": {
    "kanda": "Primary Kanda name",
    "sarga": [array of sarga numbers],
    "shloka": [array of shloka numbers if specific],
    "citations": ["Kanda Sarga.Shloka", "Kanda Sarga.Shloka"]
  },
  "explanation": "Detailed explanation connecting the citations to the answer. Quote specific phrases from the text. 3-5 sentences."
}

VALIDATION CHECKLIST:
- [ ] No speculative language used
- [ ] All citations are from the provided text
- [ ] Answer is directly supported by explanations
- [ ] No modern interpretations or comparisons
- [ ] Neutral, scholarly tone
- [ ] Answer includes specific names/places/numbers found in text

RESPOND WITH ONLY THE JSON, NO ADDITIONAL TEXT.
```

### How Citations Are Formatted

Retrieved shlokas are formatted as:
```
[${kanda} ${sarga}.${shloka}]
Sanskrit: ${shloka_text.substring(0, 200)}
Translation: ${translation}
Explanation: ${explanation}
---
```

### Template Differences (T1 vs T2 vs T3)

| Template | Focus | Key JSON Fields |
|----------|-------|-----------------|
| T1 | Textual facts only | `answer`, `textualBasis`, `explanation` |
| T2 | Interpretations allowed | `whatTextStates`, `traditionalInterpretations`, `limitOfCertainty` |
| T3 | Refusal handling | `outOfScopeNotice`, `why`, `whatICanHelpWith` |

---

## 2. OpenAI vs Claude: Prompt Handling

### Are Prompts Different Between Models?

**NO.** Both providers receive the **exact same prompt content**.

**OpenAI Provider** (`lib/llm/providers/openai-provider.ts`):
- Takes `systemPrompt` from request
- Sends as `{ role: "system", content: systemPrompt }`

**Claude Provider** (`lib/llm/providers/claude-provider.ts`):
- Takes same `systemPrompt` 
- Sends as `system` parameter in API call

The prompt template code (`buildT1Prompt`, etc.) is model-agnostic.

---

## 3. Failure Analysis from Evaluation Results

### Statistics

From `gemini_evaluation_results.csv` (272 questions):

| Metric | OpenAI | Claude |
|--------|--------|--------|
| Citation Pass | ~46.5% | ~90%+ |
| Citation Fail | ~53.5% | ~10% |

### Pattern: What "Citation Failure" Means

OpenAI typically:
1. ✅ Retrieves correct shlokas
2. ✅ Provides accurate answer content
3. ❌ Does NOT embed `[Kanda Sarga.Shloka]` format in answer text

Claude typically:
1. ✅ Retrieves correct shlokas
2. ✅ Provides accurate answer content
3. ✅ Embeds citations like `[Bala-Kanda 1.23]` directly in answer

---

## 4. Three Failed Citation Examples

### Example 1: Timeline Sequencing

**Question:** "Place these events in order: The mutilation of Ayomukhi, the death of Kabandha, meeting Shabari."

**Retrieved Shlokas (25 total):** `bala-kanda-3-21`, `bala-kanda-3-35`, `aranya-kanda-1-6`, `aranya-kanda-25-41`, etc.

**OpenAI's Answer:**
> "The sequence of events is as follows: first, the mutilation of Ayomukhi preceded the death of Kabandha, followed by the meeting with Shabari."

**Why It Failed:** The answer is factually reasonable but contains **zero inline citations**. No `[Aranya-Kanda X.Y]` references.

**Claude's Answer:** Would typically include: "According to [Aranya-Kanda 25.41], after Kabandha's death..."

---

### Example 2: Character Identity

**Question:** "Who is the primary author of the Ramayana within the text itself?"

**OpenAI's Answer:** Correctly identifies Valmiki but provides no shloka citations in the answer text.

**Claude's Answer:** Cites multiple shlokas like `[Bala-Kanda 2.32]` directly.

**Evaluation Result:** Claude wins.

---

### Example 3: Sarga Overview

**Question:** "What happens in the 'Samkshipita Ramayana' (First Sarga)?"

**OpenAI's Answer:** Describes the content correctly but **fails to cite shlokas**.

**Claude's Answer:** Cites `bala-kanda-1-23`, `bala-kanda-1-26-1-27`.

**Evaluation Result:** Claude wins.

---

## 5. Root Cause Analysis

### The Core Problem

The prompt says:
> "Every claim must be traceable to a specific citation"

And requires JSON output with:
```json
"textualBasis": {
  "citations": ["Kanda Sarga.Shloka", ...]
}
```

**But the citation CHECK looks for inline citations in the `answer` field itself**, not just in `textualBasis.citations`.

### Why OpenAI Fails More Often

1. **Literal JSON Interpretation:** OpenAI interprets the JSON structure literally—putting citations in `textualBasis.citations` array but not repeating them in `answer` prose
2. **Claude's Tendency:** Claude more naturally weaves citations into narrative text
3. **No Explicit Instruction:** The prompt doesn't explicitly say "Include citation references like [Kanda Sarga.Shloka] within your answer text"

---

## 6. Recommended Fixes

### Option A: Modify the Prompt (Low Effort)

Add explicit instruction to embed citations in answer text:

```
CRITICAL: Your "answer" field MUST include inline citations in the format [Kanda Sarga.Shloka] 
wherever you reference information. Example: "Rama was born in Ayodhya [Bala-Kanda 5.12] 
and was educated by Vishwamitra [Bala-Kanda 19.3]."
```

### Option B: Modify Citation Check Logic (Medium Effort)

Update the evaluation/citation check to accept citations from `textualBasis.citations` array, not just inline text.

### Option C: Post-Processing (Medium Effort)

Add a post-processing step that extracts citations from `textualBasis.citations` and injects them into the answer text before evaluation.

---

## 7. Files Involved

| File | Purpose |
|------|---------|
| `lib/prompts/t1-textual-prompt.ts` | T1 prompt builder |
| `lib/prompts/t2-interpretive-prompt.ts` | T2 prompt builder |
| `lib/prompts/t3-refusal-prompt.ts` | T3 prompt builder |
| `lib/llm/providers/openai-provider.ts` | OpenAI API integration |
| `lib/llm/providers/claude-provider.ts` | Claude API integration |
| `lib/services/answer-service.ts` | Orchestrates prompt building |
| `evaluations/gemini_evaluation_results.csv` | Full evaluation results |
| `logs/traces.jsonl` | Detailed trace logs with full prompts/responses |

---

## 8. Next Steps

1. **Decision Required:** Choose between Option A (prompt fix), Option B (check logic), or Option C (post-processing)
2. **Test:** Run a subset evaluation after implementing fix
3. **Measure:** Compare new citation pass rate vs current 46.5%

---

*Generated: 2025-12-19*
