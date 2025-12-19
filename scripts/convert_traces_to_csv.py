import json
import csv
import sys
import os

INPUT_FILE = "logs/traces.jsonl"
OUTPUT_FILE = "evaluations/data/traces_output.csv"

def main():
    try:
        print(f"Reading {INPUT_FILE}...")
        traces = []
        with open(INPUT_FILE, 'r') as f:
            for line in f:
                if line.strip():
                    try:
                        traces.append(json.loads(line))
                    except json.JSONDecodeError:
                        print(f"Skipping invalid JSON line")
        
        print(f"Found {len(traces)} traces.")

        # Define CSV headers based on TraceData structure
        # Flattening structure for CSV
        headers = [
            "trace_id",
            "timestamp",
            "user_query",
            "expanded_query",
            "classification_category",
            "classification_template",
            "classification_model",
            "generation_model",
            "final_answer",
            "retrieved_shlokas_count",
            "retrieved_shlokas_ids",
            "total_latency_ms"
        ]

        with open(OUTPUT_FILE, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=headers)
            writer.writeheader()

            for trace in traces:
                # Extract retrieved shloka IDs
                retrieval = trace.get("retrieval_results", {})
                shlokas = retrieval.get("shlokas", []) if retrieval else []
                shloka_ids = [s.get("id", "") for s in shlokas]
                
                # Extract sub-objects
                classification = trace.get("classification_result", {})
                generation = trace.get("generation_result", {})

                # Build row
                row = {
                    "trace_id": trace.get("trace_id"),
                    "timestamp": trace.get("timestamp"),
                    "user_query": trace.get("user_query"),
                    "expanded_query": trace.get("expanded_query"),
                    
                    "classification_category": classification.get("category"),
                    "classification_template": classification.get("template_selected"),
                    "classification_model": classification.get("model"),
                    
                    "generation_model": generation.get("model"),
                    "final_answer": generation.get("answer"),
                    
                    "retrieved_shlokas_count": len(shlokas),
                    "retrieved_shlokas_ids": ", ".join(shloka_ids),
                    
                    "total_latency_ms": trace.get("total_latency_ms")
                }
                
                writer.writerow(row)

        print(f"Successfully wrote {len(traces)} rows to {OUTPUT_FILE}")

    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
