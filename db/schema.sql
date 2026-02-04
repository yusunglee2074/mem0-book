-- Schema for Mem0 Book (Supabase Postgres)
-- Keep this file as the source of truth for initial setup.

create extension if not exists "pgcrypto" with schema extensions;
create extension if not exists "vector" with schema extensions;

create table if not exists books (
  id uuid primary key default extensions.gen_random_uuid(),
  title text not null,
  author text,
  language text not null default 'ko',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists sections (
  id uuid primary key default extensions.gen_random_uuid(),
  book_id uuid not null references books(id) on delete cascade,
  parent_id uuid references sections(id) on delete set null,
  title text not null,
  order_index int not null,
  depth int not null default 0,
  toc_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists chunks (
  id uuid primary key default extensions.gen_random_uuid(),
  book_id uuid not null references books(id) on delete cascade,
  section_id uuid not null references sections(id) on delete cascade,
  chunk_index int not null,
  text text not null,
  start_offset int,
  end_offset int,
  hash text,
  created_at timestamptz not null default now()
);

create table if not exists summaries (
  id uuid primary key default extensions.gen_random_uuid(),
  book_id uuid not null references books(id) on delete cascade,
  section_id uuid references sections(id) on delete cascade,
  summary_text text not null,
  version int not null default 1,
  updated_at timestamptz not null default now()
);

create table if not exists memories (
  id uuid primary key default extensions.gen_random_uuid(),
  book_id uuid not null references books(id) on delete cascade,
  section_id uuid references sections(id) on delete set null,
  type text not null,
  canonical_text text not null,
  importance real,
  confidence real,
  status text not null default 'active',
  promoted_to_core boolean not null default false,
  embedding extensions.vector(1536),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (importance is null or (importance >= 0 and importance <= 1)),
  check (confidence is null or (confidence >= 0 and confidence <= 1))
);

create table if not exists memory_sources (
  memory_id uuid not null references memories(id) on delete cascade,
  chunk_id uuid not null references chunks(id) on delete cascade,
  start_offset int,
  end_offset int,
  primary key (memory_id, chunk_id)
);

create table if not exists memory_revisions (
  id uuid primary key default extensions.gen_random_uuid(),
  memory_id uuid not null references memories(id) on delete cascade,
  operation text not null,
  old_text text,
  new_text text,
  reason text,
  created_at timestamptz not null default now()
);

create table if not exists learner_profiles (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  book_id uuid not null references books(id) on delete cascade,
  goal text,
  reading_mode text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists learner_events (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  book_id uuid not null references books(id) on delete cascade,
  type text not null,
  payload_json jsonb,
  created_at timestamptz not null default now()
);

create table if not exists learner_memories (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  book_id uuid not null references books(id) on delete cascade,
  type text not null,
  canonical_text text not null,
  importance real,
  confidence real,
  created_at timestamptz not null default now(),
  check (importance is null or (importance >= 0 and importance <= 1)),
  check (confidence is null or (confidence >= 0 and confidence <= 1))
);

create table if not exists graph_nodes (
  id uuid primary key default extensions.gen_random_uuid(),
  book_id uuid not null references books(id) on delete cascade,
  label text not null,
  node_type text,
  embedding extensions.vector(1536),
  created_at timestamptz not null default now()
);

create table if not exists graph_edges (
  id uuid primary key default extensions.gen_random_uuid(),
  book_id uuid not null references books(id) on delete cascade,
  source_node_id uuid not null references graph_nodes(id) on delete cascade,
  target_node_id uuid not null references graph_nodes(id) on delete cascade,
  relation text not null,
  confidence real,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  check (confidence is null or (confidence >= 0 and confidence <= 1))
);

create table if not exists artifacts (
  id uuid primary key default extensions.gen_random_uuid(),
  book_id uuid not null references books(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  scope text not null default 'book',
  artifact_type text not null,
  title text not null,
  content_md text not null,
  inputs_json jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists book_files (
  id uuid primary key default extensions.gen_random_uuid(),
  book_id uuid not null references books(id) on delete cascade,
  bucket text not null,
  path text not null,
  filename text not null,
  size_bytes bigint,
  sha256 text,
  uploaded_at timestamptz not null default now(),
  parse_status text not null default 'pending'
);

create table if not exists core_knowledge (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  canonical_text text not null,
  importance real,
  confidence real,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (importance is null or (importance >= 0 and importance <= 1)),
  check (confidence is null or (confidence >= 0 and confidence <= 1))
);

create table if not exists core_sources (
  core_id uuid not null references core_knowledge(id) on delete cascade,
  memory_id uuid not null references memories(id) on delete cascade,
  book_id uuid not null references books(id) on delete cascade,
  rationale text,
  primary key (core_id, memory_id)
);

create table if not exists core_edges (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_core_id uuid not null references core_knowledge(id) on delete cascade,
  target_core_id uuid not null references core_knowledge(id) on delete cascade,
  relation text not null,
  confidence real,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  check (confidence is null or (confidence >= 0 and confidence <= 1))
);

create table if not exists core_artifacts (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  artifact_type text not null,
  content_md text not null,
  inputs_json jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sections_book_order_idx on sections (book_id, order_index);
create index if not exists chunks_section_idx on chunks (section_id, chunk_index);
create index if not exists chunks_book_idx on chunks (book_id);
create index if not exists memories_book_idx on memories (book_id);
create index if not exists memories_section_idx on memories (section_id);
create index if not exists learner_events_user_idx on learner_events (user_id, created_at);
create index if not exists graph_nodes_book_idx on graph_nodes (book_id);
create index if not exists graph_edges_book_idx on graph_edges (book_id);
create index if not exists core_knowledge_user_idx on core_knowledge (user_id);
create index if not exists core_sources_core_idx on core_sources (core_id);
create index if not exists core_edges_user_idx on core_edges (user_id);

-- Optional vector indexes (tune for your embedding model and data size)
create index if not exists memories_embedding_hnsw on memories
  using hnsw (embedding extensions.vector_cosine_ops);

create index if not exists graph_nodes_embedding_hnsw on graph_nodes
  using hnsw (embedding extensions.vector_cosine_ops);
