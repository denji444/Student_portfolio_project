import type { Project } from '@/types/portfolio';

// Resolve API base URL for dev/prod.
// Prefer relative path by default so Vite dev proxy can handle /api and keep cookies first-party.
// Allow override via VITE_API_BASE_URL when deploying or using a different origin.
const envUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
const API_BASE_URL = envUrl || '';

type PublicProjectApi = {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  projectType?: string;
  githubUrl?: string;
  deploymentUrl?: string;
  imageUrl?: string;
  videoUrl?: string;
  status: 'completed' | 'in-progress' | 'planned';
  createdAt: string;
  owner?: { full_name?: string; roll_number?: string; email?: string; profile_image_url?: string | null } | null;
  comments: { id: string; content: string; created_at: string }[];
};

export async function fetchPublicProjects(): Promise<Project[]> {
  const res = await fetch(`${API_BASE_URL}/api/projects/public`);
  if (!res.ok) throw new Error('Failed to fetch public projects');
  const data: any[] = await res.json();
  // Normalize snake_case -> camelCase if needed
  const normalized: PublicProjectApi[] = data.map((p: any) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    technologies: p.technologies ?? [],
    functionalRequirements: p.functionalRequirements ?? p.functional_requirements ?? [],
    projectType: p.projectType ?? p.project_type ?? undefined,
    githubUrl: p.githubUrl ?? p.github_url ?? undefined,
    deploymentUrl: p.deploymentUrl ?? p.deployment_url ?? undefined,
    imageUrl: p.imageUrl ?? p.image_url ?? undefined,
    videoUrl: undefined,
    status: p.status,
    createdAt: p.createdAt ?? p.created_at,
    owner: p.owner ?? null,
    comments: p.comments ?? [],
  }));
  // Map to frontend Project type; use createdAt as completionDate display value
  return normalized.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    technologies: p.technologies,
    functionalRequirements: p.functionalRequirements,
    projectType: p.projectType,
    githubUrl: p.githubUrl,
    deploymentUrl: p.deploymentUrl,
    imageUrl: p.imageUrl,
    videoUrl: undefined,
    status: p.status,
    completionDate: new Date(p.createdAt).toLocaleDateString(),
    ownerName: p.owner?.full_name,
    ownerRoll: p.owner?.roll_number,
    ownerEmail: p.owner?.email,
    ownerImageUrl: p.owner?.profile_image_url ?? null,
    comments: p.comments,
  }));
}

export async function signup(payload: {
  fullName: string;
  rollNumber: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}): Promise<{ message: string }>
{
  const res = await fetch(`${API_BASE_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    credentials: 'include',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || 'Signup failed');
  return json;
}

export async function signin(payload: { email: string; password: string }): Promise<{ message: string }>
{
  const res = await fetch(`${API_BASE_URL}/api/auth/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    credentials: 'include',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || 'Signin failed');
  return { message: json?.message || 'Signed in' };
}

export async function resendVerification(payload: { email: string }): Promise<{ message: string }>
{
  const res = await fetch(`${API_BASE_URL}/api/auth/resend-verification`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || 'Failed to resend verification email');
  return json;
}

async function requestWithAuth(input: string, init: RequestInit = {}) {
  const res = await fetch(input, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
    credentials: 'include',
  });
  if (res.status !== 401) return res;
  // try refresh once via cookies
  try {
    const refreshRes = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!refreshRes.ok) return res;
    // retry original
    return fetch(input, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
      credentials: 'include',
    });
  } catch {
    return res;
  }
}

export async function getMyProjects() {
  const res = await requestWithAuth(`${API_BASE_URL}/api/projects`, { method: 'GET' });
  if (res.status === 401 || res.status === 403) throw new Error('UNAUTHORIZED');
  if (!res.ok) throw new Error('Failed to load your projects');
  return res.json();
}

export async function createProject(input: {
  title: string; description: string; technologies: string[];
  functionalRequirements?: string[];
  projectType?: string; githubUrl?: string; deploymentUrl?: string; imageUrl?: string; videoUrl?: string; status?: 'completed'|'in-progress'|'planned';
}) {
  const res = await requestWithAuth(`${API_BASE_URL}/api/projects`, { method: 'POST', body: JSON.stringify(input) });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || 'Failed to create project');
  return json;
}

export async function updateProject(id: string, input: Partial<{
  title: string; description: string; technologies: string[];
  functionalRequirements?: string[];
  projectType?: string; githubUrl?: string; deploymentUrl?: string; imageUrl?: string; videoUrl?: string; status?: 'completed'|'in-progress'|'planned';
}>) {
  const res = await requestWithAuth(`${API_BASE_URL}/api/projects/${id}`, { method: 'PUT', body: JSON.stringify(input) });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || 'Failed to update project');
  return json;
}

export async function deleteProject(id: string) {
  const res = await requestWithAuth(`${API_BASE_URL}/api/projects/${id}`, { method: 'DELETE' });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || 'Failed to delete project');
  return json;
}

export async function getMyProfile() {
  const res = await requestWithAuth(`${API_BASE_URL}/api/profile/me`, { method: 'GET' });
  if (!res.ok) throw new Error('Failed to load profile');
  return res.json();
}

export async function updateMyProfile(input: { fullName?: string; phone?: string; profileImageUrl?: string; avatarPath?: string }) {
  const res = await requestWithAuth(`${API_BASE_URL}/api/profile/me`, { method: 'PUT', body: JSON.stringify(input) });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || 'Failed to update profile');
  return json;
}

export async function changePassword(input: { currentPassword: string; newPassword: string; confirmNewPassword: string }) {
  const res = await requestWithAuth(`${API_BASE_URL}/api/profile/change-password`, { method: 'POST', body: JSON.stringify(input) });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || 'Failed to change password');
  return json;
}


