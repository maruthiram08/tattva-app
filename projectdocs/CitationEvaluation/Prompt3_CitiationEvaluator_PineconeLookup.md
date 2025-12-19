
You will be creating a Python function that verifies whether a specific citation exists in a Pinecone vector database. This function is part of a citation evaluation system for Sanskrit texts (Ramayana).

Here is the citation reference that needs to be verified:
<citation_reference>
{{CITATION_REFERENCE}}
</citation_reference>

Here is the Pinecone index name to query:
<pinecone_index_name>
{{PINECONE_INDEX_NAME}}
</pinecone_index_name>

Your task is to create a complete, working Python function called `verify_citation_exists` that:

1. Takes the following parameters:
   - kanda (str): The kanda (book/section) name
   - sarga (int): The sarga (chapter) number
   - shloka (int): The shloka (verse) number
   - pinecone_index: The Pinecone index object

2. Normalizes the kanda name using a helper function `normalize_kanda()` (you should implement this helper function to handle common variations like "Bala Kanda" → "balakanda", removing spaces and converting to lowercase)

3. Queries the Pinecone index using metadata filters to find an exact match for the kanda, sarga, and shloka combination

4. Returns a dictionary with the following structure:
   - 'exists': boolean indicating if the citation was found
   - 'shloka_id': the ID of the matching vector (or None if not found)
   - 'text_preview': first 100 characters of the shloka text with "..." appended (or None if not found)

Important implementation requirements:
- Use metadata filtering with the filter syntax: `{"field_name": {"$eq": value}}`
- Use a dummy vector of zeros with dimension 3072 for metadata-only queries
- Set top_k=1 since we only need to verify existence
- Include metadata in the results with `include_metadata=True`
- Handle cases where no matches are found gracefully
- Assume the metadata fields in Pinecone are named: "kanda", "sarga", "shloka", and "text"

Before writing your code, use the scratchpad to think through:
1. How to structure the normalize_kanda helper function
2. How to construct the proper filter query
3. How to handle the query results and extract the needed information
4. Any edge cases or error conditions

<scratchpad>
Think through your implementation approach here.
</scratchpad>

Now write your complete Python function implementation inside <function_code> tags. Include:
- The necessary import statement for Pinecone
- The normalize_kanda helper function
- The complete verify_citation_exists function with proper error handling
- Clear comments explaining key steps

<function_code>
Your complete Python code here
</function_code>

After your code, provide a brief explanation of how your function works inside <explanation> tags.