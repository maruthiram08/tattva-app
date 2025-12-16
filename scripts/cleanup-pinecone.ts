/**
 * Pinecone Cleanup Script
 * Deletes existing Pinecone index to start fresh
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { getPineconeClient, PINECONE_INDEX_NAME } from '../lib/pinecone/client';

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

async function cleanupPinecone() {
  console.log('🧹 Starting Pinecone cleanup...\n');

  try {
    const pinecone = getPineconeClient();

    // List all indexes
    const indexes = await pinecone.listIndexes();
    console.log(`📋 Found ${indexes.indexes?.length || 0} existing indexes`);

    // Check if our index exists
    const indexExists = indexes.indexes?.some((idx) => idx.name === PINECONE_INDEX_NAME);

    if (indexExists) {
      console.log(`\n🗑️  Deleting index: ${PINECONE_INDEX_NAME}`);
      await pinecone.deleteIndex(PINECONE_INDEX_NAME);
      console.log(`✅ Index "${PINECONE_INDEX_NAME}" deleted successfully`);

      // Wait a bit for deletion to propagate
      console.log('⏳ Waiting 10 seconds for deletion to propagate...');
      await new Promise((resolve) => setTimeout(resolve, 10000));
    } else {
      console.log(`\n ℹ️  Index "${PINECONE_INDEX_NAME}" does not exist - nothing to clean`);
    }

    console.log('\n✅ Cleanup complete! Ready for fresh ingestion.');
  } catch (error) {
    console.error('\n❌ Cleanup failed:', error);
    throw error;
  }
}

// Run cleanup
cleanupPinecone()
  .then(() => {
    console.log('\n🎉 Pinecone is clean and ready!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
