import { smartStreamObject, smartGenerateObject } from '@/lib/ai/smart-generation';
import { z } from 'zod';
import { prepareAnswerContext } from '@/lib/services/answer-service';
import { VerificationService } from '@/lib/services/verification-service';
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
  redirect: z.object({
    introduction: z.string(),
    alternatives: z.array(z.string())
  }).optional(),
  // Legacy field support (optional for backward compat if needed, but we typically drop it)
  whatICanHelpWith: z.array(z.string()).optional(),
});

// Helper to build full answer text from structured parts
function constructFullAnswer(obj: z.infer<typeof UnifiedSchema>) {
  if (obj.templateType === 'T3') {
    let text = obj.outOfScopeNotice || '';
    if (obj.why) text += '\n\n' + obj.why;
    // New Schema Support
    if (obj.redirect && obj.redirect.alternatives && obj.redirect.alternatives.length > 0) {
      text += `\n\n${obj.redirect.introduction}\n- ` + obj.redirect.alternatives.join('\n- ');
    }
    // Fallback for legacy schema
    else if (obj.whatICanHelpWith && obj.whatICanHelpWith.length > 0) {
      text += '\n\n**Related Topics:**\n- ' + obj.whatICanHelpWith.join('\n- ');
    }
    return text;
  }
  if (obj.templateType === 'T2') {
    let text = obj.answer || '';
    if (obj.whatTextStates) text += '\n\n**Textual Basis:**\n' + obj.whatTextStates;
    if (obj.traditionalInterpretations) text += '\n\n**Interpretations:**\n' + obj.traditionalInterpretations;
    if (obj.limitOfCertainty) text += '\n\n**Limit of Certainty:**\n' + obj.limitOfCertainty;
    return text;
  }
  // T1
  return obj.answer || obj.explanation || '';
}

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

      // Verification Layer (Phase B+)
      let finalObject = result.object;
      if (finalObject.templateType === 'T2') {
        const validation = VerificationService.validateAndFixT2(finalObject);
        if (!validation.valid) {
          console.log('⚠️ VerificationService: Fixed T2 response errors:', validation.errors);
          finalObject = validation.fixedResponse;
        }
      }

      const totalLatency = Date.now() - startTotal;
      const generationLatency = totalLatency - contextLatency;

      // Use finalObject (potentially fixed) for construction
      const fullAnswer = constructFullAnswer(finalObject);

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
          confidence: context.classification.confidence || 1.0,
          template_selected: context.classification.template,
          question_intent: context.classification.questionIntent,
        },
        classification_latency_ms: 0,
        generation_result: {
          model: result.providerModel,
          template_used: finalObject.templateType,
          answer: fullAnswer,
          citations_in_answer: finalObject.textualBasis?.citations || [],
        },
        generation_latency_ms: generationLatency,
        total_latency_ms: totalLatency,
      };

      // Save trace asynchronously
      traceService.saveTrace(trace).catch(err => console.error('Error saving trace:', err));

      // Return both trace AND full response object for batch evaluation
      const batchResponse = {
        ...trace,
        full_response: finalObject, // Include full LLM response for T2 whatTextStates access
      };

      return new Response(JSON.stringify(batchResponse), { headers: { 'Content-Type': 'application/json' } });
    }

    const result = await smartStreamObject({
      schema: UnifiedSchema,
      prompt: "IMPORTANT: You MUST output the 'templateType' field FIRST. " + context.prompt,
      mode: 'json',
      preferredProvider: preferredProvider as 'openai' | 'anthropic',
      onFinish: async ({ object }) => {
        try {
          const totalLatency = Date.now() - startTotal;
          const generationLatency = totalLatency - contextLatency; // Approximate

          const fullAnswer = object ? constructFullAnswer(object) : '';

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
              confidence: context.classification.confidence || 1.0,
              template_selected: context.classification.template,
              question_intent: context.classification.questionIntent,
            },
            classification_latency_ms: 0, // Embedded

            generation_result: object ? {
              model: 'gpt-4o', // Or claude-3-haiku if fallback used
              template_used: object.templateType,
              answer: fullAnswer,
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
