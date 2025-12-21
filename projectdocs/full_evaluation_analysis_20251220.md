# 📊 Full Evaluation Analysis - December 20, 2025

## Quick Status

| Evaluator | Target | Actual | Status | Gap |
|-----------|--------|--------|--------|-----|
| Citation Verification | 100% | 98.1% | ⚠️ Near Pass | 1 phantom |
| Routing Accuracy | 90% | **74.1%** | ❌ Fail | ~16% short |
| Template Compliance | 90% | **74.1%** | ❌ Fail | ~16% short |

**Launch Ready: ❌ NOT YET**

---

## 🔍 Detailed Breakdown

### 1. Citation Verification (98.1% - NEAR PASS ⚠️)

**Status**: Only 1 phantom citation detected

| Finding | Detail |
|---------|--------|
| Phantom Citation | `[Ayodhya Kanda 2.118]` doesn't exist in Pinecone |
| Question # | Q12 |
| Impact | Minor - single instance |

**Recommendation**: Simple fix - investigate why this citation was generated and adjust prompt/retrieval.

---

### 2. Routing Accuracy (74.1% - NEEDS WORK ❌)

**Raw Numbers**: 14 routing issues detected (10 hard FAIL + 4 SOFT_FAIL)

#### Failure Pattern Analysis

| Pattern | Count | Questions | Root Cause |
|---------|-------|-----------|------------|
| **Sanskrit terms → Character categories** | 2 | Q17, Q19 | System sees "Dasharatha", "Ikshvaku" and routes to Character instead of Sanskrit term meaning |
| **T3 questions answered as T1** | 1 | Q27 | "Rama born 5114 BC?" should refuse but system routes to Story chronology |
| **Dharma group confusion** | 2 | Q14, Q47 | "Sambuka killing" and "Agni Pariksha" misrouted between duty-driven vs consequences/dilemmas |
| **Story vs Character confusion** | 1 | Q58 | "Contest Rama won" routed to Major plot events instead of Character actions |
| **Popular confusion missed** | 2 | Q21, Q42 | "Shabari berries" and "misinterpretation" not recognized as clarifying confusions |
| **Sarga vs Context confusion** | 1 | Q2 | "Sloka meter origin" routed to Context of verse instead of Sarga overview |
| **Same-group near misses** | 4 | Q10, Q18, Q43 | Right category group, wrong specific category |

#### Priority Fixes (by impact)

1. **HIGH: T3 Detection** (Q27)
   - "5114 BC" contains external historical claim → should trigger T3 refusal
   - Fix: Add pattern for speculative historical dates

2. **HIGH: Sanskrit Term Recognition** (Q17, Q19)
   - "What does X mean?" pattern should trigger "Meaning of key Sanskrit terms"
   - Fix: Add keyword trigger for "what does [name] mean"

3. **MEDIUM: Dharma Subcategory Boundaries** (Q14, Q47)
   - These are genuinely ambiguous between duty-driven and moral dilemmas
   - Fix: Clarify category definitions or accept as acceptable alternatives

---

### 3. Template Compliance (74.1% - NEEDS WORK ❌)

**Raw Numbers**: 15 failures out of ~54 T1/T2 checks

#### Failure Pattern Analysis

| Failure Type | Count | Examples | Description |
|--------------|-------|----------|-------------|
| **Semantic: Unsupported claims** | 10 | Q3, Q4, Q8, Q12, Q25, Q37, Q41, Q42, Q56, Q59 | Claims made that cited shlokas don't actually support |
| **Structural: Missing inline citations** | 3 | Q7, Q10, Q14 | Response lacks required [Kanda X.Y] format |
| **Structural: Missing T2 sections** | 1 | Q47 | T2 response missing "Limit of Certainty" section |
| **Structural: Missing T3 elements** | 1 | Q27 | T3 response missing polite refusal/redirect |

#### Top Semantic Failures (Most Concerning)

| Q# | Question | Failure Reason |
|----|----------|----------------|
| Q3 | Rama at Chitrakoot | Cited shloka doesn't mention Chitrakoot |
| Q4 | Hanuman burn Lanka | Meeting Vibhishana timeline unsupported |
| Q8 | Lakshmana Rekha | Claims not supported by cited shlokas |
| Q37 | Kumbhakarna loyalty | Interpretations beyond what shlokas state |
| Q59 | Vedashruti crossing | Unsupported claim about river crossing |

**Root Cause**: These are all "citation quality" issues - the system is citing shlokas that don't actually support the claims being made. This was identified in Phase A as a retrieval/knowledge gap issue.

---

## 📈 Comparison to Phase A Results

| Metric | Phase A (Dec 19) | Current (Dec 20) | Delta |
|--------|------------------|------------------|-------|
| BOTH_PASS | 51.7% (31/60) | Not measured in new eval | - |
| Citation Presence | 94.2% OpenAI | 98.1% verified | +3.9pp |
| Routing | Not formally tested | 74.1% | New baseline |
| Template | Not formally tested | 74.1% | New baseline |

**Key Insight**: Phase A focused on citation FORMAT (are citations present?). The new evaluation tests citation QUALITY (do citations support claims?). These are different tests!

---

## 🎯 Recommended Fix Priority

