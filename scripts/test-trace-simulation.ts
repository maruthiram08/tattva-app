import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import dotenv from 'dotenv';
import { randomUUID } from 'crypto';
import type { TraceData } from '@/lib/types/trace';

// Load env vars FIRST
dotenv.config({ path: '.env.local' });

// Mock Schema
const UnifiedSchema = z.object({
    templateType: z.enum(['T1', 'T2', 'T3']),
    answer: z.string().optional(),
    textualBasis: z.object({
        kanda: z.string(),
        citations: z.array(z.string()),
    }).optional(),
});

async function runTest() {
    // Dynamic imports to ensure env vars are loaded before services init
    const { prepareAnswerContext } = await import('@/lib/services/answer-service');
    const { smartStreamObject } = await import('@/lib/ai/smart-generation');
    const { traceService } = await import('@/lib/services/trace-service');
    // const { TraceData } = await import('@/lib/types/trace'); // Removed

    console.log('🚀 Starting Trace Simulation...');

    const question = "Who is Dadhimukha?";
    const startTotal = Date.now();

    // 1. Prepare Context (Retrieval + Classification)
    console.log('1. Preparing Context...');
    const startContext = Date.now();
    // We mock client retrieval as empty to force server-side retrieval logic if any, 
    // or we can pass mock retrieval. The service handles it.
    const context = await prepareAnswerContext(question, undefined);
    const contextLatency = Date.now() - startContext;

    console.log('   Context ready. Expanded Query:', context.retrieval.expandedQuery);

    // 2. Generate (Stream)
    console.log('2. Generating Answer...');
    const result = await smartStreamObject({
        schema: UnifiedSchema,
        prompt: "IMPORTANT: You MUST output the 'templateType' field FIRST. " + context.prompt,
        mode: 'json',
        onFinish: async ({ object, usage }) => {
            console.log('   Generation Finished.');
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
                    model: 'gpt-4o',
                    category: context.classification.categoryName,
                    category_id: context.classification.categoryId,
                    confidence: 1.0,
                    template_selected: context.classification.template,
                },
                classification_latency_ms: 0,
                generation_result: object ? {
                    model: 'gpt-4o',
                    template_used: object.templateType,
                    answer: object.answer || '',
                    citations_in_answer: object.textualBasis?.citations || [],
                } : undefined,
                generation_latency_ms: generationLatency,
                total_latency_ms: totalLatency,
            };

            console.log('3. Saving Trace...');
            await traceService.saveTrace(trace);
        }
    });

    // Consume stream to trigger onFinish
    for await (const chunk of result.partialObjectStream) {
        // Just consume
    }

    // 4. Verify Log File
    console.log('4. Verifying Log File...');
    const logPath = path.join(process.cwd(), 'logs', 'traces.jsonl');
    if (fs.existsSync(logPath)) {
        const content = fs.readFileSync(logPath, 'utf-8');
        const lines = content.trim().split('\n');
        const lastTrace = JSON.parse(lines[lines.length - 1]);

        console.log('\n✅ Trace Found!');
        console.log('   ID:', lastTrace.trace_id);
        console.log('   Expanded:', lastTrace.expanded_query);
        console.log('   Answer:', lastTrace.generation_result?.answer?.substring(0, 50) + '...');

        if (lastTrace.expanded_query && lastTrace.generation_result) {
            console.log('\nSUCCESS: Trace captures required fields.');
        } else {
            console.error('\nFAILURE: Missing fields in trace.');
        }
    } else {
        console.error('\nFAILURE: Log file not found.');
    }
}

runTest().catch(console.error);
