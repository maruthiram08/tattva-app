/**
 * Retrieval API Route
 * Retrieves relevant shlokas from Pinecone based on question and category
 *
 * Input: { question: string, categoryId: number, filters?: object }
 * Output: RetrievalResult
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { z } from 'zod';
import { getPineconeClient, PINECONE_INDEX_NAME } from '@/lib/pinecone/client';
import { getRetrievalConfig } from '@/lib/config/retrieval-configs';
import { CategoryId } from '@/lib/types/templates';
import { RetrievalResult, RetrievedShloka, ShlokaMetadata } from '@/lib/types/retrieval';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
 * Generate embedding for the question
 */
async function generateQueryEmbedding(question: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: question,
      dimensions: 1536,
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw new Error('Failed to generate query embedding');
  }
}

/**
 * Query Pinecone with appropriate filters
 */
async function queryPinecone(
  embedding: number[],
  categoryId: CategoryId,
  userFilters?: {
    kanda?: string;
    sarga?: number;
    shloka?: number;
  }
): Promise<RetrievalResult> {
  const config = getRetrievalConfig(categoryId);

  // Special case: Category 45 (refusal) - no retrieval needed
  if (categoryId === 45 || config.topK === 0) {
    return {
      shlokas: [],
      totalRetrieved: 0,
      warning: 'No retrieval needed for this category',
    };
  }

  const pinecone = getPineconeClient();
  const index = pinecone.index(PINECONE_INDEX_NAME);

  // Build metadata filters
  const filter: Record<string, any> = {};

  // Apply user-provided filters (e.g., specific kanda/sarga)
  if (userFilters?.kanda) {
    filter.kanda = userFilters.kanda;
  }
  if (userFilters?.sarga !== undefined) {
    filter.sarga = userFilters.sarga;
  }
  if (userFilters?.shloka !== undefined) {
    filter.shloka = userFilters.shloka;
  }

  // Apply config-based filters
  if (config.includeTranslation) {
    filter.has_translation = true;
  }
  if (config.includeComments) {
    filter.has_comments = true;
  }

  console.log('Querying Pinecone:', {
    categoryId,
    topK: config.topK,
    granularity: config.granularity,
    filter,
  });

  try {
    const queryResponse = await index.query({
      vector: embedding,
      topK: config.topK,
      includeMetadata: true,
      filter: Object.keys(filter).length > 0 ? filter : undefined,
    });

    const shlokas: RetrievedShloka[] = queryResponse.matches.map((match) => ({
      id: match.id,
      score: match.score || 0,
      metadata: match.metadata as unknown as ShlokaMetadata,
    }));

    // Check for missing data warnings
    let warning: string | undefined;
    const missingTranslation = shlokas.filter(
      (s) => config.includeTranslation && !s.metadata.has_translation
    );
    const missingComments = shlokas.filter(
      (s) => config.includeComments && !s.metadata.has_comments
    );

    if (missingTranslation.length > 0) {
      warning = `${missingTranslation.length}/${shlokas.length} shlokas missing translation`;
    } else if (missingComments.length > 0) {
      warning = `${missingComments.length}/${shlokas.length} shlokas missing comments`;
    }

    return {
      shlokas,
      totalRetrieved: shlokas.length,
      warning,
    };
  } catch (error) {
    console.error('Pinecone query error:', error);
    throw new Error('Failed to retrieve shlokas from Pinecone');
  }
}

/**
 * POST /api/retrieve
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request
    const { question, categoryId, filters } = RetrieveRequestSchema.parse(body);

    console.log('Retrieving context:', { question, categoryId, filters });

    // Generate query embedding
    const embedding = await generateQueryEmbedding(question);

    // Query Pinecone
    const result = await queryPinecone(embedding, categoryId as CategoryId, filters);

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
