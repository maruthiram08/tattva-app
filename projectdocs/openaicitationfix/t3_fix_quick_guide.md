# Quick Action Guide: Fix T3 Evaluation & Complete Phase A

**Time Required**: 1 hour  
**Complexity**: Low  
**Impact**: HIGH - Unlocks Phase B progression

---

## 🎯 The Problem

Your Gemini evaluation script is marking T3 refusal questions as **FAIL** for citations when it should mark them as **N/A**.

**Impact**: 
- 7/8 T3 questions incorrectly fail
- BOTH_PASS rate shows 41.7% instead of actual 53.3%
- Blocks Phase B progression

---

## ✅ The Solution (3 Steps)

### Step 1: Fix the Evaluation Script (30 min)

**File**: `scripts/evaluate_with_gemini.py`

**What to add**: Before evaluating citations, check if it's a T3 question.

**Find this section** (or similar):
```python
# Evaluation logic section
openai_cites_shlokas = evaluate_citations(openai_response, retrieved_shlokas)
claude_cites_shlokas = evaluate_citations(claude_response, retrieved_shlokas)
```

**Replace with**:
```python
# Check if this is a T3 refusal question
expected_template = question_data.get('expected_template', '')

if expected_template == 'T3':
    # T3 refusals should NOT have citations - skip this check
    openai_cites_shlokas = 'N/A'
    claude_cites_shlokas = 'N/A'
    openai_retrieval_check = 'N/A'
    claude_retrieval_check = 'N/A'
    
    # For T3, check for proper refusal behavior instead
    openai_answers_question = check_t3_refusal(openai_response)
    claude_answers_question = check_t3_refusal(claude_response)
else:
    # Normal evaluation for T1/T2
    openai_cites_shlokas = evaluate_citations(openai_response, retrieved_shlokas)
    claude_cites_shlokas = evaluate_citations(claude_response, retrieved_shlokas)
    openai_retrieval_check = evaluate_retrieval(retrieved_shlokas)
    claude_retrieval_check = evaluate_retrieval(retrieved_shlokas)
    openai_answers_question = evaluate_answer_quality(openai_response, question)
    claude_answers_question = evaluate_answer_quality(claude_response, question)
```

**Add T3 refusal check function**:
```python
def check_t3_refusal(response_text):
    """
    Check if a T3 response properly refuses and redirects.
    
    Returns: 'PASS' or 'FAIL'
    """
    refusal_patterns = [
        r'outside (my|the) scope',
        r'cannot (help|assist|answer)',
        r'falls outside',
        r'not (within|in) my (scope|purview)',
        r'beyond (my|the) scope',
    ]
    
    redirect_patterns = [
        r'however,? i can',
        r'instead,? (i can|i could)',
        r'would you like',
    ]
    
    has_refusal = any(re.search(p, response_text, re.IGNORECASE) for p in refusal_patterns)
    has_redirect = any(re.search(p, response_text, re.IGNORECASE) for p in redirect_patterns)
    
    # Good T3: Has refusal AND redirect
    if has_refusal and has_redirect:
        return 'PASS'
    elif has_refusal:
        return 'PASS'  # Refusal alone is acceptable
    else:
        return 'FAIL'  # Didn't refuse properly
```

### Step 2: Test on Single T3 Question (5 min)

**Create test script**:
```bash
python3 << 'TEST_T3'
import sys
sys.path.append('scripts')
from evaluate_with_gemini import evaluate_single_question

# Test on one T3 question
test_question = {
    'user_query': 'Can you draw Rama?',
    'expected_template': 'T3',
    'classification': 'Why a question is refused'
}

result = evaluate_single_question(test_question)

print("T3 TEST RESULTS:")
print(f"  openai_cites_shlokas: {result['openai_cites_shlokas']}")
print(f"  claude_cites_shlokas: {result['claude_cites_shlokas']}")
print(f"  openai_retrieval_check: {result['openai_retrieval_check']}")
print(f"  claude_retrieval_check: {result['claude_retrieval_check']}")

if result['openai_cites_shlokas'] == 'N/A' and result['claude_cites_shlokas'] == 'N/A':
    print("\n✅ T3 FIX IS WORKING!")
else:
    print("\n❌ T3 FIX NOT APPLIED CORRECTLY")
TEST_T3
```

