-- Project entities, persisted per creator.
--
-- A project carries only a `name` plus lifecycle audit columns:
--   created / archived / deleted, each with an "at" timestamp and a "by" user.
-- Archiving and deleting are soft: they set the relevant columns rather than
-- removing the row, so both are UPDATEs (no DELETE policy is required).

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  created_by uuid not null default auth.uid() references auth.users (id),
  archived_at timestamptz,
  archived_by uuid references auth.users (id),
  deleted_at timestamptz,
  deleted_by uuid references auth.users (id),
  -- Names must carry a visible character.
  constraint projects_name_not_blank check (char_length(trim(name)) > 0)
);

-- Every access path filters by creator, so index it.
create index projects_created_by_idx on public.projects (created_by);

alter table public.projects enable row level security;

-- Creator-only access. Soft archive/delete are UPDATEs, so update covers them.
create policy "Creators can read their projects"
  on public.projects for select
  to authenticated
  using (auth.uid() = created_by);

create policy "Creators can insert their projects"
  on public.projects for insert
  to authenticated
  with check (auth.uid() = created_by);

create policy "Creators can update their projects"
  on public.projects for update
  to authenticated
  using (auth.uid() = created_by)
  with check (auth.uid() = created_by);
