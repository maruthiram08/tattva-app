
You are a world-class evaluator specializing in citation verification systems for scholarly AI applications. Your task is to create a comprehensive plan for building a Citation Verifier that will ensure every citation in Tattva's answers actually exists in the Pinecone database.

## Context and Importance

Citation verification is critical for scholarly tools. A phantom citation (a made-up reference) is the worst kind of failure because it destroys user trust instantly. This evaluator is deterministic (no LLM needed) and relatively low complexity, but it must be thorough and reliable.

## Your Task

You will receive detailed prompts for each step of building this Citation Verifier, and a golden dataset to test against. Your job is to **create a plan, NOT to implement the solution**. You will analyze each step and prepare a detailed planning document that can guide implementation later.

Here are the step-by-step prompts you need to plan for:

<step_prompts>
{{STEP_PROMPTS}}
</step_prompts>

Here is the golden dataset that will be used for testing:

<golden_dataset>
{{GOLDEN_DATASET}}
</golden_dataset>

## Overview of the Citation Verifier

**Purpose**: Verify that every citation in Tattva's answers actually exists in your Pinecone database.

**Type**: Deterministic (no LLM needed)

**Input**:
- Generated answer text
- (Optional) Trace with structured citation data

**Output**:
- Result: PASS / FAIL
- If FAIL: List of phantom citations
- Verification details for each citation

## The Six Steps You Need to Plan

1. **Define Citation Patterns** - Identify how citations appear in text
2. **Normalise Kanda Names** - Handle variations in scripture book names
3. **Build Pinecone Lookup Function** - Create database query mechanism
4. **Build the Complete Verifier** - Integrate all components
5. **Run on Golden Dataset** - Test against known examples
6. **Handle Edge Cases and Final Checklist** - Ensure robustness

## Your Planning Instructions

Before writing your plan, use the scratchpad to think through:
- What each step requires
- Dependencies between steps
- Potential challenges or edge cases
- How the golden dataset should be used
- What success criteria look like for each step

<scratchpad>
Think through your approach here. Consider:
- What information is provided in each step prompt?
- What are the key technical challenges?
- How do the steps build on each other?
- What edge cases need consideration?
- How will you structure the plan to be actionable?
</scratchpad>

Now, create your comprehensive plan. For each of the six steps, provide:

1. **Step Overview** - What this step accomplishes
2. **Key Requirements** - What needs to be defined/built
3. **Inputs Required** - What information or components are needed
4. **Expected Outputs** - What should be produced
5. **Dependencies** - What must be completed before this step
6. **Success Criteria** - How to know this step is complete
7. **Potential Challenges** - Edge cases or difficulties to anticipate

After planning all six steps, include:
- **Integration Plan** - How the steps come together
- **Testing Strategy** - How to use the golden dataset effectively
- **Quality Assurance** - Final checks before deployment

Structure your plan clearly with headers and bullet points for easy reference during implementation.

Write your complete plan inside <plan> tags.