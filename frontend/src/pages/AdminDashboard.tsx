import NeoNav from '@/components/design3/NeoNav';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AnimatedList from '@/components/AnimatedList';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() || '';

type Student = { id: string; full_name: string; roll_number: string; email: string; phone?: string; profile_image_url?: string | null };
type Comment = { id: string; content: string; created_at: string };
type StudentProject = { id: string; title: string; status: string; created_at: string; project_type?: string };

const AdminDashboard = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [studentProjects, setStudentProjects] = useState<StudentProject[]>([]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailProject, setDetailProject] = useState<any | null>(null);
  const [moderationOpen, setModerationOpen] = useState(false);
  const [moderationStudent, setModerationStudent] = useState<Student | null>(null);
  
  const { toast } = useToast();

  const adminHeaders = () => {
    const t = localStorage.getItem('adminAccessToken');
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` } as Record<string,string>;
  };

  const loadStudents = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/students`, { headers: adminHeaders() });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to load students');
      setStudents(json);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  // Guard: verify token
  useEffect(() => {
    const verify = async () => {
      const t = localStorage.getItem('adminAccessToken');
      if (!t) {
        window.location.href = '/admin/login';
        return;
      }
      try {
        const res = await fetch(`${API_BASE_URL}/api/admin/me`, { headers: adminHeaders() });
        if (!res.ok) {
          localStorage.removeItem('adminAccessToken');
          window.location.href = '/admin/login';
          return;
        }
        loadStudents();
      } catch (e: any) {
        toast({ title: 'Backend not reachable', description: 'Please start the API server and try again.', variant: 'destructive' });
        localStorage.removeItem('adminAccessToken');
        window.location.href = '/admin/login';
      }
    };
    void verify();
  }, []);

  const updateStudent = async (s: Student) => {
    try {
      const body = { fullName: s.full_name, phone: s.phone };
      const res = await fetch(`${API_BASE_URL}/api/admin/students/${s.id}`, { method: 'PUT', headers: adminHeaders(), body: JSON.stringify(body) });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Update failed');
      toast({ title: 'Student updated' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const deleteProject = async (projectId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/projects/${projectId}`, { method: 'DELETE', headers: adminHeaders() });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Delete failed');
      toast({ title: 'Project deleted' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const deleteStudent = async (studentId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/students/${studentId}`, { method: 'DELETE', headers: adminHeaders() });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Delete failed');
      setStudents(prev => prev.filter(s => s.id !== studentId));
      toast({ title: 'Student deleted' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const resetPassword = async (studentId: string) => {
    const newPassword = prompt('Enter a temporary password (min 8 chars):');
    if (!newPassword || newPassword.length < 8) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/students/${studentId}/reset-password`, { method: 'POST', headers: adminHeaders(), body: JSON.stringify({ newPassword }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Reset failed');
      toast({ title: 'Password reset', description: 'Temporary password set.' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const verifyEmail = async (studentId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/students/${studentId}/verify-email`, { method: 'POST', headers: adminHeaders() });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Verify failed');
      toast({ title: 'Email verified', description: 'Student can now sign in.' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const logout = () => {
    localStorage.removeItem('adminAccessToken');
    window.location.href = '/admin/login';
  };

  const [q, setQ] = useState('');
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return students;
    return students.filter(s =>
      s.full_name.toLowerCase().includes(term) || s.roll_number.toLowerCase().includes(term)
    );
  }, [q, students]);

  const loadComments = async (projectId: string) => {
    setSelectedProjectId(projectId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/projects/${projectId}/comments`, { headers: adminHeaders() });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to load comments');
      setComments(json);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const addComment = async () => {
    if (!selectedProjectId || !newComment.trim()) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/projects/${selectedProjectId}/comments`, { method: 'POST', headers: adminHeaders(), body: JSON.stringify({ content: newComment }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to add comment');
      setNewComment('');
      setComments((c) => [...c, json]);
      toast({ title: 'Comment added' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!selectedProjectId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/projects/${selectedProjectId}/comments/${commentId}`, { method: 'DELETE', headers: adminHeaders() });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to delete comment');
      setComments((c)=>c.filter(x=>x.id !== commentId));
      toast({ title: 'Comment deleted' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const loadStudentProjects = async (studentId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/students/${studentId}/projects`, { headers: adminHeaders() });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to load projects');
      setStudentProjects(json);
      if (json.length > 0) {
        setSelectedProjectId(json[0].id);
        await loadComments(json[0].id);
      } else {
        setComments([]);
        setSelectedProjectId('');
      }
      // Open moderation dialog instead of auto-scroll
      setModerationOpen(true);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const openDetails = async (projectId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/projects/public`);
      const list = await res.json();
      if (!res.ok) throw new Error('Failed to load project');
      const p = (list || []).find((x: any) => x.id === projectId);
      if (!p) throw new Error('Project not found');
      setDetailProject(p);
      setDetailOpen(true);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f6f7fb_0%,#fff_40%,#ffe4b5_100%)]">
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <NeoNav />
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
          <Button variant="destructive" onClick={logout}>Logout</Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">Students</h2>
              <Input placeholder="Search by name or roll number" value={q} onChange={(e)=>setQ(e.target.value)} className="max-w-sm" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {filtered.length === 0 ? (
              <p className="text-muted-foreground">No students found.</p>
            ) : (
              <AnimatedList
                items={filtered.map((s)=> (
                  <div key={s.id} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center border rounded p-3">
                    <div className="flex items-center gap-3 md:col-span-2 min-w-0">
                      {s.profile_image_url ? (
                        <img src={s.profile_image_url} className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-muted" />
                      )}
                      <div>
                        <div className="font-medium">{s.full_name}</div>
                        <div className="text-xs text-muted-foreground">{s.email} • {s.roll_number}</div>
                      </div>
                    </div>
                    <div className="md:col-span-1 min-w-0">
                      <Input className="w-full" value={s.full_name} onChange={(e)=>setStudents(prev => prev.map(p=>p.id===s.id?{...p, full_name:e.target.value}:p))} />
                    </div>
                    <div className="md:col-span-1 min-w-0">
                      <Input className="w-full" value={s.phone ?? ''} onChange={(e)=>setStudents(prev => prev.map(p=>p.id===s.id?{...p, phone:e.target.value}:p))} />
                    </div>
                    <div className="md:col-span-1 flex flex-wrap gap-2 justify-end md:justify-start">
                      <Button size="sm" className="bg-success text-success-foreground hover:bg-success" onClick={()=>updateStudent(s)}>Save</Button>
                      <Button size="sm" variant="destructive" onClick={()=>deleteStudent(s.id)}>Delete</Button>
                      <Button size="sm" variant="secondary" onClick={()=>{ setModerationStudent(s); void loadStudentProjects(s.id); }}>View Projects</Button>
                      <Button size="sm" variant="outline" onClick={()=>resetPassword(s.id)}>Reset Password</Button>
                      <Button size="sm" variant="outline" onClick={()=>verifyEmail(s.id)}>Verify Email</Button>
                    </div>
                  </div>
                ))}
                onItemSelect={(_, idx)=>{/* noop, handled by buttons */}}
                showGradients={true}
                enableArrowNavigation={true}
                displayScrollbar={true}
              />
            )}
          </CardContent>
        </Card>

        {/* Details dialog reusing public project display */}
        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{detailProject?.title || 'Project Details'}</DialogTitle>
            </DialogHeader>
            {detailProject && (
              <div className="space-y-3 text-sm">
                <div className="text-muted-foreground">Status: {detailProject.status}</div>
                {detailProject.projectType || detailProject.project_type ? (
                  <div className="text-muted-foreground">Project Type: {detailProject.projectType || detailProject.project_type}</div>
                ) : null}
                {/* Media preview: show thumbnail if available */}
                {detailProject.imageUrl && (
                  <div>
                    <div className="font-medium mb-1">Thumbnail</div>
                    <div className="w-full rounded-lg overflow-hidden border bg-muted">
                      <img
                        src={detailProject.imageUrl}
                        alt={detailProject.title}
                        className="w-full h-64 object-cover"
                      />
                    </div>
                  </div>
                )}
                {(detailProject.owner?.full_name || detailProject.owner?.roll_number || detailProject.owner?.email || detailProject.owner?.profile_image_url) && (
                  <div className="flex items-center gap-3 p-3 rounded-md bg-muted/40">
                    {detailProject.owner?.profile_image_url ? (
                      <img src={detailProject.owner.profile_image_url} className="h-12 w-12 rounded-full object-cover" />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-muted" />
                    )}
                    <div className="min-w-0">
                      {detailProject.owner?.full_name && <div className="font-medium truncate">{detailProject.owner.full_name}</div>}
                      <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1">
                        {detailProject.owner?.roll_number && <span>Roll: {detailProject.owner.roll_number}</span>}
                        {detailProject.owner?.email && <span>Email: {detailProject.owner.email}</span>}
                      </div>
                    </div>
                  </div>
                )}
                <div>
                  <div className="font-medium mb-1">Description</div>
                  <p className="leading-relaxed whitespace-pre-wrap">{detailProject.description}</p>
                </div>
                {detailProject.requirements ? (
                  <div>
                    <div className="font-medium mb-1">Functional Requirements</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm font-semibold mb-1">Planned</div>
                        {detailProject.requirements.planned.length > 0 ? (
                          <ul className="list-disc pl-5 space-y-1">
                            {detailProject.requirements.planned.map((fr: string, idx: number) => (
                              <li key={`planned-${idx}-${fr}`}>{fr}</li>
                            ))}
                          </ul>
                        ) : (
                          <div className="text-muted-foreground text-sm">None</div>
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-semibold mb-1">Implemented</div>
                        {detailProject.requirements.implemented.length > 0 ? (
                          <ul className="list-disc pl-5 space-y-1">
                            {detailProject.requirements.implemented.map((fr: string, idx: number) => (
                              <li key={`impl-${idx}-${fr}`}>{fr}</li>
                            ))}
                          </ul>
                        ) : (
                          <div className="text-muted-foreground text-sm">None</div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : null}
                <div>
                  <div className="font-medium mb-1">Technologies</div>
                  <div className="flex flex-wrap gap-1">
                    {(detailProject.technologies || []).map((t: string) => (
                      <span key={t} className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs">{t}</span>
                    ))}
                  </div>
                </div>
                {Array.isArray(detailProject.comments) && detailProject.comments.length > 0 && (
                  <div>
                    <div className="font-medium mb-1">Admin Comments</div>
                    <ul className="space-y-2">
                      {detailProject.comments.map((c: any) => (
                        <li key={c.id} className="rounded bg-muted/40 p-2 text-sm">
                          <div className="text-muted-foreground text-xs mb-1">{new Date(c.created_at).toLocaleString()}</div>
                          <div className="whitespace-pre-wrap">{c.content}</div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Moderation dialog */}
        <Dialog open={moderationOpen} onOpenChange={setModerationOpen}>
          <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Project Moderation {moderationStudent ? `— ${moderationStudent.full_name} (${moderationStudent.roll_number})` : ''}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Input placeholder="Project ID" value={selectedProjectId} onChange={(e)=>setSelectedProjectId(e.target.value)} />
                <Button variant="secondary" onClick={()=>loadComments(selectedProjectId)}>Load Comments</Button>
                <Button variant="destructive" onClick={()=>deleteProject(selectedProjectId)}>Delete Project</Button>
              </div>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input placeholder="Write a comment" value={newComment} onChange={(e)=>setNewComment(e.target.value)} />
                  <Button className="bg-success text-success-foreground hover:bg-success" onClick={addComment}>Add</Button>
                </div>
                <div className="space-y-2">
                  {comments.map((c)=> (
                    <div key={c.id} className="flex items-start justify-between gap-2 border rounded p-2">
                      <div>
                        <div className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleString()}</div>
                        <div>{c.content}</div>
                      </div>
                      <Button size="sm" variant="destructive" onClick={()=>deleteComment(c.id)}>Delete</Button>
                    </div>
                  ))}
                </div>
                {studentProjects.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Student Projects</h3>
                    {studentProjects.map(p => (
                      <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 border rounded p-2">
                        <div className="min-w-0">
                          <div className="font-medium truncate max-w-[360px]">{p.title}</div>
                          <div className="text-xs text-muted-foreground">{p.status} • {new Date(p.created_at).toLocaleDateString()} {p.project_type ? `• ${p.project_type}` : ''}</div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="secondary" onClick={()=>openDetails(p.id)}>View Details</Button>
                          <Button variant="secondary" onClick={()=>loadComments(p.id)}>Select</Button>
                          <Button variant="destructive" onClick={()=>deleteProject(p.id)}>Delete</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        
      </main>
    </div>
  );
};

export default AdminDashboard;


