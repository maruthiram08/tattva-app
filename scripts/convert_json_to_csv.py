import json
import csv
import sys

INPUT_FILE = "projectupdates/llm_responses_output.json"
OUTPUT_FILE = "projectupdates/llm_responses_output.csv"

def main():
    try:
        print(f"Reading {INPUT_FILE}...")
        with open(INPUT_FILE, 'r') as f:
            data = json.load(f)
        
        traces = data.get("traces", [])
        print(f"Found {len(traces)} traces.")

        # Define CSV headers
        headers = [
            "trace_id",
            "Subgroup",
            "user_query",
            "expanded_query",
            "classification",
            "template",
            "Expected_Depth",
            "llm_used",
            "model",
            "final_answer",
            "retrieved_shlokas_count",
            "retrieved_shlokas_ids"
        ]

        with open(OUTPUT_FILE, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=headers)
            writer.writeheader()

            for trace in traces:
                # Extract retrieved shloka IDs
                shlokas = trace.get("retrieved_shlokas", [])
                shloka_ids = [s.get("id", "") for s in shlokas]
                
                # Build row
                row = {
                    "trace_id": trace.get("trace_id"),
                    "Subgroup": trace.get("Subgroup"),
                    "user_query": trace.get("user_query"),
                    "expanded_query": trace.get("expanded_query"),
                    "classification": trace.get("classification"),
                    "template": trace.get("template"),
                    "Expected_Depth": trace.get("Expected_Depth"),
                    "llm_used": trace.get("llm_used"),
                    "model": trace.get("model"),
                    "final_answer": trace.get("final_answer"),
                    "retrieved_shlokas_count": len(shlokas),
                    "retrieved_shlokas_ids": ", ".join(shloka_ids)
                }
                
                writer.writerow(row)

        print(f"Successfully wrote {len(traces)} rows to {OUTPUT_FILE}")

    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
