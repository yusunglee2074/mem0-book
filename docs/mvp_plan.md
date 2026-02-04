# MVP Plan — Mem0-Style Book Learning Workspace (Single-User, Korean, Supabase Free Tier)

## Summary
Build a single-user web app that ingests books via text paste or EPUB upload, extracts dense memories + learner state, and powers five required screens (Reader+Q&A, Memory Inspector, Artifact Library, Concept Graph, 나의 지식). Stack: Next.js (App Router) + Node API routes, Redis + BullMQ for async, Supabase Postgres + pgvector for all structured text/metadata, Supabase Storage for EPUB files, Python worker for EPUB parsing, LLM/embeddings via LiteLLM endpoint. Auth: Supabase email auth. Hosted on home Ubuntu server.

---

## Architecture Overview

### Services (single repo)
- Next.js app: UI + API routes.
- Node worker: BullMQ worker for ingestion/memory/summaries/artifacts.
- Python worker: EPUB parser; processes EPUB -> structured text; returns sections + chunks.
- Supabase Postgres (pgvector): all parsed text + metadata (no binary files).
- Supabase Storage: EPUB file storage (private bucket).
- Redis: BullMQ queue.
- Supabase Auth (hosted): email/password auth, JWT verification in Next.js.

### Deployment (Ubuntu home server)
- docker-compose for: web, worker, python-worker, redis.
- Supabase (DB + Storage + Auth) hosted, free tier.

---

## Product Requirements (locked)

### MVP Screens (all required)
1) Reader + Q&A
2) Memory Inspector
3) Artifact Library
4) Concept Graph
5) 나의 지식 (전역 코어)

### Ingestion
- Text paste: manual section mapping or TOC matching.
- EPUB upload: file stored in Supabase Storage; Python worker parses.

### Memory
- Dense memory (Mem0 style)
- Learner state memory in v1
- Personal Knowledge Core (전역 통합 지식층) in v1

### Language
- Korean only (UI + prompts)

### Auth
- Supabase email auth

### Storage constraints (Supabase free tier)
- DB size: 500 MB
- Storage: 1 GB, 50 MB max file size
- Adjusted design: only parsed text in DB; EPUB files in Storage.

---

## Detailed Implementation Plan

### 1) Data Model (Supabase Postgres + pgvector)

#### Core tables
- books
  - id, title, author, language, created_at, updated_at
- sections
  - id, book_id, parent_id, title, order_index, depth, toc_path
- chunks
  - id, book_id, section_id, chunk_index, text, start_offset, end_offset, hash, created_at
- summaries
  - id, book_id, section_id (nullable for global), summary_text, version, updated_at
- memories
  - id, book_id, section_id (nullable), type, canonical_text, importance, confidence, status, promoted_to_core, created_at, updated_at, embedding
- memory_sources
  - memory_id, chunk_id, start_offset, end_offset
- memory_revisions
  - id, memory_id, operation, old_text, new_text, reason, created_at

#### Learner state
- learner_profiles
  - id, user_id, book_id, goal, reading_mode
- learner_events
  - id, user_id, book_id, type, payload_json, created_at
- learner_memories
  - id, user_id, book_id, type, canonical_text, importance, confidence, created_at

#### Graph (in Postgres)
- graph_nodes
  - id, book_id, label, node_type, embedding, created_at
- graph_edges
  - id, book_id, source_node_id, target_node_id, relation, confidence, status, created_at

#### Artifacts
- artifacts
  - id, book_id, user_id, scope, artifact_type, title, content_md, inputs_json, created_at, updated_at

#### Book file tracking
- book_files
  - id, book_id, bucket, path, filename, size_bytes, sha256, uploaded_at, parse_status

#### Personal Knowledge Core
- core_knowledge
  - id, user_id, title, canonical_text, importance, confidence, status, created_at, updated_at
- core_sources
  - core_id, memory_id, book_id, rationale
- core_edges
  - id, user_id, source_core_id, target_core_id, relation, confidence, status, created_at
