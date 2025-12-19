# Implementation Plan - Trace Logging System

The goal is to implement a comprehensive trace logging system for the Tattva chatbot to enable evaluation. The trace must capture the entire lifecycle of a user query: input, query expansion, retrieval, classification, and generation.

## User Review Required
> [!IMPORTANT]
> Traces will be saved to a local JSONL file (`logs/traces.jsonl`) for this iteration. Ensure the environment has write permissions to this directory.

## Proposed Changes

### Database Strategy
**Selected Database**: Vercel Postgres (Neon) [PRODUCTION ONLY].
- **Reasoning**: Native integration with Vercel, serverless-friendly, and perfect for structured JSON data (using `JSONB` for flexibility).
- **Local Development**: We will use a **File-based Repository** (`logs/traces.jsonl`) locally to avoid complex DB setup. The code abstraction (`TraceRepository`) ensures the data shape remains identical.
- **Schema**:
```sql
CREATE TABLE traces (
  trace_id UUID PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_query TEXT NOT NULL,
  session_id TEXT,
  expanded_query TEXT,
  retrieval_results JSONB, -- Stores the array of shlokas with metadata
  classification_result JSONB, -- Stores category, ID, confidence
  generation_result JSONB, -- Stores answer, citations, template
  latency_metrics JSONB, -- Stores breakdown of latencies
  total_latency_ms INTEGER
);
```

### Core Logging Infrastructure
#### [NEW] [trace.ts](file:///Users/maruthi/Desktop/MainDirectory/tattvaapp/lib/types/trace.ts)
- Types for the trace structure (TraceId, TraceStep, TraceData).
- Define `TraceRepository` interface to decouple storage logic.

#### [NEW] [trace-service.ts](file:///Users/maruthi/Desktop/MainDirectory/tattvaapp/lib/services/trace-service.ts)
- Implement `FileTraceRepository` for local development (writes to `logs/traces.jsonl`).
- **Production Readiness**: Implement `PostgresTraceRepository` using `@vercel/postgres` or `pg` client.
  - The `TraceStructure` matches the SQL schema above.
  - We will use the `FileTraceRepository` locally to avoid needing a local DB setup immediately, but the data shape is locked in.

### Component Instrumentation

#### [MODIFY] [retrieval.ts](file:///Users/maruthi/Desktop/MainDirectory/tattvaapp/lib/types/retrieval.ts)
- Update `RetrievalResult` interface to include `expandedQuery` (string) and potential latency metrics if needed (though we can measure it in the caller).

#### [MODIFY] [retrieval-service.ts](file:///Users/maruthi/Desktop/MainDirectory/tattvaapp/lib/services/retrieval-service.ts)
- Update `queryPinecone` and `retrieveContext` to return the `expandedQuery`.
- Modify `generateQueryEmbedding` to return `{ embedding, expandedQuery }` instead of just embedding, or refactor so `expandedQuery` is accessible.

#### [MODIFY] [smart-generation.ts](file:///Users/maruthi/Desktop/MainDirectory/tattvaapp/lib/ai/smart-generation.ts)
- Update `SmartStreamOptions` to include `onFinish` callback.
- Pass `onFinish` to the underlying `streamObject` call.

#### [MODIFY] [route.ts](file:///Users/maruthi/Desktop/MainDirectory/tattvaapp/app/api/answer/route.ts)
- Orchestrate the trace collection:
    - Generate `trace_id` and `timestamp`.
    - Measure latency of `prepareAnswerContext`.
    - Extract classification and retrieval details from `context`.
    - Setup `onFinish` callback for `smartStreamObject` to:
        - Capture final answer.
        - Calculate generation latency.
        - Construct the full `TraceData` object.
        - Call `saveTrace`.

## Verification Plan

### Manual Verification
1.  **Generate a Trace**:
    - Run the application locally.
    - Send a query (e.g., "Who is Dadhimukha?").
2.  **Inspect Log File**:
    - Check `logs/traces.jsonl` for a new entry.
    - Verify that all fields from the spec are present:
        - `trace_id`, `timestamp`
        - `expanded_query` (should not be empty if expansion ran)
        - `retrieval` results with shlokas
        - `classification` details
        - `generation` answer and citations
        - `latency` values are reasonable
3.  **Check Edge Cases**:
    - Query that triggers "T3" (Refusal) -> check trace.
    - Query with no retrieval results -> check trace.

### automated Tests
- Create a script `scripts/verify-trace.ts` that:
    - Reads the last line of `logs/traces.jsonl`.
    - Validates it against the Zod schema or required fields list.
    - Prints "VERIFICATION PASSED" or "FAILED".
