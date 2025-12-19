# OpenAI Citation Fix Implementation Plan

## Goal

Fix OpenAI's 53.5% citation failure rate by modifying prompt templates to explicitly require inline citations in the answer text.

## User Review Required

> [!IMPORTANT]
> This change modifies the prompts sent to both OpenAI AND Claude. Both models will receive the new inline citation instructions.

---

## Proposed Changes

### lib/prompts

#### [MODIFY] [t1-textual-prompt.ts](file:///Users/maruthi/Desktop/MainDirectory/tattvaapp/lib/prompts/t1-textual-prompt.ts)

**Change 1: Update CRITICAL RULES section (lines 33-40)**

Replace rule #4 and add inline citation requirement:

```diff
 CRITICAL RULES FOR T1 (TEXTUAL ANSWERS):
 1. NEVER speculate or infer beyond what the text explicitly states
 2. FORBIDDEN WORDS: might, could, possibly, perhaps, probably, likely, seems, appears, suggests, implies
 3. Only use information from the citations provided below
-4. Every claim must be traceable to a specific citation
-5. If the text doesn't explicitly say something, you MUST say "The text does not state this"
-6. Be scholarly but clear - avoid overly academic language
-7. SCOPE WARNING: Balakanda Sargas 1-4 contain a summary of the ENTIRE epic...
+4. INLINE CITATIONS REQUIRED: You MUST embed citations directly within your "answer" text using the format [Kanda-Name Sarga.Shloka]. 
+   - Example: "Rama was born in Ayodhya [Bala-Kanda 5.12] and was trained by Vishwamitra [Bala-Kanda 19.3]."
+   - Every factual claim in your answer MUST have an inline citation immediately after the claim
+   - Do NOT write answers without inline citations
+   - The citations must appear IN the answer prose, not just in the textualBasis array
+5. Every claim must be traceable to a specific citation
+6. If the text doesn't explicitly say something, you MUST say "The text does not state this"
+7. Be scholarly but clear - avoid overly academic language
+8. SCOPE WARNING: Balakanda Sargas 1-4 contain a summary of the ENTIRE epic (Sankshepa Ramayana). Do not confuse these future events (Exile, War, Lanka) with the specific events that happen WITHIN Balakanda (Birth, Education, Marriage).
```

**Change 2: Update TASK section (line 48)**

Add mandatory citation format instruction:

```diff
-TASK: Answer the question using ONLY the information above. Structure your response as valid JSON:
+TASK: Answer the question using ONLY the information above.

+MANDATORY CITATION FORMAT: Your "answer" field MUST contain inline citations in [Kanda-Name Sarga.Shloka] format. 
+- WRONG: "Rama was born in Ayodhya." (no citation)
+- CORRECT: "Rama was born in Ayodhya [Bala-Kanda 5.12]." (has citation)

+Every sentence with a factual claim must include at least one inline citation.

+Structure your response as valid JSON:
```

**Change 3: Update JSON template example (lines 50-60)**

Replace with example showing inline citations:

```diff
 {
   "templateType": "T1",
-  "answer": "${answerInstruction}",
+  "answer": "Your answer text with inline citations like [Bala-Kanda 1.23] embedded throughout. ${answerInstruction} Every factual claim must have a citation in brackets immediately following it.",
   "textualBasis": {
-    "kanda": "Primary Kanda name",
-    "sarga": [array of sarga numbers],
-    "shloka": [array of shloka numbers if specific],
-    "citations": ["Kanda Sarga.Shloka", "Kanda Sarga.Shloka"]
+    "kanda": "Primary Kanda name (e.g., Bala-Kanda)",
+    "sarga": [1, 2, 3],
+    "shloka": [23, 45, 67],
+    "citations": ["Bala-Kanda 1.23", "Bala-Kanda 2.45", "Bala-Kanda 3.67"]
   },
   "explanation": "Detailed explanation connecting the citations to the answer. Quote specific phrases from the text. 3-5 sentences."
 }
```

**Change 4: Update VALIDATION CHECKLIST (lines 62-68)**

Add inline citation verification:

```diff
-VALIDATION CHECKLIST:
-- [ ] No speculative language used
-- [ ] All citations are from the provided text
-- [ ] Answer is directly supported by explanations
-- [ ] No modern interpretations or comparisons
-- [ ] Neutral, scholarly tone
-- [ ] Answer includes specific names/places/numbers found in text
+VALIDATION CHECKLIST (verify ALL before responding):
+- [ ] INLINE CITATIONS: The "answer" field contains [Kanda-Name Sarga.Shloka] citations embedded in the prose
+- [ ] CITATION COVERAGE: Every factual claim in the answer has an inline citation
+- [ ] NO SPECULATION: No speculative language (might, could, possibly, perhaps, probably, likely, seems, appears, suggests, implies)
+- [ ] SOURCE VALIDITY: All citations are from the provided retrieved citations only
+- [ ] SUPPORT: Answer is directly supported by the textual basis
+- [ ] NO MODERN: No modern interpretations or external comparisons
+- [ ] TONE: Neutral, scholarly tone maintained
+- [ ] SPECIFICS: Answer includes specific names, places, and numbers found in the text
```

