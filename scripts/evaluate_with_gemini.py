#!/usr/bin/env python3
"""
Ramayana Q&A Evaluation Script using Gemini as LLM-Judge.

Evaluates each row in the transformed CSV using the rubric from evaluation prompt.md.
Produces evaluations comparing both OpenAI and Claude outputs per question.
"""

import os
import sys
import csv
import json
import time
import re
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env.local')

import google.generativeai as genai

# Configuration
INPUT_FILE = "projectupdates/golden_for_gemini_eval_v3.csv"  # V3 with T3 why/outOfScopeNotice fields
OUTPUT_FILE = "projectupdates/gemini_evaluation_V3.csv"  # V3 with T3 refusal checker
MODEL_NAME = "gemini-2.0-flash"
DELAY_SECONDS = 4       # Optimized: 4s delay + execution time ~= 15 RPM (Safe max for free tier)
LIMIT_ROWS = None       # Full run
COVERAGE_MODE = False   # Disable test mode

# Indices for Coverage Test (0-based)
# Subset of 10 rows for final validation (Mix of T1, T2, T3)
COVERAGE_INDICES = [
    0, 2,               # T1 Standard
    29, 255,            # T2 Interpretive
    132, 269,           # T3 Refusal (Probable DRAW/NONE sources)
    124, 268,           # T3 Refusal
    201, 266            # Mix
]

# Initialize Gemini
genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))
model = genai.GenerativeModel(MODEL_NAME)

# OFFICIAL PRD CATEGORIES (45)
PRD_CATEGORIES = [
    # Story & Episode (15)
    "Epic overview", "Kanda overview", "Sarga overview", "Story chronology", "Timeline sequencing",
    "Major plot events", "Minor episodes", "Cause–effect relationships", "Narrative turning points",
    "Exile episodes", "Abduction episode", "Search journey episodes", "War & battle episodes",
    "Return & coronation", "Post-war events",
    # Character (10)
    "Character identity", "Character lineage", "Character role in story", "Character actions", "Character relationships",
    "Duty-driven decisions", "Loyalty-driven decisions", "Sacrificial choices", "Consequences of actions", "Character evolution",
    # Dharma & Ethics (8)
    "Definition of dharma", "Personal dharma", "Familial dharma", "Royal dharma", "Duty vs desire",
    "Duty vs emotion", "Consequences of adharma", "Moral dilemmas in text",
    # Verse & Language (7)
    "Meaning of a specific shloka", "Translation clarification", "Explanation of a verse", "Context of a verse",
    "Meaning of key Sanskrit terms", "Narrative explanation of verses", "Clarifying popular confusions",
    # Interpretation (3)
    "Ambiguity in text", "Multiple interpretations", "Narrative silence",
    # Meta (2)
    "Source transparency", "Why a question is refused"
]

