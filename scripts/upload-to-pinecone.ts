/**
 * Pinecone Upload Script
 * Creates index and uploads all vectors with enhanced metadata
 */

import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import {
  getPineconeClient,
  PINECONE_INDEX_NAME,
  EMBEDDING_DIMENSION,
} from '../lib/pinecone/client';

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

interface VectorData {
  id: string;
  values: number[];
  metadata: Record<string, any>;
}


async function uploadToPinecone(): Promise<void> {
  console.log('📤 Starting Pinecone upload (Streaming Mode)...\n');

  // Initialize Pinecone client
  const pinecone = getPineconeClient();
  console.log('✅ Pinecone client initialized\n');

  // Load vectors
  const vectorsPath = path.join(__dirname, 'vectors.jsonl');

  if (!fs.existsSync(vectorsPath)) {
    throw new Error(`Vectors not found at ${vectorsPath}. Run generate-embeddings.ts first!`);
  }

  // Check if index exists
  const indexes = await pinecone.listIndexes();
  const indexExists = indexes.indexes?.some((idx) => idx.name === PINECONE_INDEX_NAME);

  if (!indexExists) {
    console.log(`🔨 Creating new index: ${PINECONE_INDEX_NAME}`);
    await pinecone.createIndex({
      name: PINECONE_INDEX_NAME,
      dimension: EMBEDDING_DIMENSION,
      metric: 'cosine',
      spec: {
        serverless: {
          cloud: 'aws',
          region: 'us-east-1',
        },
      },
    });
    console.log('✅ Index created successfully');
    console.log('⏳ Waiting 60 seconds for index to initialize...\n');
    await new Promise((resolve) => setTimeout(resolve, 60000));
  } else {
    console.log(`ℹ️  Index "${PINECONE_INDEX_NAME}" already exists\n`);
  }

  const index = pinecone.index(PINECONE_INDEX_NAME);

  // Streaming Upload
  const fileStream = fs.createReadStream(vectorsPath);
  const rl = require('readline').createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let batch: VectorData[] = [];
  const BATCH_SIZE = 100;
  let totalUploaded = 0;
  let batchCount = 0;

  console.log('🚀 Starting uploads...');

  for await (const line of rl) {
    if (line.trim()) {
      try {
        const vector = JSON.parse(line);

        // Helper to sanitize metadata (Pinecone rejects null)
        Object.keys(vector.metadata).forEach(key => {
          if (vector.metadata[key] === null) {
            vector.metadata[key] = "";
          }
        });

        batch.push(vector);
      } catch (e) {
        console.warn('Skipping invalid JSON line');
      }
    }

    if (batch.length >= BATCH_SIZE) {
      batchCount++;
      await index.upsert(batch);
      totalUploaded += batch.length;
      console.log(`   Uploaded batch ${batchCount} (${totalUploaded.toLocaleString()} vectors)`);
      batch = [];
      await new Promise(r => setTimeout(r, 200)); // Mild rate limiting
    }
  }

  // Final batch
  if (batch.length > 0) {
    batchCount++;
    await index.upsert(batch);
    totalUploaded += batch.length;
    console.log(`   Uploaded final batch ${batchCount} (${totalUploaded.toLocaleString()} vectors)`);
  }

  console.log('\n🔍 Verifying upload...');
  const stats = await index.describeIndexStats();
  console.log(`\n📊 Index Statistics:`);
  console.log(`   Total vectors: ${stats.totalRecordCount?.toLocaleString()}`);
  console.log(`   Dimension: ${stats.dimension}`);

  if (stats.totalRecordCount !== totalUploaded) {
    console.log(`\n⚠️  Warning: Uploaded ${totalUploaded} vectors, but index has ${stats.totalRecordCount} (Might need time to sync)`);
  } else {
    console.log('\n✅ All vectors uploaded successfully!');
  }
}

uploadToPinecone()
  .then(() => {
    console.log('\n🎉 Upload complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
