import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { streamObject, streamText, generateText, LanguageModel, CoreMessage } from 'ai';
import { z } from 'zod';

export type ProviderKey = 'openai' | 'anthropic';

type ProviderConfig = {
    key: ProviderKey;
    modelId: string;
    instance: LanguageModel;
}

const getProviders = (): Record<ProviderKey, ProviderConfig> => {
    return {
        openai: {
            key: 'openai',
            modelId: 'gpt-4o',
            instance: openai('gpt-4o')
        },
        anthropic: {
            // Using Haiku for high availability and speed
            key: 'anthropic',
            modelId: 'claude-3-haiku-20240307',
            instance: anthropic('claude-3-haiku-20240307')
        }
    };
};

const DEFAULT_ORDER: ProviderKey[] = ['openai', 'anthropic'];

function getProviderOrder(preferred?: ProviderKey): ProviderConfig[] {
    const providers = getProviders();
    const keys = [...DEFAULT_ORDER];
    if (preferred && keys.includes(preferred)) {
        // Move preferred to front
        const idx = keys.indexOf(preferred);
        keys.splice(idx, 1);
        keys.unshift(preferred);
    }
    return keys.map(k => providers[k]);
}

interface SmartStreamOptions<T> {
    schema?: z.ZodType<T>; // If provided, uses streamObject
    prompt?: string;
    messages?: CoreMessage[];
    system?: string;
    mode?: 'json' | 'tool'; // For streamObject
    preferredProvider?: ProviderKey;
}

/**
 * Generates text (non-streaming) with fallback.
 */
export async function smartGenerateText(options: SmartStreamOptions<any>) {
    const input = options.prompt ? { prompt: options.prompt } : { messages: options.messages! };
    const orderedProviders = getProviderOrder(options.preferredProvider);

    let lastError: any;

    for (const provider of orderedProviders) {
        try {
            console.log(`[SmartAI] Trying ${provider.key} (${provider.modelId})...`);
            return await generateText({
                model: provider.instance,
                system: options.system,
                ...input
            });
        } catch (error) {
            console.error(`[SmartAI] ${provider.key} Failed:`, error);
            lastError = error;
            // Continue to next provider
        }
    }

    throw lastError || new Error("All AI providers failed.");
}


/**
 * Generates specific structured output with fallback.
 */
export async function smartStreamObject<T>(options: SmartStreamOptions<T>) {
    if (!options.schema) throw new Error("Schema required for smartStreamObject");
    const input = options.prompt ? { prompt: options.prompt } : { messages: options.messages! };
    const orderedProviders = getProviderOrder(options.preferredProvider);

    let lastError: any;

    for (const provider of orderedProviders) {
        try {
            console.log(`[SmartAI] Trying ${provider.key} (${provider.modelId})...`);
            return await streamObject({
                model: provider.instance,
                schema: options.schema,
                system: options.system,
                mode: options.mode || 'json',
                ...input
            });
        } catch (error) {
            console.error(`[SmartAI] ${provider.key} Failed:`, error);
            lastError = error;
            // Continue to next provider
        }
    }

    throw lastError || new Error("All AI providers failed.");
}

/**
 * Generates text with fallback.
 */
export async function smartStreamText(options: SmartStreamOptions<any>) {
    const input = options.prompt ? { prompt: options.prompt } : { messages: options.messages! };
    const orderedProviders = getProviderOrder(options.preferredProvider);

    let lastError: any;

    for (const provider of orderedProviders) {
        try {
            console.log(`[SmartAI] Trying ${provider.key} (${provider.modelId})...`);
            return await streamText({
                model: provider.instance,
                system: options.system,
                ...input
            });
        } catch (error) {
            console.error(`[SmartAI] ${provider.key} Failed:`, error);
            lastError = error;
            // Continue to next provider
        }
    }

    throw lastError || new Error("All AI providers failed.");
}
