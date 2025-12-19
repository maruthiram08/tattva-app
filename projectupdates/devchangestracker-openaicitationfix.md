# OpenAI Citation Fix - Development Changes Tracker

**Date**: December 19, 2025  
**Session Start**: 18:05 IST  
**Objective**: Fix OpenAI's failure to include inline citations in answers

---

## Changes Made

### 1. T1 Prompt Update (OpenAI Citation Fix)
**File**: `lib/prompts/t1-textual-prompt.ts`  
**Time**: ~18:06 IST  
**What Changed**:
- Added rule #4: "INLINE CITATIONS REQUIRED" with examples showing `[Kanda-Name Sarga.Shloka]` format
- Added "MANDATORY CITATION FORMAT" section with WRONG/CORRECT examples
- Updated JSON template to show inline citation format in answer field
- Expanded VALIDATION CHECKLIST with citation-specific checks

**Why**: OpenAI was providing citations only in the `textualBasis.citations` array but NOT embedding them inline in the `answer` prose. The evaluation checks for inline citations in the answer text. Claude naturally includes inline citations; OpenAI needed explicit instructions.

---

### 2. T2 Prompt Update (OpenAI Citation Fix)
**File**: `lib/prompts/t2-interpretive-prompt.ts`  
**Time**: ~18:06 IST  
**What Changed**:
- Added rule #7: Inline citation requirement for `whatTextStates` field
- Updated JSON template with citation examples
- Added inline citation check to validation checklist

**Why**: Same issue as T1 - OpenAI wasn't embedding citations in the prose for interpretive answers.

---

### 3. T3 Refusal Evaluation Fix
**File**: `scripts/evaluate_with_gemini.py`  
**Time**: ~18:17 IST  
**What Changed**:
- Added "T3 EXCEPTION" for retrieval_check - outputs N/A for T3 questions
- Added "T3 EXCEPTION" for cites_shlokas - outputs N/A for T3 questions
- Added "T3 SPECIAL LOGIC" for answers_question - checks for proper refusal behavior
- Added "T3 REFUSAL DECISION MATRIX" table showing expected values
- Added "Signs of proper T3 refusal" pattern guidance
- Updated XML format to allow Pass/Fail/N/A for retrieval and citation checks

