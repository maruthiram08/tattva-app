# Routing Tolerance Policy

**Date**: December 20, 2025
**Decision**: SOFT_FAILs count as ACCEPTABLE

## Policy

| Result Type | Status |
|-------------|--------|
| EXACT match | ✅ PASS |
| SOFT_FAIL (same group) | ✅ PASS |
| HARD FAIL (mismatch) | ❌ FAIL |

## Accuracy Formula

```
Lenient Accuracy = (EXACT + SOFT_FAIL) / Total
```

## Current Metrics (After Quick Win Fixes)

| Calculation | Count | Rate |
|-------------|-------|------|
| EXACT matches | 47 | 78.3% |
| SOFT_FAIL (same group) | 7 | 11.7% |
| **Lenient Accuracy** | 54 | **90.0%** ✅ |
| HARD FAIL | 6 | 10.0% |

## Rationale

1. **Same category group = similar template treatment**
   - Both "Duty vs emotion" and "Moral dilemmas" are T2 templates
   - User experience not impacted by same-group misroutes

2. **Boundary cases are inevitable**
   - 45-category taxonomy has natural overlaps
   - "Consequences of adharma" vs "Duty-driven decisions" is defensible either way

3. **Focus on hard failures**
   - True failures (wrong group) = actual user impact
   - These are the ones worth fixing

## Remaining Hard Failures (6 questions)

| Q# | Question | System | Expected |
|----|----------|--------|----------|
| Q2 | Sloka meter origin | Context of verse | Sarga overview |
| Q14 | Sambuka killing | Duty-driven | Consequences of adharma |
| Q24 | Squirrel on bridge | Clarifying confusions | Minor episodes |
| Q42 | Verses misinterpreted | Ambiguity in text | Clarifying confusions |
| Q47 | Agni Pariksha | Duty-driven | Moral dilemmas |
| Q58 | Contest Rama won | Major plot events | Character actions |

---

*Policy approved: December 20, 2025*
