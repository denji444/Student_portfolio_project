import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { adminClient, getUserClient, publicClient } from '../config/supabase.js';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit
const THUMBNAILS_BUCKET = process.env.SUPABASE_THUMBNAILS_BUCKET || 'thumbnails';

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
  status: z.enum(['completed', 'in-progress', 'planned']).default('planned'),
});

// Schema for normalized project requirements
const requirementSchema = z.object({
  content: z.string().min(1),
  status: z.enum(['planned', 'implemented']).default('planned'),
});

// Auth required middleware - reads from cookies
const requireAuth = (req: Request & { accessToken?: string }, res: Response, next: NextFunction) => {
  const token = (req as any).cookies?.accessToken;
  if (!token) return res.status(401).json({ error: 'Missing access token' });
  (req as any).accessToken = token;
  next();
};

// Public list: newest first
router.get('/public', async (_req: Request, res: Response) => {
  try {
    const { data, error } = await adminClient
      .from('projects')
      .select('*,owner:profiles(full_name,roll_number,email,profile_image_url),comments:project_comments(id,content,created_at),requirements:project_requirements(id,content,status,created_at)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return res.json(
      (data ?? []).map(p => ({
        id: p.id,
        title: p.title,
        description: p.description,
        technologies: p.technologies ?? [],
        requirements: Array.isArray((p as any).requirements)
          ? {
              planned: (p as any).requirements.filter((r: any) => r.status === 'planned').map((r: any) => r.content),
              implemented: (p as any).requirements.filter((r: any) => r.status === 'implemented').map((r: any) => r.content),
            }
          : { planned: [], implemented: [] },
        githubUrl: p.github_url ?? undefined,
        deploymentUrl: p.deployment_url ?? undefined,
        imageUrl: p.image_url ?? undefined,
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

// Authenticated: list my projects
router.get('/', requireAuth, async (req: Request & { accessToken?: string }, res: Response) => {
  const userClient = getUserClient((req as any).accessToken);
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

// Authenticated: upload thumbnail to storage
router.post('/upload-thumbnail', requireAuth, upload.single('file'), async (req: Request & { file?: Express.Multer.File; accessToken?: string }, res: Response) => {
  try {
    const file = (req as any).file as Express.Multer.File | undefined;
    if (!file) return res.status(400).json({ error: 'Missing file' });
    const ext = (file.originalname.split('.').pop() || 'jpg').toLowerCase();
    const safeExt = ext.replace(/[^a-z0-9]/gi, '') || 'jpg';
    const path = `uploads/${Date.now()}_${Math.random().toString(36).slice(2)}.${safeExt}`;
    const { error: upErr } = await adminClient.storage.from(THUMBNAILS_BUCKET).upload(path, file.buffer, {
      contentType: file.mimetype || 'image/jpeg',
      upsert: true,
    });
    if (upErr) return res.status(400).json({ error: upErr.message || 'Upload failed' });
    const { data: pub } = adminClient.storage.from(THUMBNAILS_BUCKET).getPublicUrl(path);
    return res.status(201).json({ url: pub.publicUrl, path });
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? 'Internal error' });
  }
});

// Authenticated: create project
router.post('/', requireAuth, async (req: Request & { accessToken?: string }, res: Response) => {
  const parsed = projectSchema.safeParse((req as any).body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });
  const userClient = getUserClient((req as any).accessToken);
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
      project_type: payload.projectType,
      github_url: payload.githubUrl,
      deployment_url: payload.deploymentUrl,
      image_url: payload.imageUrl,
      status: payload.status,
    }).select('*').single();
    if (error) throw error;
    return res.status(201).json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? 'Internal error' });
  }
});

// Authenticated: update project
router.put('/:id', requireAuth, async (req: Request & { accessToken?: string, params: { id: string } }, res: Response) => {
  const id = (req as any).params.id as string;
  const parsed = projectSchema.partial().safeParse((req as any).body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });
  const userClient = getUserClient((req as any).accessToken);
  try {
    const { data: user, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user.user) return res.status(401).json({ error: 'Invalid token' });
    const userId = user.user.id;
    const payload: Record<string, any> = {};
    if (parsed.data.title !== undefined) payload.title = parsed.data.title;
    if (parsed.data.description !== undefined) payload.description = parsed.data.description;
    if (parsed.data.technologies !== undefined) payload.technologies = parsed.data.technologies;
    // legacy functional_requirements no longer updated; normalized requirements are managed via /requirements endpoints
    if (parsed.data.status !== undefined) payload.status = parsed.data.status;
    if (parsed.data.projectType !== undefined) payload.project_type = parsed.data.projectType || null;
    if (parsed.data.githubUrl !== undefined) payload.github_url = parsed.data.githubUrl || null;
    if (parsed.data.deploymentUrl !== undefined) payload.deployment_url = parsed.data.deploymentUrl || null;
    if (parsed.data.imageUrl !== undefined) payload.image_url = parsed.data.imageUrl || null;

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

// Authenticated: delete project
router.delete('/:id', requireAuth, async (req: Request & { accessToken?: string, params: { id: string } }, res: Response) => {
  const id = (req as any).params.id as string;
  const userClient = getUserClient((req as any).accessToken);
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
// ===== Project Requirements CRUD =====
// List requirements for a project (auth required)
router.get('/:projectId/requirements', requireAuth, async (req: Request & { accessToken?: string, params: { projectId: string } }, res: Response) => {
  const projectId = (req as any).params.projectId as string;
  try {
    const { data, error } = await adminClient
      .from('project_requirements')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return res.json(data ?? []);
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? 'Internal error' });
  }
});

async function ensureProjectOwner(userToken: string, projectId: string): Promise<boolean> {
  const userClient = getUserClient(userToken);
  const { data: user, error: userErr } = await userClient.auth.getUser();
  if (userErr || !user.user) return false;
  const userId = user.user.id;
  const { data: proj } = await adminClient
    .from('projects')
    .select('id,user_id')
    .eq('id', projectId)
    .eq('user_id', userId)
    .maybeSingle();
  return !!proj;
}

// Create requirement
router.post('/:projectId/requirements', requireAuth, async (req: Request & { accessToken?: string, params: { projectId: string } }, res: Response) => {
  const projectId = (req as any).params.projectId as string;
  const parsed = requirementSchema.safeParse((req as any).body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });
  try {
    const isOwner = await ensureProjectOwner((req as any).accessToken!, projectId);
    if (!isOwner) return res.status(403).json({ error: 'Forbidden' });
    const { data, error } = await adminClient
      .from('project_requirements')
      .insert({ project_id: projectId, content: parsed.data.content, status: parsed.data.status })
      .select('*')
      .single();
    if (error) throw error;
    return res.status(201).json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? 'Internal error' });
  }
});

