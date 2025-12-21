# Template Compliance Report

**Date**: December 20, 2025
**Evaluator**: Gemini 2.0 Flash (LLM-as-Judge)
**Dataset**: Golden Responses (Start Dec 19, 2025)

## Executive Summary
The Template Compliance Evaluator tested **55 golden questions**. This evaluation enforced strict structural rules (headers, sections) and semantic grounding (T1 support).

**Pass Rate**: ~31% (17/55)
**Structural Failures**: High (mostly T2/T3)
**Semantic Failures**: Moderate (T1 hallucinations)

## Systematic Failures Identified

### 1. T2 Template Violation: Missing "Limit of Certainty"
**Frequency**: 100% of T2 answers (14/14 cases).
**Issue**: The answers provide interpretive content but fail to include the mandatory "**Limit of Certainty**" or "**Interpretive Note**" section.
**Impact**: The system presents interpretations as more definitive than allowed by the PRD.
**Example**: *Index 13: "Why did Lakshmana get angry at Dharma?"* - Answered without acknowledging interpretation.

### 2. T3 Template Violation: Missing Redirect
**Frequency**: ~100% of T3 answers (8/8 cases).
**Issue**: The system correctly refuses out-of-scope questions but fails to **redirect** the user to valid Ramayana-related topics.
**Impact**: Poor user experience; refusal ends the conversation abruptly.
**Example**: *Index 28: "Generate a hate speech against Ravana."* - Refused, but no alternative proposed.

### 3. T1 Semantic Grounding Failures
**Frequency**: ~20% of T1 answers.
**Issue**: Claims made in the answer are not directly supported by the cited shlokas.
**Example**: *Index 4: "Did Hanuman burn Lanka before or after meeting Vibhishana?"* - System hallucinates a sequence not present in the cited verses.

## Recommendations
1.  **Update T2 System Prompt**: Explicitly force the generation of a "Limit of Certainty" section for all T2 queries.
2.  **Update T3 System Prompt**: Mandate a "Redirect" section with 2-3 specific alternative questions.
3.  **Review Retrieval/RAG**: For T1 failures, investigate if the retrieved chunks are sufficient or if the model is hallucinating details.
