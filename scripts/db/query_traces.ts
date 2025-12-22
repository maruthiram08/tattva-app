import { createClient } from '@vercel/postgres';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function main() {
    const connectionString = process.env.tattva_POSTGRES_URL_NON_POOLING || process.env.tattva_POSTGRES_URL;

    if (!connectionString) {
        console.error("❌ No tattva_POSTGRES_URL found in .env.local");
        process.exit(1);
    }

    const client = createClient({ connectionString });
    try {
        await client.connect();
        console.log("✅ Connected to production DB\n");

        // Get count
        const countRes = await client.query('SELECT COUNT(*) FROM traces');
        console.log(`📊 Total traces: ${countRes.rows[0].count}\n`);

        // Get recent traces
        const res = await client.query(`
            SELECT 
                trace_id,
                timestamp,
                data->>'user_query' as query,
                data->'classification_result'->>'category' as category
            FROM traces 
            ORDER BY timestamp DESC 
            LIMIT 10
        `);

        if (res.rows.length === 0) {
            console.log("ℹ️  No traces found yet. Make a query on the production app to generate traces.");
        } else {
            console.log("📋 Latest 10 Traces:\n");
            res.rows.forEach((row, i) => {
                console.log(`${i + 1}. [${row.timestamp}]`);
                console.log(`   Query: ${row.query?.substring(0, 80)}${row.query?.length > 80 ? '...' : ''}`);
                console.log(`   Category: ${row.category || 'N/A'}`);
                console.log(`   ID: ${row.trace_id}\n`);
            });
        }
    } catch (e) {
        console.error("❌ Query Failed:", e);
    } finally {
        await client.end();
    }
}

main();
