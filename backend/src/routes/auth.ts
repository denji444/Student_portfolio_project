import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { adminClient, publicClient } from '../config/supabase.js';
import crypto from 'crypto';
import { sendEmail, sendEmailWithRetry } from '../util/mailer.js';

const router = Router();
const authLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 60 });


// Request password reset (send email with reset link)
const requestResetSchema = z.object({ email: z.string().email() });
router.post('/password-reset/request', authLimiter, async (req, res) => {
  const parsed = requestResetSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid email' });
  const email = parsed.data.email.trim();
  try {
    const { data: profile, error: pErr } = await adminClient
      .from('profiles')
      .select('id, full_name, email')
      .eq('email', email)
      .maybeSingle();
    if (pErr) throw pErr;
    if (!profile) return res.status(200).json({ message: 'If an account exists, a reset email has been sent.' });

    await adminClient
      .from('password_reset_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('user_id', profile.id)
      .is('used_at', null);

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1h
    const { error: tokErr } = await adminClient
      .from('password_reset_tokens')
      .insert({ token, user_id: profile.id, email: profile.email, expires_at: expiresAt.toISOString() });
    if (tokErr) throw tokErr;

    const frontendBase = (process.env.APP_URL || process.env.EMAIL_REDIRECT_URL || `${req.protocol}://${req.get('host') || ''}`).replace(/\/$/, '');
    const siteBase = frontendBase.replace(/\/auth$/, '');
    const resetUrl = `${siteBase}/reset-password?token=${token}`;

    const subject = 'Reset your password — PTUT Student Portfolio';
    const fullName = profile.full_name || 'there';
    const text = `Hello ${fullName},\n\nClick the button below to reset your password. This link expires in 1 hour.`;
    const html = `<!doctype html><html><body style=\"margin:0;padding:0;background:#f5f7fb;font-family:Inter,Segoe UI,Arial,sans-serif;\">
      <table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"background:linear-gradient(180deg,#f6f7fb 0%,#ffffff 60%,#e0f2fe 100%);padding:32px 16px;\">
        <tr><td>
          <table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"max-width:640px;margin:auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;box-shadow:0 6px 24px rgba(2,6,23,0.06)\">
            <tr>
              <td style=\"background:#0ea5e9;color:#fff;padding:18px 24px\">
                <h1 style=\"margin:0;font-size:18px;letter-spacing:0.3px\">PTUT Student Portfolio</h1>
              </td>
            </tr>
            <tr>
              <td style=\"padding:22px 24px\">
                <h2 style=\"margin:0 0 8px;color:#0f172a;font-size:22px\">Reset your password</h2>
                <p style=\"margin:0 0 12px;color:#334155\">Hello ${fullName}, click the button below to set a new password.</p>
                <p style=\"margin:16px 0\"><a href=\"${resetUrl}\" style=\"background:#0ea5e9;color:#fff;text-decoration:none;padding:12px 16px;border-radius:10px;display:inline-block;font-weight:600\">Reset password</a></p>
                <p style=\"margin:16px 0 0;color:#6b7280;font-size:12px\">This link expires in 1 hour. If you didn’t request this, you can ignore this email.</p>
              </td>
            </tr>
            <tr>
              <td style=\"background:#f8fafc;color:#64748b;padding:14px 24px;font-size:12px\">This is an automated message. Please do not reply.</td>
            </tr>
          </table>
        </td></tr>
      </table>
      </body></html>`;
    await sendEmailWithRetry(profile.email, subject, text, html, 'noreplytostudent@gmail.com', 3);
    return res.json({ message: 'If an account exists, a reset email has been sent.' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? 'Internal error' });
  }
});

// Confirm password reset (set new password)
const confirmResetSchema = z.object({ token: z.string().min(10), newPassword: z.string().min(8) });
router.post('/password-reset/confirm', authLimiter, async (req, res) => {
  const parsed = confirmResetSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });
  const { token, newPassword } = parsed.data;
  try {
    const { data: rec, error } = await adminClient
      .from('password_reset_tokens')
      .select('id, user_id, email, expires_at, used_at')
      .eq('token', token)
      .maybeSingle();
    if (error) throw error;
    if (!rec) return res.status(400).json({ error: 'Invalid or expired token' });
    if (rec.used_at) return res.status(400).json({ error: 'Token already used' });
    if (rec.expires_at && new Date(rec.expires_at).getTime() < Date.now()) return res.status(400).json({ error: 'Token expired' });

    const { error: updErr } = await adminClient.auth.admin.updateUserById(rec.user_id, { password: newPassword });
    if (updErr) throw updErr;

    await adminClient
      .from('password_reset_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', rec.id);

    return res.json({ message: 'Password updated' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? 'Internal error' });
  }
});
const signupSchema = z.object({
  fullName: z.string().min(1),
  rollNumber: z.string().regex(/^SET-\d{2}-\d{3}$/),
  email: z.string().email(),
  phone: z.string().regex(/^03\d{9}$/),
  password: z.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/,'Password must be at least 8 characters and include uppercase, lowercase, number, and special character'),
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

    // Create auth user WITHOUT Supabase email, keep email unconfirmed
    const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: false as any,
      user_metadata: { fullName, rollNumber, phone },
    } as any);
    if (createErr || !created?.user) throw createErr ?? new Error('Sign up failed');
    const authUser = created.user;

    // Create profile row
    const { error: profileErr } = await adminClient.from('profiles').insert({
      id: authUser.id,
      full_name: fullName,
      roll_number: rollNumber,
      email,
      phone,
    });
    if (profileErr) throw profileErr;

    // Generate verification token and store
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24h
    const { error: tokErr } = await adminClient
      .from('email_verification_tokens')
      .insert({ token, user_id: authUser.id, email, expires_at: expiresAt.toISOString() });
    if (tokErr) throw tokErr;

    // Build verify link using BACKEND_URL or request origin
    const backendBase = (process.env.BACKEND_URL || `${req.protocol}://${req.get('host') || ''}`).replace(/\/$/, '');
    const verifyUrl = `${backendBase}/api/auth/verify-email?token=${token}`;

    const subject = 'Verify your email — PTUT Student Portfolio';
    const text = `Hello ${fullName},\n\nPlease verify your email by clicking the button below.\n\nThis link will expire in 24 hours.`;
    const frontendBase = (process.env.APP_URL || process.env.EMAIL_REDIRECT_URL || `${req.protocol}://${req.get('host') || ''}`).replace(/\/$/, '');
    const authUrl = frontendBase.endsWith('/auth') ? frontendBase : `${frontendBase}/auth`;
    const html = `<!doctype html><html><body style="margin:0;padding:0;background:#f5f7fb;font-family:Inter,Segoe UI,Arial,sans-serif;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:linear-gradient(180deg,#f6f7fb 0%,#ffffff 60%,#e0f2fe 100%);padding:32px 16px;">
        <tr><td>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;box-shadow:0 6px 24px rgba(2,6,23,0.06)">
            <tr>
              <td style="background:#0ea5e9;color:#fff;padding:18px 24px">
                <h1 style="margin:0;font-size:18px;letter-spacing:0.3px">PTUT Student Portfolio</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:22px 24px">
                <h2 style="margin:0 0 8px;color:#0f172a;font-size:22px">Verify your email</h2>
                <p style="margin:0 0 12px;color:#334155">Hello ${fullName}, please confirm your email address to activate your account.</p>
                <p style="margin:16px 0"><a href="${verifyUrl}" style="background:#0ea5e9;color:#fff;text-decoration:none;padding:12px 16px;border-radius:10px;display:inline-block;font-weight:600">Verify email</a></p>
                <p style="margin:12px 0;color:#64748b;font-size:12px;line-height:1.5">If the button doesn't work, copy and paste this URL into your browser to sign in:<br/><span style=\"word-break:break-all;color:#0ea5e9\">${authUrl}</span></p>
                <p style="margin:16px 0 0;color:#6b7280;font-size:12px">This link expires in 24 hours. After verification, you'll be redirected to the sign-in page (/auth).</p>
              </td>
            </tr>
            <tr>
              <td style="background:#f8fafc;color:#64748b;padding:14px 24px;font-size:12px">This is an automated message. Please do not reply.</td>
            </tr>
          </table>
        </td></tr>
      </table>
      </body></html>`;
    // Send email in background (non-blocking) to avoid timeout delays
    setImmediate(async () => {
      try {
        await sendEmailWithRetry(email, subject, text, html, 'noreplytostudent@gmail.com', 3);
        // eslint-disable-next-line no-console
        console.log('[Signup] Verification email sent to:', email);
      } catch (emailErr: any) {
        // eslint-disable-next-line no-console
        console.error('[Signup] Failed to send verification email after retries:', emailErr?.message);
      }
    });

    return res.status(201).json({ message: 'Account created. Please verify your email to sign in.' });
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error('[Signup] Signup failed:', err?.message);
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
    const sameSite: 'lax' | 'none' = isProd ? 'none' : 'lax';
    res.cookie('accessToken', access_token, {
      httpOnly: true,
      secure: isProd,
      sameSite,
      maxAge: 1000 * 60 * 60, // 1h
      path: '/',
    });
    if (refresh_token) {
      res.cookie('refreshToken', refresh_token, {
        httpOnly: true,
        secure: isProd,
        sameSite,
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
    const sameSite: 'lax' | 'none' = isProd ? 'none' : 'lax';
    res.cookie('accessToken', access_token, {
      httpOnly: true,
      secure: isProd,
      sameSite,
      maxAge: 1000 * 60 * 60,
      path: '/',
    });
    if (refresh_token) {
      res.cookie('refreshToken', refresh_token, {
        httpOnly: true,
        secure: isProd,
        sameSite,
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
  const sameSite: 'lax' | 'none' = isProd ? 'none' : 'lax';
  res.clearCookie('accessToken', { httpOnly: true, secure: isProd, sameSite, path: '/' });
  res.clearCookie('refreshToken', { httpOnly: true, secure: isProd, sameSite, path: '/' });
  return res.json({ message: 'Logged out' });
});

// Google OAuth (start)
router.get('/oauth/google', async (req, res) => {
  try {
    // IMPORTANT: Use the FRONTEND origin for callback so cookies become first-party via the frontend proxy
    // Frontend must proxy /api/* -> backend. If APP_URL is missing, fall back to backend origin.
    const callbackBase = (process.env.APP_URL || process.env.EMAIL_REDIRECT_URL || process.env.BACKEND_URL || `${req.protocol}://${req.get('host') || ''}`).replace(/\/$/, '');
    // Optional post-login redirect path (frontend route)
    const redirectPath = (req.query?.redirect as string | undefined) || '/dashboard';
    // Include our redirect as a query param on the callback URL so we don't touch Supabase's state
    const callbackUrl = `${callbackBase}/api/auth/oauth/callback?redirect=${encodeURIComponent(redirectPath)}`;
    const { data, error } = await publicClient.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl,
        // Ensure we use the authorization code + PKCE flow so the backend callback gets ?code=...
        flowType: 'pkce',
        queryParams: {
          // prompt: 'consent', // uncomment if you want to force account chooser
          access_type: 'offline',
        },
      },
    } as any);
    if (error || !data?.url) return res.status(500).json({ error: error?.message || 'Failed to start Google OAuth' });
    // Debug: log the authorization URL (should include response_type=code when PKCE is used)
    // eslint-disable-next-line no-console
    console.log('[OAuth] Redirecting to provider URL:', data.url);

    // Important: do not modify the URL's state; Supabase uses it for CSRF protection
    return res.redirect(data.url);
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? 'Internal error' });
  }
});

