/**
 * OpenAI Provider
 * Uses GPT-4o for answer generation
 */

import OpenAI from 'openai';
import {
  ILLMProvider,
  LLMGenerateRequest,
  LLMGenerateResponse,
  LLMProvider,
} from '@/lib/types/llm-provider';

export class OpenAIProvider implements ILLMProvider {
  name: LLMProvider = 'openai';
  private client: OpenAI;
  private model: string;

  constructor(model: string = 'gpt-4o') {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not set');
    }

    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  isAvailable(): boolean {
    return !!process.env.OPENAI_API_KEY;
  }

  async generateAnswer(request: LLMGenerateRequest): Promise<LLMGenerateResponse> {
    try {
      // Build messages array with system prompt
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

      if (request.systemPrompt) {
        messages.push({ role: 'system', content: request.systemPrompt });
      }

      // Add conversation messages
      request.messages.forEach((msg) => {
        messages.push({
          role: msg.role as 'system' | 'user' | 'assistant',
          content: msg.content,
        });
      });

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages,
        max_tokens: request.maxTokens || 4096,
        temperature: request.temperature || 0.3,
      });

      const content = response.choices[0]?.message?.content || '';
      const tokensUsed = response.usage?.total_tokens || 0;

      // Calculate cost (GPT-4o pricing)
      const inputTokens = response.usage?.prompt_tokens || 0;
      const outputTokens = response.usage?.completion_tokens || 0;
      const cost = (inputTokens / 1_000_000) * 2.5 + (outputTokens / 1_000_000) * 10.0;

      return {
        content,
        provider: 'openai',
        model: this.model,
        tokensUsed,
        cost,
      };
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
