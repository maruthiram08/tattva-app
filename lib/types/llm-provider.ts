/**
 * LLM Provider Types
 * Abstraction layer for multiple LLM providers
 */

// import { AnswerSchema } from "@/lib/validators/template-validator";

export type LLMProvider = 'claude' | 'openai' | 'gemini';

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMGenerateRequest {
  messages: LLMMessage[];
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string; // Alternative to system message
}

export interface LLMGenerateResponse {
  content: string;
  provider: LLMProvider;
  model: string;
  tokensUsed?: number;
  cost?: number;
}

/**
 * Provider interface that all LLM providers must implement
 */
export interface ILLMProvider {
  name: LLMProvider;
  generateAnswer(request: LLMGenerateRequest): Promise<LLMGenerateResponse>;
  isAvailable(): boolean;
}

/**
 * Provider configuration
 */
export interface ProviderConfig {
  provider: LLMProvider;
  model?: string; // Optional: override default model
  temperature?: number;
  maxTokens?: number;
}
