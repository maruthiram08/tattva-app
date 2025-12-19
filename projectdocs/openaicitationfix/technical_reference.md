# Technical Reference: Evaluation System

> **Last Updated**: December 19, 2025

---

## Evaluation Pipeline

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Golden      │────▶│  Batch       │────▶│  Gemini      │
│  Dataset     │     │  Evaluate    │     │  Evaluate    │
│  (60 Q's)    │     │  (API calls) │     │  (LLM judge) │
└──────────────┘     └──────────────┘     └──────────────┘
                            │                    │
                            ▼                    ▼
                     golden_responses.json    evaluation.csv
```

---

## Scripts

### `batch_evaluate_golden.py`
Calls the Tattva API for each question in the golden dataset.

**Input**: `projectdocs/golden_dataset.csv`  
**Output**: `projectupdates/golden_responses_AFTER_FIX_{timestamp}.json`

**Key Functions**:
- `extract_answer_info()` - Extracts citations from answer and whatTextStates
- Calls both OpenAI and Claude for each question
- Tracks citation counts per template type

### `evaluate_with_gemini.py`
Uses Gemini as an LLM judge to evaluate response quality.

**Input**: `projectupdates/golden_for_gemini_eval_v3.csv`  
**Output**: `projectupdates/gemini_evaluation_V3.csv`

**Key Functions**:
- `check_t3_refusal()` - Evaluates T3 refusal behavior
- `parse_evaluation()` - Parses Gemini's XML response
- `clean_value()` - Normalizes PASS/FAIL/N/A values

**T3 Post-Processing** (lines 513-527):
```python
if expected_template == 'T3':
    eval_result['openai_cites_shlokas'] = 'N/A'
    eval_result['claude_cites_shlokas'] = 'N/A'
    eval_result['openai_retrieval_check'] = 'N/A'
    eval_result['claude_retrieval_check'] = 'N/A'
    eval_result['openai_answers_question'] = check_t3_refusal(openai_answer)
    eval_result['claude_answers_question'] = check_t3_refusal(claude_answer)
```

---

## T3 Refusal Detection

The `check_t3_refusal()` function uses pattern matching:

**Refusal Patterns** (should PASS):
```python
[
    r'outside (my|the) scope',
    r'beyond (my|the) scope',
    r'tattva.*(focus|specialize|interpret)',
    r'does not engage in',
    # ... more patterns
]
```

**Substantive Answer Patterns** (should FAIL):
```python
[
    r'\[[A-Za-z]+[ -]Kanda\s+\d+\.\d+\]',  # Has citations
    r'according to (the text|valmiki|the ramayana)',
    # ... more patterns
]
```

**Logic**: PASS if has_refusal AND NOT has_substantive

---

## CSV Column Reference

### Evaluation Output (`gemini_evaluation_V3.csv`)

| Column | Values | Description |
|--------|--------|-------------|
| `user_query` | text | Original question |
| `expected_template` | T1/T2/T3 | Template type |
| `openai_routing_check` | PASS/FAIL | Correct category? |
| `openai_retrieval_check` | PASS/FAIL/N/A | Good shlokas retrieved? |
| `openai_answers_question` | PASS/FAIL | Answers the question? |
| `openai_cites_shlokas` | PASS/FAIL/N/A | Has proper citations? |
| `openai_follows_template` | PASS/FAIL | Follows T1/T2/T3 format? |
| `openai_no_hallucination` | PASS/FAIL | No invented content? |
| `winner` | OPENAI/CLAUDE/TIE/NO_WINNER | Which model won |

---

## API Response Structure

### T1 (Textual)
```json
{
  "templateType": "T1",
  "answer": "Text with [Kanda-Name X.Y] citations..."
}
```

### T2 (Interpretive)
```json
{
  "templateType": "T2",
  "answer": "Brief summary...",
  "whatTextStates": "Detailed analysis with [citations]...",
  "traditionalInterpretations": "...",
  "limitOfCertainty": "..."
}
```

### T3 (Refusal)
```json
{
  "templateType": "T3",
  "outOfScopeNotice": "This falls outside...",
  "why": "Tattva focuses on...",
  "whatICanHelpWith": ["alternative topic 1", "..."]
}
```

---

## Configuration

### `evaluate_with_gemini.py` Config (lines 22-28)
```python
INPUT_FILE = "projectupdates/golden_for_gemini_eval_v3.csv"
OUTPUT_FILE = "projectupdates/gemini_evaluation_V3.csv"
MODEL_NAME = "gemini-2.0-flash"
DELAY_SECONDS = 4  # Rate limiting
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| T3 showing FAIL | Check if `check_t3_refusal()` patterns match |
| Citations not found | Check `whatTextStates` for T2, `why` for T3 |
| Rate limit errors | Increase `DELAY_SECONDS` |
| Parse errors | Check Gemini output format in `parse_evaluation()` |
