# Template Compliance Fixes — Priority 5 Questions

**Goal**: Fix 5 questions to reach 90% (54/60) from current 81.7% (49/60)

---

## Summary of Issues

| Q# | Question | Issue | Fix Type |
|----|----------|-------|----------|
| 10 | Luv/Kush identification | No citations found, no answer | Retrieval + Fallback |
| 23 | Vibhishana's wife | No citations found, no answer | Retrieval + Fallback |
| 47 | Agni Pariksha justification | Wrong template (T1 instead of T2) | Routing Fix |
| 56 | First Kanda name | Citations don't support claim | Retrieval Quality |
| 17 | Dasharatha meaning | Wrong shlokas retrieved | Retrieval Quality |

---

## Fix 1: Q47 — Agni Pariksha (ROUTING ISSUE)

### Problem
The router assigned this to T2 (interpretive), but the system generated a T1 response. The T2 template requires:
- Hedging language ("scholars interpret...", "one perspective is...")
- Uncertainty section
- Multiple interpretive viewpoints

### Root Cause
The system is ignoring the router's template assignment and defaulting to T1.

### Fix
In your response generation logic, ensure the `templateType` from the router is passed to and respected by the LLM:

```typescript
// In your generation pipeline (pseudocode)
const routerResult = await classifyQuestion(query);
const assignedTemplate = routerResult.template; // "T2"

// PROBLEM: The LLM is overriding this and returning T1
// FIX: Enforce the template in the prompt

const prompt = `
You MUST use template: ${assignedTemplate}

${assignedTemplate === 'T2' ? T2_PROMPT : T1_PROMPT}

Question: ${query}
`;
```

### Validation
After fix, Q47 response should include:
- `"templateType": "T2"`
- Phrases like "One interpretation is...", "Scholars have noted..."
- A "Limits of Certainty" or "Interpretive Notes" section

---

## Fix 2: Q10 & Q23 — No Citations Found (RETRIEVAL FALLBACK)

