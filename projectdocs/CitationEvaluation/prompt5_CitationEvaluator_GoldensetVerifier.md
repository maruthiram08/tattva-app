

You will be verifying citations in answers generated from a golden dataset of questions. Your task is to check whether citations in each answer can be verified against source documents retrieved from a vector database.

Here is the golden dataset containing questions and their metadata:
<golden_dataset>
{{GOLDEN_DATASET}}
</golden_dataset>

Here are the system traces containing the final answers for each question:
<system_traces>
{{SYSTEM_TRACES}}
</system_traces>

Here is the Pinecone index connection information for retrieving source documents:
<pinecone_index>
{{PINECONE_INDEX}}
</pinecone_index>

For each question in the golden dataset, you will need to:

1. Check the question's expected_template field. If it is "T3", skip this question and mark it as SKIP with reason "T3 template - no citations expected" since T3 questions do not require citations.

2. For all other questions, retrieve the corresponding trace from the system_traces using the question's id.

3. If no trace is found for a question, mark it as ERROR with reason "No trace found for this question".

4. For questions with traces, extract the final_answer from the trace and verify all citations in that answer:
   - Parse the answer text to identify all citations (typically in formats like [1], [2], etc.)
   - For each citation, use the Pinecone index to retrieve the referenced source document
   - Check whether the cited content actually supports the claim being made in the answer
   - Determine if the citation is valid (PASS) or invalid (FAIL)

5. Record the verification result for each question including:
   - question_id
   - question text
   - result (PASS/FAIL/SKIP/ERROR)
   - reason (if SKIP or ERROR)
   - details about which citations passed or failed (if applicable)

Use your scratchpad to think through the verification logic for each question before recording results.

<scratchpad>
Think through:
- How to parse citations from the answer text
- How to query Pinecone for each citation
- How to determine if the retrieved content supports the claim
- Edge cases (missing citations, malformed citations, etc.)
</scratchpad>

After processing all questions, calculate summary statistics:
- total: Total number of questions processed
- passed: Number of questions where all citations verified successfully
- failed: Number of questions where one or more citations failed verification
- skipped: Number of T3 questions skipped
- pass_rate: passed / (passed + failed), or 1.0 if no questions required verification

Provide your complete results in the following format:

<results>
<summary>
total: [number]
passed: [number]
failed: [number]
skipped: [number]
pass_rate: [decimal between 0 and 1]
</summary>

<details>
For each question, provide:
<question_result>
question_id: [id]
question: [question text]
result: [PASS/FAIL/SKIP/ERROR]
reason: [explanation if SKIP or ERROR]
citation_details: [details about which citations passed/failed if applicable]
</question_result>
</details>
</results>