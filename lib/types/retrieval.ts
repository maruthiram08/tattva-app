/**
 * Retrieval Type Definitions
 */

export interface ShlokaMetadata {
  kanda: string;
  kanda_number: number;
  sarga: number;
  shloka: number;
  shloka_text: string;
  explanation: string;
  translation: string | null;
  comments: string | null;
  has_translation: boolean;
  has_explanation: boolean;
  has_comments: boolean;
  characters: string[];
  events: string[];
  themes: string[];
}

export interface RetrievedShloka {
  id: string;
  score: number; // Similarity score from Pinecone
  metadata: ShlokaMetadata;
}

export interface RetrievalResult {
  shlokas: RetrievedShloka[];
  totalRetrieved: number;
  warning?: string; // e.g., "Some shlokas missing translations"
  expandedQuery?: string;
}
