import { createClient } from '@vercel/postgres';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function main() {
    console.log("🚀 Starting Database Migration...");

    // Debug: Print loaded keys
    const keys = Object.keys(process.env).filter(k => k.includes('DB') || k.includes('URL') || k.includes('POSTGRES'));
    console.log("🔍 Available Env Keys:", keys);

    // Candidates to try (Priority order - including prefixed vars from "tattva" database)
    const candidates = [
        'tattva_POSTGRES_URL_NON_POOLING',
        'tattva_DATABASE_URL_UNPOOLED',
        'tattva_POSTGRES_URL',
        'tattva_DATABASE_URL',
        'DIRECT_URL',
        'POSTGRES_URL_NON_POOLING',
        'VERCEL_POSTGRES_URL',
        'DATABASE_URL',
        'POSTGRES_URL',
        'PRISMA_DATABASE_URL',
    ];

    const sqlPath = path.join(process.cwd(), 'scripts/db/init_traces.sql');
    if (!fs.existsSync(sqlPath)) {
        console.error("❌ Migration file not found:", sqlPath);
        process.exit(1);
    }
    const query = fs.readFileSync(sqlPath, 'utf8');

    let success = false;
    let lastError: any;

    // Try each candidate
    for (const envVar of candidates) {
        if (!process.env[envVar]) continue;

        const connectionString = process.env[envVar] as string;
        // Skip if seemingly empty/short
        if (connectionString.length < 10) continue;

        // Mask for log
        const masked = connectionString.substring(0, 11) + '...';
        console.log(`\n🔄 Attempting connection using [${envVar}]: ${masked}`);

        const client = createClient({ connectionString });
        try {
            await client.connect();
            console.log(`✅ Connected successfully using ${envVar}!`);

            console.log("📝 executing SQL...");
            await client.query(query);
            console.log("✅ Migration executed successfully!");

            await client.end();
            success = true;
            break; // Stop after success
        } catch (e: any) {
            console.warn(`⚠️ Failed with ${envVar}: ${e.message}`);
            lastError = e;
            await client.end().catch(() => { });
        }
    }

    if (!success) {
        console.error("\n❌ All connection attempts failed.");
        if (lastError) console.error("Last Error:", lastError);
        console.error("👉 Please export DIRECT_URL='postgres://...' manually if env vars are incorrect.");
        process.exit(1);
    }
}

main();
