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
- **LLMs**:
  - OpenAI GPT-4 (Question classification)
  - Claude 3.5 Sonnet (Answer assembly)
  - OpenAI text-embedding-3-large (Embeddings)
- **Hosting**: Vercel
- **Dataset**: 23,402 shlokas from Valmiki's Ramayana

## 📋 Prerequisites

- Node.js 18+ and npm
- API keys for:
  - OpenAI
  - Anthropic (Claude)
  - Pinecone

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
OPENAI_API_KEY=your_openai_api_key_here

# Anthropic API Configuration
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Pinecone Configuration
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_ENVIRONMENT=your_pinecone_environment_here
PINECONE_INDEX_NAME=tattva-shlokas
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 📦 Project Structure

```
tattvaapp/
├── app/                      # Next.js App Router
│   ├── api/                 # API routes
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Landing page
│   └── globals.css          # Global styles
├── components/              # React components
│   └── ui/                 # shadcn/ui components
├── lib/                     # Utility functions
│   └── utils.ts            # Helper functions
├── Valmiki_Ramayan_Dataset/ # Source data (23,402 shlokas)
├── projectdocs/             # Documentation
│   ├── PRD.md              # Product Requirements
│   ├── IMPLEMENTATION_PLAN.md
│   └── prompt.md
├── .env.example             # Environment template
├── next.config.js           # Next.js config
├── tailwind.config.ts       # Tailwind config
└── tsconfig.json            # TypeScript config
```

## 🔧 Development Phases

This project follows a 9-phase implementation plan:

- ✅ **Phase 0**: Project Setup (COMPLETED)
- ⏳ **Phase 1**: Data Ingestion & Vector Database (NEXT)
- 🔜 **Phase 2**: Category Routing & Template Engine
- 🔜 **Phase 3**: Retrieval Pipeline
- 🔜 **Phase 4**: Answer Assembly Engine
- ✅ **Phase 5**: Frontend UI & UX (COMPLETED)
  - Home Page UX Refinements (Spacing, Typography, Animations)
  - Typewriter Effect for Search
  - Mobile Navigation Enhancements
  - Explorer Page Layout
- 🔜 **Phase 6**: Evaluation System
- 🔜 **Phase 7**: Integration, Testing & Optimization
- 🔜 **Phase 8**: Deployment & Launch

See [IMPLEMENTATION_PLAN.md](projectdocs/IMPLEMENTATION_PLAN.md) for detailed roadmap.

## 🚀 Deploying to Vercel

### Option 1: Deploy via Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```

4. **Add Environment Variables**:
   ```bash
   vercel env add OPENAI_API_KEY
   vercel env add ANTHROPIC_API_KEY
   vercel env add PINECONE_API_KEY
   vercel env add PINECONE_ENVIRONMENT
   vercel env add PINECONE_INDEX_NAME
   ```

5. **Deploy to Production**:
   ```bash
   vercel --prod
   ```

### Option 2: Deploy via Vercel Dashboard

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Phase 0 complete"
   git branch -M main
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Import to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Configure environment variables in the dashboard
   - Click "Deploy"

3. **Environment Variables to Add**:
   - `OPENAI_API_KEY`
   - `ANTHROPIC_API_KEY`
   - `PINECONE_API_KEY`
   - `PINECONE_ENVIRONMENT`
   - `PINECONE_INDEX_NAME`

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🔑 API Keys Setup

### OpenAI API Key
1. Visit [platform.openai.com](https://platform.openai.com/)
2. Go to API Keys section
3. Create new secret key
4. Add to `.env.local`

### Anthropic API Key
1. Visit [console.anthropic.com](https://console.anthropic.com/)
2. Go to API Keys section
3. Create new key
4. Add to `.env.local`

### Pinecone API Key
1. Visit [app.pinecone.io](https://app.pinecone.io/)
2. Create a new project (free tier)
3. Get API key from "API Keys" section
4. Create a serverless index named `tattva-shlokas`
5. Add credentials to `.env.local`

## 📚 Documentation

- [Product Requirements Document (PRD)](projectdocs/PRD.md)
- [Implementation Plan](projectdocs/IMPLEMENTATION_PLAN.md)
- [Next.js Documentation](https://nextjs.org/docs)
- [Pinecone Documentation](https://docs.pinecone.io/)

## 🔒 Security Notes

- Never commit `.env.local` or `.env` files
- Keep API keys secure and rotate them regularly
- Use environment variables for all sensitive data
- Enable CORS and rate limiting before production deployment

## 📄 License

This project is for educational and research purposes.

---

**Current Status**: Phase 5 Complete ✅ | Next: Evaluation System
