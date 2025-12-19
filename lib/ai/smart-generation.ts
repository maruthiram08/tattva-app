import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { streamObject, streamText, generateText, generateObject, LanguageModel, CoreMessage } from 'ai';
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
    console.log('[SmartAI] Providers available:', Object.keys(providers));
    const keys = [...DEFAULT_ORDER];
    if (preferred && keys.includes(preferred)) {
        // Move preferred to front
        const idx = keys.indexOf(preferred);
        keys.splice(idx, 1);
        keys.unshift(preferred);
    }

    const ordered = keys.map(k => providers[k]).filter(p => !!p); // Filter out undefined
    if (ordered.length === 0) {
        console.error('[SmartAI] No valid providers found!');
    }
    return ordered;
}

interface SmartStreamOptions<T> {
    schema?: z.ZodType<T>; // If provided, uses streamObject
    prompt?: string;
    messages?: CoreMessage[];
    system?: string;
    mode?: 'json' | 'tool'; // For streamObject
    preferredProvider?: ProviderKey;
    onFinish?: (event: { usage: any; object?: T | undefined; error?: unknown }) => void | Promise<void>;
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
                onFinish: options.onFinish,
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
 * Generates specific structured output with fallback (Non-Streaming).
 */
export async function smartGenerateObject<T>(options: SmartStreamOptions<T>) {
    if (!options.schema) throw new Error("Schema required for smartGenerateObject");
    const input = options.prompt ? { prompt: options.prompt } : { messages: options.messages! };
    const orderedProviders = getProviderOrder(options.preferredProvider);

    let lastError: any;

    for (const provider of orderedProviders) {
        try {
            console.log(`[SmartAI] Trying ${provider.key} (${provider.modelId})...`);
            // Note: generateObject returns { object, usage, ... } directly
            const result = await generateObject({
                model: provider.instance,
                schema: options.schema,
                system: options.system,
                mode: options.mode || 'json',
                ...input
            });

            // Add provider model info to the result for tracing
            return {
                ...result,
                providerModel: provider.modelId
            };
        } catch (error) {
            console.error(`[SmartAI] ${provider.key} Failed:`, String(error));
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
