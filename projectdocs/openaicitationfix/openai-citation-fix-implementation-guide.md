# OpenAI Citation Fix: Complete Implementation Guide

**Document Type**: AI Development Agent Task Specification  
**Priority**: CRITICAL  
**Estimated Time**: 1-2 hours  
**Date**: December 19, 2025

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Root Cause Analysis](#2-root-cause-analysis)
3. [Solution Overview](#3-solution-overview)
4. [File Locations](#4-file-locations)
5. [Exact Code Changes - T1 Prompt](#5-exact-code-changes---t1-prompt)
6. [Exact Code Changes - T2 Prompt](#6-exact-code-changes---t2-prompt)
7. [Testing Requirements](#7-testing-requirements)
8. [Success Criteria](#8-success-criteria)
9. [Rollback Plan](#9-rollback-plan)

---

## 1. Problem Statement

### What Is Failing

OpenAI fails the citation check **53.5% of the time** (144 out of 269 questions) while Claude passes **87.4% of the time**.

### How The Failure Manifests

When OpenAI generates an answer, it produces JSON like this:

```json
{
  "templateType": "T1",
  "answer": "Rama was born in Ayodhya and was the eldest son of King Dasharatha.",
  "textualBasis": {
    "kanda": "Bala-Kanda",
    "sarga": [5, 6],
    "shloka": [12, 3],
    "citations": ["Bala-Kanda 5.12", "Bala-Kanda 6.3"]
  },
  "explanation": "The text explicitly states..."
}
```

**The Problem**: The `answer` field contains NO inline citations like `[Bala-Kanda 5.12]`. The citations exist ONLY in the `textualBasis.citations` array.

### How The Evaluation Check Works

The citation evaluator checks if the `answer` field (the prose text) contains citation references in the format `[Kanda-Name Sarga.Shloka]` or similar patterns.

- **OpenAI's answer**: "Rama was born in Ayodhya..." → NO inline citations → **FAIL**
- **Claude's answer**: "Rama was born in Ayodhya [Bala-Kanda 5.12]..." → HAS inline citations → **PASS**

### Business Impact

- Users cannot see which shloka supports which claim
- Tattva's core promise of "verifiable citations" is broken for OpenAI responses
- 53.5% of OpenAI responses fail quality checks

---

## 2. Root Cause Analysis

### Why OpenAI Behaves This Way

1. The current prompt says: "Every claim must be traceable to a specific citation"
2. The prompt provides a JSON structure with a `textualBasis.citations` array
3. OpenAI interprets this literally: it puts citations in the designated array field
4. OpenAI does NOT embed citations in the `answer` prose because the prompt never explicitly requires this

### Why Claude Behaves Differently

Claude has a tendency to "over-deliver" - it naturally weaves citations into narrative text even when not explicitly required. This is a model behavior difference, not a prompt difference.

### The Missing Instruction

The prompt currently lacks this explicit instruction:

> "Your answer field MUST include inline citations in [Kanda-Name Sarga.Shloka] format embedded within the prose text itself"

---

## 3. Solution Overview

### What We Will Do

1. Modify the T1 (Textual) prompt to explicitly require inline citations in the `answer` field
2. Modify the T2 (Interpretive) prompt with the same requirement
3. Add examples showing the expected inline citation format
4. Add validation checklist items for inline citations

### What We Will NOT Do

- We will NOT modify the citation evaluation logic
- We will NOT modify the JSON structure
- We will NOT add post-processing steps
- We will NOT change how Claude or OpenAI providers work

### Expected Outcome

After this fix:
- OpenAI citation pass rate: **47% → 90%+**
- Claude citation pass rate: **87% → 95%+** (slight improvement from clearer instructions)

---

## 4. File Locations

### Files To Modify

| File Path | Purpose | Action |
|-----------|---------|--------|
| `lib/prompts/t1-textual-prompt.ts` | T1 prompt builder | MODIFY |
| `lib/prompts/t2-interpretive-prompt.ts` | T2 prompt builder | MODIFY |

### Files To NOT Modify

| File Path | Purpose | Why No Change |
|-----------|---------|---------------|
| `lib/prompts/t3-refusal-prompt.ts` | T3 refusal prompt | T3 doesn't require citations |
| `lib/llm/providers/openai-provider.ts` | OpenAI API calls | Works correctly |
| `lib/llm/providers/claude-provider.ts` | Claude API calls | Works correctly |
| `lib/services/answer-service.ts` | Orchestration | Works correctly |

### File Structure Context

```
lib/
├── prompts/
│   ├── t1-textual-prompt.ts      ← MODIFY THIS
│   ├── t2-interpretive-prompt.ts  ← MODIFY THIS
│   └── t3-refusal-prompt.ts       ← DO NOT MODIFY
├── llm/
│   └── providers/
│       ├── openai-provider.ts     ← DO NOT MODIFY
│       └── claude-provider.ts     ← DO NOT MODIFY
└── services/
    └── answer-service.ts          ← DO NOT MODIFY
```

---

## 5. Exact Code Changes - T1 Prompt

### Step 5.1: Locate The T1 Prompt File

Open file: `lib/prompts/t1-textual-prompt.ts`

### Step 5.2: Find The System Prompt String

Look for a function named `buildT1Prompt` or similar that returns a string containing:

```
You are Tattva, a scholarly interpreter of Valmiki's Ramayana.
```

### Step 5.3: Identify The CRITICAL RULES Section

Find this section in the prompt:

```
CRITICAL RULES FOR T1 (TEXTUAL ANSWERS):
1. NEVER speculate or infer beyond what the text explicitly states
2. FORBIDDEN WORDS: might, could, possibly, perhaps, probably, likely, seems, appears, suggests, implies
3. Only use information from the citations provided below
4. Every claim must be traceable to a specific citation
5. If the text doesn't explicitly say something, you MUST say "The text does not state this"
6. Be scholarly but clear - avoid overly academic language
7. SCOPE WARNING: Balakanda Sargas 1-4 contain a summary of the ENTIRE epic...
```

### Step 5.4: Replace The CRITICAL RULES Section

**DELETE** the existing CRITICAL RULES section and **REPLACE** with this exact text:

```
CRITICAL RULES FOR T1 (TEXTUAL ANSWERS):
1. NEVER speculate or infer beyond what the text explicitly states
2. FORBIDDEN WORDS: might, could, possibly, perhaps, probably, likely, seems, appears, suggests, implies
3. Only use information from the citations provided below
4. INLINE CITATIONS REQUIRED: You MUST embed citations directly within your "answer" text using the format [Kanda-Name Sarga.Shloka]. 
   - Example: "Rama was born in Ayodhya [Bala-Kanda 5.12] and was trained by Vishwamitra [Bala-Kanda 19.3]."
   - Every factual claim in your answer MUST have an inline citation immediately after the claim
   - Do NOT write answers without inline citations
   - The citations must appear IN the answer prose, not just in the textualBasis array
5. Every claim must be traceable to a specific citation
6. If the text doesn't explicitly say something, you MUST say "The text does not state this"
7. Be scholarly but clear - avoid overly academic language
8. SCOPE WARNING: Balakanda Sargas 1-4 contain a summary of the ENTIRE epic (Sankshepa Ramayana). Do not confuse these future events (Exile, War, Lanka) with the specific events that happen WITHIN Balakanda (Birth, Education, Marriage).
```

### Step 5.5: Find The TASK Section

Locate this text in the prompt:

```
TASK: Answer the question using ONLY the information above. Structure your response as valid JSON:
```

### Step 5.6: Replace The TASK Section

**DELETE** the existing TASK line and **REPLACE** with this exact text:

```
TASK: Answer the question using ONLY the information above.

MANDATORY CITATION FORMAT: Your "answer" field MUST contain inline citations in [Kanda-Name Sarga.Shloka] format. 
- WRONG: "Rama was born in Ayodhya." (no citation)
- CORRECT: "Rama was born in Ayodhya [Bala-Kanda 5.12]." (has citation)

Every sentence with a factual claim must include at least one inline citation.

Structure your response as valid JSON:
```

### Step 5.7: Find The JSON Template

Locate the JSON template example in the prompt:

```json
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
```

### Step 5.8: Replace The JSON Template

**DELETE** the existing JSON template and **REPLACE** with this exact JSON:

```json
{
  "templateType": "T1",
  "answer": "Your answer text with inline citations like [Bala-Kanda 1.23] embedded throughout. For example: Valmiki composed the Ramayana [Bala-Kanda 2.32] after learning the story from Narada [Bala-Kanda 1.1]. Every factual claim must have a citation in brackets immediately following it.",
  "textualBasis": {
    "kanda": "Primary Kanda name (e.g., Bala-Kanda)",
    "sarga": [1, 2, 3],
    "shloka": [23, 45, 67],
    "citations": ["Bala-Kanda 1.23", "Bala-Kanda 2.45", "Bala-Kanda 3.67"]
  },
  "explanation": "Detailed explanation connecting the citations to the answer. Quote specific phrases from the text. 3-5 sentences."
}
```

### Step 5.9: Find The VALIDATION CHECKLIST

Locate this section:

```
VALIDATION CHECKLIST:
- [ ] No speculative language used
- [ ] All citations are from the provided text
- [ ] Answer is directly supported by explanations
- [ ] No modern interpretations or comparisons
- [ ] Neutral, scholarly tone
- [ ] Answer includes specific names/places/numbers found in text
```

### Step 5.10: Replace The VALIDATION CHECKLIST

**DELETE** the existing checklist and **REPLACE** with this exact text:

```
VALIDATION CHECKLIST (verify ALL before responding):
- [ ] INLINE CITATIONS: The "answer" field contains [Kanda-Name Sarga.Shloka] citations embedded in the prose
- [ ] CITATION COVERAGE: Every factual claim in the answer has an inline citation
- [ ] NO SPECULATION: No speculative language (might, could, possibly, perhaps, probably, likely, seems, appears, suggests, implies)
- [ ] SOURCE VALIDITY: All citations are from the provided retrieved citations only
- [ ] SUPPORT: Answer is directly supported by the textual basis
- [ ] NO MODERN: No modern interpretations or external comparisons
- [ ] TONE: Neutral, scholarly tone maintained
- [ ] SPECIFICS: Answer includes specific names, places, and numbers found in the text

RESPOND WITH ONLY THE JSON, NO ADDITIONAL TEXT.
```

### Step 5.11: Complete T1 Prompt (Full Reference)

After all changes, the complete T1 prompt should look like this:

```
You are Tattva, a scholarly interpreter of Valmiki's Ramayana. Your role is to provide TEXTUAL, fact-based answers grounded ONLY in the provided text.

CRITICAL RULES FOR T1 (TEXTUAL ANSWERS):
1. NEVER speculate or infer beyond what the text explicitly states
2. FORBIDDEN WORDS: might, could, possibly, perhaps, probably, likely, seems, appears, suggests, implies
3. Only use information from the citations provided below
4. INLINE CITATIONS REQUIRED: You MUST embed citations directly within your "answer" text using the format [Kanda-Name Sarga.Shloka]. 
   - Example: "Rama was born in Ayodhya [Bala-Kanda 5.12] and was trained by Vishwamitra [Bala-Kanda 19.3]."
   - Every factual claim in your answer MUST have an inline citation immediately after the claim
   - Do NOT write answers without inline citations
   - The citations must appear IN the answer prose, not just in the textualBasis array
5. Every claim must be traceable to a specific citation
6. If the text doesn't explicitly say something, you MUST say "The text does not state this"
7. Be scholarly but clear - avoid overly academic language
8. SCOPE WARNING: Balakanda Sargas 1-4 contain a summary of the ENTIRE epic (Sankshepa Ramayana). Do not confuse these future events (Exile, War, Lanka) with the specific events that happen WITHIN Balakanda (Birth, Education, Marriage).

QUESTION CATEGORY: ${categoryName}
USER QUESTION: ${question}

RETRIEVED CITATIONS:
${citations}

TASK: Answer the question using ONLY the information above.

MANDATORY CITATION FORMAT: Your "answer" field MUST contain inline citations in [Kanda-Name Sarga.Shloka] format. 
- WRONG: "Rama was born in Ayodhya." (no citation)
- CORRECT: "Rama was born in Ayodhya [Bala-Kanda 5.12]." (has citation)

Every sentence with a factual claim must include at least one inline citation.

Structure your response as valid JSON:

{
  "templateType": "T1",
  "answer": "Your answer text with inline citations like [Bala-Kanda 1.23] embedded throughout. For example: Valmiki composed the Ramayana [Bala-Kanda 2.32] after learning the story from Narada [Bala-Kanda 1.1]. Every factual claim must have a citation in brackets immediately following it.",
  "textualBasis": {
    "kanda": "Primary Kanda name (e.g., Bala-Kanda)",
    "sarga": [1, 2, 3],
    "shloka": [23, 45, 67],
    "citations": ["Bala-Kanda 1.23", "Bala-Kanda 2.45", "Bala-Kanda 3.67"]
  },
  "explanation": "Detailed explanation connecting the citations to the answer. Quote specific phrases from the text. 3-5 sentences."
}

VALIDATION CHECKLIST (verify ALL before responding):
- [ ] INLINE CITATIONS: The "answer" field contains [Kanda-Name Sarga.Shloka] citations embedded in the prose
- [ ] CITATION COVERAGE: Every factual claim in the answer has an inline citation
- [ ] NO SPECULATION: No speculative language (might, could, possibly, perhaps, probably, likely, seems, appears, suggests, implies)
- [ ] SOURCE VALIDITY: All citations are from the provided retrieved citations only
- [ ] SUPPORT: Answer is directly supported by the textual basis
- [ ] NO MODERN: No modern interpretations or external comparisons
- [ ] TONE: Neutral, scholarly tone maintained
- [ ] SPECIFICS: Answer includes specific names, places, and numbers found in the text

RESPOND WITH ONLY THE JSON, NO ADDITIONAL TEXT.
```

---

## 6. Exact Code Changes - T2 Prompt

### Step 6.1: Locate The T2 Prompt File

Open file: `lib/prompts/t2-interpretive-prompt.ts`

### Step 6.2: Find The Function That Builds T2 Prompt

Look for a function named `buildT2Prompt` or similar.

### Step 6.3: Identify The Existing Rules Section

Find the section that contains rules for T2 interpretive answers. It may look different from T1 but will have a similar structure.

### Step 6.4: Add Inline Citation Requirement

Add the following rule to the T2 prompt rules section (add as a new numbered rule):

```
INLINE CITATIONS REQUIRED: When stating what the text says in "whatTextStates", you MUST embed citations using [Kanda-Name Sarga.Shloka] format.
- Example: "The text states that Rama went to the forest [Ayodhya-Kanda 40.12] where he encountered various sages [Aranya-Kanda 1.5]."
- Every textual reference must have an inline citation
- Interpretations in "traditionalInterpretations" should reference which shlokas they interpret
```

### Step 6.5: Update T2 JSON Template

Find the JSON template in the T2 prompt. Update the `whatTextStates` field example to show inline citations:

**BEFORE** (example - actual wording may differ):
```json
{
  "templateType": "T2",
  "whatTextStates": "Description of what the text says",
  ...
}
```

**AFTER**:
```json
{
  "templateType": "T2",
  "whatTextStates": "The text explicitly states that [specific content with inline citation like Aranya-Kanda 25.41]. This is directly mentioned in [another citation if applicable].",
  ...
}
```

### Step 6.6: Add T2 Validation Checklist Item

If T2 has a validation checklist, add this item:

```
- [ ] INLINE CITATIONS: The "whatTextStates" field contains [Kanda-Name Sarga.Shloka] citations embedded in the prose
```

---

## 7. Testing Requirements

### Step 7.1: Unit Test - Single Question

After making code changes, test with ONE question first.

**Test Question**: "Who is Hanuman?"

**Expected Response Structure**:
```json
{
  "templateType": "T1",
  "answer": "Hanuman is the son of Vayu, the wind god [Kishkindha-Kanda 66.1]. He is a mighty vanara warrior who served Lord Rama [Sundara-Kanda 1.5] and played a crucial role in finding Sita [Sundara-Kanda 35.12].",
  "textualBasis": {
    "kanda": "Kishkindha-Kanda",
    "sarga": [66, 1, 35],
    "shloka": [1, 5, 12],
    "citations": ["Kishkindha-Kanda 66.1", "Sundara-Kanda 1.5", "Sundara-Kanda 35.12"]
  },
  "explanation": "..."
}
```

**Verification Checklist**:
- [ ] The `answer` field contains text with `[Kanda-Name Sarga.Shloka]` patterns
- [ ] At least 2 inline citations are present in the answer prose
- [ ] The JSON is valid and parseable
- [ ] No error is thrown

### Step 7.2: Sample Test - 10 Questions

Run these 10 questions through the system with OpenAI as the provider:

| # | Question | Expected Inline Citation Presence |
|---|----------|-----------------------------------|
| 1 | Who is Hanuman? | YES - character facts need citations |
| 2 | Who is the author of Ramayana? | YES - authorship claims need citations |
| 3 | How many kandas are in Ramayana? | YES - structural facts need citations |
| 4 | What happens in Sundara Kanda? | YES - events need citations |
| 5 | Who is Ravana's wife? | YES - character facts need citations |
| 6 | How did Jatayu die? | YES - event description needs citations |
| 7 | Who built the bridge to Lanka? | YES - event facts need citations |
| 8 | What weapon killed Ravana? | YES - specific fact needs citation |
| 9 | Who is Dasharatha? | YES - character facts need citations |
| 10 | What is Kishkindha? | YES - location facts need citations |

**For Each Response, Verify**:
1. Open the JSON response
2. Look at the `answer` field
3. Confirm it contains at least ONE pattern matching `[Something-Kanda X.Y]`
4. Count total inline citations (should be 2+ for most answers)

### Step 7.3: Regex Pattern for Verification

Use this regex to detect inline citations in the answer field:

```regex
\[[A-Za-z]+-Kanda\s+\d+\.\d+\]
```

**Explanation**:
- `\[` - Opening bracket
- `[A-Za-z]+` - Kanda name (Bala, Ayodhya, Aranya, etc.)
- `-Kanda` - Literal "-Kanda"
- `\s+` - One or more spaces
- `\d+` - Sarga number
- `\.` - Literal dot
- `\d+` - Shloka number
- `\]` - Closing bracket

**Examples that MATCH**:
- `[Bala-Kanda 1.23]`
- `[Sundara-Kanda 35.12]`
- `[Ayodhya-Kanda 40.5]`

**Examples that DO NOT MATCH**:
- `Bala-Kanda 1.23` (no brackets)
- `[Bala Kanda 1.23]` (missing hyphen)
- `[Bala-Kanda]` (no numbers)

### Step 7.4: Full Evaluation Run

After sample testing passes, run the full evaluation:

1. Use the existing evaluation script
2. Run on the 60-question golden dataset
3. Record the new citation pass rate for OpenAI
4. Compare to baseline (47%)

---

## 8. Success Criteria

### Minimum Success Threshold

| Metric | Before Fix | After Fix (Minimum) | After Fix (Target) |
|--------|------------|---------------------|---------------------|
| OpenAI Citation Pass Rate | 47% | 80% | 90%+ |
| Claude Citation Pass Rate | 87% | 90% | 95%+ |

### Definition of Success

The fix is successful if:

1. **OpenAI citation pass rate increases by at least 30 percentage points** (from 47% to 77%+)
2. **No regression in other metrics** (routing, template compliance, hallucination)
3. **JSON responses remain valid** (no parsing errors introduced)
4. **Claude performance does not decrease** (should stay same or improve)

### Definition of Failure

The fix has failed if:

1. OpenAI citation pass rate does not improve by at least 20 percentage points
2. JSON parsing errors increase
3. Other evaluation metrics decrease by more than 5 percentage points
4. Claude performance decreases

---

## 9. Rollback Plan

### If The Fix Fails

1. **Revert the code changes** in `t1-textual-prompt.ts` and `t2-interpretive-prompt.ts`
2. **Restore from version control** (git revert or checkout previous version)
3. **Verify system returns to baseline behavior** by running 5 test questions
4. **Document what went wrong** for future investigation

### Git Commands for Rollback

```bash
# If using git, revert the specific commit
git revert <commit-hash-of-prompt-changes>

# Or restore specific files
git checkout HEAD~1 -- lib/prompts/t1-textual-prompt.ts
git checkout HEAD~1 -- lib/prompts/t2-interpretive-prompt.ts
```

### Backup Before Making Changes

Before modifying any files:

```bash
# Create backup copies
cp lib/prompts/t1-textual-prompt.ts lib/prompts/t1-textual-prompt.ts.backup
cp lib/prompts/t2-interpretive-prompt.ts lib/prompts/t2-interpretive-prompt.ts.backup
```

---

## Appendix A: Quick Reference Card

### Files To Modify
- `lib/prompts/t1-textual-prompt.ts`
- `lib/prompts/t2-interpretive-prompt.ts`

### Key Addition to Prompts
```
INLINE CITATIONS REQUIRED: You MUST embed citations directly within your "answer" text using the format [Kanda-Name Sarga.Shloka].
```

### Citation Format
- Format: `[Kanda-Name Sarga.Shloka]`
- Example: `[Bala-Kanda 5.12]`
- Example: `[Sundara-Kanda 35.41]`

### Validation Regex
```regex
\[[A-Za-z]+-Kanda\s+\d+\.\d+\]
```

### Success Metric
- OpenAI citation pass rate: 47% → 80%+

---

## Appendix B: Troubleshooting

### Issue: OpenAI Still Not Adding Inline Citations

**Possible Causes**:
1. Prompt changes not deployed
2. Caching serving old prompt
3. Wrong file modified

**Solutions**:
1. Verify the deployed prompt contains "INLINE CITATIONS REQUIRED"
2. Clear any prompt caches
3. Check file path is correct

### Issue: JSON Parsing Errors After Change

**Possible Causes**:
1. Prompt has unescaped characters
2. JSON example in prompt is malformed
3. Template string interpolation broken

**Solutions**:
1. Validate JSON example in prompt is valid JSON
2. Check for unescaped quotes or backslashes
3. Test prompt template with sample values

### Issue: Citations In Wrong Format

**Possible Causes**:
1. Model using different format than specified
2. Example in prompt unclear

**Solutions**:
1. Add more explicit examples in prompt
2. Add "WRONG" and "CORRECT" comparison examples
3. Strengthen the format specification

---

## Appendix C: Verification Commands

### Check If Answer Has Inline Citations (JavaScript)

```javascript
function hasInlineCitations(answerText) {
  const citationRegex = /\[[A-Za-z]+-Kanda\s+\d+\.\d+\]/g;
  const matches = answerText.match(citationRegex);
  return {
    hasCitations: matches !== null && matches.length > 0,
    count: matches ? matches.length : 0,
    citations: matches || []
  };
}

// Usage
const result = hasInlineCitations(response.answer);
console.log(result);
// { hasCitations: true, count: 3, citations: ['[Bala-Kanda 1.23]', ...] }
```

### Check If Answer Has Inline Citations (Python)

```python
import re

def has_inline_citations(answer_text):
    citation_regex = r'\[[A-Za-z]+-Kanda\s+\d+\.\d+\]'
    matches = re.findall(citation_regex, answer_text)
    return {
        'has_citations': len(matches) > 0,
        'count': len(matches),
        'citations': matches
    }

# Usage
result = has_inline_citations(response['answer'])
print(result)
# {'has_citations': True, 'count': 3, 'citations': ['[Bala-Kanda 1.23]', ...]}
```

---

**END OF IMPLEMENTATION GUIDE**
