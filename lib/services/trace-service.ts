import fs from 'fs';
import path from 'path';
import { TraceData, TraceRepository } from '@/lib/types/trace';

const LOG_DIR = path.join(process.cwd(), 'logs');
const TRACE_FILE = path.join(LOG_DIR, 'traces.jsonl');

import { createPool } from '@vercel/postgres';

export class FileTraceRepository implements TraceRepository {
    constructor() {
        // Ensure log directory exists
        if (!fs.existsSync(LOG_DIR)) {
            fs.mkdirSync(LOG_DIR, { recursive: true });
        }
    }

    async saveTrace(trace: TraceData): Promise<void> {
        const line = JSON.stringify(trace) + '\n';
        await fs.promises.appendFile(TRACE_FILE, line, 'utf-8');
        console.log(`[TraceService] Saved trace ${trace.trace_id} to ${TRACE_FILE}`);
    }
}

export class PostgresTraceRepository implements TraceRepository {
    async saveTrace(trace: TraceData): Promise<void> {
        // Use prefixed env var from "tattva" database, fallback to generic
        const connectionString = process.env.tattva_POSTGRES_URL || process.env.POSTGRES_URL;

        if (!connectionString) {
            console.error('[TraceService] No POSTGRES_URL found, skipping DB save');
            console.log('[TraceService Fallback]', JSON.stringify(trace));
            return;
        }

        // Use createPool for pooled connections (serverless-friendly)
        const pool = createPool({ connectionString });
        try {
            await pool.query(
                `INSERT INTO traces (trace_id, timestamp, data) VALUES ($1, $2, $3::jsonb)`,
                [trace.trace_id, trace.timestamp, JSON.stringify(trace)]
            );
            console.log(`[TraceService] Saved trace ${trace.trace_id} to DB`);
        } catch (error) {
            console.error('[TraceService] DB Save Error:', error);
            // Fallback to console if DB fails
            console.log('[TraceService Fallback]', JSON.stringify(trace));
        } finally {
            await pool.end().catch(() => { });
        }
    }
}

class TraceService {
    private repository: TraceRepository;

    constructor(repository: TraceRepository) {
        this.repository = repository;
    }

    async saveTrace(trace: TraceData): Promise<void> {
        try {
            await this.repository.saveTrace(trace);
        } catch (error) {
            console.error('[TraceService] Failed to save trace:', error);
        }
    }
}

// Factory: Use Postgres in Prod, File in Dev
const isProd = process.env.NODE_ENV === 'production';
export const traceService = new TraceService(
    isProd ? new PostgresTraceRepository() : new FileTraceRepository()
);
