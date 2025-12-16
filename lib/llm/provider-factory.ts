/**
 * LLM Provider Factory
 * Creates and manages LLM provider instances
 */

import { ILLMProvider, LLMProvider, ProviderConfig } from '@/lib/types/llm-provider';
import { ClaudeProvider } from './providers/claude-provider';
import { OpenAIProvider } from './providers/openai-provider';
import { GeminiProvider } from './providers/gemini-provider';

/**
 * Default provider from environment or fallback
 */
export function getDefaultProvider(): LLMProvider {
  const envProvider = process.env.DEFAULT_LLM_PROVIDER as LLMProvider;

  if (envProvider && ['claude', 'openai', 'gemini'].includes(envProvider)) {
    return envProvider;
  }

  // Fallback order: Claude > OpenAI > Gemini
  if (process.env.ANTHROPIC_API_KEY) return 'claude';
  if (process.env.OPENAI_API_KEY) return 'openai';
  if (process.env.GEMINI_API_KEY) return 'gemini';

  throw new Error('No LLM provider API keys configured');
}

/**
 * Create provider instance
 */
export function createProvider(config: ProviderConfig): ILLMProvider {
  const { provider, model } = config;

  switch (provider) {
    case 'claude':
      return new ClaudeProvider(model);

    case 'openai':
      return new OpenAIProvider(model);

    case 'gemini':
      return new GeminiProvider(model);

    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

/**
 * Get available providers (based on API keys)
 */
export function getAvailableProviders(): LLMProvider[] {
  const providers: LLMProvider[] = [];

  if (process.env.ANTHROPIC_API_KEY) providers.push('claude');
  if (process.env.OPENAI_API_KEY) providers.push('openai');
  if (process.env.GEMINI_API_KEY) providers.push('gemini');

  return providers;
}

/**
 * Check if a provider is available
 */
export function isProviderAvailable(provider: LLMProvider): boolean {
  const available = getAvailableProviders();
  return available.includes(provider);
}

/**
 * Get provider display name
 */
export function getProviderDisplayName(provider: LLMProvider): string {
  const names = {
    claude: 'Claude 3.5 Sonnet (Anthropic)',
    openai: 'GPT-4o (OpenAI)',
    gemini: 'Gemini 1.5 Pro (Google)',
  };
  return names[provider];
}

/**
 * Get provider default model
 */
export function getProviderDefaultModel(provider: LLMProvider): string {
  const models = {
    claude: 'claude-3-sonnet-20240229',
    openai: 'gpt-4o',
    gemini: 'gemini-pro',
  };
  return models[provider];
}

/**
 * Estimate cost per 1000 tokens (for comparison)
 */
export function getProviderCostPer1kTokens(provider: LLMProvider): { input: number; output: number } {
  const costs = {
    claude: { input: 0.003, output: 0.015 }, // $3/$15 per million
    openai: { input: 0.0025, output: 0.01 }, // $2.5/$10 per million
    gemini: { input: 0.00125, output: 0.005 }, // $1.25/$5 per million
  };
  return costs[provider];
}
