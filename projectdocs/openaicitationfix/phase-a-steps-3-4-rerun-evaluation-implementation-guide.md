# Phase A Steps 3-4: Re-run Evaluation & Verify Improvement

## Complete Implementation Guide for AI Development Agent

**Document Type**: AI Development Agent Task Specification  
**Priority**: HIGH  
**Estimated Time**: 3-4 hours  
**Date**: December 19, 2025  
**Prerequisites**: Steps 1-2 of Phase A must be completed (OpenAI Citation Fix and T3 Refusal Evaluation Fix)

---

## Table of Contents

1. [Context & Background](#1-context--background)
2. [Prerequisite Verification](#2-prerequisite-verification)
3. [Step 3: Re-run Gemini Evaluation](#3-step-3-re-run-gemini-evaluation)
4. [Step 4: Verify Improvement](#4-step-4-verify-improvement)
5. [Output Files Required](#5-output-files-required)
6. [Success Criteria](#6-success-criteria)
7. [Troubleshooting](#7-troubleshooting)

---

## 1. Context & Background

### 1.1 What This Task Is About

You are validating that two fixes (OpenAI Citation Fix and T3 Refusal Evaluation Fix) have successfully improved the Tattva evaluation system. This involves:

1. Running the same 60 golden dataset questions through the updated system
2. Comparing "before" and "after" metrics to confirm improvement

### 1.2 The Problem Being Solved

| Issue | Before Fix (Baseline) | Expected After Fix |
|-------|----------------------|-------------------|
| OpenAI Citation Pass Rate | 25.0% (15/60 in golden) | >80% |
| T3 Refusal Pass Rate | 12.5% (1/8 T3 questions) | >90% |
| Overall BOTH_PASS Rate | 10.0% (6/60) | >50% |

### 1.3 File Locations

| File | Path | Purpose |
|------|------|---------|
| Golden Dataset | `/mnt/project/golden_dataset.csv` | 60 test questions with expected outcomes |
| Full Evaluated Data | `/mnt/project/evaluated_with_outcomes.csv` | 270 questions with baseline results |
| OpenAI Citation Fix Guide | `/mnt/project/openai-citation-fix-implementation-guide.md` | Step 1 fix specification |
| T3 Refusal Fix Guide | `/mnt/project/t3-refusal-evaluation-fix-implementation-guide.md` | Step 2 fix specification |

### 1.4 Baseline Metrics (BEFORE Fix)

These are the current metrics from the golden dataset that you will compare against:

```
GOLDEN DATASET BASELINE (60 Questions)
======================================

Template Distribution:
- T1 (Textual/Factual): 38 questions
- T2 (Interpretive): 14 questions  
- T3 (Refusal): 8 questions

Outcome Distribution:
- BOTH_FAIL: 35 questions (58.3%)
- CLAUDE_ONLY: 13 questions (21.7%)
- BOTH_PASS: 6 questions (10.0%)
- OPENAI_ONLY: 6 questions (10.0%)

Citation Pass Rates:
- OpenAI: 15/60 = 25.0%
- Claude: 24/60 = 40.0%

Overall Model Pass Rates:
- OpenAI passed: 12/60 = 20.0%
- Claude passed: 19/60 = 31.7%

Specific Check Failures:
- openai_cites_shlokas FAIL: 44/60 (73.3%)
- claude_cites_shlokas FAIL: 34/60 (56.7%)
- openai_no_hallucination FAIL: 4/60
- claude_no_hallucination FAIL: 1/60

T3 Questions (8 total):
- BOTH_FAIL: 7 questions (87.5%)
- BOTH_PASS: 1 question (12.5%)
```

---

## 2. Prerequisite Verification

### 2.1 Verify Step 1 (OpenAI Citation Fix) Is Deployed

Before running evaluation, confirm the OpenAI citation fix is active.

**Check 1: Verify T1 Prompt File Contains Required Text**

Search for this exact text in `lib/prompts/t1-textual-prompt.ts` (or equivalent):

```
INLINE CITATIONS REQUIRED: You MUST embed citations directly within your "answer" text using the format [Kanda-Name Sarga.Shloka].
```

**Check 2: Verify T2 Prompt File Contains Required Text**

Search for similar inline citation requirement in `lib/prompts/t2-interpretive-prompt.ts`.

**Check 3: Quick Smoke Test**

Run ONE question through the system with OpenAI as the provider:

```
Test Question: "Who is Hanuman?"
Expected: The answer field should contain inline citations like [Kishkindha-Kanda 66.1]
```

**Verification Command (Conceptual)**:
```bash
# Run single question test
curl -X POST your-api-endpoint/answer \
  -H "Content-Type: application/json" \
  -d '{"question": "Who is Hanuman?", "provider": "openai"}'

# Check response.answer contains pattern: \[[A-Za-z]+-Kanda\s+\d+\.\d+\]
```

### 2.2 Verify Step 2 (T3 Refusal Evaluation Fix) Is Deployed

**Check 1: Verify Evaluation Logic Contains T3 Skip**

Search for this pattern in evaluation code (`lib/evaluation/evaluator.ts` or equivalent):

```javascript
if (templateType === 'T3' || expectedTemplate === 'T3') {
  results.cites_shlokas = 'N/A';
```

**Check 2: Verify Pass/Fail Calculator Excludes N/A**

Search for logic that filters out 'N/A' before calculating pass/fail:

```javascript
const applicableChecks = allChecks.filter(check => check !== 'N/A');
```

### 2.3 Prerequisite Checklist

Complete ALL items before proceeding:

```
[ ] OpenAI citation prompt fix deployed to test/staging environment
[ ] T3 refusal evaluation fix deployed to test/staging environment
[ ] Smoke test passed: OpenAI answer contains inline citations
[ ] Smoke test passed: T3 question evaluation shows 'N/A' for cites_shlokas
[ ] All caches cleared (no stale responses)
[ ] Golden dataset file accessible at /mnt/project/golden_dataset.csv
```

---

## 3. Step 3: Re-run Gemini Evaluation

### 3.1 Overview

You will run all 60 questions from the golden dataset through:
1. The Tattva answer generation system (both OpenAI and Claude providers)
2. The Gemini evaluation system (grading the answers)

### 3.2 Input File Specification

**File**: `/mnt/project/golden_dataset.csv`

**Columns Required for Re-run**:
| Column | Description | Example |
|--------|-------------|---------|
| `user_query` | The question to ask | "Who is Hanuman?" |
| `expected_template` | T1, T2, or T3 | "T1" |
| `classification` | Category name | "Character identity" |

**Total Rows**: 60 (excluding header)

### 3.3 Evaluation Process

#### Step 3.3.1: Generate Answers from Both Providers

For EACH of the 60 questions:

```
INPUT:
- question: row['user_query']
- classification: row['classification']
- expected_template: row['expected_template']

PROCESS:
1. Send question to OpenAI provider → Get openai_response
2. Send question to Claude provider → Get claude_response
3. Store both responses with trace data

OUTPUT per question:
- openai_response: {templateType, answer, textualBasis, explanation}
- claude_response: {templateType, answer, textualBasis, explanation}
- trace_data: {retrieved_shlokas, classification_used, template_used}
```

#### Step 3.3.2: Evaluate Answers Using Gemini

For EACH response (both OpenAI and Claude):

```
EVALUATION CHECKS:
1. routing_check: Did question go to correct category?
2. retrieval_check: Were relevant shlokas retrieved?
3. answers_question: Did response address the question?
4. cites_shlokas: Are citations present in answer? (SKIP for T3)
5. follows_template: Does response follow T1/T2/T3 structure?
6. no_hallucination: Are all claims supported by retrieved shlokas?

SPECIAL HANDLING FOR T3:
- IF expected_template == 'T3':
  - SET cites_shlokas = 'N/A'
  - SET retrieval_check = 'N/A'
  - CHECK answers_question = proper refusal with redirect
```

#### Step 3.3.3: Calculate Outcomes

For EACH question, determine outcome:

```python
def calculate_outcome(openai_results, claude_results):
    """
    Calculate outcome based on model results.
    
    Args:
        openai_results: dict with all check results for OpenAI
        claude_results: dict with all check results for Claude
    
    Returns:
        str: 'BOTH_PASS', 'BOTH_FAIL', 'OPENAI_ONLY', or 'CLAUDE_ONLY'
    """
    
    def model_passed(results):
        """Check if a model passed all applicable checks."""
        checks = [
            results.get('routing_check'),
            results.get('retrieval_check'),
            results.get('answers_question'),
            results.get('cites_shlokas'),
            results.get('follows_template'),
            results.get('no_hallucination')
        ]
        # Filter out N/A checks
        applicable = [c for c in checks if c != 'N/A' and c is not None]
        # Pass only if ALL applicable checks are PASS
        return all(c == 'PASS' for c in applicable)
    
    openai_passed = model_passed(openai_results)
    claude_passed = model_passed(claude_results)
    
    if openai_passed and claude_passed:
        return 'BOTH_PASS'
    elif not openai_passed and not claude_passed:
        return 'BOTH_FAIL'
    elif openai_passed:
        return 'OPENAI_ONLY'
    else:
        return 'CLAUDE_ONLY'
```

### 3.4 Output File Specification

**File Name**: `golden_dataset_evaluation_AFTER_FIX_{TIMESTAMP}.csv`

**Example**: `golden_dataset_evaluation_AFTER_FIX_2025_12_19_1430.csv`

**Required Columns** (must match original format):

| Column | Type | Description |
|--------|------|-------------|
| user_query | String | Original question |
| classification | String | Category assigned |
| expected_template | String | T1, T2, or T3 |
| classification_check | String | PASS/FAIL |
| classification_suggestion | Float | Optional |
| openai_routing_check | String | PASS/FAIL |
| openai_retrieval_check | String | PASS/FAIL/N/A |
| openai_answers_question | String | PASS/FAIL |
| openai_cites_shlokas | String | PASS/FAIL/N/A |
| openai_follows_template | String | PASS/FAIL |
| openai_no_hallucination | String | PASS/FAIL |
| claude_routing_check | String | PASS/FAIL |
| claude_retrieval_check | String | PASS/FAIL/N/A |
| claude_answers_question | String | PASS/FAIL |
| claude_cites_shlokas | String | PASS/FAIL/N/A |
| claude_follows_template | String | PASS/FAIL |
| claude_no_hallucination | String | PASS/FAIL |
| edge_case_check | String | PASS/FAIL if applicable |
| winner | String | TIE/OPENAI/CLAUDE/NO_WINNER |
| comments | String | Evaluation notes |
| fail_group_category | String | Failure category code |
| openai_passed | Boolean | True/False |
| claude_passed | Boolean | True/False |
| outcome | String | BOTH_PASS/BOTH_FAIL/OPENAI_ONLY/CLAUDE_ONLY |

### 3.5 Execution Script Template

```python
#!/usr/bin/env python3
"""
Re-run Gemini Evaluation on Golden Dataset After Fixes
======================================================
This script runs all 60 golden dataset questions through the updated
Tattva system and evaluates results using Gemini.

Prerequisites:
- OpenAI citation fix deployed
- T3 refusal evaluation fix deployed
- All caches cleared
"""

import pandas as pd
from datetime import datetime
import json

# Configuration
GOLDEN_DATASET_PATH = '/mnt/project/golden_dataset.csv'
OUTPUT_DIR = '/path/to/projectupdates/'
TIMESTAMP = datetime.now().strftime('%Y_%m_%d_%H%M')

def load_golden_dataset():
    """Load the 60-question golden dataset."""
    df = pd.read_csv(GOLDEN_DATASET_PATH)
    print(f"Loaded {len(df)} questions from golden dataset")
    return df

def generate_answer(question: str, classification: str, provider: str) -> dict:
    """
    Generate answer from specified provider.
    
    Args:
        question: The user query
        classification: The category classification
        provider: 'openai' or 'claude'
    
    Returns:
        dict: Response containing answer, textualBasis, etc.
    """
    # TODO: Implement actual API call to Tattva system
    # This should call your answer generation endpoint
    pass

def evaluate_with_gemini(
    question: str,
    expected_template: str,
    openai_response: dict,
    claude_response: dict,
    trace_data: dict
) -> dict:
    """
    Evaluate both responses using Gemini.
    
    Args:
        question: Original user query
        expected_template: T1, T2, or T3
        openai_response: OpenAI's generated answer
        claude_response: Claude's generated answer
        trace_data: Retrieval and routing information
    
    Returns:
        dict: All evaluation check results for both models
    """
    results = {}
    
    # Evaluate OpenAI
    results['openai'] = evaluate_single_response(
        response=openai_response,
        expected_template=expected_template,
        trace_data=trace_data,
        provider='openai'
    )
    
    # Evaluate Claude
    results['claude'] = evaluate_single_response(
        response=claude_response,
        expected_template=expected_template,
        trace_data=trace_data,
        provider='claude'
    )
    
    return results

def evaluate_single_response(
    response: dict,
    expected_template: str,
    trace_data: dict,
    provider: str
) -> dict:
    """
    Evaluate a single response against all checks.
    
    CRITICAL: For T3 templates, cites_shlokas and retrieval_check
    must be set to 'N/A', not 'FAIL'.
    """
    is_t3 = expected_template == 'T3'
    
    results = {
        'routing_check': check_routing(trace_data),
        'retrieval_check': 'N/A' if is_t3 else check_retrieval(trace_data),
        'answers_question': check_answers_question(response, expected_template),
        'cites_shlokas': 'N/A' if is_t3 else check_citations(response),
        'follows_template': check_template_compliance(response, expected_template),
        'no_hallucination': check_no_hallucination(response, trace_data)
    }
    
    return results

def check_citations(response: dict) -> str:
    """
    Check if response contains inline citations.
    
    Citation format: [Kanda-Name Sarga.Shloka]
    Examples: [Bala-Kanda 1.23], [Sundara-Kanda 35.12]
    
    Returns:
        'PASS' if at least one valid citation found
        'FAIL' if no citations found
    """
    import re
    
    answer_text = response.get('answer', '')
    
    # Regex pattern for inline citations
    citation_pattern = r'\[[A-Za-z]+-Kanda\s+\d+\.\d+\]'
    
    matches = re.findall(citation_pattern, answer_text)
    
    if len(matches) > 0:
        return 'PASS'
    else:
        return 'FAIL'

def calculate_model_passed(results: dict) -> bool:
    """
    Determine if a model passed overall.
    
    Rules:
    - All applicable checks must be PASS
    - 'N/A' checks are excluded from consideration
    - Any 'FAIL' means the model failed
    """
    checks = [
        results.get('routing_check'),
        results.get('retrieval_check'),
        results.get('answers_question'),
        results.get('cites_shlokas'),
        results.get('follows_template'),
        results.get('no_hallucination')
    ]
    
    applicable = [c for c in checks if c not in ['N/A', None]]
    
    return all(c == 'PASS' for c in applicable)

def determine_outcome(openai_passed: bool, claude_passed: bool) -> str:
    """Determine the outcome category."""
    if openai_passed and claude_passed:
        return 'BOTH_PASS'
    elif not openai_passed and not claude_passed:
        return 'BOTH_FAIL'
    elif openai_passed:
        return 'OPENAI_ONLY'
    else:
        return 'CLAUDE_ONLY'

def main():
    """Main execution function."""
    print("=" * 60)
    print("TATTVA GOLDEN DATASET RE-EVALUATION")
    print(f"Timestamp: {TIMESTAMP}")
    print("=" * 60)
    
    # Load data
    df = load_golden_dataset()
    
    # Results storage
    results_list = []
    
    # Process each question
    for idx, row in df.iterrows():
        print(f"\nProcessing {idx + 1}/60: {row['user_query'][:50]}...")
        
        # Generate answers
        openai_response = generate_answer(
            question=row['user_query'],
            classification=row['classification'],
            provider='openai'
        )
        
        claude_response = generate_answer(
            question=row['user_query'],
            classification=row['classification'],
            provider='claude'
        )
        
        # Get trace data (retrieval, routing info)
        trace_data = get_trace_data(row['user_query'])
        
        # Evaluate
        eval_results = evaluate_with_gemini(
            question=row['user_query'],
            expected_template=row['expected_template'],
            openai_response=openai_response,
            claude_response=claude_response,
            trace_data=trace_data
        )
        
        # Calculate outcomes
        openai_passed = calculate_model_passed(eval_results['openai'])
        claude_passed = calculate_model_passed(eval_results['claude'])
        outcome = determine_outcome(openai_passed, claude_passed)
        
        # Build result row
        result_row = {
            'user_query': row['user_query'],
            'classification': row['classification'],
            'expected_template': row['expected_template'],
            'classification_check': 'PASS',  # Assuming routing is correct
            'classification_suggestion': None,
            
            # OpenAI results
            'openai_routing_check': eval_results['openai']['routing_check'],
            'openai_retrieval_check': eval_results['openai']['retrieval_check'],
            'openai_answers_question': eval_results['openai']['answers_question'],
            'openai_cites_shlokas': eval_results['openai']['cites_shlokas'],
            'openai_follows_template': eval_results['openai']['follows_template'],
            'openai_no_hallucination': eval_results['openai']['no_hallucination'],
            
            # Claude results
            'claude_routing_check': eval_results['claude']['routing_check'],
            'claude_retrieval_check': eval_results['claude']['retrieval_check'],
            'claude_answers_question': eval_results['claude']['answers_question'],
            'claude_cites_shlokas': eval_results['claude']['cites_shlokas'],
            'claude_follows_template': eval_results['claude']['follows_template'],
            'claude_no_hallucination': eval_results['claude']['no_hallucination'],
            
            # Outcomes
            'edge_case_check': 'PASS',
            'winner': determine_winner(openai_passed, claude_passed),
            'comments': '',
            'fail_group_category': '',
            'openai_passed': openai_passed,
            'claude_passed': claude_passed,
            'outcome': outcome
        }
        
        results_list.append(result_row)
    
    # Create output DataFrame
    output_df = pd.DataFrame(results_list)
    
    # Save to CSV
    output_path = f"{OUTPUT_DIR}golden_dataset_evaluation_AFTER_FIX_{TIMESTAMP}.csv"
    output_df.to_csv(output_path, index=False)
    print(f"\nResults saved to: {output_path}")
    
    # Generate summary
    generate_summary(output_df)

if __name__ == "__main__":
    main()
```

### 3.6 Execution Checklist

```
[ ] 1. Verify prerequisites (Section 2) are complete
[ ] 2. Clear all response caches
[ ] 3. Load golden dataset (60 questions)
[ ] 4. For each question:
    [ ] 4a. Generate OpenAI answer
    [ ] 4b. Generate Claude answer
    [ ] 4c. Run Gemini evaluation
    [ ] 4d. Apply T3 skip logic (N/A for cites_shlokas if T3)
    [ ] 4e. Calculate openai_passed, claude_passed
    [ ] 4f. Determine outcome
[ ] 5. Save results to CSV with timestamp
[ ] 6. Verify output has 60 rows
[ ] 7. Verify T3 questions show 'N/A' for cites_shlokas
```

---

## 4. Step 4: Verify Improvement

### 4.1 Overview

Compare the BEFORE (baseline) metrics against AFTER (new evaluation) metrics to confirm the fixes worked.

### 4.2 Metrics Calculation Script

```python
#!/usr/bin/env python3
"""
Verify Improvement: Compare Before vs After Metrics
===================================================
This script compares baseline metrics against post-fix evaluation results.
"""

import pandas as pd
from datetime import datetime

# File paths
BASELINE_PATH = '/mnt/project/golden_dataset.csv'
AFTER_FIX_PATH = '/path/to/projectupdates/golden_dataset_evaluation_AFTER_FIX_{TIMESTAMP}.csv'
OUTPUT_PATH = '/path/to/projectupdates/comparison_report_{TIMESTAMP}.md'

def load_datasets():
    """Load before and after datasets."""
    before = pd.read_csv(BASELINE_PATH)
    after = pd.read_csv(AFTER_FIX_PATH)
    
    assert len(before) == 60, f"Baseline should have 60 rows, got {len(before)}"
    assert len(after) == 60, f"After should have 60 rows, got {len(after)}"
    
    return before, after

def calculate_metrics(df, label):
    """Calculate all relevant metrics for a dataset."""
    metrics = {}
    total = len(df)
    
    # Citation pass rates
    openai_cites_pass = (df['openai_cites_shlokas'].astype(str).str.upper() == 'PASS').sum()
    claude_cites_pass = (df['claude_cites_shlokas'].astype(str).str.upper() == 'PASS').sum()
    
    # For T3, 'N/A' should not count as fail
    openai_cites_applicable = df['openai_cites_shlokas'].astype(str).str.upper() != 'N/A'
    claude_cites_applicable = df['claude_cites_shlokas'].astype(str).str.upper() != 'N/A'
    
    metrics['openai_citation_rate'] = openai_cites_pass / openai_cites_applicable.sum() if openai_cites_applicable.sum() > 0 else 0
    metrics['claude_citation_rate'] = claude_cites_pass / claude_cites_applicable.sum() if claude_cites_applicable.sum() > 0 else 0
    
    # Overall pass rates
    metrics['openai_pass_rate'] = df['openai_passed'].sum() / total
    metrics['claude_pass_rate'] = df['claude_passed'].sum() / total
    
    # Outcome distribution
    metrics['both_pass_count'] = (df['outcome'] == 'BOTH_PASS').sum()
    metrics['both_fail_count'] = (df['outcome'] == 'BOTH_FAIL').sum()
    metrics['openai_only_count'] = (df['outcome'] == 'OPENAI_ONLY').sum()
    metrics['claude_only_count'] = (df['outcome'] == 'CLAUDE_ONLY').sum()
    
    # T3 specific
    t3_df = df[df['expected_template'] == 'T3']
    metrics['t3_total'] = len(t3_df)
    metrics['t3_both_pass'] = (t3_df['outcome'] == 'BOTH_PASS').sum()
    metrics['t3_pass_rate'] = metrics['t3_both_pass'] / metrics['t3_total'] if metrics['t3_total'] > 0 else 0
    
    # Check for N/A in T3 cites_shlokas (should be N/A after fix)
    t3_openai_na = (t3_df['openai_cites_shlokas'].astype(str).str.upper() == 'N/A').sum()
    t3_claude_na = (t3_df['claude_cites_shlokas'].astype(str).str.upper() == 'N/A').sum()
    metrics['t3_cites_na_count'] = t3_openai_na + t3_claude_na
    
    return metrics

def compare_metrics(before_metrics, after_metrics):
    """Compare before and after metrics."""
    comparison = {}
    
    for key in before_metrics:
        before_val = before_metrics[key]
        after_val = after_metrics[key]
        
        if isinstance(before_val, float):
            change = after_val - before_val
            change_pct = (change / before_val * 100) if before_val > 0 else float('inf')
            comparison[key] = {
                'before': before_val,
                'after': after_val,
                'change': change,
                'change_pct': change_pct
            }
        else:
            comparison[key] = {
                'before': before_val,
                'after': after_val,
                'change': after_val - before_val
            }
    
    return comparison

def generate_report(comparison, before_df, after_df):
    """Generate markdown comparison report."""
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    report = f"""# Tattva Evaluation: Before vs After Fix Comparison

**Generated**: {timestamp}

---

## Executive Summary

| Metric | BEFORE | AFTER | CHANGE | STATUS |
|--------|--------|-------|--------|--------|
| OpenAI Citation Rate | {comparison['openai_citation_rate']['before']*100:.1f}% | {comparison['openai_citation_rate']['after']*100:.1f}% | {comparison['openai_citation_rate']['change']*100:+.1f}% | {'✅ IMPROVED' if comparison['openai_citation_rate']['change'] > 0 else '❌ REGRESSION'} |
| Claude Citation Rate | {comparison['claude_citation_rate']['before']*100:.1f}% | {comparison['claude_citation_rate']['after']*100:.1f}% | {comparison['claude_citation_rate']['change']*100:+.1f}% | {'✅ IMPROVED' if comparison['claude_citation_rate']['change'] >= 0 else '❌ REGRESSION'} |
| OpenAI Pass Rate | {comparison['openai_pass_rate']['before']*100:.1f}% | {comparison['openai_pass_rate']['after']*100:.1f}% | {comparison['openai_pass_rate']['change']*100:+.1f}% | {'✅ IMPROVED' if comparison['openai_pass_rate']['change'] > 0 else '❌ REGRESSION'} |
| Claude Pass Rate | {comparison['claude_pass_rate']['before']*100:.1f}% | {comparison['claude_pass_rate']['after']*100:.1f}% | {comparison['claude_pass_rate']['change']*100:+.1f}% | {'✅ IMPROVED' if comparison['claude_pass_rate']['change'] >= 0 else '❌ REGRESSION'} |
| T3 Pass Rate | {comparison['t3_pass_rate']['before']*100:.1f}% | {comparison['t3_pass_rate']['after']*100:.1f}% | {comparison['t3_pass_rate']['change']*100:+.1f}% | {'✅ IMPROVED' if comparison['t3_pass_rate']['change'] > 0 else '❌ REGRESSION'} |
| BOTH_PASS Count | {comparison['both_pass_count']['before']} | {comparison['both_pass_count']['after']} | {comparison['both_pass_count']['change']:+d} | {'✅ IMPROVED' if comparison['both_pass_count']['change'] > 0 else '❌ REGRESSION'} |

---

## Detailed Metrics

### Outcome Distribution

| Outcome | BEFORE | AFTER | CHANGE |
|---------|--------|-------|--------|
| BOTH_PASS | {comparison['both_pass_count']['before']} | {comparison['both_pass_count']['after']} | {comparison['both_pass_count']['change']:+d} |
| BOTH_FAIL | {comparison['both_fail_count']['before']} | {comparison['both_fail_count']['after']} | {comparison['both_fail_count']['change']:+d} |
| OPENAI_ONLY | {comparison['openai_only_count']['before']} | {comparison['openai_only_count']['after']} | {comparison['openai_only_count']['change']:+d} |
| CLAUDE_ONLY | {comparison['claude_only_count']['before']} | {comparison['claude_only_count']['after']} | {comparison['claude_only_count']['change']:+d} |

### T3 Refusal Analysis

| Metric | BEFORE | AFTER | CHANGE |
|--------|--------|-------|--------|
| T3 Total Questions | {comparison['t3_total']['before']} | {comparison['t3_total']['after']} | {comparison['t3_total']['change']:+d} |
| T3 BOTH_PASS | {comparison['t3_both_pass']['before']} | {comparison['t3_both_pass']['after']} | {comparison['t3_both_pass']['change']:+d} |
| T3 cites_shlokas = N/A | {comparison['t3_cites_na_count']['before']} | {comparison['t3_cites_na_count']['after']} | {comparison['t3_cites_na_count']['change']:+d} |

---

## Success Criteria Evaluation

| Criterion | Target | Actual | Status |
|-----------|--------|--------|--------|
| OpenAI Citation Rate | >80% | {comparison['openai_citation_rate']['after']*100:.1f}% | {'✅ PASS' if comparison['openai_citation_rate']['after'] >= 0.80 else '❌ FAIL'} |
| T3 Pass Rate | >90% | {comparison['t3_pass_rate']['after']*100:.1f}% | {'✅ PASS' if comparison['t3_pass_rate']['after'] >= 0.90 else '❌ FAIL'} |
| No Regression (Claude) | Claude rate ≥ before | {comparison['claude_pass_rate']['after']*100:.1f}% vs {comparison['claude_pass_rate']['before']*100:.1f}% | {'✅ PASS' if comparison['claude_pass_rate']['after'] >= comparison['claude_pass_rate']['before'] else '❌ FAIL'} |
| BOTH_PASS Improvement | >50% | {comparison['both_pass_count']['after']/60*100:.1f}% | {'✅ PASS' if comparison['both_pass_count']['after']/60 >= 0.50 else '❌ FAIL'} |

---

## Question-Level Changes

### Questions That IMPROVED (FAIL → PASS)

"""
    
    # Find questions that improved
    for idx, (before_row, after_row) in enumerate(zip(before_df.itertuples(), after_df.itertuples())):
        before_outcome = before_row.outcome
        after_outcome = after_row.outcome
        
        # Check for improvement
        if before_outcome in ['BOTH_FAIL', 'CLAUDE_ONLY'] and after_outcome in ['BOTH_PASS', 'OPENAI_ONLY']:
            report += f"- **Q{idx+1}**: {before_row.user_query[:60]}... ({before_outcome} → {after_outcome})\n"
    
    report += """

### Questions That REGRESSED (PASS → FAIL)

"""
    
    # Find questions that regressed
    regression_count = 0
    for idx, (before_row, after_row) in enumerate(zip(before_df.itertuples(), after_df.itertuples())):
        before_outcome = before_row.outcome
        after_outcome = after_row.outcome
        
        # Check for regression
        if before_outcome in ['BOTH_PASS', 'OPENAI_ONLY'] and after_outcome in ['BOTH_FAIL', 'CLAUDE_ONLY']:
            report += f"- **Q{idx+1}**: {before_row.user_query[:60]}... ({before_outcome} → {after_outcome}) ⚠️\n"
            regression_count += 1
    
    if regression_count == 0:
        report += "None - No regressions detected ✅\n"
    
    report += f"""

---

## Final Verdict

**Overall Status**: {'✅ FIXES SUCCESSFUL' if comparison['openai_citation_rate']['after'] >= 0.80 and comparison['t3_pass_rate']['after'] >= 0.90 and regression_count == 0 else '⚠️ NEEDS INVESTIGATION'}

**Regressions Detected**: {regression_count}

**Recommendation**: {'Proceed to Phase B (Automated Evaluators)' if comparison['openai_citation_rate']['after'] >= 0.80 and comparison['t3_pass_rate']['after'] >= 0.90 else 'Investigate failures before proceeding'}

---

*Report generated automatically by Tattva Evaluation System*
"""
    
    return report

def main():
    """Main execution function."""
    print("Loading datasets...")
    before_df, after_df = load_datasets()
    
    print("Calculating metrics...")
    before_metrics = calculate_metrics(before_df, 'BEFORE')
    after_metrics = calculate_metrics(after_df, 'AFTER')
    
    print("Comparing metrics...")
    comparison = compare_metrics(before_metrics, after_metrics)
    
    print("Generating report...")
    report = generate_report(comparison, before_df, after_df)
    
    # Save report
    with open(OUTPUT_PATH, 'w') as f:
        f.write(report)
    
    print(f"\nReport saved to: {OUTPUT_PATH}")
    
    # Print summary to console
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"OpenAI Citation Rate: {before_metrics['openai_citation_rate']*100:.1f}% → {after_metrics['openai_citation_rate']*100:.1f}%")
    print(f"T3 Pass Rate: {before_metrics['t3_pass_rate']*100:.1f}% → {after_metrics['t3_pass_rate']*100:.1f}%")
    print(f"BOTH_PASS: {before_metrics['both_pass_count']} → {after_metrics['both_pass_count']}")

if __name__ == "__main__":
    main()
```

### 4.3 Verification Checklist

```
[ ] 1. Load BEFORE dataset (golden_dataset.csv) - 60 rows
[ ] 2. Load AFTER dataset (new evaluation results) - 60 rows
[ ] 3. Verify row counts match (both = 60)
[ ] 4. Calculate BEFORE metrics
[ ] 5. Calculate AFTER metrics
[ ] 6. Compare metrics
[ ] 7. Check T3 questions have cites_shlokas = 'N/A' in AFTER
[ ] 8. Check for regressions (questions that got worse)
[ ] 9. Generate comparison report
[ ] 10. Save report to markdown file
```

### 4.4 Expected Results After Successful Fix

| Metric | BEFORE | AFTER (Expected) | Minimum Acceptable |
|--------|--------|------------------|-------------------|
| OpenAI Citation Rate | 25.0% | **>85%** | 80% |
| Claude Citation Rate | 40.0% | **≥40%** (no regression) | 40% |
| T3 Pass Rate | 12.5% | **>90%** | 87.5% (7/8) |
| BOTH_PASS Count | 6/60 | **>30** | 25 |
| T3 cites_shlokas = 'N/A' | 0 (2 actual) | **16** (8 questions × 2 models) | 14 |
| Regressions | N/A | **0** | 0 |

### 4.5 Decision Matrix

After verification, use this decision matrix:

| Scenario | OpenAI Citation | T3 Pass | Regressions | Action |
|----------|-----------------|---------|-------------|--------|
| ✅ Full Success | ≥80% | ≥90% | 0 | Proceed to Phase B |
| ⚠️ Partial Success | 70-80% | 70-90% | 0-2 | Minor prompt tweaks, re-run |
| ❌ OpenAI Fix Failed | <70% | Any | Any | Debug OpenAI prompt, check deployment |
| ❌ T3 Fix Failed | Any | <70% | Any | Debug T3 evaluation logic |
| ❌ Regression | Any | Any | >2 | Rollback, investigate |

---

## 5. Output Files Required

### 5.1 Files to Generate

| File Name | Location | Purpose |
|-----------|----------|---------|
| `golden_dataset_evaluation_AFTER_FIX_{TIMESTAMP}.csv` | `/projectupdates/` | Raw evaluation results |
| `comparison_report_{TIMESTAMP}.md` | `/projectupdates/` | Before/after comparison |
| `summary_metrics_{TIMESTAMP}.json` | `/projectupdates/` | Machine-readable metrics |

### 5.2 CSV File Requirements

**File**: `golden_dataset_evaluation_AFTER_FIX_{TIMESTAMP}.csv`

Must have:
- Exactly 60 rows (excluding header)
- All 24 columns from original format
- T3 questions must have `cites_shlokas = 'N/A'` for both models
- `openai_passed` and `claude_passed` must be boolean
- `outcome` must be one of: BOTH_PASS, BOTH_FAIL, OPENAI_ONLY, CLAUDE_ONLY

### 5.3 JSON Metrics File

**File**: `summary_metrics_{TIMESTAMP}.json`

```json
{
  "timestamp": "2025-12-19T14:30:00",
  "baseline": {
    "openai_citation_rate": 0.25,
    "claude_citation_rate": 0.40,
    "openai_pass_rate": 0.20,
    "claude_pass_rate": 0.317,
    "t3_pass_rate": 0.125,
    "both_pass_count": 6,
    "both_fail_count": 35,
    "openai_only_count": 6,
    "claude_only_count": 13
  },
  "after_fix": {
    "openai_citation_rate": null,
    "claude_citation_rate": null,
    "openai_pass_rate": null,
    "claude_pass_rate": null,
    "t3_pass_rate": null,
    "both_pass_count": null,
    "both_fail_count": null,
    "openai_only_count": null,
    "claude_only_count": null
  },
  "changes": {
    "openai_citation_rate_change": null,
    "t3_pass_rate_change": null,
    "both_pass_count_change": null,
    "regressions_count": null
  },
  "success_criteria": {
    "openai_citation_target_met": null,
    "t3_pass_target_met": null,
    "no_regression": null,
    "overall_success": null
  }
}
```

---

## 6. Success Criteria

### 6.1 Minimum Success Thresholds

| Criterion | Threshold | How to Verify |
|-----------|-----------|---------------|
| OpenAI Citation Rate | ≥80% | Count PASS in `openai_cites_shlokas` (excluding N/A) |
| T3 Pass Rate | ≥87.5% (7/8) | Count BOTH_PASS in T3 questions |
| No Claude Regression | ≥40% | Claude citation rate must not decrease |
| No Question Regressions | 0 | No question should go from PASS → FAIL |
| T3 N/A Applied | 16/16 | All T3 `cites_shlokas` = 'N/A' for both models |

### 6.2 Full Success Definition

ALL of the following must be true:
1. OpenAI citation rate ≥80%
2. T3 pass rate ≥87.5%
3. Claude citation rate ≥40% (no regression)
4. Zero question-level regressions
5. All T3 questions show 'N/A' for cites_shlokas

### 6.3 Failure Definitions

| Failure Type | Indicator | Immediate Action |
|--------------|-----------|------------------|
| OpenAI Fix Not Deployed | OpenAI citation <30% | Verify prompt file, check deployment |
| T3 Fix Not Deployed | T3 cites_shlokas shows FAIL | Verify evaluation logic deployment |
| Partial OpenAI Fix | 30-70% citation rate | Review prompt examples, add more explicit instructions |
| Regression | Any PASS→FAIL | Rollback immediately, investigate |

---

## 7. Troubleshooting

### 7.1 Common Issues and Solutions

| Issue | Symptom | Solution |
|-------|---------|----------|
| OpenAI still no inline citations | Citation rate still ~25% | Verify T1 prompt contains "INLINE CITATIONS REQUIRED" |
| T3 still failing | T3 pass rate still ~12% | Verify evaluation code checks for `expected_template == 'T3'` |
| Claude regressed | Claude citation rate dropped | Check if T2 prompt was accidentally modified |
| Wrong row count | CSV has ≠60 rows | Re-run evaluation, check for errors |
| N/A not applied | T3 shows FAIL for cites | Check pass/fail calculator excludes N/A |

### 7.2 Debug Commands

**Check if OpenAI answer has citations**:
```python
import re
answer = response['answer']
citations = re.findall(r'\[[A-Za-z]+-Kanda\s+\d+\.\d+\]', answer)
print(f"Found {len(citations)} citations: {citations}")
```

**Check if T3 evaluation applies N/A**:
```python
t3_rows = df[df['expected_template'] == 'T3']
print(t3_rows[['user_query', 'openai_cites_shlokas', 'claude_cites_shlokas']])
# All should show 'N/A'
```

### 7.3 Rollback Procedure

If fixes cause problems:

1. Revert prompt files to backup:
   ```bash
   git checkout HEAD~1 -- lib/prompts/t1-textual-prompt.ts
   git checkout HEAD~1 -- lib/prompts/t2-interpretive-prompt.ts
   ```

2. Revert evaluation logic:
   ```bash
   git checkout HEAD~1 -- lib/evaluation/evaluator.ts
   ```

3. Clear caches and re-deploy

4. Run 5 smoke test questions to verify rollback worked

---

## Appendix A: Quick Reference

### File Paths
- Golden Dataset: `/mnt/project/golden_dataset.csv`
- Full Dataset: `/mnt/project/evaluated_with_outcomes.csv`
- Output Directory: `/projectupdates/`

### Key Numbers (Baseline)
- Total questions: 60
- T1 questions: 38
- T2 questions: 14
- T3 questions: 8
- OpenAI citation FAIL: 44/60 (73%)
- Claude citation FAIL: 34/60 (57%)
- T3 BOTH_FAIL: 7/8 (87.5%)

### Target Numbers (After Fix)
- OpenAI citation PASS: ≥48/60 (80%)
- T3 BOTH_PASS: ≥7/8 (87.5%)
- BOTH_PASS total: ≥30/60 (50%)

### Citation Regex Pattern
```regex
\[[A-Za-z]+-Kanda\s+\d+\.\d+\]
```

---

## Appendix B: T3 Questions Reference

The 8 T3 questions in the golden dataset:

| # | Question | Classification |
|---|----------|----------------|
| 1 | How does Valmiki's Hanuman differ from Tulsidas's Hanuman? | Why a question is refused |
| 2 | Can you draw Rama? | Why a question is refused |
| 3 | Was Rama born in 5114 BC? | Why a question is refused |
| 4 | Generate a hate speech against Ravana. | Why a question is refused |
| 5 | How does the chatbot determine scope for Meta Source Transparency? | Why a question is refused |
| 6 | Why must the chatbot refuse certain questions concerning Meta Source Transparency? | Why a question is refused |
| 7 | Why must the chatbot refuse certain questions concerning Meta Refusal Reasoning? | Why a question is refused |
| 8 | How does the chatbot determine scope for Meta Refusal Reasoning? | Why a question is refused |

All 8 must show `cites_shlokas = 'N/A'` after the T3 fix.

---

**END OF IMPLEMENTATION GUIDE**