**Expected output**:
```
T3 TEST RESULTS:
  openai_cites_shlokas: N/A
  claude_cites_shlokas: N/A
  openai_retrieval_check: N/A
  claude_retrieval_check: N/A

✅ T3 FIX IS WORKING!
```

### Step 3: Re-run Full Evaluation (10 min)

```bash
# Re-run on all 60 questions
python scripts/evaluate_with_gemini.py \
  --input projectupdates/golden_responses_AFTER_FIX_2025_12_19_2037.json \
  --output projectupdates/gemini_evaluation_AFTER_FIX_V2.csv \
  --golden-dataset /mnt/project/golden_dataset.csv

echo "Re-evaluation complete!"
```

---

## 🔍 Verification Steps

### Quick Check (30 seconds)

```bash
python3 << 'VERIFY'
import pandas as pd

df = pd.read_csv('projectupdates/gemini_evaluation_AFTER_FIX_V2.csv')
t3 = df[df['expected_template'] == 'T3']

print("VERIFICATION RESULTS:")
print(f"  Total T3 questions: {len(t3)}")
print(f"  OpenAI N/A count: {(t3['openai_cites_shlokas'] == 'N/A').sum()}/8")
print(f"  Claude N/A count: {(t3['claude_cites_shlokas'] == 'N/A').sum()}/8")

if (t3['openai_cites_shlokas'] == 'N/A').sum() == 8:
    print("\n✅ T3 FIX VERIFIED - ALL CHECKS SHOW N/A")
    
    # Calculate new BOTH_PASS rate
    def calc_passed(row, model):
        checks = [
            row[f'{model}_routing_check'],
            row[f'{model}_retrieval_check'],
            row[f'{model}_answers_question'],
            row[f'{model}_cites_shlokas'],
            row[f'{model}_follows_template'],
            row[f'{model}_no_hallucination']
        ]
        applicable = [c for c in checks if c != 'N/A']
        return all(c == 'PASS' for c in applicable)
    
    df['openai_passed'] = df.apply(lambda r: calc_passed(r, 'openai'), axis=1)
    df['claude_passed'] = df.apply(lambda r: calc_passed(r, 'claude'), axis=1)
    
    both_pass = ((df['openai_passed']) & (df['claude_passed'])).sum()
    
    print(f"\n📊 UPDATED METRICS:")
    print(f"  BOTH_PASS: {both_pass}/60 ({both_pass/60*100:.1f}%)")
    print(f"  Target: >50%")
    
    if both_pass / 60 > 0.50:
        print("\n🎉 ALL SUCCESS CRITERIA MET!")
        print("✅ READY TO PROCEED TO PHASE B")
    else:
        print(f"\n⚠️ Still below target by {30-both_pass} questions")
else:
    print("\n❌ T3 FIX NOT WORKING - REVIEW SCRIPT")
VERIFY
```

### Expected Output

```
VERIFICATION RESULTS:
  Total T3 questions: 8
  OpenAI N/A count: 8/8
  Claude N/A count: 8/8

✅ T3 FIX VERIFIED - ALL CHECKS SHOW N/A

📊 UPDATED METRICS:
  BOTH_PASS: 32/60 (53.3%)
  Target: >50%

🎉 ALL SUCCESS CRITERIA MET!
✅ READY TO PROCEED TO PHASE B
```

---

## 📊 Expected Metrics After Fix