---

#### [MODIFY] [t2-interpretive-prompt.ts](file:///Users/maruthi/Desktop/MainDirectory/tattvaapp/lib/prompts/t2-interpretive-prompt.ts)

**Change 1: Add inline citation rule to CRITICAL RULES section (lines 28-35)**

```diff
 CRITICAL RULES FOR T2 (INTERPRETIVE ANSWERS):
 1. Clearly distinguish between textual facts and interpretations
 2. Label all inferences as such ("This suggests...", "Commentators interpret this as...")
 3. Use scholarly commentary (comments field) when available
 4. MANDATORY: Include "Limit of Certainty" section explaining what we cannot know
 5. Be transparent about ambiguity in the text
 6. Avoid presenting interpretations as facts
+7. INLINE CITATIONS REQUIRED: When stating what the text says in "whatTextStates", you MUST embed citations using [Kanda-Name Sarga.Shloka] format.
+   - Example: "The text states that Rama went to the forest [Ayodhya-Kanda 40.12] where he encountered various sages [Aranya-Kanda 1.5]."
+   - Every textual reference must have an inline citation
+   - Interpretations in "traditionalInterpretations" should reference which shlokas they interpret
```

**Change 2: Update JSON template example (lines 44-50)**

```diff
 {
   "templateType": "T2",
   "answer": "Brief answer acknowledging both textual evidence and interpretation (2-3 sentences)",
-  "whatTextStates": "What Valmiki's text EXPLICITLY says (no inference). 3-4 sentences. Quote specific phrases.",
+  "whatTextStates": "What Valmiki's text EXPLICITLY says with inline citations like [Aranya-Kanda 25.41]. 3-4 sentences. Quote specific phrases and cite them.",
-  "traditionalInterpretations": "How commentators and scholars have interpreted this (using comments field). Label as interpretations. 3-5 sentences.",
+  "traditionalInterpretations": "How commentators and scholars have interpreted this [reference shlokas being interpreted]. Label as interpretations. 3-5 sentences.",
   "limitOfCertainty": "MANDATORY. What the text does NOT explicitly say. What remains ambiguous. What we cannot conclude with certainty. 2-3 sentences."
 }
```

**Change 3: Update VALIDATION CHECKLIST (lines 52-57)**

```diff
 VALIDATION CHECKLIST:
+- [ ] INLINE CITATIONS: The "whatTextStates" field contains [Kanda-Name Sarga.Shloka] citations
 - [ ] "whatTextStates" contains ONLY explicit textual facts
 - [ ] "traditionalInterpretations" clearly labels interpretations
 - [ ] "limitOfCertainty" section is present and substantive (not generic)
 - [ ] Scholarly commentary (comments) is used when available
 - [ ] Speculation is labeled as such, not presented as fact
```

---

## Verification Plan

### Automated Tests

**Step 1: Single Question Test via UI**
```bash
# Ensure dev server is running
# Open browser to http://localhost:3000
# Ask: "Who is Hanuman?"
# Verify response JSON answer field contains [Kanda-Name Sarga.Shloka] pattern
```

**Step 2: Regex Verification**
Use this regex to verify inline citations exist in answer:
```regex
\[[A-Za-z]+-Kanda\s+\d+\.\d+\]
```

**Step 3: Sample of 10 Questions**
Run through the UI with OpenAI model:
1. Who is Hanuman?
2. Who is the author of Ramayana?
3. How many kandas are in Ramayana?
4. What happens in Sundara Kanda?
5. Who is Ravana's wife?
6. How did Jatayu die?
7. Who built the bridge to Lanka?
8. What weapon killed Ravana?
9. Who is Dasharatha?
10. What is Kishkindha?

For each, verify `answer` field contains at least one `[Kanda-Name X.Y]` citation.

### Manual Verification

After implementation, user should:
1. Test the app with 3-5 sample questions
2. Verify inline citations appear in OpenAI responses
3. Optionally re-run evaluation script to measure improvement

### Success Criteria

| Metric | Before | Target |
|--------|--------|--------|
| OpenAI citation pass rate | 47% | 80%+ |
| Claude citation pass rate | 87% | 90%+ |
| JSON parsing errors | 0 | 0 |

### Rollback Plan

If issues occur:
```bash
git checkout HEAD -- lib/prompts/t1-textual-prompt.ts
git checkout HEAD -- lib/prompts/t2-interpretive-prompt.ts
```
