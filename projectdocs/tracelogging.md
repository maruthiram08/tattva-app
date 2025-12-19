A "trace" is the complete record of one user interaction. For Tattva, each trace MUST capture:

```
┌─────────────────────────────────────────────────────────────────┐
│ TRACE STRUCTURE FOR TATTVA                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  trace_id: "uuid-12345"                                        │
│  timestamp: "2025-12-18T14:32:00Z"                             │
│                                                                 │
│  ┌─ INPUT ─────────────────────────────────────────────────┐   │
│  │ user_query: "Who is Dadhimukha?"                        │   │
│  │ session_id: "session-xyz"                               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─ QUERY EXPANSION ───────────────────────────────────────┐   │
│  │ model: "gpt-4o-mini"                                    │   │
│  │ expanded_query: "Dadhimukha, the monkey guardian of     │   │
│  │                  Madhuvana, who encountered Hanuman..." │   │
│  │ latency_ms: 320                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─ RETRIEVAL ─────────────────────────────────────────────┐   │
│  │ index: "tattva-shlokas"                                 │   │
│  │ top_k: 5                                                │   │
│  │ results: [                                              │   │
│  │   {                                                     │   │
│  │     kanda: "Sundara",                                   │   │
│  │     sarga: 62,                                          │   │
│  │     shloka: 15,                                         │   │
│  │     shloka_text: "...",                                 │   │
│  │                                                         │   │
|. |     explanation: "...",                                 │   │
│  │     score: 0.89                                         │   │
│  │   },                                                    │   │
│  │   ...                                                   │   │
│  │ ]                                                       │   │
│  │ latency_ms: 180                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─ CLASSIFICATION ────────────────────────────────────────┐   │
│  │ model: "gpt-4o"                                         │   │
│  │ category: "Character-Factual"                           │   │
│  │ category_id: 12                                         │   │
│  │ confidence: 0.94                                        │   │
│  │ template_selected: "T1"                                 │   │
│  │ latency_ms: 450                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─ GENERATION ────────────────────────────────────────────┐   │
│  │ model: "claude-3.5-sonnet"                              │   │
│  │ template_used: "T1"                                     │   │
│  │ answer: "Dadhimukha is the elderly monkey guardian..."  │   │
│  │ citations_in_answer: [                                  │   │
│  │   "Sundara Kanda 62.15",                               │   │
│  │   "Sundara Kanda 62.18"                                │   │
│  │ ]                                                       │   │
│  │ latency_ms: 1200                                        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─ OUTPUT ────────────────────────────────────────────────┐   │
│  │ final_response: "..."                                   │   │
│  │ total_latency_ms: 2150                                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Verification Checklist

Before proceeding, verify your logging captures ALL of the following:

- [ ] Original user query (exact text)
- [ ] Expanded query (output of GPT-4o-mini)
- [ ] All retrieved shlokas (with IDs, kanda, sarga, shloka numbers)
- [ ] Retrieval scores for each shloka
- [ ] Classification result (category name AND category ID)
- [ ] Template selected (T1, T2, or T3)
- [ ] Final generated answer (complete text)
- [ ] Citations extracted from the answer
- [ ] Latency at each step
- [ ] Timestamp and trace ID

**If any of these are missing, STOP and fix logging first.**