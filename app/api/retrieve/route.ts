import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { retrieveContext } from '@/lib/services/retrieval-service';
import { CategoryId } from '@/lib/types/templates';

/**
 * Request schema
 */
const RetrieveRequestSchema = z.object({
  question: z.string().min(1),
  categoryId: z.number().int().min(1).max(45),
  filters: z
    .object({
      kanda: z.string().optional(),
      sarga: z.number().optional(),
      shloka: z.number().optional(),
    })
    .optional(),
});

/**
 * POST /api/retrieve
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request
    const { question, categoryId, filters } = RetrieveRequestSchema.parse(body);

    console.log('Retrieving context:', { question, categoryId, filters });

    // Use shared service
    const result = await retrieveContext(question, categoryId as CategoryId, filters);

    console.log(`Retrieved ${result.totalRetrieved} shlokas`);
    if (result.warning) {
      console.warn(result.warning);
    }

    return NextResponse.json({
      success: true,
      result,
      categoryId,
    });
  } catch (error: unknown) {
    console.error('Retrieval API error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Retrieval failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
