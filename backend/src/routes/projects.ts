import { Router } from 'express';
import { z } from 'zod';
import { adminClient, getUserClient, publicClient } from '../config/supabase.js';

const router = Router();

const projectSchema = z.object({
  title: z.string().min(1),
  // Limit description to ~250 words. Using regex split on whitespace.
  description: z.string().min(1).refine((val) => {
    const words = val.trim().split(/\s+/);
    return words.length <= 250;
  }, { message: 'Description must be at most 250 words' }),
  technologies: z.array(z.string()).min(1),
  functionalRequirements: z.array(z.string()).optional().default([]),
  projectType: z.string().min(1).optional(),
  githubUrl: z.string().url().optional(),
  deploymentUrl: z.string().url().optional(),
  imageUrl: z.string().url().optional(),
  videoUrl: z.string().url().optional(),
  status: z.enum(['completed', 'in-progress', 'planned']).default('planned'),
});

// Public list: newest first
router.get('/public', async (_req, res) => {
  try {
    const { data, error } = await adminClient
      .from('projects')
      .select('*,owner:profiles(full_name,roll_number,email,profile_image_url),comments:project_comments(id,content,created_at)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return res.json(
      (data ?? []).map(p => ({
        id: p.id,
        title: p.title,
        description: p.description,
        technologies: p.technologies ?? [],
        functionalRequirements: p.functional_requirements ?? [],
        githubUrl: p.github_url ?? undefined,
        deploymentUrl: p.deployment_url ?? undefined,
        imageUrl: p.image_url ?? undefined,
        videoUrl: p.video_url ?? undefined,
        status: p.status,
        createdAt: p.created_at,
        projectType: p.project_type ?? undefined,
        owner: (p as any).owner,
        comments: (p as any).comments ?? [],
      }))
    );
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? 'Internal error' });
  }
});

// Auth required middleware
const requireAuth = (req: any, res: any, next: any) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Missing Authorization header' });
  const token = auth.replace('Bearer ', '');
  req.accessToken = token;
  next();
};

router.get('/', requireAuth, async (req: any, res) => {
  const userClient = getUserClient(req.accessToken);
  try {
    const { data: user, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user.user) return res.status(401).json({ error: 'Invalid token' });
    const userId = user.user.id;
    const { data, error } = await adminClient
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return res.json(data ?? []);
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? 'Internal error' });
  }
});

router.post('/', requireAuth, async (req: any, res) => {
  const parsed = projectSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });
  const userClient = getUserClient(req.accessToken);
  try {
    const { data: user, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user.user) return res.status(401).json({ error: 'Invalid token' });
    const userId = user.user.id;
    const payload = parsed.data;
    const { data, error } = await adminClient.from('projects').insert({
      user_id: userId,
      title: payload.title,
      description: payload.description,
      technologies: payload.technologies,
    functional_requirements: payload.functionalRequirements ?? [],
      project_type: payload.projectType,
      github_url: payload.githubUrl,
      deployment_url: payload.deploymentUrl,
      image_url: payload.imageUrl,
      video_url: payload.videoUrl,
      status: payload.status,
    }).select('*').single();
    if (error) throw error;
    return res.status(201).json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? 'Internal error' });
  }
});

router.put('/:id', requireAuth, async (req: any, res) => {
  const id = req.params.id;
  const parsed = projectSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });
  const userClient = getUserClient(req.accessToken);
  try {
    const { data: user, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user.user) return res.status(401).json({ error: 'Invalid token' });
    const userId = user.user.id;
    const payload: Record<string, any> = {};
    if (parsed.data.title !== undefined) payload.title = parsed.data.title;
    if (parsed.data.description !== undefined) payload.description = parsed.data.description;
    if (parsed.data.technologies !== undefined) payload.technologies = parsed.data.technologies;
  if (parsed.data.functionalRequirements !== undefined) payload.functional_requirements = parsed.data.functionalRequirements;
    if (parsed.data.status !== undefined) payload.status = parsed.data.status;
    if (parsed.data.projectType !== undefined) payload.project_type = parsed.data.projectType || null;
    if (parsed.data.githubUrl !== undefined) payload.github_url = parsed.data.githubUrl || null;
    if (parsed.data.deploymentUrl !== undefined) payload.deployment_url = parsed.data.deploymentUrl || null;
    if (parsed.data.imageUrl !== undefined) payload.image_url = parsed.data.imageUrl || null;
    if (parsed.data.videoUrl !== undefined) payload.video_url = parsed.data.videoUrl || null;

    if (Object.keys(payload).length === 0) return res.status(400).json({ error: 'No fields to update' });

    const { data: updated, error } = await adminClient
      .from('projects')
      .update(payload)
      .eq('id', id)
      .eq('user_id', userId)
      .select('id')
      .maybeSingle();
    if (error) throw error;
    if (!updated) return res.status(404).json({ error: 'Not found' });
    return res.json({ message: 'Updated' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? 'Internal error' });
  }
});

router.delete('/:id', requireAuth, async (req: any, res) => {
  const id = req.params.id;
  const userClient = getUserClient(req.accessToken);
  try {
    const { data: user, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user.user) return res.status(401).json({ error: 'Invalid token' });
    const userId = user.user.id;
    const { data: deletedRow, error } = await adminClient
      .from('projects')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
      .select('id')
      .maybeSingle();
    if (error) throw error;
    if (!deletedRow) return res.status(404).json({ error: 'Not found' });
    return res.json({ message: 'Deleted' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? 'Internal error' });
  }
});

export default router;


