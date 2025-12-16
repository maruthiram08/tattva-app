/**
 * Pinecone Client Helper
 * Manages connection to Pinecone vector database
 */

import { Pinecone } from '@pinecone-database/pinecone';

let pineconeClient: Pinecone | null = null;

export function getPineconeClient(): Pinecone {
  if (pineconeClient) {
    return pineconeClient;
  }

  const apiKey = process.env.PINECONE_API_KEY;

  if (!apiKey) {
    throw new Error('PINECONE_API_KEY environment variable is not set');
  }

  pineconeClient = new Pinecone({
    apiKey,
  });

  return pineconeClient;
}

export const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME || 'tattva-shlokas';
export const EMBEDDING_DIMENSION = 1536; // text-embedding-3-small
