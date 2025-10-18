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
  functional_requirements text[] not null default '{}',
  project_type text,
  github_url text,
  deployment_url text,
  image_url text,
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


-- Ensure column exists when updating an existing database
alter table if exists public.projects
  add column if not exists functional_requirements text[] not null default '{}';

-- Project requirements (normalized) with planned/implemented status
create table if not exists public.project_requirements (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  content text not null,
  status text not null check (status in ('planned','implemented')) default 'planned',
  created_at timestamptz not null default now()
);

create index if not exists pr_project_id_idx on public.project_requirements(project_id);
create index if not exists pr_status_idx on public.project_requirements(status);

alter table public.project_requirements enable row level security;

-- Project comments indexes (used by admin and public lists)
create index if not exists pc_project_id_idx on public.project_comments(project_id);
create index if not exists pc_created_at_idx on public.project_comments(created_at);

do $$ begin
  begin
    create policy "project_requirements_select_all" on public.project_requirements
    for select using (true);
  exception when duplicate_object then null; end;
end $$;

-- Project comments are publicly visible on the home page
alter table if exists public.project_comments enable row level security;
do $$ begin
  begin
    create policy "project_comments_select_all" on public.project_comments
    for select using (true);
  exception when duplicate_object then null; end;
end $$;

do $$ begin
  begin
    create policy "project_requirements_modify_owner" on public.project_requirements
    using (
      exists (
        select 1 from public.projects p
        where p.id = project_id and p.user_id = auth.uid()
      )
    )
    with check (
      exists (
        select 1 from public.projects p
        where p.id = project_id and p.user_id = auth.uid()
      )
    );
  exception when duplicate_object then null; end;
end $$;

-- Email verification tokens (for SMTP-based verification)
create table if not exists public.email_verification_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  email text not null,
  token text not null unique,
  used_at timestamptz
);

create index if not exists evt_token_idx on public.email_verification_tokens(token);
create index if not exists evt_user_id_idx on public.email_verification_tokens(user_id);


-- Password reset tokens (for SMTP-based password resets)
create table if not exists public.password_reset_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  email text not null,
  token text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz
);

create index if not exists prt_token_idx on public.password_reset_tokens(token);
create index if not exists prt_user_id_idx on public.password_reset_tokens(user_id);

