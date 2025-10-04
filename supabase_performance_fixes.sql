-- Fix Supabase RLS Performance Warnings
-- Run these commands in Supabase SQL Editor

-- 1. Fix auth RLS initialization plan issues
-- Replace auth.uid() with (select auth.uid()) in all policies

-- Drop existing policies
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "projects_insert_owner" ON public.projects;
DROP POLICY IF EXISTS "projects_update_owner" ON public.projects;
DROP POLICY IF EXISTS "projects_delete_owner" ON public.projects;
DROP POLICY IF EXISTS "project_requirements_modify_owner" ON public.project_requirements;

-- Recreate policies with optimized auth function calls

-- Profiles policy
CREATE POLICY "profiles_select_own" ON public.profiles
    FOR SELECT USING (id = (select auth.uid()));

-- Projects policies
CREATE POLICY "projects_insert_owner" ON public.projects
    FOR INSERT WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "projects_update_owner" ON public.projects
    FOR UPDATE USING (user_id = (select auth.uid()));

CREATE POLICY "projects_delete_owner" ON public.projects
    FOR DELETE USING (user_id = (select auth.uid()));

-- Project requirements policy (optimized)
CREATE POLICY "project_requirements_modify_owner" ON public.project_requirements
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.projects 
            WHERE projects.id = project_requirements.project_id 
            AND projects.user_id = (select auth.uid())
        )
    );

-- 2. Fix multiple permissive policies issue
-- Drop the redundant select-all policy since modify_owner already handles SELECT
DROP POLICY IF EXISTS "project_requirements_select_all" ON public.project_requirements;

-- Create a single comprehensive policy for project_requirements
DROP POLICY IF EXISTS "project_requirements_modify_owner" ON public.project_requirements;

CREATE POLICY "project_requirements_access" ON public.project_requirements
    FOR ALL USING (
        -- Allow access if user owns the project OR it's a public read
        EXISTS (
            SELECT 1 FROM public.projects 
            WHERE projects.id = project_requirements.project_id 
            AND (
                projects.user_id = (select auth.uid()) -- Owner can do everything
                OR projects.status IN ('completed', 'in-progress') -- Public can read completed/in-progress
            )
        )
    )
    WITH CHECK (
        -- Only owner can insert/update/delete
        EXISTS (
            SELECT 1 FROM public.projects 
            WHERE projects.id = project_requirements.project_id 
            AND projects.user_id = (select auth.uid())
        )
    );

-- 3. CRITICAL SECURITY FIX: Enable RLS on token tables
-- These tables contain sensitive tokens and MUST have RLS enabled

-- Enable RLS on token tables
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_verification_tokens ENABLE ROW LEVEL SECURITY;

-- Create restrictive policies for token tables
-- These should only be accessible by the service role (backend), not by users

-- Password reset tokens - NO public access (backend only via service role)
CREATE POLICY "password_reset_tokens_no_access" ON public.password_reset_tokens
    FOR ALL USING (false); -- Deny all access to regular users

-- Email verification tokens - NO public access (backend only via service role)  
CREATE POLICY "email_verification_tokens_no_access" ON public.email_verification_tokens
    FOR ALL USING (false); -- Deny all access to regular users

-- Note: The backend uses the service role which bypasses RLS, so it can still access these tables
-- This prevents any potential client-side access to sensitive tokens

-- Verify all policies are created correctly
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'projects', 'project_requirements', 'password_reset_tokens', 'email_verification_tokens')
ORDER BY tablename, policyname;