// Update requirement
router.patch('/requirements/:id', requireAuth, async (req: Request & { accessToken?: string, params: { id: string } }, res: Response) => {
  const id = (req as any).params.id as string;
  const body = (req as any).body as Partial<{ content: string; status: 'planned'|'implemented' }>;
  if (!body || (body.content === undefined && body.status === undefined)) return res.status(400).json({ error: 'No fields to update' });
  try {
    const { data: reqRow, error: reqErr } = await adminClient
      .from('project_requirements')
      .select('id, project_id')
      .eq('id', id)
      .maybeSingle();
    if (reqErr) throw reqErr;
    if (!reqRow) return res.status(404).json({ error: 'Not found' });
    const isOwner = await ensureProjectOwner((req as any).accessToken!, (reqRow as any).project_id);
    if (!isOwner) return res.status(403).json({ error: 'Forbidden' });
    const payload: any = {};
    if (body.content !== undefined) payload.content = body.content;
    if (body.status !== undefined) payload.status = body.status;
    const { data: updated, error } = await adminClient
      .from('project_requirements')
      .update(payload)
      .eq('id', id)
      .select('*')
      .maybeSingle();
    if (error) throw error;
    if (!updated) return res.status(404).json({ error: 'Not found' });
    return res.json(updated);
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? 'Internal error' });
  }
});

// Delete requirement
router.delete('/requirements/:id', requireAuth, async (req: Request & { accessToken?: string, params: { id: string } }, res: Response) => {
  const id = (req as any).params.id as string;
  try {
    const { data: reqRow, error: reqErr } = await adminClient
      .from('project_requirements')
      .select('id, project_id')
      .eq('id', id)
      .maybeSingle();
    if (reqErr) throw reqErr;
    if (!reqRow) return res.status(404).json({ error: 'Not found' });
    const isOwner = await ensureProjectOwner((req as any).accessToken!, (reqRow as any).project_id);
    if (!isOwner) return res.status(403).json({ error: 'Forbidden' });
    const { data: del, error } = await adminClient
      .from('project_requirements')
      .delete()
      .eq('id', id)
      .select('id')
      .maybeSingle();
    if (error) throw error;
    if (!del) return res.status(404).json({ error: 'Not found' });
    return res.json({ message: 'Deleted' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? 'Internal error' });
  }
});

export default router;
