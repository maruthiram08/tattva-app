
### 1. "Good" Rating is Too Vague

Your `openai_rating` and `claude_rating` columns use "Good" - this is the Likert scale problem Hamel warns about.

**Problem**: What does "Good" mean exactly? How is it different from "Great" or "Okay"?

**Better approach**: Binary PASS/FAIL with specific criteria:

- Did it answer the question? PASS/FAIL
- Did it cite relevant shlokas? PASS/FAIL
- Did it follow T1 structure? PASS/FAIL

Replace "Good/Bad" with binary checks:

|Current|Replace With|
|---|---|
|`openai_rating: Good`|`answers_question: PASS`|
||`cites_relevant_shlokas: PASS`|
||`follows_template: PASS`|
||`no_hallucination: PASS`|


---

### 5. Classification Labels Need Standardization

Your `classification` column has:

- "Character identity"
- "Kanda overview"
- "Sarga overview"
- "Timeline sequencing"
- "Return & coronation"
- "Search journey episodes"

But your PRD mentions **45 strict categories**. Are these the actual category names from your classifier? Or are these your own labels?

They should match exactly what your system outputs (e.g., "Character-Factual", "Meta-Structure", etc.)

