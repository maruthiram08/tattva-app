import json
import os
import asyncio
import aiohttp
import time
import argparse
from typing import List, Dict, Any

# Configurations
INPUT_FILE_PATH = "projectdocs/ramayana_chatbot_questions_chatgpt.json"
OUTPUT_FOLDER = "projectupdates"
OUTPUT_FILE_NAME = "llm_responses_output.json"
API_URL = "http://localhost:3000/api/answer"
CONCURRENT_REQUESTS = 1  # Reduced to 1 to avoid hitting OpenAI 30k TPM rate limit
RETRIES = 3
BACKOFF_FACTOR = 2

async def query_llm(session: aiohttp.ClientSession, question_obj: Dict[str, Any], provider: str, trace_id: str) -> Dict[str, Any]:
    """
    Sends a question to the Tattva API for a specific provider.
    """
    payload = {
        "question": question_obj.get("Question"),
        # "retrieval": {},  # Removed to force server-side retrieval
        "preferredProvider": provider,
        "stream": False # Critical: Use non-streaming mode
    }

    attempt = 0
    while attempt < RETRIES:
        try:
            async with session.post(API_URL, json=payload, timeout=60) as response:
                if response.status == 200:
                    trace_data = await response.json()
                    
                    # Map to output format
                    return {
                        "trace_id": trace_id,
                        "Subgroup": question_obj.get("Subgroup"),
                        "user_query": question_obj.get("Question"),
                        "expanded_query": trace_data.get("expanded_query"),
                        "retrieved_shlokas": trace_data.get("retrieval_results", {}).get("shlokas", []),
                        "classification": trace_data.get("classification_result", {}).get("category"),
                        "template": trace_data.get("classification_result", {}).get("template_selected"),
                        "Expected_Depth": question_obj.get("Expected_Depth"),
                        "llm_used": provider,
                        "model": trace_data.get("generation_result", {}).get("model"),
                        "final_answer": trace_data.get("generation_result", {}).get("answer")
                    }
                else:
                    print(f"[{trace_id}] Error {response.status}: {await response.text()}")
        except Exception as e:
            print(f"[{trace_id}] Exception: {str(e)}")
        
        attempt += 1
        wait_time = BACKOFF_FACTOR ** attempt
        print(f"[{trace_id}] Retrying {provider} in {wait_time}s...")
        await asyncio.sleep(wait_time)

    # Failed after retries
    return {
        "trace_id": trace_id,
        "Subgroup": question_obj.get("Subgroup"),
        "user_query": question_obj.get("Question"),
        "llm_used": provider,
        "error": "Failed after retries"
    }

async def process_questions(questions: List[Dict[str, Any]]):
    """
    Orchestrates the batch processing sequentially to respect Rate Limits.
    """
    results = []
    
    # Create output directory if it doesn't exist
    if not os.path.exists(OUTPUT_FOLDER):
        os.makedirs(OUTPUT_FOLDER)

    print(f"Starting processing of {len(questions)} questions x 2 providers = {len(questions)*2} requests.")
    print("Running SEQUENTIALLY with 15s delay to avoid Rate Limits (30k TPM).")
    
    connector = aiohttp.TCPConnector(limit=1)
    async with aiohttp.ClientSession(connector=connector) as session:
        trace_counter = 1
        
        for q in questions:
            # Task for OpenAI
            print(f"Processing Q{trace_counter} - OpenAI...")
            t_id_openai = f"{trace_counter:03d}-openai"
            res_openai = await query_llm(session, q, "openai", t_id_openai)
            results.append(res_openai)
            await asyncio.sleep(15) # Wait for tokens to replenish
            
            # Task for Anthropic
            print(f"Processing Q{trace_counter} - Anthropic...")
            t_id_claude = f"{trace_counter:03d}-anthropic"
            res_claude = await query_llm(session, q, "anthropic", t_id_claude)
            results.append(res_claude)
            await asyncio.sleep(15) # Wait for tokens to replenish
            
            trace_counter += 1
            
            # periodic save
            if len(results) % 10 == 0:
                 print(f"Saved checkpoint with {len(results)} results.")
                 output_path = os.path.join(OUTPUT_FOLDER, OUTPUT_FILE_NAME)
                 with open(output_path, 'w') as f:
                    json.dump({"traces": results}, f, indent=2)

        return results

def main():
    try:
        # Read input file
        with open(INPUT_FILE_PATH, 'r') as f:
            questions = json.load(f)
            
        print(f"Loaded {len(questions)} questions from {INPUT_FILE_PATH}")

        # Run async loop
        results = asyncio.run(process_questions(questions))
        
        # Save results
        output_path = os.path.join(OUTPUT_FOLDER, OUTPUT_FILE_NAME)
        with open(output_path, 'w') as f:
            json.dump({"traces": results}, f, indent=2)
            
        print(f"\n✅ Processing Complete.")
        print(f"Total Traces: {len(results)}")
        print(f"Output saved to: {output_path}")

    except Exception as e:
        print(f"Fatal Error: {str(e)}")

if __name__ == "__main__":
    main()