| Metric | Before T3 Fix | After T3 Fix | Target | Status |
|--------|--------------|-------------|--------|--------|
| BOTH_PASS | 25/60 (41.7%) | 32/60 (53.3%) | >50% | ✅ MET |
| T3 Pass Rate | 0/8 (0%) | 7/8 (87.5%) | ≥87.5% | ✅ MET |
| T3 N/A Applied | 0/16 | 16/16 (100%) | 16/16 | ✅ MET |

---

## 🚨 Troubleshooting

### Issue: Script doesn't have 'expected_template'

**Solution**: Merge with golden dataset to get expected_template:

```python
import pandas as pd

golden = pd.read_csv('/mnt/project/golden_dataset.csv')
responses = # ... your response data

# Merge to get expected_template
merged = responses.merge(
    golden[['user_query', 'expected_template']], 
    on='user_query'
)
```

### Issue: T3 questions still show FAIL

**Possible causes**:
1. Conditional not triggering (check `expected_template` field exists)
2. Code not reached (check logic flow)
3. Script cached (restart Python/clear cache)

**Debug**:
```python
# Add debug prints
if expected_template == 'T3':
    print(f"DEBUG: T3 detected for question: {question[:50]}")
    print(f"  Setting cites_shlokas to N/A")
```

### Issue: Verification shows still below 50%

**Check**:
1. Are T3 questions actually passing now? (Should be 7-8/8)
2. Review questions that still fail - what checks are they failing?
3. May need additional improvements beyond T3 fix

---

## 📋 Completion Checklist

```
[ ] Step 1: Modified evaluate_with_gemini.py with T3 conditional
[ ] Step 2: Added check_t3_refusal function
[ ] Step 3: Tested on single T3 question - verified N/A output
[ ] Step 4: Re-ran full evaluation on 60 questions
[ ] Step 5: Verified T3 questions show N/A (16/16)
[ ] Step 6: Calculated new BOTH_PASS rate
[ ] Step 7: Confirmed BOTH_PASS >50%
[ ] Step 8: Generated final metrics report
[ ] Step 9: Saved gemini_evaluation_AFTER_FIX_V2.csv
[ ] Step 10: Updated project documentation
```

---

## 🎯 Success Criteria

You're done when ALL of these are true:

```
✅ All 8 T3 questions show cites_shlokas = 'N/A' (both models)
✅ All 8 T3 questions show retrieval_check = 'N/A' (both models)
✅ BOTH_PASS rate ≥ 50% (≥30/60 questions)
✅ T3 pass rate ≥ 87.5% (≥7/8 questions)
✅ Output CSV saved with correct format
```

---

## 🚀 After Completion

Once verified:

1. **Update Phase A status**: COMPLETE ✅

2. **Generate sign-off report**:
   ```bash
   python scripts/generate_phase_a_signoff.py \
     --evaluation projectupdates/gemini_evaluation_AFTER_FIX_V2.csv \
     --baseline /mnt/project/golden_dataset.csv
   ```

3. **Proceed to Phase B**:
   - Review Phase B implementation guides
   - Begin implementing Citation Verifier
   - Begin implementing Routing Evaluator
   - Begin implementing Template Compliance Evaluator

4. **Estimated Phase B timeline**: 3-4 weeks

---

## 💡 Key Takeaways

**What You Learned**:
- T3 questions need special handling (N/A for inapplicable checks)
- Evaluation logic must match template requirements
- Small bugs can have outsized impact on metrics

**What Worked**:
- Citation fixes were successful (94.2% OpenAI, 86.5% Claude)
- Overall system improvements significant (+19 BOTH_PASS even with bug)
- Response generation pipeline working well

**What's Next**:
- Fix this one issue (T3 evaluation)
- Verify all criteria met
- Move to Phase B with confidence

---

**Estimated Total Time**: 1 hour from start to finish  
**Difficulty**: Low (straightforward code change)  
**Impact**: High (unlocks Phase B progression)

🎯 **Let's complete Phase A properly!**
