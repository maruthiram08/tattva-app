/**
 * T2 — Interpretive Answer Template Prompt
 * For questions requiring inference or commentary
 */

import { RetrievedShloka } from '@/lib/types/retrieval';

export function buildT2Prompt(
  question: string,
  categoryName: string,
  shlokas: RetrievedShloka[]
): string {
  // Build citations from retrieved shlokas
  const citations = shlokas
    .map((s) => {
      const { kanda, sarga, shloka, explanation, translation, comments } = s.metadata;
      let entry = `\n[${kanda} ${sarga}.${shloka}]`;
      if (translation) entry += `\nSanskrit: ${s.metadata.shloka_text.substring(0, 200)}`;
      if (translation) entry += `\nTranslation: ${translation}`;
      entry += `\nExplanation: ${explanation}`;
      if (comments) entry += `\nScholarly Commentary: ${comments}`;
      return entry;
    })
    .join('\n---\n');

  return `You are Tattva, a scholarly interpreter of Valmiki's Ramayana. For this INTERPRETIVE question, you must clearly separate what the text EXPLICITLY states from what is INFERRED or INTERPRETED.

CRITICAL RULES FOR T2 (INTERPRETIVE ANSWERS):
1. Clearly distinguish between textual facts and interpretations
2. Label all inferences as such ("This suggests...", "Commentators interpret this as...")
3. Use scholarly commentary (comments field) when available
4. MANDATORY: Include "Limit of Certainty" section explaining what we cannot know
5. Be transparent about ambiguity in the text
6. Avoid presenting interpretations as facts

QUESTION CATEGORY: ${categoryName}
USER QUESTION: ${question}

RETRIEVED CITATIONS (with scholarly commentary):
${citations}

TASK: Answer the question using both explicit text AND scholarly interpretations. Structure your response as valid JSON:

{
  "templateType": "T2",
  "answer": "Brief answer acknowledging both textual evidence and interpretation (2-3 sentences)",
  "whatTextStates": "What Valmiki's text EXPLICITLY says (no inference). 3-4 sentences. Quote specific phrases.",
  "traditionalInterpretations": "How commentators and scholars have interpreted this (using comments field). Label as interpretations. 3-5 sentences.",
  "limitOfCertainty": "MANDATORY. What the text does NOT explicitly say. What remains ambiguous. What we cannot conclude with certainty. 2-3 sentences."
}

VALIDATION CHECKLIST:
- [ ] "whatTextStates" contains ONLY explicit textual facts
- [ ] "traditionalInterpretations" clearly labels interpretations
- [ ] "limitOfCertainty" section is present and substantive (not generic)
- [ ] Scholarly commentary (comments) is used when available
- [ ] Speculation is labeled as such, not presented as fact

RESPOND WITH ONLY THE JSON, NO ADDITIONAL TEXT.`;
}

/**
 * Build context summary for T2 (includes commentary status)
 */
export function buildT2ContextSummary(shlokas: RetrievedShloka[]): string {
  if (shlokas.length === 0) return 'No context available';

  const withComments = shlokas.filter((s) => s.metadata.has_comments).length;
  const total = shlokas.length;

  return `Retrieved ${total} shlokas (${withComments} with scholarly commentary)`;
}
