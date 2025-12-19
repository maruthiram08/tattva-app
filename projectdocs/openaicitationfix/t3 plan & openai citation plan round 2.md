
# AI Agent Task Plan: Fix T3 Evaluation & Investigate OpenAI Citations

**For**: AI Development Agent **Priority**: HIGH **Estimated Time**: 2-3 hours total

---

## 📋 Overview

You have two tasks:

|Task|Goal|Expected Impact|
|---|---|---|
|**Task 1**: Fix T3 Evaluation|7/8 T3 questions pass|BOTH_PASS: 41% → ~47%|
|**Task 2**: Investigate OpenAI Citations|Understand quality gap|Determine if fixable|

---

## 🎯 TASK 1: Fix T3 "answers_question" Logic

### What's Wrong Now

T3 questions are **refusal questions** (out-of-scope). The models correctly refuse to answer, but the evaluation says they FAIL because:

1. `cites_shlokas` = FAIL (should be N/A - refusals don't need citations)
2. `retrieval_check` = FAIL (should be N/A - refusals don't need retrieval)
3. `answers_question` = FAIL (checking for normal answer, should check for proper refusal)

### What You Need To Fix

**File to modify**: `scripts/evaluate_with_gemini.py` (or similar evaluation script)

### Step-by-Step Instructions

#### Step 1.1: Find the evaluation script

```bash
# Search for the Gemini evaluation script
find . -name "*gemini*.py" -o -name "*evaluate*.py" | head -20

# Or look in common locations
ls -la scripts/
ls -la lib/evaluation/
```

**Look for**: File that calls Gemini API to evaluate responses

#### Step 1.2: Read the current evaluation logic

Open the file and find where evaluation checks are performed. Look for code that sets:

- `openai_cites_shlokas`
- `claude_cites_shlokas`
- `openai_answers_question`
- `claude_answers_question`

#### Step 1.3: Add T3 detection

First, you need to detect if a question is T3. Add this function:

```python
def is_t3_question(question_data):
    """
    Check if this question should be treated as T3 (refusal).
    
    Args:
        question_data: dict with question info including expected_template
    
    Returns:
        bool: True if this is a T3 refusal question
    """
    expected_template = question_data.get('expected_template', '')
    return expected_template == 'T3'
```

#### Step 1.4: Add T3 refusal checker function

Add this function to check if a T3 response properly refuses:

```python
import re

def check_t3_refusal(answer_text):
    """
    Check if a T3 response properly refuses and redirects.
    
    A good T3 response should:
    1. Politely decline to answer
    2. Explain why (out of scope)
    3. Offer alternative topics
    4. NOT provide a substantive answer about Ramayana
    
    Args:
        answer_text: The model's response text
    
    Returns:
        str: 'PASS' if proper refusal, 'FAIL' if not
    """
    if not answer_text:
        return 'FAIL'
    
    answer_lower = answer_text.lower()
    
    # Patterns that indicate proper refusal
    refusal_patterns = [
        r'outside (my|the) scope',
        r'beyond (my|the) scope',
        r'falls outside',
        r'cannot (help|assist|answer|provide)',
        r"can't (help|assist|answer|provide)",
        r'not (within|in) my (scope|purview|expertise)',
        r"i'm (designed|meant|built|created) to",
        r'i am (designed|meant|built|created) to',
        r'not able to (help|assist|answer)',
        r'unable to (help|assist|answer)',
        r'this (is|falls) outside',
        r'i specialize in',
        r'my focus is',
        r'my expertise is limited to',
    ]
    
    # Patterns that indicate redirect to valid topics
    redirect_patterns = [
        r'however,? i can',
        r'instead,? i (can|could)',
        r"i'd be happy to help with",
        r'i would be happy to help with',
        r'i can help (you )?(with|explore)',
        r'would you like (me )?to',
        r'here are some (topics|questions|areas)',
        r'you might (want to )?ask',
        r'consider asking',
        r'i can (discuss|explain|explore)',
    ]
    
    # Patterns that would FAIL T3 (gave substantive answer)
    substantive_answer_patterns = [
        r'\[[A-Za-z]+[ -]Kanda\s+\d+\.\d+\]',  # Has inline citations
        r'according to (the text|valmiki|the ramayana)',
        r'the text (states|says|describes|mentions)',
        r'the shloka (mentions|indicates|states|says)',
        r'in the ramayana,',
        r'valmiki (describes|writes|tells|narrates)',
    ]
    
    # Check for refusal language
    has_refusal = any(re.search(pattern, answer_lower) for pattern in refusal_patterns)
    
    # Check for redirect
    has_redirect = any(re.search(pattern, answer_lower) for pattern in redirect_patterns)
    
    # Check for substantive answer (bad for T3)
    has_substantive = any(re.search(pattern, answer_lower) for pattern in substantive_answer_patterns)
    
    # T3 passes if: has refusal language AND no substantive answer
    # Redirect is optional but good
    if has_refusal and not has_substantive:
        return 'PASS'
    elif has_substantive:
        return 'FAIL'  # Should not provide substantive answer
    else:
        return 'FAIL'  # No clear refusal language
```

#### Step 1.5: Modify the main evaluation logic

Find where checks are evaluated and add T3 conditional logic:

```python
def evaluate_single_response(question_data, openai_response, claude_response, trace_data):
    """
    Evaluate responses from both models.
    """
    results = {}
    
    # Check if this is a T3 question
    is_t3 = is_t3_question(question_data)
    
    # Get answer texts
    openai_answer = openai_response.get('answer', '') or openai_response.get('whatTextStates', '')
    claude_answer = claude_response.get('answer', '') or claude_response.get('whatTextStates', '')
    
    if is_t3:
        # ===== T3 SPECIAL HANDLING =====
        
        # Skip citation checks (N/A for refusals)
        results['openai_cites_shlokas'] = 'N/A'
        results['claude_cites_shlokas'] = 'N/A'
        
        # Skip retrieval checks (N/A for refusals)
        results['openai_retrieval_check'] = 'N/A'
        results['claude_retrieval_check'] = 'N/A'
        
        # Check for proper refusal behavior instead of normal answer
        results['openai_answers_question'] = check_t3_refusal(openai_answer)
        results['claude_answers_question'] = check_t3_refusal(claude_answer)
        
        # Other checks still apply
        results['openai_routing_check'] = evaluate_routing(question_data, trace_data, 'openai')
        results['claude_routing_check'] = evaluate_routing(question_data, trace_data, 'claude')
        
        results['openai_follows_template'] = evaluate_template(openai_response, 'T3')
        results['claude_follows_template'] = evaluate_template(claude_response, 'T3')
        
        results['openai_no_hallucination'] = 'PASS'  # Refusals can't hallucinate
        results['claude_no_hallucination'] = 'PASS'  # Refusals can't hallucinate
        
    else:
        # ===== NORMAL T1/T2 HANDLING =====
        
        # Run all normal checks
        results['openai_cites_shlokas'] = evaluate_citations(openai_answer)
        results['claude_cites_shlokas'] = evaluate_citations(claude_answer)
        
        results['openai_retrieval_check'] = evaluate_retrieval(question_data, trace_data, 'openai')
        results['claude_retrieval_check'] = evaluate_retrieval(question_data, trace_data, 'claude')
        
        results['openai_answers_question'] = evaluate_answer_quality(question_data, openai_response)
        results['claude_answers_question'] = evaluate_answer_quality(question_data, claude_response)
        
        results['openai_routing_check'] = evaluate_routing(question_data, trace_data, 'openai')
        results['claude_routing_check'] = evaluate_routing(question_data, trace_data, 'claude')
        
        results['openai_follows_template'] = evaluate_template(openai_response, question_data.get('expected_template'))
        results['claude_follows_template'] = evaluate_template(claude_response, question_data.get('expected_template'))
        
        results['openai_no_hallucination'] = evaluate_hallucination(openai_response, trace_data)
        results['claude_no_hallucination'] = evaluate_hallucination(claude_response, trace_data)
    
    return results
```

#### Step 1.6: Update pass/fail calculator

Find where overall pass is calculated and update to handle N/A:

```python
def calculate_model_passed(results, model_prefix):
    """
    Calculate if a model passed overall.
    
    Args:
        results: dict with all check results
        model_prefix: 'openai' or 'claude'
    
    Returns:
        bool: True if model passed all applicable checks
    """
    checks = [
        results.get(f'{model_prefix}_routing_check'),
        results.get(f'{model_prefix}_retrieval_check'),
        results.get(f'{model_prefix}_answers_question'),
        results.get(f'{model_prefix}_cites_shlokas'),
        results.get(f'{model_prefix}_follows_template'),
        results.get(f'{model_prefix}_no_hallucination'),
    ]
    
    # Filter out N/A checks (they don't count as pass or fail)
    applicable_checks = [c for c in checks if c not in ['N/A', None, '']]
    
    # Model passes if ALL applicable checks are PASS
    return all(check == 'PASS' for check in applicable_checks)
```

#### Step 1.7: Test the fix

After making changes, test with one T3 question:

```python
# Test script to verify T3 fix
test_t3_answer = """
I appreciate your question, but drawing images falls outside my scope 
as a Ramayana text interpreter. My purpose is to help you explore 
Valmiki's text through scholarly inquiry.

However, I can help with:
- Character descriptions from the text
- Story narratives and events
- Thematic analysis and interpretations

Would you like to explore any of these topics instead?
"""

result = check_t3_refusal(test_t3_answer)
print(f"Test T3 answer: {result}")  # Should print: PASS
```

#### Step 1.8: Re-run evaluation

```bash
python scripts/evaluate_with_gemini.py \
  --input projectupdates/golden_responses_AFTER_FIX_2025_12_19_2037.json \
  --output projectupdates/gemini_evaluation_T3_FIXED.csv \
  --golden-dataset /mnt/project/golden_dataset.csv
```

#### Step 1.9: Verify T3 results

```python
import pandas as pd

df = pd.read_csv('projectupdates/gemini_evaluation_T3_FIXED.csv')

# Check T3 questions
t3 = df[df['expected_template'] == 'T3']

print("T3 EVALUATION RESULTS:")
print(f"Total T3 questions: {len(t3)}")
print()
print("OpenAI cites_shlokas values:")
print(t3['openai_cites_shlokas'].value_counts())
print()
print("Claude cites_shlokas values:")
print(t3['claude_cites_shlokas'].value_counts())
print()
print("T3 outcomes:")
print(t3['outcome'].value_counts())
print()

# Count T3 passing
t3_both_pass = (t3['outcome'] == 'BOTH_PASS').sum()
print(f"T3 BOTH_PASS: {t3_both_pass}/8 ({t3_both_pass/8*100:.1f}%)")

if t3_both_pass >= 7:
    print("✅ T3 FIX SUCCESSFUL - Target met (≥87.5%)")
else:
    print("⚠️ T3 FIX NEEDS MORE WORK")
```

### Expected Results After Task 1

|Metric|Before Fix|After Fix|
|---|---|---|
|T3 `cites_shlokas`|FAIL (all)|N/A (all)|
|T3 `retrieval_check`|FAIL (all)|N/A (all)|
|T3 `answers_question`|FAIL (most)|PASS (7-8/8)|
|T3 BOTH_PASS|0-1/8|7-8/8|
|Overall BOTH_PASS|25/60 (41.7%)|~32/60 (~53%)|

---

## 🔍 TASK 2: Investigate OpenAI Citation Quality Gap

### The Problem

There's a gap between:

- **Inline citation presence**: 94.2% (49/52 questions have citations)
- **Gemini quality evaluation**: 51.7% (31/60 questions pass)

**Question**: Are Gemini's FAIL verdicts legitimate quality issues, or is Gemini being too strict?

### Step-by-Step Investigation

#### Step 2.1: Find questions with the gap

Create a script to identify questions where:

- OpenAI has inline citations (detected by regex)
- But Gemini marks `openai_cites_shlokas` as FAIL

```python
import pandas as pd
import json
import re

# Load data
eval_df = pd.read_csv('projectupdates/gemini_evaluation_T3_FIXED.csv')
responses = json.load(open('projectupdates/golden_responses_AFTER_FIX_2025_12_19_2037.json'))

# Citation regex pattern
citation_pattern = r'\[[A-Za-z]+[ -]Kanda\s+\d+\.\d+\]'

def count_citations(text):
    """Count inline citations in text."""
    if not text:
        return 0
    matches = re.findall(citation_pattern, text)
    return len(matches)

def get_response_for_question(question, responses_list):
    """Find response data for a question."""
    for r in responses_list:
        if r.get('user_query') == question or r.get('question') == question:
            return r
    return None

# Find discrepancy questions (T1/T2 only)
discrepancy_questions = []

for idx, row in eval_df.iterrows():
    # Skip T3
    if row.get('expected_template') == 'T3':
        continue
    
    # Skip if Gemini passed
    if row.get('openai_cites_shlokas') == 'PASS':
        continue
    
    # Get the response
    response = get_response_for_question(row['user_query'], responses)
    if not response:
        continue
    
    # Get OpenAI answer
    openai_answer = response.get('openai_answer', '') or response.get('openai', {}).get('answer', '')
    
    # Count citations
    citation_count = count_citations(openai_answer)
    
    # If has citations but Gemini failed it
    if citation_count > 0:
        discrepancy_questions.append({
            'question': row['user_query'],
            'expected_template': row.get('expected_template'),
            'classification': row.get('classification'),
            'citation_count': citation_count,
            'gemini_verdict': row.get('openai_cites_shlokas'),
            'answer_preview': openai_answer[:300] if openai_answer else 'N/A',
            'comments': row.get('comments', '')
        })

print(f"Found {len(discrepancy_questions)} questions with citation discrepancy")
print()

# Show details for each
for i, q in enumerate(discrepancy_questions[:10]):  # First 10
    print(f"=" * 60)
    print(f"Question {i+1}: {q['question'][:60]}...")
    print(f"Template: {q['expected_template']}")
    print(f"Classification: {q['classification']}")
    print(f"Citations found: {q['citation_count']}")
    print(f"Gemini verdict: {q['gemini_verdict']}")
    print(f"Gemini comments: {q['comments']}")
    print(f"Answer preview: {q['answer_preview'][:200]}...")
    print()
```

#### Step 2.2: Categorize the failures

Analyze each discrepancy question and categorize:

```python
# Categories of failure
failure_categories = {
    'citation_format': [],      # Citation format wrong
    'citation_not_relevant': [], # Citation doesn't support claim
    'citation_not_retrieved': [], # Citation not in retrieved shlokas
    'gemini_too_strict': [],    # Gemini being unreasonable
    'other': []
}

# For each discrepancy question, you'll need to manually or semi-automatically categorize
# Here's a helper to check if citations are in retrieved shlokas

def analyze_citation_validity(question_data, answer_text, retrieved_shlokas):
    """
    Analyze why citations might be failing.
    """
    issues = []
    
    # Extract citations from answer
    citations = re.findall(citation_pattern, answer_text)
    
    for citation in citations:
        # Parse citation
        match = re.match(r'\[([A-Za-z]+)[ -]Kanda\s+(\d+)\.(\d+)\]', citation)
        if not match:
            issues.append(f"Format issue: {citation}")
            continue
        
        kanda = match.group(1)
        sarga = match.group(2)
        shloka = match.group(3)
        
        # Check if this citation is in retrieved shlokas
        # (This requires access to trace data)
        # For now, just log the citation
        issues.append(f"Check: {citation} - Kanda={kanda}, Sarga={sarga}, Shloka={shloka}")
    
    return issues
```

#### Step 2.3: Create summary report

```python
# Create investigation summary
summary = {
    'total_discrepancies': len(discrepancy_questions),
    'by_template': {},
    'by_category': {},
    'sample_questions': discrepancy_questions[:5]
}

# Group by template
for q in discrepancy_questions:
    template = q['expected_template']
    if template not in summary['by_template']:
        summary['by_template'][template] = 0
    summary['by_template'][template] += 1

print("INVESTIGATION SUMMARY")
print("=" * 60)
print(f"Total questions with citation discrepancy: {summary['total_discrepancies']}")
print()
print("By template type:")
for template, count in summary['by_template'].items():
    print(f"  {template}: {count}")
print()
print("Sample questions to review manually:")
for i, q in enumerate(summary['sample_questions']):
    print(f"\n{i+1}. {q['question'][:70]}...")
    print(f"   Template: {q['expected_template']}, Citations: {q['citation_count']}")
```

#### Step 2.4: Make recommendation

Based on investigation, determine action:

```python
def make_recommendation(discrepancy_questions, total_t1_t2_questions=52):
    """
    Make recommendation based on investigation findings.
    """
    discrepancy_count = len(discrepancy_questions)
    discrepancy_rate = discrepancy_count / total_t1_t2_questions * 100
    
    print("RECOMMENDATION")
    print("=" * 60)
    print(f"Discrepancy rate: {discrepancy_rate:.1f}% ({discrepancy_count}/{total_t1_t2_questions})")
    print()
    
    if discrepancy_rate < 10:
        print("✅ RECOMMENDATION: ACCEPTABLE AS-IS")
        print("   - Discrepancy rate is low (<10%)")
        print("   - Current citation quality is good")
        print("   - Proceed to Phase B")
    elif discrepancy_rate < 20:
        print("⚠️ RECOMMENDATION: MINOR PROMPT TWEAKS")
        print("   - Discrepancy rate is moderate (10-20%)")
        print("   - Review specific failure patterns")
        print("   - Consider small prompt adjustments")
        print("   - Can proceed to Phase B with known issues")
    else:
        print("❌ RECOMMENDATION: NEEDS INVESTIGATION")
        print("   - Discrepancy rate is high (>20%)")
        print("   - Need to determine if Gemini is too strict")
        print("   - Or if OpenAI citations have quality issues")
        print("   - May need evaluation criteria adjustment")
    
    return discrepancy_rate
```

### Expected Output From Task 2

A report answering:

1. **How many questions have discrepancy?** (has citations but Gemini fails)
2. **What are the failure patterns?**
    - Citation format issues?
    - Citation not relevant to claim?
    - Citation not in retrieved shlokas?
    - Gemini being too strict?
3. **What's the recommendation?**
    - Accept as-is?
    - Prompt tweaks needed?
    - Evaluation criteria needs adjustment?

---

## 📋 Complete Task Summary

### Task 1: Fix T3 Evaluation

|Step|Action|Output|
|---|---|---|
|1.1|Find evaluation script|File location|
|1.2|Read current logic|Understanding of code|
|1.3|Add T3 detection function|`is_t3_question()`|
|1.4|Add refusal checker|`check_t3_refusal()`|
|1.5|Modify main evaluation|T3 conditional logic|
|1.6|Update pass/fail calculator|Handle N/A|
|1.7|Test the fix|Verify works|
|1.8|Re-run evaluation|New CSV file|
|1.9|Verify results|Confirmation report|

**Success Criteria**: 7/8 T3 questions pass

### Task 2: Investigate OpenAI Citations

|Step|Action|Output|
|---|---|---|
|2.1|Find discrepancy questions|List of questions|
|2.2|Categorize failures|Failure type breakdown|
|2.3|Create summary report|Investigation findings|
|2.4|Make recommendation|Action decision|

**Success Criteria**: Clear recommendation on what to do

---

## 📁 Files to Create/Modify

|File|Action|Purpose|
|---|---|---|
|`scripts/evaluate_with_gemini.py`|MODIFY|Add T3 handling|
|`projectupdates/gemini_evaluation_T3_FIXED.csv`|CREATE|New evaluation results|
|`projectupdates/citation_investigation_report.md`|CREATE|Investigation findings|
|`projectupdates/phase_a_final_status.md`|CREATE|Final status report|

---

## ✅ Definition of Done

### Task 1 Complete When:

- [ ] T3 questions show `cites_shlokas = 'N/A'` (all 8)
- [ ] T3 questions show `retrieval_check = 'N/A'` (all 8)
- [ ] T3 BOTH_PASS ≥ 7/8 (87.5%)
- [ ] Overall BOTH_PASS ≥ 47% (28/60)
- [ ] No regressions in T1/T2 questions

### Task 2 Complete When:

- [ ] Discrepancy questions identified
- [ ] Failure patterns categorized
- [ ] Clear recommendation provided
- [ ] Report saved to project

---

## 🚀 Ready to Execute

Start with **Task 1** (T3 fix) as it has the biggest impact on meeting success criteria.

Then do **Task 2** (investigation) to understand citation quality and determine if any additional fixes are needed.

**Estimated Total Time**: 2-3 hours