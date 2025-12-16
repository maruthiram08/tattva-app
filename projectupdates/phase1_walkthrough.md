# Phase 1: Data Ingestion Pipeline Walkthrough

This document outlines the complete process to reproduce the Phase 1 Data Ingestion for Tattva.

## Prerequisites
-   Node.js & npm installed.
-   `.env.local` configured with:
    -   `OPENAI_API_KEY`
    -   `ANTHROPIC_API_KEY`
    -   `PINECONE_API_KEY`
    -   `PINECONE_INDEX_NAME=tattva-shlokas`

## Pipeline Steps

### 1. Data Validation
Ensures the raw dataset is consistent.
```bash
npm run validate-data
```

### 2. Tag Extraction (Dual-Provider)
Extracts semantic tags (Events, Themes, Characters) using Claude 3.5 Haiku and GPT-4o-mini in parallel.
```bash
npm run extract-tags
```
-   **Output**: `scripts/enhanced-shlokas.json`
-   **Time**: ~40-50 mins

### 3. Embedding Generation
Generates 1536-d vectors using OpenAI `text-embedding-3-small`. Uses JSONL streaming for memory efficiency.
```bash
npm run generate-embeddings
```
-   **Output**: `scripts/vectors.jsonl`
-   **Time**: ~30 mins

### 4. Pinecone Upload
Uploads vectors to the Pinecone vector database. Handles index creation and batching.
```bash
npm run cleanup-pinecone  # Optional: Deletes existing index
npm run upload-pinecone
```
-   **Time**: ~20 mins

## Verification
You can verify the data in your Pinecone Console:
-   **Index Name**: `tattva-shlokas`
-   **Record Count**: 23,402
-   **Dimension**: 1536
-   **Metric**: Cosine
