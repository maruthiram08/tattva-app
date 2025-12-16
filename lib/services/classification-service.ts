import OpenAI from 'openai';
import { z } from 'zod';
import {
    CLASSIFICATION_SYSTEM_PROMPT,
    buildClassificationUserMessage,
    getCategoryDetails,
} from '@/lib/prompts/classification-prompt';
import { ClassificationResult, CategoryId } from '@/lib/types/templates';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

/**
 * LLM Response schema (for parsing JSON response)
 */
const LLMClassificationSchema = z.object({
    categoryId: z.number().int().min(1).max(45),
    categoryName: z.string(),
    template: z.enum(['T1', 'T2', 'T3']),
    confidence: z.number().min(0).max(1),
    reasoning: z.string(),
    shouldAnswer: z.boolean(),
});

/**
 * Rule-based pre-filtering
 * Fast path for obvious patterns before LLM classification
 */
function ruleBasedClassification(question: string): ClassificationResult | null {
    // Explicit shloka references
    if (
        /\b(shloka|sarga|kanda)\s+\d+/i.test(question) ||
        /what does (this|the) (verse|shloka) mean/i.test(question)
    ) {
        const category = getCategoryDetails(34); // Meaning of specific shloka
        return {
            categoryId: 34,
            categoryName: category.name,
            template: category.template,
            confidence: 0.95,
            reasoning: 'Rule-based: Explicit shloka/verse reference detected',
            shouldAnswer: true,
        };
    }

    // Epic overview
    if (
        /^what is (the )?ramayana( about)?$/i.test(question.trim()) ||
        /^(give|provide) (an? )?(overview|summary) of (the )?ramayana$/i.test(question.trim())
    ) {
        const category = getCategoryDetails(1);
        return {
            categoryId: 1,
            categoryName: category.name,
            template: category.template,
            confidence: 0.98,
            reasoning: 'Rule-based: Direct epic overview question',
            shouldAnswer: true,
        };
    }

    // Kanda overview
    const kandaMatch = question.match(/what happens in (bala|ayodhya|aranya|kishkindha|sundara|yuddha) kanda/i);
    if (kandaMatch) {
        const category = getCategoryDetails(2);
        return {
            categoryId: 2,
            categoryName: category.name,
            template: category.template,
            confidence: 0.96,
            reasoning: `Rule-based: Direct Kanda overview question for ${kandaMatch[1]}`,
            shouldAnswer: true,
        };
    }

    // Out-of-scope: Modern comparison
    if (
        /by (modern|today'?s|current) standards/i.test(question) ||
        /compare.+(bible|quran|mahabharata|other)/i.test(question) ||
        /is (this|that) (right|wrong|justified|ethical)/i.test(question)
    ) {
        const category = getCategoryDetails(45);
        return {
            categoryId: 45,
            categoryName: category.name,
            template: category.template,
            confidence: 1.0,
            reasoning: 'Rule-based: Out-of-scope (modern judgment or cross-text comparison)',
            shouldAnswer: false,
        };
    }

    return null; // No rule matched, proceed to LLM
}

/**
 * LLM-based classification using GPT-4
 */
async function llmClassification(question: string): Promise<ClassificationResult> {
    try {
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o', // Fast and accurate for structured outputs
            messages: [
                {
                    role: 'system',
                    content: CLASSIFICATION_SYSTEM_PROMPT,
                },
                {
                    role: 'user',
                    content: buildClassificationUserMessage(question),
                },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.1, // Low temperature for consistency
            max_tokens: 200,
        });

        const responseText = completion.choices[0]?.message?.content;
        if (!responseText) {
            throw new Error('Empty response from OpenAI');
        }

        // Parse and validate JSON response
        const parsed = JSON.parse(responseText);
        const validated = LLMClassificationSchema.parse(parsed);

        // Verify category details match
        const category = getCategoryDetails(validated.categoryId);

        return {
            categoryId: validated.categoryId as CategoryId,
            categoryName: category.name,
            template: category.template,
            confidence: validated.confidence,
            reasoning: validated.reasoning,
            shouldAnswer: validated.shouldAnswer,
        };
    } catch (error) {
        console.error('LLM Classification error:', error);

        // Fallback to refusal on error
        const category = getCategoryDetails(45);
        return {
            categoryId: 45,
            categoryName: category.name,
            template: category.template,
            confidence: 0.5,
            reasoning: 'Classification failed, defaulting to refusal for safety',
            shouldAnswer: false,
        };
    }
}

/**
 * Unified classification function
 */
export async function classifyQuestion(question: string): Promise<ClassificationResult> {
    // Try rule-based classification first (fast path)
    const ruleResult = ruleBasedClassification(question);
    if (ruleResult) {
        return ruleResult;
    }

    // Fallback to LLM classification
    return await llmClassification(question);
}