# Evaluation Prompt Template (based on enhanced requirements)
EVAL_PROMPT_TEMPLATE = """
You are an AI evaluation agent tasked with reviewing the quality of Ramayana Q&A system outputs. 
You will analyze the data to assess routing accuracy, retrieval quality, answer quality, and edge cases. 

**NOTE: Citation verification against database is SKIPPED (mark citation_check as N/A). 
 However, you must still check if citations are PRESENT in the text.**

Here is the row data you will be evaluating:

<row_data>
{row_data}
</row_data>

**OFFICIAL 45 MVP CATEGORIES:**
{categories_list}

Please evaluate using the following detailed checklist. 
For binary columns, output "Pass" only if all applicable sub-checks pass, otherwise "Fail".

**1. CLASSIFICATION & ROUTING CHECK**
Valid PRD Category Check:
- Does `classification` match one of the 45 categories exactly? (Output in classification_check)
- If No, suggest the correct one in classification_suggestion.

Appropriateness Check (Output in openai_routing_check / claude_routing_check):
- Does this category make sense for this question?
- Would a different category be more appropriate?
- If it is an out-of-scope question, did it correctly get assigned "Why a question is refused" (T3)?

**2. RETRIEVAL CHECK (Per Model)**
(Output in openai_retrieval_check / claude_retrieval_check)

**T3 EXCEPTION**: If template == "T3", output "N/A" for retrieval check. T3 refusals do NOT require retrieval - this is correct behavior.

For T1/T2 only:
- Are the retrieved shlokas relevant to the question?
- Did retrieval find the RIGHT part of the epic?
- Are there obvious shlokas that should have been found but were missed?

**3. ANSWER QUALITY CHECK (Per Model)**
Score these 4 dimensions separately for OpenAI and Claude:

A. **Answers Question** (openai_answers_question / claude_answers_question)

**T3 SPECIAL LOGIC**: For T3 refusals, "answering" means politely refusing. Check if:
- Response indicates the question is out of scope
- Response offers alternative in-scope topics  
- Response does NOT provide a substantive Ramayana answer with citations
If proper refusal → PASS. If tries to answer anyway → FAIL.

For T1/T2:
- Does the answer actually address the question?
- Is it direct and helpful?

B. **Cites Shlokas** (openai_cites_shlokas / claude_cites_shlokas)

**T3 EXCEPTION**: If template == "T3", output "N/A" for cites_shlokas. T3 refusals should NOT have citations - that's correct behavior. Do NOT mark as FAIL for missing citations on T3.

For T1/T2 only:
- Does the answer include specific Citations (Kanda.Sarga.Shloka)?
- (Note: Don't verify existence in DB, just checking presence in text).

C. **Follows Template** (openai_follows_template / claude_follows_template)
- Does the answer follow the template structure (T1/T2/T3)?
- Is there any speculation in T1? (Strict Fail if yes)
- For T3: Does it politely refuse and offer alternatives?

D. **No Hallucination/Support** (openai_no_hallucination / claude_no_hallucination)
- Is there any content NOT supported by the text/shlokas?
- Is the facts grounded in Valmiki Ramayana?

**4. EDGE CASE CHECK (Pass/Fail)**
- Any unexpected behavior?
- Anything that would embarrass us if a scholar saw it?

**T3 REFUSAL DECISION MATRIX**
When template == "T3", use this matrix:
| Check | Expected Value | Reason |
|-------|---------------|--------|
| retrieval_check | N/A | T3 doesn't require retrieval |
| cites_shlokas | N/A | T3 should NOT have citations |
| answers_question | PASS if proper refusal | Refusal = correct answer |
| follows_template | PASS if polite + redirects | Check T3 format |
| no_hallucination | PASS if no false claims | Still applicable |

Signs of proper T3 refusal:
- "outside my scope", "cannot help with", "falls outside", "beyond my scope"
- Offers alternative topics from Ramayana
- Does NOT cite shlokas or provide textual analysis

------------------

Provide your evaluation in this exact XML format:

<evaluation>
<classification_check>[Pass/Fail]</classification_check>
<classification_suggestion>[If Fail, name the correct PRD Category. If Pass, write "N/A"]</classification_suggestion>

<openai_routing_check>[Pass/Fail]</openai_routing_check>
<openai_retrieval_check>[Pass/Fail/N/A]</openai_retrieval_check>
<openai_answers_question>[Pass/Fail]</openai_answers_question>
<openai_cites_shlokas>[Pass/Fail/N/A]</openai_cites_shlokas>
<openai_follows_template>[Pass/Fail]</openai_follows_template>
<openai_no_hallucination>[Pass/Fail]</openai_no_hallucination>

<claude_routing_check>[Pass/Fail]</claude_routing_check>
<claude_retrieval_check>[Pass/Fail/N/A]</claude_retrieval_check>
<claude_answers_question>[Pass/Fail]</claude_answers_question>
<claude_cites_shlokas>[Pass/Fail/N/A]</claude_cites_shlokas>
<claude_follows_template>[Pass/Fail]</claude_follows_template>
<claude_no_hallucination>[Pass/Fail]</claude_no_hallucination>

<edge_case_check>[Pass/Fail]</edge_case_check>
<winner>[OpenAI/Claude/Tie]</winner>
<comments>[Specific, actionable comments. Mention which strict check failed if any.]</comments>
<fail_group_category>[If any failures, list applicable codes like "1a, 3a". If all pass, write "None"]</fail_group_category>
</evaluation>
"""