// Google OAuth (callback)
router.get('/oauth/callback', async (req, res) => {
  try {
    // eslint-disable-next-line no-console
    console.log('[OAuth][callback] Query:', req.query);

    const code = (req.query?.code as string | undefined)?.trim();
    // Read our own redirect param from the callback query (set in /oauth/google)
    const redirectFromQuery = (req.query?.redirect as string | undefined) || '/dashboard';
    if (!code) {
      // eslint-disable-next-line no-console
      console.error('[OAuth][callback] Missing code');
      return res.status(400).send('Missing code');
    }

    const { data, error } = await publicClient.auth.exchangeCodeForSession(code as any);
    if (error || !data?.session) {
      // eslint-disable-next-line no-console
      console.error('[OAuth][callback] exchangeCodeForSession failed:', error?.message, 'data?', !!data);
      return res.status(401).send('OAuth exchange failed');
    }

    const { access_token, refresh_token, user } = data.session;
    // eslint-disable-next-line no-console
    console.log('[OAuth][callback] Session obtained. User ID:', user?.id, 'Has refresh:', !!refresh_token);

    const isProd = process.env.NODE_ENV === 'production';
    const sameSite: 'lax' | 'none' = isProd ? 'none' : 'lax';

    try {
      res.cookie('accessToken', access_token, {
        httpOnly: true,
        secure: isProd,
        sameSite,
        maxAge: 1000 * 60 * 60, // 1h
        path: '/',
      });
      if (refresh_token) {
        res.cookie('refreshToken', refresh_token, {
          httpOnly: true,
          secure: isProd,
          sameSite,
          maxAge: 1000 * 60 * 60 * 24 * 7, // 7d
          path: '/',
        });
      }
      // eslint-disable-next-line no-console
      console.log('[OAuth][callback] Cookies set. sameSite=', sameSite, 'secure=', isProd);
    } catch (cookieErr: any) {
      // eslint-disable-next-line no-console
      console.error('[OAuth][callback] Failed to set cookies:', cookieErr?.message);
    }

    // Ensure profile exists (upsert) with logging
    if (user) {
      const fullName = (user.user_metadata?.full_name as string | undefined) || (user.user_metadata?.name as string | undefined) || '';
      const email = user.email || '';
      const { data: existing, error: selErr } = await adminClient
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();
      if (selErr) {
        // eslint-disable-next-line no-console
        console.error('[OAuth][callback] Failed to check existing profile:', selErr.message);
      }
      if (!existing) {
        const { error: insErr } = await adminClient
          .from('profiles')
          .insert({
            id: user.id,
            full_name: fullName,
            email,
          });
        if (insErr) {
          // eslint-disable-next-line no-console
          console.error('[OAuth][callback] Failed to create profile for user', user.id, insErr.message);
        } else {
          // eslint-disable-next-line no-console
          console.log('[OAuth][callback] Created profile for user', user.id);
        }
      } else {
        // eslint-disable-next-line no-console
        console.log('[OAuth][callback] Profile exists for user', user.id);
      }
    }

    // Determine where to go
    const frontendBase = (process.env.APP_URL || process.env.EMAIL_REDIRECT_URL || `${req.protocol}://${req.get('host') || ''}`).replace(/\/$/, '');
    const to = `${frontendBase}${redirectFromQuery.startsWith('/') ? '' : '/'}${redirectFromQuery}`;
    // eslint-disable-next-line no-console
    console.log('[OAuth][callback] Redirecting to:', to);
    return res.redirect(to);
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error('[OAuth][callback] Unexpected error:', err?.message);
    return res.status(500).send('Internal error');
  }
});

