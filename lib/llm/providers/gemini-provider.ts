/**
 * Gemini (Google) Provider
 * Uses Gemini Pro for answer generation
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  ILLMProvider,
  LLMGenerateRequest,
  LLMGenerateResponse,
  LLMProvider,
} from '@/lib/types/llm-provider';

export class GeminiProvider implements ILLMProvider {
  name: LLMProvider = 'gemini';
  private client: GoogleGenerativeAI;
  private model: string;

  constructor(model: string = 'gemini-pro-latest') {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not set');
    }

    this.client = new GoogleGenerativeAI(apiKey);
    this.model = model;
  }

  isAvailable(): boolean {
    return !!process.env.GEMINI_API_KEY;
  }

  async generateAnswer(request: LLMGenerateRequest): Promise<LLMGenerateResponse> {
    try {
      const model = this.client.getGenerativeModel({ model: this.model });

      // Build prompt with system instructions
      let fullPrompt = '';

      if (request.systemPrompt) {
        fullPrompt += `${request.systemPrompt}\n\n`;
      }

      // Add system message if present
      const systemMsg = request.messages.find((m) => m.role === 'system');
      if (systemMsg) {
        fullPrompt += `${systemMsg.content}\n\n`;
      }

      // Add conversation messages
      const conversationMessages = request.messages.filter((m) => m.role !== 'system');
      conversationMessages.forEach((msg) => {
        if (msg.role === 'user') {
          fullPrompt += `User: ${msg.content}\n\n`;
        } else if (msg.role === 'assistant') {
          fullPrompt += `Assistant: ${msg.content}\n\n`;
        }
      });

      fullPrompt += 'Assistant:';

      // Generate content
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
        generationConfig: {
          temperature: request.temperature || 0.3,
          maxOutputTokens: request.maxTokens || 4096,
        },
      });

      const response = result.response;
      const content = response.text();

      // Estimate tokens (Gemini doesn't provide exact count in response)
      const estimatedTokens = Math.ceil((fullPrompt.length + content.length) / 4);

      // Calculate cost (Gemini 1.5 Pro pricing)
      // Input: $1.25 per million tokens, Output: $5.00 per million tokens
      const inputTokens = Math.ceil(fullPrompt.length / 4);
      const outputTokens = Math.ceil(content.length / 4);
      const cost = (inputTokens / 1_000_000) * 1.25 + (outputTokens / 1_000_000) * 5.0;

      return {
        content,
        provider: 'gemini',
        model: this.model,
        tokensUsed: estimatedTokens,
        cost,
      };
    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error(`Gemini generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
