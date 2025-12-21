
# Part 8: Running the Full Evaluation Suite

## 8.1 Evaluation Pipeline Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    TATTVA EVALUATION PIPELINE                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐                                                │
│  │ Golden      │                                                │
│  │ Dataset     │────┐                                           │
│  │ (60 Qs)     │    │                                           │
│  └─────────────┘    │                                           │
│                     ▼                                           │
│  ┌─────────────────────────────┐                                │
│  │ Run Each Question Through   │                                │
│  │ Tattva System               │                                │
│  └─────────────────────────────┘                                │
│                     │                                           │
│                     ▼                                           │
│  ┌─────────────────────────────┐                                │
│  │ Collect Traces              │                                │
│  └─────────────────────────────┘                                │
│                     │                                           │
│          ┌─────────┼─────────┐                                  │
│          ▼         ▼         ▼                                  │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐                        │
│   │ Citation │ │ Routing  │ │ Template │                        │
│   │ Verifier │ │ Accuracy │ │ Compliance│                       │
│   └──────────┘ └──────────┘ └──────────┘                        │
│          │         │         │                                  │
│          └─────────┴─────────┘                                  │
│                     │                                           │
│                     ▼                                           │
│  ┌─────────────────────────────┐                                │
│  │ Aggregate Results           │                                │
│  │ Generate Report             │                                │
│  └─────────────────────────────┘                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 8.2 Complete Evaluation Script

```python
import json
from datetime import datetime

def run_full_evaluation(
    golden_dataset_path: str,
    output_path: str,
    pinecone_index,
    shloka_database: dict,
    llm_client,
    run_semantic_checks: bool = True
):
    """
    Run the complete Tattva evaluation suite.
    
    This is the main entry point for evaluations.
    """
    print("=" * 60)
    print("TATTVA EVALUATION SUITE")
    print(f"Started: {datetime.now().isoformat()}")
    print("=" * 60)
    
    # Load golden dataset
    print("\n[1/5] Loading golden dataset...")
    with open(golden_dataset_path, 'r') as f:
        golden_dataset = json.load(f)
    print(f"      Loaded {len(golden_dataset['questions'])} questions")
    
    # Run questions through Tattva
    print("\n[2/5] Running questions through Tattva...")
    traces = {}
    for question in golden_dataset['questions']:
        trace = run_tattva_query(question['question'])  # Your API call
        traces[question['id']] = trace
        print(f"      ✓ {question['id']}")
    
    # Run Citation Verification
    print("\n[3/5] Running Citation Verification...")
    citation_results = run_citation_verification(
        golden_dataset=golden_dataset,
        traces=traces,
        pinecone_index=pinecone_index
    )
    print(f"      Pass rate: {citation_results['summary']['pass_rate']:.1%}")
    
    # Run Routing Evaluation
    print("\n[4/5] Running Routing Evaluation...")
    routing_results = run_routing_evaluation(
        golden_dataset=golden_dataset,
        traces=traces
    )
    print(f"      Strict accuracy: {routing_results['summary']['strict_accuracy']:.1%}")
    print(f"      Lenient accuracy: {routing_results['summary']['lenient_accuracy']:.1%}")
    
    # Run Template Compliance
    print("\n[5/5] Running Template Compliance...")
    template_results = run_template_compliance_evaluation(
        golden_dataset=golden_dataset,
        traces=traces,
        shloka_database=shloka_database,
        llm_client=llm_client,
        run_semantic=run_semantic_checks
    )
    print(f"      Structural pass rate: {template_results['summary']['structural_pass_rate']:.1%}")
    print(f"      Overall pass rate: {template_results['summary']['overall_pass_rate']:.1%}")
    
    # Aggregate results
    print("\n" + "=" * 60)
    print("EVALUATION COMPLETE")
    print("=" * 60)
    
    final_report = {
        'metadata': {
            'timestamp': datetime.now().isoformat(),
            'golden_dataset_version': golden_dataset['metadata']['version'],
            'total_questions': len(golden_dataset['questions']),
            'semantic_checks_enabled': run_semantic_checks
        },
        'summary': {
            'citation_verification': {
                'pass_rate': citation_results['summary']['pass_rate'],
                'target': 1.0,
                'status': 'PASS' if citation_results['summary']['pass_rate'] == 1.0 else 'FAIL'
            },
            'routing_accuracy': {
                'strict': routing_results['summary']['strict_accuracy'],
                'lenient': routing_results['summary']['lenient_accuracy'],
                'target': 0.9,
                'status': 'PASS' if routing_results['summary']['lenient_accuracy'] >= 0.9 else 'FAIL'
            },
            'template_compliance': {
                'structural': template_results['summary']['structural_pass_rate'],
                'overall': template_results['summary']['overall_pass_rate'],
                'target_structural': 0.95,
                'target_overall': 0.9,
                'status': 'PASS' if template_results['summary']['overall_pass_rate'] >= 0.9 else 'FAIL'
            }
        },
        'launch_ready': all([
            citation_results['summary']['pass_rate'] == 1.0,
            routing_results['summary']['lenient_accuracy'] >= 0.9,
            template_results['summary']['overall_pass_rate'] >= 0.9
        ]),
        'detailed_results': {
            'citations': citation_results,
            'routing': routing_results,
            'template': template_results
        }
    }
    
    # Print summary
    print("\nSUMMARY:")
    print(f"  Citation Verification: {final_report['summary']['citation_verification']['status']}")
    print(f"  Routing Accuracy:      {final_report['summary']['routing_accuracy']['status']}")
    print(f"  Template Compliance:   {final_report['summary']['template_compliance']['status']}")
    print(f"\n  LAUNCH READY: {'✓ YES' if final_report['launch_ready'] else '✗ NO'}")
    
    # Save report
    with open(output_path, 'w') as f:
        json.dump(final_report, f, indent=2)
    print(f"\nReport saved to: {output_path}")
    
    return final_report
```

