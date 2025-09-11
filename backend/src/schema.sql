-- Profiles of students
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  roll_number text unique not null,
  email text unique not null,
  phone text not null,
  created_at timestamp with time zone default now()
);

-- Projects
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
  created_at timestamp with time zone default now()
);

-- Project comments (admin-authored)
create table if not exists public.project_comments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  content text not null,
  created_at timestamp with time zone default now()
);

-- RLS
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_comments enable row level security;

drop policy if exists "Profiles are readable by owner only" on public.profiles;
create policy "Profiles are readable by owner only" on public.profiles
for select using (auth.uid() = id);

drop policy if exists "Projects readable by everyone" on public.projects;
create policy "Projects readable by everyone" on public.projects
for select using (true);

drop policy if exists "Project comments readable by everyone" on public.project_comments;
create policy "Project comments readable by everyone" on public.project_comments
for select using (true);

-- Only admin service role inserts/updates/deletes comments; no RLS check needed here as service role bypasses RLS

drop policy if exists "Projects insert by owner" on public.projects;
create policy "Projects insert by owner" on public.projects
for insert with check (auth.uid() = user_id);

drop policy if exists "Projects update by owner" on public.projects;
create policy "Projects update by owner" on public.projects
for update using (auth.uid() = user_id);

drop policy if exists "Projects delete by owner" on public.projects;
create policy "Projects delete by owner" on public.projects
for delete using (auth.uid() = user_id);


