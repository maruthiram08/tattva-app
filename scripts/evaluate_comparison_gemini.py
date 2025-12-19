import json
import csv
import os
import asyncio
import google.generativeai as genai
from dotenv import load_dotenv
import time

# Load env including GEMINI_API_KEY
load_dotenv('.env.local')

api_key = os.environ.get("GEMINI_API_KEY")
if not api_key:
    print("Error: GEMINI_API_KEY not found in environment.")
    # Fallback to try OPENAI_API_KEY if needed, but this script is for Gemini
    # exit(1)

genai.configure(api_key=api_key)

# Use Gemini 1.5 Flash (stable)
MODEL_NAME = "gemini-flash-latest" 

INPUT_FILE = "projectupdates/llm_responses_output.json"
OUTPUT_FILE = "evaluations/comparative_results_gemini.csv"
CONCURRENT_REQUESTS = 1 # Sequential to avoid rate limits

async def evaluate_pair(pair, semaphore):
    async with semaphore:
        question = pair['question']
        openai_ans = pair['openai']
        claude_ans = pair['anthropic']
        
        prompt = f"""
You are an expert judge for a RAG-based Question Answering system about the Valmiki Ramayana.
Compare these two answers to the following user question.

Question: "{question}"

---
[Answer A (OpenAI)]
{openai_ans}

---
[Answer B (Claude)]
{claude_ans}
---

Your Task:
Critically evaluate both answers based on:
1. Accuracy (Is it factually correct according to Ramayana?)
2. Completeness (Does it fully answer the question?)
3. Tone/Style (Is it helpful and polite?)

Output ONLY a JSON object with these keys:
{{
  "openai_rating": "Good" or "Bad",
  "claude_rating": "Good" or "Bad",
  "openai_critique": "Briefly describe specific improvements needed",
  "claude_critique": "Briefly describe specific improvements needed",
  "justification": "Comparative reasoning on why one is better",
  "winner": "OpenAI" or "Claude" or "Tie"
}}
"""
        max_retries = 3
        for attempt in range(max_retries):
            try:
                model = genai.GenerativeModel(MODEL_NAME)
                response = await model.generate_content_async(
                    prompt,
                    generation_config={"response_mime_type": "application/json"}
                )
                
                content = response.text
                # Success - wait to respect rate limit (approx 6-10 secs for 10-15 RPM)
                time.sleep(10)
                return json.loads(content)
            except Exception as e:
                if "429" in str(e):
                    wait = (attempt + 1) * 20 # 20s, 40s, 60s
                    print(f"Rate limit for '{question[:10]}...', waiting {wait}s...")
                    time.sleep(wait)
                else:
                    print(f"Error evaluating query '{question[:20]}...': {e}")
                    return None
        return None

def group_traces(traces):
    pairs = {}
    print(f"DEBUG: Processing {len(traces)} traces...")
    skipped_count = 0
    valid_count = 0
    
    for trace in traces:
        # trace_id format: "001-openai" or "001-anthropic"
        tid_parts = trace.get('trace_id', '').split('-')
        if len(tid_parts) < 2: 
            skipped_count += 1
            continue 
        
        base_id = tid_parts[0] # "001"
        provider = tid_parts[1] # "openai" or "anthropic"
        
        if base_id not in pairs:
            pairs[base_id] = {'id': base_id, 'question': trace.get('user_query', ''), 'openai': None, 'anthropic': None}
        
        # In llm_responses_output.json, fields are flattened
        if 'final_answer' in trace:
             pairs[base_id][provider] = trace['final_answer']
             pairs[base_id]['classification'] = trace.get('classification', 'Unknown')
             valid_count += 1
        elif 'generation_result' in trace: # Fallback for raw traces
             pairs[base_id][provider] = trace['generation_result']['answer']
             pairs[base_id]['classification'] = trace['classification_result']['category']
             valid_count += 1
        else:
             skipped_count += 1
             continue

    print(f"DEBUG: Skipped {skipped_count} traces. Valid traces: {valid_count}")
    
    final_pairs = [p for p in pairs.values() if p['openai'] is not None and p['anthropic'] is not None]
    print(f"DEBUG: Formed {len(final_pairs)} pairs from valid traces.")
    return final_pairs

async def main():
    if not api_key:
        print("Error: GEMINI_API_KEY is missing. Please add it to .env.local")
        return

    print(f"Reading {INPUT_FILE}...")
    try:
        with open(INPUT_FILE, 'r') as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"File not found: {INPUT_FILE}")
        return

    traces = data.get("traces", [])
    pairs = group_traces(traces)
    print(f"Found {len(traces)} traces, from which formed {len(pairs)} comparison pairs.")
    
    # Write CSV Header first
    print(f"Writing results incrementally to {OUTPUT_FILE}...")
    headers = [
        "Question", "Category", "OpenAI_Answer", "Claude_Answer", 
        "OpenAI_Rating", "Claude_Rating", "OpenAI_Critique", 
        "Claude_Critique", "Justification", "Winner"
    ]
    
    with open(OUTPUT_FILE, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        writer.writeheader()

    print(f"Starting evaluation of {len(pairs)} pairs using {MODEL_NAME}...")
    
    # Process sequentially and append
    semaphore = asyncio.Semaphore(CONCURRENT_REQUESTS)
    
    count = 0
    for pair in pairs:
        count += 1
        print(f"Processing ({count}/{len(pairs)}): {pair['question'][:30]}...")
        evaluation = await evaluate_pair(pair, semaphore)
        
        if evaluation:
            row = {
                "Question": pair['question'],
                "Category": pair['classification'],
                "OpenAI_Answer": pair['openai'],
                "Claude_Answer": pair['anthropic'],
                "OpenAI_Rating": evaluation.get('openai_rating'),
                "Claude_Rating": evaluation.get('claude_rating'),
                "OpenAI_Critique": evaluation.get('openai_critique'),
                "Claude_Critique": evaluation.get('claude_critique'),
                "Justification": evaluation.get('justification'),
                "Winner": evaluation.get('winner')
            }
            
            # Append Row immediately
            with open(OUTPUT_FILE, 'a', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=headers)
                writer.writerow(row)
        
    print("Done!")

if __name__ == "__main__":
    asyncio.run(main())
