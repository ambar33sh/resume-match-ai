# ResumeMatch AI

**AI-Powered Resume Screening & Job Matching System**

ResumeMatch AI compares a candidate resume with a target job description and produces an explainable fit score, skill matches, skill gaps, strengths, and recommendations.

## Why this project

This is designed as an AI engineering project rather than a keyword-only resume classifier. The pipeline combines PDF document extraction, semantic embeddings, deterministic skill coverage, explainable weighted scoring, and an LLM assessment layer.

## Architecture

```text
Resume PDF ──> PDF text extraction ──> Resume text ──┐
                                                     ├──> Embeddings ──> Semantic similarity
Job description ─────────────────────────────────────┘
        │
        └──> Skill detection ──> matched / missing skills

Semantic similarity + skill coverage + experience fit + education fit
                              │
                              ▼
                     Explainable fit score
                              │
                              ▼
                    LLM strengths / gaps / advice
```

## Features

- PDF resume upload with server-side text extraction
- Semantic similarity using OpenAI `text-embedding-3-small`
- Skill coverage analysis across common software/AI skills
- Explainable 0–100 match score
- Score breakdown for semantic similarity, skills, experience and education
- LLM-generated strengths, gaps and recommendations
- Graceful local fallback when `OPENAI_API_KEY` is not configured
- Responsive, portfolio-ready Next.js interface

## Stack

- Next.js + React + TypeScript
- OpenAI Embeddings API
- OpenAI Chat Completions API for structured assessment
- `pdf-parse` for PDF extraction
- Lucide React
- Deployable to Vercel

## Run locally

```bash
npm install
cp .env.example .env.local
# add OPENAI_API_KEY to .env.local
npm run dev
```

Open `http://localhost:3000`.

Without an API key, the application uses deterministic lexical matching so the interface can still be tested. Production-quality semantic and LLM analysis requires the API key.

## Deployment

Create a Vercel project from this repository and add `OPENAI_API_KEY` under Project Settings → Environment Variables. Then deploy.

## Engineering notes

The score is intentionally decomposed instead of presenting an opaque single similarity number. The current weighting is:

- Semantic similarity: 35%
- Skill coverage: 35%
- Experience fit: 20%
- Education fit: 10%

This makes the output easier to inspect and discuss in an interview. The LLM is instructed not to invent candidate facts and is used for qualitative assessment rather than silently controlling the numeric score.

## Next improvements

- Replace the static skill taxonomy with an ontology and aliases
- Add hybrid BM25 + vector retrieval for large job libraries
- Persist analyses and candidate history
- Add evaluation dataset and precision/recall metrics
- Add OCR for scanned resumes
- Add authentication and rate limiting
