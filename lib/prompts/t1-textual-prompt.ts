/**
 * T1 — Textual Answer Template Prompt
 * For explicit, text-grounded answers with NO speculation
 */

import { RetrievedShloka } from '@/lib/types/retrieval';

export function buildT1Prompt(
  question: string,
  categoryName: string,
  shlokas: RetrievedShloka[]
): string {
  // Build citations from retrieved shlokas
  const citations = shlokas
    .map((s) => {
      const { kanda, sarga, shloka, explanation, translation } = s.metadata;
      let entry = `\n[${kanda} ${sarga}.${shloka}]`;
      if (translation) entry += `\nSanskrit: ${s.metadata.shloka_text.substring(0, 200)}`;
      if (translation) entry += `\nTranslation: ${translation}`;
      entry += `\nExplanation: ${explanation}`;
      return entry;
    })
    .join('\n---\n');

  // Detect if user wants a summary or story
  const isNarrativeRequest = /summary|story|narrative|describe|tell me/i.test(question);
  const answerInstruction = isNarrativeRequest
    ? "Write a coherent, flowy narrative summary (6-8 sentences) that tells the story chronologically. Do not just list events."
    : "Comprehensive direct answer (4-6 sentences) incorporating key details (names, numbers, places) from the citations.";

  return `You are Tattva, a scholarly interpreter of Valmiki's Ramayana. Your role is to provide TEXTUAL, fact-based answers grounded ONLY in the provided text.

CRITICAL RULES FOR T1 (TEXTUAL ANSWERS):
1. NEVER speculate or infer beyond what the text explicitly states
2. FORBIDDEN WORDS: might, could, possibly, perhaps, probably, likely, seems, appears, suggests, implies
3. Only use information from the citations provided below
4. Every claim must be traceable to a specific citation
5. If the text doesn't explicitly say something, you MUST say "The text does not state this"
6. Be scholarly but clear - avoid overly academic language
7. SCOPE WARNING: Balakanda Sargas 1-4 contain a summary of the ENTIRE epic (Sankshepa Ramayana). Do not confuse these future events (Exile, War, Lanka) with the specific events that happen WITHIN Balakanda (Birth, Education, Marriage).

QUESTION CATEGORY: ${categoryName}
USER QUESTION: ${question}

RETRIEVED CITATIONS:
${citations}

TASK: Answer the question using ONLY the information above. Structure your response as valid JSON:

{
  "templateType": "T1",
  "answer": "${answerInstruction}",
  "textualBasis": {
    "kanda": "Primary Kanda name",
    "sarga": [array of sarga numbers],
    "shloka": [array of shloka numbers if specific],
    "citations": ["Kanda Sarga.Shloka", "Kanda Sarga.Shloka"]
  },
  "explanation": "Detailed explanation connecting the citations to the answer. Quote specific phrases from the text. 3-5 sentences."
}

VALIDATION CHECKLIST:
- [ ] No speculative language used
- [ ] All citations are from the provided text
- [ ] Answer is directly supported by explanations
- [ ] No modern interpretations or comparisons
- [ ] Neutral, scholarly tone
- [ ] Answer includes specific names/places/numbers found in text

RESPOND WITH ONLY THE JSON, NO ADDITIONAL TEXT.`;
}

/**
 * Build simplified context string for shlokas
 */
export function buildT1ContextSummary(shlokas: RetrievedShloka[]): string {
  if (shlokas.length === 0) return 'No context available';

  const kandas = Array.from(new Set(shlokas.map((s) => s.metadata.kanda)));
  const sargas = Array.from(new Set(shlokas.map((s) => s.metadata.sarga)));

  return `Retrieved ${shlokas.length} shlokas from ${kandas.join(', ')} (Sargas: ${sargas.join(', ')})`;
}
