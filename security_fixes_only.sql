-- CRITICAL SECURITY FIXES ONLY
-- Fix RLS disabled in public schema for token tables

-- Enable Row Level Security on sensitive token tables
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_verification_tokens ENABLE ROW LEVEL SECURITY;

-- Create restrictive policies that deny all client access
-- (Service role bypasses RLS so backend can still access these tables)

CREATE POLICY "password_reset_tokens_no_access" ON public.password_reset_tokens
    FOR ALL USING (false);

CREATE POLICY "email_verification_tokens_no_access" ON public.email_verification_tokens
    FOR ALL USING (false);