- core_artifacts
  - id, user_id, title, artifact_type, content_md, inputs_json, created_at, updated_at

---

### 2) Supabase Storage Design
- Bucket: book-epubs (private)
- Upload flow:
  - Client uploads via Supabase Storage SDK (auth required)
  - Server generates signed URL for Python worker to download
- Server/worker uses service role key (never exposed to client).

---

### 3) API Routes (Next.js App Router)

#### Ingestion
- POST /api/books
- POST /api/books/:id/toc
- POST /api/books/:id/ingest/text
- POST /api/books/:id/ingest/epub
  - store file ref in book_files
  - enqueue epub_parse

#### Retrieval & Q&A
- POST /api/books/:id/ask
  - Inputs: question, mode (Explain/Connect/Apply/Quiz)
  - Output: answer + citations + confidence + memory IDs

#### Memory
- GET /api/books/:id/memories
- PATCH /api/memories/:id (edit/pin/deprecate)

#### Artifacts
- GET /api/books/:id/artifacts
- POST /api/books/:id/artifacts

#### Graph
- GET /api/books/:id/graph

#### Core (전역 지식)
- GET /api/core
- POST /api/core/promote
- POST /api/core/ask
- GET /api/core/:id

---

### 4) Job System (BullMQ + Redis)

#### Queues
- ingest
- extract_memories
- update_memories
- summaries
- graph
- artifacts
- epub_parse (Python worker)

#### Flow (text ingestion)
1. ingest: store chunks -> enqueue extract
2. extract_memories: LLM extracts candidates
3. update_memories: embeddings search + ADD/UPDATE/DELETE/NOOP
4. summaries: async section + book summary refresh
5. graph: entity/edge extraction + conflict resolution

#### EPUB ingestion
- Node enqueues epub_parse
- Python downloads via signed URL, parses, returns sections + text
- Node stores and continues ingestion flow

---

### 5) LLM + Embeddings (LiteLLM)

#### Environment
- LITELLM_BASE_URL
- LITELLM_API_KEY
- LLM_MODEL
- EMBED_MODEL

#### Prompting (Korean)
- Extractor prompt returns structured JSON:
  - memories[] with type, canonical_text, importance, confidence, source_span
- Updater prompt:
  - inputs: candidate + top-s similar memories
  - output: operation + merged_text

---

### 6) UI Screens (Korean)

1. Reader + Q&A
   - TOC navigator, reader, Q&A panel with modes
   - Inline highlights -> explain/connect/apply

2. Memory Inspector
   - Filtered list with edit/pin/deprecate
   - Source excerpt view

3. Artifact Library
   - List of artifacts (checklists, decision guides, etc.)
   - Markdown viewer + export

4. Concept Graph
5. 나의 지식 (전역 코어)
5. 나의 지식 (전역 코어 지식 탭)
   - Graph visualization
   - Node details with sources + linked memories

---

### 7) Supabase pgvector (SQL)
```sql
create extension if not exists vector with schema extensions;

alter table memories
  add column embedding extensions.vector(1536);

-- add to graph_nodes if needed
alter table graph_nodes
  add column embedding extensions.vector(1536);
```

---

### 8) Test Cases / Acceptance Scenarios

#### Ingestion
- Paste text -> sections/chunks created -> memory extraction jobs run.
- Upload EPUB -> file stored -> Python parses -> chunks stored.

#### Memory
- Extractor produces atomic memories.
- Update logic merges duplicates.

#### Retrieval
- Q&A returns grounded answer with citations.
- Graph queries work for "how are these related?"

#### Learner state
- Events recorded.
- Artifacts use learner state.

#### UI
- All four screens render.
- Memory edits persist.

---

## Important API / Schema Changes
- New book_files table for EPUBs.
- Storage bucket integration with signed URLs.
- pgvector extension enabled.

---

## Assumptions / Defaults
- Supabase free tier limits apply (500 MB DB, 1 GB storage, 50 MB file size).
- Korean-only UI + prompts.
- Chunk size: 800-1200 tokens.
- Redis + BullMQ for async jobs.