## 8.3 Running Evaluations

### Before First Run

Checklist:
- [ ] Golden dataset finalized and saved as JSON
- [ ] Trace logging working correctly
- [ ] Pinecone connection tested
- [ ] Shloka database accessible
- [ ] LLM client configured (for semantic checks)

### Command to Run

```python
# In your evaluation notebook or script:

results = run_full_evaluation(
    golden_dataset_path='data/golden_dataset.json',
    output_path='reports/eval_report_2025_12_18.json',
    pinecone_index=your_pinecone_index,
    shloka_database=your_shloka_database,
    llm_client=your_claude_client,
    run_semantic_checks=True
)
```

### Interpreting Output

```
================================================================
TATTVA EVALUATION SUITE
Started: 2025-12-18T14:30:00

[1/5] Loading golden dataset...
      Loaded 30 questions

[2/5] Running questions through Tattva...
      ✓ T1-001
      ✓ T1-002
      ... (30 questions)

[3/5] Running Citation Verification...
      Pass rate: 96.7%        ← 1 phantom citation found

[4/5] Running Routing Evaluation...
      Strict accuracy: 83.3%  ← Exact match rate
      Lenient accuracy: 93.3% ← Including acceptable alternatives

[5/5] Running Template Compliance...
      Structural pass rate: 96.7%
      Overall pass rate: 90.0%

================================================================
EVALUATION COMPLETE
================================================================

SUMMARY:
  Citation Verification: FAIL (target: 100%, actual: 96.7%)
  Routing Accuracy:      PASS (target: 90%, actual: 93.3%)
  Template Compliance:   PASS (target: 90%, actual: 90.0%)

  LAUNCH READY: ✗ NO
```

---

# Part 9: Interpreting Results & Taking Action

## 9.1 Reading the Evaluation Report

### High-Level Questions

1. **Did we hit our targets?**
   - Citation: 100% (zero tolerance)
   - Routing: 90%+ (lenient)
   - Template: 90%+ (overall)

2. **What's blocking launch?**
   - Look at which evaluator is FAIL
   - Dive into the detailed results for that evaluator

3. **What are the specific failures?**
   - Each failed case should be reviewed individually
   - Group failures by pattern (from error analysis taxonomy)

### Detailed Analysis Workflow

```python
def analyze_failures(report: dict) -> dict:
    """
    Analyze evaluation failures and group them by pattern.
    """
    failures = {
        'citation_failures': [],
        'routing_failures': [],
        'template_failures': []
    }
    
    # Extract citation failures
    for item in report['detailed_results']['citations']['details']:
        if item.get('result') == 'FAIL':
            failures['citation_failures'].append({
                'question_id': item['question_id'],
                'phantom_citations': item['phantom_citations']
            })
    
    # Extract routing failures
    for item in report['detailed_results']['routing']['details']:
        if item.get('routing', {}).get('result') == 'FAIL':
            failures['routing_failures'].append({
                'question_id': item['question_id'],
                'question': item['question'],
                'expected': item['routing']['expected_category'],
                'actual': item['routing']['system_category']
            })
    
    # Extract template failures
    for item in report['detailed_results']['template']['details']:
        if item.get('overall_result') != 'PASS':
            failures['template_failures'].append({
                'question_id': item['question_id'],
                'failure_type': item['overall_result'],
                'structural_failures': item.get('structural', {}).get('failures', []),
                'semantic_issues': item.get('semantic', {}).get('evaluations', [])
            })
    
    return failures
```

## 9.2 Action Playbook for Each Failure Type

### Citation Verification Failures

