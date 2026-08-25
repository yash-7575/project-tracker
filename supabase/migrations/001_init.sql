create extension if not exists "uuid-ossp";

-- Pages (supports infinite nesting via parent_page_id)
create table pages (
  id uuid primary key default uuid_generate_v4(),
  parent_page_id uuid references pages(id) on delete cascade,
  title text not null default 'Untitled',
  icon text,
  cover_image text,
  content jsonb not null default '{}'::jsonb, -- Tiptap JSON document
  position integer not null default 0,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_pages_parent_page_id on pages(parent_page_id);
create index idx_pages_position on pages(position);

-- Attachments (images, PDFs, files uploaded into a page)
create table attachments (
  id uuid primary key default uuid_generate_v4(),
  page_id uuid not null references pages(id) on delete cascade,
  file_name text not null,
  file_url text not null,
  file_type text,
  file_size bigint,
  created_at timestamptz not null default now()
);

create index idx_attachments_page_id on attachments(page_id);

-- Auto-update updated_at on pages
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_pages_updated_at
before update on pages
for each row
execute function set_updated_at();

-- RLS is disabled for now (single-user, no auth).
-- RLS policies and auth will be added in a later phase.
-- See: lib/supabase.ts for client configuration.