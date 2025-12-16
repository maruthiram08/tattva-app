import { CategoryId } from '@/lib/types/templates';
import { RetrievalResult } from '@/lib/types/retrieval';
import { buildT1Prompt } from '@/lib/prompts/t1-textual-prompt';
import { buildT2Prompt } from '@/lib/prompts/t2-interpretive-prompt';
import { buildT3Prompt } from '@/lib/prompts/t3-refusal-prompt';

/**
 * Call internal classify API
 */
export async function classifyQuestion(question: string) {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/classify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
    });

    if (!response.ok) {
        throw new Error('Classification failed');
    }

    const data = await response.json();
    return data.classification;
}

/**
 * Call internal retrieve API
 */
export async function retrieveContext(question: string, categoryId: CategoryId) {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/retrieve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, categoryId }),
    });

    if (!response.ok) {
        throw new Error('Retrieval failed');
    }

    const data = await response.json();
    return data.result as RetrievalResult;
}

/**
 * Build prompt based on template type
 */
export function buildPrompt(
    template: 'T1' | 'T2' | 'T3',
    question: string,
    categoryName: string,
    retrieval: RetrievalResult
): string {
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
}

/**
 * Prepare all context needed for generation (Classify -> Retrieve -> Prompt)
 */
export async function prepareAnswerContext(question: string): Promise<AnswerContext> {
    // Step 1: Classification
    console.log('\n📊 Service: Classification...');
    const classification = await classifyQuestion(question);
    console.log('Category:', classification.categoryId, '-', classification.categoryName);

    // Step 2: Retrieval
    let retrieval: RetrievalResult = { shlokas: [], totalRetrieved: 0 };
    if (classification.shouldAnswer && classification.template !== 'T3') {
        console.log('\n📚 Service: Retrieval...');
        retrieval = await retrieveContext(question, classification.categoryId);
    }

    // Step 3: Build Prompt
    const prompt = buildPrompt(
        classification.template,
        question,
        classification.categoryName,
        retrieval
    );

    return { prompt, classification, retrieval };
}
