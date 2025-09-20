import { Router } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { adminClient } from '../config/supabase.js';
import { sendEmail, renderCommentHtml } from '../util/mailer.js';

const router = Router();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? '';
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET ?? 'dev-secret-change-me';

const signAdminToken = (payload: { email: string }) => {
  return jwt.sign(payload, ADMIN_JWT_SECRET, { expiresIn: '8h' });
};

const requireAdmin = (req: any, res: any, next: any) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Missing Authorization header' });
  const token = auth.replace('Bearer ', '');
  try {
    const decoded = jwt.verify(token, ADMIN_JWT_SECRET) as any;
    req.admin = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid admin token' });
  }
};

// Admin login
router.post('/login', async (req, res) => {
  const body = z.object({ email: z.string().email(), password: z.string().min(1) }).safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: 'Invalid input' });
  const { email, password } = body.data;
  if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid admin credentials' });
  }
  const token = signAdminToken({ email });
  return res.json({ accessToken: token });
});

// Verify token / profile
router.get('/me', requireAdmin, async (_req, res) => {
  return res.json({ ok: true });
});

// Students list/search
router.get('/students', requireAdmin, async (_req, res) => {
  try {
    const { data, error } = await adminClient
      .from('profiles')
      .select('id, full_name, roll_number, email, phone, profile_image_url, created_at')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return res.json(data ?? []);
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? 'Internal error' });
  }
});

// Update student profile
router.put('/students/:id', requireAdmin, async (req, res) => {
  const id = req.params.id;
  const parsed = z.object({
    fullName: z.string().min(1).optional(),
    phone: z.string().regex(/^03\d{9}$/).optional(),
    profileImageUrl: z.string().url().optional(),
  }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });
  const payload: Record<string, any> = {};
  if (parsed.data.fullName !== undefined) payload.full_name = parsed.data.fullName;
  if (parsed.data.phone !== undefined) payload.phone = parsed.data.phone;
  if (parsed.data.profileImageUrl !== undefined) payload.profile_image_url = parsed.data.profileImageUrl;
  if (Object.keys(payload).length === 0) return res.status(400).json({ error: 'No fields to update' });
  try {
    const { data, error } = await adminClient
      .from('profiles')
      .update(payload)
      .eq('id', id)
      .select('id')
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Not found' });
    return res.json({ message: 'Updated' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? 'Internal error' });
  }
});

// Delete any project
router.delete('/projects/:id', requireAdmin, async (req, res) => {
  const id = req.params.id;
  try {
    const { data, error } = await adminClient
      .from('projects')
      .delete()
      .eq('id', id)
      .select('id')
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Not found' });
    return res.json({ message: 'Deleted' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? 'Internal error' });
  }
});

// Delete a student (profile + cascades projects)
router.delete('/students/:id', requireAdmin, async (req, res) => {
  const id = req.params.id;
  try {
    const { data, error } = await adminClient
      .from('profiles')
      .delete()
      .eq('id', id)
      .select('id')
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Not found' });
    return res.json({ message: 'Deleted' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? 'Internal error' });
  }
});

// List projects for a specific student id
router.get('/students/:id/projects', requireAdmin, async (req, res) => {
  const id = req.params.id;
  try {
    const { data, error } = await adminClient
      .from('projects')
      .select('id, title, status, created_at, project_type')
      .eq('user_id', id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return res.json(data ?? []);
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? 'Internal error' });
  }
});

// Comments on projects
const commentSchema = z.object({ content: z.string().min(1).max(2000) });

router.get('/projects/:id/comments', requireAdmin, async (req, res) => {
  const projectId = req.params.id;
  try {
    const { data, error } = await adminClient
      .from('project_comments')
      .select('id, project_id, content, created_at')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return res.json(data ?? []);
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? 'Internal error' });
  }
});


router.post('/projects/:id/comments', requireAdmin, async (req, res) => {
  const projectId = req.params.id;
  const parsed = commentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });
  try {
    const { data, error } = await adminClient
      .from('project_comments')
      .insert({ project_id: projectId, content: parsed.data.content })
      .select('*')
      .single();
    if (error) throw error;
    // Fetch project owner email
    const { data: project, error: projErr } = await adminClient
      .from('projects')
      .select('id, user_id, title, owner:profiles(email, full_name)')
      .eq('id', projectId)
      .maybeSingle();
    if (!projErr && project && (project as any).owner?.email) {
      const owner = (project as any).owner;
      const to = owner.email as string;
      const name = (owner.full_name as string) || 'Student';
      const subject = `New comment on your project: ${(project as any).title || 'Project'}`;
      const text = `Hello ${name},\n\nAn admin added a comment on your project:\n\n"${parsed.data.content}"\n\nProject ID: ${projectId}\n\nRegards,\nStudent Portfolio`;
      const html = renderCommentHtml({ studentName: name, projectTitle: (project as any).title || 'Project', comment: parsed.data.content, projectId, appUrl: process.env.APP_BASE_URL || 'https://student-portfolio-gppt.onrender.com/' });
      try { await sendEmail(to, subject, text, html, process.env.REPLY_TO_EMAIL); } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Comment email failed to send:', (e as any)?.message || e);
      }
    }
    return res.status(201).json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? 'Internal error' });
  }
});

router.delete('/projects/:projectId/comments/:commentId', requireAdmin, async (req, res) => {
  const { projectId, commentId } = req.params as any;
  try {
    const { data, error } = await adminClient
      .from('project_comments')
      .delete()
      .eq('id', commentId)
      .eq('project_id', projectId)
      .select('id')
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Not found' });
    return res.json({ message: 'Deleted' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? 'Internal error' });
  }
});

export default router;

// Password reset (admin sets a temporary new password)
router.post('/students/:id/reset-password', requireAdmin, async (req, res) => {
  const id = req.params.id;
  const body = z.object({ newPassword: z.string().min(8) }).safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: 'Invalid input' });
  try {
    const { error } = await adminClient.auth.admin.updateUserById(id, { password: body.data.newPassword });
    if (error) throw error;
    return res.json({ message: 'Password reset' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? 'Internal error' });
  }
});
