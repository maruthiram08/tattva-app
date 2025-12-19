#!/usr/bin/env python3
"""
Batch Evaluation: Generate Fresh Responses for Golden Dataset
==============================================================
Runs all 60 golden dataset questions through the Tattva API with both
OpenAI and Claude providers. Saves responses for Gemini evaluation.
"""

import requests
import json
import csv
import re
import time
from datetime import datetime
import os

# Configuration
API_URL = "http://localhost:3000/api/answer"
GOLDEN_DATASET_PATH = "projectdocs/golden_dataset.csv"
OUTPUT_DIR = "projectupdates"
TIMESTAMP = datetime.now().strftime('%Y_%m_%d_%H%M')

# Citation regex pattern - matches both [Bala-Kanda X.Y] and [Bala Kanda X.Y]
CITATION_PATTERN = r'\[[A-Za-z]+[ -]Kanda\s+\d+\.\d+\]'

def load_golden_dataset():
    """Load the 60-question golden dataset."""
    questions = []
    with open(GOLDEN_DATASET_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            questions.append({
                'user_query': row['user_query'],
                'classification': row.get('classification', ''),
                'expected_template': row.get('expected_template', 'T1'),
            })
    print(f"Loaded {len(questions)} questions from golden dataset")
    return questions

def call_api(question: str, provider: str = 'openai') -> dict:
    """Call the Tattva API with a question."""
    try:
        response = requests.post(
            API_URL,
            json={
                "question": question,
                "preferredProvider": provider,
                "stream": False
            },
            headers={"Content-Type": "application/json"},
            timeout=180  # 3 min timeout for complex questions
        )
        response.raise_for_status()
        return response.json()
    except requests.exceptions.Timeout:
        print(f"  TIMEOUT for {provider}")
        return None
    except Exception as e:
        print(f"  ERROR ({provider}): {e}")
        return None

def extract_answer_info(trace: dict, provider: str) -> dict:
    """Extract relevant info from a trace response."""
    if not trace:
        return {
            'status': 'ERROR',
            'template_used': 'unknown',
            'answer': '',
            'citations': [],
            'citation_count': 0,
            'has_inline_citations': False
        }
    
    gen_result = trace.get('generation_result', {})
    answer = gen_result.get('answer', '')
    template = gen_result.get('template_used', 'unknown')
    
    # Get full_response for T2 whatTextStates access
    full_response = trace.get('full_response', {})
    whatTextStates = full_response.get('whatTextStates', '')
    
    # Find inline citations in BOTH fields
    answer_citations = re.findall(CITATION_PATTERN, answer)
    wts_citations = re.findall(CITATION_PATTERN, whatTextStates)
    all_citations = list(set(answer_citations + wts_citations))  # Dedupe
    
    # Also get citations from textualBasis
    textual_citations = gen_result.get('citations_in_answer', [])
    
    return {
        'status': 'OK',
        'template_used': template,
        'answer': answer,
        'whatTextStates': whatTextStates,
        'citations': all_citations,
        'citation_count': len(all_citations),
        'has_inline_citations': len(all_citations) > 0,
        'answer_citations': len(answer_citations),
        'wts_citations': len(wts_citations),
        'textual_basis_citations': textual_citations,
        'retrieved_count': trace.get('retrieval_results', {}).get('totalRetrieved', 0),
        'full_response': full_response,  # Store for Gemini evaluation
    }

def main():
    print("=" * 70)
    print("BATCH EVALUATION: Golden Dataset (60 Questions)")
    print(f"Timestamp: {TIMESTAMP}")
    print("=" * 70)
    print()
    
    # Load questions
    questions = load_golden_dataset()
    
    # Results storage
    all_results = []
    
    # Stats tracking
    openai_citation_pass = 0
    claude_citation_pass = 0
    openai_total_applicable = 0
    claude_total_applicable = 0
    
    # Process each question
    for i, q in enumerate(questions, 1):
        question = q['user_query']
        expected_template = q['expected_template']
        
        print(f"\n[{i}/60] {question[:60]}...")
        print(f"  Expected template: {expected_template}")
        
        # Call OpenAI
        print(f"  Calling OpenAI...", end=" ", flush=True)
        start = time.time()
        openai_trace = call_api(question, 'openai')
        openai_time = time.time() - start
        openai_info = extract_answer_info(openai_trace, 'openai')
        print(f"Done ({openai_time:.1f}s) - {openai_info['citation_count']} citations")
        
        # Minimal delay between providers (0.5s)
        time.sleep(0.5)
        
        # Call Claude
        print(f"  Calling Claude...", end=" ", flush=True)
        start = time.time()
        claude_trace = call_api(question, 'anthropic')
        claude_time = time.time() - start
        claude_info = extract_answer_info(claude_trace, 'claude')
        print(f"Done ({claude_time:.1f}s) - {claude_info['citation_count']} citations")
        
        # Track citation stats (excluding T3)
        if expected_template != 'T3':
            openai_total_applicable += 1
            claude_total_applicable += 1
            if openai_info['has_inline_citations']:
                openai_citation_pass += 1
            if claude_info['has_inline_citations']:
                claude_citation_pass += 1
        
        # Store result
        result = {
            'index': i,
            'user_query': question,
            'classification': q['classification'],
            'expected_template': expected_template,
            'openai': openai_info,
            'claude': claude_info,
            'openai_trace': openai_trace,
            'claude_trace': claude_trace,
        }
        all_results.append(result)
        
        # Minimal delay between questions (0.5s)
        time.sleep(0.5)
        
        # Progress update every 10 questions
        if i % 10 == 0:
            curr_openai_rate = openai_citation_pass / openai_total_applicable * 100 if openai_total_applicable > 0 else 0
            curr_claude_rate = claude_citation_pass / claude_total_applicable * 100 if claude_total_applicable > 0 else 0
            print(f"\n  --- Progress: {i}/60 | OpenAI citations: {curr_openai_rate:.1f}% | Claude citations: {curr_claude_rate:.1f}% ---\n")
    
    # Save all results to JSON
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    output_json = f"{OUTPUT_DIR}/golden_responses_AFTER_FIX_{TIMESTAMP}.json"
    with open(output_json, 'w', encoding='utf-8') as f:
        json.dump(all_results, f, indent=2, ensure_ascii=False)
    print(f"\n✅ Saved responses to: {output_json}")
    
    # Generate summary stats
    print("\n" + "=" * 70)
    print("SUMMARY STATISTICS")
    print("=" * 70)
    
    openai_rate = openai_citation_pass / openai_total_applicable * 100 if openai_total_applicable > 0 else 0
    claude_rate = claude_citation_pass / claude_total_applicable * 100 if claude_total_applicable > 0 else 0
    
    print(f"Total questions: 60")
    print(f"T1/T2 questions (citation applicable): {openai_total_applicable}")
    print(f"T3 questions (citation N/A): {60 - openai_total_applicable}")
    print()
    print(f"OpenAI Citation Rate: {openai_citation_pass}/{openai_total_applicable} = {openai_rate:.1f}%")
    print(f"Claude Citation Rate: {claude_citation_pass}/{claude_total_applicable} = {claude_rate:.1f}%")
    print()
    
    # Save summary
    summary = {
        'timestamp': TIMESTAMP,
        'total_questions': 60,
        'citation_applicable': openai_total_applicable,
        't3_questions': 60 - openai_total_applicable,
        'openai_citation_pass': openai_citation_pass,
        'claude_citation_pass': claude_citation_pass,
        'openai_citation_rate': openai_rate,
        'claude_citation_rate': claude_rate,
    }
    
    summary_json = f"{OUTPUT_DIR}/response_summary_{TIMESTAMP}.json"
    with open(summary_json, 'w', encoding='utf-8') as f:
        json.dump(summary, f, indent=2)
    print(f"✅ Saved summary to: {summary_json}")
    
    # Success check
    print()
    if openai_rate >= 80:
        print("🎉 SUCCESS: OpenAI citation rate ≥80% target!")
    else:
        print(f"⚠️ OpenAI citation rate {openai_rate:.1f}% is below 80% target")
    
    print()
    print("Next step: Run Gemini evaluation on the responses")
    print(f"  python scripts/evaluate_with_gemini.py --input {output_json}")

if __name__ == "__main__":
    main()
