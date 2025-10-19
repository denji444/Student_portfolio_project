-- RLS/Performance hardening migration (idempotent)
-- - Wrap auth.uid() calls with (select auth.uid()) in RLS
-- - Avoid multiple permissive policies per table/action
-- - Replace generic ALL-commands policies with command-scoped ones
-- - Drop duplicate index on project_comments(project_id)

-- ===== Profiles =====
-- Drop owner-select to avoid duplicate permissive SELECT alongside public policy
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'profiles_select_own'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles';
  END IF;
END $$;

-- Ensure the public select policy exists (no-op if already present via schema.sql)
-- Note: do not create here to avoid changing app behavior if intentionally removed elsewhere

-- ===== Projects =====
-- Recreate owner-scoped DML policies with (select auth.uid())
DO $$ BEGIN
  -- INSERT
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='projects' AND policyname='projects_insert_owner'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "projects_insert_owner" ON public.projects';
  END IF;
  EXECUTE 'CREATE POLICY "projects_insert_owner" ON public.projects
           FOR INSERT WITH CHECK ((select auth.uid()) = user_id)';

  -- UPDATE
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='projects' AND policyname='projects_update_owner'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "projects_update_owner" ON public.projects';
  END IF;
  EXECUTE 'CREATE POLICY "projects_update_owner" ON public.projects
           FOR UPDATE USING ((select auth.uid()) = user_id)';

  -- DELETE
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='projects' AND policyname='projects_delete_owner'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "projects_delete_owner" ON public.projects';
  END IF;
  EXECUTE 'CREATE POLICY "projects_delete_owner" ON public.projects
           FOR DELETE USING ((select auth.uid()) = user_id)';
END $$;

-- ===== Project Requirements =====
-- Drop legacy/duplicate policies and recreate command-scoped owner checks using (select auth.uid())
DO $$ BEGIN
  -- Drop any legacy/duplicate policies if present
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='project_requirements' AND policyname='project_requirements_modify_owner'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "project_requirements_modify_owner" ON public.project_requirements';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='project_requirements' AND policyname='project_requirements_access'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "project_requirements_access" ON public.project_requirements';
  END IF;

  -- Recreate as three scoped policies
  EXECUTE 'CREATE POLICY "project_requirements_insert_owner" ON public.project_requirements
           FOR INSERT WITH CHECK (
             EXISTS (
               SELECT 1 FROM public.projects p
               WHERE p.id = project_id AND p.user_id = (select auth.uid())
             )
           )';

  EXECUTE 'CREATE POLICY "project_requirements_update_owner" ON public.project_requirements
           FOR UPDATE USING (
             EXISTS (
               SELECT 1 FROM public.projects p
               WHERE p.id = project_id AND p.user_id = (select auth.uid())
             )
           )';

  EXECUTE 'CREATE POLICY "project_requirements_delete_owner" ON public.project_requirements
           FOR DELETE USING (
             EXISTS (
               SELECT 1 FROM public.projects p
               WHERE p.id = project_id AND p.user_id = (select auth.uid())
             )
           )';
END $$;

-- Keep the permissive SELECT policy (project_requirements_select_all) as the single select policy
-- (no changes here)

-- ===== Project Comments =====
-- Drop any duplicate permissive SELECT policy not defined in schema.sql
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='project_comments' AND policyname='Project comments readable by everyone'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Project comments readable by everyone" ON public.project_comments';
  END IF;
END $$;

-- ===== Index de-duplication =====
-- Drop the duplicate index if it exists; retain the one from schema.sql (pc_project_id_idx)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE c.relkind = 'i' AND n.nspname='public' AND c.relname='project_comments_project_id_idx'
  ) THEN
    EXECUTE 'DROP INDEX IF EXISTS public.project_comments_project_id_idx';
  END IF;
END $$;
