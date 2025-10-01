import { Router } from 'express';
import { z } from 'zod';
import { adminClient, getUserClient, publicClient } from '../config/supabase.js';

const router = Router();

const updateSchema = z.object({
  fullName: z.string().min(1).optional(),
  rollNumber: z.string().regex(/^SET-\d{2}-\d{3}$/).optional(),
  phone: z.string().regex(/^03\d{9}$/).optional(),
  profileImageUrl: z.string().url().optional(),
});

const requireAuth = (req: any, res: any, next: any) => {
  const token = req.cookies?.accessToken;
  if (!token) return res.status(401).json({ error: 'Missing access token' });
  req.accessToken = token;
  next();
};

router.get('/me', requireAuth, async (req: any, res) => {
  const userClient = getUserClient(req.accessToken);
  try {
    const { data: user, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user.user) return res.status(401).json({ error: 'Invalid token' });
    const userId = user.user.id;
    const fullName = (user.user.user_metadata?.full_name as string | undefined) || (user.user.user_metadata?.name as string | undefined) || '';
    const email = user.user.email || '';

    // Fetch existing profile
    let { data, error } = await adminClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (error) throw error;

    // If missing, create a minimal profile row
    if (!data) {
      const { error: insErr } = await adminClient
        .from('profiles')
        .insert({ id: userId, full_name: fullName, email });
      if (insErr) {
        // eslint-disable-next-line no-console
        console.error('[Profile] Failed to auto-create profile for user', userId, insErr.message);
      } else {
        // Re-fetch
        const re = await adminClient
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
        if (!re.error) data = re.data as any;
      }
    }

    if (!data) return res.status(404).json({ error: 'Profile not found' });
    return res.json({
      id: data.id,
      fullName: data.full_name,
      rollNumber: data.roll_number,
      email: data.email,
      phone: data.phone,
      profileImageUrl: data.profile_image_url ?? null,
      createdAt: data.created_at,
      avatarPath: data.avatar_path ?? null,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? 'Internal error' });
  }
});

router.put('/me', requireAuth, async (req: any, res) => {
  const parse = updateSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: 'Invalid input', details: parse.error.flatten() });
  const userClient = getUserClient(req.accessToken);
  try {
    const { data: user, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user.user) return res.status(401).json({ error: 'Invalid token' });
    const userId = user.user.id;
    const payload: Record<string, any> = {};
    if (parse.data.fullName !== undefined) payload.full_name = parse.data.fullName;
    if (parse.data.rollNumber !== undefined) payload.roll_number = parse.data.rollNumber;
    if (parse.data.phone !== undefined) payload.phone = parse.data.phone;
    if (parse.data.profileImageUrl !== undefined) payload.profile_image_url = parse.data.profileImageUrl;
    if (Object.keys(payload).length === 0) return res.status(400).json({ error: 'No fields to update' });
    const { data: updated, error } = await adminClient
      .from('profiles')
      .update(payload)
      .eq('id', userId)
      .select('id, full_name, phone, profile_image_url')
      .maybeSingle();
    if (error) throw error;
    if (!updated) return res.status(404).json({ error: 'Profile not found' });
    return res.json({
      id: updated.id,
      fullName: updated.full_name,
      phone: updated.phone,
      profileImageUrl: updated.profile_image_url ?? null,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? 'Internal error' });
  }
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8),
  confirmNewPassword: z.string().min(8),
}).refine(d => d.newPassword === d.confirmNewPassword, { path: ['confirmNewPassword'], message: 'Passwords do not match' });

router.post('/change-password', requireAuth, async (req: any, res) => {
  const parsed = changePasswordSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });
  const userClient = getUserClient(req.accessToken);
  try {
    const { data: user, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user.user) return res.status(401).json({ error: 'Invalid token' });
    const email = user.user.email;
    const userId = user.user.id;
    if (!email) return res.status(400).json({ error: 'Email missing on user' });
    // verify current password
    const { error: verifyErr } = await publicClient.auth.signInWithPassword({ email, password: parsed.data.currentPassword });
    if (verifyErr) return res.status(401).json({ error: 'Current password is incorrect' });
    // update password via admin client to avoid session issues
    const { error: updErr } = await adminClient.auth.admin.updateUserById(userId, { password: parsed.data.newPassword });
    if (updErr) throw updErr;
    return res.json({ message: 'Password updated' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? 'Internal error' });
  }
});

export default router;