### Problem
Both questions return 0 citations because:
- Q10 (Luv/Kush): This story is in **Uttara Kanda** which may have sparse coverage
- Q23 (Vibhishana's wife): Minor character, may not be explicitly mentioned

Current response: "The text does not explicitly mention..." with no citations.

### Fix Option A: Graceful "Not Found" Response
Add a validation step that checks citation count before responding:

```typescript
// After retrieval
if (citations.length === 0) {
  return {
    templateType: "T1",
    answer: "The specific details requested are not found in the available Valmiki Ramayana text database.",
    textualBasis: {
      citations: [],
      note: "No relevant shlokas were retrieved for this query."
    },
    whatTextStates: "The retrieved portions of the text do not contain information about this topic.",
    // This is a VALID T1 response — it's honest about absence
  };
}
```

### Fix Option B: Expand Retrieval (Better)
Before giving up, try alternate queries:

```typescript
async function retrieveWithFallback(query: string) {
  // Primary retrieval
  let results = await retrieve(query);
  
  if (results.length < 2) {
    // Fallback 1: Extract key entities and search
    const entities = extractEntities(query); // ["Luv", "Kush", "Rama"]
    for (const entity of entities) {
      const fallbackResults = await retrieve(entity);
      results = [...results, ...fallbackResults];
    }
  }
  
  if (results.length < 2) {
    // Fallback 2: Search for related concepts
    const relatedTerms = {
      "Luv and Kush": ["Lava", "Kusha", "twins", "sons of Rama", "Uttara Kanda"],
      "Vibhishana wife": ["Sarama", "Vibhishana family", "Lanka queen"]
    };
    // Try related terms...
  }
  
  return deduplicateAndRerank(results);
}
```

### For Q10 specifically
The story of Rama identifying Luv and Kush is in Uttara Kanda when the twins recite the Ramayana. Search terms to try:
- "Lava Kusha"
- "twins reciting Ramayana"
- "Uttara Kanda Valmiki ashram"

### For Q23 specifically
Vibhishana's wife **Sarama** appears in Sundara Kanda consoling Sita. Search:
- "Sarama"
- "Vibhishana wife Sita"
- "rakshasi consoling Sita"

---

## Fix 3: Q56 — First Kanda Name (SEMANTIC MISMATCH)

### Problem
The answer says "Bala-Kanda" (correct!) but cites shlokas that don't actually state this is the "first" Kanda:
- Bala-Kanda 3.24 — doesn't say "first"
- Bala-Kanda 1.17 — doesn't say "first"  
- Bala-Kanda 3.7 — doesn't say "first"

### Fix
This is a **metadata question**, not a textual question. The system should recognize this pattern.

```typescript
// Add a metadata response handler
const METADATA_QUESTIONS = {
  "first kanda": {
    answer: "The first Kanda in Valmiki Ramayana is Bala-Kanda (Book of Youth/Childhood).",
    source: "This is structural metadata about the epic's organization.",
    note: "The seven Kandas are: Bala, Ayodhya, Aranya, Kishkindha, Sundara, Yuddha, and Uttara."
  },
  "how many kandas": {
    answer: "The Valmiki Ramayana has seven Kandas.",
    // ...
  }
};

// In classification
if (isMetadataQuestion(query)) {
  return generateMetadataResponse(query);
}
```

### Alternative Fix
If you want to keep using citations, the response should say:

> "The first Kanda is called Bala-Kanda. This is established by the structure of the epic, where Bala-Kanda chapters are numbered starting from 1.1. For example, [Bala-Kanda 1.1] begins the narrative."

This is semantically honest — the citation proves Bala-Kanda exists and comes first by its numbering.

---

## Fix 4: Q17 — Dasharatha Meaning (WRONG RETRIEVAL)

### Problem
User asks: "What does 'Dasharatha' mean?"
System retrieves shlokas **about** Dasharatha, not shlokas explaining the **etymology**.

Current answer talks about:
- Dasharatha being a sage-king
- Dasharatha sitting in an aerial car
- Rama being son of Dasharatha

None of this answers the etymology question.

### The Actual Answer
"Dasharatha" = "दश (dasha = ten) + रथ (ratha = chariot)" = "One who has ten chariots" or "One who can drive a chariot in ten directions"

### Fix Option A: Etymology Database
Create a separate lookup for Sanskrit term meanings:

```typescript
const SANSKRIT_ETYMOLOGY = {
  "Dasharatha": {
    meaning: "One who has ten chariots / One who can fight in ten directions",
    breakdown: "दश (dasha = ten) + रथ (ratha = chariot)",
    significance: "Signifies his prowess as a warrior king"
  },
  "Ramayana": {
    meaning: "The journey/story of Rama",
    breakdown: "राम (Rama) + अयन (ayana = journey/path)",
  },
  // Add more...
};
```

### Fix Option B: Better Query Reformulation
When the question pattern is "What does X mean?", reformulate the retrieval query:

```typescript
if (query.match(/what does ['"]?(\w+)['"]? mean/i)) {
  const term = match[1];
  // Search for etymology-related shlokas
  const etymologyQuery = `${term} name meaning etymology`;
  // Also search for verses where the name is explained
  const explanationQuery = `${term} called named because`;
}
```

---

## Implementation Priority

| Priority | Fix | Effort | Impact |
|----------|-----|--------|--------|
| 🔴 P0 | Q47 routing (enforce T2) | 30 min | +1 pass |
| 🔴 P0 | Q10/Q23 fallback response | 1 hour | +2 passes |
| 🟡 P1 | Q56 metadata handler | 2 hours | +1 pass |
| 🟡 P1 | Q17 etymology lookup | 2 hours | +1 pass |

**Total: ~5-6 hours of work to reach 90% target**

---

## Quick Win: Prompt Patch for Q47

If you want the fastest fix for Q47, just update your T2 prompt to be more assertive:

```typescript
const T2_PROMPT = `
You are answering an INTERPRETIVE question about the Ramayana.

REQUIRED FORMAT (you MUST include ALL of these):

1. **Answer**: Your interpretation, using hedging language like:
   - "One interpretation suggests..."
   - "The text can be understood as..."
   - "Scholars have noted that..."

2. **Textual Basis**: Citations supporting the interpretation

3. **Alternative Perspectives**: At least one other way to interpret this

4. **Limits of Certainty**: Acknowledge what the text does NOT explicitly state

IMPORTANT: Never present interpretations as absolute facts.
`;
```

---

## Verification Checklist

After implementing fixes, re-run evaluation and verify:

- [ ] Q47 returns `templateType: "T2"` with hedging language
- [ ] Q10 either has citations OR has valid "not found" response
- [ ] Q23 either has citations OR has valid "not found" response  
- [ ] Q56 explains Bala-Kanda without unsupported claims
- [ ] Q17 provides etymology, not just descriptions of Dasharatha
