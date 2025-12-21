import { CohereClient } from 'cohere-ai';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function main() {
    const apiKey = process.env.COHERE_API_KEY;
    if (!apiKey) {
        console.error("❌ COHERE_API_KEY not found in .env.local");
        process.exit(1);
    }
    console.log("✅ Found COHERE_API_KEY:", apiKey.substring(0, 5) + "...");

    const cohere = new CohereClient({ token: apiKey });

    const query = "Who burned Lanka?";
    const documents = [
        "Hanuman entered Lanka and looked for Sita.",
        "Ravana was the king of Lanka.",
        "Hanuman set fire to Lanka with his tail.",
        "Rama built a bridge to Lanka."
    ];

    console.log("\nQuery:", query);
    console.log("Docs:", documents);

    try {
        console.log("Calling Cohere Rerank...");
        const rerank = await cohere.rerank({
            model: 'rerank-english-v3.0',
            query: query,
            documents: documents,
            topN: 3,
        });

        console.log("\nResults:");
        rerank.results.forEach((r, i) => {
            console.log(`Rank ${i + 1}: Score ${r.relevanceScore.toFixed(3)} - "${documents[r.index]}"`);
        });

        console.log("\n✅ Cohere Test PASSED");
    } catch (error) {
        console.error("❌ Cohere Test FAILED:", error);
    }
}

main();
