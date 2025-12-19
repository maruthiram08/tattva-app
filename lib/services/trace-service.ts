import fs from 'fs';
import path from 'path';
import { TraceData, TraceRepository } from '@/lib/types/trace';

const LOG_DIR = path.join(process.cwd(), 'logs');
const TRACE_FILE = path.join(LOG_DIR, 'traces.jsonl');

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

// Placeholder for Postgres implementation
// export class PostgresTraceRepository implements TraceRepository { ... }

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
            // Non-blocking error handling - don't crash the user request
        }
    }
}

// Singleton Trace Service
// In production, we can swap this with new PostgresTraceRepository()
export const traceService = new TraceService(new FileTraceRepository());
