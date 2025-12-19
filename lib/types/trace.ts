import { CategoryId } from "./templates";
import { RetrievalResult } from "./retrieval";

export interface TraceData {
    trace_id: string;
    timestamp: string;
    user_query: string;
    session_id?: string;

    // Query Expansion Step
    expanded_query?: string;
    query_expansion_latency_ms?: number;

    // Retrieval Step
    retrieval_results?: RetrievalResult; // Contains shlokas
    retrieval_latency_ms?: number;

    // Classification Step
    classification_result?: {
        model: string;
        category: string;
        category_id: CategoryId;
        confidence: number;
        template_selected: string;
    };
    classification_latency_ms?: number;

    // Generation Step
    generation_result?: {
        model: string;
        template_used: string;
        answer: string;
        citations_in_answer: string[];
    };
    generation_latency_ms?: number;

    // Total
    total_latency_ms?: number;
}

export interface TraceRepository {
    saveTrace(trace: TraceData): Promise<void>;
}