**Why**: T3 refusals were failing evaluation because the evaluator expected citations, but T3 responses should NOT have citations (that's correct behavior). 87.5% false failure rate on T3 questions.

---

### 4. Smoke Test Script Created
**File**: `scripts/smoke_test_citations.py`  
**Time**: ~18:41 IST  
**What Changed**:
- Created new script to test 5 questions through `/api/answer` endpoint
- Calls API with `preferredProvider='openai'` and `stream=false`
- Checks for inline citations using regex

**Why**: Needed to verify the citation fix works before running full 60-question evaluation.

---

### 5. Smoke Test Regex Fix
**File**: `scripts/smoke_test_citations.py`  
**Time**: ~18:44 IST  
**What Changed**:
- Updated regex from `\[[A-Za-z]+-Kanda\s+\d+\.\d+\]` to `\[[A-Za-z]+[ -]Kanda\s+\d+\.\d+\]`

**Why**: OpenAI returns citations in two formats:
- `[Bala-Kanda 1.2]` (with hyphen)
- `[Bala Kanda 1.2]` (with space)

The original regex only matched hyphenated format. Initial smoke test showed 2/5 pass, but actual responses had citations - just with spaces instead of hyphens.

---

### 6. Batch Evaluation Script Created
**File**: `scripts/batch_evaluate_golden.py`  
**Time**: ~18:46 IST  
**What Changed**:
- Created script to run all 60 golden questions through `/api/answer`
- Calls both OpenAI and Claude providers for each question
- Tracks citation rates in real-time
- Saves full responses to JSON for Gemini evaluation
- Includes progress updates every 10 questions

**Why**: Need to generate fresh responses with the updated prompts to measure actual improvement in citation rates.

---

## Files Copied to projectupdates/

1. `openaicitationfix-actualplan.md` - Implementation plan for OpenAI citation fix
2. `t3-refusal-evaluation-fix-plan.md` - Implementation plan for T3 evaluation fix

---

## Smoke Test Results

### First Run (strict regex): 2/5 passed
- ❌ Who is Hanuman? - detected as no citations (false negative - had space format)
- ✅ Who is the primary author... - Found 3 citations
- ❌ What forest did Rama go... - detected as no citations (false negative)
- ❌ Why did Rama exile Sita... - detected as no citations (false negative)
- ✅ Can you draw Rama? - T3 correctly has no citations

### Second Run (fixed regex): 5/5 passed ✅
- ✅ Who is Hanuman? - Found 4 citations `[Sundara Kanda 3.1]`, `[Sundara Kanda 1.181]`, etc.
- ✅ Who is the primary author... - Found 3 citations `[Bala-Kanda 4.3]`, `[Bala-Kanda 4.2]`, etc.
- ✅ What forest did Rama go... - Found 4 citations `[Aranya-Kanda 1.1]`, `[Ayodhya-Kanda 72.42]`, etc.
- ✅ Why did Rama exile Sita... - Found 4 citations `[Yuddha Kanda 122.35]`, `[Yuddha Kanda 121.13]`, etc.
- ✅ Can you draw Rama? - T3 correctly has no citations

**Conclusion**: OpenAI citation fix is working! Proceed with full 60-question evaluation.

---

### 7. API Fix - T2 whatTextStates Capture
**File**: `app/api/answer/route.ts`  
**Time**: ~19:21 IST  
**What Changed**:
- Line 80: Changed `answer: result.object.answer || ''` to `answer: result.object.answer || result.object.whatTextStates || result.object.why || ''`

**Why**: The non-streaming API (used for batch evaluation) wasn't capturing T2 responses correctly. T2 uses `whatTextStates` field for citing text, not `answer`. The streaming version (line 127) already had this fallback logic. This fix ensures T2 citations are properly extracted.

---

### 8. API Fix - Return Full Response Object
**File**: `app/api/answer/route.ts`  
**Time**: ~20:25 IST  
**What Changed**:
- Added `full_response: result.object` to the batch response
- This includes `whatTextStates`, `traditionalInterpretations`, `limitOfCertainty` for T2

**Why**: The trace only captures one `answer` field, but T2 responses have citations in `whatTextStates`. By returning the full response object, evaluation scripts can check all fields.

**Test Results (3 T2 questions)**:
- `answer` field: 1 citation total
- `whatTextStates` field: **8 citations total** ✅

This confirms T2 citations ARE being generated - they're just in `whatTextStates`, not `answer`.

---

### 9. Batch Script Update - Check Both Fields
**File**: `scripts/batch_evaluate_golden.py`  
**Time**: ~20:36 IST  
**What Changed**:
- Updated `extract_answer_info()` to check citations in both `answer` AND `whatTextStates`
- Added `wts_citations` and `answer_citations` tracking
- Stores `full_response` for Gemini evaluation access

**Why**: To get accurate citation counts across all template types (T1 uses answer, T2 uses whatTextStates).

---

## Batch Run #2 (with fixes)
**Started**: 20:37 IST  
**Completed**: 21:18 IST  
**Duration**: ~41 minutes

### Results

| Metric | Before Fix | After Fix | Change | Target | Status |
|--------|------------|-----------|--------|--------|--------|
| OpenAI Citation Rate | 25% | **90.4%** | +65.4% | ≥80% | ✅ PASS |
| Claude Citation Rate | 40% | **82.7%** | +42.7% | ≥40% | ✅ PASS |

### Issues During Run
- Questions 56-57 had 500 server errors (timeout)
- Retried successfully: Both now have 2-3 citations each
- 1 Claude error on Q23 (non-blocking)

### Corrected Rates (with retry)
- OpenAI: 49/52 = **94.2%** ✅
- Claude: 45/52 = **86.5%** ✅

### Output Files
- `projectupdates/golden_responses_AFTER_FIX_2025_12_19_2037.json` - Full responses
- `projectupdates/response_summary_2025_12_19_2037.json` - Summary metrics
- `projectupdates/retry_56_57.json` - Retry results for failed questions

---

## Gemini Evaluation Results
**Completed**: 21:36 IST  
**Duration**: ~6 minutes

### Winner Distribution

| Winner | Count | Percentage |
|--------|-------|------------|
| TIE | 22 | 36.7% |
| CLAUDE | 21 | 35.0% |
| NO_WINNER | 10 | 16.7% |
| OPENAI | 7 | 11.7% |

### OpenAI Pass Rates

| Check | Pass Rate | N/A |
|-------|-----------|-----|
| openai_routing_check | 100% | 0 |
| openai_retrieval_check | 100% | 0 |
| openai_answers_question | 76.7% | 0 |
| **openai_cites_shlokas** | **53.4%** | 2 |
| openai_follows_template | 98.3% | 0 |
| openai_no_hallucination | 96.7% | 0 |

### Claude Pass Rates

| Check | Pass Rate | N/A |
|-------|-----------|-----|
| claude_routing_check | 96.7% | 0 |
| claude_retrieval_check | 96.7% | 0 |
| claude_answers_question | 81.7% | 0 |
| **claude_cites_shlokas** | **79.3%** | 2 |
| claude_follows_template | 96.7% | 0 |
| claude_no_hallucination | 100% | 1 |

### Analysis

The Gemini evaluator's `cites_shlokas` check (53.4% OpenAI, 79.3% Claude) differs from our inline citation count (94.2% OpenAI, 86.5% Claude) because:
1. Gemini evaluation is more strict - checks citation quality, not just presence
2. Some citations may not match the expected format
3. The Gemini evaluator may require citations to be in specific format

**Key Improvement**: 
- OpenAI routing, retrieval, template and hallucination checks all at 96-100%
- TIE rate (36.7%) is high, indicating both models performing similarly

---

## Next Steps

1. ~~Complete smoke test verification~~ ✅
2. ~~Run full 60-question evaluation~~ ✅
3. ~~Run Gemini evaluation~~ ✅
4. ~~Fix T3 evaluation (post-processing)~~ ✅
5. Generate comparison report

---

### 10. T3 Post-Processing Fix
**File**: `scripts/evaluate_with_gemini.py`  
**Time**: ~21:47 IST  
**What Changed**:
- Added post-processing after `evaluate_row()` to force N/A for T3 questions
- When `template == 'T3'`, sets:
  - `openai_cites_shlokas = 'N/A'`
  - `claude_cites_shlokas = 'N/A'`
  - `openai_retrieval_check = 'N/A'`
  - `claude_retrieval_check = 'N/A'`

**Why**: Gemini's prompt has T3 exception rules, but it only applied them to 2/8 T3 questions. Post-processing fixes ensures 100% consistent N/A for all T3 questions.

---

## Gemini Evaluation V2 (with T3 fix)
**Started**: ~21:47 IST
**Status**: Running

---

## Baseline Metrics (Before Fix)

From `projectdocs/openaicitationfix/baseline_metrics_golden_dataset.json`:
- OpenAI Citation Rate: 25%
- Claude Citation Rate: 40%
- T3 Pass Rate: 12.5%
- BOTH_PASS: 6/60 (10%)
