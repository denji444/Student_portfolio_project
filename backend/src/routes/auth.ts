import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { adminClient, publicClient } from '../config/supabase.js';

const router = Router();
const authLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 60 });

const signupSchema = z.object({
  fullName: z.string().min(1),
  rollNumber: z.string().regex(/^SET-\d{2}-\d{3}$/),
  email: z.string().email(),
  phone: z.string().regex(/^03\d{9}$/),
  password: z.string().min(8),
  confirmPassword: z.string().min(8),
}).refine((d) => d.password === d.confirmPassword, {
  path: ['confirmPassword'],
  message: 'Passwords do not match',
});

const signinSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

router.post('/signup', authLimiter, async (req, res) => {
  const parse = signupSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: 'Invalid input', details: parse.error.flatten() });
  }
  const { email, password, fullName, rollNumber, phone } = parse.data;
  try {
    // Check uniqueness for rollNumber and email in profiles
    const { data: existingByRoll, error: rollErr } = await adminClient
      .from('profiles')
      .select('id')
      .eq('roll_number', rollNumber)
      .maybeSingle();
    if (rollErr) throw rollErr;
    if (existingByRoll) return res.status(409).json({ error: 'Roll number already registered' });

    const { data: existingByEmail, error: emailErr } = await adminClient
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();
    if (emailErr) throw emailErr;
    if (existingByEmail) return res.status(409).json({ error: 'Email already registered' });

    // Create user via public client to trigger email verification
    const redirectTo = process.env.EMAIL_REDIRECT_URL || undefined;
    const { data: signUpData, error: signUpError } = await publicClient.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectTo, data: { fullName, rollNumber, phone } },
    });
    if (signUpError || !signUpData.user) throw signUpError ?? new Error('Sign up failed');
    const authUser = signUpData.user;

    // Create profile row
    const { error: profileErr } = await adminClient.from('profiles').insert({
      id: authUser.id,
      full_name: fullName,
      roll_number: rollNumber,
      email,
      phone,
    });
    if (profileErr) throw profileErr;

    return res.status(201).json({ message: 'Account created. Please verify your email to sign in.' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? 'Internal error' });
  }
});

router.post('/signin', authLimiter, async (req, res) => {
  const parse = signinSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: 'Invalid input', details: parse.error.flatten() });
  }
  const { email, password } = parse.data;
  try {
    const { data, error } = await publicClient.auth.signInWithPassword({ email, password });
    if (error || !data.session) return res.status(401).json({ error: 'Invalid credentials' });
    // Block access until email is verified
    const confirmed = data.user?.email_confirmed_at;
    if (!confirmed) {
      // logout the just-created session to be safe
      await publicClient.auth.signOut();
      return res.status(403).json({ error: 'Email not verified. Please check your inbox.' });
    }
    const { access_token, refresh_token, user } = data.session;
    // Set httpOnly cookies (secure in production, lax samesite)
    // IMPORTANT: Do not default to 'production' when NODE_ENV is unset, to avoid setting secure cookies in dev.
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('accessToken', access_token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60, // 1h
      path: '/',
    });
    if (refresh_token) {
      res.cookie('refreshToken', refresh_token, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7d
        path: '/',
      });
    }
    return res.status(200).json({ message: 'Signed in', user });
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? 'Internal error' });
  }
});

export default router;

// Refresh access token
router.post('/refresh', authLimiter, async (req, res) => {
  const refreshToken = (req.cookies?.refreshToken as string | undefined) || (req.body?.refreshToken as string | undefined);
  if (!refreshToken) return res.status(400).json({ error: 'Missing refreshToken' });
  try {
    const { data, error } = await publicClient.auth.refreshSession({ refresh_token: refreshToken });
    if (error || !data.session) return res.status(401).json({ error: 'Invalid refresh token' });
    const { access_token, refresh_token, user } = data.session;
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('accessToken', access_token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60,
      path: '/',
    });
    if (refresh_token) {
      res.cookie('refreshToken', refresh_token, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 24 * 7,
        path: '/',
      });
    }
    return res.status(200).json({ message: 'Refreshed', user });
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? 'Internal error' });
  }
});

// Logout clears cookies
router.post('/logout', authLimiter, async (_req, res) => {
  const isProd = process.env.NODE_ENV === 'production';
  res.clearCookie('accessToken', { httpOnly: true, secure: isProd, sameSite: 'lax', path: '/' });
  res.clearCookie('refreshToken', { httpOnly: true, secure: isProd, sameSite: 'lax', path: '/' });
  return res.json({ message: 'Logged out' });
});

// Resend email verification
router.post('/resend-verification', authLimiter, async (req, res) => {
  const email = (req.body?.email as string | undefined)?.trim();
  if (!email) return res.status(400).json({ error: 'Missing email' });
  try {
    // Correct approach: use public client resend to re-send signup confirmation
    const { data, error } = await publicClient.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: process.env.EMAIL_REDIRECT_URL || undefined } as any,
    } as any);
    if (error) {
      // Surface friendly message for common cases
      const msg = error.message || 'Unable to resend verification';
      return res.status(400).json({ error: msg });
    }
    return res.status(200).json({ message: 'Verification email resent' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? 'Internal error' });
  }
});


