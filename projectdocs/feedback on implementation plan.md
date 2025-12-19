
Excellent progress! You now have a proper evaluation system. Let me give you detailed feedback on both the plan and the output.

---

## Testing Plan Review ✓

Your plan is solid. Key strengths:

|Aspect|Status|Notes|
|---|---|---|
|Binary PASS/FAIL|✓|Correctly implemented|
|Per-model checks|✓|OpenAI vs Claude split|
|Detailed checklist|✓|Clear criteria for judge|
|Taxonomy codes|✓|Links failures to categories|
|Verification tests|✓|Schema + row count + validity|

**One addition I'd recommend to your plan:**

Add `expected_template` column to compare against actual `template` used. This catches "correct answer, wrong template" errors.

---

## CSV Output Review - Issues Found 🚨

### Issue 1: PARSE_ERROR Values

Your output has `PARSE_ERROR` in several cells:

```
Row 2: claude_follows_template = PARSE_ERROR
Row 7: claude_retrieval_check, claude_answers_question, 
       claude_cites_shlokas, claude_follows_template = PARSE_ERROR
```

**Root cause**: Gemini judge is returning malformed output that your parser can't handle.

**Fix**: Add error handling in your parsing script + retry logic, or inspect what Gemini is actually returning for those rows.

---

### Issue 2: Inconsistent Value Formatting

Your values are inconsistent:

|Column|Values Found|Problem|
|---|---|---|
|`classification_check`|`[Pass]`|Has brackets|
|`openai_routing_check`|`[Pass]`|Has brackets|
|`classification_suggestion`|`[N/A]` vs `N/A`|Mixed|
|`fail_group_category`|`[None]` vs `None` vs `[3b]`|Mixed|

**Fix**: Standardize in your parser—strip brackets, normalize to `PASS`, `FAIL`, `N/A`, `None`.

---

### Issue 3: Classification Categories Still Non-Standard

Your `classification` column values:

```
- "Search journey episodes"
- "Moral dilemmas in text"
- "Explanation of a verse"
- "Why a question is refused"
- "Sarga overview"
- "Character role in story"
```

**Problem**: These don't look like your 45 PRD categories. They look like human-readable descriptions.

**Your PRD says**: "Classifies questions into 45 strict categories"

**Expected format** (from your taxonomy):

```
- Character-Factual
- Dharma-Debate
- Story-Reasoning
- Out-of-Scope-WrongText
```

**Question**: Is Tattva actually outputting these descriptive names, or is this a mapping issue in your evaluation?

---

### Issue 4: Good News - You're Finding Real Failures!

Now you have actual failures to analyze:

|Question|Failure|Taxonomy Code|
|---|---|---|
|"How does Story Search Journey..."|Claude: `cites_shlokas: Fail`|3b|
|"What ethical tension..."|Both: `cites_shlokas: Fail`|3b|
|"What is the subject of 'Kaccit Sarga'..."|OpenAI: `cites_shlokas: Fail`|3b|
|"What is the basic focus of Story Return..."|Claude: `cites_shlokas: Fail`|3b|
|"What is the basic focus of Story Post War..."|Claude: `cites_shlokas: Fail`|3b|


This is exactly what error analysis should reveal. You now know: **"Claude is failing to cite shlokas more often than OpenAI."**

---

---

## Summary of Fixes Needed

| Priority  | Issue                       | Fix                                       |
| --------- | --------------------------- | ----------------------------------------- |
| 🔴 High   | PARSE_ERROR values          | Add error handling + retry in parser      |
| 🔴 High   | Inconsistent brackets       | Strip `[ ]` and normalize values          |
| 🟡 Medium | Classification names        | Verify these match your 45 PRD categories |
| 🟡 Medium | Missing `expected_template` | Add column to catch template mismatches   |


---

## What's Working Well

1. **Gemini-as-judge is functional** - It's evaluating and finding real issues
2. **Winner determination works** - OpenAI/Claude/Tie being assigned with reasoning
3. **Comments are actionable** - Specific enough to understand why

---

## Immediate Action Items

1. **Fix the parser** to handle PARSE_ERROR cases
2. **Normalize all values** to `PASS` / `FAIL` / `N/A` (no brackets)
3. **Run on 10 more rows** with fixes applied
4. **Verify classification mapping** against your actual 45 categories
5. **Then scale to 270** once output is clean

---

## Sample Clean Output (What It Should Look Like)

```csv
user_query,classification,template,classification_check,classification_suggestion,openai_cites_shlokas,claude_cites_shlokas,fail_group_category
"What is the subject of Kaccit Sarga?",Sarga-Overview,T1,PASS,N/A,FAIL,PASS,3b
"Can you draw Rama?",Out-of-Scope-Request,T3,PASS,N/A,N/A,N/A,None
```

