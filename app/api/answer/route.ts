import { openai } from '@ai-sdk/openai';
import { streamObject } from 'ai';
import { z } from 'zod';
import { prepareAnswerContext } from '@/lib/services/answer-service';

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
    const { question } = await req.json();

    const context = await prepareAnswerContext(question);
    console.log('Context prepared, prompt length:', context.prompt.length);


    // Send retrieval context via headers since StreamData is not supported in streamObject v5 yet
    // Must encode to Base64 to handle Unicode (Sanskrit) characters in headers
    const retrievalJson = JSON.stringify(context.retrieval);
    const encodedRetrieval = Buffer.from(retrievalJson).toString('base64');

    const result = await streamObject({
      model: openai('gpt-4o'),
      // @ts-expect-error mode:'json' is valid in AI SDK v3.1+ but types might be lagging
      mode: 'json',
      schema: UnifiedSchema,
      prompt: "IMPORTANT: You MUST output the 'templateType' field FIRST. " + context.prompt,
    });

    return result.toTextStreamResponse({
      headers: {
        'x-tattva-retrieval-json': encodedRetrieval
      }
    });
  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
  }
}
