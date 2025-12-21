import { CategoryId } from '@/lib/types/templates';
import { RetrievalResult } from '@/lib/types/retrieval';
import { buildT1Prompt } from '@/lib/prompts/t1-textual-prompt';
import { buildT2Prompt } from '@/lib/prompts/t2-interpretive-prompt';
import { buildT3Prompt } from '@/lib/prompts/t3-refusal-prompt';
import { classifyQuestion } from './classification-service';
import { retrieveContext } from './retrieval-service';
import { isMetadataQuestion, getMetadataAnswer, buildMetadataT1Response } from './metadata-handler';


/**
 * Build prompt based on template type
 */
export function buildPrompt(
    template: 'T1' | 'T2' | 'T3',
    question: string,
    categoryName: string,
    retrieval: RetrievalResult,
    metadataResponse?: string
): string {
    // If this is a metadata question with a pre-defined answer, include it
    if (metadataResponse) {
        return `You are Tattva, answering a STRUCTURAL METADATA question about the Valmiki Ramayana.

This question is about the structure/organization of the epic, not about specific verses.

QUESTION: ${question}

PRE-DEFINED ANSWER (use this as your response):
${metadataResponse}

Simply output the JSON above. This is a metadata question that doesn't require verse citations.`;
    }

    switch (template) {
        case 'T1':
            return buildT1Prompt(question, categoryName, retrieval.shlokas);
        case 'T2':
            return buildT2Prompt(question, categoryName, retrieval.shlokas);
        case 'T3':
            return buildT3Prompt(question, categoryName);
        default:
            throw new Error(`Unknown template: ${template}`);
    }
}

export type AnswerContext = {
    prompt: string;
    classification: {
        categoryId: CategoryId;
        categoryName: string;
        template: 'T1' | 'T2' | 'T3';
        shouldAnswer: boolean;
        reasoning: string;
    };
    retrieval: RetrievalResult;
    isMetadata?: boolean;
    isEtymology?: boolean;
}

/**
 * Prepare all context needed for generation (Classify -> Retrieve -> Prompt)
 */
export async function prepareAnswerContext(question: string, existingRetrieval?: RetrievalResult): Promise<AnswerContext> {
    // Step 0a: Check for etymology questions (Fix for Q17)
    const { isEtymologyQuestion, extractEtymologyTerm, getEtymologyAnswer, buildEtymologyT1Response } = await import('./etymology-handler');
    if (isEtymologyQuestion(question)) {
        const term = extractEtymologyTerm(question);
        if (term) {
            const etymologyAnswer = getEtymologyAnswer(term);
            if (etymologyAnswer) {
                console.log(`\n📖 Service: Etymology Question Detected for "${term}" - Using pre-defined answer`);
                const etymologyResponse = buildEtymologyT1Response(etymologyAnswer);

                return {
                    prompt: buildPrompt('T1', question, 'Sanskrit Terms', { shlokas: [], totalRetrieved: 0 }, etymologyResponse),
                    classification: {
                        categoryId: 38 as CategoryId,
                        categoryName: 'Sanskrit Terms',
                        template: 'T1',
                        shouldAnswer: true,
                        reasoning: 'Etymology question with pre-defined linguistic answer'
                    },
                    retrieval: { shlokas: [], totalRetrieved: 0 },
                    isEtymology: true
                };
            }
        }
    }

    // Step 0b: Check for metadata questions (Fix for Q56)
    if (isMetadataQuestion(question)) {
        const metadataAnswer = getMetadataAnswer(question);
        if (metadataAnswer) {
            console.log('\n📋 Service: Metadata Question Detected - Using pre-defined answer');
            const metadataResponse = buildMetadataT1Response(metadataAnswer);

            return {
                prompt: buildPrompt('T1', question, 'Meta / Source Transparency', { shlokas: [], totalRetrieved: 0 }, metadataResponse),
                classification: {
                    categoryId: 44 as CategoryId,
                    categoryName: 'Meta / Source Transparency',
                    template: 'T1',
                    shouldAnswer: true,
                    reasoning: 'Metadata question with pre-defined structural answer'
                },
                retrieval: { shlokas: [], totalRetrieved: 0 },
                isMetadata: true
            };
        }
    }

    // Step 1: Classification
    console.log('\n📊 Service: Classification...');
    const classification = await classifyQuestion(question);
    console.log('Category:', classification.categoryId, '-', classification.categoryName);

    // Step 2: Retrieval
    let retrieval: RetrievalResult = { shlokas: [], totalRetrieved: 0 };

    if (existingRetrieval) {
        console.log('\n📚 Service: Using existing retrieval context...');
        retrieval = existingRetrieval;
    } else if (classification.shouldAnswer && classification.template !== 'T3') {
        console.log('\n📚 Service: Retrieval...');
        retrieval = await retrieveContext(question, classification.categoryId);
    }

    // Step 3: Citation Validation (P1 Fix)
    const MIN_CITATIONS_REQUIRED = 3;

    // Zero-citation fallback (Fix for Q10, Q23, Q7)
    if (classification.template !== 'T3' && retrieval.shlokas.length === 0) {
        console.warn(`⚠️ Zero Citation Fallback: No shlokas retrieved for "${question.substring(0, 50)}..."`);

        // Strategy: Force switch to T3 (Refusal) with helpful reasoning
        // This prevents T1 structural failure (which requires citations)
        classification.template = 'T3';
        classification.reasoning = 'System failed to retrieve relevant shlokas from the database. Switched to T3 to avoid hallucination.';

        // We still return the context, and buildPrompt will use T3 logic
    }
    else if (classification.template !== 'T3' && retrieval.shlokas.length < MIN_CITATIONS_REQUIRED) {
        console.warn(`⚠️ Citation Validation: Only ${retrieval.shlokas.length} shlokas retrieved (minimum: ${MIN_CITATIONS_REQUIRED})`);

        // Add warning to retrieval result for prompt to see
        retrieval.warning = retrieval.warning
            ? `${retrieval.warning}. LOW CITATION COUNT: Only ${retrieval.shlokas.length} shlokas available.`
            : `LOW CITATION COUNT: Only ${retrieval.shlokas.length} shlokas available. If insufficient evidence, state this clearly.`;
    }

    // Step 4: Build Prompt
    const prompt = buildPrompt(
        classification.template,
        question,
        classification.categoryName,
        retrieval
    );

    return { prompt, classification, retrieval };
}
