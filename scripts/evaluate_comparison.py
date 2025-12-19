import json
import csv
import os
import asyncio
import time
from openai import AsyncOpenAI
from dotenv import load_dotenv

# Load env including OPENAI_API_KEY
load_dotenv('.env.local')

client = AsyncOpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

INPUT_FILE = "projectupdates/llm_responses_output.json"
OUTPUT_FILE = "evaluations/comparative_results.csv"
CONCURRENT_REQUESTS = 5 

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

Format your response as a valid JSON object with these exact keys:
{{
  "openai_rating": "Good" or "Bad",
  "claude_rating": "Good" or "Bad",
  "openai_critique": "Briefly describe what needs improvement (or 'None' if perfect)",
  "claude_critique": "Briefly describe what needs improvement (or 'None' if perfect)",
  "justification": "Why is one better? or why are both good/bad?",
  "winner": "OpenAI" or "Claude" or "Tie"
}}
"""
        try:
            response = await client.chat.completions.create(
                model="gpt-4o",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"},
                temperature=0.0
            )
            content = response.choices[0].message.content
            return json.loads(content)
        except Exception as e:
            print(f"Error evaluating query '{question[:20]}...': {e}")
            return None

def group_traces(traces):
    pairs = {}
    for trace in traces:
        # trace_id format: "001-openai" or "001-anthropic"
        tid_parts = trace['trace_id'].split('-')
        base_id = tid_parts[0] # "001"
        provider = tid_parts[1] # "openai" or "anthropic"
        
        if base_id not in pairs:
            pairs[base_id] = {'id': base_id, 'question': trace['user_query'], 'openai': None, 'anthropic': None}
        
        if 'generation_result' not in trace or 'classification_result' not in trace:
            # Skip traces that don't have results (e.g. errors)
            continue

        pairs[base_id][provider] = trace['generation_result']['answer']
        pairs[base_id]['classification'] = trace['classification_result']['category']
    
    return [p for p in pairs.values() if p['openai'] is not None and p['anthropic'] is not None]

async def main():
    if not os.environ.get("OPENAI_API_KEY"):
        print("Error: OPENAI_API_KEY not found in environment.")
        return

    print(f"Reading {INPUT_FILE}...")
    with open(INPUT_FILE, 'r') as f:
        data = json.load(f)
    
    traces = data.get("traces", [])
    pairs = group_traces(traces)
    print(f"Found {len(traces)} traces, formed {len(pairs)} comparison pairs.")
    
    semaphore = asyncio.Semaphore(CONCURRENT_REQUESTS)
    results = []
    
    tasks = [evaluate_pair(pair, semaphore) for pair in pairs]
    
    # Process with progress bar style generic prints
    total = len(tasks)
    completed = 0
    print(f"Starting evaluation of {total} pairs...")
    
    # Run in batches to be safe or just gather all (semaphore handles concurrency)
    evaluations = await asyncio.gather(*tasks)
    
    # Merge results
    for pair, evaluation in zip(pairs, evaluations):
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
            results.append(row)

    # Write CSV
    headers = [
        "Question", "Category", "OpenAI_Answer", "Claude_Answer", 
        "OpenAI_Rating", "Claude_Rating", "OpenAI_Critique", 
        "Claude_Critique", "Justification", "Winner"
    ]
    
    print(f"Writing results to {OUTPUT_FILE}...")
    with open(OUTPUT_FILE, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        writer.writeheader()
        writer.writerows(results)
        
    print("Done!")

if __name__ == "__main__":
    asyncio.run(main())
