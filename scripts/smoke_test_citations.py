#!/usr/bin/env python3
"""
Smoke Test: Verify OpenAI Citation Fix
=======================================
Tests 5 questions through the Tattva API to verify inline citations appear.
"""

import requests
import json
import re
import time

# Configuration
API_URL = "http://localhost:3000/api/answer"

# 5 test questions from golden dataset (mix of T1, T2, T3)
TEST_QUESTIONS = [
    # T1 questions (should have citations)
    "Who is Hanuman?",
    "Who is the primary author of the Ramayana within the text itself?",
    "What forest did Rama go to for his exile?",
    # T2 question (should have citations in whatTextStates)
    "Why did Rama exile Sita after returning to Ayodhya?",
    # T3 question (should NOT have citations, should refuse politely)
    "Can you draw Rama?",
]

# Citation regex pattern - matches both [Bala-Kanda X.Y] and [Bala Kanda X.Y]
CITATION_PATTERN = r'\[[A-Za-z]+[ -]Kanda\s+\d+\.\d+\]'

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
            timeout=120
        )
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"  ERROR: {e}")
        return None

def check_citations(trace: dict) -> tuple:
    """Check if response contains inline citations."""
    if not trace:
        return False, "API call failed", []
    
    gen_result = trace.get('generation_result', {})
    answer = gen_result.get('answer', '')
    template = gen_result.get('template_used', 'unknown')
    
    # For T3, citations should NOT be present
    if template == 'T3':
        citations = re.findall(CITATION_PATTERN, answer)
        if len(citations) == 0:
            return True, "T3 correctly has no citations", []
        else:
            return False, "T3 incorrectly has citations", citations
    
    # For T1/T2, citations SHOULD be present
    citations = re.findall(CITATION_PATTERN, answer)
    if len(citations) > 0:
        return True, f"Found {len(citations)} citations", citations
    else:
        return False, "No citations found in answer", []

def main():
    print("=" * 60)
    print("SMOKE TEST: OpenAI Citation Fix Verification")
    print("=" * 60)
    print()
    
    results = []
    
    for i, question in enumerate(TEST_QUESTIONS, 1):
        print(f"[{i}/5] Testing: {question[:50]}...")
        
        # Call API with OpenAI
        start = time.time()
        trace = call_api(question, provider='openai')
        elapsed = time.time() - start
        
        if trace:
            passed, message, citations = check_citations(trace)
            template = trace.get('generation_result', {}).get('template_used', 'unknown')
            
            status = "✅ PASS" if passed else "❌ FAIL"
            print(f"  {status} - Template: {template}, {message}")
            if citations:
                print(f"  Citations: {citations[:3]}{'...' if len(citations) > 3 else ''}")
            print(f"  Time: {elapsed:.1f}s")
            
            results.append({
                'question': question,
                'template': template,
                'passed': passed,
                'message': message,
                'citations': citations,
                'answer_preview': trace.get('generation_result', {}).get('answer', '')[:200]
            })
        else:
            print(f"  ❌ FAIL - API call failed")
            results.append({
                'question': question,
                'template': 'error',
                'passed': False,
                'message': 'API call failed',
                'citations': [],
                'answer_preview': ''
            })
        
        print()
        time.sleep(1)  # Rate limiting
    
    # Summary
    print("=" * 60)
    print("SMOKE TEST SUMMARY")
    print("=" * 60)
    
    passed_count = sum(1 for r in results if r['passed'])
    total = len(results)
    
    print(f"Passed: {passed_count}/{total}")
    print()
    
    for r in results:
        status = "✅" if r['passed'] else "❌"
        print(f"{status} {r['question'][:40]}... - {r['message']}")
    
    print()
    
    if passed_count >= 4:
        print("🎉 SMOKE TEST PASSED! Proceed with full 60-question evaluation.")
        return True
    else:
        print("⚠️ SMOKE TEST FAILED! Review the citation fix before proceeding.")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
