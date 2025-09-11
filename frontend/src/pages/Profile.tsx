import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { TopNav } from '@/components/layout/TopNav';
import { getMyProfile, updateMyProfile, changePassword } from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';

const Profile = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['me'],
    queryFn: getMyProfile,
    enabled: !!token,
  });

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [avatarPath, setAvatarPath] = useState('');

  useEffect(() => {
    if (data) {
      setFullName(data.fullName ?? '');
      setPhone(data.phone ?? '');
      setProfileImageUrl(data.profileImageUrl ?? '');
    }
    if (data?.avatarPath) setAvatarPath(data.avatarPath);
  }, [data]);

  const mut = useMutation({
    mutationFn: () => updateMyProfile({ fullName, phone, profileImageUrl }),
    onSuccess: () => { toast({ title: 'Profile updated' }); qc.invalidateQueries({ queryKey: ['me'] }); },
    onError: (e:any) => toast({ title: 'Update failed', description: e.message, variant: 'destructive' }),
  });

  const passwordMut = useMutation({
    mutationFn: () => changePassword({ currentPassword, newPassword, confirmNewPassword }),
    onSuccess: () => { toast({ title: 'Password changed' }); setCurrentPassword(''); setNewPassword(''); setConfirmNewPassword(''); },
    onError: (e:any) => toast({ title: 'Change password failed', description: e.message, variant: 'destructive' }),
  });

  if (!token) {
    return (
      <div className="min-h-screen bg-background">
        <TopNav showHome={true} showAuth={true} />
        <div className="max-w-3xl mx-auto p-6 text-center">Please sign in</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNav showHome={true} showAuth={false} showLogout={true} />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Card>
          <CardHeader>
            <h3 className="text-xl font-semibold">My Profile</h3>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? <p>Loading...</p> : isError ? <p className="text-destructive">{(error as Error).message}</p> : (
              <>
                <div className="flex items-center gap-4">
                  <img src={profileImageUrl || '/placeholder.svg'} alt="avatar" className="h-16 w-16 rounded-full object-cover border" />
                  <div className="text-sm text-muted-foreground">Signed in as {data.email}</div>
                  <div>
                    <label className="text-sm font-medium">Upload new avatar</label>
                    <input type="file" accept="image/*" onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const accessToken = localStorage.getItem('accessToken');
                        const refreshToken = localStorage.getItem('refreshToken') || undefined;
                        if (accessToken && refreshToken) {
                          await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
                        }
                        const fileExt = (file.name.split('.').pop() || 'jpg').toLowerCase();
                        const userId = data?.id || 'anon';
                        const fileName = `${userId}/${Date.now()}.${fileExt}`;
                        const { data: upload, error: upErr } = await supabase.storage.from('avatars').upload(fileName, file, { cacheControl: '0', upsert: false, contentType: file.type });
                        if (upErr) throw upErr;
                        const { data: pub } = supabase.storage.from('avatars').getPublicUrl(upload.path);
                        const publicUrl = pub.publicUrl;
                        setAvatarPath(upload.path);
                        setProfileImageUrl(publicUrl);
                        await updateMyProfile({ avatarPath: upload.path, profileImageUrl: publicUrl, fullName, phone });
                        await qc.invalidateQueries({ queryKey: ['me'] });
                        toast({ title: 'Avatar updated' });
                      } catch (err: any) {
                        toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
                      }
                    }} />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Full name</label>
                  <Input value={fullName} onChange={e=>setFullName(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium">Phone (03XXXXXXXXX)</label>
                  <Input value={phone} onChange={e=>setPhone(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium">Profile Image URL</label>
                  <Input value={profileImageUrl} onChange={e=>setProfileImageUrl(e.target.value)} />
                </div>
                <Button onClick={()=>mut.mutate()} disabled={mut.isLoading}>Save</Button>
                <div className="h-px bg-border my-4" />
                <h4 className="text-lg font-semibold">Change Password</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-sm font-medium">Current password</label>
                    <Input type="password" value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">New password</label>
                    <Input type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Confirm new password</label>
                    <Input type="password" value={confirmNewPassword} onChange={e=>setConfirmNewPassword(e.target.value)} />
                  </div>
                </div>
                <Button variant="outline" onClick={()=>passwordMut.mutate()} disabled={passwordMut.isLoading}>Update Password</Button>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Profile;


