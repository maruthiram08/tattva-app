#!/usr/bin/env python3
"""
Citation Detection Fix for Tattva Evaluation
=============================================

This script provides improved citation detection regex patterns that handle
all edge cases found in the evaluation data.

PROBLEM IDENTIFIED:
- The original regex missed citations with certain formats
- 3 Claude citations were marked as "no citations" when they actually had them

EDGE CASES NOW HANDLED:
1. [Bala-Kanda 1.23]       - hyphen format
2. [Bala Kanda 1.23]       - space format  
3. [Aranya Kanda 14.33-35] - shloka ranges
4. [Yuddha Kanda 127.11-12] - another range format
5. [Sundara Kanda 35.7; Bala Kanda 1.27] - semicolon-separated multiple citations
6. [Ayodhya Kanda 26.1-2, 64.72] - comma-separated citations

Author: Tattva Evaluation System
Date: December 20, 2025
"""

import re
import json
from typing import List, Dict, Tuple

# ============================================================================
# IMPROVED CITATION DETECTION PATTERNS
# ============================================================================

# Kanda names (all 7 kandas of Valmiki Ramayana)
KANDA_NAMES = r'(?:Bala|Ayodhya|Aranya|Kishkindha|Sundara|Yuddha|Uttara)'

# Main citation pattern - handles most cases including ranges
# This pattern matches: [Kanda-Name Sarga.Shloka] or [Kanda Name Sarga.Shloka]
# Also handles shloka ranges like 14.33-35 or 127.11-12
CITATION_PATTERN = (
    r'\[' +                           # Opening bracket
    KANDA_NAMES +                     # Kanda name
    r'[\s\-]?' +                      # Optional space or hyphen
    r'Kanda' +                        # Literal "Kanda"
    r'[\s\-]?' +                      # Optional space or hyphen
    r'\d+' +                          # Sarga number
    r'[\.\-\s]' +                     # Dot, hyphen, or space separator
    r'\d+' +                          # First shloka number
    r'(?:[\-,\s]*\d+)*' +             # Optional additional shlokas (ranges or lists)
    r'\]'                             # Closing bracket
)

# Compiled regex for better performance
CITATION_REGEX = re.compile(CITATION_PATTERN, re.IGNORECASE)

# Alternative pattern for semicolon-separated citations in single brackets
# e.g., [Sundara Kanda 35.7; Bala Kanda 1.27]
MULTI_CITATION_PATTERN = (
    r'\[' +
    r'[^\]]+' +                       # Any content inside brackets
    KANDA_NAMES +                     # Must contain at least one Kanda name
    r'[^\]]+' +                       # More content
    r'\]'
)
MULTI_CITATION_REGEX = re.compile(MULTI_CITATION_PATTERN, re.IGNORECASE)


def extract_citations(text: str) -> List[str]:
    """
    Extract all citations from text using improved regex patterns.
    
    Args:
        text: The answer text to search for citations
        
    Returns:
        List of citation strings found
    """
    # First, try the main pattern
    citations = CITATION_REGEX.findall(text)
    
    # If no citations found, check for multi-citation brackets
    if not citations:
        # Look for brackets containing Kanda names
        bracket_contents = re.findall(r'\[([^\]]+)\]', text)
        for content in bracket_contents:
            # Check if this bracket contains a Kanda reference
            if re.search(KANDA_NAMES, content, re.IGNORECASE):
                citations.append(f'[{content}]')
    
    return citations


def has_inline_citations(text: str) -> bool:
    """
    Check if text contains inline citations.
    
    Args:
        text: The answer text to check
        
    Returns:
        True if citations found, False otherwise
    """
    return len(extract_citations(text)) > 0


def count_citations(text: str) -> int:
    """
    Count the number of citations in text.
    
    Args:
        text: The answer text to count citations in
        
    Returns:
        Number of citations found
    """
    return len(extract_citations(text))


def analyze_response(response: Dict) -> Dict:
    """
    Analyze a response dictionary for citation presence.
    
    Args:
        response: Dictionary containing 'answer' field
        
    Returns:
        Dictionary with analysis results
    """
    answer = response.get('answer', '')
    citations = extract_citations(answer)
    
    return {
        'has_inline_citations': len(citations) > 0,
        'citation_count': len(citations),
        'citations_found': citations
    }


# ============================================================================
# TEST CASES
# ============================================================================

