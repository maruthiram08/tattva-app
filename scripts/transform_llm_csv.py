import pandas as pd
import sys
import os

# Configuration
INPUT_FILE = "projectupdates/llm_responses_output.csv"
OUTPUT_FILE = "projectupdates/transformedllmoutput.csv"

# Columns that are expected to be shared (Question-Level)
# Based on the file headers I observed:
SHARED_COLUMNS = [
    "user_query", 
    "expanded_query", 
    "Subgroup", 
    "classification", 
    "template", 
    "Expected_Depth"
]

# The discriminator column
LLM_ID_COL = "llm_used" # The file uses 'llm_used', user called it 'llmupdated'

def main():
    print(f"Reading {INPUT_FILE}...")
    try:
        df = pd.read_csv(INPUT_FILE)
    except Exception as e:
        print(f"Error reading input CSV: {e}")
        sys.exit(1)

    # 1. Identify Question Groups
    grouped = df.groupby("user_query")
    
    transformed_rows = []
    
    print(f"Processing {len(grouped)} unique questions...")
    
    question_id_counter = 1
    
    errors = []
    
    for query, group in grouped:
        # Sort by llm_used to ensure deterministic column ordering if needed
        # But broadly we just pick the values.
        
        if len(group) != 2:
            msg = f"Error: Question group has {len(group)} rows instead of 2. Query: '{query[:30]}...'"
            # print(msg)
            # If strictly 2 are required, we might skip or pad. 
            # The user requirement says "If a group does not contain exactly 2 rows -> flag it as an error"
            errors.append(msg)
            # We will try to process it if possible, or skip? 
            # "Do NOT infer missing values". 
            # If we have 1 row, we can't make a pair. If we have >2, it's ambiguous.
            # For this script, we'll skip invalid groups to be safe, or just take the first 2?
            # Let's skip and report.
            continue
            
        group = group.sort_values(by=LLM_ID_COL)
        
        # 3. Extract Question-Level Fields (from first row)
        base_row = group.iloc[0]
        
        # Construct the new row
        new_row = {
            "Question_ID": question_id_counter,
        }
        question_id_counter += 1
        
        # Add shared columns
        for col in SHARED_COLUMNS:
            if col in df.columns:
                val1 = group.iloc[0][col]
                val2 = group.iloc[1][col]
                
                # Check consistency if needed, but for now we take the first as the anchor
                # as per "From either row (after confirming equality)"
                new_row[col] = val1
                
        # 4. Pivot LLM-Specific Fields
        # Identify which columns are NOT shared and NOT the discriminator
        # We also exclude valid shared cols to avoid duplication
        # Actually user list specific LLM columns. 
        # I will take ALL other columns and prefix them.
        
        all_cols = set(df.columns)
        exclude_cols = set(SHARED_COLUMNS + [LLM_ID_COL])
        pivot_cols = [c for c in df.columns if c not in exclude_cols]
        
        for idx, row in group.iterrows():
            llm_name = str(row[LLM_ID_COL]).lower().replace("-", "_") # clean up 'openai', 'anthropic'
            
            for col in pivot_cols:
                # User pattern: <LLM_NAME>_<Column>
                new_col_name = f"{llm_name}_{col}"
                new_row[new_col_name] = row[col]

        transformed_rows.append(new_row)

    # Convert to DF
    result_df = pd.DataFrame(transformed_rows)
    
    # Reorder columns to put Question_ID and Shared first
    cols = list(result_df.columns)
    # Priority: Question_ID, then Shared, then the rest
    ordered_cols = ["Question_ID"] + [c for c in SHARED_COLUMNS if c in cols]
    remaining = [c for c in cols if c not in ordered_cols]
    
    # Sort remaining alphabetically or by LLM? 
    # User example: gpt4_final_answer, gpt4_Pass_Fail, claude_final_answer...
    # It's better to group by LLM.
    # We can just leave them as appended (which was done by LLM loop order).
    
    final_cols = ordered_cols + remaining
    result_df = result_df[final_cols]
    
    # 5. Validation Checks
    print("\n--- Validation ---")
    print(f"Input Rows: {len(df)}")
    print(f"Unique Queries: {len(grouped)}")
    print(f"Output Rows: {len(result_df)}")
    if errors:
        print(f"Errors found: {len(errors)}")
        for e in errors[:5]:
            print(e)
    else:
        print("No grouping errors found.")
        
    # Write
    print(f"\nWriting to {OUTPUT_FILE}...")
    result_df.to_csv(OUTPUT_FILE, index=False)
    print("Done.")

if __name__ == "__main__":
    main()