**Symptom**: Phantom citation found
**Root causes**:
1. Claude is hallucinating citations
2. Citation format variation not in database
3. Shloka numbering mismatch

**Investigation steps**:
1. Get the phantom citation: `"Sundara 62.99"`
2. Check if sarga 62 exists: Yes
3. Check max shloka in sarga 62: 50
4. Conclusion: Claude invented shloka 99

**Fix options**:
- Add constraint to Claude prompt: "Only cite shlokas from the retrieved set"
- Add post-processing: Verify citations before returning answer
- Add few-shot examples of correct citation format

### Routing Failures

**Symptom**: Question went to wrong category
**Root causes**:
1. Classifier prompt ambiguous
2. Missing examples for edge cases
3. Category definitions overlap

**Investigation steps**:
1. Get the misrouted question: "Why is Rama considered maryada purushottam?"
2. Expected: Dharma-Concept
3. Actual: Character-Analysis
4. Ask: Is this a reasonable interpretation?
5. If no: Classifier needs improvement

**Fix options**:
- Add examples of this question type to classifier prompt
- Clarify category definitions
- Add to acceptable alternatives if borderline

### Template Compliance Failures

**Symptom**: Answer doesn't follow template rules
**Root causes**:
1. Generation prompt too flexible
2. Claude ignoring template instructions
3. Edge case not covered in prompt

**Investigation steps**:
1. Structural failure: "Missing citation section"
2. Check the answer: Does it have citations inline but no section?
3. Check generation prompt: Is citation section explicitly required?

**Fix options**:
- Make template requirements explicit in generation prompt
- Add examples of correct structure
- Use structured output (JSON) for answers

## 9.3 Iteration Cycle

```
┌─────────────────────────────────────────────────────────────────┐
│ EVALUATION → FIX → RE-EVALUATE CYCLE                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐                │
│  │  Run     │────▶│  Analyze │────▶│  Fix     │                │
│  │  Eval    │     │  Failures│     │  Root    │                │
│  └──────────┘     └──────────┘     │  Cause   │                │
│       ▲                            └────┬─────┘                │
│       │                                 │                       │
│       │                                 ▼                       │
│       │           ┌──────────┐     ┌──────────┐                │
│       └───────────│  Check   │◀────│  Deploy  │                │
│                   │  Targets │     │  Fix     │                │
│                   └──────────┘     └──────────┘                │
│                                                                 │
│  Target not met? ───────────────────────────────────▶ Repeat   │
│  Target met? ────────────────────────────────────────▶ Launch  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

# Part 10: Ongoing Monitoring & Maintenance

## 10.1 Post-Launch Evaluation Schedule

| Frequency | Activity | Purpose |
|-----------|----------|---------|
| Daily | Sample 10 random traces | Spot-check for new issues |
| Weekly | Run full eval suite | Track regression |
| After each deploy | Run full eval suite | Verify no regression |
| Monthly | Expand golden dataset | Cover new edge cases |

## 10.2 Adding New Golden Questions

When you discover new failure modes in production:

1. **Document the failure** in your error taxonomy
2. **Create a golden question** that reproduces the failure
3. **Add to golden dataset** with expected behavior
4. **Run eval** to verify it fails (before fix)
5. **Fix the issue**
6. **Run eval** to verify it passes (after fix)

## 10.3 Monitoring Alerts

Set up alerts for:
- Citation verification drops below 100%
- Routing accuracy drops below 85%
- Template compliance drops below 90%
- Any new failure pattern appears 3+ times

---

# Part 11: Troubleshooting Guide

## 11.1 Common Issues and Solutions

### Issue: Evaluation takes too long

**Symptom**: Full suite takes >30 minutes
**Causes**:
- Too many semantic checks (LLM calls)
- Pinecone queries slow
- Golden dataset too large

**Solutions**:
- Run structural checks first, semantic only on failures
- Batch Pinecone queries
- Sample golden dataset for quick checks

### Issue: LLM judge gives inconsistent results

**Symptom**: Same input gives different judgments
**Causes**:
- Temperature too high
- Prompt ambiguous
- Edge case not covered

**Solutions**:
- Set temperature to 0
- Add more examples to prompt
- Make judgment criteria more explicit

### Issue: Citation regex missing citations

**Symptom**: Citations in answer not detected
**Causes**:
- New citation format
- Unicode characters
- Malformed citation

**Solutions**:
- Review failed cases manually
- Add new patterns to regex
- Normalize text before matching

### Issue: Routing evaluator too strict

**Symptom**: Many "borderline" cases failing
**Causes**:
- Acceptable alternatives not documented
- Category definitions too narrow

**Solutions**:
- Review failures and add acceptable alternatives
- Consider using "SOFT_FAIL" for same-group misroutes

---

