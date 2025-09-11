import type { Project } from '@/types/portfolio';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

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
  comments: string[];
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
    projectType: p.projectType ?? p.project_type ?? undefined,
    githubUrl: p.githubUrl ?? p.github_url ?? undefined,
    deploymentUrl: p.deploymentUrl ?? p.deployment_url ?? undefined,
    imageUrl: p.imageUrl ?? p.image_url ?? undefined,
    videoUrl: p.videoUrl ?? p.video_url ?? undefined,
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
    projectType: p.projectType,
    githubUrl: p.githubUrl,
    deploymentUrl: p.deploymentUrl,
    imageUrl: p.imageUrl,
    videoUrl: p.videoUrl,
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
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || 'Signup failed');
  return json;
}

export async function signin(payload: {
  email: string;
  password: string;
}): Promise<{ accessToken: string; refreshToken?: string }>
{
  const res = await fetch(`${API_BASE_URL}/api/auth/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || 'Signin failed');
  return { accessToken: json.accessToken, refreshToken: json.refreshToken };
}

function authHeaders() {
  const token = localStorage.getItem('accessToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function requestWithAuth(input: string, init: RequestInit = {}) {
  const res = await fetch(input, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init.headers || {}), ...authHeaders() },
  });
  if (res.status !== 401) return res;
  // try refresh once
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return res;
  try {
    const refreshRes = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!refreshRes.ok) return res;
    const tokens = await refreshRes.json();
    if (tokens?.accessToken) localStorage.setItem('accessToken', tokens.accessToken);
    if (tokens?.refreshToken) localStorage.setItem('refreshToken', tokens.refreshToken);
    // retry original
    return fetch(input, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init.headers || {}), ...authHeaders() },
    });
  } catch {
    return res;
  }
}

export async function getMyProjects() {
  const res = await requestWithAuth(`${API_BASE_URL}/api/projects`, { method: 'GET' });
  if (!res.ok) throw new Error('Failed to load your projects');
  return res.json();
}

export async function createProject(input: {
  title: string; description: string; technologies: string[];
  projectType?: string; githubUrl?: string; deploymentUrl?: string; imageUrl?: string; videoUrl?: string; status?: 'completed'|'in-progress'|'planned';
}) {
  const res = await requestWithAuth(`${API_BASE_URL}/api/projects`, { method: 'POST', body: JSON.stringify(input) });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || 'Failed to create project');
  return json;
}

export async function updateProject(id: string, input: Partial<{
  title: string; description: string; technologies: string[];
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


