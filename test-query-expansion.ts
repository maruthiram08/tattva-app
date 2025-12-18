import dotenv from 'dotenv';
import path from 'path';
import { getPineconeClient, PINECONE_INDEX_NAME } from './lib/pinecone/client';
import OpenAI from 'openai';

// Load env
dotenv.config({ path: path.join(__dirname, '.env.local') });

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function getEmbedding(text: string) {
    const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
        dimensions: 1536,
    });
    return response.data[0].embedding;
}

async function testQuery(query: string, label: string) {
    console.log(`\n🔎 Testing: "${query}" (${label})`);
    const embedding = await getEmbedding(query);
    const pinecone = getPineconeClient();
    const index = pinecone.index(PINECONE_INDEX_NAME);

    const results = await index.query({
        vector: embedding,
        topK: 3,
        includeMetadata: true,
    });

    results.matches.forEach((match, i) => {
        const meta = match.metadata as any;
        console.log(`\n  #${i + 1} (Score: ${match.score?.toFixed(4)}) - ${meta.kanda} ${meta.sarga}.${meta.shloka}`);
        console.log(`  Text: ${meta.translation?.substring(0, 100)}...`);
    });
}

async function run() {
    await testQuery('Who is Dadhimukha?', 'Raw Query');
    await testQuery('Who is Dadhimukha (the monkey keeper of the Madhuvana honey garden)?', 'Expanded Query');
}

run().catch(console.error);
