# Enhanced Ramayana Q&A Evaluation Plan (Final)

## Goal
Evaluate 270 Q&A rows using Gemini as a judge.
**Key Features:**
1. **Strict Classification Validation** (against 45 PRD categories).
2. **Per-Model Binary Checks** (OpenAI vs Claude split for all metrics).
3. **Detailed Checklist Criteria** (Routing appropriateness, Retrieval accuracy, etc.).

---

## Evaluation Criteria (Detailed Checklist)

The LLM-Judge will evaluate each row against these specific questions before assigning PASS/FAIL:

### 1. CLASSIFICATION & ROUTING
- **Classification Check:** Does the assigned category match the 45 PRD categories exactly?
- **Routing Check:** Does this category make sense? Would another be more appropriate?

### 2. RETRIEVAL CHECK (Per Model)
- Are retrieved shlokas relevant?
- Did it find the **RIGHT part** of the epic?
- Are obvious shlokas missing?

### 3. ANSWER QUALITY (Per Model)
- **Answers Question:** Does it actually address the user query?
- **Cites Shlokas:** Are citations present (Kanda.Sarga.Shloka)? (Note: DB verification skipped, presence checked).
- **Follows Template:** Adheres to T1/T2/T3 structure? NO speculation in T1?
- **No Hallucination:** Facts grounded in Valmiki Ramayana? No modern psychology?

### 4. EDGE CASE CHECK
- Any unexpected/embarrassing behavior?

---

## Output Schema (Target CSV Columns)

| Category | Column | Description |
|---|---|---|
| **Meta** | `user_query` | |
| | `classification` | |
| | `classification_check` | PASS/FAIL (Valid PRD category?) |
| | `classification_suggestion` | If Fail, correct category name |
| **OpenAI** | `openai_routing_check` | PASS/FAIL (Did it understand intent?) |
| | `openai_retrieval_check` | PASS/FAIL (Relevant shlokas?) |
| | `openai_answers_question` | PASS/FAIL |
| | `openai_cites_shlokas` | PASS/FAIL |
| | `openai_follows_template` | PASS/FAIL |
| | `openai_no_hallucination` | PASS/FAIL |
| **Claude** | `claude_routing_check` | PASS/FAIL |
| | `claude_retrieval_check` | PASS/FAIL |
| | `claude_answers_question` | PASS/FAIL |
| | `claude_cites_shlokas` | PASS/FAIL |
| | `claude_follows_template` | PASS/FAIL |
| | `claude_no_hallucination` | PASS/FAIL |
| **Result** | `edge_case_check` | PASS/FAIL |
| | `winner` | OpenAI / Claude / Tie |
| | `comments` | Specific actionable feedback |
| | `fail_group_category` | Taxonomy codes (e.g., "1a, 3b") |

---

## Verification Plan

### Automated Tests
1. **Schema Check:** Ensure all 20+ columns exist in output.
2. **Row Count:** Confirm 270 rows.
3. **Validity:** Ensure `Pass`/`Fail` are the only values in check columns.

### Execution
- Run `scripts/evaluate_with_gemini.py`
- LIMIT_ROWS=10 (Sample) -> Review -> LIMIT_ROWS=None (Full)