### Fix 1: Routing - T3 Detection (HIGH PRIORITY)
**Effort**: Small prompt change
**Impact**: Prevents speculative questions from getting answered

Questions like "Was Rama born in 5114 BC?" need to be caught and refused.

### Fix 2: Routing - Sanskrit Term Recognition (HIGH PRIORITY)
**Effort**: Add classification examples
**Impact**: 2-3 questions fixed

"What does X mean?" should route to Sanskrit terms category.

### Fix 3: Template - Missing Structural Elements (MEDIUM)
**Effort**: Prompt reinforcement
**Impact**: 4-5 questions fixed

Ensure T2 responses include "Limit of Certainty" and inline citations are always present.

### Fix 4: Semantic Quality (HARDER - Phase B Territory)
**Effort**: Retrieval improvements + prompt engineering
**Impact**: 10+ questions

This requires ensuring retrieved shlokas actually support the claims being made. Options:
- Improve retrieval ranking
- Add verification step before responding
- Strengthen "admit when unsure" behavior

---

## ⚠️ Important Context

The 15 template failures are largely **semantic** (claims not supported by citations), not structural. This is the same issue identified in Phase A:

> "The 36.5% gap between OpenAI inline presence (94.2%) and Gemini quality (57.7%) is due to retrieval limitations, not format issues."

The current evaluation is essentially validating that same gap exists when tested programmatically.

---

## 📋 Recommended Next Steps

1. **Quick Wins** (Do Now):
   - Fix phantom citation [Ayodhya Kanda 2.118] - check what Q12 is and why it generated this
   - Add T3 detection for historical date speculation
   - Add Sanskrit term routing pattern

2. **Medium Effort** (This Sprint):
   - Review all 10 semantic failures for patterns
   - Strengthen T2 "Limit of Certainty" requirement
   - Fix structural issues (missing citations)

3. **Larger Effort** (Future Sprints):
   - Improve retrieval to return more relevant shlokas
   - Consider citation verification before response generation
   - Build automated monitoring for these issues

---

## 📁 Summary Table of All Failures

### Routing Failures (14 total: 10 FAIL + 4 SOFT_FAIL)

| Q# | Question | System Category | Expected Category | Type |
|----|----------|-----------------|-------------------|------|
| 2 | Sloka meter origin | Context of a verse | Sarga overview | FAIL |
| 10 | Rama identify Luv Kush | Character actions | Character identity | SOFT_FAIL |
| 14 | Sambuka killing | Duty-driven decisions | Consequences of adharma | FAIL |
| 17 | What does Dasharatha mean | Character identity | Sanskrit terms | FAIL |
| 18 | Anustubh meter | Translation clarification | Sanskrit terms | SOFT_FAIL |
| 19 | What does Ikshvaku mean | Character lineage | Sanskrit terms | FAIL |
| 21 | Shabari berries | Minor episodes | Clarifying confusions | FAIL |
| 27 | Rama born 5114 BC | Story chronology | Why refused (T3) | FAIL |
| 42 | Verses misinterpreted | Multiple interpretations | Clarifying confusions | FAIL |
| 43 | Sita-Rama weapons debate | Moral dilemmas | Duty vs emotion | SOFT_FAIL |
| 47 | Agni Pariksha justification | Duty-driven decisions | Moral dilemmas | FAIL |
| 58 | Contest Rama won | Major plot events | Character actions | FAIL |

### Template Failures (15 total)

| Q# | Question | Template | Structural | Semantic | Failure Reason |
|----|----------|----------|------------|----------|----------------|
| 3 | Rama at Chitrakoot | T1 | PASS | FAIL | Cited shloka doesn't mention Chitrakoot |
| 4 | Hanuman burn Lanka | T1 | PASS | FAIL | Vibhishana meeting timeline unsupported |
| 7 | Svayamprabha episode | T1 | FAIL | FAIL | Missing inline citations |
| 8 | Lakshmana Rekha | T1 | PASS | FAIL | Claims not supported by shlokas |
| 10 | Rama identify Luv Kush | T1 | FAIL | SKIP | Missing inline citation |
| 12 | Urmila sacrifice | T1 | PASS | FAIL | "Perfect union" claim unsupported |
| 14 | Sambuka killing | T1 | FAIL | SKIP | Missing Answer Section |
| 25 | Critical Edition/Vulgate | T1 | PASS | FAIL | Claim not supported by Bala Kanda 4.2 |
| 27 | Rama born 5114 BC | T3 | FAIL | SKIP | Missing polite refusal/redirect |
| 37 | Kumbhakarna loyalty | T1 | PASS | FAIL | Interpretations beyond shloka text |
| 41 | Verse Shloka Meaning | T1 | PASS | FAIL | Inference not directly supported |
| 42 | Verses misinterpreted | T1 | PASS | FAIL | Interpretations, not direct statements |
| 47 | Agni Pariksha | T2 | FAIL | ERROR | Missing "Limit of Certainty" |
| 56 | First Kanda name | T1 | PASS | FAIL | Claim not supported by cited shloka |
| 59 | Vedashruti crossing | T1 | PASS | FAIL | Unsupported river crossing claim |

---

*Analysis generated: December 20, 2025*