def run_tests():
    """Run test cases to verify the regex patterns work correctly."""
    
    test_cases = [
        # (input_text, expected_has_citations, description)
        ("[Bala-Kanda 1.23]", True, "Standard hyphen format"),
        ("[Bala Kanda 1.23]", True, "Space format"),
        ("[Aranya Kanda 14.33-35]", True, "Shloka range with hyphen"),
        ("[Yuddha Kanda 127.11-12]", True, "Another shloka range"),
        ("[Ayodhya Kanda 25.43]", True, "Standard format"),
        ("[Sundara Kanda 35.7; Bala Kanda 1.27]", True, "Semicolon separated"),
        ("No citations here", False, "No citations"),
        ("Rama went to forest", False, "Plain text"),
        
        # Real examples from the evaluation data
        (
            "The dilemma of killing the demoness Tataka was faced by the sage Viswamitra. "
            "[Bala Kanda 24.15-16]",
            True, 
            "Real Q16 Claude answer"
        ),
        (
            "The text does not explicitly mention the episode of the female ascetic Svayamprabha.",
            False,
            "Real Q7 - correctly no citations"
        ),
        (
            "The Valmiki Ramayana does not explicitly state that the epic ends with the coronation of Rama. "
            "The text describes Rama's return to Ayodhya after completing his exile [Ayodhya Kanda 26.1-2, 64.72]",
            True,
            "Real Q1 Claude - comma separated sargas"
        ),
    ]
    
    print("=" * 70)
    print("CITATION DETECTION REGEX TEST RESULTS")
    print("=" * 70)
    print()
    
    passed = 0
    failed = 0
    
    for text, expected, description in test_cases:
        result = has_inline_citations(text)
        citations = extract_citations(text)
        status = "✅ PASS" if result == expected else "❌ FAIL"
        
        if result == expected:
            passed += 1
        else:
            failed += 1
        
        print(f"{status}: {description}")
        print(f"       Text: {text[:60]}...")
        print(f"       Expected: {expected}, Got: {result}")
        if citations:
            print(f"       Citations found: {citations}")
        print()
    
    print("=" * 70)
    print(f"RESULTS: {passed}/{passed + failed} tests passed")
    print("=" * 70)
    
    return failed == 0


# ============================================================================
# REANALYZE EVALUATION DATA
# ============================================================================

def reanalyze_evaluation_file(input_path: str) -> Dict:
    """
    Re-analyze an evaluation JSON file with the improved regex.
    
    Args:
        input_path: Path to the golden_responses JSON file
        
    Returns:
        Dictionary with corrected metrics
    """
    with open(input_path, 'r') as f:
        data = json.load(f)
    
    t1_t2_questions = [item for item in data if item.get('expected_template') != 'T3']
    
    openai_pass = 0
    claude_pass = 0
    corrections = []
    
    for item in t1_t2_questions:
        idx = item.get('index', 'unknown')
        query = item.get('user_query', '')[:50]
        
        # Check OpenAI
        openai_answer = item.get('openai', {}).get('answer', '')
        openai_reported = item.get('openai', {}).get('has_inline_citations', False)
        openai_actual = has_inline_citations(openai_answer)
        
        if openai_actual:
            openai_pass += 1
        
        if openai_actual != openai_reported:
            corrections.append({
                'index': idx,
                'model': 'OpenAI',
                'query': query,
                'reported': openai_reported,
                'actual': openai_actual,
                'citations': extract_citations(openai_answer)
            })
        
        # Check Claude
        claude_answer = item.get('claude', {}).get('answer', '')
        claude_reported = item.get('claude', {}).get('has_inline_citations', False)
        claude_actual = has_inline_citations(claude_answer)
        
        if claude_actual:
            claude_pass += 1
            
        if claude_actual != claude_reported:
            corrections.append({
                'index': idx,
                'model': 'Claude',
                'query': query,
                'reported': claude_reported,
                'actual': claude_actual,
                'citations': extract_citations(claude_answer)
            })
    
    total = len(t1_t2_questions)
    
    return {
        'total_t1_t2_questions': total,
        'openai_pass': openai_pass,
        'claude_pass': claude_pass,
        'openai_rate': 100 * openai_pass / total,
        'claude_rate': 100 * claude_pass / total,
        'corrections_needed': len(corrections),
        'corrections': corrections
    }


# ============================================================================
# MAIN
# ============================================================================

if __name__ == '__main__':
    import sys
    
    print("Citation Detection Fix Script")
    print("=" * 70)
    print()
    
    # Run tests
    tests_passed = run_tests()
    
    if not tests_passed:
        print("\n⚠️  Some tests failed! Review the regex patterns.")
        sys.exit(1)
    
    print("\n✅ All tests passed!")
    
    # If a file path is provided, analyze it
    if len(sys.argv) > 1:
        input_file = sys.argv[1]
        print(f"\nAnalyzing file: {input_file}")
        print("-" * 70)
        
        results = reanalyze_evaluation_file(input_file)
        
        print(f"\nCORRECTED CITATION RATES:")
        print(f"  OpenAI: {results['openai_pass']}/{results['total_t1_t2_questions']} = {results['openai_rate']:.1f}%")
        print(f"  Claude: {results['claude_pass']}/{results['total_t1_t2_questions']} = {results['claude_rate']:.1f}%")
        
        if results['corrections']:
            print(f"\nCORRECTIONS NEEDED: {results['corrections_needed']}")
            for c in results['corrections']:
                print(f"  Q#{c['index']} {c['model']}: reported={c['reported']}, actual={c['actual']}")
                print(f"    Citations: {c['citations']}")
