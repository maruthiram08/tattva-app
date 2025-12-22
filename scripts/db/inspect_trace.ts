import { createPool } from '@vercel/postgres';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const TRACE_ID = process.argv[2];

async function main() {
    if (!TRACE_ID) {
        console.error("Usage: npx tsx scripts/db/inspect_trace.ts <trace_id>");
        process.exit(1);
    }

    // Use pooled URL with createPool
    const connectionString = process.env.tattva_POSTGRES_URL;

    if (!connectionString) {
        console.error("❌ No tattva_POSTGRES_URL found in .env.local");
        process.exit(1);
    }

    const pool = createPool({ connectionString });
    try {
        const res = await pool.query(
            'SELECT data FROM traces WHERE trace_id = $1',
            [TRACE_ID]
        );

        if (res.rows.length === 0) {
            console.log("❌ Trace not found:", TRACE_ID);
            return;
        }

        const trace = res.rows[0].data;

        console.log("═══════════════════════════════════════════════════════════════");
        console.log("📋 TRACE INSPECTION REPORT");
        console.log("═══════════════════════════════════════════════════════════════\n");

        console.log("🔍 USER QUERY:", trace.user_query);
        console.log("📅 TIMESTAMP:", trace.timestamp);
        console.log("\n───────────────────────────────────────────────────────────────");
        console.log("📊 CLASSIFICATION:");
        console.log("   Category:", trace.classification_result?.category);
        console.log("   Template:", trace.classification_result?.template_type);
        console.log("   Model:", trace.classification_result?.model);

        console.log("\n───────────────────────────────────────────────────────────────");
        console.log("🔎 RETRIEVAL:");
        console.log("   Expanded Query:", trace.expanded_query);
        console.log("   Documents Retrieved:", trace.retrieval_results?.documents?.length || 0);
        if (trace.retrieval_results?.documents?.length > 0) {
            console.log("\n   Top 3 Retrieved Docs:");
            trace.retrieval_results.documents.slice(0, 3).forEach((doc: any, i: number) => {
                console.log(`   ${i + 1}. [Score: ${doc.score?.toFixed(3)}] ${doc.sarga_name || doc.kanda_name || 'N/A'}`);
                console.log(`      "${doc.text?.substring(0, 100)}..."`);
            });
        }

        console.log("\n───────────────────────────────────────────────────────────────");
        console.log("📝 GENERATION:");
        console.log("   Model:", trace.generation_result?.model);
        console.log("   Tokens:", trace.generation_result?.tokens_used);
        console.log("   Answer (first 500 chars):");
        console.log("   ", trace.full_answer?.substring(0, 500) || "N/A");

        console.log("\n───────────────────────────────────────────────────────────────");
        console.log("⏱️  LATENCY:");
        console.log("   Total:", trace.total_latency_ms, "ms");
        console.log("   Classification:", trace.classification_latency_ms, "ms");
        console.log("   Retrieval:", trace.retrieval_latency_ms, "ms");
        console.log("   Generation:", trace.generation_latency_ms, "ms");

        console.log("\n═══════════════════════════════════════════════════════════════");

        // Also dump raw JSON for full inspection
        console.log("\n📦 RAW TRACE DATA (for deep inspection):");
        console.log(JSON.stringify(trace, null, 2));

    } catch (e) {
        console.error("❌ Query Failed:", e);
    } finally {
        await pool.end();
    }
}

main();
