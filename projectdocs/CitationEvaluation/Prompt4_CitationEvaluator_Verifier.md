
You are an AI assistant tasked with building a complete citation verifier for answers about the Ramayana. You will be given an answer text that may contain citations to specific shlokas (verses), and you need to verify whether those citations actually exist in the source material.

Here is the answer text to verify:
<answer_text>
{{ANSWER_TEXT}}
</answer_text>

Here is the Pinecone index connection information you should use for verification:
<pinecone_index>
{{PINECONE_INDEX}}
</pinecone_index>

Your task is to implement a complete citation verification system following these steps:

**Step 1: Extract All Citations**
Scan through the answer text and identify all citations. Citations typically follow the format: [Kanda Name] [Sarga Number].[Shloka Number]
Examples: "Bala Kanda 1.5", "Ayodhya Kanda 23.12", "Yuddha Kanda 115.18"

Extract the following components from each citation:
- kanda: The name of the Kanda (e.g., "Bala Kanda", "Ayodhya Kanda")
- sarga: The Sarga number (chapter number)
- shloka: The Shloka number (verse number)

**Step 2: Verify Each Citation**
For each extracted citation, verify whether it exists in the Pinecone index by:
- Constructing the shloka_id in the format: "{kanda}_{sarga}_{shloka}"
- Querying the Pinecone index to check if this shloka_id exists
- Recording whether the citation exists (true/false) and the shloka_id

**Step 3: Compile Results**
After verifying all citations:
- Count the total number of citations found
- Count how many citations were successfully verified
- Identify "phantom citations" (citations that don't exist in the source)
- Determine overall result: PASS if no phantom citations exist, FAIL if any phantom citations are found

**Special Case:**
If no citations are found in the answer text, this should be considered a PASS with a note explaining that no citations were present to verify.

**Output Format:**
Use your scratchpad to work through the extraction and verification process step by step. Then provide your final verification report.

<scratchpad>
In scratchpad:
1. List all citations you extracted from the answer text
2. For each citation, show the verification check and result
3. Identify any phantom citations
4. Determine the final pass/fail result
</scratchpad>

After completing your analysis in the scratchpad, provide your final output inside <verification_report> tags as a JSON object with the following structure:

{
    "result": "PASS" or "FAIL",
    "total_citations": [number of citations found],
    "verified_citations": [number of citations that exist],
    "phantom_citations": [list of citation strings that don't exist],
    "details": [
        {
            "citation": "[formatted citation string]",
            "exists": true/false,
            "shloka_id": "[constructed shloka_id]"
        }
    ],
    "note": "[optional note, e.g., for when no citations are found]"
}

Ensure your JSON is properly formatted and includes all required fields.