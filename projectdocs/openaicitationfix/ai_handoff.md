# AI Handoff Document: Phase A OpenAI Citation Fix

> **For**: Future AI agents/developers  
> **Last Updated**: December 19, 2025  
> **Status**: Phase A Complete ✅

---

## Context

The Tattva app is a Ramayana Q&A system. Phase A addressed citation generation issues where OpenAI wasn't including shloka references in answers.

---

## What Was Done

### 1. OpenAI Citation Fix
**Problem**: OpenAI answers lacked inline citations `[Kanda-Name X.Y]`

**Changes Made**:
- `lib/prompts/t1-textual-prompt.ts` - Added explicit citation format instructions
- `lib/prompts/t2-interpretive-prompt.ts` - Same citation instructions
- `app/api/answer/route.ts` - Fixed non-streaming mode to return `full_response`

**Result**: Citation rate 28.8% → 94.2%

### 2. T3 Refusal Evaluation Fix
**Problem**: T3 (out-of-scope) questions incorrectly marked as FAIL

**Changes Made**:
- `scripts/evaluate_with_gemini.py`:
  - Added `check_t3_refusal()` function (lines 227-295)
  - Added T3 post-processing (lines 513-527)
  - Added Tattva-specific refusal patterns

**Result**: T3 pass rate 0% → 100%

---

## Key Files

### Modified Files
| File | What Changed |
|------|-------------|
| `lib/prompts/t1-textual-prompt.ts` | Citation format instructions |
| `lib/prompts/t2-interpretive-prompt.ts` | Citation format instructions |
| `app/api/answer/route.ts` | Non-streaming returns `full_response` |
| `scripts/evaluate_with_gemini.py` | T3 refusal checker, post-processing |

### New Scripts Created
| File | Purpose |
|------|---------|
| `scripts/batch_evaluate_golden.py` | Run 60 questions through API |
| `scripts/smoke_test_citations.py` | Quick 5-question citation test |

### Data Files
| File | Contents |
|------|----------|
| `projectupdates/gemini_evaluation_V3.csv` | Final eval results |
| `projectupdates/golden_responses_AFTER_FIX_2025_12_19_2037.json` | API responses |
| `projectdocs/golden_dataset.csv` | 60 test questions |

---

## Architecture Notes

### Template Types
- **T1** (Textual): Direct text-based answers with citations
- **T2** (Interpretive): Analysis in `whatTextStates`, `traditionalInterpretations`, `limitOfCertainty`
- **T3** (Refusal): Out-of-scope with `why`, `outOfScopeNotice`, `whatICanHelpWith`

### Citation Pattern
```regex
\[[A-Za-z]+[ -]Kanda\s+\d+\.\d+\]
```
Examples: `[Bala-Kanda 1.2]`, `[Yuddha Kanda 6.115]`

---

## How to Test

```bash
# Quick smoke test (5 questions)
python3 scripts/smoke_test_citations.py

# Full 60-question batch
python3 scripts/batch_evaluate_golden.py

# Gemini evaluation
python3 scripts/evaluate_with_gemini.py
```

---

## Known Issues / Future Work

### Phase B+ Items
1. **Retrieval gaps**: When shlokas don't contain the answer, OpenAI honestly says so
2. **Quality vs presence**: 94.2% have citations, 59.6% pass Gemini quality check
3. **"Text does not state" pattern**: Common for obscure topics

### Not Bugs - Working As Designed
- T3 questions showing N/A for citations ✅
- OpenAI admitting "text does not state X" ✅

---

## Gotchas

1. **T2 citations in `whatTextStates`** - Not in `answer` field
2. **T3 uses `why` field** - Not `answer`
3. **Non-streaming mode** - Must return `full_response` for complete data
4. **Gemini rate limits** - 4s delay between API calls

---

## Metrics Reference

| Metric | Baseline | Final |
|--------|----------|-------|
| OpenAI Citation Rate | 28.8% | 94.2% |
| Claude Citation Rate | 46.2% | 86.5% |
| T3 Pass Rate | 0% | 100% |
| BOTH_PASS | 10% | 51.7% |

---

## Quick Reference: File Locations

```
tattvaapp/
├── lib/prompts/           # LLM prompts (T1, T2, T3)
├── app/api/answer/        # Main answer API
├── scripts/               # Evaluation scripts
├── projectdocs/
│   ├── golden_dataset.csv # Test questions
│   └── openaicitationfix/ # This project docs
└── projectupdates/        # Evaluation results
```
