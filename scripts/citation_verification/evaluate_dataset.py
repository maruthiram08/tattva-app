"""
Evaluate Dataset
Runs citation verification on a dataset of generated answers.
"""

import argparse
import json
import os
import sys
from datetime import datetime
from typing import List, Dict, Any

# Ensure we can import local modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from pinecone_verifier import CitationVerifier

def evaluate_dataset(input_path: str, output_path: str, provider: str = "openai"):
    print(f"Loading dataset from {input_path}...")
    with open(input_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    print(f"Initializing Verifier (Provider: {provider})...")
    try:
        verifier = CitationVerifier()
    except Exception as e:
        print(f"Failed to initialize verifier: {e}")
        print("Ensure PINECONE_API_KEY and PINECONE_INDEX_NAME are set.")
        return

    results = {
        "summary": {
            "total_questions": len(data),
            "processed": 0,
            "skipped_t3": 0,
            "passed": 0,
            "failed": 0,
            "pass_rate": 0.0,
            "total_citations_checked": 0,
            "total_phantom_citations": 0
        },
        "details": []
    }
    
    print("Starting verification...")
    
    for item in data:
        idx = item.get("index", "?")
        question = item.get("user_query", "")
        expected_template = item.get("expected_template", "T1")
        
        # Skip T3
        if expected_template == "T3":
            results["summary"]["skipped_t3"] += 1
            results["details"].append({
                "question_index": idx,
                "question": question,
                "result": "SKIP",
                "reason": "T3 template - no citations expected"
            })
            continue
            
        # Get provider data
        provider_data = item.get(provider)
        if not provider_data:
             results["details"].append({
                "question_index": idx,
                "question": question,
                "result": "ERROR",
                "reason": f"No data for provider {provider}"
            })
             continue
             
        answer = provider_data.get("answer", "")
        
        # Verify
        verification = verifier.verify_answer(answer)
        
        # Record stats
        results["summary"]["processed"] += 1
        results["summary"]["total_citations_checked"] += verification["total_citations"]
        results["summary"]["total_phantom_citations"] += len(verification["phantom_citations"])
        
        if verification["result"] == "PASS":
            results["summary"]["passed"] += 1
        else:
            results["summary"]["failed"] += 1
            
        # Record details
        results["details"].append({
            "question_index": idx,
            "question": question,
            "result": verification["result"],
            "verification_details": verification
        })
        
        # Progress log
        if results["summary"]["processed"] % 10 == 0:
            print(f"Processed {results['summary']['processed']} questions...")

    # Calculate final rate
    total_processed = results["summary"]["processed"]
    if total_processed > 0:
        results["summary"]["pass_rate"] = results["summary"]["passed"] / total_processed
    
    # Save output
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2)
        
    print("\nEvaluation Complete!")
    print(f"Summary: {json.dumps(results['summary'], indent=2)}")
    print(f"Results saved to {output_path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Verify citations in generated answers.")
    parser.add_argument("--input", "-i", type=str, required=True, help="Path to input JSON file (golden responses)")
    parser.add_argument("--output", "-o", type=str, required=True, help="Path to output results JSON file")
    parser.add_argument("--provider", "-p", type=str, default="openai", choices=["openai", "claude"], help="Provider to evaluate")
    
    args = parser.parse_args()
    
    evaluate_dataset(args.input, args.output, args.provider)
