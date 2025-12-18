import OpenAI from 'openai';
import { getPineconeClient, PINECONE_INDEX_NAME } from '@/lib/pinecone/client';
import { getRetrievalConfig } from '@/lib/config/retrieval-configs';
import { CategoryId } from '@/lib/types/templates';
import { RetrievalResult, RetrievedShloka, ShlokaMetadata } from '@/lib/types/retrieval';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate embedding for the question
 */
/**
 * Expand query using LLM to improve retrieval context
 * e.g., "Dadhimukha" -> "Dadhimukha, the monkey guardian of Madhuvana, Sugriva's uncle"
 */
async function expandQuery(question: string): Promise<string> {
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `You are a Valmiki Ramayana retrieval expert. Your goal is to rewrite the user's search query to maximize similarity with the source text (which contains English translations and explanations).

Rules:
1. If the query references a specific identifier (e.g., "Ma Nishada", "Gayatri Mantra", "Aditya Hridayam"), explicitly state what it is and its context.
2. Define proper nouns (characters, places, weapons) with their relationships (e.g., "Dadhimukha -> Sugriva's uncle, keeper of Madhuvana").
3. If the query is a specific Sanskrit phrase, provide its English translation and significance.
4. Keep the expansion concise (under 40 words).

Example 1:
Input: "Ma Nishada"
Output: "Ma Nishada is the first shloka (verse) uttered by Sage Valmiki cursing a hunter (nishada) for killing a krauncha bird. Bala Kanda."

Example 2:
Input: "Dadhimukha"
Output: "Dadhimukha is the monkey guardian of the Madhuvana honey garden and the maternal uncle of Sugriva."`
                },
                { role: "user", content: question }
            ],
            temperature: 0.1, // Lower temperature for more deterministic facts
            max_tokens: 100,
        });

        const expanded = completion.choices[0].message.content || question;
        console.log(`🔍 Query Expansion: "${question}" -> "${expanded}"`);
        return expanded;
    } catch (error) {
        console.warn("Query expansion failed, using original query:", error);
        return question;
    }
}

/**
 * Generate embedding for the question
 */
async function generateQueryEmbedding(question: string): Promise<number[]> {
    try {
        // Expand the query first for better semantic match
        const expandedQuery = await expandQuery(question);

        const response = await openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: expandedQuery,
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
 * Unified retrieval function
 */
export async function retrieveContext(
    question: string,
    categoryId: CategoryId,
    filters?: {
        kanda?: string;
        sarga?: number;
        shloka?: number;
    }
): Promise<RetrievalResult> {
    const embedding = await generateQueryEmbedding(question);
    return await queryPinecone(embedding, categoryId, filters);
}
