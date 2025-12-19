# T3 Refusal Evaluation Fix Implementation Plan

## Goal

Fix the 87.5% false failure rate on T3 refusal questions by updating the Gemini evaluation prompt to skip citation and retrieval checks for T3 responses.

## User Review Required

> [!IMPORTANT]
> This change only affects the evaluation script (`scripts/evaluate_with_gemini.py`). It does NOT change how the app generates responses.

---

## Proposed Changes

### scripts

#### [MODIFY] [evaluate_with_gemini.py](file:///Users/maruthi/Desktop/MainDirectory/tattvaapp/scripts/evaluate_with_gemini.py)

**Change 1: Update the Retrieval Check section (lines 96-100)**

Add T3 exception instruction:

```diff
 **2. RETRIEVAL CHECK (Per Model)**
 (Output in openai_retrieval_check / claude_retrieval_check)
+
+**T3 EXCEPTION**: If template == "T3", output "N/A" for retrieval check. T3 refusals do NOT require retrieval.
+
 - Are the retrieved shlokas relevant to the question?
 - Did retrieval find the RIGHT part of the epic?
 - Are there obvious shlokas that should have been found but were missed?
```

**Change 2: Update the Cites Shlokas check section (lines 109-111)**

Add T3 exception instruction:

```diff
 B. **Cites Shlokas** (openai_cites_shlokas / claude_cites_shlokas)
+
+**T3 EXCEPTION**: If template == "T3", output "N/A" for cites_shlokas. T3 refusals should NOT have citations - that's correct behavior.
+
 - Does the answer include specific Citations (Kanda.Sarga.Shloka)?
 - (Note: Don't verify existence in DB, just checking presence in text).
```

**Change 3: Update the Answers Question check section (lines 105-107)**

Add T3-specific logic:

```diff
 A. **Answers Question** (openai_answers_question / claude_answers_question)
+
+**T3 SPECIAL LOGIC**: For T3 refusals, "answering" means politely refusing. Check if:
+- Response indicates the question is out of scope
+- Response offers alternative in-scope topics
+- Response does NOT provide a substantive Ramayana answer
+If proper refusal → PASS. If tries to answer anyway → FAIL.
+
 - Does the answer actually address the question?
 - Is it direct and helpful?
```

**Change 4: Add T3 Decision Matrix before the XML format section (after line 124)**

Insert clear T3 evaluation rules:

```diff
 **4. EDGE CASE CHECK (Pass/Fail)**
 - Any unexpected behavior?
 - Anything that would embarrass us if a scholar saw it?

+**T3 REFUSAL DECISION MATRIX**
+When template == "T3":
+| Check | Expected Value | Reason |
+|-------|---------------|--------|
+| retrieval_check | N/A | T3 doesn't require retrieval |
+| cites_shlokas | N/A | T3 should NOT have citations |
+| answers_question | PASS if proper refusal | Refusal = correct answer |
+| follows_template | PASS if polite + redirects | Check T3 format |
+| no_hallucination | PASS if no false claims | Still applicable |
+
+Signs of proper T3 refusal:
+- "outside my scope", "cannot help with", "falls outside"
+- Offers alternative topics from Ramayana
+- Does NOT cite shlokas or provide textual analysis
+
 ------------------
```

---

## Verification Plan

### Manual Verification

After implementation, re-run the evaluation script on T3 questions and verify:

1. `cites_shlokas` shows `N/A` (not `FAIL`) for all T3 questions
2. `retrieval_check` shows `N/A` (not `FAIL`) for all T3 questions
3. `answers_question` shows `PASS` for proper refusals
4. T3 pass rate increases from 12.5% to ~100%

### Test Commands

```bash
# Run evaluation on coverage test mode (includes T3 questions)
cd /Users/maruthi/Desktop/MainDirectory/tattvaapp
python scripts/evaluate_with_gemini.py
```

### Success Criteria

| Metric | Before | After |
|--------|--------|-------|
| T3 Pass Rate | 12.5% | 100% |
| False Failure Rate | 87.5% | 0% |
| T1/T2 Pass Rate | No change | No change |
