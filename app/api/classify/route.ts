import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { classifyQuestion } from '@/lib/services/classification-service';

/**
 * Request schema
 */
const ClassifyRequestSchema = z.object({
  question: z.string().min(3, 'Question must be at least 3 characters').max(500, 'Question too long'),
});

/**
 * POST /api/classify
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request
    const { question } = ClassifyRequestSchema.parse(body);

    console.log('Classifying question:', question);

    const result = await classifyQuestion(question);

    return NextResponse.json({
      success: true,
      classification: result,
    });
  } catch (error) {
    console.error('Classification API error:', error);

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
        error: 'Classification failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
