# Retrieval Improvement Plan (Phase B+ Sprint 5)

**Objective:**
Integrate **Cohere Reranker** into the retrieval pipeline to improve the relevance of retrieved shlokas found via vector search.

**Problem:**
Vector search (Pinecone) retrieves based on semantic similarity of embeddings. However, for nuanced questions (e.g., "Did Hanuman burn Lanka before..."), the embedding might miss the precise *order* or *relationship* nuance, returning irrelevant verses that just mention the keywords.

**Solution:**
Use a **Two-Stage Retrieval** process:
1.  **Stage 1 (Recall):** Retrieve a larger set of candidates (e.g., Top 50 or 100) from Pinecone using fast vector search.
2.  **Stage 2 (Precision):** Use Cohere Rerank model (`rerank-english-v3.0` or `multilingual-v3.0`) to re-score the candidates based on the specific query.
3.  **Output:** Return the Top K (e.g., 10-20) re-ranked results to the LLM.

## Implementation Details

### 1. Dependencies
- Package: `cohere-ai`
- Env Var: `COHERE_API_KEY`

### 2. Code Changes (`lib/services/retrieval-service.ts`)

#### New Helper Function: `rerankResults`
```typescript
async function rerankResults(
  query: string, 
  docs: RetrievedShloka[], 
  topK: number
): Promise<RetrievedShloka[]> {
  if (!process.env.COHERE_API_KEY) return docs.slice(0, topK);

  const response = await cohere.rerank({
    model: 'rerank-english-v3.0',
    query: query,
    documents: docs.map(d => d.metadata.translation || d.metadata.shloka_text),
    topN: topK
  });
  
  // Map back to RetrievedShloka objects based on index
  return response.results.map(r => docs[r.index]);
}
```

#### Update `queryPinecone`
- Increase `topK` for Pinecone query (Retrieval Factor: 2x or Min 50).
- Call `rerankResults` before returning.

### 3. Fallback Strategy
If `COHERE_API_KEY` is missing or the API fails, the system must gracefully fall back to the original Pinecone ranking (Vector Search).

## Verification
- Test with Q4 (Timeline) and Q14 (Sambuka).
- Check logs for "Reranking top X to Y".
