-- Enable needed extension for gen_random_uuid
create extension if not exists pgcrypto with schema extensions;

-- Profiles (one row per auth user)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  roll_number text not null unique,
  email text not null unique,
  phone text not null,
  profile_image_url text,
  avatar_path text,
  created_at timestamptz not null default now()
);

-- Projects owned by a user
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text not null,
  technologies text[] not null default '{}',
  project_type text,
  github_url text,
  deployment_url text,
  image_url text,
  video_url text,
  status text check (status in ('completed','in-progress','planned')) default 'planned',
  created_at timestamptz not null default now()
);

-- Helpful indexes
create index if not exists projects_user_id_idx on public.projects(user_id);
create index if not exists projects_created_at_desc_idx on public.projects(created_at desc);

-- RLS
alter table public.profiles enable row level security;
alter table public.projects enable row level security;

-- Profiles: owner can read their own profile
do $$ begin
  begin
    create policy "profiles_select_own" on public.profiles
    for select using (auth.uid() = id);
  exception when duplicate_object then null; end;
end $$;

-- Projects: anyone can read
do $$ begin
  begin
    create policy "projects_select_all" on public.projects
    for select using (true);
  exception when duplicate_object then null; end;
end $$;

-- Projects: only owner can insert/update/delete
do $$ begin
  begin
    create policy "projects_insert_owner" on public.projects
    for insert with check (auth.uid() = user_id);
  exception when duplicate_object then null; end;
end $$;

do $$ begin
  begin
    create policy "projects_update_owner" on public.projects
    for update using (auth.uid() = user_id);
  exception when duplicate_object then null; end;
end $$;

do $$ begin
  begin
    create policy "projects_delete_owner" on public.projects
    for delete using (auth.uid() = user_id);
  exception when duplicate_object then null; end;
end $$;


