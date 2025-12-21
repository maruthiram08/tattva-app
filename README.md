# Tattva - Ramayana Interpreter

A trustworthy Ramayana interpreter that answers ONLY text-grounded questions using Valmiki's Ramayana with explicit citations.

## 🎯 Project Overview

Tattva is a RAG (Retrieval-Augmented Generation) application that provides scholarly answers to questions about Valmiki's Ramayana. It uses a three-step pipeline:

1. **Classification** - Categorizes questions into 45 predefined categories
2. **Retrieval** - Fetches relevant shlokas from Pinecone vector database
3. **Assembly** - Generates answers using locked templates (T1/T2/T3)

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Vector Database**: Pinecone (Serverless)
- **Retrieval Enhancement**: Cohere Reranker (`rerank-english-v3.0`)
- **LLMs**:
  - OpenAI GPT-4o (Question classification, T1 generation, Embeddings)
  - Claude 3 Haiku (Alternative generator)
  - OpenAI text-embedding-3-small (Embeddings)
- **Hosting**: Vercel
- **Dataset**: 23,402 shlokas from Valmiki's Ramayana

## 📋 Prerequisites

- Node.js 18+ and npm
- API keys for:
  - OpenAI
  - Anthropic (Claude)
  - Pinecone
  - Cohere (for Reranking)

## 🏗️ Architecture Pipeline

1. **Classification** - Categorizes questions into 45 predefined categories.
2. **Retrieval** - Fetches top 50 candidates from Pinecone vector database.
3. **Reranking** - Cohere Rerank model re-scores candidates for semantic relevance (Text & Translation).
4. **Assembly** - Generates answers using locked templates (T1/T2/T3).
5. **Verification** - `VerificationService` intercepts responses to ensure structural integrity (e.g., disclaimer injection).

## 🚀 Getting Started

### 1. Clone and Install Dependencies

```bash
cd tattvaapp
npm install
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your API keys:

```env
# OpenAI API Configuration
OPENAI_API_KEY=your_key

# Anthropic API Configuration
ANTHROPIC_API_KEY=your_key

# Pinecone Configuration
PINECONE_API_KEY=your_key
PINECONE_ENVIRONMENT=your_env
PINECONE_INDEX_NAME=tattva-shlokas

# Cohere Configuration (Required for Reranking)
COHERE_API_KEY=your_key

# Vercel Postgres Configuration (For Production Tracing)
POSTGRES_URL=your_postgres_connection_string
POSTGRES_PRISMA_URL=your_postgres_prisma_url
POSTGRES_URL_NON_POOLING=your_postgres_non_pooling_url
POSTGRES_USER=default
POSTGRES_HOST=your_host
POSTGRES_PASSWORD=your_password
POSTGRES_DATABASE=verceldb
```

### 3. Setup Production Database (Optional for Dev, Required for Prod)

If deploying to Vercel, create a Postgres database and run the initialization script to enable trace logging:

1. Create Database in Vercel Storage.
2. Link to Project (`vercel env pull`).
3. Run initialization SQL:
   ```bash
   cat scripts/db/init_traces.sql
   # Execute in Vercel Dashboard Query Runner
   ```

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 🧪 Testing & Evaluation

### Batched Regression Testing
Run the full 60-question Golden Dataset evaluation:

```bash
# Run full evaluation
python3 scripts/batch_evaluate_golden.py

# Run on a random sample of 10 questions (Weekly Monitor)
python3 scripts/batch_evaluate_golden.py --sample 10
```

### Semantic Verification (Prototype)
Check for hallucinations using the NLI-based verifier:

```bash
python3 scripts/verify_semantics.py --input projectupdates/your_results.json
```

## 📦 Project Structure

```
tattvaapp/
├── app/                      # Next.js App Router
├── components/               # React components
├── lib/                      # Utility functions
│   ├── services/             # Core Services (Answer, Retrieval, Verification)
│   ├── pinecone/             # Vector DB Client
│   └── prompts/              # LLM System Prompts
├── scripts/                  # Evaluation & Maintenance Scripts
├── projectdocs/              # Documentation & Architecture
│   ├── launch_complete/      # Final Launch Reports & Baselines
│   └── ...
├── .env.example              # Environment template
└── ...
```

## 🔧 Development Phases

This project follows a 9-phase implementation plan:

- ✅ **Phase 0-4**: Core Pipeline (Completed)
- ✅ **Phase 5**: Frontend UI & UX (Completed)
- ✅ **Phase B+**: Post-Launch Improvements (Completed)
  - **Structural Verification Layer** (Live)
  - **Semantic Verification** (Prototyped)
  - **Retrieval Reranker** (Live)
- 🔜 **Phase C**: Advanced Faithfulness (Future)

See [launch_complete/final_launch_report.md](projectdocs/launch_complete/final_launch_report.md) for detailed release notes.

## 📄 License

This project is for educational and research purposes.

---

**Current Status**: Phase B+ Complete ✅ | Launch Ready 🚀
