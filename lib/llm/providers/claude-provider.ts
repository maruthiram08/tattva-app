/**
 * Claude (Anthropic) Provider
 * Uses Claude 3.5 Sonnet for answer generation
 */

import Anthropic from '@anthropic-ai/sdk';
import {
  ILLMProvider,
  LLMGenerateRequest,
  LLMGenerateResponse,
  LLMProvider,
} from '@/lib/types/llm-provider';

export class ClaudeProvider implements ILLMProvider {
  name: LLMProvider = 'claude';
  private client: Anthropic;
  private model: string;

  constructor(model: string = 'claude-3-haiku-20240307') {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY not set');
    }

    this.client = new Anthropic({ apiKey });
    this.model = model;
  }

  isAvailable(): boolean {
    return !!process.env.ANTHROPIC_API_KEY;
  }

  async generateAnswer(request: LLMGenerateRequest): Promise<LLMGenerateResponse> {
    try {
      // Separate system message from conversation
      const systemMessage = request.systemPrompt ||
        request.messages.find((m) => m.role === 'system')?.content || '';

      const conversationMessages = request.messages
        .filter((m) => m.role !== 'system')
        .map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }));

      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: request.maxTokens || 4096,
        temperature: request.temperature || 0.3,
        system: systemMessage,
        messages: conversationMessages,
      });

      const content = response.content[0];
      const text = content.type === 'text' ? content.text : '';

      // Calculate cost (Claude 3.5 Sonnet pricing)
      const inputTokens = response.usage.input_tokens;
      const outputTokens = response.usage.output_tokens;
      const cost = (inputTokens / 1_000_000) * 3.0 + (outputTokens / 1_000_000) * 15.0;

      return {
        content: text,
        provider: 'claude',
        model: this.model,
        tokensUsed: inputTokens + outputTokens,
        cost,
      };
    } catch (error) {
      console.error('Claude API error:', error);
      throw new Error(`Claude generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