def format_row_data(row):
    """Format a CSV row as readable key-value pairs for the prompt."""
    # Key columns to include
    key_cols = [
        'user_query', 'expanded_query', 'Subgroup', 'classification', 'template', 'Expected_Depth',
        'openai_final_answer', 'openai_retrieved_shlokas_ids', 'openai_retrieved_shlokas_count', 'openai_status',
        'claude_final_answer', 'claude_retrieved_shlokas_ids', 'claude_retrieved_shlokas_count', 'claude_status'
    ]
    
    lines = []
    for col in key_cols:
        if col in row:
            val = row[col]
            # Truncate very long answers for prompt efficiency
            if len(str(val)) > 2000:
                val = str(val)[:2000] + "... [truncated]"
            lines.append(f"{col}: {val}")
    
    return "\n".join(lines)

import random

# ... (PRD Categories remain same)

# ... (Prompt Template Updated above)

# ... (Imports and Constants same)

def clean_value(val):
    """Normalize values to PASS/FAIL/N/A without brackets."""
    if not val: return "N/A"
    # Aggressively remove brackets and whitespace
    clean = val.replace('[', '').replace(']', '').strip()
    
    # Uppercase usually, but keep casing for comments/names if needed
    # For strict checks, force uppercase
    if clean.upper() in ['PASS', 'FAIL', 'N/A', 'NONE', 'TIE', 'OPENAI', 'CLAUDE', 'BOTH']:
        return clean.upper()
    
    return clean

def check_t3_refusal(answer_text):
    """
    Check if a T3 response properly refuses and redirects.
    
    A good T3 response should:
    1. Politely decline to answer (out of scope)
    2. Optionally offer alternative topics
    3. NOT provide a substantive answer about Ramayana with citations
    
    Returns: 'PASS' if proper refusal, 'FAIL' if not
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
        r'out of scope',
        r'not something i can',
        # Tattva-specific patterns
        r'outside tattva',
        r'outside the scope',
        r'tattva.*(focus|specialize|interpret)',
        r'does not engage in',
        r'beyond the text',
        r'outside.*text of valmiki',
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
    
    # Check for substantive answer (bad for T3)
    has_substantive = any(re.search(pattern, answer_lower) for pattern in substantive_answer_patterns)
    
    # T3 passes if: has refusal language AND no substantive answer
    if has_refusal and not has_substantive:
        return 'PASS'
    elif has_substantive:
        return 'FAIL'  # Should not provide substantive answer
    else:
        # Check for very short responses (might be valid refusals)
        if len(answer_text) < 200 and ('sorry' in answer_lower or 'apologize' in answer_lower):
            return 'PASS'
        return 'FAIL'  # No clear refusal language

# ... (Imports etc)

# ... (Imports etc)

EVAL_PROMPT_TEMPLATE = """
You are an AI evaluation agent.
... (Standard instructions) ...

**IMPORTANT:** 
- Output **ONLY** the XML. No conversational text (e.g. "Here is the evaluation").
- Do not use markdown blocks.

**EXAMPLE OUTPUT:**
<evaluation>
<classification_check>PASS</classification_check>
<classification_suggestion>N/A</classification_suggestion>

<openai_routing_check>PASS</openai_routing_check>
<openai_retrieval_check>PASS</openai_retrieval_check>
<openai_answers_question>PASS</openai_answers_question>
<openai_cites_shlokas>FAIL</openai_cites_shlokas>
<openai_follows_template>PASS</openai_follows_template>
<openai_no_hallucination>PASS</openai_no_hallucination>

<claude_routing_check>PASS</claude_routing_check>
<claude_retrieval_check>PASS</claude_retrieval_check>
<claude_answers_question>PASS</claude_answers_question>
<claude_cites_shlokas>PASS</claude_cites_shlokas>
<claude_follows_template>PASS</claude_follows_template>
<claude_no_hallucination>PASS</claude_no_hallucination>

