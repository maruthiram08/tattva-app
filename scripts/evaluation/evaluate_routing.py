#!/usr/bin/env python3
"""
Routing Evaluator for Tattva
============================

Evaluates whether questions were classified into the correct PRD category.
Uses Gemini as LLM-Judge to compare System Category vs Expected Category.
"""

import os
import sys
import csv
import json
import time
import re
import argparse
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env.local')

import google.generativeai as genai

# Configuration
INPUT_FILE = "projectupdates/golden_responses_AFTER_FIX_2025_12_21_0044.json"
OUTPUT_DIR = "projectupdates"
TAXONOMY_FILE = "projectdocs/category_taxonomy.txt"
PROMPT_TEMPLATE_FILE = "projectdocs/Routing Evaluation prompt.md"
MODEL_NAME = "gemini-2.0-flash"
DELAY_SECONDS = 2  # Rate limit safety

# Initialize Gemini
genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))
model = genai.GenerativeModel(MODEL_NAME)

def load_file(filepath):
    """Load text content from file."""
    with open(filepath, 'r', encoding='utf-8') as f:
        return f.read()

def parse_xml_result(text):
    """Parse XML output from LLM."""
    result = {}
    tags = ['result', 'match_type', 'system_category', 'expected_category', 'system_group', 'expected_group', 'note', 'matched_alternative']
    
    for tag in tags:
        pattern = f"<{tag}>(.*?)</{tag}>"
        match = re.search(pattern, text, re.DOTALL | re.IGNORECASE)
        if match:
            result[tag] = match.group(1).strip()
        else:
            result[tag] = "N/A"
            
    return result

def evaluate_routing(system_category, expected_category, alternatives, taxonomy, template):
    """Call Gemini to evaluate the match."""
    prompt = template.replace("{{CATEGORY_TAXONOMY}}", taxonomy)
    prompt = prompt.replace("{{SYSTEM_CATEGORY}}", system_category)
    prompt = prompt.replace("{{EXPECTED_CATEGORY}}", expected_category)
    prompt = prompt.replace("{{ACCEPTABLE_ALTERNATIVES}}", alternatives or "None")
    
    try:
        response = model.generate_content(prompt)
        return parse_xml_result(response.text)
    except Exception as e:
        print(f"  ERROR: {e}")
        return {k: "ERROR" for k in ['result', 'match_type']}

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, help="Limit number of rows for testing")
    args = parser.parse_args()
    
    print("="*60)
    print("ROUTING EVALUATOR")
    print("="*60)
    
    # Load inputs
    print(f"Loading data from {INPUT_FILE}...")
    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    print(f"Loading taxonomy from {TAXONOMY_FILE}...")
    taxonomy = load_file(TAXONOMY_FILE)
    
    print(f"Loading template from {PROMPT_TEMPLATE_FILE}...")
    template = load_file(PROMPT_TEMPLATE_FILE)
    
    if args.limit:
        data = data[:args.limit]
        print(f"LIMITING run to {args.limit} rows.")
        
    results = []
    
    # Prepare CSV output
    timestamp = time.strftime("%Y%m%d_%H%M%S")
    csv_file = f"{OUTPUT_DIR}/routing_evaluation_results_{timestamp}.csv"
    
    fieldnames = ['index', 'user_query', 'system_model', 'system_category', 'expected_category', 'result', 'match_type', 'note']
    
    with open(csv_file, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        
        for i, row in enumerate(data):
            idx = row.get('index', i+1)
            query = row.get('user_query', '')
            expected = row.get('classification', '')
            
            # Extract System Category (OpenAI)
            # Note: We prioritize OpenAI trace as it's the primary provider in current tests
            openai_cat = "UNKNOWN"
            if 'openai_trace' in row and row['openai_trace'] is not None:
                cls_res = row['openai_trace'].get('classification_result', {}) or {}
                openai_cat = cls_res.get('category', "UNKNOWN")
            
            print(f"\nProcessing [{idx}] '{query[:30]}...'")
            print(f"  Exp: {expected} | Sys: {openai_cat}")
            
            if openai_cat == "UNKNOWN":
                print("  SKIPPING: No system classification found")
                continue
                
            # Evaluate
            eval_res = evaluate_routing(openai_cat, expected, "", taxonomy, template)
            print(f"  -> {eval_res.get('result')} ({eval_res.get('match_type')})")
            
            # Save row
            out_row = {
                'index': idx,
                'user_query': query,
                'system_model': 'openai',
                'system_category': openai_cat,
                'expected_category': expected,
                'result': eval_res.get('result', 'ERROR'),
                'match_type': eval_res.get('match_type', 'ERROR'),
                'note': eval_res.get('note', '')
            }
            writer.writerow(out_row)
            results.append(out_row)
            
            time.sleep(DELAY_SECONDS)
            
    # Summary
    pass_count = sum(1 for r in results if r['result'] == 'PASS')
    total = len(results)
    
    print("\n" + "="*60)
    print("SUMMARY")
    if total > 0:
        print(f"Total Evaluated: {total}")
        print(f"PASS: {pass_count} ({pass_count/total*100:.1f}%)")
        print(f"Output saved to: {csv_file}")
    else:
        print("No rows evaluated.")

if __name__ == "__main__":
    main()
