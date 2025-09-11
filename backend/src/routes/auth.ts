import { Router } from 'express';
import { z } from 'zod';
import { adminClient, publicClient } from '../config/supabase.js';

const router = Router();

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

router.post('/signup', async (req, res) => {
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

    // Create user in Supabase Auth
    const { data: signUpData, error: signUpError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { fullName, rollNumber, phone },
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

    return res.status(201).json({ message: 'Account created' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? 'Internal error' });
  }
});

router.post('/signin', async (req, res) => {
  const parse = signinSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: 'Invalid input', details: parse.error.flatten() });
  }
  const { email, password } = parse.data;
  try {
    const { data, error } = await publicClient.auth.signInWithPassword({ email, password });
    if (error || !data.session) return res.status(401).json({ error: 'Invalid credentials' });
    const { access_token, refresh_token, user } = data.session;
    return res.status(200).json({ accessToken: access_token, refreshToken: refresh_token, user });
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? 'Internal error' });
  }
});

export default router;

// Refresh access token
router.post('/refresh', async (req, res) => {
  const refreshToken = req.body?.refreshToken as string | undefined;
  if (!refreshToken) return res.status(400).json({ error: 'Missing refreshToken' });
  try {
    const { data, error } = await publicClient.auth.refreshSession({ refresh_token: refreshToken });
    if (error || !data.session) return res.status(401).json({ error: 'Invalid refresh token' });
    const { access_token, refresh_token, user } = data.session;
    return res.status(200).json({ accessToken: access_token, refreshToken: refresh_token ?? refreshToken, user });
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? 'Internal error' });
  }
});