<edge_case_check>PASS</edge_case_check>
<winner>CLAUDE</winner>
<comments>OpenAI failed to cite shlokas.</comments>
<fail_group_category>3b</fail_group_category>
</evaluation>

------------------

Evaluate this row data:

<row_data>
{row_data}
</row_data>

**OFFICIAL 45 MVP CATEGORIES:**
{categories_list}
"""

def parse_evaluation(text):
    """Parse the XML evaluation response with robust extraction."""
    result = {}
    
    # 1. Extract content between <evaluation> tags (ignoring preamble)
    match_xml = re.search(r'<evaluation>(.*?)</evaluation>', text, re.DOTALL | re.IGNORECASE)
    if match_xml:
        text = match_xml.group(1) # Scope parsing to inside tags
    
    fields = [
        'classification_check', 'classification_suggestion',
        'openai_routing_check', 'openai_retrieval_check', 
        'openai_answers_question', 'openai_cites_shlokas', 'openai_follows_template', 'openai_no_hallucination',
        'claude_routing_check', 'claude_retrieval_check',
        'claude_answers_question', 'claude_cites_shlokas', 'claude_follows_template', 'claude_no_hallucination',
        'edge_case_check', 'winner',
        'comments', 'fail_group_category'
    ]
    
    winner_map = {
        'NO WINNER': 'NO_WINNER',
        'DRAW': 'TIE',
        'NONE': 'NO_WINNER',
        'N/A': 'NO_WINNER',
        'BOTH': 'TIE',
        'EQUAL': 'TIE'
    }

    for field in fields:
        pattern = f"<{field}>(.*?)</{field}>"
        # Case insensitive matching for tags
        match = re.search(pattern, text, re.DOTALL | re.IGNORECASE)
        
        if match:
            val = match.group(1).strip()
            if field == 'comments':
                result[field] = val
            elif field == 'winner':
                clean_w = clean_value(val)
                # Strict Whitelist Logic
                if clean_w in ['OPENAI', 'CLAUDE', 'TIE']:
                    result[field] = clean_w
                elif clean_w in ['DRAW', 'BOTH', 'EQUAL']:
                    result[field] = 'TIE'
                else:
                    # Catch-all for "Both failed", "None", "No Winner", "No Competition" etc.
                    result[field] = 'NO_WINNER'
            else:
                result[field] = clean_value(val)
        else:
            if field == 'comments':
                result[field] = "No comments provided."
            else:
                result[field] = "PARSE_ERROR"
    
    return result

def evaluate_row(row, row_num, total):
    """Evaluate a single row using Gemini."""
    row_data = format_row_data(row)
    categories_str = ", ".join(PRD_CATEGORIES)
    
    # Prompt is now self-contained, no extra injections needed
    prompt = EVAL_PROMPT_TEMPLATE.format(row_data=row_data, categories_list=categories_str)

    max_retries = 3
    for attempt in range(max_retries):
        try:
            response = model.generate_content(prompt)
            eval_result = parse_evaluation(response.text)
            
            critical_fields = ['openai_answers_question', 'claude_answers_question', 'winner']
            if any(eval_result.get(k) == 'PARSE_ERROR' for k in critical_fields):
                # ... (Retry logic) ...
                if attempt < max_retries - 1:
                    print(f"  [{row_num}/{total}] Parse Error (Attempt {attempt+1}), retrying...")
                    time.sleep(2)
                    continue
                else:
                    print(f"  [{row_num}/{total}] CRITICAL PARSE FAILURE. Raw Output snippet:\n{response.text[:200]}...")
            
            print(f"  [{row_num}/{total}] Evaluated: {row.get('user_query', 'N/A')[:40]}... -> {eval_result.get('winner', 'N/A')}")
            return eval_result
            
        except Exception as e:
            # ... (Error logic) ...
            print(f"  [{row_num}/{total}] ERROR (Attempt {attempt+1}): {e}")
            if attempt < max_retries - 1:
                time.sleep(2)
            else:
                return {k: "ERROR" for k in fields}

# ... (main function remains)

# ... (main function remains)

def main():
    print(f"Reading {INPUT_FILE}...")
    
    rows = []
    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
    
    print(f"Loaded {len(rows)} rows.")
    
    # 1. Coverage Mode (Priority)
    if COVERAGE_MODE:
        print(f"Applying DETERMINISTIC COVERAGE TEST (25 Strategic Rows)...")
        strategic_rows = []
        for idx in COVERAGE_INDICES:
            if 0 <= idx < len(rows):
                # Add row number for tracking
                row = rows[idx]
                row['original_index'] = idx
                strategic_rows.append(row)
            else:
                print(f"WARNING: Index {idx} out of bounds (max {len(rows)-1})")
        rows = strategic_rows
        print(f"Selected {len(rows)} strategic coverage rows.")
        
    # 2. Random Sampling (Fallback)
    elif LIMIT_ROWS:
        print(f"Applying RANDOM DIVERSE SAMPLING (Limit: {LIMIT_ROWS})...")
        grouped = {}
        for row in rows:
            cat = row.get('classification', 'Unclassified')
            if cat not in grouped: grouped[cat] = []
            grouped[cat].append(row)
        
        # Pick at least one from each category until limit
        sampled_rows = []
        categories = list(grouped.keys())
        random.shuffle(categories)
        
        while len(sampled_rows) < LIMIT_ROWS and categories:
            for cat in categories:
                if len(sampled_rows) >= LIMIT_ROWS: break
                if grouped[cat]:
                    idx = random.randint(0, len(grouped[cat]) - 1)
                    sampled_rows.append(grouped[cat].pop(idx))
            categories = [c for c in categories if grouped[c]]
            
        rows = sampled_rows
        print(f"Selected {len(rows)} diverse rows.")
    
    # Prepare output
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    
    output_headers = [
        'user_query', 'classification', 'expected_template',
        'classification_check', 'classification_suggestion',
        'openai_routing_check', 'openai_retrieval_check', 
        'openai_answers_question', 'openai_cites_shlokas', 'openai_follows_template', 'openai_no_hallucination',
        'claude_routing_check', 'claude_retrieval_check',
        'claude_answers_question', 'claude_cites_shlokas', 'claude_follows_template', 'claude_no_hallucination',
        'edge_case_check', 'winner',
        'comments', 'fail_group_category'
    ]
    
    # Write header
    with open(OUTPUT_FILE, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=output_headers)
        writer.writeheader()
    
    print(f"Starting evaluation with {DELAY_SECONDS}s delay between requests...")
    
    for i, row in enumerate(rows):
        row_num = i + 1
        
        print(f"Processing ({row_num}/{len(rows)}): [{row.get('classification', '')}] {row.get('user_query', '')[:50]}...")
        
        eval_result = evaluate_row(row, row_num, len(rows))
        
        # T3 POST-PROCESSING: Force N/A for citation and retrieval checks
        # Gemini doesn't consistently apply T3 exception rules, so we override here
        expected_template = row.get('template', '')
        if expected_template == 'T3':
            eval_result['openai_cites_shlokas'] = 'N/A'
            eval_result['claude_cites_shlokas'] = 'N/A'
            eval_result['openai_retrieval_check'] = 'N/A'
            eval_result['claude_retrieval_check'] = 'N/A'
            
            # NEW: Check for proper refusal behavior instead of normal answer
            openai_answer = row.get('openai_final_answer', '')
            claude_answer = row.get('claude_final_answer', '')
            eval_result['openai_answers_question'] = check_t3_refusal(openai_answer)
            eval_result['claude_answers_question'] = check_t3_refusal(claude_answer)
            # T3 refusals don't need citations/retrieval - that's correct behavior
        
        # Merge row info with evaluation
        output_row = {
            'user_query': row.get('user_query', ''),
            'classification': row.get('classification', ''),
            'expected_template': row.get('template', ''), # Rename for clarity
            **eval_result
        }
        
        # Append to CSV immediately
        with open(OUTPUT_FILE, 'a', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=output_headers)
            writer.writerow(output_row)
        
        # Rate limit
        if row_num < len(rows):
            time.sleep(DELAY_SECONDS)
    
    print(f"\nDone! Results written to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
