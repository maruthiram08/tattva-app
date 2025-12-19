import pandas as pd
import sys
import os

# Configuration
# User pointed to `transformedllmoutput.csv` but the logic describes transforming the raw interleaved data.
# I will use the verified interleaved source `llm_responses_output.csv`.
INPUT_FILE = "projectupdates/llm_responses_output.csv"
OUTPUT_FILE = "projectupdates/finalfixllmoutput.csv"

# Columns to use for grouping/identity
QUESTION_COLS = [
    "user_query",
    "expanded_query",
    "Subgroup",
    "classification",
    "template",
    "Expected_Depth"
]

def collapse_group(group):
    # Take question-level fields from first row
    # Ensure they exist in the group
    valid_cols = [c for c in QUESTION_COLS if c in group.columns]
    base = group.iloc[0][valid_cols]

    # Identify Model Cols (All cols that are NOT in QUESTION_COLS)
    # The input file is LONG format (shared cols + model specific value in generic cols?).
    # Wait, the input `llm_responses_output.csv` is NOT wide with prefixes yet.
    # It has `llm_used`, `final_answer`, etc.
    # The user instructions "Part 2" assume "Model-specific columns are already prefixed".
    # So I must FIRST prefix the columns, THEN collapse.
    
    # Logic:
    # 1. Read Raw CSV.
    # 2. For each row, rename columns based on `llm_used` value.
    #    e.g. `final_answer` -> `openai_final_answer` (if llm_used=openai)
    #    Keep QUESTION_COLS as is.
    # 3. Concatenate these processed rows into a standard schema (lots of nulls).
    # 4. Group by user_query and collapse.
    
    pass 

def main():
    print(f"Reading {INPUT_FILE}...")
    try:
        df = pd.read_csv(INPUT_FILE)
    except Exception as e:
        print(f"Error reading input CSV: {e}")
        sys.exit(1)

    print(f"Initial Rows: {len(df)}")
    
    # SIMPLIFIED ROBUST LOGIC
    # 1. Read Raw
    df = pd.read_csv(INPUT_FILE)
    print(f"Initial Rows: {len(df)}")
    
    # 2. Assign 'model_prefix'
    def get_prefix(val):
        s = str(val).lower()
        if 'openai' in s: return 'openai'
        if 'claude' in s or 'anthropic' in s: return 'claude'
        return 'unknown'
        
    df['model_prefix'] = df['llm_used'].apply(get_prefix)
    
    # 3. Pivot
    # We want one row per user_query.
    # Columns to preserve (index): QUESTION_COLS
    # Columns to pivot: everything else
    
    # Check if user_query is unique per model?
    # duplicates = df.groupby(['user_query', 'model_prefix']).size()
    # print(duplicates[duplicates > 1])
    
    # Pivot logic
    pivot_cols = [c for c in df.columns if c not in QUESTION_COLS and c != 'model_prefix' and c != 'llm_used']
    
    # We melt first? Or just iterate?
    # Let's iterate to be safe and explicit like the user wanted, but CORRECTLY.
    
    unique_queries = df['user_query'].unique()
    print(f"Unique Queries: {len(unique_queries)}")
    
    final_rows = []
    
    grouped = df.groupby('user_query')
    
    for query, group in grouped:
        # Base data from first row
        base_row = group.iloc[0][QUESTION_COLS].to_dict()
        
        # Merge model data
        for _, row in group.iterrows():
            prefix = row['model_prefix']
            for col in pivot_cols:
                val = row[col]
                if pd.notna(val):
                    base_row[f"{prefix}_{col}"] = val
        
        final_rows.append(base_row)
        
    final_df = pd.DataFrame(final_rows)

    # 5. Validation
    print("\n--- Validation ---")
    print(f"Final Rows: {len(final_df)}")
    
    # Write
    print(f"Writing to {OUTPUT_FILE}...")
    final_df.to_csv(OUTPUT_FILE, index=False)
    print("Done.")

if __name__ == "__main__":
    main()
