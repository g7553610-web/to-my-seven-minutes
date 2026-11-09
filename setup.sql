-- Run this once in Supabase: SQL Editor -> New query -> paste -> Run.
-- This creates the table that stores each photo's caption and date.
-- The actual image files are stored in your private LOVESTORY Storage bucket.

create table if not exists public.memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  image_path text not null,
  caption text,
  memory_date date,
  created_at timestamptz not null default now()
);

alter table public.memories enable row level security;

drop policy if exists "Users can view their own memories" on public.memories;
create policy "Users can view their own memories"
on public.memories for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can add their own memories" on public.memories;
create policy "Users can add their own memories"
on public.memories for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "Users can delete their own memories" on public.memories;
create policy "Users can delete their own memories"
on public.memories for delete
to authenticated
using (user_id = auth.uid());
