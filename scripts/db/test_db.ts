import { sql } from '@vercel/postgres';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function main() {
    const url = process.env.POSTGRES_URL || '';
    // Mask URL in logs
    const maskedUrl = url.length > 15 ? `${url.substring(0, 11)}...` : 'EMPTY';
    console.log(`URL format check: Length=${url.length}, StartsWith=${maskedUrl}`);

    if (!url.startsWith('postgres://') && !url.startsWith('postgresql://')) {
        console.error("❌ Invalid Protocol! Must start with postgres:// or postgresql://");
    }

    console.log("Testing DB Connection...");
    try {
        const result = await sql`SELECT NOW()`;
        console.log("✅ DB Connected! Server Time:", result.rows[0].now);

        // Check if traces table exists
        const tableCheck = await sql`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'traces'
            );
        `;
        const exists = tableCheck.rows[0].exists;
        if (exists) {
            console.log("✅ 'traces' table exists.");
        } else {
            console.log("⚠️ 'traces' table DOES NOT exist.");
            console.log("   Please run scripts/db/init_traces.sql");
        }
    } catch (error: any) {
        console.error("❌ DB Connection Failed:", error);
        console.error("   Details:", error.message);
    }
}

main();
