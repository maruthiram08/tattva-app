# Citation Verification System: Implementation Plan

This document outlines the comprehensive plan for building the Citation Verifier for Tattva. The system is deterministic and aims to ensure every citation in generated answers exists in the Pinecone database.

## 1. Define Citation Patterns
**Goal**: Identify and codify all ways citations appear in the text to ensure robust extraction.

*   **Key Requirements**:
    *   Analyze existing regex patterns in the codebase.
    *   Review example citation formats (e.g., `[Bala Kanda 1.1]`, `(Ayodhya 2.3)`, etc.).
    *   Identify gaps where valid citations might be missed.
*   **Inputs**:
    *   Existing codebase regex.
    *   List of known valid citation styles.
*   **Outputs**:
    *   A set of robust Regular Expressions (Regex) covering all valid formats.
    *   A markdown report identifying coverage gaps and recommending specific regex updates.
*   **Success Criteria**:
    *   Regex captures 100% of valid citations in the test set.
    *   False positives are minimized.

## 2. Normalize Kanda Names
**Goal**: Standardize various Kanda name inputs (numbers, abbreviations, full names) into a canonical format for database querying.

*   **Key Requirements**:
    *   Implement a normalization logic: `Input -> Lowercase -> Remove Non-Alphanumeric -> Map Lookup -> Canonical Output`.
    *   **Canonical Forms**: `Bala`, `Ayodhya`, `Aranya`, `Kishkindha`, `Sundara`, `Yuddha`, `Uttara`.
*   **Inputs**:
    *   Raw Kanda strings extracted by regex.
    *   Normalization Map (defining `bk` -> `Bala`, `1` -> `Bala`, `bala kanda` -> `Bala`, etc.).
*   **Outputs**:
    *   `normalize_kanda(input_str) -> str` function.
*   **Success Criteria**:
    *   All variations in the `normalization_map` correctly resolve to their canonical form.
    *   Unknown inputs are returned as-is (graceful degradation).

## 3. Build Pinecone Lookup Function
**Goal**: Verify the existence of a specific (Kanda, Sarga, Shloka) tuple in the vector database.

*   **Key Requirements**:
    *   Function `verify_citation_exists(kanda, sarga, shloka, pinecone_index)`.
    *   Use **Metadata Filtering**: `{"kanda": {"$eq": kanda}, "sarga": {"$eq": sarga}, "shloka": {"$eq": shloka}}`.
    *   **Optimization**: Use a dummy query vector (zeroes) + `include_metadata=True` + `top_k=1`. We only care if it exists.
*   **Outputs**:
    *   Result dictionary: `{ "exists": bool, "shloka_id": str, "text_preview": str }`.
*   **Success Criteria**:
    *   Returns `True` for known existing shlokas.
    *   Returns `False` for non-existent shlokas (e.g., Sarga 999).
    *   Robust against network errors (retries/error handling).

## 4. Build the Complete Verifier
**Goal**: Integrate extraction, normalization, and lookup into a single verification pipeline for an answer.

*   **Key Requirements**:
    *   Pipeline Steps:
        1.  **Extract**: Find all citations in text using Step 1 Regex.
        2.  **Parse**: Split into Kanda, Sarga, Shloka.
        3.  **Normalize**: Convert Kanda to canonical name using Step 2.
        4.  **Verify**: Check existence using Step 3.
    *   **Result Logic**:
        *   **PASS**: All citations exist.
        *   **PASS (No Citations)**: Text has no citations (check edge cases).
        *   **FAIL**: At least one "phantom citation" (does not exist).
*   **Outputs**:
    *   Verification Report JSON:
        ```json
        {
          "result": "PASS|FAIL",
          "phantom_citations": ["Bala 1.999"],
          "details": [...]
        }
        ```
*   **Success Criteria**:
    *   Correctly identifies PASS/FAIL for answers with mixed valid/invalid citations.

## 5. Run on Golden Dataset
**Goal**: Bulk verification against a "Golden Dataset" of Questions and System Traces.

*   **Process**:
    1.  Iterate through the Golden Dataset.
    2.  **Skip T3**: If `expected_template == "T3"`, Skip (no citations required).
    3.  **Get Trace**: Retrieve `final_answer` from system traces.
    4.  **Verify**: Run Step 4 Verifier on the answer.
    5.  **Aggregrate**: Compute Pass Rate.
*   **Outputs**:
    *   Summary Report: `Total`, `Passed`, `Failed`, `Skipped`, `Pass Rate`.
    *   Detailed Log: Per-question status and failure reasons.

## 6. Handle Edge Cases and Final Checklist
**Goal**: Ensure the system is robust and handles anomalies gracefully.

*   **Edge Cases**:
    *   **No Citations**:
        *   T1 Answer (Citation Required) -> **FAIL**.
        *   T3 Answer (No Citation Expected) -> **PASS**.
    *   **Invalid Shloka Numbers**: `Sarga` exists but `Shloka` number is out of bounds -> **FAIL**.
    *   **Duplicate Citations**: Same citation appears twice -> Verify once, count once.
*   **Checklist**:
    *   [ ] Regex coverage confirmed.
    *   [ ] Normalization handles all map keys.
    *   [ ] Pinecone connection verified.
    *   [ ] Phantom citations correctly trigger FAIL.
    *   [ ] T3 questions properly skipped/handled.

## Integration & Implementation Strategy
1.  **Script 1 (`citation_utils.py`)**: Implement Regex definitions and `normalize_kanda` function.
2.  **Script 2 (`pinecone_verifier.py`)**: Implement `verify_citation_exists` and the main `Verifier` class.
3.  **Script 3 (`evaluate_dataset.py`)**: Main execution script to load the Golden Dataset, run the verifier loop, and output the report.