// Resend email verification
router.post('/resend-verification', authLimiter, async (req, res) => {
  const email = (req.body?.email as string | undefined)?.trim();
  if (!email) return res.status(400).json({ error: 'Missing email' });
  try {
    // Find profile to get user_id
    const { data: profile, error: pErr } = await adminClient
      .from('profiles')
      .select('id, full_name')
      .eq('email', email)
      .maybeSingle();
    if (pErr) throw pErr;
    if (!profile) return res.status(404).json({ error: 'Account not found' });

    // Check if already verified in auth
    const { data: userRes, error: userErr } = await adminClient.auth.admin.getUserById(profile.id);
    if (userErr) throw userErr;
    const alreadyConfirmed = userRes?.user?.email_confirmed_at;
    if (alreadyConfirmed) return res.status(400).json({ error: 'Email already verified' });

    // Invalidate previous tokens (optional soft-delete by setting used_at now for old ones)
    await adminClient
      .from('email_verification_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('user_id', profile.id)
      .is('used_at', null);

    // Create new token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24h
    const { error: tokErr } = await adminClient
      .from('email_verification_tokens')
      .insert({ token, user_id: profile.id, email, expires_at: expiresAt.toISOString() });
    if (tokErr) throw tokErr;

    const backendBase = (process.env.BACKEND_URL || `${req.protocol}://${req.get('host') || ''}`).replace(/\/$/, '');
    const verifyUrl = `${backendBase}/api/auth/verify-email?token=${token}`;
    const frontendBase2 = (process.env.APP_URL || process.env.EMAIL_REDIRECT_URL || `${req.protocol}://${req.get('host') || ''}`).replace(/\/$/, '');
    const authUrl2 = frontendBase2.endsWith('/auth') ? frontendBase2 : `${frontendBase2}/auth`;

    const subject = 'Verify your email — PTUT Student Portfolio';
    const fullName = profile.full_name || 'there';
    const text = `Hello ${fullName},\n\nPlease verify your email by clicking the button below.\n\nThis link will expire in 24 hours.`;
    const html = `<!doctype html><html><body style=\"margin:0;padding:0;background:#f5f7fb;font-family:Inter,Segoe UI,Arial,sans-serif;\">
      <table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"background:linear-gradient(180deg,#f6f7fb 0%,#ffffff 60%,#e0f2fe 100%);padding:32px 16px;\">
        <tr><td>
          <table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"max-width:640px;margin:auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;box-shadow:0 6px 24px rgba(2,6,23,0.06)\">
            <tr>
              <td style=\"background:#0ea5e9;color:#fff;padding:18px 24px\">
                <h1 style=\"margin:0;font-size:18px;letter-spacing:0.3px\">PTUT Student Portfolio</h1>
              </td>
            </tr>
            <tr>
              <td style=\"padding:22px 24px\">
                <h2 style=\"margin:0 0 8px;color:#0f172a;font-size:22px\">Verify your email</h2>
                <p style=\"margin:0 0 12px;color:#334155\">Hello ${fullName}, please confirm your email address to activate your account.</p>
                <p style=\"margin:16px 0\"><a href=\"${verifyUrl}\" style=\"background:#0ea5e9;color:#fff;text-decoration:none;padding:12px 16px;border-radius:10px;display:inline-block;font-weight:600\">Verify email</a></p>
                <p style=\"margin:12px 0;color:#64748b;font-size:12px;line-height:1.5\">If the button doesn't work, copy and paste this URL into your browser to sign in:<br/><span style=\\\"word-break:break-all;color:#0ea5e9\\\">${authUrl2}</span></p>
                <p style=\"margin:16px 0 0;color:#6b7280;font-size:12px\">This link expires in 24 hours. After verification, you'll be redirected to the sign-in page (/auth).</p>
              </td>
            </tr>
            <tr>
              <td style=\"background:#f8fafc;color:#64748b;padding:14px 24px;font-size:12px\">This is an automated message. Please do not reply.</td>
            </tr>
          </table>
        </td></tr>
      </table>
      </body></html>`;
    // Send email in background to avoid blocking the response
    setImmediate(async () => {
      try {
        await sendEmailWithRetry(email, subject, text, html, 'noreplytostudent@gmail.com', 3);
        // eslint-disable-next-line no-console
        console.log('[Resend] Verification email sent to:', email);
      } catch (emailErr: any) {
        // eslint-disable-next-line no-console
        console.error('[Resend] Failed to send verification email after retries:', emailErr?.message);
      }
    });

    return res.status(200).json({ message: 'Verification email resent' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? 'Internal error' });
  }
});

// Verify email via token
router.get('/verify-email', async (req, res) => {
  const token = (req.query?.token as string | undefined)?.trim();
  if (!token) return res.status(400).send('Missing token');
  try {
    const { data: rec, error } = await adminClient
      .from('email_verification_tokens')
      .select('id, user_id, email, expires_at, used_at')
      .eq('token', token)
      .maybeSingle();
    if (error) throw error;
    if (!rec) return res.status(400).send('Invalid or expired link');
    if (rec.used_at) return res.status(400).send('This link has already been used');
    if (rec.expires_at && new Date(rec.expires_at).getTime() < Date.now()) return res.status(400).send('This link has expired');

    // Mark user as verified in Supabase Auth
    const { error: updErr } = await adminClient.auth.admin.updateUserById(rec.user_id, { email_confirm: true } as any);
    if (updErr) return res.status(400).send('Unable to verify email');

    // Mark token used
    await adminClient
      .from('email_verification_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', rec.id);

    // Redirect strictly to frontend /auth
    const frontendBase = (process.env.APP_URL || process.env.EMAIL_REDIRECT_URL || `${req.protocol}://${req.get('host') || ''}`).replace(/\/$/, '');
    const authUrl = frontendBase.endsWith('/auth') ? frontendBase : `${frontendBase}/auth`;
    return res.redirect(authUrl);
  } catch (err: any) {
    return res.status(500).send('Internal error');
  }
});


