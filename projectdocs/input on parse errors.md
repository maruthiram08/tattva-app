
## Minimum Sample for Parser Confidence

## Coverage-Based Test (Not Random)

### Must-Include Scenarios (20-25 rows)

|Category|Why|Rows Needed|
|---|---|---|
|T1 questions|Most common|8-10|
|T2 questions|Different template structure|4-5|
|T3 questions|Refusal responses differ|4-5|
|Questions where **both pass**|Baseline|3-4|
|Questions where **both fail**|Different output format|3-4|
|Questions where **one wins**|Comparison logic|3-4|

---

## Green Light Criteria

Run your 25-row coverage test. You're ready to scale when:

```
✅ Zero PARSE_ERROR across all rows
✅ At least 2 T3 questions parsed correctly
✅ At least 2 "both models fail" scenarios parsed correctly
✅ All 20 columns populated for every row
✅ Run it twice consecutively with same results
```

---

## Quick Test Protocol

```
Step 1: Pick 25 questions strategically (not randomly)
        - 10 T1, 5 T2, 5 T3, 5 known-difficult

Step 2: Run evaluation

Step 3: Check for PARSE_ERROR
        grep "PARSE_ERROR" results.csv | wc -l
        → Must be 0

Step 4: Validate all columns exist
        head -1 results.csv | tr ',' '\n' | wc -l
        → Must be 21 (your column count)

Step 5: Check no empty cells
        grep ",," results.csv | wc -l
        → Should be 0 (or only in expected places)

Step 6: Re-run same 25 questions
        → Results should be identical (deterministic)
```

---

## If PARSE_ERROR Appears

Before scaling, debug it:

```python
# Add to your evaluation script temporarily:
try:
    parsed = parse_gemini_response(raw_response)
except Exception as e:
    print(f"FAILED ROW: {question}")
    print(f"RAW RESPONSE: {raw_response[:500]}")
    print(f"ERROR: {e}")
```

Common causes:

|Symptom|Likely Cause|Fix|
|---|---|---|
|PARSE_ERROR on long answers|Response truncated|Increase max_tokens|
|PARSE_ERROR on failures|Different JSON structure for "FAIL"|Handle both formats|
|PARSE_ERROR on T3|Gemini formats refusals differently|Add T3-specific parsing|
|Random PARSE_ERROR|Gemini timeout/retry|Add retry logic|

---

## TL;DR

|Approach|Sample Size|Confidence|
|---|---|---|
|Random sample|30 rows|Low — might miss edge cases|
|**Coverage-based**|**25 rows**|**High — tests all scenarios**|
|Full run and pray|270 rows|Risky — failures mid-run|

**Run 25 strategically-selected rows. Zero PARSE_ERROR = green light to scale.**