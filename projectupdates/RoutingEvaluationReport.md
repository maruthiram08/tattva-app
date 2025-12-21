# Routing Evaluation Report

**Date**: December 19, 2025
**Evaluator**: Gemini 2.0 Flash (LLM-as-Judge)
**Dataset**: Golden Responses (Start Dec 19, 2025)

## Executive Summary
The Routing Evaluator tested **55 golden questions** against the Tattva routing system (OpenAI-based). The system achieved a **96.4% success rate**, demonstrating highly robust classification capabilities.

| Metric | Count | Percentage |
| :--- | :--- | :--- |
| **Total Evaluated** | 55 | 100% |
| **Pass (Exact Match)** | 53 | 96.4% |
| **Soft Fail (Same Group)** | 1 | 1.8% |
| **Fail (Mismatch)** | 1 | 1.8% |

## Failure Analysis

### 1. Failures (Mismatch)
> **Index 20**: "What does 'Ikshvaku' mean in the context of lineage?"
> - **System**: `Character lineage` (Group B)
> - **Expected**: `Meaning of key Sanskrit terms` (Group D)
> - **Analysis**: The system routed this to "Character lineage" because "Ikshvaku" is the founder of Rama's dynasty. While technically correct contextually, the user intent was likely definition-based.
> - **Severity**: Low. The answer will likely still be accurate using T1 template.

### 2. Soft Failures (Same Group)
> **Index 10**: "How did Rama identify Luv and Kush?"
> - **System**: `Character actions`
> - **Expected**: `Character identity`
> - **Analysis**: Both categories belong to Group B (Character Understanding). The distinction is subtle; identifying someone is an action.
> - **Verdict**: Acceptable variation.

## Conclusion
The routing system is performing well above the 95% target. The single mismatch is semantically defensible. No immediate changes to the routing logic are required.
