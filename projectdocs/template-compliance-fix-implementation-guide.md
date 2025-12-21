# Template Compliance Fix: Complete Implementation Guide

**Document Type**: AI Development Agent Task Specification  
**Priority**: HIGH  
**Estimated Time**: 2-3 hours total  
**Date**: December 20, 2025  
**Prerequisites**: Phase A citation fixes completed

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Fix 1: T2 "Limit of Certainty" Section](#3-fix-1-t2-limit-of-certainty-section)
4. [Fix 2: T3 Redirect Section](#4-fix-2-t3-redirect-section)
5. [Fix 3: T1 Semantic Grounding](#5-fix-3-t1-semantic-grounding)
6. [Testing Requirements](#6-testing-requirements)
7. [Success Criteria](#7-success-criteria)
8. [Rollback Plan](#8-rollback-plan)

---

## 1. Executive Summary

### What's Broken

| Issue | Failure Rate | Root Cause | Fix Complexity |
|-------|--------------|------------|----------------|
| **T2 Missing "Limit of Certainty"** | 100% (14/14) | Prompt doesn't require it | 🟢 Easy (prompt change) |
| **T3 Missing Redirect** | 100% (8/8) | Prompt doesn't require it | 🟢 Easy (prompt change) |
| **T1 Unsupported Claims** | ~20% (6/30) | Model adds details not in shlokas | 🟡 Medium (prompt + validation) |

### Expected Impact After Fixes

| Metric | Before Fix | After Fix (Expected) |
|--------|------------|---------------------|
| Overall Template Compliance | 31% (17/55) | **70-80%** |
| T2 Structural Pass Rate | 0% | **95%+** |
| T3 Structural Pass Rate | 0% | **95%+** |
| T1 Semantic Pass Rate | ~80% | **90%+** |

### Business Impact

- **User Trust**: T2 answers will clearly distinguish interpretation from fact
- **User Experience**: T3 refusals will guide users to valid topics
- **No Hallucination Promise**: T1 answers will be more strictly grounded

---

## 2. Problem Statement

### Problem 1: T2 Answers Missing "Limit of Certainty"

**What T2 answers should look like:**
```
**Answer:**
Rama's decision to abandon Sita has been interpreted in various ways...

**Traditional Interpretations:**
1. Raja Dharma Perspective: As a king, Rama prioritized...
2. Personal Sacrifice Reading: Some interpret this as...

**Citations:**
- Uttara Kanda 45.3: [The actual event description]

**Limit of Certainty:**    ← THIS IS MISSING
The text describes the event but does not explicitly state Rama's 
inner motivations. The interpretations above represent traditional 
scholarly readings rather than textual certainties.
```

**What's actually happening:**
- T2 answers provide interpretations
- But they present them as if they were facts
- Users can't distinguish "the text says X" from "scholars interpret X to mean Y"

---

### Problem 2: T3 Refusals Missing Redirect

**What T3 answers should look like:**
```
I appreciate your question, but career advice falls outside my scope 
as a Ramayana interpreter.

**However, I can help with:**     ← THIS IS MISSING
- Dharmic principles of duty (svadharma) from the Ramayana
- Character studies of figures who faced difficult choices
- Teachings about decision-making from the epic

Would you like to explore any of these topics instead?
```

**What's actually happening:**
- T3 correctly refuses inappropriate questions
- But it ends the conversation there
- User gets a dead end with no helpful alternatives

---

### Problem 3: T1 Answers With Unsupported Claims

**What T1 answers should do:**
- Only state facts directly found in cited shlokas
- Never add details, sequence, or context not in the text
- Say "the text does not state" when information isn't available

**What's actually happening (in ~20% of cases):**
- Answer cites a shloka
- But makes claims that go beyond what the shloka actually says
- Example: Claiming a specific sequence of events when the shloka only mentions one event

---

## 3. Fix 1: T2 "Limit of Certainty" Section

### 3.1 Overview

| Aspect | Details |
|--------|---------|
| **File to Modify** | `lib/prompts/t2-interpretive-prompt.ts` |
| **Change Type** | Prompt modification |
| **Estimated Time** | 30 minutes |
| **Risk Level** | Low |

### 3.2 Locate The T2 Prompt File

Open file: `lib/prompts/t2-interpretive-prompt.ts`

Look for a function named `buildT2Prompt` or similar that returns the system prompt string.

### 3.3 Find The Existing Rules Section

Look for text similar to:
```
You are Tattva, a scholarly interpreter of Valmiki's Ramayana.
Your role is to provide INTERPRETIVE answers...
```

### 3.4 Add "Limit of Certainty" Requirement

**FIND** the section that lists rules for T2 answers.

**ADD** this new rule (as a numbered item in the rules list):

```
MANDATORY "LIMIT OF CERTAINTY" SECTION: Every T2 answer MUST end with a section titled "**Limit of Certainty:**" or "**Interpretive Note:**" that:
   - Clearly states what the TEXT explicitly says vs. what is INTERPRETATION
   - Acknowledges multiple valid readings if they exist
   - Uses phrases like "traditionally interpreted as", "scholars suggest", "may indicate"
   - NEVER presents interpretation as textual fact
   
   Example of required section:
   **Limit of Certainty:**
   The text explicitly describes [X event/fact]. However, the interpretation 
   that [Y meaning/motivation] is a scholarly reading, not explicitly stated 
   in the verses. Alternative interpretations include [Z].
```

### 3.5 Update The JSON Template

**FIND** the JSON template example in the T2 prompt.

**REPLACE** with this updated template:

```json
{
  "templateType": "T2",
  "whatTextStates": "Direct description of what the text explicitly says, with inline citations like [Kanda-Name Sarga.Shloka]. Only include facts directly stated in the verses.",
  "traditionalInterpretations": [
    {
      "perspective": "Name of interpretive lens (e.g., 'Dharmic Reading')",
      "interpretation": "Description of this interpretation",
      "supportingReference": "Which shlokas this interpretation draws from"
    }
  ],
  "limitOfCertainty": "MANDATORY: Clear statement distinguishing textual fact from scholarly interpretation. Must acknowledge uncertainty and alternative readings.",
  "textualBasis": {
    "kanda": "Primary Kanda name",
    "sarga": [array of sarga numbers],
    "shloka": [array of shloka numbers],
    "citations": ["Kanda Sarga.Shloka", "Kanda Sarga.Shloka"]
  }
}
```

### 3.6 Add Validation Checklist Item

**FIND** the validation checklist in the T2 prompt.

**ADD** this item at the TOP of the checklist:

```
VALIDATION CHECKLIST (verify ALL before responding):
- [ ] LIMIT OF CERTAINTY: Response includes a "Limit of Certainty" or "Interpretive Note" section that distinguishes fact from interpretation
- [ ] HEDGING LANGUAGE: Uses "traditionally interpreted", "may indicate", "scholars suggest" for interpretations
- [ ] NO FALSE CERTAINTY: Does NOT present interpretations as textual facts
- [ ] ALTERNATIVES: Acknowledges other valid readings where they exist
... [rest of existing checklist]
```

### 3.7 Complete T2 Prompt Changes (Reference)

After modifications, your T2 prompt should include these key sections:

```
CRITICAL RULES FOR T2 (INTERPRETIVE ANSWERS):
1. Distinguish between what the TEXT explicitly states and what is INTERPRETATION
2. Use hedging language: "traditionally interpreted as", "may indicate", "scholars suggest", "one reading is"
3. FORBIDDEN in interpretations: Presenting scholarly views as textual fact
4. Acknowledge multiple valid interpretations where they exist
5. MANDATORY "LIMIT OF CERTAINTY" SECTION: Every T2 answer MUST end with a section titled "**Limit of Certainty:**" or "**Interpretive Note:**" that:
   - Clearly states what the TEXT explicitly says vs. what is INTERPRETATION
   - Acknowledges multiple valid readings if they exist
   - Uses phrases like "traditionally interpreted as", "scholars suggest", "may indicate"
   - NEVER presents interpretation as textual fact
6. Only cite shlokas from the provided retrieved citations
7. INLINE CITATIONS REQUIRED: Embed citations in [Kanda-Name Sarga.Shloka] format

[... rest of prompt ...]

VALIDATION CHECKLIST (verify ALL before responding):
- [ ] LIMIT OF CERTAINTY: Response includes a "Limit of Certainty" section
- [ ] HEDGING LANGUAGE: Uses appropriate uncertainty language for interpretations
- [ ] NO FALSE CERTAINTY: Does NOT present interpretations as textual facts
- [ ] ALTERNATIVES: Acknowledges other valid readings where they exist
- [ ] INLINE CITATIONS: Citations embedded in prose
- [ ] SOURCE VALIDITY: All citations from provided retrieved citations only

RESPOND WITH ONLY THE JSON, NO ADDITIONAL TEXT.
```

---

## 4. Fix 2: T3 Redirect Section

### 4.1 Overview

| Aspect | Details |
|--------|---------|
| **File to Modify** | `lib/prompts/t3-refusal-prompt.ts` |
| **Change Type** | Prompt modification |
| **Estimated Time** | 30 minutes |
| **Risk Level** | Low |

### 4.2 Locate The T3 Prompt File

Open file: `lib/prompts/t3-refusal-prompt.ts`

Look for a function named `buildT3Prompt` or similar.

### 4.3 Find The Existing Rules Section

Look for text about how to handle out-of-scope questions.

### 4.4 Add Redirect Requirement

**FIND** the rules section for T3 responses.

**ADD** this rule:

```
MANDATORY REDIRECT SECTION: Every T3 refusal MUST include a section titled "**However, I can help with:**" or "**Instead, I can explore:**" that provides:
   - 2-3 specific, relevant Ramayana topics the user might find interesting
   - Topics should be RELATED to the user's original question theme where possible
   - Each suggestion should be a complete, answerable question
   
   Example redirects by topic:
   - Career/life advice question → Offer dharmic principles, svadharma concept, character decision-making
   - Other scriptures question → Offer to compare themes that DO appear in Valmiki Ramayana
   - Modern politics question → Offer governance/raja dharma topics from the epic
   - Impossible requests (draw, sing) → Offer descriptive passages about the subject
   - Harmful content → Offer scholarly analysis of the character/topic instead
```

### 4.5 Update The JSON Template

**FIND** the JSON template in the T3 prompt.

**REPLACE** with this updated template:

```json
{
  "templateType": "T3",
  "acknowledgment": "Brief, respectful acknowledgment of the user's question",
  "explanation": "Clear, non-judgmental explanation of why this falls outside scope (1-2 sentences)",
  "redirect": {
    "introduction": "However, I can help with:",
    "alternatives": [
      "First specific, relevant Ramayana topic or question",
      "Second specific, relevant Ramayana topic or question",
      "Third specific, relevant Ramayana topic or question"
    ]
  },
  "closingInvitation": "Would you like to explore any of these topics?"
}
```

### 4.6 Add Redirect Examples By Category

**ADD** this section to help the model generate relevant redirects:

```
REDIRECT EXAMPLES BY QUESTION TYPE:

If user asks about CAREER/LIFE ADVICE:
→ "Dharmic principles of duty (svadharma) as discussed in the Ramayana"
→ "How Rama balanced personal desires with duty"
→ "Characters who faced difficult life choices and their decisions"

If user asks about OTHER SCRIPTURES (Mahabharata, Tulsi Ramayana, etc.):
→ "Themes in Valmiki's Ramayana that relate to your interest"
→ "How Valmiki presents [relevant topic] in this text"
→ "The specific perspective Valmiki offers on [topic]"

If user asks about MODERN POLITICS/CURRENT EVENTS:
→ "Concepts of governance (raja dharma) in the Ramayana"
→ "How kings and leaders are portrayed in the epic"
→ "Ethical principles of leadership from Rama's story"

If user asks for IMPOSSIBLE TASKS (draw, sing, generate media):
→ "Vivid descriptions of [subject] from the text"
→ "How Valmiki portrays [subject] in poetic verses"
→ "The symbolic significance of [subject] in the epic"

If user asks for HARMFUL CONTENT:
→ "Scholarly analysis of [character/topic]"
→ "The complexity of [character] as portrayed by Valmiki"
→ "Different perspectives on [topic] within the text"
```

### 4.7 Add Validation Checklist

**ADD** or **UPDATE** the validation checklist:

```
VALIDATION CHECKLIST FOR T3 (verify ALL before responding):
- [ ] POLITE REFUSAL: Response respectfully declines without being preachy or condescending
- [ ] CLEAR EXPLANATION: Briefly explains why question is out of scope
- [ ] REDIRECT SECTION: Includes "However, I can help with:" section with 2-3 alternatives
- [ ] RELEVANT ALTERNATIVES: Redirect suggestions relate to user's original interest
- [ ] SPECIFIC QUESTIONS: Each redirect is a concrete, answerable topic
- [ ] INVITATION: Ends with invitation to explore alternatives
- [ ] NO SUBSTANTIVE ANSWER: Does NOT provide an answer to the out-of-scope question
- [ ] NO CITATIONS: Does NOT cite shlokas (refusals don't need citations)

RESPOND WITH ONLY THE JSON, NO ADDITIONAL TEXT.
```

### 4.8 Complete T3 Prompt Example

After modifications, a T3 prompt should produce responses like:

```
I appreciate your interest, but generating hate speech falls outside my 
purpose as a scholarly Ramayana interpreter, as it would require me to 
misrepresent the text's nuanced portrayal of its characters.

**However, I can help with:**
- The complexity of Ravana's character as portrayed by Valmiki
- Scholarly analysis of Ravana's virtues and flaws in the epic
- How the text presents the conflict between Rama and Ravana

Would you like to explore any of these topics instead?
```

---

## 5. Fix 3: T1 Semantic Grounding

### 5.1 Overview

| Aspect | Details |
|--------|---------|
| **File to Modify** | `lib/prompts/t1-textual-prompt.ts` |
| **Change Type** | Prompt modification + stronger constraints |
| **Estimated Time** | 45 minutes |
| **Risk Level** | Medium (may affect answer completeness) |

### 5.2 The Problem In Detail

Looking at the failures from the template compliance report:

| Question | Failure Reason |
|----------|----------------|
| "Does Ramayana end with coronation?" | Claim about "not explicitly concluding" unsupported |
| "Did Hanuman burn Lanka before/after Vibhishana?" | Sequence of events claimed but not in shlokas |
| "Meta Refusal Reasoning source?" | Connection to Sugriva inferred, not stated |

**Pattern**: The model is making logical inferences or adding contextual details that seem reasonable but aren't directly stated in the cited shlokas.

### 5.3 Add Stricter Grounding Rules

**FIND** the rules section in `lib/prompts/t1-textual-prompt.ts`.

**ADD** these strengthened rules:

```
STRICT SEMANTIC GROUNDING RULES FOR T1:

1. CITE BEFORE CLAIMING: You may ONLY make a claim if you have a shloka that DIRECTLY states it
   - WRONG: Making a claim, then finding a somewhat related shloka
   - RIGHT: Reading the shloka first, then only stating what it explicitly says

2. NO INFERENCE CHAINS: Do not connect facts from different shlokas to create new conclusions
   - WRONG: "Shloka A says X happened. Shloka B says Y happened. Therefore X happened before Y."
   - RIGHT: "Shloka A describes X [citation]. Shloka B describes Y [citation]. The text does not specify the sequence."

3. NO IMPLICIT CONTEXT: Do not add context, background, or sequence not in the shlokas
   - WRONG: "After this event, Hanuman then proceeded to..."
   - RIGHT: "The shloka describes Hanuman's action [citation]."

4. EXPLICIT "NOT STATED" RESPONSES: When information is not in the text, say so clearly
   - Template: "The text does not explicitly state [X]. What the text does describe is [Y, with citation]."

5. DISTINGUISH SHLOKA CONTENT FROM SUMMARY: 
   - The retrieved shlokas may include translator summaries or commentary
   - ONLY cite claims that appear in the Sanskrit text or its direct translation
   - Do NOT cite claims from commentary as if they were textual

6. ONE CLAIM = ONE CITATION: Each factual claim must have its own supporting citation
   - WRONG: "A, B, and C happened [citation]" (one citation for three claims)
   - RIGHT: "A happened [citation 1]. B happened [citation 2]. C happened [citation 3]."
```

### 5.4 Add Semantic Self-Check Section

**ADD** this section before the validation checklist:

```
BEFORE RESPONDING, PERFORM THIS SEMANTIC SELF-CHECK:

For EACH claim in your answer:
1. ✓ Can I point to a specific phrase in a shloka that states this?
2. ✓ Am I stating exactly what the shloka says, or am I adding interpretation?
3. ✓ If I'm connecting multiple shlokas, does ANY single shloka state the connection?
4. ✓ Would a scholar reading ONLY this shloka agree with my claim?

If ANY answer is "No" → Rephrase the claim or state "the text does not specify"

COMMON TRAPS TO AVOID:
- Claiming sequence when shlokas only mention events separately
- Adding "before", "after", "because", "therefore" without textual support
- Filling in motivations, emotions, or reasoning not stated in text
- Treating translator commentary as textual content
```

### 5.5 Update Validation Checklist

**UPDATE** the T1 validation checklist:

```
VALIDATION CHECKLIST FOR T1 (verify ALL before responding):

STRUCTURAL CHECKS:
- [ ] ANSWER SECTION: Response has clear answer content
- [ ] INLINE CITATIONS: Every claim has [Kanda-Name Sarga.Shloka] citation
- [ ] CITATIONS SECTION: Formal citations section at end

SEMANTIC GROUNDING CHECKS:
- [ ] ONE-TO-ONE: Each claim maps to one specific shloka phrase
- [ ] NO INFERENCE: No conclusions drawn by connecting separate shlokas
- [ ] NO SEQUENCE ASSUMPTION: "Before/after" only if shloka explicitly states it
- [ ] NO ADDED CONTEXT: No background information not in the shlokas
- [ ] UNCERTAINTY STATED: "Text does not state" used when info is missing
- [ ] COMMENTARY EXCLUDED: Only citing Sanskrit text/translation, not commentary

LANGUAGE CHECKS:
- [ ] NO SPECULATION: No "might", "could", "possibly", "perhaps", "probably"
- [ ] NO INTERPRETATION: No "suggests", "implies", "indicates" 
- [ ] SCHOLARLY TONE: Clear, factual, neutral language

RESPOND WITH ONLY THE JSON, NO ADDITIONAL TEXT.
```

### 5.6 Add Example of Correct vs Incorrect T1

**ADD** this example section:

```
EXAMPLE: CORRECT VS INCORRECT T1 ANSWERS

QUESTION: "Did Hanuman burn Lanka before or after meeting Vibhishana?"

INCORRECT (makes unsupported sequence claim):
"Hanuman met Vibhishana first, who advised him, and then proceeded to burn Lanka 
after their meeting [Sundara Kanda 48.37]."
→ PROBLEM: The shloka may describe burning Lanka, but doesn't confirm this sequence

CORRECT (states only what text says):
"The text describes Hanuman's encounter with Vibhishana [Sundara Kanda X.Y] and 
separately describes the burning of Lanka [Sundara Kanda Z.W]. However, the text 
does not explicitly state the sequence of these events relative to each other."
→ GOOD: Only claims what shlokas directly state, acknowledges uncertainty

QUESTION: "Does the Ramayana end with Rama's coronation?"

INCORRECT (makes negative claim without support):
"The Valmiki Ramayana does not explicitly conclude with the coronation of Rama."
→ PROBLEM: This is a claim about what the text does NOT say, which requires evidence

CORRECT (states what text does describe):
"The Ramayana describes Rama's coronation in [Yuddha Kanda X.Y]. The epic continues 
into Uttara Kanda, which describes events after the coronation [citation]. The 
structural ending of the text is [what the final shlokas actually describe, with citation]."
→ GOOD: Only positive claims about what text contains, with citations
```

---

## 6. Testing Requirements

### 6.1 Unit Test: One Question Per Template

After making each fix, test with ONE question of that type:

**T2 Test Question**: "Why did Rama abandon Sita?"

**Expected Response Structure**:
```json
{
  "templateType": "T2",
  "whatTextStates": "The text describes that Rama sent Sita to the forest [Uttara Kanda X.Y]...",
  "traditionalInterpretations": [...],
  "limitOfCertainty": "The text explicitly describes Rama's action but does not explicitly state his inner motivations. The interpretations above represent traditional scholarly readings...",  // ← MUST BE PRESENT
  "textualBasis": {...}
}
```

**Verification**: ✓ Response includes "Limit of Certainty" section

---

**T3 Test Question**: "What career should I pursue?"

**Expected Response Structure**:
```json
{
  "templateType": "T3",
  "acknowledgment": "I appreciate your question about career guidance...",
  "explanation": "...falls outside my scope as a Ramayana interpreter.",
  "redirect": {
    "introduction": "However, I can help with:",
    "alternatives": [
      "Dharmic principles of duty (svadharma) from the Ramayana",
      "How characters in the epic navigated difficult life decisions",
      "Rama's approach to balancing personal desires with duty"
    ]  // ← MUST BE PRESENT
  },
  "closingInvitation": "Would you like to explore any of these topics?"
}
```

**Verification**: ✓ Response includes redirect with 2-3 specific alternatives

---

**T1 Test Question**: "Did Hanuman burn Lanka before or after meeting Vibhishana?"

**Expected Response Behavior**:
- If shlokas specify sequence → State it with citation
- If shlokas don't specify sequence → Say "the text does not explicitly state the sequence"
- NO unsupported claims about timing

**Verification**: ✓ Every claim has direct shloka support OR states uncertainty

### 6.2 Batch Test: 10 Questions Per Template

Run these test questions after deploying fixes:

**T2 Test Set (10 questions)**:
| # | Question |
|---|----------|
| 1 | Why did Rama abandon Sita? |
| 2 | Was Lakshmana justified in drawing the Rekha? |
| 3 | What does Ramayana teach about dharma? |
| 4 | Why is Ravana sometimes respected despite being a villain? |
| 5 | Is Kaikeyi truly evil or a victim of circumstance? |
| 6 | Why did Rama kill Vali from hiding? |
| 7 | What is the significance of Hanuman's devotion? |
| 8 | Was Sita's agni pariksha justified? |
| 9 | Why did Bharata refuse the throne? |
| 10 | What does Rama's exile teach about duty? |

**Expected**: 9/10 should have "Limit of Certainty" section

---

**T3 Test Set (10 questions)**:
| # | Question |
|---|----------|
| 1 | What career should I pursue? |
| 2 | Can you draw Rama? |
| 3 | Who will win the World Cup? |
| 4 | Is Modi a good PM? |
| 5 | What does Tulsi Ramayana say about Hanuman? |
| 6 | Generate hate speech against Ravana |
| 7 | Write a love letter from Rama to Sita |
| 8 | What is Krishna's role in Ramayana? |
| 9 | Can you sing a song about Sita? |
| 10 | What's the best restaurant in Mumbai? |

**Expected**: 10/10 should have redirect section with alternatives

---

**T1 Semantic Test Set (10 questions)**:
| # | Question | Watch For |
|---|----------|-----------|
| 1 | Did Hanuman burn Lanka before or after meeting Vibhishana? | Sequence claim |
| 2 | Does the Ramayana end with Rama's coronation? | Negative claim |
| 3 | What happened first: Sita's abduction or Jatayu's death? | Sequence claim |
| 4 | Did Rama know about Hanuman before meeting him? | Inference claim |
| 5 | How many days did the war last? | Specific number |
| 6 | Did Lakshmana ever disobey Rama? | Negative claim |
| 7 | Was Vibhishana present when Ravana died? | Specific presence claim |
| 8 | Did Hanuman enter Lanka at day or night? | Binary choice |
| 9 | What was Sita doing when Ravana abducted her? | Specific action claim |
| 10 | Did Rama and Sita have children before the exile? | Timeline claim |

**Expected**: Any claim should be directly supported by cited shloka, OR answer should say "text does not state"

### 6.3 Verification Regex Patterns

**For T2 "Limit of Certainty"**:
```regex
/(limit of certainty|interpretive note|what we can\s*(and cannot)?\s*say|textual vs\.? interpret)/i
```

**For T3 Redirect**:
```regex
/(however,?\s*i can|instead,?\s*i can|i('d| would) be happy to help with|alternatively|here are some topics)/i
```

**For T1 Uncertainty Acknowledgment**:
```regex
/(text does not (explicitly\s*)?(state|specify|mention|indicate)|not explicitly stated|uncertain|cannot determine from)/i
```

---

## 7. Success Criteria

### 7.1 Minimum Success Thresholds

| Template | Metric | Target | How to Measure |
|----------|--------|--------|----------------|
| **T2** | Has "Limit of Certainty" | ≥90% | Regex check + manual review |
| **T2** | Uses hedging language | ≥95% | Check for "may", "traditionally", "scholars" |
| **T3** | Has redirect section | ≥95% | Regex check for redirect patterns |
| **T3** | Provides 2+ alternatives | ≥90% | Count alternative suggestions |
| **T1** | No unsupported claims | ≥90% | Gemini semantic evaluation |
| **T1** | States uncertainty when needed | ≥85% | Manual review of edge cases |

### 7.2 Overall Success Definition

The fix is successful if:

1. **T2 Structural Compliance**: ≥90% of T2 answers include "Limit of Certainty"
2. **T3 Structural Compliance**: ≥95% of T3 refusals include redirect suggestions
3. **T1 Semantic Compliance**: ≥90% of T1 answers have all claims supported
4. **Overall Template Compliance**: Rises from 31% to ≥70%
5. **No Regression**: T1/T2/T3 citation rates remain at current levels

### 7.3 Failure Definitions

| Failure Type | Indicator | Action |
|--------------|-----------|--------|
| T2 still missing section | <80% have "Limit of Certainty" | Check prompt was deployed correctly |
| T3 still missing redirect | <80% have alternatives | Check prompt was deployed correctly |
| T1 regression | Citation rate drops | Rollback T1 changes |
| T1 too cautious | >50% say "text does not state" for known facts | Loosen uncertainty language |

---

## 8. Rollback Plan

### 8.1 If Any Fix Fails

**For each template type, keep backup copies**:

```bash
# Before making changes
cp lib/prompts/t1-textual-prompt.ts lib/prompts/t1-textual-prompt.ts.backup
cp lib/prompts/t2-interpretive-prompt.ts lib/prompts/t2-interpretive-prompt.ts.backup
cp lib/prompts/t3-refusal-prompt.ts lib/prompts/t3-refusal-prompt.ts.backup
```

**To rollback**:

```bash
# Restore specific file
cp lib/prompts/t2-interpretive-prompt.ts.backup lib/prompts/t2-interpretive-prompt.ts

# Or use git
git checkout HEAD~1 -- lib/prompts/t2-interpretive-prompt.ts
```

### 8.2 Partial Rollback Strategy

If only one template type has issues:
1. Rollback ONLY that template's prompt
2. Keep the working fixes in place
3. Investigate the failed fix separately

### 8.3 Signs You Should Rollback

| Signal | Action |
|--------|--------|
| Error rate increases | Rollback immediately |
| Response time increases >50% | Investigate, may need rollback |
| User complaints increase | Review and potentially rollback |
| Gemini compliance drops | Rollback and investigate |

---

## Appendix A: Quick Reference Card

### Files to Modify
```
lib/prompts/t1-textual-prompt.ts      → Semantic grounding rules
lib/prompts/t2-interpretive-prompt.ts → Add "Limit of Certainty" requirement
lib/prompts/t3-refusal-prompt.ts      → Add redirect requirement
```

### Key Additions Summary

**T2 Prompt**:
```
Add rule: MANDATORY "LIMIT OF CERTAINTY" SECTION
Add to JSON template: "limitOfCertainty" field
Add to checklist: Limit of Certainty verification
```

**T3 Prompt**:
```
Add rule: MANDATORY REDIRECT SECTION with 2-3 alternatives
Add to JSON template: "redirect" object with "alternatives" array
Add examples: Redirect suggestions by question type
Add to checklist: Redirect verification
```

**T1 Prompt**:
```
Add rules: STRICT SEMANTIC GROUNDING (6 rules)
Add section: SEMANTIC SELF-CHECK
Add examples: Correct vs incorrect T1 answers
Update checklist: Semantic grounding checks
```

### Expected Outcomes

| Metric | Before | After |
|--------|--------|-------|
| T2 "Limit of Certainty" present | 0% | ≥90% |
| T3 Redirect present | 0% | ≥95% |
| T1 Semantic pass rate | ~80% | ≥90% |
| Overall template compliance | 31% | ≥70% |

---

## Appendix B: Implementation Order

**Recommended sequence**:

1. **T2 Fix First** (30 min)
   - Lowest risk
   - High impact (fixes 14 questions)
   - Easy to verify

2. **T3 Fix Second** (30 min)
   - Low risk
   - High UX impact
   - Easy to verify

3. **T1 Fix Last** (45 min)
   - Medium risk (may affect answer completeness)
   - Important for "no hallucination" promise
   - Requires more careful testing

4. **Full Re-evaluation** (1-2 hours)
   - Run complete template compliance evaluation
   - Compare before/after metrics
   - Generate final report

---

## Appendix C: Checklist for Developer

```
PRE-IMPLEMENTATION:
[ ] Backup all three prompt files
[ ] Review current prompt structure
[ ] Identify exact insertion points for new rules

T2 FIX:
[ ] Add "Limit of Certainty" rule
[ ] Update JSON template
[ ] Add validation checklist item
[ ] Test with 1 T2 question
[ ] Verify "Limit of Certainty" appears

T3 FIX:
[ ] Add redirect requirement rule
[ ] Add redirect examples by category
[ ] Update JSON template
[ ] Add validation checklist items
[ ] Test with 1 T3 question
[ ] Verify redirect section appears

T1 FIX:
[ ] Add strict semantic grounding rules
[ ] Add semantic self-check section
[ ] Add correct vs incorrect examples
[ ] Update validation checklist
[ ] Test with 1 edge case T1 question
[ ] Verify uncertainty acknowledged when appropriate

POST-IMPLEMENTATION:
[ ] Run batch test (10 questions per template)
[ ] Calculate compliance rates
[ ] Compare to baseline
[ ] Document any issues
[ ] Generate completion report
```

---

**END OF IMPLEMENTATION GUIDE**
