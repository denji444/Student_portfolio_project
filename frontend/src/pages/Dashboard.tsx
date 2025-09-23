import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import NeoNav from '@/components/design3/NeoNav';
import { getMyProjects, createProject, updateProject, deleteProject } from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

const emptyForm = { title:'', description:'', technologies:'', functionalRequirements: [] as string[], functionalRequirementDraft: '', projectType:'', githubUrl:'', deploymentUrl:'', imageUrl:'', status:'planned' as const };

const Dashboard = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const token = 'cookie';
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploadingThumb, setUploadingThumb] = useState(false);
  // Thumbnail uploads are proxied via backend; no direct Supabase session needed here.

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['my-projects'],
    queryFn: getMyProjects,
    enabled: !!token,
  });

  const createMut = useMutation({
    mutationFn: () => createProject({
      title: form.title,
      description: form.description,
      technologies: form.technologies.split(',').map(s=>s.trim()).filter(Boolean),
      functionalRequirements: form.functionalRequirements.filter((s)=>s.trim().length>0),
      projectType: form.projectType || undefined,
      githubUrl: form.githubUrl || undefined,
      deploymentUrl: form.deploymentUrl || undefined,
      imageUrl: form.imageUrl || undefined,
      status: form.status,
    }),
    onSuccess: () => { setForm(emptyForm); qc.invalidateQueries({ queryKey: ['my-projects'] }); toast({ title: 'Project created' }); },
    onError: (e:any) => toast({ title: 'Create failed', description: e.message, variant: 'destructive' }),
  });

  const updateMut = useMutation({
    mutationFn: () => updateProject(editingId!, {
      title: form.title,
      description: form.description,
      technologies: form.technologies.split(',').map(s=>s.trim()).filter(Boolean),
      functionalRequirements: form.functionalRequirements.filter((s)=>s.trim().length>0),
      projectType: form.projectType || undefined,
      githubUrl: form.githubUrl || undefined,
      deploymentUrl: form.deploymentUrl || undefined,
      imageUrl: form.imageUrl || undefined,
      status: form.status,
    }),
    onSuccess: () => { setEditingId(null); setForm(emptyForm); qc.invalidateQueries({ queryKey: ['my-projects'] }); toast({ title: 'Project updated' }); },
    onError: (e:any) => toast({ title: 'Update failed', description: e.message, variant: 'destructive' }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteProject(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-projects'] }); toast({ title: 'Project deleted' }); },
    onError: (e:any) => toast({ title: 'Delete failed', description: e.message, variant: 'destructive' }),
  });

  const startEdit = (p:any) => {
    setEditingId(p.id);
    setForm({
      title: p.title,
      description: p.description,
      technologies: (p.technologies ?? []).join(', '),
      functionalRequirements: Array.isArray(p.functional_requirements) ? p.functional_requirements : (p.functionalRequirements || []),
      functionalRequirementDraft: '',
      githubUrl: p.github_url ?? p.githubUrl ?? '',
      deploymentUrl: p.deployment_url ?? p.deploymentUrl ?? '',
      projectType: p.project_type ?? p.projectType ?? '',
      imageUrl: p.image_url ?? p.imageUrl ?? '',
      status: p.status ?? 'planned',
    });
  };

  if (!data && !isLoading) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#f6f7fb_0%,#fff_40%,#ffe4b5_100%)]">
        <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
          <NeoNav />
          <div className="max-w-3xl mx-auto p-6 text-center">
          <h2 className="text-2xl font-semibold mb-2">Please sign in</h2>
          <p className="text-muted-foreground">You must sign in to access your dashboard.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f6f7fb_0%,#fff_40%,#ffe4b5_100%)]">
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <NeoNav />
        <Card>
          <CardHeader>
            <h3 className="text-xl font-semibold">{editingId ? 'Edit Project' : 'Add New Project'}</h3>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input placeholder="Name your project" value={form.title} onChange={e=>setForm({...form, title:e.target.value})} />
            </div>
            <div>
              <label className="text-sm font-medium">Thumbnail (optional)</label>
              <div className="flex items-center gap-3 mt-2">
                <div className="h-20 w-32 rounded-md overflow-hidden bg-muted border">
                  {form.imageUrl ? (
                    <img src={form.imageUrl} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full grid place-items-center text-[11px] text-muted-foreground">Preview</div>
                  )}
                </div>
                <div className="space-y-1">
                  <Input type="file" accept="image/*" disabled={uploadingThumb}
                    onChange={async (e)=>{
                      const inputEl = e.target as HTMLInputElement;
                      const file = inputEl.files?.[0];
                      if (!file) return;
                      setUploadingThumb(true);
                      try {
                        const fd = new FormData();
                        fd.append('file', file);
                        const res = await fetch('/api/projects/upload-thumbnail', {
                          method: 'POST',
                          body: fd,
                          credentials: 'include',
                        });
                        const json = await res.json();
                        if (!res.ok) throw new Error(json?.error || 'Upload failed');
                        setForm({ ...form, imageUrl: json.url });
                        toast({ title: 'Thumbnail uploaded' });
                      } catch (err:any) {
                        toast({ title: 'Upload failed', description: err.message || 'Could not upload thumbnail', variant: 'destructive' });
                      } finally {
                        setUploadingThumb(false);
                        // clear input to allow re-upload same file name
                        if (inputEl) inputEl.value = '' as any;
                      }
                    }} />
                  <div className="text-xs text-muted-foreground">Stored in Supabase and shown on home cards. Not used for profile picture.</div>
                </div>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <textarea placeholder="Tell us more about your project" className="border rounded-md px-3 py-2 w-full min-h-[100px]" value={form.description} onChange={e=>setForm({...form, description:e.target.value})} />
            </div>
            <div>
              <label className="text-sm font-medium">Technologies (comma separated)</label>
              <Input placeholder="React, Java, Python, etc." value={form.technologies} onChange={e=>setForm({...form, technologies:e.target.value})} />
            </div>
            <div>
              <label className="text-sm font-medium">Functional Requirements</label>
              <div className="space-y-2 mt-2">
                <div className="flex gap-2">
                  <Input placeholder="Add a functional requirement" value={form.functionalRequirementDraft} onChange={(e)=>setForm({...form, functionalRequirementDraft:e.target.value})} onKeyDown={(e)=>{
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const v = form.functionalRequirementDraft.trim();
                      if (!v) return;
                      setForm({...form, functionalRequirements: [...form.functionalRequirements, v], functionalRequirementDraft: ''});
                    }
                  }} />
                  <Button type="button" onClick={()=>{
                    const v = form.functionalRequirementDraft.trim();
                    if (!v) return;
                    setForm({...form, functionalRequirements: [...form.functionalRequirements, v], functionalRequirementDraft: ''});
                  }}>Add</Button>
                </div>
                {form.functionalRequirements.length > 0 && (
                  <div className="space-y-2">
                    {form.functionalRequirements.map((fr, idx) => (
                      <div key={`${fr}-${idx}`} className="flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <Input value={fr} onChange={(e)=>{
                            const copy = [...form.functionalRequirements];
                            copy[idx] = e.target.value;
                            setForm({...form, functionalRequirements: copy});
                          }} />
                        </div>
                        <Button variant="destructive" type="button" onClick={()=>{
                          setForm({...form, functionalRequirements: form.functionalRequirements.filter((_, i)=>i!==idx)});
                        }}>Remove</Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-xs text-muted-foreground">Press Enter or click Add to append. You can edit or remove items.</div>
            </div>
            <div>
              <label className="text-sm font-medium">Project Type</label>
              <Input placeholder="e.g., Web Development, Game Development" value={form.projectType} onChange={e=>setForm({...form, projectType:e.target.value})} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">GitHub URL</label>
                <Input placeholder="https://github.com/your_project" value={form.githubUrl} onChange={e=>setForm({...form, githubUrl:e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium">Deployment URL</label>
                <Input placeholder="https://your_project_url" value={form.deploymentUrl} onChange={e=>setForm({...form, deploymentUrl:e.target.value})} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Status</label>
              <select className="border rounded-md h-10 px-3 w-full" value={form.status} onChange={e=>setForm({...form, status:e.target.value as any})}>
                <option value="planned">Planned</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div className="flex gap-2">
              {editingId ? (
                <>
                  <Button onClick={()=>updateMut.mutate()} disabled={updateMut.isLoading}>Save</Button>
                  <Button variant="outline" onClick={()=>{ setEditingId(null); setForm(emptyForm); }}>Cancel</Button>
                </>
              ) : (
                <Button onClick={()=>createMut.mutate()} disabled={createMut.isLoading}>Create</Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-xl font-semibold">My Projects</h3>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>Loading...</p>
            ) : isError ? (
              <p className="text-destructive">{(error as Error).message}</p>
            ) : (!data || data.length === 0) ? (
              <p className="text-muted-foreground">No projects yet. Create your first above.</p>
            ) : (
              <div className="space-y-3">
                {data.map((p:any)=> (
                  <div key={p.id} className="border rounded-md p-3 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium truncate">{p.title}</h4>
                        <Badge variant="secondary">{p.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{p.description}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {(p.technologies ?? []).map((t:string)=> (
                          <Badge key={t} variant="outline">{t}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex-shrink-0 flex gap-2">
                      <Button variant="outline" onClick={()=>startEdit(p)}>Edit</Button>
                      <Button variant="destructive" onClick={()=>deleteMut.mutate(p.id)}>Delete</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;


