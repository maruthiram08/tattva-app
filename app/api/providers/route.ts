/**
 * Providers API Route
 * Returns available LLM providers and their configuration
 *
 * GET /api/providers
 */

import { NextResponse } from 'next/server';
import {
  getAvailableProviders,
  getDefaultProvider,
  getProviderDisplayName,
  getProviderDefaultModel,
  getProviderCostPer1kTokens,
} from '@/lib/llm/provider-factory';
import { LLMProvider } from '@/lib/types/llm-provider';

export async function GET() {
  try {
    const availableProviders = getAvailableProviders();
    const defaultProvider = getDefaultProvider();

    const providers = availableProviders.map((provider: LLMProvider) => ({
      id: provider,
      name: getProviderDisplayName(provider),
      model: getProviderDefaultModel(provider),
      isDefault: provider === defaultProvider,
      cost: getProviderCostPer1kTokens(provider),
    }));

    return NextResponse.json({
      success: true,
      defaultProvider,
      providers,
      total: providers.length,
    });
  } catch (error) {
    console.error('Providers API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch providers',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
