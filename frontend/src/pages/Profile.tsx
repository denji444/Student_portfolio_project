import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import NeoNav from '@/components/design3/NeoNav';
import { getMyProfile, updateMyProfile, changePassword } from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { Eye, EyeOff } from 'lucide-react';

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
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [avatarPath, setAvatarPath] = useState('');
  const [availableAvatars, setAvailableAvatars] = useState<{ path: string; url: string }[]>([]);

  useEffect(() => {
    if (data) {
      setFullName(data.fullName ?? '');
      setPhone(data.phone ?? '');
      setProfileImageUrl(data.profileImageUrl ?? '');
    }
    if (data?.avatarPath) setAvatarPath(data.avatarPath);
  }, [data]);

  useEffect(() => {
    const loadPresets = async () => {
      try {
        const list = await supabase.storage.from('avatars').list('PPs', { limit: 100 });
        if (list.data) {
          const items = list.data
            .filter((f: any) => !f.name.endsWith('/'))
            .map((f: any) => {
              const path = `PPs/${f.name}`;
              const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path);
              return { path, url: pub.publicUrl };
            });
          setAvailableAvatars(items);
        }
      } catch {
        // ignore errors
      }
    };
    void loadPresets();
  }, []);

  const mut = useMutation({
    mutationFn: () => updateMyProfile({ fullName, phone, profileImageUrl, avatarPath }),
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
      <div className="min-h-screen bg-[linear-gradient(180deg,#f6f7fb_0%,#fff_40%,#ffe4b5_100%)]">
        <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
          <NeoNav />
          <div className="p-6 text-center">Please sign in</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f6f7fb_0%,#fff_40%,#ffe4b5_100%)]">
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <NeoNav />
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
                </div>
                <div>
                  <label className="text-sm font-medium">Choose a profile picture</label>
                  <div className="grid grid-cols-3 gap-3 mt-2">
                    {availableAvatars.map(a => (
                      <button key={a.path} type="button" onClick={()=>{ setAvatarPath(a.path); setProfileImageUrl(a.url); }}
                        className={`h-20 w-20 rounded-full overflow-hidden border ${avatarPath===a.path? 'ring-2 ring-primary' : ''}`}>
                        <img src={a.url} className="h-full w-full object-cover" />
                      </button>
                    ))}
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
                {/* Profile Image URL input removed per requirement */}
                <Button onClick={()=>mut.mutate()} disabled={mut.isLoading}>Save</Button>
                <div className="h-px bg-border my-4" />
                <h4 className="text-lg font-semibold">Change Password</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-sm font-medium">Current password</label>
                  <div className="relative">
                    <Input type={showCurrent ? 'text' : 'password'} value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} className="pr-10" />
                    <button type="button" className="absolute inset-y-0 right-0 px-3 text-muted-foreground" onClick={()=>setShowCurrent(v=>!v)} aria-label={showCurrent ? 'Hide password' : 'Show password'}>
                      {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">New password</label>
                  <div className="relative">
                    <Input type={showNew ? 'text' : 'password'} value={newPassword} onChange={e=>setNewPassword(e.target.value)} className="pr-10" />
                    <button type="button" className="absolute inset-y-0 right-0 px-3 text-muted-foreground" onClick={()=>setShowNew(v=>!v)} aria-label={showNew ? 'Hide password' : 'Show password'}>
                      {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Confirm new password</label>
                  <div className="relative">
                    <Input type={showConfirm ? 'text' : 'password'} value={confirmNewPassword} onChange={e=>setConfirmNewPassword(e.target.value)} className="pr-10" />
                    <button type="button" className="absolute inset-y-0 right-0 px-3 text-muted-foreground" onClick={()=>setShowConfirm(v=>!v)} aria-label={showConfirm ? 'Hide password' : 'Show password'}>
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
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


