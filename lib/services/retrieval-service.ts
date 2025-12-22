import OpenAI from 'openai';
import { CohereClient } from 'cohere-ai';
import { getPineconeClient, PINECONE_INDEX_NAME } from '@/lib/pinecone/client';
import { getRetrievalConfig } from '@/lib/config/retrieval-configs';
import { CategoryId } from '@/lib/types/templates';
import { RetrievalResult, RetrievedShloka, ShlokaMetadata } from '@/lib/types/retrieval';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const cohere = process.env.COHERE_API_KEY
    ? new CohereClient({ token: process.env.COHERE_API_KEY })
    : null;

/**
 * Rerank retrieved shlokas using Cohere
 */
async function rerankResults(
    query: string,
    docs: RetrievedShloka[],
    topK: number,
    finalTopK: number
): Promise<RetrievedShloka[]> {
    // If no Cohere key or not enough docs to rerank, return original slice
    if (!cohere || docs.length <= finalTopK) {
        return docs.slice(0, finalTopK);
    }

    try {
        console.log(`✨ Reranking ${docs.length} results to Top ${finalTopK} using Cohere...`);

        // Prepare documents for reranking (Use translation or text)
        const documents = docs.map(d =>
            (d.metadata.translation && d.metadata.translation.length > 20)
                ? d.metadata.translation
                : d.metadata.shloka_text
        );

        const rerank = await cohere.rerank({
            model: 'rerank-english-v3.0',
            query: query,
            documents: documents,
            topN: finalTopK,
        });

        // Map back to original objects
        // rerank.results contains { index, relevanceScore }
        const rankedDocs = rerank.results.map(r => {
            const originalDoc = docs[r.index];
            return {
                ...originalDoc,
                score: r.relevanceScore // Update score with Semantic Relevance
            };
        });

        return rankedDocs;
    } catch (error) {
        console.warn('⚠️ Cohere Reranking failed, falling back to Vector Search:', error);
        return docs.slice(0, finalTopK);
    }
}

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
4. Keep the expansion concise (under 50 words).

CRITICAL - Question Intent Handling (4W1H):
Detect the question type and expand accordingly:
- WHY questions (motivation/reason): Focus on PURPOSE, MOTIVE, DUTY (dharma), LOYALTY, VALUES. Include terms like "reason", "because", "in order to", "motivated by".
- HOW questions (method/process): Focus on ACTIONS, STEPS, MANNER, WEAPONS, TECHNIQUES. Include terms like "by using", "through", "method of".
- WHEN questions (timing/sequence): Focus on TIME, PERIOD, BEFORE/AFTER events, SEQUENCE. Include temporal context.
- WHERE questions (location/place): Focus on LOCATIONS, FORESTS, KINGDOMS, ASHRAMS, SETTINGS.
- WHO questions (identity/character): Focus on CHARACTER IDENTITY, RELATIONSHIPS, LINEAGE, ROLES.
- WHAT questions (events/facts): Focus on EVENTS, ACTIONS, DESCRIPTIONS, FACTS.

Example 1 (WHY):
Input: "Why did Jatayu sacrifice himself?"
Output: "Jatayu's motivation and reason for fighting Ravana. His loyalty and devotion to Rama, his duty (dharma) to protect Sita. The purpose behind his sacrifice despite knowing he would die."

Example 2 (HOW):
Input: "How did Ravana abduct Sita?"
Output: "The method and manner of Ravana's abduction of Sita. The golden deer (Maricha), the deception, the chariot, how Ravana carried Sita away to Lanka."`
                },
                { role: "user", content: question }
            ],
            temperature: 0.1, // Lower temperature for more deterministic facts
            max_tokens: 150,
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
async function generateQueryEmbedding(question: string): Promise<{ embedding: number[], expandedQuery: string }> {
    try {
        // Expand the query first for better semantic match
        const expandedQuery = await expandQuery(question);

        const response = await openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: expandedQuery,
            dimensions: 1536,
        });

        return { embedding: response.data[0].embedding, expandedQuery };
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
    queryText: string, // Added for Reranking
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

    // Determine fetch count (Higher for Reranking)
    // If Cohere is enabled, fetch at least 50 or 2x needed
    const fetchTopK = cohere ? Math.max(50, config.topK * 2) : config.topK;

    console.log('Querying Pinecone:', {
        categoryId,
        configuredTopK: config.topK,
        fetchTopK,
        reranking: !!cohere,
        granularity: config.granularity,
        filter,
    });

    try {
        const queryResponse = await index.query({
            vector: embedding,
            topK: fetchTopK,
            includeMetadata: true,
            filter: Object.keys(filter).length > 0 ? filter : undefined,
        });

        let shlokas: RetrievedShloka[] = queryResponse.matches.map((match) => ({
            id: match.id,
            score: match.score || 0,
            metadata: match.metadata as unknown as ShlokaMetadata,
        }));

        // Apply Reranking
        if (cohere && shlokas.length > 0) {
            shlokas = await rerankResults(queryText, shlokas, fetchTopK, config.topK);
        }

        // Check for missing data warnings on the FINAL set
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
    const { embedding, expandedQuery } = await generateQueryEmbedding(question);

    // Pass expandedQuery for Reranking context
    const result = await queryPinecone(embedding, categoryId, expandedQuery, filters);

    return {
        ...result,
        expandedQuery
    };
}
