import { smartStreamObject, smartGenerateObject } from '@/lib/ai/smart-generation';
import { z } from 'zod';
import { prepareAnswerContext } from '@/lib/services/answer-service';
import { traceService } from '@/lib/services/trace-service';
import { TraceData } from '@/lib/types/trace';
import { randomUUID } from 'crypto';

// Define schemas matching our types (Duplicated for now, or export from a shared schema file)
// Schemas are defined in UnifiedSchema below to avoid union issues
// const T1Schema = ...

export const maxDuration = 60;
export const runtime = 'nodejs';

// Unified Schema to handle all template types without Union blocking
const UnifiedSchema = z.object({
  templateType: z.enum(['T1', 'T2', 'T3']),
  // T1 Fields
  answer: z.string().optional(), // Shared with T2
  textualBasis: z.object({
    kanda: z.string(),
    sarga: z.union([z.number(), z.array(z.number())]).optional(),
    shloka: z.union([z.number(), z.array(z.number())]).optional(),
    citations: z.array(z.string()),
  }).optional(),
  explanation: z.string().optional(),
  // T2 Fields
  whatTextStates: z.string().optional(),
  traditionalInterpretations: z.string().optional(),
  limitOfCertainty: z.string().optional(),
  // T3 Fields
  outOfScopeNotice: z.string().optional(),
  why: z.string().optional(),
  whatICanHelpWith: z.array(z.string()).optional(),
});

export async function POST(req: Request) {
  console.log('API /api/answer called');
  try {
    const { question, retrieval: clientRetrieval, preferredProvider, stream = true } = await req.json();

    const startTotal = Date.now();
    const startContext = Date.now();

    const context = await prepareAnswerContext(question, clientRetrieval);
    const contextLatency = Date.now() - startContext;
    console.log('Context prepared, prompt length:', context.prompt.length);

    if (stream === false) {
      // Non-streaming mode for Batch Evaluation
      const result = await smartGenerateObject({
        schema: UnifiedSchema,
        prompt: "IMPORTANT: You MUST output the 'templateType' field FIRST. " + context.prompt,
        mode: 'json',
        preferredProvider: preferredProvider as 'openai' | 'anthropic',
      });

      const totalLatency = Date.now() - startTotal;
      const generationLatency = totalLatency - contextLatency;

      const trace: TraceData = {
        trace_id: randomUUID(),
        timestamp: new Date().toISOString(),
        user_query: question,
        expanded_query: context.retrieval.expandedQuery,
        query_expansion_latency_ms: 0,
        retrieval_results: context.retrieval,
        retrieval_latency_ms: 0,
        classification_result: {
          model: 'gpt-4o', // Hardcoded as services use openai directly for now
          category: context.classification.categoryName,
          category_id: context.classification.categoryId,
          confidence: 1.0,
          template_selected: context.classification.template,
        },
        classification_latency_ms: 0,
        generation_result: {
          model: result.providerModel,
          template_used: result.object.templateType,
          answer: result.object.answer || result.object.whatTextStates || result.object.why || '',
          citations_in_answer: result.object.textualBasis?.citations || [],
        },
        generation_latency_ms: generationLatency,
        total_latency_ms: totalLatency,
      };

      // Save trace asynchronously
      traceService.saveTrace(trace).catch(err => console.error('Error saving trace:', err));

      // Return both trace AND full response object for batch evaluation
      const batchResponse = {
        ...trace,
        full_response: result.object, // Include full LLM response for T2 whatTextStates access
      };

      return new Response(JSON.stringify(batchResponse), { headers: { 'Content-Type': 'application/json' } });
    }

    const result = await smartStreamObject({
      schema: UnifiedSchema,
      prompt: "IMPORTANT: You MUST output the 'templateType' field FIRST. " + context.prompt,
      mode: 'json',
      preferredProvider: preferredProvider as 'openai' | 'anthropic',
      onFinish: async ({ object, usage }) => {
        try {
          const totalLatency = Date.now() - startTotal;
          const generationLatency = totalLatency - contextLatency; // Approximate

          const trace: TraceData = {
            trace_id: randomUUID(),
            timestamp: new Date().toISOString(),
            user_query: question,
            // session_id: req.headers.get('x-session-id') || undefined, // Todo: Add session ID from client

            expanded_query: context.retrieval.expandedQuery,
            query_expansion_latency_ms: 0, // Embedded in retrieval for now

            retrieval_results: context.retrieval,
            retrieval_latency_ms: 0, // Embedded in prepareAnswerContext, need granular timing later

            classification_result: {
              model: 'gpt-4o', // Hardcoded for now based on service
              category: context.classification.categoryName,
              category_id: context.classification.categoryId,
              confidence: 1.0, // Mock for now
              template_selected: context.classification.template,
            },
            classification_latency_ms: 0, // Embedded

            generation_result: object ? {
              model: 'gpt-4o', // Or claude-3-haiku if fallback used
              template_used: object.templateType,
              answer: object.answer || object.whatTextStates || object.why || '',
              citations_in_answer: object.textualBasis?.citations || [],
            } : undefined,
            generation_latency_ms: generationLatency,

            total_latency_ms: totalLatency,
          };

          await traceService.saveTrace(trace);
        } catch (err) {
          console.error('Error saving trace:', err);
        }
      }
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
  }
}
